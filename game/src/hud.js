// The HUD: top bar (room, objective, timer, score, combo, orbs), a big
// labeled weight gauge bottom-left, vault progress bottom-right. Drawn
// without the camera shake, and never over the middle of the action.

import { PALETTE, SEALS, VIEW, WEIGHT_EFFECTS, WEIGHT_NAMES } from './config.js';
import { doorRequirements } from './world.js';
import { roundRect } from './render.js';

const FONT = '"Avenir Next", "Segoe UI", Verdana, sans-serif';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(7, 10, 24, 0.78)';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(106, 116, 168, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawHud(ctx, world, run, time) {
  const level = world.level;
  const p = world.player;

  // --- top bar ---
  panel(ctx, 12, 10, VIEW.w - 24, 52);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText(`ROOM ${world.levelIndex + 1} · ${level.name.toUpperCase()}`, 24, 31);
  ctx.fillStyle = 'rgba(242, 231, 201, 0.65)';
  ctx.font = `12px ${FONT}`;
  ctx.fillText(level.subtitle, 24, 49);

  // Objective checklist, centre.
  const reqs = doorRequirements(world);
  ctx.textAlign = 'center';
  ctx.font = `bold 13px ${FONT}`;
  reqs.forEach((req, i) => {
    const y = 27 + i * 17 - (reqs.length - 1) * 8;
    ctx.fillStyle = req.done ? PALETTE.cyan : PALETTE.gold;
    ctx.fillText(`${req.done ? '✓' : '○'} ${req.label}`, 480, y);
  });

  // Timer + score, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText(`★ ${run.score + world.roomScore}`, 936, 31);
  const overPar = world.roomTime > level.par;
  ctx.fillStyle = overPar ? PALETTE.danger : PALETTE.parchment;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`${formatTime(world.roomTime)} / par ${formatTime(level.par)}`, 936, 49);

  // --- top-left column: hearts, orbs, seals, then the weight gauge ---
  // The gauge lives up here, never over the floor where the action is.
  for (let i = 0; i < p.maxHearts; i += 1) {
    const hx = 26 + i * 22;
    const hy = 82;
    ctx.fillStyle = i < p.hearts ? PALETTE.danger : 'rgba(255, 255, 255, 0.22)';
    ctx.font = '17px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText('♥', hx, hy);
  }
  const orbsGot = world.orbs.filter((o) => o.taken).length;
  ctx.fillStyle = PALETTE.orb;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`◆ ${orbsGot}/${world.orbs.length}`, 26, 106);

  // Seal icons, top-left under the orbs.
  let sx = 26;
  for (const seal of SEALS) {
    if (!world.seals.has(seal.id)) continue;
    ctx.fillStyle = 'rgba(7, 10, 24, 0.78)';
    roundRect(ctx, sx, 114, 24, 24, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = PALETTE.cyan;
    ctx.font = '14px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(seal.icon, sx + 12, 131);
    sx += 30;
  }

  // The weight gauge, big and labeled, top-left under the seals.
  const gx = 12;
  const gy = 146;
  panel(ctx, gx, gy, 300, 74);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('WEIGHT', gx + 14, gy + 20);
  ctx.fillStyle = PALETTE.cyan;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText(WEIGHT_NAMES[p.gauge], gx + 78, gy + 21);
  // Gauge pips.
  for (let i = 0; i < 4; i += 1) {
    const px = gx + 14 + i * 34;
    const py = gy + 30;
    ctx.fillStyle = i <= p.gauge ? (i === 0 ? PALETTE.cyan : i === 3 ? PALETTE.gold : '#ffb35c') : 'rgba(255, 255, 255, 0.18)';
    roundRect(ctx, px, py, 28, 16, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(242, 231, 201, 0.75)';
  ctx.font = `12px ${FONT}`;
  ctx.fillText(WEIGHT_EFFECTS[p.gauge], gx + 14, gy + 62);
  // Key hints.
  ctx.fillStyle = PALETTE.cyan;
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText('E steal', gx + 176, gy + 20);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText('Q give', gx + 232, gy + 20);

  // Combo, centre-top under the bar.
  if (world.combo > 1) {
    const label = `COMBO ×${world.combo}`;
    ctx.font = `bold 20px ${FONT}`;
    const tw = ctx.measureText(label).width + 24;
    panel(ctx, 480 - tw / 2, 68, tw, 30);
    ctx.fillStyle = PALETTE.gold;
    ctx.textAlign = 'center';
    ctx.fillText(label, 480, 89);
    const window = world.seals.has('hands') ? 4.5 : 3.0;
    const frac = Math.max(0, world.comboTimer / window);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(480 - tw / 2 + 8, 94, tw - 16, 3);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(480 - tw / 2 + 8, 94, (tw - 16) * frac, 3);
  }

  // --- bottom-right: vault progress dots + best ---
  const bx = VIEW.w - 12 - 250;
  const by = VIEW.h - 62;
  panel(ctx, bx, by, 250, 50);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
  ctx.font = `11px ${FONT}`;
  ctx.fillText('VAULT', bx + 14, by + 17);
  for (let i = 0; i < 9; i += 1) {
    const dotX = bx + 66 + i * 18;
    const dotY = by + 13;
    const done = i < world.levelIndex;
    const current = i === world.levelIndex;
    ctx.beginPath();
    ctx.arc(dotX, dotY, current ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = done ? PALETTE.cyan : current ? PALETTE.gold : 'rgba(255, 255, 255, 0.22)';
    ctx.fill();
    if (current) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
  ctx.font = `12px ${FONT}`;
  ctx.fillText(`BEST ★ ${run.best}`, bx + 14, by + 38);
  ctx.textAlign = 'right';
  ctx.fillText('P pause · M mute', bx + 236, by + 38);

  // Hint line, first seconds of the room.
  if (world.roomTime < 6 && !world.cleared) {
    ctx.font = `13px ${FONT}`;
    const hw = ctx.measureText(level.hint).width + 28;
    panel(ctx, 480 - hw / 2, VIEW.h - 40, hw, 28);
    ctx.fillStyle = PALETTE.parchment;
    ctx.textAlign = 'center';
    ctx.fillText(level.hint, 480, VIEW.h - 21);
  }
  void time;
}
