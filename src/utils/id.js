// Lightweight unique id generator (avoids adding a nanoid dependency).
export function nanoid() {
  return 'n_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
