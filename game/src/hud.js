// The heads-up display: four corners, each carrying its own information, plus
// the room-progress strip along the bottom. The weight gauge is the largest
// element — the whole game is about weight, so the gauge must read from across
// the room, and it must read in a screenshot shrunk to a quarter of its size.

import { FIELD, WEIGHTS, SCORE, PALETTE } from './config.js';

function panel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.save();
  ctx.fillStyle = `rgba(12, 14, 28, ${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 180, 91, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function drawHud(ctx, view) {
  const { world, totalScore, stars, roomCount, best, muted, time } = view;
  const { state } = world;
  const p = state.player;
  const w = WEIGHTS[p.gauge];

  // Top-left: room name, objective, hearts.
  panel(ctx, 12, 10, 318, 66);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2e8d8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`ROOM ${state.roomIndex + 1} · ${state.def.name.toUpperCase()}`, 24, 32);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(state.def.objective, 24, 50);
  for (let i = 0; i < 3; i += 1) {
    const x = 24 + i * 26;
    const y = 64;
    const filled = i < p.hearts;
    ctx.fillStyle = filled ? '#ff6b5e' : '#3a4170';
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.bezierCurveTo(x - 7, y - 4, x - 12, y + 3, x, y + 11);
    ctx.bezierCurveTo(x + 12, y + 3, x + 7, y - 4, x, y + 4);
    ctx.fill();
  }
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('R retry · P pause · M sound', 106, 72);

  // Top-right: score, multiplier, orbs, timer vs par.
  panel(ctx, FIELD.width - 262, 10, 250, 66);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(totalScore.toLocaleString('en-US'), FIELD.width - 24, 36);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '12px system-ui, sans-serif';
  const mult = state.combo > 1 ? `  ×${Math.max(1, state.combo)} COMBO` : '';
  ctx.fillText(`SCORE${mult}`, FIELD.width - 24, 52);
  ctx.fillStyle = state.combo > 1 ? '#ffd76a' : '#aeb4d4';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`◆ ${state.orbsTaken}/2`, FIELD.width - 118, 70);
  ctx.fillStyle = state.time > state.def.par ? '#ff6b5e' : '#aeb4d4';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`${formatTime(state.time)} / par ${formatTime(state.def.par)}`, FIELD.width - 24, 70);

  // Bottom-left: the weight gauge — large, labelled, with its effect spelled out.
  const gx = 12;
  const gy = FIELD.height - 92;
  panel(ctx, gx, gy, 300, 80);
  ctx.textAlign = 'left';
  ctx.fillStyle = w.colour;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`WEIGHT ${p.gauge} · ${w.name}`, gx + 14, gy + 22);
  for (let i = 0; i < 3; i += 1) {
    const bx = gx + 14 + i * 34;
    const by = gy + 32;
    ctx.fillStyle = i < p.gauge ? w.colour : '#2c3050';
    ctx.beginPath();
    ctx.roundRect(bx, by, 28, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#d9b45b';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  // The verb shares its row with the gauge bars: truncate with an ellipsis
  // rather than letting it run under the roster panel.
  let verb = w.verb;
  const verbMax = gx + 300 - 8 - (gx + 124);
  while (verb.length > 1 && ctx.measureText(verb).width > verbMax) {
    verb = verb.replace(/…$/, '');
    const cut = verb.lastIndexOf(' ');
    verb = (cut > 0 ? verb.slice(0, cut) : verb.slice(0, -1)) + '…';
  }
  ctx.fillText(verb, gx + 124, gy + 45);
  ctx.fillStyle = '#f2e8d8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('E steal', gx + 14, gy + 66);
  ctx.fillStyle = '#9fe8ff';
  ctx.fillText('Q give', gx + 62, gy + 66);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('click: left steal · right give', gx + 112, gy + 66);

  // Bottom-right: room progress — nine dots, stars earned, best score.
  const px = FIELD.width - 262;
  const py = FIELD.height - 92;
  panel(ctx, px, py, 250, 80);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('VAULT PROGRESS', px + 14, py + 20);
  for (let i = 0; i < roomCount; i += 1) {
    const dx = px + 18 + i * 26;
    const dy = py + 36;
    const earned = stars[i] || 0;
    const current = i === state.roomIndex;
    ctx.beginPath();
    ctx.arc(dx, dy, current ? 9 : 7, 0, Math.PI * 2);
    ctx.fillStyle = current ? '#ffd76a' : earned > 0 ? '#57e6a8' : '#2c3050';
    ctx.fill();
    ctx.strokeStyle = current ? '#fff3c4' : '#4a5180';
    ctx.lineWidth = current ? 2 : 1;
    ctx.stroke();
    if (earned > 0 && !current) {
      ctx.fillStyle = '#0c0e1c';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(earned), dx, dy + 3);
      ctx.textAlign = 'left';
    }
  }
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(
    best > 0 ? `BEST ${best.toLocaleString('en-US')}` : 'NO BEST YET — FINISH A ROOM',
    px + 14,
    py + 66,
  );
  if (muted) {
    ctx.fillStyle = '#ff9a5c';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('MUTED', px + 236, py + 66);
    ctx.textAlign = 'left';
  }

  // Bottom-centre: the room roster — what is still in this room, at a
  // glance, like the top entries' INCOMING lists: golems left, mines armed,
  // orbs left, weight still held by objects, and whether the gate stands
  // open. The four corners keep their jobs; this strip shows the systems.
  const rx = 324;
  const ry = FIELD.height - 92;
  panel(ctx, rx, ry, 312, 80);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('IN THIS ROOM', rx + 14, ry + 20);
  const golemsLeft = state.golems.filter((g) => g.alive).length;
  const minesArmed = state.mines.filter((m) => m.armed).length;
  const weightHere =
    state.crates.reduce((s, c) => s + c.weight, 0) +
    state.boulders.reduce((s, b) => s + b.weight, 0) +
    state.golems.reduce((s, g) => s + (g.alive ? g.weight : 0), 0);
  ctx.fillStyle = '#f2e8d8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(
    `GOLEMS ${golemsLeft}  ·  MINES ${minesArmed}  ·  ORBS ◆ ${state.orbsTaken}/2`,
    rx + 14,
    ry + 42,
  );
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '11px system-ui, sans-serif';
  const gateLine =
    state.switches.length > 0
      ? state.gateOpen > 0.6
        ? 'GATE OPEN — GO'
        : 'GATE SHUT — FEED THE SWITCH'
      : 'DOOR OPEN — REACH IT';
  ctx.fillText(`WEIGHT HERE ${weightHere}   ·   ${gateLine}`, rx + 14, ry + 66);

  // Combo callout in the centre-top when a chain is running.
  if (state.combo >= 2 && state.comboTimer > 0) {
    const frac = state.comboTimer / SCORE.comboWindow;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#8a5f00';
    ctx.fillText(`COMBO ×${state.combo}`, FIELD.width / 2, 34);
    ctx.fillStyle = '#b98a52';
    ctx.fillRect(FIELD.width / 2 - 50, 42, 100, 5);
    ctx.fillStyle = '#8a5f00';
    ctx.fillRect(FIELD.width / 2 - 50, 42, 100 * frac, 5);
    ctx.restore();
  }

  // The room's hint line, fading after the first seconds of the room. It sits
  // under the top HUD, clear of the action below.
  if (state.time < 6 && state.def.hint) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (6 - state.time) / 1.5);
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = '#2a1f10';
    ctx.shadowColor = '#fff8e0';
    ctx.shadowBlur = 6;
    ctx.fillText(state.def.hint, FIELD.width / 2, 96);
    ctx.restore();
  }
  void time;
  void PALETTE;
}
