import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import AuthPage from './pages/AuthPage';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

function Guard({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={role ? '/admin/login' : '/login'} />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <nav className="flex flex-wrap items-center gap-5 border-b border-stone-800 px-6 py-4">
        <Link to="/" className="mr-auto text-2xl font-bold text-amber-400">CineBook</Link>
        <Link to="/">Movies</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <Link to="/profile">{user.name}</Link>
            <button onClick={logout} className="text-stone-400 hover:text-white">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/admin/login" className="text-stone-500">Admin</Link>
          </>
        )}
      </nav>
      <main className="mx-auto max-w-6xl p-6">
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/admin/login" element={<AuthPage mode="login" admin />} />
          <Route path="/admin/register" element={<AuthPage mode="register" admin />} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
        </Routes>
      </main>
    </>
  );
}
