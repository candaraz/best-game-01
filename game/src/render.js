// World rendering: the night sky, the moon, the silhouette ridge, the
// tiles and wind zones, the exit door and the orbs. Stars are placed with a
// fixed seed so every run paints the same sky.

import { TILE, COLS, ROWS, WIDTH, HEIGHT, PALETTE } from './config.js';
import { drawObjects, drawSwitch } from './objects.js';
import { drawPlayer } from './player.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rand = mulberry32(20261115);
  const stars = [];
  for (let i = 0; i < 130; i++) {
    stars.push({ x: rand() * WIDTH, y: rand() * HEIGHT * 0.72, r: 0.6 + rand() * 1.5, tw: rand() * Math.PI * 2 });
  }
  return stars;
})();

const RIDGE = (() => {
  const rand = mulberry32(77);
  const pts = [];
  for (let x = 0; x <= WIDTH; x += 48) pts.push({ x, y: 430 + rand() * 60 });
  return pts;
})();

function drawSky(ctx, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, '#0b0e1d');
  grad.addColorStop(0.55, '#191d3a');
  grad.addColorStop(1, '#2a2450');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (const s of STARS) {
    const a = 0.45 + Math.sin(time * 1.4 + s.tw) * 0.3;
    ctx.globalAlpha = Math.max(0.15, a);
    ctx.fillStyle = '#e8ecff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The moon, with a soft halo.
  const mx = 808;
  const my = 92;
  const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 110);
  halo.addColorStop(0, 'rgba(244, 241, 222, 0.35)');
  halo.addColorStop(1, 'rgba(244, 241, 222, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 110, my - 110, 220, 220);
  ctx.fillStyle = '#f4f1de';
  ctx.beginPath();
  ctx.arc(mx, my, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9d4bd';
  ctx.beginPath();
  ctx.arc(mx - 14, my - 8, 9, 0, Math.PI * 2);
  ctx.arc(mx + 12, my + 14, 6, 0, Math.PI * 2);
  ctx.arc(mx + 16, my - 14, 5, 0, Math.PI * 2);
  ctx.fill();

  // Distant ridge silhouette.
  ctx.fillStyle = '#141731';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  for (const p of RIDGE) ctx.lineTo(p.x, p.y);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function drawTiles(ctx, room, time) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = room.tiles[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (t === '#') {
        const top = row === 0 || room.tiles[row - 1][col] === '.';
        ctx.fillStyle = '#2a2c52';
        ctx.fillRect(x, y, TILE, TILE);
        if (top) {
          ctx.fillStyle = '#3d3f6e';
          ctx.fillRect(x, y, TILE, 8);
          ctx.fillStyle = '#4a4c80';
          ctx.fillRect(x, y, TILE, 3);
        } else {
          ctx.fillStyle = '#24264a';
          ctx.fillRect(x + 6, y + 10, 10, 4);
          ctx.fillRect(x + 22, y + 24, 12, 4);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y + TILE - 3, TILE, 3);
      } else if (t === 'C') {
        const key = `${col},${row}`;
        const load = room.crackTimers.get(key) || 0;
        const shakeX = load > 0.15 ? Math.sin(time * 40) * 1.2 : 0;
        ctx.fillStyle = load > 0.3 ? '#5e4a3a' : '#4a3a2e';
        ctx.fillRect(x + shakeX, y, TILE, TILE);
        ctx.strokeStyle = '#8a6a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 4);
        ctx.lineTo(x + 16, y + 18);
        ctx.lineTo(x + 10, y + 34);
        ctx.moveTo(x + 26, y + 6);
        ctx.lineTo(x + 20, y + 22);
        ctx.lineTo(x + 30, y + 36);
        ctx.stroke();
        if (load > 0.3) {
          ctx.fillStyle = 'rgba(255, 93, 93, 0.35)';
          ctx.fillRect(x, y, TILE, TILE);
        }
      } else if (t === 'A' || t === 'B') {
        const open = room.doorOpen[t.toLowerCase()] || 0;
        const lift = open * (TILE - 6);
        ctx.fillStyle = t === 'A' ? '#3d5a80' : '#7d5a80';
        ctx.fillRect(x + 3, y + lift, TILE - 6, TILE - lift);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 6, y + 4 + lift, 4, TILE - 8 - lift);
        ctx.fillStyle = '#ffd75e';
        ctx.beginPath();
        ctx.arc(x + 20, y + 20 + lift * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawZones(ctx, room, time) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const z = room.zones[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (z === '^') {
        const a = 0.08 + Math.sin(time * 3 + row) * 0.03;
        ctx.fillStyle = `rgba(143, 216, 255, ${a})`;
        ctx.fillRect(x, y, TILE, TILE);
        if (row % 2 === 0) {
          const rise = (time * 60 + row * 20) % TILE;
          ctx.fillStyle = 'rgba(143, 216, 255, 0.5)';
          ctx.beginPath();
          ctx.moveTo(x + 20, y + TILE - rise - 8);
          ctx.lineTo(x + 14, y + TILE - rise);
          ctx.lineTo(x + 26, y + TILE - rise);
          ctx.closePath();
          ctx.fill();
        }
      } else if (z === '<' || z === '>') {
        const a = 0.06 + Math.sin(time * 2.4 + col) * 0.02;
        ctx.fillStyle = `rgba(200, 210, 255, ${a})`;
        ctx.fillRect(x, y, TILE, TILE);
        const dir = z === '<' ? -1 : 1;
        const slide = (time * 90 * dir) % TILE;
        ctx.strokeStyle = 'rgba(200, 210, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
          const yy = y + 12 + i * 18;
          const xx = x + 8 + ((slide + TILE) % TILE);
          ctx.beginPath();
          ctx.moveTo(xx, yy);
          ctx.lineTo(xx + dir * 14, yy);
          ctx.moveTo(xx + dir * 9, yy - 4);
          ctx.lineTo(xx + dir * 14, yy);
          ctx.lineTo(xx + dir * 9, yy + 4);
          ctx.stroke();
        }
      }
    }
  }
}

function drawExit(ctx, room, time) {
  const e = room.exit;
  if (!e) return;
  const glow = ctx.createRadialGradient(e.x + 18, e.y + 32, 6, e.x + 18, e.y + 32, 70);
  glow.addColorStop(0, 'rgba(126, 240, 200, 0.4)');
  glow.addColorStop(1, 'rgba(126, 240, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(e.x - 52, e.y - 38, 140, 140);
  ctx.fillStyle = '#2f8f68';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#7ef0c8';
  const pulse = 0.7 + Math.sin(time * 3) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillRect(e.x + 6, e.y + 6, e.w - 12, e.h - 12);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0b0e1d';
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('→', e.x + 18, e.y + 38);
}

function drawOrbs(ctx, room, time) {
  for (const orb of room.orbs) {
    if (orb.taken) continue;
    const cx = orb.x + 9;
    const cy = orb.y + 9 + Math.sin(time * 2.5 + orb.phase) * 3;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    glow.addColorStop(0, 'rgba(255, 215, 94, 0.55)');
    glow.addColorStop(1, 'rgba(255, 215, 94, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 22, cy - 22, 44, 44);
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTargetPrompt(ctx, room) {
  const target = room.target;
  if (!target) return;
  const cx = target.x + target.w / 2;
  const cy = target.y - 16;
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(11, 14, 29, 0.75)';
  const label = target.kind === 'mine' ? 'Q give weight' : target.kind === 'golem' ? 'E steal weight' : 'E steal · Q give';
  const w = ctx.measureText(label).width + 14;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - 14, w, 20, 6);
  ctx.fill();
  ctx.fillStyle = '#f4f1de';
  ctx.fillText(label, cx, cy + 1);
}

export function drawWorld(ctx, room, time) {
  drawSky(ctx, time);
  drawZones(ctx, room, time);
  drawTiles(ctx, room, time);
  for (const sw of room.switches) drawSwitch(ctx, sw);
  drawExit(ctx, room, time);
  drawOrbs(ctx, room, time);
  drawObjects(ctx, room.objects, time);
  drawPlayer(ctx, room.player, time);
  drawTargetPrompt(ctx, room);
  room.fx.draw(ctx);
  if (room.failedFlash > 0) {
    ctx.fillStyle = `rgba(180, 30, 30, ${Math.min(0.4, room.failedFlash * 0.3)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

export { PALETTE };
