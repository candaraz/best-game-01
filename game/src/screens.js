// The screens around the game: the title with its live diorama, the pause
// menu with the weight codex, the room-clear dashboard, the victory screen
// and the retry prompt. Each draw function returns the buttons it painted, so
// the main loop can hit-test clicks against exactly what the player saw.

import { FIELD, WEIGHTS, SCORE } from './config.js';
import { ROOMS } from './levels.js';
import {
  drawBackdrop,
  drawPip,
  drawCrateFigure,
  drawGolemFigure,
  drawMineFigure,
  drawOrbFigure,
  drawDoorFigure,
  drawWorld,
} from './render.js';
import { runShot } from './shots.js';

function chip(ctx, x, y, text, fill = '#2c3050', fg = '#f2e8d8') {
  ctx.save();
  ctx.font = 'bold 12px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 18;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 22, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,180,91,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 12);
  ctx.restore();
  return w;
}

function button(ctx, rect, label, mouse, primary = false) {
  const hover =
    mouse && mouse.x >= rect.x && mouse.x <= rect.x + rect.w && mouse.y >= rect.y && mouse.y <= rect.y + rect.h;
  ctx.save();
  ctx.fillStyle = primary ? (hover ? '#ffd76a' : '#d9b45b') : hover ? '#3a4170' : '#232844';
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.strokeStyle = primary ? '#fff3c4' : 'rgba(217,180,91,0.5)';
  ctx.lineWidth = primary ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = primary ? '#1b1f38' : '#f2e8d8';
  ctx.font = `bold ${primary ? 16 : 14}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
  return hover;
}

function panel(ctx, x, y, w, h, alpha = 0.86) {
  ctx.fillStyle = `rgba(12, 14, 28, ${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217, 180, 91, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** The staged vault scene behind the title: Pip cycles gauges and trades
 *  weight with the crate while a golem patrols and the door glows. */
export function drawDiorama(ctx, time, juice) {
  drawBackdrop(ctx, 0, time);
  const floorY = 472;
  ctx.fillStyle = '#b98a52';
  ctx.fillRect(0, floorY, FIELD.width, FIELD.height - floorY);
  ctx.fillStyle = '#e0b96a';
  ctx.fillRect(0, floorY, FIELD.width, 4);
  ctx.strokeStyle = '#5a4026';
  for (let x = 0; x < FIELD.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, FIELD.height);
    ctx.stroke();
  }
  drawDoorFigure(ctx, 878, floorY - 64, 36, 64, time);
  drawOrbFigure(ctx, 540, 356, time, 0);
  drawOrbFigure(ctx, 700, 300, time, 1.7);
  const gauge = Math.floor(time / 2.2) % 4;
  drawCrateFigure(ctx, 640, floorY - 36, 36, 36, { weight: 3 - gauge, maxWeight: 3, time });
  drawMineFigure(ctx, 760, floorY - 30, 30, 30, { armed: gauge < 2, time });
  const golemX = 800 + Math.sin(time * 0.5) * 40;
  drawGolemFigure(ctx, golemX, floorY - 46, 40, 46, {
    dir: Math.cos(time * 0.5) > 0 ? 1 : -1,
    time,
    alive: true,
  });
  drawPip(ctx, 560, floorY, {
    gauge,
    facing: 1,
    squash: 0,
    stretch: 0,
    runPhase: 0,
    airborne: gauge === 0,
    invuln: 0,
    time,
  });
  // A beam arcs between Pip and the crate on a slow loop.
  const cycle = time % 4.4;
  if (cycle < 0.5) {
    const stealing = Math.floor(time / 4.4) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = 1 - cycle / 0.5;
    ctx.strokeStyle = stealing ? '#ffd76a' : '#9fe8ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = stealing ? '#ffd76a' : '#9fe8ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(560, floorY - 30);
    ctx.quadraticCurveTo(610, floorY - 70, 658, floorY - 22);
    ctx.stroke();
    ctx.restore();
  }
  juice.draw(ctx);
}

/** The title's live mini-board: the cover staging of room 3, rendered by
 *  the real game code and frozen at the steal. Computed once and cached —
 *  the staging is deterministic (seed 1), so the title frame replays
 *  identically. No juice particles: they use Math.random, which the
 *  staging seed does not cover here. */
let previewCache = null;
function getPreview() {
  if (!previewCache) {
    const staged = runShot('cover', 1, (w) => {
      w.drainEvents();
    });
    previewCache = staged;
  }
  return previewCache;
}

const ROOM_LINES = [
  'smash the cracked bridge',
  'float the golden shaft',
  'pop both golems',
  'fizzle every mine',
  'cross the wind, ride up',
  'weigh the switch',
  'smash down, open the gate',
  'golem, mines, gale, gate',
  'weigh in, float up, smash down',
];

export function drawTitle(ctx, opts) {
  const { time, juice, best, totalStars, unlocked, selected, showHelp, mouse } = opts;
  drawDiorama(ctx, time, juice);
  const buttons = [];
  panel(ctx, 36, 28, 452, 548);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('BALLAST', 60, 100);
  ctx.fillStyle = '#f2e8d8';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Steal weight. Give it back.', 60, 130);
  ctx.fillText('Change what you are.', 60, 152);
  // Content inventory: the game sells itself in frame 1 — counts, not
  // adjectives. Totals are the real ones from the nine room grids.
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('9 ROOMS · 18 ORBS · 27 STARS · 4 WEIGHTS', 60, 178);
  ctx.fillText('5 GOLEMS · 6 MINES · 5 BOULDERS · 17 CRATES', 60, 196);
  ctx.fillStyle = '#f2e8d8';
  ctx.fillText('WIN: reach the door.  LOSE: all 3 hearts in a room.', 60, 214);

  // The four states, as a strip the eye can read in one glance.
  let sx = 60;
  for (let g = 0; g < 4; g += 1) {
    const st = WEIGHTS[g];
    ctx.fillStyle = st.colour;
    ctx.beginPath();
    ctx.roundRect(sx, 232, 92, 46, 6);
    ctx.fill();
    ctx.fillStyle = '#1b1f38';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${g} · ${st.name}`, sx + 46, 250);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(g === 0 ? 'FLOATS' : g === 1 ? 'BALANCED' : g === 2 ? 'PUSHES' : 'SMASHES', sx + 46, 266);
    sx += 100;
  }
  ctx.textAlign = 'left';

  // Bests.
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(
    best > 0
      ? `BEST SCORE  ${best.toLocaleString('en-US')}      STARS  ${totalStars}/27`
      : 'No vault cleared yet — the first room teaches the trade.',
    60,
    300,
  );

  // Controls.
  let cx = 60;
  cx += chip(ctx, cx, 316, '← →  move') + 8;
  cx += chip(ctx, cx, 316, 'SPACE  jump') + 8;
  cx += chip(ctx, cx, 316, 'E  steal') + 8;
  cx += chip(ctx, cx, 316, 'Q  give') + 8;
  chip(ctx, cx, 316, 'P  pause');
  cx = 60;
  cx += chip(ctx, cx, 346, 'CLICK left steal · right give') + 8;
  chip(ctx, cx, 346, 'R  retry room');

  // Room select.
  ctx.fillStyle = '#f2e8d8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('CHOOSE A ROOM', 60, 384);
  for (let i = 0; i < 9; i += 1) {
    const bx = 60 + i * 44;
    const by = 394;
    const locked = i >= unlocked;
    const rect = { x: bx, y: by, w: 36, h: 36 };
    ctx.fillStyle = locked ? '#1b1f38' : i === selected ? '#ffd76a' : '#232844';
    ctx.beginPath();
    ctx.roundRect(bx, by, 36, 36, 7);
    ctx.fill();
    ctx.strokeStyle = locked ? '#2c3050' : 'rgba(217,180,91,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = locked ? '#4a5180' : i === selected ? '#1b1f38' : '#f2e8d8';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(locked ? '·' : String(i + 1), bx + 18, by + 19);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    if (!locked) buttons.push({ id: `room-${i}`, ...rect });
  }

  const startRect = { x: 60, y: 446, w: 404, h: 46 };
  button(ctx, startRect, selected === 0 ? 'ENTER THE VAULT' : `START AT ROOM ${selected + 1}`, mouse, true);
  buttons.push({ id: 'start', ...startRect });
  const helpRect = { x: 60, y: 500, w: 196, h: 32 };
  button(ctx, helpRect, showHelp ? 'HIDE THE CODEX' : 'HOW TO PLAY', mouse, false);
  buttons.push({ id: 'help', ...helpRect });
  const muteRect = { x: 268, y: 500, w: 196, h: 32 };
  button(ctx, muteRect, opts.muted ? 'SOUND: OFF' : 'SOUND: ON', mouse, false);
  buttons.push({ id: 'mute', ...muteRect });

  if (showHelp) {
    panel(ctx, 512, 28, 412, 548);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('THE WEIGHT CODEX', 536, 64);
    drawCodex(ctx, 536, 80, 364);
  } else {
    // Right column: a live gameplay vignette above the room list, so the
    // title screen shows the game being played, not just its menu.
    panel(ctx, 512, 28, 412, 300);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('LIVE FROM ROOM 3 — HOLLOW PATROL', 536, 56);
    const preview = getPreview();
    ctx.save();
    ctx.beginPath();
    ctx.rect(524, 64, 388, 242);
    ctx.clip();
    ctx.translate(524, 64);
    const scale = 388 / FIELD.width;
    ctx.scale(scale, scale);
    drawWorld(ctx, preview.world, preview.juice, preview.time, preview.world.targets());
    ctx.restore();
    ctx.fillStyle = '#aeb4d4';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Pip just popped a golem — steal, then give it back.', 536, 322);

    panel(ctx, 512, 340, 412, 236);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('THE NINE ROOMS', 536, 368);
    ctx.font = '12px system-ui, sans-serif';
    for (let i = 0; i < 9; i += 1) {
      const y = 390 + i * 17;
      ctx.fillStyle = '#ffd76a';
      ctx.fillText(`${i + 1}. ${ROOMS[i].name.toUpperCase()}`, 536, y);
      ctx.fillStyle = '#aeb4d4';
      ctx.fillText(`— ${ROOM_LINES[i]}`, 536 + 168, y);
    }
    ctx.fillStyle = '#f2e8d8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('E STEAL  ·  Q GIVE — ONE GAUGE, FOUR BODIES.', 536, 556);
  }
  return { buttons };
}

export function drawCodex(ctx, x, y, w) {
  const rows = [
    ['0 · FEATHER', 'Floats on a breath. Huge jumps, tossed by gales, rides updrafts. Cannot push.'],
    ['1 · BALANCED', 'The travelling weight. Steady jumps, some wind resistance. The default.'],
    ['2 · HEAVY', 'Pushes crates, holds switches down, stands firm in a gale. Shorter jumps.'],
    ['3 · ANCHOR', 'Ignores wind. Smashes cracked floors on a hard landing. Barely jumps.'],
  ];
  let ry = y;
  ctx.textAlign = 'left';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = WEIGHTS[i].colour;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(rows[i][0], x, ry + 14);
    ctx.fillStyle = '#aeb4d4';
    ctx.font = '12px system-ui, sans-serif';
    wrapText(ctx, rows[i][1], x, ry + 30, w, 15);
    ry += 52;
  }
  const rules = [
    'E steals 1 weight from the nearest crate, boulder or golem.',
    'Q gives 1 weight back — to a crate, a boulder, or a live mine.',
    'A golem with nothing left pops. A fed mine fizzles harmlessly.',
    'Switches open gates when the resting weight on them reaches 2.',
    'Chain transfers within 3 seconds to raise the score multiplier.',
    'Stars: clear the room · take every orb · beat par with no damage.',
  ];
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('THE RULES OF THE TRADE', x, ry + 16);
  ctx.fillStyle = '#f2e8d8';
  ctx.font = '12px system-ui, sans-serif';
  let ly = ry + 34;
  for (const rule of rules) {
    ctx.fillText('·  ' + rule, x, ly);
    ly += 19;
  }
  return ly;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

export function drawPause(ctx, opts) {
  const { mouse } = opts;
  ctx.fillStyle = 'rgba(8, 10, 20, 0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 240, 48, 480, 504);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('PAUSED', 268, 92);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('The vault waits. The weight does not.', 268, 112);
  drawCodex(ctx, 268, 128, 424);
  const buttons = [];
  const resumeRect = { x: 268, y: 452, w: 424, h: 40 };
  button(ctx, resumeRect, 'RESUME  (P)', mouse, true);
  buttons.push({ id: 'resume', ...resumeRect });
  const retryRect = { x: 268, y: 500, w: 204, h: 34 };
  button(ctx, retryRect, 'RETRY ROOM  (R)', mouse, false);
  buttons.push({ id: 'retry', ...retryRect });
  const titleRect = { x: 484, y: 500, w: 208, h: 34 };
  button(ctx, titleRect, 'TITLE SCREEN', mouse, false);
  buttons.push({ id: 'title', ...titleRect });
  return { buttons };
}

export function drawClear(ctx, opts) {
  const { room, stars, breakdown, t, mouse, isLast } = opts;
  ctx.fillStyle = 'rgba(8, 10, 20, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 260, 84, 440, 432);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#57e6a8';
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.fillText('ROOM CLEAR!', FIELD.width / 2, 134);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`ROOM ${room.index + 1} · ${room.name.toUpperCase()}`, FIELD.width / 2, 156);
  // Stars stamp in one by one.
  for (let i = 0; i < 3; i += 1) {
    const reveal = t > 0.35 + i * 0.3;
    const earned = i < stars;
    const scale = reveal ? 1 + Math.max(0, 0.4 - (t - 0.35 - i * 0.3) * 1.4) : 0.6;
    const sx = FIELD.width / 2 + (i - 1) * 76;
    ctx.save();
    ctx.translate(sx, 196);
    ctx.scale(scale, scale);
    ctx.globalAlpha = reveal ? 1 : 0.25;
    drawStar(ctx, 0, 0, 26, earned ? '#ffd76a' : '#3a4170');
    ctx.restore();
  }
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#aeb4d4';
  ctx.fillText('CLEAR', FIELD.width / 2 - 76, 236);
  ctx.fillText('ALL ORBS', FIELD.width / 2, 236);
  ctx.fillText('PAR + CLEAN', FIELD.width / 2 + 76, 236);
  // Breakdown.
  const rows = [
    ['Room score', breakdown.roomScore],
    ['Time bonus', breakdown.timeBonus],
    ['No-damage bonus', breakdown.noDamageBonus],
    ['TOTAL SCORE', breakdown.totalScore],
  ];
  let ry = 268;
  ctx.textAlign = 'left';
  for (const [label, value] of rows) {
    const isTotal = label === 'TOTAL SCORE';
    ctx.fillStyle = isTotal ? '#ffd76a' : '#f2e8d8';
    ctx.font = `${isTotal ? 'bold ' : ''}15px system-ui, sans-serif`;
    ctx.fillText(label, 300, ry);
    ctx.textAlign = 'right';
    ctx.fillText(value.toLocaleString('en-US'), 660, ry);
    ctx.textAlign = 'left';
    ry += 28;
  }
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${breakdown.timeText}  ·  orbs ${breakdown.orbs}/2  ·  ${breakdown.damageTaken ? 'took damage' : 'no damage'}`,
    FIELD.width / 2,
    ry + 4,
  );
  const buttons = [];
  const nextRect = { x: 300, y: 424, w: 360, h: 44 };
  button(ctx, nextRect, isLast ? 'OPEN THE VAULT' : 'NEXT ROOM  →', mouse, true);
  buttons.push({ id: 'next', ...nextRect });
  const retryRect = { x: 300, y: 476, w: 172, h: 32 };
  button(ctx, retryRect, 'REPLAY ROOM', mouse, false);
  buttons.push({ id: 'replay', ...retryRect });
  const titleRect = { x: 488, y: 476, w: 172, h: 32 };
  button(ctx, titleRect, 'TITLE SCREEN', mouse, false);
  buttons.push({ id: 'title', ...titleRect });
  return { buttons };
}

function drawStar(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawVictory(ctx, opts) {
  const { totalScore, totalStars, totalTime, best, isNewBest, perRoom, mouse } = opts;
  ctx.fillStyle = 'rgba(8, 10, 20, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 220, 44, 520, 512);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('THE VAULT IS OPEN', FIELD.width / 2, 96);
  ctx.fillStyle = '#f2e8d8';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Nine rooms. Every weight accounted for. Pip keeps the last one.', FIELD.width / 2, 120);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(totalScore.toLocaleString('en-US'), FIELD.width / 2, 168);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', FIELD.width / 2, 188);
  if (isNewBest) {
    ctx.fillStyle = '#57e6a8';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('★ NEW BEST ★', FIELD.width / 2, 210);
  } else {
    ctx.fillText(`BEST ${best.toLocaleString('en-US')}`, FIELD.width / 2, 210);
  }
  // Per-room star table.
  let ty = 240;
  ctx.textAlign = 'left';
  ctx.font = '13px system-ui, sans-serif';
  for (let i = 0; i < 9; i += 1) {
    const y = ty + i * 22;
    ctx.fillStyle = '#aeb4d4';
    ctx.fillText(`${i + 1}. ${perRoom[i].name}`, 280, y);
    ctx.textAlign = 'right';
    for (let s = 0; s < 3; s += 1) {
      drawStar(ctx, 640 + s * 20, y - 4, 7, s < perRoom[i].stars ? '#ffd76a' : '#3a4170');
    }
    ctx.fillStyle = '#f2e8d8';
    ctx.fillText(perRoom[i].score.toLocaleString('en-US'), 620, y);
    ctx.textAlign = 'left';
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '12px system-ui, sans-serif';
  const mins = Math.floor(totalTime / 60);
  const secs = Math.floor(totalTime % 60);
  ctx.fillText(
    `STARS ${totalStars}/27   ·   TIME ${mins}:${String(secs).padStart(2, '0')}   ·   NEXT GOAL: ${totalStars < 27 ? 'replay a room for its missing stars' : 'a perfect vault — every star earned'}`,
    FIELD.width / 2,
    452,
  );
  const buttons = [];
  const againRect = { x: 300, y: 472, w: 360, h: 44 };
  button(ctx, againRect, 'PLAY AGAIN', mouse, true);
  buttons.push({ id: 'again', ...againRect });
  const titleRect = { x: 300, y: 524, w: 360, h: 28 };
  button(ctx, titleRect, 'TITLE SCREEN', mouse, false);
  buttons.push({ id: 'title', ...titleRect });
  return { buttons };
}

export function drawFailed(ctx, opts) {
  const { mouse, cause } = opts;
  // Name the cause: a failure the player understands is a lesson, not a wall.
  const causeLine =
    cause === 'golem'
      ? 'A golem caught you — steal its weight first.'
      : cause === 'mine'
        ? 'A live mine caught you — feed it weight first.'
        : cause === 'pit'
          ? 'The pit took a heart. Mind the gaps.'
          : 'The vault resets the room. The weight resets too.';
  ctx.fillStyle = 'rgba(8, 10, 20, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 300, 208, 360, 184);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b5e';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('OUT OF HEARTS', FIELD.width / 2, 252);
  ctx.fillStyle = '#aeb4d4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(causeLine, FIELD.width / 2, 278);
  const buttons = [];
  const retryRect = { x: 340, y: 300, w: 280, h: 42 };
  button(ctx, retryRect, 'TRY AGAIN  (R)', mouse, true);
  buttons.push({ id: 'retry', ...retryRect });
  const titleRect = { x: 340, y: 350, w: 280, h: 30 };
  button(ctx, titleRect, 'TITLE SCREEN', mouse, false);
  buttons.push({ id: 'title', ...titleRect });
  return { buttons };
}

export { SCORE };
