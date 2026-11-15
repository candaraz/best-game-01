// Best scores in localStorage: per-room best stars, best time and best
// score, plus the furthest room reached. Guarded — private-mode storage
// failures must never break the game.

const KEY = 'ballast-bests-v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { rooms: {}, furthest: 0, finished: false };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { rooms: {}, furthest: 0, finished: false };
    data.rooms = data.rooms || {};
    return data;
  } catch {
    return { rooms: {}, furthest: 0, finished: false };
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: bests simply do not persist.
  }
}

export function getBests() {
  return load();
}

export function recordRoom(index, stars, time, score) {
  const data = load();
  const prev = data.rooms[index] || { stars: 0, time: null, score: 0 };
  data.rooms[index] = {
    stars: Math.max(prev.stars, stars),
    time: prev.time === null ? time : Math.min(prev.time, time),
    score: Math.max(prev.score, score),
  };
  data.furthest = Math.max(data.furthest || 0, index + 1);
  if (index >= 7) data.finished = true;
  save(data);
  return data;
}

export function totalStars() {
  const data = load();
  return Object.values(data.rooms).reduce((sum, r) => sum + (r.stars || 0), 0);
}
