// The simulation: movement, weight transfer, hazards, switches, gates,
// doors, combo and scoring. Presentation lives in juice.js/render.js and
// never feeds back into this file — juice cannot change an outcome.

import { PHYSICS, WEIGHT } from './config.js';
import { LEVELS } from './levels.js';

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function center(e) {
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function createWorld(levelIndex, seals) {
  const level = LEVELS[levelIndex];
  const has = (id) => seals.has(id);
  const maxHearts = WEIGHT.heartsPerRoom + (has('heart') ? 1 : 0);
  const world = {
    level,
    levelIndex,
    seals,
    time: 0,
    roomTime: 0,
    player: {
      x: level.spawn[0], y: level.spawn[1],
      w: PHYSICS.playerW, h: PHYSICS.playerH,
      vx: 0, vy: 0, gauge: level.startGauge,
      hearts: maxHearts, maxHearts,
      facing: 1, onGround: false, coyote: 0, buffer: 0,
      invuln: 0, squashX: 1, squashY: 1, jumpHeldPrev: false,
      skinUsed: false, inUpdraft: false, inGale: 0,
    },
    crates: level.crates.map((c) => ({
      x: c.x, y: c.y, w: 36, h: 36, vx: 0, vy: 0, weight: c.weight,
      home: { x: c.x, y: c.y, weight: c.weight }, flash: 0, onGround: false,
    })),
    boulders: level.boulders.map((b) => ({
      x: b.x, y: b.y, w: 40, h: 40, vy: 0, weight: b.weight,
      home: { x: b.x, y: b.y, weight: b.weight }, flash: 0, onGround: false,
      breakTimer: 0,
    })),
    golems: level.golems.map((g) => ({
      x: g.x, y: g.y, w: 52, h: 56, dir: 1, weight: 1,
      minX: g.minX, maxX: g.maxX, alive: true, alert: 0, flash: 0,
      home: { x: g.x, y: g.y },
    })),
    mines: level.mines.map((m, i) => ({
      x: m.x, y: m.y, w: 30, h: 30, baseY: m.y, weight: 1, armed: true,
      phase: i * 1.7, near: 0, flash: 0,
      home: { x: m.x, y: m.y },
    })),
    orbs: level.orbs.map(([x, y], i) => ({ x: x - 9, y: y - 9, w: 18, h: 18, taken: false, phase: i * 2.1 })),
    switches: level.switches.map((s) => ({ x: s.x, y: s.y, w: 44, h: 10, id: s.id, latched: false, pressed: false })),
    gates: level.gates.map((g) => ({ x: g.x, y: g.y, w: g.w, h: g.h, condition: g.condition, open: false, openAnim: 0 })),
    cracked: level.cracked.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h, id: c.id, broken: false })),
    doorOpen: false,
    roomScore: 0,
    combo: 0,
    comboTimer: 0,
    cleared: false,
    failed: false,
    failCause: '',
    clearBonus: 0,
    timeBonus: 0,
    stats: { transfers: 0, pops: 0, disarms: 0, smashes: 0, orbsTaken: 0, bestCombo: 0 },
    events: [],
    stealTarget: null,
    giveTarget: null,
  };
  updateDoor(world);
  return world;
}

function solidRects(world) {
  const rects = world.level.solids.map(([x, y, w, h]) => ({ x, y, w, h }));
  for (const c of world.cracked) if (!c.broken) rects.push(c);
  for (const g of world.gates) if (!g.open) rects.push(g);
  return rects;
}

function stealRange(world) {
  return world.seals.has('tether') ? WEIGHT.longTetherRange : WEIGHT.stealRange;
}

function comboWindow(world) {
  return world.seals.has('hands') ? WEIGHT.quickHandsWindow : WEIGHT.comboWindow;
}

function scoreEvent(world, base, x, y, kind) {
  world.combo = Math.min(world.combo + 1, WEIGHT.comboCap);
  world.comboTimer = comboWindow(world);
  world.stats.bestCombo = Math.max(world.stats.bestCombo, world.combo);
  const gained = base * Math.max(1, world.combo);
  world.roomScore += gained;
  world.events.push({ type: 'score', kind, x, y, gained, combo: world.combo });
}

export function nearestStealTarget(world) {
  const p = world.player;
  if (p.gauge >= WEIGHT.maxGauge) return null;
  const pc = center(p);
  const range = stealRange(world);
  let best = null;
  let bestD = range;
  const consider = (obj, kind) => {
    const d = dist(pc, center(obj));
    if (d <= bestD) { bestD = d; best = { kind, obj }; }
  };
  for (const g of world.golems) if (g.alive && g.weight > 0) consider(g, 'golem');
  for (const m of world.mines) if (m.armed && m.weight > 0) consider(m, 'mine');
  for (const c of world.crates) if (c.weight > 0) consider(c, 'crate');
  for (const b of world.boulders) if (b.weight > 0) consider(b, 'boulder');
  return best;
}

export function nearestGiveTarget(world) {
  const p = world.player;
  if (p.gauge <= 0) return null;
  const pc = center(p);
  const range = stealRange(world);
  let best = null;
  let bestD = range;
  const consider = (obj, kind) => {
    const d = dist(pc, center(obj));
    if (d <= bestD) { bestD = d; best = { kind, obj }; }
  };
  for (const c of world.crates) if (c.weight < 2) consider(c, 'crate');
  for (const b of world.boulders) if (b.weight < 2) consider(b, 'boulder');
  return best;
}

function doSteal(world) {
  const target = nearestStealTarget(world);
  if (!target) return;
  const p = world.player;
  const tc = center(target.obj);
  p.gauge += 1;
  target.obj.weight -= 1;
  target.obj.flash = 0.25;
  world.stats.transfers += 1;
  world.events.push({ type: 'steal', x: p.x + p.w / 2, y: p.y + p.h / 2, tx: tc.x, ty: tc.y });
  if (target.kind === 'golem' && target.obj.weight <= 0) {
    target.obj.alive = false;
    world.stats.pops += 1;
    scoreEvent(world, WEIGHT.golemPopScore, tc.x, tc.y, 'pop');
    world.events.push({ type: 'pop', x: tc.x, y: tc.y });
  } else if (target.kind === 'mine' && target.obj.weight <= 0) {
    target.obj.armed = false;
    world.stats.disarms += 1;
    scoreEvent(world, WEIGHT.mineDisarmScore, tc.x, tc.y, 'disarm');
    world.events.push({ type: 'disarm', x: tc.x, y: tc.y });
  }
  updateDoor(world);
}

function doGive(world) {
  const target = nearestGiveTarget(world);
  if (!target) return;
  const p = world.player;
  const tc = center(target.obj);
  p.gauge -= 1;
  target.obj.weight += 1;
  target.obj.flash = 0.25;
  world.stats.transfers += 1;
  world.events.push({ type: 'give', x: p.x + p.w / 2, y: p.y + p.h / 2, tx: tc.x, ty: tc.y });
  updateDoor(world);
}

function breakCracked(world, slab, byPlayer) {
  if (slab.broken) return;
  slab.broken = true;
  world.stats.smashes += 1;
  const cx = slab.x + slab.w / 2;
  const cy = slab.y + slab.h / 2;
  scoreEvent(world, WEIGHT.smashScore, cx, cy, 'smash');
  world.events.push({ type: 'smash', x: cx, y: cy, byPlayer });
  if (world.seals.has('echo')) {
    for (const g of world.golems) {
      if (g.alive && dist({ x: cx, y: cy }, center(g)) <= 130) {
        g.alive = false;
        world.stats.pops += 1;
        scoreEvent(world, WEIGHT.golemPopScore, g.x + 26, g.y + 28, 'pop');
        world.events.push({ type: 'pop', x: g.x + 26, y: g.y + 28 });
      }
    }
    for (const m of world.mines) {
      if (m.armed && dist({ x: cx, y: cy }, center(m)) <= 130) {
        m.armed = false;
        world.stats.disarms += 1;
        scoreEvent(world, WEIGHT.mineDisarmScore, m.x + 15, m.y + 15, 'disarm');
        world.events.push({ type: 'disarm', x: m.x + 15, y: m.y + 15 });
      }
    }
  }
  updateDoor(world);
}

function updateDoor(world) {
  const lock = world.level.doorLock;
  const need = new Set(lock === 'none' ? [] : lock.split('+'));
  let open = true;
  if (need.has('golems')) open = open && world.golems.every((g) => !g.alive);
  if (need.has('mines')) open = open && world.mines.every((m) => !m.armed);
  if (need.has('switch')) open = open && world.switches.every((s) => s.latched);
  if (need.has('slab')) open = open && world.cracked.some((c) => c.broken);
  const was = world.doorOpen;
  world.doorOpen = open;
  if (open && !was) world.events.push({ type: 'doorOpen', x: world.level.door[0] + 22, y: world.level.door[1] + 32 });
}

export function doorRequirements(world) {
  const lock = world.level.doorLock;
  const need = new Set(lock === 'none' ? [] : lock.split('+'));
  const reqs = [];
  if (need.has('golems')) {
    const left = world.golems.filter((g) => g.alive).length;
    reqs.push({ label: `Pop golems ${world.golems.length - left}/${world.golems.length}`, done: left === 0 });
  }
  if (need.has('mines')) {
    const left = world.mines.filter((m) => m.armed).length;
    reqs.push({ label: `Disarm mines ${world.mines.length - left}/${world.mines.length}`, done: left === 0 });
  }
  if (need.has('switch')) {
    reqs.push({ label: 'Press the plate', done: world.switches.every((s) => s.latched) });
  }
  if (need.has('slab')) {
    reqs.push({ label: 'Break the cracked floor', done: world.cracked.some((c) => c.broken) });
  }
  if (reqs.length === 0) reqs.push({ label: 'Reach the door', done: false });
  return reqs;
}

function hurtPlayer(world, cause) {
  const p = world.player;
  if (p.invuln > 0 || world.cleared || world.failed) return;
  if (world.seals.has('skin') && !p.skinUsed) {
    p.skinUsed = true;
    p.invuln = WEIGHT.invulnTime;
    world.events.push({ type: 'skin', x: p.x + p.w / 2, y: p.y + p.h / 2 });
    return;
  }
  p.hearts -= 1;
  world.combo = 0;
  world.comboTimer = 0;
  world.events.push({ type: 'hurt', x: p.x + p.w / 2, y: p.y + p.h / 2, cause });
  if (p.hearts <= 0) {
    world.failed = true;
    world.failCause = cause;
    world.events.push({ type: 'fail', cause });
    return;
  }
  // Respawn: keep progress (orbs, latches, breaks, pops, disarms), restore
  // everything else to its home so the room is always re-solvable.
  p.x = world.level.spawn[0];
  p.y = world.level.spawn[1];
  p.vx = 0;
  p.vy = 0;
  p.gauge = world.level.startGauge;
  p.invuln = WEIGHT.invulnTime;
  for (const c of world.crates) { c.x = c.home.x; c.y = c.home.y; c.vx = 0; c.vy = 0; c.weight = c.home.weight; }
  for (const b of world.boulders) { b.x = b.home.x; b.y = b.home.y; b.vy = 0; b.weight = b.home.weight; b.breakTimer = 0; }
  for (const g of world.golems) if (g.alive) { g.x = g.home.x; g.y = g.home.y; g.dir = 1; }
  for (const m of world.mines) if (m.armed) { m.x = m.home.x; m.y = m.home.y; m.baseY = m.home.y; }
  world.events.push({ type: 'respawn', x: p.x + p.w / 2, y: p.y + p.h / 2 });
}

function clampX(entity, dir, rects) {
  for (const r of rects) {
    if (!overlap(entity, r)) continue;
    if (dir > 0) entity.x = r.x - entity.w;
    else if (dir < 0) entity.x = r.x + r.w;
  }
}

function pushCrateChain(world, first, dx, solids) {
  // Push a contiguous line of crates together: the chain moves as far as
  // its leading crate can, so crates never jam into an impassable pile.
  const dir = Math.sign(dx);
  const chain = [first];
  let grew = true;
  while (grew) {
    grew = false;
    const lead = chain[chain.length - 1];
    for (const o of world.crates) {
      if (chain.includes(o)) continue;
      const touching = dir > 0
        ? o.x < lead.x + lead.w + 2 && o.x + o.w > lead.x + lead.w - 2
        : o.x + o.w > lead.x - 2 && o.x < lead.x + 2;
      const vertical = o.y < lead.y + lead.h && o.y + o.h > lead.y;
      if (touching && vertical) { chain.push(o); grew = true; }
    }
  }
  const lead = chain[chain.length - 1];
  let allowed = dx;
  const probe = { x: lead.x + dx, y: lead.y, w: lead.w, h: lead.h };
  for (const r of solids) {
    if (!overlap(probe, r)) continue;
    if (dir > 0) allowed = Math.min(allowed, r.x - lead.w - lead.x);
    else allowed = Math.max(allowed, r.x + r.w - lead.x);
  }
  allowed = dir > 0 ? Math.max(0, allowed) : Math.min(0, allowed);
  for (const crate of chain) crate.x += allowed;
  return allowed;
}

function moveAxisY(entity, dy, rects) {
  // Resolve only against surfaces the entity actually crossed this step:
  // the floor and the walls overlap in the corners, and resolving against
  // a wall top would teleport a landing entity to the ceiling.
  const prevY = entity.y;
  entity.y += dy;
  let landed = null;
  for (const r of rects) {
    if (!overlap(entity, r)) continue;
    if (dy > 0 && prevY + entity.h <= r.y + 0.5) { entity.y = r.y - entity.h; landed = r; }
    else if (dy < 0 && prevY >= r.y + r.h - 0.5) { entity.y = r.y + r.h; }
  }
  return landed;
}

export function stepWorld(world, input, dt) {
  if (world.cleared || world.failed) return;
  const p = world.player;
  const level = world.level;
  world.time += dt;
  world.roomTime += dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  for (const c of world.crates) if (c.flash > 0) c.flash -= dt;
  for (const b of world.boulders) if (b.flash > 0) b.flash -= dt;
  for (const g of world.golems) if (g.flash > 0) g.flash -= dt;
  for (const m of world.mines) if (m.flash > 0) m.flash -= dt;
  p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
  p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);

  const g = p.gauge;
  const solids = solidRects(world);

  // --- horizontal drive ---
  const target = PHYSICS.moveSpeed[g] * input.axis;
  const accel = p.onGround ? PHYSICS.groundAccel : PHYSICS.airAccel;
  if (input.axis !== 0) {
    p.facing = input.axis;
    if (p.vx < target) p.vx = Math.min(target, p.vx + accel * dt);
    else if (p.vx > target) p.vx = Math.max(target, p.vx - accel * dt);
  } else if (p.onGround) {
    const f = PHYSICS.groundFriction * dt;
    p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
  }

  // --- zones: gale push, updraft lift ---
  p.inUpdraft = false;
  p.inGale = 0;
  const pc = center(p);
  for (const zone of level.gales) {
    if (pc.x >= zone.x && pc.x <= zone.x + zone.w && pc.y >= zone.y && pc.y <= zone.y + zone.h) {
      const force = [520, 260, 110, 0][g];
      p.vx += zone.dir * force * dt;
      p.inGale = zone.dir;
    }
  }
  let updraftLift = 0;
  for (const zone of level.updrafts) {
    if (pc.x >= zone.x && pc.x <= zone.x + zone.w && pc.y >= zone.y && pc.y <= zone.y + zone.h) {
      p.inUpdraft = true;
      updraftLift = g === 0 ? (world.seals.has('lungs') ? 3000 : 2600) : g === 1 ? 700 : 0;
    }
  }

  // --- jumping: coyote + buffer + release-halves-rise ---
  if (p.onGround) p.coyote = PHYSICS.coyoteTime;
  else p.coyote -= dt;
  if (input.jumpPressed) p.buffer = PHYSICS.jumpBuffer;
  else p.buffer -= dt;
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -PHYSICS.jumpVel[g];
    p.onGround = false;
    p.coyote = 0;
    p.buffer = 0;
    p.squashX = 0.78;
    p.squashY = 1.24;
    world.events.push({ type: 'jump', x: pc.x, y: p.y + p.h });
  }
  if (!input.jumpHeld && p.jumpHeldPrev && p.vy < 0) p.vy *= PHYSICS.jumpCut;
  p.jumpHeldPrev = input.jumpHeld;

  // --- gravity ---
  const falling = p.vy > 0;
  const scale = falling ? PHYSICS.fallGravityScale[g] : PHYSICS.riseGravityScale[g];
  p.vy += PHYSICS.gravity * scale * dt;
  if (updraftLift > 0) {
    p.vy -= updraftLift * dt;
    const riseCap = world.seals.has('lungs') ? -320 : -260;
    if (g === 0 && p.vy < riseCap) p.vy = riseCap;
  }
  const cap = g === 0 && world.seals.has('lungs') ? 170 : PHYSICS.fallCap[g];
  if (p.vy > cap) p.vy = cap;

  // --- transfers ---
  if (input.stealPressed) doSteal(world);
  if (input.givePressed) doGive(world);
  world.stealTarget = nearestStealTarget(world);
  world.giveTarget = nearestGiveTarget(world);

  // --- crates: gravity, friction, push-apart ---
  const pushables = [...world.crates];
  for (const c of world.crates) {
    c.vy += PHYSICS.gravity * dt;
    if (c.vy > 900) c.vy = 900;
    c.x += c.vx * dt;
    if (c.vx !== 0) clampX(c, Math.sign(c.vx), solids);
    const landed = moveAxisY(c, c.vy * dt, solids);
    c.onGround = landed !== null;
    if (landed) c.vy = 0;
    c.vx *= Math.max(0, 1 - dt * (c.onGround ? 10 : 1));
    if (Math.abs(c.vx) < 4) c.vx = 0;
  }
  for (let i = 0; i < pushables.length; i += 1) {
    for (let j = i + 1; j < pushables.length; j += 1) {
      const a = pushables[i];
      const b = pushables[j];
      if (!overlap(a, b)) continue;
      const push = ((a.x + a.w / 2) < (b.x + b.w / 2) ? -1 : 1) * ((a.w + b.w) / 2 - Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)));
      a.x += push / 2;
      b.x -= push / 2;
      clampX(a, Math.sign(push), solids);
      clampX(b, -Math.sign(push), solids);
    }
  }

  // --- boulders: gravity only, plus the weight-2 cracked-floor timer ---
  for (const b of world.boulders) {
    b.vy += PHYSICS.gravity * dt;
    if (b.vy > 900) b.vy = 900;
    const landed = moveAxisY(b, b.vy * dt, solids);
    b.onGround = landed !== null;
    if (landed) b.vy = 0;
    let onCracked = null;
    for (const slab of world.cracked) {
      if (slab.broken) continue;
      const resting = Math.abs(b.y + b.h - slab.y) < 4 && b.x + b.w > slab.x + 6 && b.x < slab.x + slab.w - 6;
      if (resting) onCracked = slab;
    }
    if (onCracked && b.weight >= 2) {
      b.breakTimer += dt;
      if (b.breakTimer >= WEIGHT.boulderBreakDelay) breakCracked(world, onCracked, false);
    } else {
      b.breakTimer = 0;
    }
  }

  // --- player X: solids, boulders, crates (push when HEAVY+) ---
  // A rect the player stands on top of (or passes under) is not a wall:
  // only collide sideways when the previous frame's body overlapped it
  // vertically by more than a hair, or crate tops become sticky.
  const dx = p.vx * dt;
  const feetY = p.y + p.h;
  const sideHit = (r) => !(feetY <= r.y + 0.5 || p.y >= r.y + r.h - 0.5);
  p.x += dx;
  for (const r of solids) {
    if (!overlap(p, r) || !sideHit(r)) continue;
    if (dx > 0) p.x = r.x - p.w;
    else if (dx < 0) p.x = r.x + r.w;
    p.vx = 0;
  }
  for (const b of world.boulders) {
    if (!overlap(p, b) || !sideHit(b)) continue;
    if (dx > 0) p.x = b.x - p.w;
    else if (dx < 0) p.x = b.x + b.w;
    p.vx = 0;
  }
  for (const c of world.crates) {
    if (!overlap(p, c) || !sideHit(c)) continue;
    if (g >= 2 && dx !== 0) {
      // Push: the crate (and any chain behind it) moves with the player
      // unless a wall stops it.
      const dir = Math.sign(dx);
      const moved = pushCrateChain(world, c, dx, solids);
      p.x = dir > 0 ? c.x - p.w : c.x + c.w;
      if (Math.abs(moved) < Math.abs(dx) - 0.01) p.vx = 0;
      c.vx = dir * Math.abs(p.vx);
    } else {
      if (dx > 0) p.x = c.x - p.w;
      else if (dx < 0) p.x = c.x + c.w;
      p.vx = 0;
    }
  }

  // --- player Y: solids, crates, boulders; landings break cracked floors ---
  const vyBefore = p.vy;
  const dy = p.vy * dt;
  const prevY = p.y;
  p.y += dy;
  let landedOn = null;
  const landTargets = [...solids, ...world.crates, ...world.boulders];
  for (const r of landTargets) {
    if (!overlap(p, r)) continue;
    if (dy > 0 && prevY + p.h <= r.y + 0.5) {
      p.y = r.y - p.h;
      if (!landedOn) landedOn = r;
    } else if (dy < 0 && prevY >= r.y + r.h - 0.5) {
      p.y = r.y + r.h;
      p.vy = 0;
    }
  }
  const wasGround = p.onGround;
  p.onGround = landedOn !== null;
  if (landedOn) {
    const impact = vyBefore;
    p.vy = 0;
    if (!wasGround) {
      const slab = world.cracked.find((c) => !c.broken && c === landedOn);
      if (slab && g === 3 && impact > WEIGHT.anchorSmashFallSpeed) {
        breakCracked(world, slab, true);
      } else if (impact > 700) {
        p.squashX = 1.25;
        p.squashY = 0.75;
        world.events.push({ type: 'hardLand', x: pc.x, y: p.y + p.h });
      } else if (impact > 240) {
        p.squashX = 1.12;
        p.squashY = 0.88;
        world.events.push({ type: 'land', x: pc.x, y: p.y + p.h });
      }
    }
  }

  // --- golems patrol; alert telegraph; touch hurts ---
  for (const gm of world.golems) {
    if (!gm.alive) continue;
    gm.x += gm.dir * WEIGHT.golemSpeed * dt;
    if (gm.x <= gm.minX) { gm.x = gm.minX; gm.dir = 1; }
    if (gm.x >= gm.maxX) { gm.x = gm.maxX; gm.dir = -1; }
    const near = dist(center(gm), center(p)) < WEIGHT.golemAlertRadius;
    gm.alert = Math.min(1, gm.alert + (near ? dt * 4 : -dt * 3));
    if (overlap(p, gm) && p.invuln <= 0) hurtPlayer(world, 'golem');
  }

  // --- mines bob, blink faster up close, explode on touch ---
  for (const m of world.mines) {
    if (!m.armed) continue;
    m.y = m.baseY + Math.sin(world.time * 2 + m.phase) * 6;
    const d = dist(center(m), center(p));
    m.near = d < WEIGHT.mineArmRadius ? 1 : 0;
    if (m.near && Math.sin(world.time * 10 + m.phase) > 0.96) {
      world.events.push({ type: 'beep', x: m.x + 15, y: m.y + 15 });
    }
    if (overlap(p, m) && p.invuln <= 0) {
      m.armed = false;
      world.events.push({ type: 'explosion', x: m.x + 15, y: m.y + 15 });
      hurtPlayer(world, 'mine');
      // The exploding mine comes back on respawn: mark it home-armed.
      if (!world.failed) m.armed = true;
    }
  }

  // --- orbs ---
  for (const o of world.orbs) {
    if (o.taken) continue;
    if (overlap(p, o)) {
      o.taken = true;
      world.stats.orbsTaken += 1;
      scoreEvent(world, WEIGHT.orbScore, o.x + 9, o.y + 9, 'orb');
      world.events.push({ type: 'orb', x: o.x + 9, y: o.y + 9 });
    }
  }

  // --- switches latch; gates open ---
  for (const s of world.switches) {
    let pressed = false;
    for (const c of world.crates) {
      if (c.weight >= 2 && overlap(c, { x: s.x, y: s.y - 6, w: s.w, h: s.h + 6 })) pressed = true;
    }
    if (p.gauge === 3 && overlap(p, { x: s.x, y: s.y - 6, w: s.w, h: s.h + 6 }) && p.onGround) pressed = true;
    s.pressed = pressed;
    if (pressed && !s.latched) {
      s.latched = true;
      world.events.push({ type: 'switch', x: s.x + 22, y: s.y });
      updateDoor(world);
    }
  }
  for (const gt of world.gates) {
    const shouldOpen = world.switches.some((s) => s.id === gt.condition.switch && s.latched);
    if (shouldOpen && !gt.open) {
      gt.open = true;
      world.events.push({ type: 'gate', x: gt.x + gt.w / 2, y: gt.y + gt.h / 2 });
    }
    if (gt.open && gt.openAnim < 1) gt.openAnim = Math.min(1, gt.openAnim + dt * 2.2);
  }

  // --- door ---
  if (world.doorOpen) {
    const door = { x: level.door[0], y: level.door[1], w: 44, h: 64 };
    if (overlap(p, door)) {
      world.cleared = true;
      world.timeBonus = Math.max(0, Math.round((level.par - world.roomTime) * 10));
      world.clearBonus = WEIGHT.roomClearScore;
      world.roomScore += world.clearBonus + world.timeBonus;
      world.events.push({ type: 'clear' });
    }
  }

  // --- fell out of the world (safety net; no room has a true pit) ---
  if (p.y > 640) hurtPlayer(world, 'pit');
}

export function roomStars(world) {
  let stars = 1;
  if (world.orbs.every((o) => o.taken)) stars += 1;
  if (world.roomTime <= world.level.par) stars += 1;
  return stars;
}
