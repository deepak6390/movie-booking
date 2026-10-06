import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });

export const User = model('User', new Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, default: 'user' }
}, { timestamps: true }));

export const Movie = model('Movie', new Schema({
  title: String, description: String, genre: String, language: String,
  duration: Number, poster: String
}, { timestamps: true }));

export const Show = model('Show', new Schema({
  movie: ref('Movie'), date: String, time: String, screen: String,
  price: Number, bookedSeats: [String]
}, { timestamps: true }));

export const Booking = model('Booking', new Schema({
  user: ref('User'), show: ref('Show'), seats: [String], total: Number,
  status: { type: String, default: 'confirmed' }
}, { timestamps: true }));
