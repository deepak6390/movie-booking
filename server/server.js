import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Movie, Show, Booking } from './models.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cors());
app.use(express.json());

// helpers
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ message: e.message }));
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: 'Please login' }); }
};
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admin only' }));
const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// ---------- AUTH ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password, adminCode } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
  if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
  if (adminCode && adminCode !== process.env.ADMIN_CODE) return res.status(400).json({ message: 'Wrong admin code' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: adminCode ? 'admin' : 'user' });
  res.json({ token: sign(u), user: safe(u) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: req.body.email });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password)))
    return res.status(400).json({ message: 'Invalid email or password' });
  res.json({ token: sign(u), user: safe(u) });
}));

// ---------- MOVIES ----------
app.get('/api/movies', wrap(async (req, res) => {
  const s = (req.query.search || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const q = s ? { $or: ['title', 'genre', 'language'].map((f) => ({ [f]: new RegExp(s, 'i') })) } : {};
  res.json(await Movie.find(q).sort('-createdAt'));
}));
app.get('/api/movies/:id', wrap(async (req, res) => res.json(await Movie.findById(req.params.id))));
app.post('/api/movies', auth, admin, wrap(async (req, res) => res.json(await Movie.create(req.body))));
app.put('/api/movies/:id', auth, admin, wrap(async (req, res) =>
  res.json(await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true }))));
app.delete('/api/movies/:id', auth, admin, wrap(async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  await Show.deleteMany({ movie: req.params.id });
  res.json({ ok: true });
}));

// ---------- SHOWS ----------
app.get('/api/shows', wrap(async (req, res) =>
  res.json(await Show.find(req.query.movie ? { movie: req.query.movie } : {}).populate('movie', 'title').sort('date time'))));
app.post('/api/shows', auth, admin, wrap(async (req, res) => res.json(await Show.create(req.body))));
app.delete('/api/shows/:id', auth, admin, wrap(async (req, res) => {
  await Show.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ---------- BOOKINGS ----------
const full = { path: 'show', populate: { path: 'movie', select: 'title' } };

app.post('/api/bookings', auth, wrap(async (req, res) => {
  const { showId, seats } = req.body;
  if (!seats?.length) return res.status(400).json({ message: 'Select at least one seat' });
  // atomic: succeeds only if none of the seats are already booked
  const show = await Show.findOneAndUpdate(
    { _id: showId, bookedSeats: { $nin: seats } },
    { $push: { bookedSeats: { $each: seats } } }, { new: true });
  if (!show) return res.status(400).json({ message: 'Some seats were just booked. Pick others.' });
  res.json(await Booking.create({ user: req.user.id, show: showId, seats, total: seats.length * show.price }));
}));

app.get('/api/bookings/me', auth, wrap(async (req, res) =>
  res.json(await Booking.find({ user: req.user.id }).populate(full).sort('-createdAt'))));
app.get('/api/bookings', auth, admin, wrap(async (req, res) =>
  res.json(await Booking.find().populate('user', 'name email').populate(full).sort('-createdAt'))));

app.put('/api/bookings/:id/cancel', auth, wrap(async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b || (req.user.role !== 'admin' && String(b.user) !== req.user.id))
    return res.status(404).json({ message: 'Booking not found' });
  if (b.status !== 'cancelled') {
    b.status = 'cancelled';
    await b.save();
    await Show.findByIdAndUpdate(b.show, { $pullAll: { bookedSeats: b.seats } });
  }
  res.json(b);
}));

// ---------- USERS & STATS (admin) ----------
app.get('/api/users', auth, admin, wrap(async (req, res) =>
  res.json(await User.find().select('-password').sort('-createdAt'))));
app.delete('/api/users/:id', auth, admin, wrap(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
app.get('/api/stats', auth, admin, wrap(async (req, res) => {
  const [movies, users, shows, ok] = await Promise.all([
    Movie.countDocuments(), User.countDocuments(), Show.countDocuments(), Booking.find({ status: 'confirmed' })]);
  res.json({ movies, users, shows, bookings: ok.length, revenue: ok.reduce((s, b) => s + b.total, 0) });
}));

// ---------- START ----------
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected');
  if (!(await Movie.countDocuments())) {
    await Movie.insertMany([
      { title: 'Midnight Express', genre: 'Thriller', language: 'English', duration: 128, description: 'A night train, a stolen ledger and one passenger who knows too much.' },
      { title: 'Jaipur Diaries', genre: 'Drama', language: 'Hindi', duration: 142, description: 'Three generations of a family return home for a wedding that changes everything.' },
      { title: 'Laugh Riot', genre: 'Comedy', language: 'Hindi', duration: 115, description: 'A failing stand-up club, one big night, and a lot of things going wrong.' }]);
    console.log('Sample movies added');
  }
  app.listen(process.env.PORT || 5000, () => console.log('Server running on port ' + (process.env.PORT || 5000)));
}).catch((e) => console.error('DB connection failed:', e.message));
