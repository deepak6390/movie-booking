export const input = 'w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-400';
export const btn = 'rounded bg-amber-400 px-4 py-2 font-semibold text-stone-950 hover:bg-amber-300 disabled:opacity-40';
export const btn2 = 'rounded border border-stone-600 px-3 py-1 text-sm hover:bg-stone-800';

export const Poster = ({ movie, className = 'h-64' }) =>
  movie.poster
    ? <img src={movie.poster} alt={movie.title} className={`${className} w-full rounded object-cover`} />
    : <div className={`${className} flex w-full items-center justify-center rounded bg-gradient-to-br from-red-900 to-stone-800 p-3 text-center text-xl`}>{movie.title}</div>;
