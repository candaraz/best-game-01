// A tiny seeded generator (mulberry32) so ambient details, screenshot scenes and
// scripted playthroughs are exactly reproducible from a seed.

/** A bare mulberry32 function: mulberry32(seed) returns () => float in [0, 1).
 *  Handy where a drop-in replacement for Math.random is wanted. */
export function mulberry32(seed) {
  const rng = createRandom(seed);
  return () => rng.next();
}

export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    /** A float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** A float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** An integer in [min, max]. */
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    /** One of the given items. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
  };
}
