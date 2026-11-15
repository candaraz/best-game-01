// A room: one parsed level grid plus everything alive in it. The room owns
// the tiles, the zones, the objects, Pip, the timer, the hearts and the
// score, and resolves every interaction between them: transfers, pushes,
// switches and doors, cracked floors, hazards and the exit.

import {
  TILE, COLS, ROWS, HEARTS_PER_ROOM, ORB_SCORE, NO_DAMAGE_BONUS,
  TIME_BONUS_PER_SECOND, TRANSFER,
} from './config.js';
import { LEVELS } from './levels.js';
import { makePlayer, resetPlayer, updatePlayer, transferTarget } from './player.js';
import {
  makeCrate, makeBoulder, makeGolem, makeMine, makeSwitch,
  updateObjects, switchPressed, canStealFrom, canGiveTo, isPushable,
} from './objects.js';
import { overlaps, centre, bodyHitsSolid } from './physics.js';

export function parseLevel(index) {
  const def = LEVELS[index];
  const tiles = [];
  const zones = [];
  const objects = [];
  const switches = [];
  let spawn = { col: 1, row: 13 };
  let exit = null;
  const orbs = [];
  for (let row = 0; row < ROWS; row++) {
    tiles.push([]);
    zones.push([]);
    for (let col = 0; col < COLS; col++) {
      const ch = def.grid[row][col];
      let tile = '.';
      let zone = '.';
      if (ch === '#') tile = '#';
      else if (ch === 'C') tile = 'C';
      else if (ch === 'A') tile = ch; // the only door type; 'B' is the boulder, not a door
      else if (ch === 'a' || ch === 'b') switches.push(makeSwitch(ch, col, row));
      else if (ch === 'o') orbs.push({ x: col * TILE + 11, y: row * TILE + 11, w: 18, h: 18, taken: false, phase: col * 0.7 + row });
      else if (ch === 'P') spawn = { col, row };
      else if (ch === 'X') exit = { x: col * TILE + 2, y: row * TILE + TILE - 64, w: 36, h: 64 };
      else if (ch === 'K') objects.push(makeCrate(col, row));
      else if (ch === 'B') objects.push(makeBoulder(col, row));
      else if (ch === 'G') objects.push(makeGolem(col, row));
      else if (ch === 'M') objects.push(makeMine(col, row));
      else if (ch === '^' || ch === '<' || ch === '>') zone = ch;
      tiles[row].push(tile);
      zones[row].push(zone);
    }
  }
  return { def, tiles, zones, objects, switches, spawn, exit, orbs };
}

export function createRoom(index, fx, audio) {
  const room = {
    index,
    ...parseLevel(index),
    player: null,
    openDoors: new Set(),
    doorOpen: {}, // door id -> 0..1 slide amount
    crackTimers: new Map(), // "col,row" -> seconds under weight-3 load
    broken: new Set(), // cracked tiles already smashed
    time: 0,
    hearts: HEARTS_PER_ROOM,
    deaths: 0,
    orbsTaken: 0,
    orbTotal: 0,
    score: 0,
    completed: false,
    completeTimer: 0,
    failedFlash: 0,
    target: null,
    fx, audio,
  };
  room.player = makePlayer(room.spawn.col, room.spawn.row);
  room.orbTotal = room.orbs.length;
  room.onPlayerLand = (speed, col, row) => onPlayerLand(room, speed, col, row);
  return room;
}

function onPlayerLand(room, speed, col, row) {
  // A hard landing at gauge 3 smashes the cracked tile underfoot.
  if (room.player.gauge >= TRANSFER.smashWeight && speed >= TRANSFER.smashFallSpeed) {
    smashCracked(room, col, row);
  }
}

function smashCracked(room, col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  if (room.tiles[row][col] !== 'C') return;
  room.tiles[row][col] = '.';
  room.broken.add(`${col},${row}`);
  room.crackTimers.delete(`${col},${row}`);
  room.fx.burst(col * TILE + 20, row * TILE + 20, { count: 22, color: '#3a3f6b', speed: 220, size: 4, life: 0.8, gravity: 500 });
  room.fx.burst(col * TILE + 20, row * TILE + 20, { count: 8, color: '#9aa3d0', speed: 140, size: 3, life: 0.6, gravity: 300 });
  room.fx.shake(0.55);
  room.fx.freeze(0.06);
  room.audio.smash();
}

function onObjectLand(room, obj, speed, col, row) {
  // A heavy object dropped hard smashes cracked floors.
  if (obj.weight >= TRANSFER.smashWeight && speed >= TRANSFER.smashFallSpeed) {
    smashCracked(room, col, row);
    smashCracked(room, col - 1, row);
    smashCracked(room, col + 1, row);
  }
}

// Push the player out of pushable bodies, shoving them along. A body that
// cannot move (wall behind it) stops the player at its face instead of
// letting the player sink inside it.
function resolvePushes(room) {
  const p = room.player;
  for (const obj of room.objects) {
    if (!isPushable(obj) || !overlaps(p, obj)) continue;
    const overlapLeft = (p.x + p.w) - obj.x;
    const overlapRight = (obj.x + obj.w) - p.x;
    const overlapUp = (p.y + p.h) - obj.y;
    const overlapDown = (obj.y + obj.h) - p.y;
    const minX = Math.min(overlapLeft, overlapRight);
    const minY = Math.min(overlapUp, overlapDown);
    if (minX < minY) {
      // Side push: try to move the object; if a wall stops it, stop Pip.
      const dir = overlapLeft < overlapRight ? 1 : -1;
      const push = minX + 0.5;
      const oldX = obj.x;
      obj.x += dir * push;
      if (bodyHitsSolid(obj, room.tiles, room.openDoors)) {
        obj.x = oldX;
        obj.vx = 0;
        p.x -= dir * (minX + 0.5);
        p.vx = 0;
      } else {
        obj.vx = dir * Math.max(Math.abs(p.vx), 60);
        p.x -= dir * 0.5;
      }
    } else if (overlapUp < overlapDown) {
      // Player lands on the object: ride it.
      p.y = obj.y - p.h - 0.01;
      if (p.vy > 0) p.vy = 0;
      p.grounded = true;
      p.vx += obj.vx * 0.4;
    } else if (obj.vy > 60 && p.grounded) {
      // A falling object lands on Pip: slide Pip out to the nearer side.
      if (overlapLeft < overlapRight) p.x = obj.x - p.w - 0.5;
      else p.x = obj.x + obj.w + 0.5;
    } else {
      // Pip jumped up into the object's underside: bonk.
      p.y = obj.y + obj.h + 0.01;
      if (p.vy < 0) p.vy = 0;
    }
  }
}

function doTransfer(room, kind) {
  const p = room.player;
  if (p.transferCooldown > 0) return;
  const target = room.target;
  if (!target) return;
  if (kind === 'steal') {
    if (p.gauge >= 3 || !canStealFrom(target)) return;
    target.weight -= 1;
    p.gauge += 1;
    p.transferCooldown = TRANSFER.cooldown;
    p.gaugePop = 1;
    const a = centre(target);
    const b = centre(p);
    room.fx.burst(a.x, a.y, { count: 10, color: '#ffd75e', speed: 120, size: 3, life: 0.5, gravity: 0, glow: true });
    room.fx.burst(b.x, b.y, { count: 6, color: '#ffd75e', speed: 80, size: 2, life: 0.4, gravity: 0, glow: true });
    room.audio.steal();
    if (target.kind === 'golem' && target.weight <= 0) {
      target.alive = false;
      room.fx.ring(a.x, a.y, '#ff5d5d');
      room.fx.burst(a.x, a.y, { count: 20, color: '#7d86a8', speed: 200, size: 4, life: 0.7, gravity: 400 });
      room.fx.floatText(a.x, a.y - 20, 'POP!', '#ff8a8a');
      room.fx.shake(0.3);
      room.audio.pop();
    }
  } else {
    if (p.gauge <= 0 || !canGiveTo(target)) return;
    target.weight += 1;
    p.gauge -= 1;
    p.transferCooldown = TRANSFER.cooldown;
    p.gaugePop = 1;
    const a = centre(p);
    const b = centre(target);
    room.fx.burst(b.x, b.y, { count: 10, color: '#7ef0c8', speed: 120, size: 3, life: 0.5, gravity: 0, glow: true });
    room.fx.burst(a.x, a.y, { count: 6, color: '#7ef0c8', speed: 80, size: 2, life: 0.4, gravity: 0, glow: true });
    room.audio.give();
    if (target.kind === 'mine' && target.weight >= 1 && !target.safe) {
      target.safe = true;
      room.fx.burst(b.x, b.y, { count: 16, color: '#9aa3d0', speed: 90, size: 3, life: 0.8, gravity: -40 });
      room.fx.floatText(b.x, b.y - 20, 'FIZZLED', '#7ef0c8');
      room.audio.fizzle();
    }
  }
}

function hurtPlayer(room, cause) {
  const p = room.player;
  if (p.invulnerable > 0 || room.completed) return;
  room.hearts -= 1;
  room.deaths += 1;
  room.fx.shake(0.7);
  room.fx.freeze(0.08);
  room.fx.burst(centre(p).x, centre(p).y, { count: 18, color: '#ff5d5d', speed: 200, size: 3, life: 0.7, gravity: 300 });
  room.audio.hurt();
  if (room.hearts <= 0) {
    // Full reset: hearts, orbs and timer start over.
    room.failedFlash = 1.4;
    resetRoomState(room, true);
  } else {
    resetRoomState(room, false);
  }
  room.fx.floatText(centre(room.player).x, room.player.y - 14, cause, '#ff8a8a');
}

export function resetRoomState(room, full) {
  const keptOrbs = full ? 0 : room.orbsTaken;
  const keptScore = full ? 0 : room.score;
  const keptTime = full ? 0 : room.time;
  const fresh = parseLevel(room.index);
  room.tiles = fresh.tiles;
  room.zones = fresh.zones;
  room.objects = fresh.objects;
  room.switches = fresh.switches;
  room.orbs = fresh.orbs;
  room.exit = fresh.exit;
  room.openDoors = new Set();
  room.doorOpen = {};
  room.crackTimers = new Map();
  room.broken = new Set();
  resetPlayer(room.player, room.spawn.col, room.spawn.row);
  room.player.invulnerable = 1.2;
  if (full) {
    room.hearts = HEARTS_PER_ROOM;
    room.deaths = 0;
  }
  room.orbsTaken = keptOrbs;
  room.score = keptScore;
  room.time = keptTime;
  // Orbs already taken stay taken on a soft reset.
  for (let i = 0; i < keptOrbs && i < room.orbs.length; i++) room.orbs[i].taken = true;
  room.completed = false;
  room.completeTimer = 0;
}

export function retryRoom(room) {
  room.hearts = HEARTS_PER_ROOM;
  room.deaths = 0;
  resetRoomState(room, true);
}

// Every cracked tile directly under a body's full footprint.
function crackedUnder(room, body) {
  const row = Math.floor((body.y + body.h + 2) / TILE);
  if (row < 0 || row >= ROWS) return [];
  const leftCol = Math.floor((body.x + 2) / TILE);
  const rightCol = Math.floor((body.x + body.w - 2) / TILE);
  const out = [];
  for (let col = leftCol; col <= rightCol; col++) {
    if (col >= 0 && col < COLS && room.tiles[row][col] === 'C') out.push([col, row]);
  }
  return out;
}

// Sustained weight-3 load creaks cracked tiles, then breaks them.
function loadCracks(room, body, dt) {
  for (const [col, row] of crackedUnder(room, body)) {
    const key = `${col},${row}`;
    const t = (room.crackTimers.get(key) || 0) + dt;
    room.crackTimers.set(key, t);
    if (t > 0.6) smashCracked(room, col, row);
  }
}

export function updateRoom(room, input, dt) {
  const p = room.player;
  if (room.completed) {
    room.completeTimer += dt;
    return;
  }
  room.time += dt;
  room.failedFlash = Math.max(0, room.failedFlash - dt);

  updatePlayer(p, input, dt, room, room.fx, room.audio);
  updateObjects(room.objects, dt, room.tiles, room.openDoors, (obj, speed, col, row) => onObjectLand(room, obj, speed, col, row));
  resolvePushes(room);

  // Sustained weight-3 load creaks cracked tiles, then breaks them.
  for (const obj of room.objects) {
    if (isPushable(obj) && obj.weight >= TRANSFER.smashWeight && obj.grounded) {
      loadCracks(room, obj, dt);
    }
  }
  if (p.gauge >= TRANSFER.smashWeight && p.grounded) loadCracks(room, p, dt);

  // Switches and doors.
  const pressedIds = new Set();
  for (const sw of room.switches) {
    const was = sw.pressed;
    sw.pressed = switchPressed(sw, room.objects, p);
    if (sw.pressed) pressedIds.add(sw.id);
    if (sw.pressed && !was) room.audio.door();
  }
  room.openDoors = pressedIds;
  for (const id of ['a', 'b']) {
    const target = pressedIds.has(id) ? 1 : 0;
    room.doorOpen[id] = (room.doorOpen[id] || 0) + (target - (room.doorOpen[id] || 0)) * Math.min(1, dt * 6);
  }

  // Transfers.
  room.target = transferTarget(p, room.objects);
  if (input.stealPressed) doTransfer(room, 'steal');
  if (input.givePressed) doTransfer(room, 'give');

  // Orbs.
  for (const orb of room.orbs) {
    if (!orb.taken && overlaps(p, orb)) {
      orb.taken = true;
      room.orbsTaken += 1;
      room.score += ORB_SCORE;
      room.fx.ring(orb.x + 9, orb.y + 9, '#ffd75e');
      room.fx.floatText(orb.x + 9, orb.y - 6, `+${ORB_SCORE}`, '#ffd75e');
      room.audio.orb();
    }
  }

  // Hazards.
  for (const obj of room.objects) {
    if (obj.kind === 'golem' && obj.alive && overlaps(p, obj)) hurtPlayer(room, 'OUCH!');
    if (obj.kind === 'mine' && !obj.safe && overlaps(p, obj)) hurtPlayer(room, 'BOOM!');
  }
  if (p.y > 610) hurtPlayer(room, 'FELL!');

  // Exit.
  if (room.exit && overlaps(p, room.exit)) {
    room.completed = true;
    room.completeTimer = 0;
    const timeBonus = Math.max(0, Math.floor((room.def.par - room.time) * TIME_BONUS_PER_SECOND));
    const noDamage = room.deaths === 0 ? NO_DAMAGE_BONUS : 0;
    room.score += timeBonus + noDamage;
    room.stars = 1 + (room.orbsTaken >= room.orbTotal ? 1 : 0) + (room.time <= room.def.par && room.deaths === 0 ? 1 : 0);
    room.timeBonus = timeBonus;
    room.noDamageBonus = noDamage;
    room.fx.ring(centre(p).x, centre(p).y, '#7ef0c8');
    room.audio.win();
  }
}
