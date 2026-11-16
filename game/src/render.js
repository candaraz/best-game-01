// Everything the eye sees. v4: the vault is sunlit — warm sandstone walls,
// bright stone floors and a pale sky, so platforms, entities and the tether
// read instantly in a still frame. Layers: bright backdrop with columns,
// murals and lanterns, then wind zones, stonework, the door, the objects,
// and Pip. The entity figures are exported on their own so the title
// screen can stage the same cast in its live diorama.

import { FIELD, WEIGHTS, PALETTE, MINE } from './config.js';
import { mulberry32 } from './random.js';

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function drawBackdrop(ctx, roomIndex, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.55, PALETTE.skyMid);
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Far vault: huge arches receding in warm stone, outlined so each bay
  // reads as architecture instead of flat colour.
  ctx.fillStyle = PALETTE.farArch;
  for (let i = 0; i < 5; i += 1) {
    const ax = 60 + i * 210;
    ctx.beginPath();
    ctx.moveTo(ax, FIELD.height);
    ctx.lineTo(ax, 220);
    ctx.quadraticCurveTo(ax + 70, 130, ax + 140, 220);
    ctx.lineTo(ax + 140, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.midArch;
  for (let i = 0; i < 5; i += 1) {
    const ax = 78 + i * 210;
    ctx.beginPath();
    ctx.moveTo(ax, FIELD.height);
    ctx.lineTo(ax, 240);
    ctx.quadraticCurveTo(ax + 52, 168, ax + 104, 240);
    ctx.lineTo(ax + 104, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }
  // Warm sun-glow through the highest arch.
  const glow = ctx.createRadialGradient(480, 120, 10, 480, 120, 260);
  glow.addColorStop(0, 'rgba(255, 205, 90, 0.38)');
  glow.addColorStop(1, 'rgba(255, 205, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Stone pilasters between the bays: vertical ribs so no stretch of wall
  // is ever bare.
  for (let x = 8; x < FIELD.width; x += 160) {
    ctx.fillStyle = '#c9a86a';
    ctx.fillRect(x, 92, 26, FIELD.height - 92);
    ctx.fillStyle = '#a8814e';
    ctx.fillRect(x, 92, 26, 10);
    ctx.fillRect(x, 300, 26, 8);
    ctx.fillStyle = '#8a6a45';
    ctx.fillRect(x, 92, 2, FIELD.height - 92);
    ctx.fillRect(x + 24, 92, 2, FIELD.height - 92);
  }

  // A sun mural on the back wall, one per room at a seeded bay, with a
  // balance-scales glyph inside: the vault's emblem, always in frame.
  const muralRng = mulberry32(roomIndex * 104729 + 7);
  const mx = 150 + muralRng() * 660;
  const my = 150;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#d9b45b';
  ctx.beginPath();
  ctx.arc(mx, my, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#5a4026';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(mx + Math.cos(a) * 50, my + Math.sin(a) * 50);
    ctx.lineTo(mx + Math.cos(a) * 60, my + Math.sin(a) * 60);
    ctx.stroke();
  }
  // Scales: a beam, two pans.
  ctx.beginPath();
  ctx.moveTo(mx - 22, my - 2);
  ctx.lineTo(mx + 22, my - 2);
  ctx.moveTo(mx, my - 14);
  ctx.lineTo(mx, my + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx - 22, my + 6, 8, 0, Math.PI);
  ctx.arc(mx + 22, my + 6, 8, 0, Math.PI);
  ctx.stroke();
  ctx.restore();

  // A frieze band with a diamond pattern, and arch outlines, so the upper
  // wall is never a flat void.
  ctx.fillStyle = '#d9bc82';
  ctx.fillRect(0, 62, FIELD.width, 30);
  ctx.fillStyle = '#8a6a45';
  for (let x = 20; x < FIELD.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x + 8, 77);
    ctx.lineTo(x, 84);
    ctx.lineTo(x - 8, 77);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#a8814e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const ax = 60 + i * 210;
    ctx.beginPath();
    ctx.moveTo(ax, FIELD.height);
    ctx.lineTo(ax, 220);
    ctx.quadraticCurveTo(ax + 70, 130, ax + 140, 220);
    ctx.lineTo(ax + 140, FIELD.height);
    ctx.stroke();
  }
  // Wall sconces: warm flames that flicker, one per arch bay.
  for (let i = 0; i < 4; i += 1) {
    const sx = 130 + i * 240;
    const sy = 168;
    const flicker = 0.85 + 0.15 * Math.sin(time * 7 + i * 2.4) * Math.sin(time * 3.1 + i);
    const flame = ctx.createRadialGradient(sx, sy, 2, sx, sy, 46);
    flame.addColorStop(0, `rgba(255, 170, 60, ${0.5 * flicker})`);
    flame.addColorStop(1, 'rgba(255, 170, 60, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.arc(sx, sy, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a4026';
    ctx.fillRect(sx - 3, sy + 6, 6, 14);
    ctx.fillStyle = '#ff9a2a';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 10 - 3 * flicker);
    ctx.quadraticCurveTo(sx + 6, sy - 2, sx, sy + 6);
    ctx.quadraticCurveTo(sx - 6, sy - 2, sx, sy - 10 - 3 * flicker);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hanging lanterns: warm light pools low on the wall, three per room.
  for (let i = 0; i < 3; i += 1) {
    const lx = 200 + muralRng() * 560 + i * 40;
    const ly = 250 + muralRng() * 60;
    const sway = Math.sin(time * 1.1 + i * 2) * 3;
    const lg = ctx.createRadialGradient(lx + sway, ly, 2, lx + sway, ly, 52);
    lg.addColorStop(0, 'rgba(255, 190, 80, 0.42)');
    lg.addColorStop(1, 'rgba(255, 190, 80, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx + sway, ly, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4026';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx + sway, 92);
    ctx.lineTo(lx + sway, ly - 12);
    ctx.stroke();
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(lx + sway - 9, ly - 12, 18, 24);
    ctx.fillStyle = '#ffcf5e';
    ctx.fillRect(lx + sway - 6, ly - 8, 12, 16);
  }

  // Chains, banners and runes — seeded per room so the dressing is stable.
  const rng = mulberry32(roomIndex * 7919 + 13);
  for (let i = 0; i < 7; i += 1) {
    const x = 40 + rng() * 880;
    const len = 60 + rng() * 120;
    ctx.strokeStyle = '#a8814e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, len);
    ctx.stroke();
    ctx.fillStyle = '#8a6a45';
    for (let link = 12; link < len; link += 16) {
      ctx.beginPath();
      ctx.ellipse(x, link, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (rng() > 0.45) {
      const wave = Math.sin(time * 1.3 + x) * 4;
      ctx.fillStyle = i % 2 ? '#a83a32' : '#8a5a1e';
      ctx.beginPath();
      ctx.moveTo(x - 16, len);
      ctx.lineTo(x + 16, len);
      ctx.lineTo(x + 16 + wave, len + 58);
      ctx.lineTo(x, len + 46);
      ctx.lineTo(x - 16 + wave, len + 58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.fillRect(x - 2 + wave * 0.5, len + 12, 4, 22);
    }
  }
  for (let i = 0; i < 9; i += 1) {
    const x = 60 + rng() * 840;
    const y = 90 + rng() * 300;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.9 + i * 2.1);
    ctx.save();
    ctx.globalAlpha = 0.28 + 0.16 * pulse;
    ctx.strokeStyle = '#3a5a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
    ctx.restore();
  }
  // Drifting dust motes, dark on the bright wall.
  for (let i = 0; i < 26; i += 1) {
    const x = (hash2(i, 7) * FIELD.width + Math.sin(time * 0.22 + i) * 14 + FIELD.width) % FIELD.width;
    const y = (hash2(i, 11) * FIELD.height - time * 6 + FIELD.height * 2) % FIELD.height;
    ctx.fillStyle = `rgba(90, 64, 38, ${0.25 + 0.2 * Math.sin(time + i)})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawTiles(ctx, world) {
  const { state } = world;
  const solidKeys = new Set(state.solids.map((s) => `${s.x},${s.y}`));
  for (const s of state.solids) {
    const aboveEmpty = !solidKeys.has(`${s.x},${s.y - FIELD.tile}`);
    // Bright sandstone blocks with a strong dark mortar grid: the floor
    // reads as solid ground, never as background.
    ctx.fillStyle = '#b98a52';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    const shade = hash2(s.x, s.y);
    ctx.fillStyle = shade > 0.5 ? 'rgba(255, 240, 200, 0.16)' : 'rgba(90, 64, 38, 0.12)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = '#5a4026';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    if (aboveEmpty) {
      ctx.fillStyle = '#e0b96a';
      ctx.fillRect(s.x, s.y, s.w, 5);
      ctx.fillStyle = '#f6e7bd';
      ctx.fillRect(s.x, s.y, s.w, 2);
      // Rubble and pebbles on walked surfaces, stable per tile.
      if (hash2(s.x + 5, s.y + 3) > 0.55) {
        ctx.fillStyle = '#8a6a45';
        ctx.beginPath();
        ctx.arc(s.x + 10 + hash2(s.x, s.y) * 20, s.y - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (hash2(s.x + 9, s.y + 7) > 0.7) {
        ctx.fillStyle = '#5a4026';
        ctx.fillRect(s.x + 22 + hash2(s.y, s.x) * 10, s.y - 2, 5, 2);
      }
    }
    if (hash2(s.y, s.x) > 0.72) {
      ctx.fillStyle = '#8a6a45';
      ctx.fillRect(s.x + 8 + hash2(s.x, s.y + 1) * 18, s.y + 12, 6, 3);
    }
  }
  for (const p of state.oneWay) {
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#d9a05e';
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = '#5a4026';
    ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
    ctx.fillStyle = '#3a2a18';
    for (let x = p.x + 8; x < p.x + p.w; x += 14) ctx.fillRect(x, p.y + 3, 2, p.h - 6);
  }
  for (const c of state.cracked) {
    if (c.broken) {
      // What breaks stays broken, and stays visible: a dark pit with rubble.
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#b98a52';
      ctx.beginPath();
      ctx.arc(c.x + 9 + hash2(c.x, c.y) * 8, c.y + c.h - 6, 3, 0, Math.PI * 2);
      ctx.arc(c.x + 24 + hash2(c.y, c.x) * 8, c.y + c.h - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6a45';
      ctx.fillRect(c.x + 4, c.y + c.h - 3, 10, 3);
      ctx.fillRect(c.x + 26, c.y + c.h - 3, 8, 3);
      continue;
    }
    ctx.fillStyle = '#a06a3e';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#d9a05e';
    ctx.fillRect(c.x, c.y, c.w, 4);
    ctx.strokeStyle = '#5a4026';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + 10, c.y + 4);
    ctx.lineTo(c.x + 16, c.y + 16);
    ctx.lineTo(c.x + 9, c.y + 30);
    ctx.moveTo(c.x + 28, c.y + 6);
    ctx.lineTo(c.x + 22, c.y + 20);
    ctx.lineTo(c.x + 31, c.y + 34);
    ctx.stroke();
    ctx.strokeStyle = '#5a4026';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
  }
}

/** Floor props: barrels and rubble piles on the walked floor, seeded per
 *  room and kept clear of every interactive object, so the floor never
 *  reads as an empty strip. Drawn behind the entities. */
function drawProps(ctx, world) {
  const { state } = world;
  const rng = mulberry32(state.roomIndex * 31337 + 5);
  const floorY = 520;
  const blocked = [];
  const add = (x, y, w, h) => blocked.push({ x, y, w, h });
  add(state.spawn.x - 20, state.spawn.y - 44, 40, 44);
  add(state.door.x - 10, state.door.y - 10, state.door.w + 20, state.door.h + 10);
  for (const list of [state.crates, state.boulders, state.golems, state.mines, state.switches]) {
    for (const o of list) add(o.x - 24, o.y - 8, o.w + 48, o.h + 8);
  }
  for (const o of state.orbs) add(o.x - 30, o.y - 30, 60, 60);
  // Props stand only on real floor: a solid tile at y 520 that is not a
  // cracked tile (rooms 5 and 8 have pits in the floor row).
  const crackedX = new Set(state.cracked.map((c) => c.x));
  const floorAt = (x) =>
    state.solids.some((s) => s.y === 520 && x >= s.x && x < s.x + s.w) &&
    !crackedX.has(Math.floor(x / 40) * 40);
  const clear = (x, w) => floorAt(x + w / 2) && !blocked.some((b) => x + w > b.x && x < b.x + b.w);
  for (let i = 0; i < 4; i += 1) {
    const x = 40 + rng() * 860;
    if (!clear(x, 30)) continue;
    // A barrel: stout, banded, catching the light.
    ctx.fillStyle = '#7a5230';
    ctx.beginPath();
    ctx.ellipse(x + 15, floorY - 2, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(x, floorY - 30, 30, 28);
    ctx.fillStyle = '#c99a5e';
    ctx.fillRect(x, floorY - 30, 30, 4);
    ctx.fillStyle = '#5a4026';
    ctx.fillRect(x, floorY - 20, 30, 3);
    ctx.fillRect(x, floorY - 9, 30, 3);
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, floorY - 30.5, 29, 28);
  }
  for (let i = 0; i < 3; i += 1) {
    const x = 60 + rng() * 840;
    if (!clear(x, 36)) continue;
    ctx.fillStyle = '#8a6a45';
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x + 10, floorY - 12);
    ctx.lineTo(x + 22, floorY - 16);
    ctx.lineTo(x + 36, floorY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b98a52';
    ctx.beginPath();
    ctx.arc(x + 12, floorY - 6, 3, 0, Math.PI * 2);
    ctx.arc(x + 24, floorY - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawZones(ctx, world, time) {
  for (const zone of world.state.zones) {
    if (zone.kind === 'gale') {
      ctx.fillStyle = 'rgba(70, 140, 190, 0.28)';
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(zone.x, zone.y, zone.w, zone.h);
      ctx.clip();
      ctx.strokeStyle = 'rgba(30, 90, 140, 0.75)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i += 1) {
        const yy = zone.y + 14 + i * ((zone.h - 28) / 11);
        const speed = zone.dx * 300;
        const xx = zone.x + ((time * speed + i * 67) % (zone.w + 160)) - 80;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx + zone.dx * 46, yy);
        ctx.moveTo(xx + zone.dx * 36, yy - 7);
        ctx.lineTo(xx + zone.dx * 46, yy);
        ctx.lineTo(xx + zone.dx * 36, yy + 7);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(30, 90, 140, 0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i += 1) {
        const yy = zone.y + 30 + i * ((zone.h - 60) / 9);
        const speed = zone.dx * 190;
        const xx = zone.x + ((time * speed + i * 113) % (zone.w + 200)) - 100;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx + zone.dx * 70, yy - 8);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(20, 70, 110, 0.9)';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(zone.dx < 0 ? '◀◀ GALE ◀◀' : '▶▶ GALE ▶▶', zone.x + zone.w / 2, zone.y + 16);
    } else {
      const grad = ctx.createLinearGradient(0, zone.y + zone.h, 0, zone.y);
      grad.addColorStop(0, 'rgba(184, 134, 11, 0.42)');
      grad.addColorStop(1, 'rgba(184, 134, 11, 0.10)');
      ctx.fillStyle = grad;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.fillStyle = 'rgba(122, 77, 0, 0.85)';
      for (let i = 0; i < 5; i += 1) {
        const yy = zone.y + zone.h - ((time * 90 + i * 70) % zone.h);
        const xx = zone.x + zone.w / 2;
        ctx.beginPath();
        ctx.moveTo(xx - 7, yy + 4);
        ctx.lineTo(xx, yy - 6);
        ctx.lineTo(xx + 7, yy + 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#3a4170';
      ctx.fillRect(zone.x, zone.y + zone.h - 8, zone.w, 8);
      ctx.fillStyle = '#ffd76a';
      for (let x = zone.x + 6; x < zone.x + zone.w - 4; x += 12) ctx.fillRect(x, zone.y + zone.h - 6, 6, 3);
    }
  }
}

export function drawDoorFigure(ctx, x, y, w, h, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 2);
  ctx.fillStyle = '#3a4170';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 18);
  ctx.quadraticCurveTo(x + w / 2, y - 12, x + w, y + 18);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  const inner = ctx.createLinearGradient(0, y, 0, y + h);
  inner.addColorStop(0, '#2f8f66');
  inner.addColorStop(1, '#57e6a8');
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + h);
  ctx.lineTo(x + 6, y + 22);
  ctx.quadraticCurveTo(x + w / 2, y + 2, x + w - 6, y + 22);
  ctx.lineTo(x + w - 6, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.25 * pulse;
  ctx.fillStyle = '#a8ffda';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w * 0.7, h * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 26, 4 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b45b';
  ctx.fillRect(x + w / 2 - 2, y + 32, 4, 18);
}

export function drawOrbFigure(ctx, x, y, time, phase = 0) {
  const bob = Math.sin(time * 2.2 + phase) * 4;
  const yy = y + bob;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3 + phase);
  const halo = ctx.createRadialGradient(x, yy, 2, x, yy, 30);
  halo.addColorStop(0, 'rgba(255, 190, 60, 0.75)');
  halo.addColorStop(1, 'rgba(255, 190, 60, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, yy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a800';
  ctx.beginPath();
  ctx.arc(x, yy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(x, yy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(x - 3, yy - 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 243, 196, ${0.5 + 0.5 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, yy - 20);
  ctx.lineTo(x, yy + 20);
  ctx.moveTo(x - 20, yy);
  ctx.lineTo(x + 20, yy);
  ctx.stroke();
}

function drawWeightPips(ctx, cx, topY, weight, maxWeight) {
  const spacing = 11;
  const startX = cx - ((maxWeight - 1) * spacing) / 2;
  for (let i = 0; i < maxWeight; i += 1) {
    ctx.beginPath();
    ctx.arc(startX + i * spacing, topY, 4, 0, Math.PI * 2);
    ctx.fillStyle = i < weight ? '#ffd76a' : '#2c3050';
    ctx.fill();
    ctx.strokeStyle = '#d9b45b';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawCrateFigure(ctx, x, y, w, h, { weight, maxWeight, time }) {
  ctx.fillStyle = '#8a6a52';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#a8846a';
  ctx.fillRect(x, y, w, 4);
  ctx.strokeStyle = '#54371f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + w - 3, y + h - 3);
  ctx.moveTo(x + w - 3, y + 3);
  ctx.lineTo(x + 3, y + h - 3);
  ctx.stroke();
  ctx.fillStyle = '#54371f';
  for (const [nx, ny] of [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]) {
    ctx.beginPath();
    ctx.arc(x + nx, y + ny, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (weight === 0) {
    const float = Math.sin(time * 2.4) * 2;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#9fe8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 6, y - 6 + float);
    ctx.lineTo(x + w / 2, y - 12 + float);
    ctx.lineTo(x + w / 2 + 6, y - 6 + float);
    ctx.stroke();
    ctx.restore();
  }
  drawWeightPips(ctx, x + w / 2, y + h - 8, weight, maxWeight);
}

export function drawBoulderFigure(ctx, x, y, w, h, { weight, roll, time }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = w / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(roll);
  ctx.fillStyle = '#6e7390';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8b93bd';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.3, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a4f6e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.1);
  ctx.lineTo(r * 0.4, r * 0.3);
  ctx.stroke();
  ctx.restore();
  drawWeightPips(ctx, cx, y + h + 8, weight, 3);
}

export function drawGolemFigure(ctx, x, y, w, h, { dir, time, alive, alert = false }) {
  if (!alive) return;
  const bob = Math.sin(time * 4) * 1.5;
  const cx = x + w / 2;
  // Alert: the golem leans toward its prey and its eyes widen — a readable
  // telegraph that it is about to hurt you.
  const lean = alert ? dir * 2 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 2, w * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a6084';
  ctx.fillRect(x + 4, y + 14 + bob, w - 8, h - 16);
  ctx.fillStyle = '#6e7390';
  ctx.fillRect(x + 8, y + 4 + bob, w - 16, 16);
  ctx.fillStyle = '#4a4f6e';
  ctx.fillRect(x, y + 18 + bob, 7, h - 22);
  ctx.fillRect(x + w - 7, y + 18 + bob, 7, h - 22);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(cx + dir * 3 - 7 + lean, y + 9 + bob, alert ? 7 : 5, alert ? 6 : 4);
  ctx.fillRect(cx + dir * 3 + 2 + lean, y + 9 + bob, alert ? 7 : 5, alert ? 6 : 4);
  if (alert) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(time * 8);
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(cx + lean, y + 11 + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#8b93bd';
  ctx.fillRect(x + 6, y + h - 6, 10, 6);
  ctx.fillRect(x + w - 16, y + h - 6, 10, 6);
  ctx.beginPath();
  ctx.arc(cx, y + 30 + bob, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd76a';
  ctx.fill();
  ctx.strokeStyle = '#d9b45b';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawMineFigure(ctx, x, y, w, h, { armed, time, near = false }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = w / 2;
  // Proximity telegraph: the blink quickens and a warning ring appears while
  // Pip is close enough to trigger the mine.
  const pulse = armed ? 0.5 + 0.5 * Math.sin(time * (near ? 11 : 5)) : 0;
  ctx.fillStyle = armed ? '#3a3f5e' : '#4a4f6e';
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r * 0.7, cy + Math.sin(angle) * r * 0.7);
    ctx.lineTo(cx + Math.cos(angle) * (r + 5), cy + Math.sin(angle) * (r + 5));
    ctx.lineTo(cx + Math.cos(angle + 0.25) * r * 0.7, cy + Math.sin(angle + 0.25) * r * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = armed ? '#2c3050' : '#5a6084';
  ctx.fill();
  ctx.strokeStyle = '#1b1f38';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 5 + pulse * 2, 0, Math.PI * 2);
  ctx.fillStyle = armed ? '#ff6b5e' : '#8b93bd';
  ctx.fill();
  if (armed && pulse > 0.7) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff6b5e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  if (armed && near) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 11);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 11, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff6b5e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

/** Pip, the weight-thief. The silhouette itself changes with the gauge: the
 *  lightest state is small and stretched with a streaming scarf, the anchor
 *  state is broad, low and gold-trimmed. Squash and stretch ride on top. */
export function drawPip(ctx, cx, feetY, opts) {
  const { facing, squash, stretch, runPhase, airborne, invuln, time } = opts;
  const vx = opts.vx || 0;
  const vy = opts.vy || 0;
  const gauge = Math.max(0, Math.min(3, opts.gauge | 0));
  const state = WEIGHTS[gauge];
  const scaleX = [0.92, 1, 1.08, 1.18][gauge];
  const scaleY = [1.06, 1, 0.97, 0.92][gauge];
  const w = 30 * scaleX * (1 + squash * 0.9);
  const h = 44 * scaleY * (1 - squash * 0.55 + stretch * 0.35);
  const blink = invuln > 0 && Math.floor(time * 14) % 2 === 0;
  const bob = !airborne && runPhase ? Math.abs(Math.sin(runPhase)) * 2 : Math.sin(time * 2) * 1;
  const top = feetY - h + bob * 0.4;

  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  // Speed lines: fast horizontal motion and hard falls read at a glance.
  if (Math.abs(vx) > 200 || vy > 450) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = state.colour;
    ctx.lineWidth = 2;
    if (Math.abs(vx) > 200) {
      const back = vx > 0 ? -1 : 1;
      for (let i = 0; i < 3; i += 1) {
        const yy = feetY - h * (0.25 + i * 0.25);
        ctx.beginPath();
        ctx.moveTo(cx + back * (w * 0.6), yy);
        ctx.lineTo(cx + back * (w * 0.6 + 16 + i * 5), yy);
        ctx.stroke();
      }
    }
    if (vy > 450) {
      for (let i = 0; i < 3; i += 1) {
        const xx = cx + (i - 1) * 12;
        ctx.beginPath();
        ctx.moveTo(xx, feetY - h - 6);
        ctx.lineTo(xx, feetY - h - 22 - i * 4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Aura ring in the state's colour.
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 3);
  ctx.strokeStyle = state.colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, feetY - h / 2, w * 0.75, h * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.translate(cx, feetY);
  ctx.scale(facing, 1);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 2, w * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Scarf: streams behind, more wildly the lighter Pip is.
  const scarfLen = [26, 18, 13, 9][gauge];
  const wave = Math.sin(time * 6) * (gauge === 0 ? 5 : 2.5);
  ctx.fillStyle = state.colour;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, top - feetY + 16);
  ctx.lineTo(-w * 0.2 - scarfLen, top - feetY + 12 + wave);
  ctx.lineTo(-w * 0.2 - scarfLen, top - feetY + 19 + wave);
  ctx.lineTo(-w * 0.2, top - feetY + 22);
  ctx.closePath();
  ctx.fill();
  // Cloak.
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, 0);
  ctx.lineTo(-w * 0.3, top - feetY + 16);
  ctx.quadraticCurveTo(0, top - feetY - 2, w * 0.3, top - feetY + 16);
  ctx.lineTo(w * 0.42, 0);
  ctx.closePath();
  ctx.fill();
  // Hood and face.
  ctx.fillStyle = '#3d4a86';
  ctx.beginPath();
  ctx.arc(0, top - feetY + 12, w * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e8d8';
  ctx.beginPath();
  ctx.arc(w * 0.08, top - feetY + 13, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1f38';
  ctx.beginPath();
  ctx.arc(w * 0.14, top - feetY + 12, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Gold trim at anchor, glowing seams at feather.
  if (gauge === 3) {
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -2);
    ctx.lineTo(w * 0.42, -2);
    ctx.stroke();
  }
  if (gauge === 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#9fe8ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, top - feetY + 18);
    ctx.lineTo(0, top - feetY + 30);
    ctx.lineTo(w * 0.3, top - feetY + 18);
    ctx.stroke();
    ctx.restore();
  }
  // Boots: a run cycle when moving on the ground, tucked when airborne.
  ctx.fillStyle = '#2a2f4a';
  const step = airborne ? 0 : Math.sin(runPhase) * 4;
  ctx.fillRect(-w * 0.3 + step * 0.5, -5, 8, 5);
  ctx.fillRect(w * 0.3 - 8 - step * 0.5, -5, 8, 5);
  ctx.restore();
}

function drawSwitchAndGates(ctx, world, time) {
  const { state } = world;
  for (const s of state.switches) {
    ctx.fillStyle = '#3a4170';
    ctx.fillRect(s.x - 2, s.y + s.h - 4, s.w + 4, 6);
    const press = s.active ? 4 : 0;
    ctx.fillStyle = s.active ? '#57e6a8' : '#8b93bd';
    ctx.fillRect(s.x, s.y + press, s.w, s.h - press);
    ctx.fillStyle = s.active ? '#a8ffda' : '#c7cbe4';
    ctx.fillRect(s.x + 3, s.y + press + 2, s.w - 6, 3);
    drawWeightPips(ctx, s.x + s.w / 2, s.y - 8, s.active ? s.threshold : 0, s.threshold);
  }
  // Gates slide up into their slot as a single column per x position.
  const columns = new Map();
  for (const g of state.gates) {
    if (!columns.has(g.x)) columns.set(g.x, []);
    columns.get(g.x).push(g);
  }
  for (const [, tiles] of columns) {
    const top = Math.min(...tiles.map((g) => g.y));
    const bottom = Math.max(...tiles.map((g) => g.y + g.h));
    const lift = state.gateOpen * (bottom - top + 40);
    // A gate in motion shudders as it rises: the movement itself telegraphs.
    const moving = state.gateOpen > 0.02 && state.gateOpen < 0.98;
    const shudder = moving ? Math.sin(time * 40) * 1.5 : 0;
    for (const g of tiles) {
      const y = g.y - lift;
      const gx = g.x + shudder;
      if (y + g.h < -10) continue;
      ctx.fillStyle = '#232844';
      ctx.fillRect(gx, y, g.w, g.h);
      ctx.fillStyle = '#d9b45b';
      for (let bx = gx + 6; bx < gx + g.w; bx += 12) ctx.fillRect(bx, y + 2, 4, g.h - 4);
      ctx.fillStyle = '#8b93bd';
      ctx.fillRect(gx, y + g.h / 2 - 2, g.w, 4);
    }
    ctx.fillStyle = '#1b1f38';
    ctx.fillRect(tiles[0].x - 2, top - 8, tiles[0].w + 4, 8);
  }
}

function drawTargetHints(ctx, targets, time, player) {
  const pulse = 0.6 + 0.4 * Math.sin(time * 6);
  // The tether itself, always visible: a live beam from Pip to the target
  // the next transfer would hit, so the core verb reads in a still frame.
  for (const [target, colour] of [
    [targets.steal, '#b8860b'],
    [targets.give, '#1e6fa8'],
  ]) {
    if (!target || !player) continue;
    const obj = target.obj;
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * pulse;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  for (const [target, colour, key] of [
    [targets.steal, '#b8860b', 'E'],
    [targets.give, '#1e6fa8', 'Q'],
  ]) {
    if (!target) continue;
    const obj = target.obj;
    const cx = obj.x + obj.w / 2;
    const cy = obj.y + obj.h / 2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(obj.w, obj.h) * 0.7 + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(cx, obj.y - 12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8e0';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key, cx, obj.y - 11);
    ctx.restore();
  }
}

export function drawWorld(ctx, world, juice, time, targets) {
  const { state } = world;
  drawBackdrop(ctx, state.roomIndex, time);
  drawZones(ctx, world, time);
  drawTiles(ctx, world);
  drawProps(ctx, world);
  drawDoorFigure(ctx, state.door.x, state.door.y, state.door.w, state.door.h, time);
  drawSwitchAndGates(ctx, world, time);
  state.orbs.forEach((orb, i) => {
    if (!orb.taken) drawOrbFigure(ctx, orb.x, orb.y, time, i * 1.7);
  });
  const p = state.player;
  const pcx = p.x + p.w / 2;
  const pcy = p.y + p.h / 2;
  const nearTo = (obj, radius) => Math.hypot(obj.x + obj.w / 2 - pcx, obj.y + obj.h / 2 - pcy) < radius;
  for (const m of state.mines) {
    drawMineFigure(ctx, m.x, m.y, m.w, m.h, { armed: m.armed, time, near: nearTo(m, MINE.armRadius) });
  }
  for (const c of state.crates) {
    drawCrateFigure(ctx, c.x, c.y, c.w, c.h, { weight: c.weight, maxWeight: c.maxWeight, time });
  }
  for (const b of state.boulders) {
    drawBoulderFigure(ctx, b.x, b.y, b.w, b.h, { weight: b.weight, roll: b.roll, time });
  }
  for (const g of state.golems) {
    drawGolemFigure(ctx, g.x, g.y, g.w, g.h, { dir: g.dir, time, alive: g.alive, alert: nearTo(g, 150) });
  }
  drawPip(ctx, p.x + p.w / 2, p.y + p.h, {
    gauge: p.gauge,
    facing: p.facing,
    squash: p.squash > 0 ? p.squash * 4 : 0,
    stretch: p.stretch > 0 ? p.stretch * 4 : 0,
    runPhase: p.runPhase,
    airborne: !p.onGround,
    invuln: p.invuln,
    vx: p.vx,
    vy: p.vy,
    time,
  });
  drawTargetHints(ctx, targets, time, { x: pcx, y: pcy });
  juice.draw(ctx);
  // A light vignette to hold the frame together — thin now that the vault
  // is bright; the v3 0.42 darkened every corner into empty space.
  const vig = ctx.createRadialGradient(480, 300, 320, 480, 300, 640);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(58, 42, 24, 0.16)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}
