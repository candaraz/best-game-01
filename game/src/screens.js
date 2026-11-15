// Full screens: the title card, the room intro card, the pause overlay,
// the room-complete stars and the all-clear finale. Each draws over a
// dimmed world; the title draws its own animated night scene.

import { WIDTH, HEIGHT, GAUGE } from './config.js';
import { LEVELS } from './levels.js';
import { getBests, totalStars } from './store.js';

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(11, 14, 29, ${alpha})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function panel(ctx, x, y, w, h, alpha = 0.88) {
  ctx.fillStyle = `rgba(20, 23, 49, ${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 215, 94, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function centreText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, WIDTH / 2, y);
}

export function drawTitle(ctx, time) {
  // Animated night backdrop: gradient, moon, drifting stars, ridge.
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, '#0b0e1d');
  grad.addColorStop(0.6, '#191d3a');
  grad.addColorStop(1, '#2a2450');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 90; i++) {
    const x = (i * 173 + 40) % WIDTH;
    const y = (i * 89 + 20) % 360;
    ctx.globalAlpha = 0.3 + Math.sin(time * 1.2 + i) * 0.25;
    ctx.fillStyle = '#e8ecff';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f4f1de';
  ctx.beginPath();
  ctx.arc(786, 108, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9d4bd';
  ctx.beginPath();
  ctx.arc(770, 98, 10, 0, Math.PI * 2);
  ctx.arc(800, 124, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141731';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  ctx.lineTo(0, 470);
  ctx.quadraticCurveTo(240, 420, 480, 470);
  ctx.quadraticCurveTo(720, 520, WIDTH, 460);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fill();

  // A floating crate and a heavy anchor stone tell the mechanic at a glance.
  const floatY = Math.sin(time * 1.6) * 6;
  ctx.fillStyle = '#a9804f';
  ctx.fillRect(150, 300 + floatY, 40, 40);
  ctx.strokeStyle = '#6d5433';
  ctx.lineWidth = 2;
  ctx.strokeRect(150, 300 + floatY, 40, 40);
  ctx.fillStyle = 'rgba(143, 216, 255, 0.3)';
  ctx.fillRect(146, 296 + floatY, 48, 48);
  ctx.fillStyle = '#7d86a8';
  ctx.beginPath();
  ctx.arc(790, 520, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#565e7d';
  ctx.beginPath();
  ctx.arc(790, 520, 26, 0, Math.PI * 2);
  ctx.stroke();

  centreText(ctx, 'B A L L A S T', 158, 'bold 72px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  centreText(ctx, 'A Weight-Thief\'s Tale', 196, 'italic 24px Georgia, serif', '#f4f1de');
  centreText(ctx, 'Steal weight. Give it back. The room remembers every ounce.', 232, '15px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');

  panel(ctx, WIDTH / 2 - 250, 258, 500, 132);
  centreText(ctx, '← → / A D  move      Space / W  jump', 288, '15px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  centreText(ctx, 'E / left click — STEAL weight from an object', 312, 'bold 15px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  centreText(ctx, 'Q / right click — GIVE weight back', 336, 'bold 15px "Trebuchet MS", Verdana, sans-serif', '#7ef0c8');
  centreText(ctx, 'Light floats · Heavy smashes · R retry · M sound', 362, '14px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');

  const stars = totalStars();
  const bests = getBests();
  if (stars > 0 || bests.furthest > 0) {
    centreText(ctx, `★ ${stars} / 24 stars      furthest room ${Math.min(bests.furthest + 1, 8)} / 8`, 418, '14px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  }

  if (Math.floor(time * 1.6) % 2 === 0) {
    centreText(ctx, 'PRESS ENTER OR CLICK TO BEGIN', 472, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  }
  centreText(ctx, '8 rooms · 3 stars each · no two weights alike', 540, '13px "Trebuchet MS", Verdana, sans-serif', 'rgba(244, 241, 222, 0.55)');
}

export function drawRoomCard(ctx, index, progress) {
  dim(ctx, 0.55);
  const def = LEVELS[index];
  const slide = Math.min(1, progress * 3);
  const y = 210 + (1 - slide) * 30;
  ctx.globalAlpha = slide;
  panel(ctx, WIDTH / 2 - 280, y, 560, 180);
  centreText(ctx, `ROOM ${index + 1} OF 8`, y + 40, 'bold 15px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
  centreText(ctx, def.name, y + 82, 'bold 34px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  centreText(ctx, def.hint || '', y + 118, '15px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  centreText(ctx, `par ${def.par}s · ${def.orbs} orbs`, y + 148, '13px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
  ctx.globalAlpha = 1;
}

export function drawPause(ctx) {
  dim(ctx, 0.6);
  panel(ctx, WIDTH / 2 - 190, 210, 380, 180);
  centreText(ctx, 'PAUSED', 262, 'bold 32px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  centreText(ctx, 'Esc / P — resume', 302, '15px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
  centreText(ctx, 'R — retry room', 328, '15px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
  centreText(ctx, 'M — sound on/off', 354, '15px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
}

export function drawRoomComplete(ctx, room, time) {
  dim(ctx, 0.55);
  panel(ctx, WIDTH / 2 - 260, 150, 520, 300);
  centreText(ctx, 'ROOM CLEAR!', 200, 'bold 32px "Trebuchet MS", Verdana, sans-serif', '#7ef0c8');
  centreText(ctx, room.def.name, 232, '17px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  // Stars pop in one by one.
  for (let i = 0; i < 3; i++) {
    const delay = 0.35 + i * 0.3;
    const shown = time > delay;
    const pop = shown ? Math.min(1, (time - delay) * 4) : 0;
    const sx = WIDTH / 2 - 60 + i * 60;
    const sy = 282;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(0.4 + pop * 0.6, 0.4 + pop * 0.6);
    ctx.font = '40px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = shown && i < room.stars ? '#ffd75e' : 'rgba(244, 241, 222, 0.18)';
    ctx.fillText('★', 0, 0);
    ctx.restore();
  }
  centreText(ctx, `Time ${room.time.toFixed(1)}s (par ${room.def.par}s)`, 330, '14px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
  centreText(ctx, `Orbs ${room.orbsTaken}/${room.orbTotal} · Time bonus +${room.timeBonus || 0} · No-damage +${room.noDamageBonus || 0}`, 356, '14px "Trebuchet MS", Verdana, sans-serif', '#9aa3d0');
  centreText(ctx, `Score ${room.score}`, 384, 'bold 18px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  if (time > 1.1) {
    centreText(ctx, room.index < 7 ? 'ENTER — next room' : 'ENTER — finale', 420, 'bold 16px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  }
}

export function drawAllClear(ctx, totalScore, time) {
  dim(ctx, 0.7);
  const bob = Math.sin(time * 2) * 4;
  centreText(ctx, '✦ THE VAULT OPENS ✦', 150 + bob, 'bold 22px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  centreText(ctx, 'ALL EIGHT ROOMS CLEAR', 200, 'bold 36px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  centreText(ctx, 'Pip returns every stolen ounce to the night sky,', 246, '16px Georgia, serif', '#9aa3d0');
  centreText(ctx, 'and the Hollow Vault drifts gently home.', 270, '16px Georgia, serif', '#9aa3d0');
  centreText(ctx, `Total stars ★ ${totalStars()} / 24`, 318, 'bold 20px "Trebuchet MS", Verdana, sans-serif', '#ffd75e');
  centreText(ctx, `Total score ${totalScore}`, 348, '16px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  if (Math.floor(time * 1.6) % 2 === 0) {
    centreText(ctx, 'PRESS ENTER TO PLAY AGAIN', 420, 'bold 18px "Trebuchet MS", Verdana, sans-serif', '#f4f1de');
  }
  centreText(ctx, 'Thank you for playing BALLAST', 480, '13px "Trebuchet MS", Verdana, sans-serif', 'rgba(244, 241, 222, 0.5)');
}

export { GAUGE };
