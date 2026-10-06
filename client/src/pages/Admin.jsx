import { useEffect, useState } from 'react';
import api, { err } from '../api';
import { useAuth } from '../auth';
import { input, btn, btn2 } from '../ui';

const useLoad = (url) => {
  const [d, setD] = useState([]);
  const load = () => api.get(url).then((r) => setD(r.data));
  useEffect(() => { load(); }, [url]);
  return [d, load];
};
const th = 'p-2 text-left text-stone-400';
const td = 'p-2 border-t border-stone-800';

function Dashboard() {
  const [s] = useLoad('/stats');
  const items = [['Movies', s.movies], ['Shows', s.shows], ['Users', s.users], ['Bookings', s.bookings], ['Revenue', '₹' + (s.revenue ?? 0)]];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {items.map(([k, v]) => (
        <div key={k} className="rounded border border-stone-800 p-4">
          <p className="text-3xl text-amber-400">{v ?? 0}</p><p className="text-stone-400">{k}</p>
        </div>
      ))}
    </div>
  );
}

const blank = { title: '', genre: '', language: '', duration: '', poster: '', description: '' };
function ManageMovies() {
  const [list, load] = useLoad('/movies');
  const [f, setF] = useState(blank);
  const [editId, setEditId] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    editId ? await api.put('/movies/' + editId, f) : await api.post('/movies', f);
    setF(blank); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Delete this movie and its shows?')) { await api.delete('/movies/' + id); load(); } };
  return (
    <>
      <form onSubmit={save} className="mb-6 grid gap-3 md:grid-cols-3">
        <input className={input} placeholder="Title" value={f.title} onChange={set('title')} required />
        <input className={input} placeholder="Genre" value={f.genre} onChange={set('genre')} required />
        <input className={input} placeholder="Language" value={f.language} onChange={set('language')} required />
        <input className={input} type="number" placeholder="Duration (min)" value={f.duration} onChange={set('duration')} required />
        <input className={input + ' md:col-span-2'} placeholder="Poster image URL (optional)" value={f.poster} onChange={set('poster')} />
        <textarea className={input + ' md:col-span-3'} placeholder="Description" value={f.description} onChange={set('description')} />
        <div className="flex gap-2">
          <button className={btn}>{editId ? 'Save changes' : 'Add movie'}</button>
          {editId && <button type="button" className={btn2} onClick={() => { setF(blank); setEditId(null); }}>Cancel</button>}
        </div>
      </form>
      <table className="w-full"><thead><tr><th className={th}>Title</th><th className={th}>Genre</th><th className={th}>Language</th><th className={th}></th></tr></thead>
        <tbody>{list.map((m) => (
          <tr key={m._id}><td className={td}>{m.title}</td><td className={td}>{m.genre}</td><td className={td}>{m.language}</td>
            <td className={td + ' space-x-2 text-right'}>
              <button className={btn2} onClick={() => { setEditId(m._id); setF({ ...blank, ...m }); window.scrollTo(0, 0); }}>Edit</button>
              <button className={btn2} onClick={() => del(m._id)}>Delete</button></td></tr>))}
        </tbody></table>
    </>
  );
}

function ManageShows() {
  const [shows, load] = useLoad('/shows');
  const [movies] = useLoad('/movies');
  const [f, setF] = useState({ movie: '', date: '', time: '', screen: 'Screen 1', price: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); await api.post('/shows', f); setF({ ...f, date: '', time: '' }); load(); };
  const del = async (id) => { await api.delete('/shows/' + id); load(); };
  return (
    <>
      <form onSubmit={save} className="mb-6 grid gap-3 md:grid-cols-5">
        <select className={input} value={f.movie} onChange={set('movie')} required>
          <option value="">Select movie</option>
          {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
        </select>
        <input className={input} type="date" value={f.date} onChange={set('date')} required />
        <input className={input} type="time" value={f.time} onChange={set('time')} required />
        <input className={input} placeholder="Screen" value={f.screen} onChange={set('screen')} required />
        <input className={input} type="number" placeholder="Price (₹)" value={f.price} onChange={set('price')} required />
        <button className={btn}>Add show</button>
      </form>
      <table className="w-full"><thead><tr><th className={th}>Movie</th><th className={th}>Date</th><th className={th}>Time</th><th className={th}>Screen</th><th className={th}>Price</th><th className={th}></th></tr></thead>
        <tbody>{shows.map((s) => (
          <tr key={s._id}><td className={td}>{s.movie?.title}</td><td className={td}>{s.date}</td><td className={td}>{s.time}</td><td className={td}>{s.screen}</td><td className={td}>₹{s.price}</td>
            <td className={td + ' text-right'}><button className={btn2} onClick={() => del(s._id)}>Delete</button></td></tr>))}
        </tbody></table>
    </>
  );
}

function ManageBookings() {
  const [list, load] = useLoad('/bookings');
  const cancel = async (id) => { await api.put(`/bookings/${id}/cancel`); load(); };
  return (
    <table className="w-full"><thead><tr><th className={th}>User</th><th className={th}>Movie</th><th className={th}>Show</th><th className={th}>Seats</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}></th></tr></thead>
      <tbody>{list.map((b) => (
        <tr key={b._id}><td className={td}>{b.user?.name}</td><td className={td}>{b.show?.movie?.title}</td><td className={td}>{b.show?.date} {b.show?.time}</td>
          <td className={td}>{b.seats.join(', ')}</td><td className={td}>₹{b.total}</td><td className={td}>{b.status}</td>
          <td className={td + ' text-right'}>{b.status === 'confirmed' && <button className={btn2} onClick={() => cancel(b._id)}>Cancel</button>}</td></tr>))}
      </tbody></table>
  );
}

function ManageUsers() {
  const { user } = useAuth();
  const [list, load] = useLoad('/users');
  const del = async (id) => { if (confirm('Delete this user?')) { await api.delete('/users/' + id); load(); } };
  return (
    <table className="w-full"><thead><tr><th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}></th></tr></thead>
      <tbody>{list.map((u) => (
        <tr key={u._id}><td className={td}>{u.name}</td><td className={td}>{u.email}</td><td className={td}>{u.role}</td>
          <td className={td + ' text-right'}>{u._id !== user.id && <button className={btn2} onClick={() => del(u._id)}>Delete</button>}</td></tr>))}
      </tbody></table>
  );
}

const tabs = { Dashboard, Movies: ManageMovies, Shows: ManageShows, Bookings: ManageBookings, Users: ManageUsers };
export default function Admin() {
  const [tab, setTab] = useState('Dashboard');
  const Tab = tabs[tab];
  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.keys(tabs).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded px-4 py-2 ${tab === t ? 'bg-amber-400 text-stone-950' : 'border border-stone-700'}`}>{t}</button>
        ))}
      </div>
      <Tab />
    </>
  );
}
