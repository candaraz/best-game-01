// The simulation: one fixed-step world per room. The player, crates, boulders,
// golems, mines, switches, gates and wind zones all live here; the renderer only
// draws what this file computes, and the juice layer only reacts to the events
// it reports. Nothing here reads the clock or the network, so a scripted input
// tape always replays the same room.

import {
  FIELD,
  PLAYER,
  WEIGHTS,
  HEARTS_PER_ROOM,
  SCORE,
  SMASH_MIN_FALL,
  GOLEM,
  STEP,
} from './config.js';
import { parseRoom } from './levels.js';
import { ACT_GIVE, ACT_JUMP, ACT_STEAL } from './input.js';

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function centreX(b) {
  return b.x + b.w / 2;
}

function centreY(b) {
  return b.y + b.h / 2;
}

export function createWorld(roomDef, roomIndex) {
  const parts = parseRoom(roomDef);
  const events = [];
  const state = {
    roomIndex,
    def: roomDef,
    time: 0,
    cleared: false,
    failed: false,
    failCause: null,
    orbsTaken: 0,
    damageTaken: false,
    score: 0,
    combo: 0,
    comboTimer: 0,
    gateOpen: 0,
    switchWasActive: false,
    player: {
      x: parts.spawn.x - PLAYER.width / 2,
      y: parts.spawn.y - PLAYER.height,
      w: PLAYER.width,
      h: PLAYER.height,
      vx: 0,
      vy: 0,
      gauge: 1,
      hearts: HEARTS_PER_ROOM,
      facing: 1,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      invuln: 0,
      cooldown: 0,
      squash: 0,
      stretch: 0,
      runPhase: 0,
      wasGrounded: false,
      fallPeak: 0,
      prevJumpHeld: false,
    },
    solids: parts.solids,
    oneWay: parts.oneWay,
    cracked: parts.cracked,
    gates: parts.gates,
    orbs: parts.orbs,
    crates: parts.crates.map((c) => ({ ...c, vx: 0, vy: 0, grounded: false })),
    boulders: parts.boulders.map((b) => ({ ...b, vx: 0, vy: 0, grounded: false })),
    golems: parts.golems.map((g) => ({ ...g, vx: 0, vy: 0, grounded: false })),
    mines: parts.mines,
    switches: parts.switches,
    door: { x: roomDef.door.x - 18, y: roomDef.door.y - 64, w: 36, h: 64 },
    zones: roomDef.zones,
    spawn: parts.spawn,
  };

  function emit(type, data = {}) {
    events.push({ type, ...data });
  }

  function solidAt(x, y, w, h, ignoreCracked) {
    const box = { x, y, w, h };
    for (const s of state.solids) if (overlaps(box, s)) return s;
    if (state.gateOpen < 0.6) {
      for (const g of state.gates) if (overlaps(box, g)) return g;
    }
    if (!ignoreCracked) {
      for (const c of state.cracked) if (!c.broken && overlaps(box, c)) return c;
    }
    return null;
  }

  function moveBody(body, dt, isPlayer) {
    // Horizontal: move, then push out of solids.
    body.x += body.vx * dt;
    if (body.x < 0) {
      body.x = 0;
      body.vx = 0;
    }
    if (body.x + body.w > FIELD.width) {
      body.x = FIELD.width - body.w;
      body.vx = 0;
    }
    const hitX = solidAt(body.x, body.y + 1, body.w, body.h - 2, false);
    if (hitX) {
      if (body.vx > 0) body.x = hitX.x - body.w;
      else if (body.vx < 0) body.x = hitX.x + hitX.w;
      body.vx = 0;
    }
    // Vertical: move, then land on solids or one-way platforms.
    const prevBottom = body.y + body.h;
    body.y += body.vy * dt;
    body.grounded = false;
    if (body.vy >= 0) {
      const hitY = solidAt(body.x + 1, body.y, body.w - 2, body.h, false);
      if (hitY) {
        body.y = hitY.y - body.h;
        body.vy = 0;
        body.grounded = true;
      } else {
        for (const p of state.oneWay) {
          if (
            prevBottom <= p.y + 1 &&
            body.y + body.h >= p.y &&
            body.x + body.w > p.x + 2 &&
            body.x < p.x + p.w - 2
          ) {
            body.y = p.y - body.h;
            body.vy = 0;
            body.grounded = true;
            break;
          }
        }
      }
    } else {
      const hitHead = solidAt(body.x + 1, body.y, body.w - 2, body.h, false);
      if (hitHead) {
        body.y = hitHead.y + hitHead.h;
        body.vy = 0;
      }
    }
    if (body.y < 0) {
      body.y = 0;
      body.vy = Math.max(0, body.vy);
    }
    return body.grounded;
  }

  function weightState() {
    return WEIGHTS[state.player.gauge];
  }

  function nearestTarget(kind) {
    const p = state.player;
    const px = centreX(p);
    const py = centreY(p);
    let best = null;
    let bestDist = PLAYER.range;
    const consider = (obj, objKind) => {
      const dx = centreX(obj) - px;
      const dy = centreY(obj) - py;
      const dist = Math.hypot(dx, dy);
      if (dist <= bestDist) {
        bestDist = dist;
        best = { obj, kind: objKind, dist };
      }
    };
    if (kind === 'steal') {
      for (const c of state.crates) if (c.weight > 0) consider(c, 'crate');
      for (const b of state.boulders) if (b.weight > 0) consider(b, 'boulder');
      for (const g of state.golems) if (g.alive) consider(g, 'golem');
    } else {
      for (const c of state.crates) if (c.weight < c.maxWeight) consider(c, 'crate');
      for (const b of state.boulders) if (b.weight < b.maxWeight) consider(b, 'boulder');
      for (const m of state.mines) if (m.armed) consider(m, 'mine');
    }
    return best;
  }

  function chainUp() {
    state.combo = Math.min(state.combo + 1, SCORE.comboMax);
    state.comboTimer = SCORE.comboWindow;
  }

  function trySteal() {
    const p = state.player;
    if (p.cooldown > 0) return;
    const target = nearestTarget('steal');
    if (!target) {
      emit('denied', { x: centreX(p), y: p.y - 6, text: 'NO TARGET' });
      return;
    }
    if (p.gauge >= 3) {
      emit('denied', { x: centreX(p), y: p.y - 6, text: 'GAUGE FULL' });
      return;
    }
    p.cooldown = PLAYER.transferCooldown;
    target.obj.weight -= 1;
    p.gauge += 1;
    chainUp();
    emit('steal', {
      fromX: centreX(target.obj),
      fromY: centreY(target.obj),
      toX: centreX(p),
      toY: centreY(p),
      kind: target.kind,
    });
    if (target.kind === 'golem') {
      target.obj.alive = false;
      const gained = SCORE.golemPop * Math.max(1, state.combo);
      state.score += gained;
      emit('pop', { x: centreX(target.obj), y: centreY(target.obj), gained });
    }
    p.squash = 0.18;
  }

  function tryGive() {
    const p = state.player;
    if (p.cooldown > 0) return;
    const target = nearestTarget('give');
    if (!target) {
      emit('denied', { x: centreX(p), y: p.y - 6, text: 'NO TARGET' });
      return;
    }
    if (p.gauge <= 0) {
      emit('denied', { x: centreX(p), y: p.y - 6, text: 'GAUGE EMPTY' });
      return;
    }
    p.cooldown = PLAYER.transferCooldown;
    target.obj.weight += 1;
    p.gauge -= 1;
    chainUp();
    emit('give', {
      fromX: centreX(p),
      fromY: centreY(p),
      toX: centreX(target.obj),
      toY: centreY(target.obj),
      kind: target.kind,
    });
    if (target.kind === 'mine') {
      target.obj.armed = false;
      const gained = SCORE.mineFizzle * Math.max(1, state.combo);
      state.score += gained;
      emit('fizzle', { x: centreX(target.obj), y: centreY(target.obj), gained });
    }
    p.stretch = 0.16;
  }

  function hurtPlayer(fromX, cause) {
    const p = state.player;
    if (p.invuln > 0 || state.cleared || state.failed) return;
    p.hearts -= 1;
    p.invuln = PLAYER.invulnerable;
    state.damageTaken = true;
    state.combo = 0;
    const dir = centreX(p) < fromX ? -1 : 1;
    p.vx = dir * PLAYER.hurtKnockX;
    p.vy = PLAYER.hurtKnockY;
    emit('hurt', { x: centreX(p), y: centreY(p) });
    if (p.hearts <= 0) {
      state.failed = true;
      state.failCause = cause || 'golem';
      emit('failed', {});
    }
  }

  function respawnAfterPit() {
    const p = state.player;
    p.hearts -= 1;
    state.damageTaken = true;
    state.combo = 0;
    emit('pit', { x: centreX(p), y: FIELD.height - 20 });
    if (p.hearts <= 0) {
      state.failed = true;
      state.failCause = 'pit';
      emit('failed', {});
      return;
    }
    p.x = state.spawn.x - p.w / 2;
    p.y = state.spawn.y - p.h;
    p.vx = 0;
    p.vy = 0;
    p.invuln = PLAYER.invulnerable;
  }

  function breakCrackedUnder(body, fallSpeed) {
    const feet = { x: body.x + 2, y: body.y + body.h - 4, w: body.w - 4, h: 6 };
    let broke = false;
    for (const c of state.cracked) {
      if (!c.broken && overlaps(feet, c)) {
        c.broken = true;
        broke = true;
        emit('smashTile', { x: c.x + c.w / 2, y: c.y + c.h / 2 });
      }
    }
    if (broke) emit('smash', { x: centreX(body), y: body.y + body.h, fallSpeed });
    return broke;
  }

  function updateSwitches() {
    for (const s of state.switches) {
      let load = 0;
      const plate = { x: s.x - 2, y: s.y - 6, w: s.w + 4, h: s.h + 6 };
      for (const c of state.crates) {
        if (overlaps({ x: c.x, y: c.y + c.h - 4, w: c.w, h: 4 }, plate)) load += c.weight;
      }
      for (const b of state.boulders) {
        if (overlaps({ x: b.x, y: b.y + b.h - 4, w: b.w, h: 4 }, plate)) load += b.weight;
      }
      const p = state.player;
      if (overlaps({ x: p.x, y: p.y + p.h - 4, w: p.w, h: 4 }, plate)) load += p.gauge;
      const active = load >= s.threshold;
      if (active && !s.active) emit('switchOn', { x: s.x + s.w / 2, y: s.y });
      s.active = active;
    }
    const anyActive = state.switches.some((s) => s.active);
    if (anyActive !== state.switchWasActive) state.switchWasActive = anyActive;
    const target = anyActive ? 1 : 0;
    state.gateOpen += (target - state.gateOpen) * Math.min(1, STEP * 6);
    if (Math.abs(target - state.gateOpen) < 0.02) state.gateOpen = target;
  }

  function step(dt, moveDir, jumpHeld, actions) {
    const p = state.player;
    if (state.cleared || state.failed) return;
    state.time += dt;
    state.stepCount = (state.stepCount || 0) + 1;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.squash = Math.max(0, p.squash - dt);
    p.stretch = Math.max(0, p.stretch - dt);
    const w = weightState();

    if (moveDir !== 0) p.facing = moveDir;
    const targetVx = moveDir * w.speed;
    const accel = p.onGround ? 2600 : 1700;
    p.vx += Math.max(-accel * dt, Math.min(accel * dt, targetVx - p.vx));

    // Wind zones push the player; heavy states resist, anchor ignores.
    for (const zone of state.zones) {
      const cx = centreX(p);
      const cy = centreY(p);
      if (cx < zone.x || cx > zone.x + zone.w || cy < zone.y || cy > zone.y + zone.h) continue;
      if (zone.kind === 'gale') {
        p.vx += zone.dx * zone.strength * w.wind * dt;
        if (state.stepCount % 2 === 0) emit('galeStreak', { zone });
      } else if (zone.kind === 'updraft') {
        p.vy -= zone.strength * w.updraft * dt;
        // The shaft is an elevator, not a cannon: cap the rise so the player
        // can steer out at corridor height instead of rocketing past it.
        if (w.updraft > 0 && p.vy < -240) p.vy = -240;
        if (state.stepCount % 3 === 0) emit('updraftMote', { zone });
      }
    }

    p.vy += w.gravity * dt;
    if (p.vy > w.maxFall) p.vy = w.maxFall;
    // Releasing jump mid-rise halves the upward speed: a tap hops, a hold soars.
    if (p.prevJumpHeld && !jumpHeld && p.vy < 0) p.vy *= 0.5;
    p.prevJumpHeld = jumpHeld;

    if (p.onGround) p.coyote = PLAYER.coyote;
    else p.coyote = Math.max(0, p.coyote - dt);
    if (actions & ACT_JUMP) p.jumpBuffer = PLAYER.jumpBuffer;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = w.jump;
      p.jumpBuffer = 0;
      p.coyote = 0;
      p.onGround = false;
      p.stretch = 0.16;
      emit('jump', { x: centreX(p), y: p.y + p.h });
    }

    if (actions & ACT_STEAL) trySteal();
    if (actions & ACT_GIVE) tryGive();

    const wasGrounded = p.onGround;
    const fallBefore = p.vy;
    const prevBottom = p.y + p.h;
    const prevTop = p.y;
    moveBody(p, dt, true);
    p.onGround = p.grounded;
    if (!wasGrounded && p.onGround) {
      const hard = fallBefore > 520;
      p.squash = hard ? 0.2 : 0.12;
      emit('land', { x: centreX(p), y: p.y + p.h, hard, fallSpeed: fallBefore });
      if (w.smash && fallBefore > SMASH_MIN_FALL) breakCrackedUnder(p, fallBefore);
    }
    if (p.onGround) p.runPhase += Math.abs(p.vx) * dt * 0.05;

    // Crates and boulders: gravity, friction, pushing, separation.
    const boxes = [...state.crates, ...state.boulders];
    for (const box of boxes) {
      box.vy += 1900 * dt;
      if (box.vy > 800) box.vy = 800;
      box.vx *= Math.max(0, 1 - 6 * dt);
      const bFall = box.vy;
      const wasBoxGrounded = box.grounded;
      moveBody(box, dt, false);
      if (!wasBoxGrounded && box.grounded && box.weight >= 3 && bFall > SMASH_MIN_FALL) {
        breakCrackedUnder(box, bFall);
      }
      if (box.roll !== undefined) box.roll += box.vx * dt * 0.05;
    }
    // The player lands on boxes, bonks under them, or pushes them from the
    // side. Landing uses the pre-step feet position, so a descent onto a
    // crate top counts as landing even while the bodies overlap this step.
    for (const box of boxes) {
      if (!overlaps(p, box)) continue;
      if (p.vy >= 0 && prevBottom <= box.y + 8) {
        p.y = box.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.grounded = true;
        if (!wasGrounded) {
          p.squash = 0.12;
          emit('land', { x: centreX(p), y: p.y + p.h, hard: false, fallSpeed: fallBefore });
        }
        continue;
      }
      if (p.vy < 0 && prevTop >= box.y + box.h - 8) {
        p.y = box.y + box.h;
        p.vy = 0;
        continue;
      }
      const beside = p.y + p.h > box.y + 8 && p.y < box.y + box.h - 8;
      if (!beside) continue;
      const canPush = p.onGround && (w.push || box.weight <= p.gauge);
      if (!canPush) {
        if (p.vx > 0) p.x = box.x - p.w;
        else if (p.vx < 0) p.x = box.x + box.w;
        continue;
      }
      const push = p.vx * dt;
      const oldX = box.x;
      box.x += push;
      const blocked = solidAt(box.x, box.y + 1, box.w, box.h - 2, false);
      if (blocked) {
        box.x = oldX;
        if (p.vx > 0) p.x = box.x - p.w;
        else if (p.vx < 0) p.x = box.x + box.w;
      } else {
        box.vx = p.vx * 0.9;
        // Feedback only: a throttled dust event while the box truly moves.
        if (state.stepCount % 6 === 0) {
          emit('push', { x: centreX(box), y: box.y + box.h, dir: p.vx > 0 ? 1 : -1 });
        }
        if (p.vx > 0) p.x = box.x - p.w;
        else if (p.vx < 0) p.x = box.x + box.w;
      }
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (!overlaps(a, b)) continue;
        const overlap = Math.min(a.x + a.w - b.x, b.x + b.w - a.x);
        if (overlap > 0) {
          const dir = centreX(a) < centreX(b) ? -1 : 1;
          a.x += (dir * overlap) / 2;
          b.x -= (dir * overlap) / 2;
        }
      }
    }

    // Golems patrol until a wall or a ledge turns them.
    for (const g of state.golems) {
      if (!g.alive) continue;
      g.vy += 1900 * dt;
      if (g.vy > 800) g.vy = 800;
      g.vx = g.dir * GOLEM.speed;
      const aheadX = g.dir > 0 ? g.x + g.w + 4 : g.x - 4;
      const groundAhead = solidAt(aheadX, g.y + g.h + 4, 4, 8, false) !== null;
      const wallAhead = solidAt(g.dir > 0 ? g.x + g.w + 1 : g.x - 1, g.y + 4, 2, g.h - 8, false) !== null;
      if (g.grounded && (!groundAhead || wallAhead)) g.dir *= -1;
      moveBody(g, dt, false);
      if (overlaps(p, g) && p.invuln <= 0) hurtPlayer(centreX(g), 'golem');
    }

    // Mines explode on touch while armed.
    for (const m of state.mines) {
      if (!m.armed) continue;
      if (overlaps(p, { x: m.x - 2, y: m.y - 2, w: m.w + 4, h: m.h + 4 }) && p.invuln <= 0) {
        m.armed = false;
        emit('explode', { x: centreX(m), y: centreY(m) });
        hurtPlayer(centreX(m), 'mine');
      }
    }

    // Orbs.
    for (const orb of state.orbs) {
      if (orb.taken) continue;
      const dx = orb.x - centreX(p);
      const dy = orb.y - centreY(p);
      if (Math.hypot(dx, dy) < 44) {
        orb.taken = true;
        state.orbsTaken += 1;
        const gained = SCORE.orb * Math.max(1, state.combo);
        state.score += gained;
        emit('orb', { x: orb.x, y: orb.y, gained });
      }
    }

    updateSwitches();

    // The door.
    if (overlaps(p, state.door)) {
      state.cleared = true;
      emit('clear', { x: centreX(p), y: centreY(p) });
    }

    // The pit.
    if (p.y > FIELD.height + 30) respawnAfterPit();
  }

  return {
    state,
    step,
    drainEvents() {
      return events.splice(0, events.length);
    },
    /** The nearest steal and give targets, for the renderer's hint rings. */
    targets() {
      return { steal: nearestTarget('steal'), give: nearestTarget('give') };
    },
    snapshot() {
      const p = state.player;
      return {
        room: state.roomIndex,
        time: Math.round(state.time * 1000) / 1000,
        cleared: state.cleared,
        failed: state.failed,
        score: state.score,
        orbs: state.orbsTaken,
        hearts: p.hearts,
        gauge: p.gauge,
        x: Math.round(p.x),
        y: Math.round(p.y),
        grounded: p.onGround,
        combo: state.combo,
        golemsAlive: state.golems.filter((g) => g.alive).length,
        minesArmed: state.mines.filter((m) => m.armed).length,
        crackedBroken: state.cracked.filter((c) => c.broken).length,
        switchActive: state.switches.some((s) => s.active),
        gateOpen: Math.round(state.gateOpen * 100) / 100,
      };
    },
  };
}
