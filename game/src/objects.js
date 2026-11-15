// Room objects: everything Pip can steal weight from or give weight to,
// plus the switches their weight holds down. Weight is the whole physics:
// weight 0 floats to the ceiling, weight 3 presses switches and breaks
// cracked floors. Golems pop at weight 0; mines fizzle safe at weight 1+.

import { TILE, TRANSFER } from './config.js';
import { moveBody, overlaps } from './physics.js';

const GRAVITY = { 0: 0, 1: 2400, 2: 2800, 3: 3200 };
const RISE_SPEED = 80; // px/s a weightless object floats upward: clears head height in under half a second

export function makeCrate(col, row) {
  return { kind: 'crate', x: col * TILE + 2, y: row * TILE + 4, w: 36, h: 36, vx: 0, vy: 0, weight: 1, grounded: false, wobble: 0 };
}

export function makeBoulder(col, row) {
  return { kind: 'boulder', x: col * TILE + 2, y: row * TILE + 4, w: 36, h: 36, vx: 0, vy: 0, weight: 2, grounded: false, roll: 0 };
}

export function makeGolem(col, row) {
  return { kind: 'golem', x: col * TILE + 3, y: row * TILE + 4, w: 34, h: 36, vx: -55, vy: 0, weight: 1, grounded: false, alive: true, step: Math.random() * 10 };
}

export function makeMine(col, row) {
  return { kind: 'mine', x: col * TILE + 5, y: row * TILE + 8, w: 30, h: 30, vx: 0, vy: 0, weight: 0, safe: false, bob: Math.random() * 10 };
}

export function makeSwitch(id, col, row) {
  return { kind: 'switch', id, x: col * TILE + 2, y: row * TILE + TILE - 10, w: 36, h: 10, pressed: false };
}

export function isPushable(obj) {
  return obj.kind === 'crate' || obj.kind === 'boulder';
}

export function canStealFrom(obj) {
  if (obj.kind === 'mine') return false;
  if (obj.kind === 'golem' && !obj.alive) return false;
  return obj.weight > 0;
}

export function canGiveTo(obj) {
  if (obj.kind === 'golem' && !obj.alive) return false;
  if (obj.kind === 'mine' && obj.safe) return false;
  return obj.weight < 3;
}

// One simulation step for a pushable body (crate / boulder).
function stepPushable(obj, dt, tiles, openDoors, onLand) {
  if (obj.weight === 0) {
    obj.vy = Math.max(obj.vy - 900 * dt, -RISE_SPEED);
    obj.vx *= Math.max(0, 1 - 4 * dt);
  } else {
    obj.vy = Math.min(obj.vy + GRAVITY[obj.weight] * dt, 700);
    if (obj.grounded) obj.vx *= Math.max(0, 1 - 8 * dt);
    else obj.vx *= Math.max(0, 1 - 0.4 * dt);
  }
  const hit = moveBody(obj, dt, tiles, openDoors, onLand);
  obj.grounded = hit.down;
  if (hit.up) obj.vy = 0;
  if (obj.kind === 'boulder') obj.roll += (obj.vx / 18) * dt;
  // The room floor holds objects even where the grid is open (pits).
  if (obj.y + obj.h > 600) {
    if (onLand && obj.vy > 0) onLand(obj.vy, Math.floor((obj.x + obj.w / 2) / TILE), 15);
    obj.y = 600 - obj.h;
    obj.vy = 0;
    obj.grounded = true;
  }
}

function stepGolem(obj, dt, tiles, openDoors) {
  obj.vy = Math.min(obj.vy + 2400 * dt, 700);
  const before = obj.x;
  const hit = moveBody(obj, dt, tiles, openDoors, null);
  obj.grounded = hit.down;
  // Turn at walls, and at ledges (no floor ahead below).
  const aheadX = obj.vx > 0 ? obj.x + obj.w + 4 : obj.x - 4;
  const belowRow = Math.floor((obj.y + obj.h + 6) / TILE);
  const aheadCol = Math.floor(aheadX / TILE);
  const floorAhead = belowRow >= 15 || ['#', 'C', 'A', 'B'].includes(
    (tiles[belowRow] && tiles[belowRow][aheadCol]) || '.',
  );
  if (hit.left || hit.right || (obj.grounded && !floorAhead)) obj.vx = -obj.vx;
  if (obj.x === before && obj.grounded) obj.vx = -obj.vx || 55;
  obj.step += dt * Math.abs(obj.vx) * 0.06;
}

export function updateObjects(objects, dt, tiles, openDoors, onLand) {
  for (const obj of objects) {
    if (obj.kind === 'golem') {
      if (obj.alive) stepGolem(obj, dt, tiles, openDoors);
    } else if (isPushable(obj)) {
      stepPushable(obj, dt, tiles, openDoors, (speed, col, row) => onLand && onLand(obj, speed, col, row));
    } else if (obj.kind === 'mine') {
      obj.bob += dt;
    }
  }
}

// A switch is held down by a heavy object resting on it, or by Pip at gauge 3.
export function switchPressed(sw, objects, player) {
  for (const obj of objects) {
    if (isPushable(obj) && obj.weight >= TRANSFER.switchWeight && obj.grounded && overlaps(sw, obj)) return true;
  }
  if (player && player.gauge >= TRANSFER.smashWeight) {
    const feet = { x: player.x + 4, y: player.y + player.h - 4, w: player.w - 8, h: 6 };
    if (overlaps(sw, feet) && player.grounded) return true;
  }
  return false;
}

function drawWeightPips(ctx, obj) {
  const cx = obj.x + obj.w / 2;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < obj.weight ? '#ffd75e' : 'rgba(244,241,222,0.22)';
    ctx.beginPath();
    ctx.arc(cx - 12 + i * 12, obj.y - 7, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrate(ctx, obj, time) {
  const floatLift = obj.weight === 0 ? Math.sin(time * 2 + obj.x) * 2 : 0;
  const y = obj.y + floatLift;
  ctx.fillStyle = '#a9804f';
  ctx.fillRect(obj.x, y, 36, 36);
  ctx.fillStyle = '#8a6a3e';
  ctx.fillRect(obj.x, y, 36, 5);
  ctx.fillRect(obj.x, y + 31, 36, 5);
  ctx.fillRect(obj.x, y, 5, 36);
  ctx.fillRect(obj.x + 31, y, 5, 36);
  ctx.strokeStyle = '#6d5433';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(obj.x + 6, y + 6);
  ctx.lineTo(obj.x + 30, y + 30);
  ctx.moveTo(obj.x + 30, y + 6);
  ctx.lineTo(obj.x + 6, y + 30);
  ctx.stroke();
  if (obj.weight === 0) {
    ctx.fillStyle = 'rgba(143, 216, 255, 0.25)';
    ctx.fillRect(obj.x - 2, y - 2, 40, 40);
  }
  drawWeightPips(ctx, { ...obj, y });
}

function drawBoulder(ctx, obj) {
  ctx.save();
  ctx.translate(obj.x + 18, obj.y + 18);
  ctx.rotate(obj.roll);
  ctx.fillStyle = '#7d86a8';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#646d8f';
  ctx.beginPath();
  ctx.arc(-6, -6, 6, 0, Math.PI * 2);
  ctx.arc(7, 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#565e7d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawWeightPips(ctx, obj);
}

function drawGolem(ctx, obj, time) {
  if (!obj.alive) return;
  const bob = Math.sin(obj.step * 6) * 1.5;
  const facing = obj.vx >= 0 ? 1 : -1;
  ctx.fillStyle = '#7d86a8';
  ctx.fillRect(obj.x + 4, obj.y + 10 + bob, 26, 26);
  ctx.fillStyle = '#646d8f';
  ctx.fillRect(obj.x + 8, obj.y + 2 + bob, 18, 12);
  ctx.fillStyle = '#ff5d5d';
  const corePulse = 3 + Math.sin(time * 5) * 1;
  ctx.beginPath();
  ctx.arc(obj.x + 17, obj.y + 23 + bob, corePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4f1de';
  ctx.fillRect(obj.x + (facing > 0 ? 20 : 8), obj.y + 6 + bob, 6, 4);
  ctx.fillStyle = '#565e7d';
  ctx.fillRect(obj.x + 2, obj.y + 14 + bob, 4, 14);
  ctx.fillRect(obj.x + 28, obj.y + 14 + bob, 4, 14);
  drawWeightPips(ctx, { ...obj, y: obj.y + bob });
}

function drawMine(ctx, obj, time) {
  const bobY = Math.sin(obj.bob * 2) * 2;
  const cx = obj.x + 15;
  const cy = obj.y + 15 + bobY;
  if (obj.safe) {
    ctx.fillStyle = '#3a3f5e';
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#565e7d';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const pulse = 0.6 + Math.sin(time * 4 + obj.bob) * 0.4;
  ctx.fillStyle = `rgba(255, 77, 77, ${0.25 + pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 20 + pulse * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9cfe8';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + obj.bob * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11);
    ctx.lineTo(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17);
    ctx.stroke();
  }
  ctx.fillStyle = '#2c3160';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(cx, cy, 4 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawObjects(ctx, objects, time) {
  for (const obj of objects) {
    if (obj.kind === 'crate') drawCrate(ctx, obj, time);
    else if (obj.kind === 'boulder') drawBoulder(ctx, obj);
    else if (obj.kind === 'golem') drawGolem(ctx, obj, time);
    else if (obj.kind === 'mine') drawMine(ctx, obj, time);
  }
}

export function drawSwitch(ctx, sw) {
  ctx.fillStyle = sw.pressed ? '#7ef0c8' : '#565e7d';
  const sink = sw.pressed ? 3 : 0;
  ctx.fillRect(sw.x, sw.y + sink, sw.w, 10 - sink);
  ctx.fillStyle = sw.pressed ? '#2f8f68' : '#3a3f5e';
  ctx.fillRect(sw.x + 4, sw.y + 2 + sink, sw.w - 8, 4);
}
