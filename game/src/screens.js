// Screens: title, pause, room clear, seal choice, victory, failure, and
// the how-to codex. Each draw function returns the buttons it drew so the
// main loop can route clicks; keyboard shortcuts live in main.js.

import { PALETTE, SEALS, VIEW, WEIGHT_EFFECTS, WEIGHT_NAMES } from './config.js';
import { drawPlayer, drawWorld, drawVignette, roundRect } from './render.js';
import { drawJuiceWorld } from './juice.js';
import { LEVELS } from './levels.js';

const FONT = '"Avenir Next", "Segoe UI", Verdana, sans-serif';

function drawStar(ctx, cx, cy, r, filled, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? PALETTE.gold : 'rgba(255, 255, 255, 0.18)';
  ctx.fill();
  ctx.strokeStyle = filled ? '#8a6a14' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function button(ctx, x, y, w, h, label, opts = {}) {
  const hover = opts.hover || false;
  ctx.fillStyle = opts.primary ? (hover ? '#ffd94d' : PALETTE.gold) : hover ? 'rgba(60, 68, 110, 0.95)' : 'rgba(26, 32, 68, 0.95)';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = opts.primary ? '#8a6a14' : 'rgba(106, 116, 168, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = opts.primary ? PALETTE.ink : PALETTE.parchment;
  ctx.font = `bold ${opts.small ? 14 : 17}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + (opts.small ? 5 : 6));
  return { id: opts.id, x, y, w, h };
}

function dim(ctx, alpha = 0.62) {
  ctx.fillStyle = `rgba(5, 7, 18, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function panelBox(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(13, 17, 41, 0.96)';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawTitleDiorama(ctx, game, time) {
  // The live room behind the title: room 3, staged mid-steal.
  drawWorld(ctx, game.diorama, game.dioramaJuice, time);
  drawJuiceWorld(ctx, game.dioramaJuice);
  drawVignette(ctx);
}

export function drawTitle(ctx, game, time) {
  drawTitleDiorama(ctx, game, time);
  dim(ctx, 0.45);
  const buttons = [];
  const mouse = game.input.mouse;

  // Left: logo + rules.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 68px ${FONT}`;
  ctx.fillText('BALLAST', 44, 108);
  ctx.fillStyle = PALETTE.cyan;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('A  W E I G H T - T H I E F ’ S  T A L E', 46, 136);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `15px ${FONT}`;
  ctx.fillText('9 rooms  ·  27 stars  ·  6 seals  ·  4 weights  ·  1 vault', 46, 162);

  const rules = [
    ['GOAL', 'Open the vault: clear all 9 rooms and reach the last door.'],
    ['STEAL', 'E takes weight from crates, boulders, golems and mines.'],
    ['GIVE', 'Q returns weight. Heavy crates press plates; heavy boulders smash.'],
    ['WIN', 'Reach the glowing door.'],
    ['LOSE', 'Lose all 3 hearts in a room — the room resets.'],
  ];
  let ry = 196;
  for (const [label, text] of rules) {
    ctx.fillStyle = label === 'WIN' ? PALETTE.cyan : label === 'LOSE' ? PALETTE.danger : PALETTE.gold;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(label, 46, ry);
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(text, 118, ry);
    ry += 26;
  }

  // The four weight states, drawn with the real player renderer.
  ctx.fillStyle = 'rgba(7, 10, 24, 0.8)';
  roundRect(ctx, 44, 336, 470, 116, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(106, 116, 168, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('THE FOUR WEIGHTS — YOUR BODY CHANGES WITH THE GAUGE', 58, 358);
  for (let g = 0; g < 4; g += 1) {
    const px = 84 + g * 118;
    const fake = {
      x: px - 15, y: 372, w: 30, h: 42, gauge: g, facing: 1, vx: 0,
      squashX: 1, squashY: 1, invuln: 0, onGround: true, hideTag: true,
    };
    drawPlayer(ctx, fake, time);
    ctx.fillStyle = 'rgba(242, 231, 201, 0.85)';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(WEIGHT_NAMES[g], px, 442);
  }

  // Key chips.
  ctx.textAlign = 'left';
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = 'rgba(242, 231, 201, 0.8)';
  ctx.fillText('← →  move      SPACE  jump      E  steal      Q  give      P  pause      M  mute', 46, 474);

  // Right: room select + bests + start.
  panelBox(ctx, 548, 40, 368, 520);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('CHOOSE A ROOM', 570, 70);
  const totalStars = Object.values(game.save.stars).reduce((a, b) => a + b, 0);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`★ ${totalStars}/27`, 894, 70);
  for (let i = 0; i < 9; i += 1) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = 570 + col * 112;
    const by = 84 + row * 86;
    const unlocked = i < game.save.unlocked;
    const stars = game.save.stars[i] || 0;
    const hover = unlocked && mouse.x >= bx && mouse.x <= bx + 100 && mouse.y >= by && mouse.y <= by + 74;
    ctx.fillStyle = unlocked ? (hover ? 'rgba(60, 68, 110, 0.95)' : 'rgba(26, 32, 68, 0.95)') : 'rgba(16, 20, 46, 0.9)';
    roundRect(ctx, bx, by, 100, 74, 8);
    ctx.fill();
    ctx.strokeStyle = unlocked ? 'rgba(106, 116, 168, 0.7)' : 'rgba(106, 116, 168, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    if (unlocked) {
      ctx.fillStyle = PALETTE.parchment;
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillText(`${i + 1}`, bx + 50, by + 26);
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
      ctx.fillText(LEVELS[i].name, bx + 50, by + 42);
      for (let s = 0; s < 3; s += 1) drawStar(ctx, bx + 34 + s * 16, by + 58, 6, s < stars);
      buttons.push({ id: `room:${i}`, x: bx, y: by, w: 100, h: 74 });
    } else {
      ctx.fillStyle = 'rgba(242, 231, 201, 0.4)';
      ctx.font = '20px ' + FONT;
      ctx.fillText('🔒', bx + 50, by + 34);
      ctx.font = `11px ${FONT}`;
      ctx.fillText('locked', bx + 50, by + 54);
    }
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `14px ${FONT}`;
  ctx.fillText(`BEST SCORE  ★ ${game.save.best}`, 570, 366);
  ctx.fillText(`ROOMS OPEN  ${game.save.unlocked}/9`, 570, 388);
  if (game.save.runs.length > 0) {
    const last = game.save.runs[0];
    ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
    ctx.fillText(`LAST RUN  ★ ${last.score} · ${last.stars} stars`, 570, 410);
  }

  const startHover = mouse.x >= 570 && mouse.x <= 894 && mouse.y >= 430 && mouse.y <= 478;
  buttons.push(button(ctx, 570, 430, 324, 48, '▶  START THE HEIST', { primary: true, hover: startHover, id: 'start' }));
  const howHover = mouse.x >= 570 && mouse.x <= 894 && mouse.y >= 488 && mouse.y <= 522;
  buttons.push(button(ctx, 570, 488, 324, 34, 'HOW TO PLAY', { hover: howHover, small: true, id: 'howto' }));
  const muteHover = mouse.x >= 570 && mouse.x <= 894 && mouse.y >= 530 && mouse.y <= 552;
  buttons.push(button(ctx, 570, 530, 324, 22, game.save.muted ? 'SOUND: OFF (M)' : 'SOUND: ON (M)', { hover: muteHover, small: true, id: 'mute' }));
  return buttons;
}

export function drawPause(ctx, game) {
  dim(ctx, 0.7);
  panelBox(ctx, 230, 90, 500, 420);
  const buttons = [];
  const mouse = game.input.mouse;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillText('PAUSED', 480, 140);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('WEIGHT CODEX', 260, 176);
  for (let g = 0; g < 4; g += 1) {
    const y = 196 + g * 26;
    ctx.fillStyle = PALETTE.cyan;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(`${g} · ${WEIGHT_NAMES[g]}`, 260, y);
    ctx.fillStyle = 'rgba(242, 231, 201, 0.8)';
    ctx.font = `13px ${FONT}`;
    ctx.fillText(WEIGHT_EFFECTS[g], 390, y);
  }
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText('CONTROLS', 260, 322);
  ctx.fillStyle = 'rgba(242, 231, 201, 0.8)';
  ctx.font = `13px ${FONT}`;
  ctx.fillText('← → / A D move · SPACE / W jump · E steal · Q give', 260, 344);
  ctx.fillText('Mouse: left-click steal · right-click give · R retry room', 260, 364);
  ctx.fillText('M mute · P / ESC resume', 260, 384);
  const mk = (y, label, id, primary) => {
    const hover = mouse.x >= 260 && mouse.x <= 700 && mouse.y >= y && mouse.y <= y + 34;
    buttons.push(button(ctx, 260, y, 440, 34, label, { hover, small: true, id, primary }));
  };
  mk(402, 'RESUME', 'resume', true);
  mk(442, 'RESTART ROOM', 'restart', false);
  // Second row of small buttons.
  const muteHover = mouse.x >= 260 && mouse.x <= 470 && mouse.y >= 482 && mouse.y <= 506;
  buttons.push(button(ctx, 260, 482, 210, 24, game.save.muted ? 'SOUND: OFF' : 'SOUND: ON', { hover: muteHover, small: true, id: 'mute' }));
  const titleHover = mouse.x >= 490 && mouse.x <= 700 && mouse.y >= 482 && mouse.y <= 506;
  buttons.push(button(ctx, 490, 482, 210, 24, 'TITLE SCREEN', { hover: titleHover, small: true, id: 'title' }));
  return buttons;
}

export function drawClear(ctx, game, t) {
  dim(ctx, 0.55);
  panelBox(ctx, 280, 110, 400, 380);
  const buttons = [];
  const mouse = game.input.mouse;
  const clear = game.clearState;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText('ROOM CLEAR!', 480, 158);
  ctx.fillStyle = 'rgba(242, 231, 201, 0.8)';
  ctx.font = `14px ${FONT}`;
  ctx.fillText(`${game.world.level.name} · ${clear.timeText}`, 480, 182);
  // Stars pop in one by one.
  for (let s = 0; s < 3; s += 1) {
    const local = t - 0.25 - s * 0.28;
    const scale = local <= 0 ? 0 : local < 0.18 ? local / 0.18 : 1 + Math.max(0, 0.25 - (local - 0.18)) * 0.6;
    drawStar(ctx, 408 + s * 72, 226, 26, s < clear.stars, Math.max(0.01, scale));
  }
  ctx.textAlign = 'left';
  ctx.font = `15px ${FONT}`;
  const lines = [
    ['Orbs & takedowns', clear.earnedText],
    ['Clear bonus', `+${clear.clearBonus}`],
    ['Time bonus', `+${clear.timeBonus}`],
    ['Room total', `★ ${clear.roomScore}`],
  ];
  lines.forEach(([label, value], i) => {
    const y = 284 + i * 26;
    ctx.fillStyle = i === 3 ? PALETTE.gold : PALETTE.parchment;
    ctx.font = i === 3 ? `bold 16px ${FONT}` : `15px ${FONT}`;
    ctx.fillText(label, 320, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, 640, y);
    ctx.textAlign = 'left';
  });
  const nextLabel = game.world.levelIndex === 8 ? 'SEE THE VAULT →' : (game.world.levelIndex === 2 || game.world.levelIndex === 5) ? 'CHOOSE A SEAL →' : 'NEXT ROOM →';
  const nextHover = mouse.x >= 320 && mouse.x <= 640 && mouse.y >= 396 && mouse.y <= 436;
  buttons.push(button(ctx, 320, 396, 320, 40, nextLabel, { primary: true, hover: nextHover, id: 'next' }));
  const replayHover = mouse.x >= 320 && mouse.x <= 640 && mouse.y >= 446 && mouse.y <= 474;
  buttons.push(button(ctx, 320, 446, 320, 28, 'REPLAY ROOM', { hover: replayHover, small: true, id: 'replay' }));
  return buttons;
}

export function drawSeals(ctx, game) {
  dim(ctx, 0.72);
  const buttons = [];
  const mouse = game.input.mouse;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cyan;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText('THE VAULT OFFERS A SEAL', 480, 108);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `15px ${FONT}`;
  ctx.fillText('Choose one. It lasts for the whole run. Click a card or press 1, 2 or 3.', 480, 134);
  const options = game.sealChoice;
  options.forEach((seal, i) => {
    const x = 150 + i * 230;
    const y = 170;
    const hover = mouse.x >= x && mouse.x <= x + 200 && mouse.y >= y && mouse.y <= y + 280;
    ctx.fillStyle = hover ? 'rgba(38, 46, 88, 0.98)' : 'rgba(19, 24, 52, 0.98)';
    roundRect(ctx, x, y, 200, 280, 12);
    ctx.fill();
    ctx.strokeStyle = hover ? PALETTE.gold : 'rgba(106, 116, 168, 0.7)';
    ctx.lineWidth = hover ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.cyan;
    ctx.font = '44px ' + FONT;
    ctx.fillText(seal.icon, x + 100, y + 66);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText(seal.name, x + 100, y + 102);
    // Wrapped blurb.
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = `14px ${FONT}`;
    const words = seal.blurb.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > 168 && line) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((ln, li) => ctx.fillText(ln, x + 100, y + 132 + li * 20));
    ctx.fillStyle = 'rgba(242, 231, 201, 0.6)';
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(`PRESS ${i + 1}`, x + 100, y + 258);
    buttons.push({ id: `seal:${i}`, x, y, w: 200, h: 280 });
  });
  ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`Run score ★ ${game.run.score} · ${game.run.starsTotal} stars so far`, 480, 486);
  return buttons;
}

function gradeFor(stars) {
  if (stars >= 27) return 'S';
  if (stars >= 24) return 'A';
  if (stars >= 18) return 'B';
  return 'C';
}

function nextGoalText(run) {
  if (run.starsTotal < 27) return `NEXT GOAL: ${27 - run.starsTotal} more star${27 - run.starsTotal === 1 ? '' : 's'} — grab every orb and beat every par.`;
  if (run.score < run.best) return 'NEXT GOAL: beat your best score with longer combos.';
  return 'NEXT GOAL: the vault is yours. Defend the crown.';
}

export function drawVictory(ctx, game) {
  dim(ctx, 0.6);
  panelBox(ctx, 110, 36, 740, 528);
  const buttons = [];
  const mouse = game.input.mouse;
  const run = game.run;
  const grade = gradeFor(run.starsTotal);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillText('THE VAULT OPENS', 480, 96);
  ctx.fillStyle = 'rgba(242, 231, 201, 0.8)';
  ctx.font = `14px ${FONT}`;
  ctx.fillText('Pip the weight-thief walks out heavier with gold — and lighter with pride.', 480, 120);

  // Grade letter.
  ctx.fillStyle = 'rgba(7, 10, 24, 0.8)';
  roundRect(ctx, 150, 140, 110, 110, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 72px ${FONT}`;
  ctx.fillText(grade, 205, 222);
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
  ctx.fillText('GRADE', 205, 242);

  // Score block.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(`★ ${run.score}`, 284, 176);
  if (run.score >= run.best && run.score > 0) {
    ctx.fillStyle = PALETTE.cyan;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText('★ NEW BEST ★', 284, 200);
  }
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `15px ${FONT}`;
  ctx.fillText(`${run.starsTotal}/27 stars · ${run.timeText} · best combo ×${run.bestCombo}`, 284, 226);

  // Per-room star table.
  ctx.fillStyle = 'rgba(7, 10, 24, 0.8)';
  roundRect(ctx, 150, 268, 660, 74, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('ROOM STARS', 164, 286);
  for (let i = 0; i < 9; i += 1) {
    const cx = 200 + i * 68;
    ctx.fillStyle = 'rgba(242, 231, 201, 0.6)';
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, cx, 302);
    const stars = run.roomStars[i] || 0;
    for (let s = 0; s < 3; s += 1) drawStar(ctx, cx - 14 + s * 14, 322, 6, s < stars);
  }

  // Stats grid.
  const stats = [
    ['Transfers', run.transfers],
    ['Golems popped', run.pops],
    ['Mines disarmed', run.disarms],
    ['Smashes', run.smashes],
    ['Orbs', `${run.orbsTaken}/18`],
    ['Seals', run.sealsTaken],
  ];
  stats.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 150 + col * 226;
    const y = 356 + row * 40;
    ctx.fillStyle = 'rgba(7, 10, 24, 0.8)';
    roundRect(ctx, x, y, 212, 32, 8);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(242, 231, 201, 0.75)';
    ctx.font = `13px ${FONT}`;
    ctx.fillText(label, x + 12, y + 21);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(String(value), x + 200, y + 21);
  });

  // Run history (left) + next goal (right, two lines).
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(242, 231, 201, 0.7)';
  ctx.font = `bold 12px ${FONT}`;
  ctx.fillText('RECENT RUNS', 150, 452);
  ctx.font = `13px ${FONT}`;
  game.save.runs.slice(0, 3).forEach((r, i) => {
    ctx.fillStyle = 'rgba(242, 231, 201, 0.75)';
    ctx.fillText(`★ ${r.score} · ${r.stars} stars · ${r.time}`, 150, 470 + i * 18);
  });
  const goalParts = nextGoalText(run).split(' — ');
  ctx.fillStyle = PALETTE.cyan;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText(goalParts[0], 480, 466);
  if (goalParts[1]) {
    ctx.fillStyle = 'rgba(242, 231, 201, 0.85)';
    ctx.font = `13px ${FONT}`;
    ctx.fillText(goalParts[1], 480, 486);
  }

  const againHover = mouse.x >= 280 && mouse.x <= 470 && mouse.y >= 514 && mouse.y <= 552;
  buttons.push(button(ctx, 280, 514, 190, 38, 'PLAY AGAIN', { primary: true, hover: againHover, id: 'again' }));
  const titleHover = mouse.x >= 490 && mouse.x <= 680 && mouse.y >= 514 && mouse.y <= 552;
  buttons.push(button(ctx, 490, 514, 190, 38, 'TITLE SCREEN', { hover: titleHover, id: 'title' }));
  return buttons;
}

export function drawFailed(ctx, game) {
  dim(ctx, 0.68);
  panelBox(ctx, 280, 150, 400, 300);
  const buttons = [];
  const mouse = game.input.mouse;
  const causeText = {
    golem: 'A golem caught you.',
    mine: 'A mine exploded.',
    pit: 'You fell into the dark.',
  }[game.world.failCause] || 'The vault wins this round.';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText('THE VAULT HOLDS', 480, 204);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `16px ${FONT}`;
  ctx.fillText(causeText, 480, 234);
  ctx.fillStyle = 'rgba(242, 231, 201, 0.75)';
  ctx.font = `14px ${FONT}`;
  ctx.fillText(`Room ${game.world.levelIndex + 1} · ${game.world.level.name} — all 3 hearts lost.`, 480, 260);
  ctx.fillText('The room resets. Your run score is kept.', 480, 282);
  const retryHover = mouse.x >= 320 && mouse.x <= 640 && mouse.y >= 312 && mouse.y <= 352;
  buttons.push(button(ctx, 320, 312, 320, 40, 'RETRY ROOM', { primary: true, hover: retryHover, id: 'retry' }));
  const titleHover = mouse.x >= 320 && mouse.x <= 640 && mouse.y >= 364 && mouse.y <= 392;
  buttons.push(button(ctx, 320, 364, 320, 28, 'TITLE SCREEN', { hover: titleHover, small: true, id: 'title' }));
  return buttons;
}

export function drawHowto(ctx, game) {
  dim(ctx, 0.75);
  panelBox(ctx, 220, 80, 520, 440);
  const buttons = [];
  const mouse = game.input.mouse;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText('HOW TO PLAY', 480, 126);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText('THE IDEA', 250, 158);
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = 'rgba(242, 231, 201, 0.85)';
  ctx.fillText('You are Pip, a thief who steals weight itself. E pulls weight', 250, 180);
  ctx.fillText('out of the world into your gauge; Q puts it back. Your body', 250, 200);
  ctx.fillText('changes with the gauge — and so does what the world lets you do.', 250, 220);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText('THE FOUR WEIGHTS', 250, 252);
  for (let g = 0; g < 4; g += 1) {
    const y = 274 + g * 24;
    ctx.fillStyle = PALETTE.cyan;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(`${g} · ${WEIGHT_NAMES[g]}`, 250, y);
    ctx.fillStyle = 'rgba(242, 231, 201, 0.85)';
    ctx.font = `13px ${FONT}`;
    ctx.fillText(WEIGHT_EFFECTS[g], 370, y);
  }
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `bold 14px ${FONT}`;
  ctx.fillText('SCORING', 250, 388);
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = 'rgba(242, 231, 201, 0.85)';
  ctx.fillText('Orbs +100 · golem pops +150 · mine disarms +100 · smashes +150.', 250, 408);
  ctx.fillText('Chain scoring events within 3 seconds for ×2 and ×3 combos.', 250, 428);
  ctx.fillText('Each room: 3 stars — clear, both orbs, beat par time.', 250, 448);
  const backHover = mouse.x >= 350 && mouse.x <= 610 && mouse.y >= 466 && mouse.y <= 500;
  buttons.push(button(ctx, 350, 466, 260, 34, 'BACK', { primary: true, hover: backHover, small: true, id: 'back' }));
  void game;
  return buttons;
}

export { SEALS };
