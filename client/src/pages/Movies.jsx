import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { input, Poster } from '../ui';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api.get('/movies', { params: { search: q } }).then((r) => setMovies(r.data)), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <input className={input + ' mb-6 max-w-md'} placeholder="Search by title, genre or language" value={q} onChange={(e) => setQ(e.target.value)} />
      {!movies.length && <p className="text-stone-400">No movies found. Try a different search.</p>}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {movies.map((m) => (
          <Link key={m._id} to={'/movie/' + m._id}>
            <Poster movie={m} />
            <h3 className="mt-2 text-lg">{m.title}</h3>
            <p className="text-sm text-stone-400">{m.genre} · {m.language}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
