import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { err } from '../api';
import { useAuth } from '../auth';
import { input, btn } from '../ui';

export default function AuthPage({ mode, admin }) {
  const [f, setF] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const reg = mode === 'register';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const base = admin ? '/admin' : '';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/' + mode, f);
      if (admin && data.user.role !== 'admin') return setError('This account is not an admin account');
      login(data);
      nav(data.user.role === 'admin' ? '/admin' : '/');
    } catch (x) { setError(err(x)); }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4">
      <h1 className="text-3xl">{admin ? 'Admin ' : ''}{reg ? 'Create account' : 'Login'}</h1>
      {error && <p className="rounded bg-red-950 p-2 text-red-300">{error}</p>}
      {reg && <input className={input} placeholder="Full name" value={f.name} onChange={set('name')} required />}
      <input className={input} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input className={input} type="password" placeholder="Password" value={f.password} onChange={set('password')} required />
      {reg && admin && <input className={input} placeholder="Admin code" value={f.adminCode} onChange={set('adminCode')} required />}
      <button className={btn + ' w-full'}>{reg ? 'Register' : 'Login'}</button>
      <p className="text-stone-400">
        {reg ? 'Already registered? ' : 'New here? '}
        <Link className="text-amber-400" to={base + (reg ? '/login' : '/register')}>{reg ? 'Login' : 'Create an account'}</Link>
      </p>
    </form>
  );
}
