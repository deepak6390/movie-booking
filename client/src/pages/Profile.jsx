import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { btn2 } from '../ui';

export default function Profile() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const load = () => api.get('/bookings/me').then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { await api.put(`/bookings/${id}/cancel`); load(); };

  return (
    <>
      <h1 className="text-3xl">{user.name}</h1>
      <p className="mb-8 text-stone-400">{user.email}</p>
      <h2 className="mb-3 text-2xl">My bookings</h2>
      {!list.length && <p className="text-stone-400">No bookings yet. Pick a movie and grab seats.</p>}
      <div className="space-y-3">
        {list.map((b) => (
          <div key={b._id} className="flex items-center justify-between rounded border border-stone-800 p-4">
            <div>
              <p className="text-lg">{b.show?.movie?.title}</p>
              <p className="text-sm text-stone-400">{b.show?.date} · {b.show?.time} · {b.show?.screen}</p>
              <p className="text-sm">Seats {b.seats.join(', ')} · ₹{b.total}</p>
            </div>
            {b.status === 'confirmed'
              ? <button className={btn2} onClick={() => cancel(b._id)}>Cancel booking</button>
              : <span className="text-red-400">Cancelled</span>}
          </div>
        ))}
      </div>
    </>
  );
}
