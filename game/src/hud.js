// The heads-up display: hearts, room name + timer + par, score and orbs,
// and the weight gauge — the game's identity, drawn large enough to read at
// a glance. The gauge pops on every transfer and shows its label.

import { WIDTH, GAUGE, TRANSFER } from './config.js';

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#ff5d6e' : 'rgba(244, 241, 222, 0.2)';
  ctx.beginPath();
  ctx.moveTo(x, y + 5);
  ctx.bezierCurveTo(x - 9, y - 4, x - 4, y - 11, x, y - 5);
  ctx.bezierCurveTo(x + 4, y - 11, x + 9, y - 4, x, y + 5);
  ctx.fill();
}

export function drawHUD(ctx, room, muted, time) {
  const p = room.player;
  // Top bar.
  ctx.fillStyle = 'rgba(11, 14, 29, 0.72)';
  ctx.fillRect(0, 0, WIDTH, 46);
  ctx.fillStyle = 'rgba(244, 241, 222, 0.14)';
  ctx.fillRect(0, 46, WIDTH, 1);

  // Hearts.
  for (let i = 0; i < 3; i++) drawHeart(ctx, 24 + i * 24, 26, i < room.hearts);

  // Room name, timer, par.
  ctx.fillStyle = '#f4f1de';
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(room.def.name, 104, 20);
  const over = room.time > room.def.par;
  ctx.fillStyle = over ? '#ff8a8a' : '#9aa3d0';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`⏱ ${fmtTime(room.time)} / par ${fmtTime(room.def.par)}`, 104, 37);

  // Score + orbs.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd75e';
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`★ ${room.score}`, WIDTH - 24, 20);
  ctx.fillStyle = '#f4f1de';
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`● ${room.orbsTaken}/${room.orbTotal} orbs`, WIDTH - 24, 37);

  // Weight gauge, centre stage.
  const g = GAUGE[p.gauge];
  const gw = 190;
  const gx = WIDTH / 2 - gw / 2;
  const gy = 12;
  const pop = 1 + p.gaugePop * 0.08;
  ctx.save();
  ctx.translate(WIDTH / 2, 24);
  ctx.scale(pop, pop);
  ctx.translate(-WIDTH / 2, -24);
  ctx.fillStyle = 'rgba(244, 241, 222, 0.12)';
  ctx.beginPath();
  ctx.roundRect(gx, gy, gw, 22, 11);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < p.gauge ? g.color : 'rgba(244, 241, 222, 0.18)';
    ctx.beginPath();
    ctx.roundRect(gx + 5 + i * 46, gy + 5, 42, 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#f4f1de';
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`WEIGHT ${p.gauge} · ${g.label.toUpperCase()}`, WIDTH / 2, gy + 33);
  ctx.restore();

  // Gauge hint line under the bar.
  ctx.fillStyle = 'rgba(244, 241, 222, 0.75)';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`E steal weight · Q give weight · range ${TRANSFER.range}px`, WIDTH / 2, 62);

  // Mute + controls reminder, bottom corners.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(244, 241, 222, 0.55)';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('← → move · Space jump · R retry · Esc pause', 12, 588);
  ctx.textAlign = 'right';
  ctx.fillText(muted ? 'M · sound OFF' : 'M · sound ON', WIDTH - 12, 588);

  // Room hint, fading in the first seconds.
  if (room.time < 5 && room.def.hint) {
    const a = room.time < 4 ? 1 : (5 - room.time);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(11, 14, 29, 0.8)';
    ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
    const w = ctx.measureText(room.def.hint).width + 28;
    ctx.beginPath();
    ctx.roundRect(WIDTH / 2 - w / 2, 84, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd75e';
    ctx.textAlign = 'center';
    ctx.fillText(room.def.hint, WIDTH / 2, 104);
    ctx.globalAlpha = 1;
  }
}
