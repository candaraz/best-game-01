// Tile physics: axis-separated AABB movement against the room grid, so a
// body never tunnels through a wall and never snags on a floor edge.
// Doors count as solid while closed; cracked tiles count until broken.

import { TILE, COLS, ROWS } from './config.js';

export function tileAt(tiles, col, row) {
  if (col < 0 || col >= COLS) return '#'; // side walls are always solid
  if (row < 0) return '#'; // the sky has a ceiling
  if (row >= ROWS) return '.'; // below the room is open: falling out
  return tiles[row][col];
}

export function isSolid(tiles, col, row, openDoors) {
  const t = tileAt(tiles, col, row);
  if (t === '#' || t === 'C') return true;
  if (t === 'A' || t === 'B') return !openDoors.has(t.toLowerCase());
  return false;
}

// Move a body (x, y, w, h, vx, vy) one step, resolving X then Y against
// solid tiles. Returns collision flags; mutates the body's position and
// zeroes the velocity component that hit. `onLand` fires with the impact
// speed when the body lands on a floor.
export function moveBody(body, dt, tiles, openDoors, onLand) {
  const hit = { left: false, right: false, up: false, down: false };
  const prevVy = body.vy;

  body.x += body.vx * dt;
  if (body.vx !== 0) {
    const dir = Math.sign(body.vx);
    const edge = dir > 0 ? body.x + body.w : body.x;
    const col = Math.floor(edge / TILE);
    const topRow = Math.floor((body.y + 1) / TILE);
    const bottomRow = Math.floor((body.y + body.h - 1) / TILE);
    for (let row = topRow; row <= bottomRow; row++) {
      if (isSolid(tiles, col, row, openDoors)) {
        body.x = dir > 0 ? col * TILE - body.w - 0.01 : (col + 1) * TILE + 0.01;
        body.vx = 0;
        if (dir > 0) hit.right = true; else hit.left = true;
        break;
      }
    }
  }

  body.y += body.vy * dt;
  if (body.vy !== 0) {
    const dir = Math.sign(body.vy);
    const edge = dir > 0 ? body.y + body.h : body.y;
    const prevEdge = dir > 0 ? (body.y - body.vy * dt) + body.h : body.y - body.vy * dt;
    const row = Math.floor(edge / TILE);
    // Landing gets a 2px tolerance on each side: a body falling with its
    // edge just kissing a tile still lands on it, instead of slipping off
    // a ledge it visibly reached. (2px, because the wall clamp itself
    // holds a body 0.01px off the face.) Head bonks use a NARROWED span:
    // a head corner merely clipping a platform's underside must not
    // cancel the whole jump — only a solid hit under the middle bonks.
    const pad = dir > 0 ? 2 : 5;
    const leftCol = dir > 0
      ? Math.floor((body.x + 1 - pad) / TILE)
      : Math.floor((body.x + pad) / TILE);
    const rightCol = dir > 0
      ? Math.floor((body.x + body.w - 1 + pad) / TILE)
      : Math.floor((body.x + body.w - pad) / TILE);
    for (let col = leftCol; col <= rightCol; col++) {
      if (isSolid(tiles, col, row, openDoors)) {
        // Crossing check: only collide when the body entered this tile's
        // row from outside it. Without this, a body falling alongside a
        // platform face — feet already inside the platform's row band —
        // would snap UP onto the platform it never cleared. A shallow
        // (under 8px) overlap still resolves, for rounding forgiveness.
        const tileTop = row * TILE;
        const tileBottom = (row + 1) * TILE;
        if (dir > 0 && prevEdge > tileTop + 2 && edge - tileTop >= 8) continue;
        if (dir < 0 && prevEdge < tileBottom - 2 && tileBottom - edge >= 8) continue;
        if (dir > 0) {
          body.y = row * TILE - body.h - 0.01;
          hit.down = true;
          if (onLand) onLand(prevVy, col, row);
        } else {
          body.y = (row + 1) * TILE + 0.01;
          hit.up = true;
        }
        body.vy = 0;
        break;
      }
    }
  }
  return hit;
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// True when any tile overlapped by the body's AABB is solid — used to test
// a pushed object against the walls before committing to the push.
export function bodyHitsSolid(body, tiles, openDoors) {
  const leftCol = Math.floor((body.x + 1) / TILE);
  const rightCol = Math.floor((body.x + body.w - 1) / TILE);
  const topRow = Math.floor((body.y + 1) / TILE);
  const bottomRow = Math.floor((body.y + body.h - 1) / TILE);
  for (let row = topRow; row <= bottomRow; row++) {
    for (let col = leftCol; col <= rightCol; col++) {
      if (isSolid(tiles, col, row, openDoors)) return true;
    }
  }
  return false;
}

// The zone cell (updraft / gale) under a point, or null.
export function zoneAt(zones, x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  const z = zones[row][col];
  return z === '.' ? null : z;
}

export function centre(body) {
  return { x: body.x + body.w / 2, y: body.y + body.h / 2 };
}
