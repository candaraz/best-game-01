// Pip: the weight-thief. Runs, jumps and falls under the gauge's rule —
// gauge 0 floats, gauge 3 anchors — with the forgiveness stack (coyote
// time, jump buffer, variable jump height) and squash & stretch so every
// landing reads. Steal and give reach the nearest object in range.

import { TILE, MOVE, GAUGE, TRANSFER, WIND } from './config.js';
import { moveBody, zoneAt, centre } from './physics.js';
import { canStealFrom, canGiveTo } from './objects.js';

export function makePlayer(col, row) {
  return {
    x: col * TILE + 7, y: row * TILE + 6, w: 26, h: 34,
    vx: 0, vy: 0, gauge: 1, facing: 1,
    grounded: false, coyote: 0, buffer: 0,
    jumpAge: 99, cutDone: false,
    squash: 0, stretch: 0, walkPhase: 0, idleTime: 0,
    transferCooldown: 0, gaugePop: 0, invulnerable: 0,
  };
}

export function resetPlayer(player, col, row) {
  const fresh = makePlayer(col, row);
  fresh.gauge = 1;
  Object.assign(player, fresh);
}

export function updatePlayer(player, input, dt, room, fx, audio) {
  const g = GAUGE[player.gauge];
  const c = centre(player);
  const zone = zoneAt(room.zones, c.x, c.y);

  // Horizontal: snappy accel on ground, softer in air.
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) {
    player.facing = dir;
    const accel = player.grounded ? MOVE.accel : MOVE.airAccel;
    player.vx += dir * accel * dt;
    player.vx = Math.max(-MOVE.runSpeed, Math.min(MOVE.runSpeed, player.vx));
    player.walkPhase += dt * Math.abs(player.vx) * 0.055;
    player.idleTime = 0;
  } else if (player.grounded) {
    const stop = MOVE.groundFriction * dt;
    player.vx = Math.abs(player.vx) <= stop ? 0 : player.vx - Math.sign(player.vx) * stop;
    player.idleTime += dt;
  } else {
    player.vx *= Math.max(0, 1 - 0.25 * dt);
  }

  // Wind zones push against the gauge: an anchor is unmoved.
  if (zone === '<') player.vx -= WIND.galePush * g.wind * dt;
  if (zone === '>') player.vx += WIND.galePush * g.wind * dt;
  player.vx = Math.max(-420, Math.min(420, player.vx));

  // Gravity, scaled by the gauge; rising uses the lighter rise gravity.
  const gravity = (player.vy < 0 ? MOVE.riseGravity : MOVE.fallGravity) * g.gravity;
  player.vy = Math.min(player.vy + gravity * dt, MOVE.maxFall * g.maxFall);

  // Updrafts lift against gravity, strongest at gauge 0.
  if (zone === '^') {
    player.vy -= WIND.updraftLift * WIND.updraftScale[player.gauge] * dt;
    player.vy = Math.max(player.vy, -WIND.updraftRiseCap);
    if (Math.random() < 0.3) {
      fx.burst(c.x + (Math.random() - 0.5) * 24, player.y + player.h, {
        count: 1, color: '#8fd8ff', speed: 30, size: 2, life: 0.5, gravity: -60, glow: true,
      });
    }
  }

  // Forgiveness: coyote time + jump buffer + variable height.
  if (player.grounded) player.coyote = MOVE.coyote; else player.coyote -= dt;
  if (input.jumpPressed) player.buffer = MOVE.buffer; else player.buffer -= dt;
  if (player.buffer > 0 && player.coyote > 0) {
    player.vy = -MOVE.jumpSpeed * g.jump;
    player.coyote = 0;
    player.buffer = 0;
    player.grounded = false;
    player.jumpAge = 0;
    player.cutDone = false;
    player.stretch = 1;
    fx.burst(c.x, player.y + player.h, { count: 6, color: '#9aa3d0', speed: 70, size: 2, life: 0.4, gravity: 200 });
    audio.jump();
  }
  // Variable jump height: releasing the key cuts the rise ONCE, and only
  // after a minimum rise, so even the quickest tap clears a full tile.
  if (!player.grounded) player.jumpAge += dt;
  if (!input.jumpHeld && player.vy < 0 && !player.cutDone && player.jumpAge > 0.12) {
    player.vy *= MOVE.jumpCut;
    player.cutDone = true;
  }

  const wasGrounded = player.grounded;
  const wasFalling = player.vy;
  const hit = moveBody(player, dt, room.tiles, room.openDoors, (speed, col, row) => {
    room.onPlayerLand(speed, col, row);
  });
  player.grounded = hit.down;
  if (hit.down && !wasGrounded && wasFalling > 260) {
    player.squash = Math.min(1, wasFalling / 700);
    fx.burst(c.x, player.y + player.h, { count: 8, color: '#9aa3d0', speed: 90, size: 2, life: 0.45, gravity: 240 });
    audio.land();
  }
  if (hit.up) player.vy = 0;

  // Timers and juice decay.
  player.squash = Math.max(0, player.squash - dt * 5);
  player.stretch = Math.max(0, player.stretch - dt * 5);
  player.transferCooldown = Math.max(0, player.transferCooldown - dt);
  player.gaugePop = Math.max(0, player.gaugePop - dt * 3);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
}

// The nearest object Pip can steal from / give to, within range.
export function transferTarget(player, objects) {
  const c = centre(player);
  let best = null;
  let bestDist = TRANSFER.range;
  for (const obj of objects) {
    if (obj.kind === 'switch') continue;
    const o = centre(obj);
    const d = Math.hypot(o.x - c.x, o.y - c.y);
    if (d < bestDist && (canStealFrom(obj) || canGiveTo(obj))) {
      best = obj;
      bestDist = d;
    }
  }
  return best;
}

export function drawPlayer(ctx, player, time) {
  if (player.invulnerable > 0 && Math.floor(time * 18) % 2 === 0) return; // blink
  const squashX = 1 + player.squash * 0.25 - player.stretch * 0.12;
  const squashY = 1 - player.squash * 0.25 + player.stretch * 0.18;
  const cx = player.x + player.w / 2;
  const feet = player.y + player.h;
  const g = GAUGE[player.gauge];
  const running = Math.abs(player.vx) > 30 && player.grounded;
  const bob = running ? Math.abs(Math.sin(player.walkPhase)) * 2 : Math.sin(time * 2 + player.idleTime) * 0.8;

  ctx.save();
  ctx.translate(cx, feet);
  ctx.scale(squashX * player.facing, squashY);
  ctx.translate(-cx, -feet);

  // Scarf, fluttering against the run direction and the wind.
  const flutter = Math.sin(time * 9) * 2 + player.vx * -0.012;
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(cx - 4 * player.facing, player.y + 10 + bob);
  ctx.quadraticCurveTo(cx - 16 * player.facing + flutter, player.y + 6 + bob, cx - 20 * player.facing + flutter * 1.4, player.y + 12 + bob);
  ctx.quadraticCurveTo(cx - 12 * player.facing, player.y + 14 + bob, cx - 4 * player.facing, player.y + 14 + bob);
  ctx.fill();

  // Cloak body.
  ctx.fillStyle = '#5b8dd9';
  ctx.beginPath();
  ctx.moveTo(cx - 9, feet);
  ctx.quadraticCurveTo(cx - 12, player.y + 16 + bob, cx - 7, player.y + 8 + bob);
  ctx.lineTo(cx + 7, player.y + 8 + bob);
  ctx.quadraticCurveTo(cx + 12, player.y + 16 + bob, cx + 9, feet);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a74b8';
  ctx.fillRect(cx - 9, feet - 6, 18, 6);

  // Hood + face.
  ctx.fillStyle = '#3d639f';
  ctx.beginPath();
  ctx.arc(cx, player.y + 7 + bob, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f4e3c8';
  ctx.beginPath();
  ctx.arc(cx + 2, player.y + 8 + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b0e1d';
  ctx.fillRect(cx + 3, player.y + 6 + bob, 2.5, 3.5);
  ctx.fillRect(cx + 7, player.y + 6 + bob, 2.5, 3.5);

  // Gauge glow: the heavier Pip is, the warmer the glow at the feet.
  if (player.gauge > 0) {
    ctx.globalAlpha = 0.25 + player.gauge * 0.14;
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.ellipse(cx, feet + 1, 10 + player.gauge * 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
