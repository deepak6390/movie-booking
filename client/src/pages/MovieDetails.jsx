import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { err } from '../api';
import { useAuth } from '../auth';
import { btn, Poster } from '../ui';

const rows = 'ABCDE'.split('');
const cols = [1, 2, 3, 4, 5, 6, 7, 8];

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [show, setShow] = useState(null);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState('');

  const loadShows = () => api.get('/shows', { params: { movie: id } }).then((r) => {
    setShows(r.data);
    setShow((s) => (s ? r.data.find((x) => x._id === s._id) : null));
  });
  useEffect(() => { api.get('/movies/' + id).then((r) => setMovie(r.data)); loadShows(); }, [id]);

  const toggle = (s) => setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s]);

  const book = async () => {
    if (!user) return nav('/login');
    try {
      await api.post('/bookings', { showId: show._id, seats: picked });
      nav('/profile');
    } catch (x) { setError(err(x)); setPicked([]); loadShows(); }
  };

  if (!movie) return <p>Loading...</p>;
  return (
    <>
      <div className="grid gap-8 md:grid-cols-3">
        <Poster movie={movie} className="h-96" />
        <div className="md:col-span-2">
          <h1 className="text-4xl">{movie.title}</h1>
          <p className="mt-2 text-stone-400">{movie.genre} · {movie.language} · {movie.duration} min</p>
          <p className="mt-4 max-w-prose">{movie.description}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-2xl">Showtimes</h2>
      {!shows.length && <p className="text-stone-400">No shows scheduled yet.</p>}
      <div className="flex flex-wrap gap-3">
        {shows.map((s) => (
          <button key={s._id} onClick={() => { setShow(s); setPicked([]); setError(''); }}
            className={`rounded border px-4 py-2 ${show?._id === s._id ? 'border-amber-400 bg-amber-400 text-stone-950' : 'border-stone-600'}`}>
            {s.date} · {s.time}<br /><span className="text-sm">{s.screen} · ₹{s.price}</span>
          </button>
        ))}
      </div>

      {show && (
        <div className="mt-8">
          <div className="mx-auto mb-6 max-w-md rounded bg-stone-700 py-1 text-center text-sm">Screen this way</div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r} className="flex justify-center gap-2">
                {cols.map((c) => {
                  const s = r + c;
                  const taken = show.bookedSeats.includes(s);
                  return (
                    <button key={s} disabled={taken} onClick={() => toggle(s)}
                      className={`h-9 w-9 rounded text-xs ${taken ? 'bg-stone-800 text-stone-600' : picked.includes(s) ? 'bg-amber-400 text-stone-950' : 'border border-stone-500 hover:bg-stone-800'}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {error && <p className="mt-4 text-center text-red-400">{error}</p>}
          <div className="mt-6 text-center">
            <p className="mb-3">{picked.length ? `Seats ${picked.join(', ')} · ₹${picked.length * show.price}` : 'Pick your seats'}</p>
            <button className={btn} disabled={!picked.length} onClick={book}>{user ? 'Book tickets' : 'Login to book'}</button>
          </div>
        </div>
      )}
    </>
  );
}
