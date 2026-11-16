// Rendering: the dark saturated vault, drawn in layers — far arches,
// midground pillars, stone, decor, objects, the weight-thief, then juice.
// Characters read by silhouette and value: light bodies on dark walls,
// one reserved colour per meaning (cyan = weight, gold = reward,
// magenta = danger). The HUD is drawn unshaken by hud.js.

import { PALETTE, VIEW, WEIGHT_NAMES } from './config.js';
import { makeRng, range } from './random.js';

const FONT = '"Avenir Next", "Segoe UI", Verdana, sans-serif';

const decorCache = new Map();

function getDecor(levelIndex) {
  if (decorCache.has(levelIndex)) return decorCache.get(levelIndex);
  const rng = makeRng(1000 + levelIndex * 77);
  const decor = {
    arches: [],
    pillars: [],
    runes: [],
    dust: [],
    cracks: [],
    chains: [],
  };
  for (let i = 0; i < 5; i += 1) {
    decor.arches.push({ x: 60 + i * 210 + range(rng, -20, 20), w: 130 + range(rng, -15, 25), h: 300 + range(rng, -30, 40) });
  }
  for (let i = 0; i < 4; i += 1) {
    decor.pillars.push({ x: 150 + i * 230 + range(rng, -30, 30), w: 34 + range(rng, 0, 14) });
  }
  for (let i = 0; i < 10; i += 1) {
    decor.runes.push({ x: range(rng, 40, 920), y: range(rng, 90, 420), rot: range(rng, 0, Math.PI), s: range(rng, 5, 9) });
  }
  for (let i = 0; i < 42; i += 1) {
    decor.dust.push({ x: range(rng, 30, 930), y: range(rng, 60, 530), r: range(rng, 0.8, 2.2), ph: range(rng, 0, Math.PI * 2), sp: range(rng, 0.2, 0.7) });
  }
  for (let i = 0; i < 6; i += 1) {
    decor.cracks.push({ x: range(rng, 60, 900), y: 542 + range(rng, 0, 40), len: range(rng, 20, 50), rot: range(rng, 0, Math.PI) });
  }
  for (let i = 0; i < 4; i += 1) {
    decor.chains.push({ x: range(rng, 60, 900), len: range(rng, 120, 260), hook: rng() > 0.5 });
  }
  decorCache.set(levelIndex, decor);
  return decor;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, levelIndex, time) {
  const decor = getDecor(levelIndex);
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  grad.addColorStop(0, PALETTE.sky0);
  grad.addColorStop(0.55, PALETTE.sky1);
  grad.addColorStop(1, '#0d1129');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // Faint brick courses so the wall never reads as flat void.
  ctx.strokeStyle = 'rgba(59, 68, 116, 0.28)';
  ctx.lineWidth = 1;
  for (let yy = 84; yy < 540; yy += 42) {
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(VIEW.w, yy);
    ctx.stroke();
    const offset = (Math.floor(yy / 42) % 2) * 40;
    for (let xx = offset; xx < VIEW.w; xx += 80) {
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + 42);
      ctx.stroke();
    }
  }

  // Far arches: tall, dim, receding.
  for (const arch of decor.arches) {
    ctx.fillStyle = 'rgba(26, 32, 68, 0.85)';
    ctx.beginPath();
    ctx.moveTo(arch.x - arch.w / 2, 540);
    ctx.lineTo(arch.x - arch.w / 2, 540 - arch.h + arch.w / 2);
    ctx.arc(arch.x, 540 - arch.h + arch.w / 2, arch.w / 2, Math.PI, 0);
    ctx.lineTo(arch.x + arch.w / 2, 540);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(96, 106, 160, 0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner arch line for depth.
    ctx.strokeStyle = 'rgba(59, 68, 116, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arch.x - arch.w / 2 + 14, 540);
    ctx.lineTo(arch.x - arch.w / 2 + 14, 540 - arch.h + arch.w / 2);
    ctx.arc(arch.x, 540 - arch.h + arch.w / 2, arch.w / 2 - 14, Math.PI, 0);
    ctx.lineTo(arch.x + arch.w / 2 - 14, 540);
    ctx.stroke();
    // Inner glow slit.
    ctx.fillStyle = 'rgba(77, 227, 224, 0.12)';
    ctx.fillRect(arch.x - 4, 540 - arch.h + 30, 8, arch.h - 60);
  }

  // Hanging chains with hooks and rings, filling the middle band.
  for (const chain of decor.chains) {
    ctx.strokeStyle = 'rgba(14, 17, 38, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chain.x, 0);
    ctx.lineTo(chain.x, chain.len);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(106, 116, 168, 0.5)';
    ctx.lineWidth = 1;
    for (let yy = 10; yy < chain.len; yy += 12) {
      ctx.beginPath();
      ctx.moveTo(chain.x - 3, yy);
      ctx.lineTo(chain.x + 3, yy);
      ctx.stroke();
    }
    if (chain.hook) {
      ctx.strokeStyle = 'rgba(106, 116, 168, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(chain.x, chain.len + 8, 8, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(106, 116, 168, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(chain.x, chain.len + 8, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Midground pillars.
  for (const pillar of decor.pillars) {
    ctx.fillStyle = PALETTE.wallDark;
    ctx.fillRect(pillar.x, 60, pillar.w, 480);
    ctx.fillStyle = PALETTE.wallEdge;
    ctx.fillRect(pillar.x, 60, 3, 480);
    ctx.fillRect(pillar.x + pillar.w - 3, 60, 3, 480);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(pillar.x - 6, 52, pillar.w + 12, 14);
    ctx.fillRect(pillar.x - 6, 526, pillar.w + 12, 14);
  }

  // Wall runes: faint cyan geometry.
  ctx.save();
  ctx.strokeStyle = 'rgba(77, 227, 224, 0.35)';
  ctx.lineWidth = 2;
  for (const rune of decor.runes) {
    ctx.save();
    ctx.translate(rune.x, rune.y);
    ctx.rotate(rune.rot);
    ctx.strokeRect(-rune.s, -rune.s, rune.s * 2, rune.s * 2);
    ctx.beginPath();
    ctx.moveTo(0, -rune.s * 1.6);
    ctx.lineTo(0, rune.s * 1.6);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Drifting dust motes.
  for (const mote of decor.dust) {
    const a = 0.25 + 0.2 * Math.sin(time * mote.sp + mote.ph);
    ctx.fillStyle = `rgba(242, 231, 201, ${Math.max(0.05, a)})`;
    ctx.beginPath();
    ctx.arc(mote.x + Math.sin(time * 0.3 + mote.ph) * 8, mote.y + Math.cos(time * 0.22 + mote.ph) * 6, mote.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStoneRect(ctx, x, y, w, h, top) {
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(x, y, w, Math.min(h, 8));
  if (top) {
    ctx.fillStyle = PALETTE.stoneEdge;
    ctx.fillRect(x, y, w, 3);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + h - 4, w, 4);
  // Block seams.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = 1;
  for (let sx = x + 40; sx < x + w - 4; sx += 40) {
    ctx.beginPath();
    ctx.moveTo(sx, y + 2);
    ctx.lineTo(sx, y + h - 2);
    ctx.stroke();
  }
}

function drawFloor(ctx, levelIndex) {
  const decor = getDecor(levelIndex);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 540, VIEW.w, 60);
  ctx.fillStyle = PALETTE.floorEdge;
  ctx.fillRect(0, 540, VIEW.w, 4);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  for (let sx = 40; sx < VIEW.w; sx += 80) {
    ctx.beginPath();
    ctx.moveTo(sx, 544);
    ctx.lineTo(sx, 600);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  for (const crack of decor.cracks) {
    ctx.beginPath();
    ctx.moveTo(crack.x, crack.y);
    ctx.lineTo(crack.x + Math.cos(crack.rot) * crack.len, crack.y + Math.sin(crack.rot) * 6);
    ctx.stroke();
  }
}

function drawZones(ctx, world, time) {
  for (const zone of world.level.updrafts) {
    ctx.save();
    ctx.fillStyle = 'rgba(77, 227, 224, 0.08)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = 'rgba(77, 227, 224, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const yy = zone.y + zone.h - ((time * 90 + i * 90) % zone.h);
      const xx = zone.x + 14 + i * 20;
      ctx.beginPath();
      ctx.moveTo(xx - 7, yy + 6);
      ctx.lineTo(xx, yy - 4);
      ctx.lineTo(xx + 7, yy + 6);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const zone of world.level.gales) {
    ctx.save();
    ctx.fillStyle = 'rgba(244, 81, 126, 0.07)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = 'rgba(244, 197, 66, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const yy = zone.y + 30 + i * 52;
      const travel = (time * 160) % (zone.w + 60);
      const xx = zone.dir > 0 ? zone.x - 30 + travel : zone.x + zone.w + 30 - travel;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + zone.dir * 26, yy);
      ctx.moveTo(xx + zone.dir * 18, yy - 6);
      ctx.lineTo(xx + zone.dir * 26, yy);
      ctx.lineTo(xx + zone.dir * 18, yy + 6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(244, 197, 66, 0.9)';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(zone.dir > 0 ? 'GALE →' : '← GALE', zone.x + zone.w / 2, zone.y + 18);
    ctx.restore();
  }
}

function drawLantern(ctx, x, y, time, seed) {
  const flicker = 0.85 + 0.15 * Math.sin(time * 3 + seed * 7);
  ctx.strokeStyle = '#11142e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, y);
  ctx.stroke();
  const glow = ctx.createRadialGradient(x, y + 10, 2, x, y + 10, 52);
  glow.addColorStop(0, `rgba(245, 197, 66, ${0.35 * flicker})`);
  glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + 10, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#11142e';
  ctx.fillRect(x - 8, y, 16, 22);
  ctx.fillStyle = `rgba(245, 197, 66, ${flicker})`;
  ctx.fillRect(x - 5, y + 3, 10, 16);
}

function drawBanner(ctx, x, y) {
  ctx.fillStyle = '#3a2a55';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x + 16, y + 64);
  ctx.lineTo(x, y + 50);
  ctx.lineTo(x - 16, y + 64);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x + 7, y + 26);
  ctx.lineTo(x, y + 38);
  ctx.lineTo(x - 7, y + 26);
  ctx.closePath();
  ctx.fill();
}

function drawCracked(ctx, slab, world, time) {
  if (slab.broken) return;
  const boulderPress = world.boulders.some((b) => b.breakTimer > 0 && Math.abs(b.y + b.h - slab.y) < 4 && b.x + b.w > slab.x && b.x < slab.x + slab.w);
  const shake = boulderPress ? Math.sin(time * 40) * 1.5 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = '#6d5a3a';
  ctx.fillRect(slab.x, slab.y, slab.w, slab.h);
  ctx.fillStyle = '#8a744a';
  ctx.fillRect(slab.x, slab.y, slab.w, 4);
  ctx.strokeStyle = 'rgba(20, 14, 6, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(slab.x + slab.w * 0.25, slab.y);
  ctx.lineTo(slab.x + slab.w * 0.35, slab.y + 12);
  ctx.lineTo(slab.x + slab.w * 0.28, slab.y + slab.h);
  ctx.moveTo(slab.x + slab.w * 0.6, slab.y);
  ctx.lineTo(slab.x + slab.w * 0.55, slab.y + 10);
  ctx.lineTo(slab.x + slab.w * 0.66, slab.y + slab.h);
  ctx.moveTo(slab.x + slab.w * 0.85, slab.y + 4);
  ctx.lineTo(slab.x + slab.w * 0.78, slab.y + slab.h);
  ctx.stroke();
  ctx.fillStyle = 'rgba(20, 14, 6, 0.55)';
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('CRACKED', slab.x + slab.w / 2, slab.y + 17);
  ctx.restore();
}

function drawWeightPips(ctx, cx, cy, weight, max) {
  for (let i = 0; i < max; i += 1) {
    ctx.beginPath();
    ctx.arc(cx + (i - (max - 1) / 2) * 11, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = i < weight ? PALETTE.cyan : 'rgba(255, 255, 255, 0.25)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(7, 10, 24, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCrate(ctx, crate) {
  ctx.fillStyle = PALETTE.crateDark;
  ctx.fillRect(crate.x, crate.y, 36, 36);
  ctx.fillStyle = PALETTE.crate;
  ctx.fillRect(crate.x + 2, crate.y + 2, 32, 32);
  ctx.strokeStyle = 'rgba(40, 24, 8, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(crate.x + 2, crate.y + 2, 32, 32);
  ctx.beginPath();
  ctx.moveTo(crate.x + 2, crate.y + 2);
  ctx.lineTo(crate.x + 34, crate.y + 34);
  ctx.moveTo(crate.x + 34, crate.y + 2);
  ctx.lineTo(crate.x + 2, crate.y + 34);
  ctx.stroke();
  if (crate.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${crate.flash * 2})`;
    ctx.fillRect(crate.x, crate.y, 36, 36);
  }
  drawWeightPips(ctx, crate.x + 18, crate.y - 8, crate.weight, 2);
}

function drawBoulder(ctx, boulder) {
  ctx.fillStyle = PALETTE.boulderDark;
  ctx.beginPath();
  ctx.arc(boulder.x + 20, boulder.y + 20, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.boulder;
  ctx.beginPath();
  ctx.arc(boulder.x + 18, boulder.y + 18, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 22, 40, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(boulder.x + 10, boulder.y + 12);
  ctx.lineTo(boulder.x + 18, boulder.y + 22);
  ctx.lineTo(boulder.x + 13, boulder.y + 32);
  ctx.stroke();
  if (boulder.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${boulder.flash * 2})`;
    ctx.beginPath();
    ctx.arc(boulder.x + 20, boulder.y + 20, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  drawWeightPips(ctx, boulder.x + 20, boulder.y - 8, boulder.weight, 2);
}

function drawGolem(ctx, golem, world, time) {
  if (!golem.alive) return;
  const lean = golem.alert * golem.dir * 0.08;
  const cx = golem.x + 26;
  ctx.save();
  ctx.translate(cx, golem.y + 56);
  ctx.rotate(lean);
  ctx.translate(-cx, -(golem.y + 56));
  // Feet.
  ctx.fillStyle = PALETTE.golemDark;
  ctx.fillRect(golem.x + 8, golem.y + 48, 14, 8);
  ctx.fillRect(golem.x + 30, golem.y + 48, 14, 8);
  // Body.
  ctx.fillStyle = PALETTE.golemDark;
  roundRect(ctx, golem.x + 4, golem.y + 18, 44, 34, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.golem;
  roundRect(ctx, golem.x + 7, golem.y + 20, 38, 30, 5);
  ctx.fill();
  // Arms.
  const swing = Math.sin(time * 4) * 3;
  ctx.fillStyle = PALETTE.golemDark;
  ctx.fillRect(golem.x - 2, golem.y + 24 + swing, 8, 22);
  ctx.fillRect(golem.x + 46, golem.y + 24 - swing, 8, 22);
  // Head.
  ctx.fillStyle = PALETTE.golemDark;
  roundRect(ctx, golem.x + 12, golem.y, 28, 22, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.golem;
  roundRect(ctx, golem.x + 14, golem.y + 2, 24, 18, 4);
  ctx.fill();
  // Eyes: glow brighter when alert.
  const eyeColor = golem.alert > 0.3 ? PALETTE.magenta : PALETTE.gold;
  ctx.fillStyle = eyeColor;
  ctx.fillRect(golem.x + 18, golem.y + 8, 7, 5);
  ctx.fillRect(golem.x + 27, golem.y + 8, 7, 5);
  if (golem.alert > 0.3) {
    ctx.fillStyle = 'rgba(244, 81, 126, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, golem.y + 26, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cracks.
  ctx.strokeStyle = 'rgba(20, 22, 40, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(golem.x + 14, golem.y + 24);
  ctx.lineTo(golem.x + 20, golem.y + 34);
  ctx.lineTo(golem.x + 16, golem.y + 44);
  ctx.stroke();
  if (golem.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${golem.flash * 2})`;
    ctx.fillRect(golem.x, golem.y, 52, 56);
  }
  ctx.restore();
  drawWeightPips(ctx, cx, golem.y - 8, golem.weight, 1);
}

function drawMine(ctx, mine, time) {
  const cx = mine.x + 15;
  const cy = mine.y + 15;
  if (!mine.armed) {
    ctx.fillStyle = '#3a3f62';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 6);
    ctx.lineTo(cx + 6, cy + 6);
    ctx.moveTo(cx + 6, cy - 6);
    ctx.lineTo(cx - 6, cy + 6);
    ctx.stroke();
    return;
  }
  // Spikes.
  ctx.fillStyle = '#2c3050';
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + time * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
    ctx.lineTo(cx + Math.cos(a + 0.18) * 10, cy + Math.sin(a + 0.18) * 10);
    ctx.lineTo(cx + Math.cos(a + 0.09) * 19, cy + Math.sin(a + 0.09) * 19);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#454b78';
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  // Core blinks faster when the player is close.
  const rate = mine.near ? 14 : 3;
  const on = Math.sin(time * rate + mine.phase) > 0;
  ctx.fillStyle = on ? PALETTE.danger : '#7a2030';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  if (on && mine.near) {
    ctx.fillStyle = 'rgba(255, 90, 78, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  if (mine.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${mine.flash * 2})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  drawWeightPips(ctx, cx, mine.y - 10, mine.weight, 1);
}

function drawOrb(ctx, orb, time) {
  if (orb.taken) return;
  const cx = orb.x + 9;
  const cy = orb.y + 9 + Math.sin(time * 2.4 + orb.phase) * 4;
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
  glow.addColorStop(0, 'rgba(255, 217, 77, 0.5)');
  glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.orb;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 11);
  ctx.lineTo(cx + 8, cy);
  ctx.lineTo(cx, cy + 11);
  ctx.lineTo(cx - 8, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 4, cy);
  ctx.lineTo(cx, cy + 6);
  ctx.lineTo(cx - 4, cy);
  ctx.closePath();
  ctx.fill();
}

function drawSwitch(ctx, sw) {
  const pressed = sw.latched || sw.pressed;
  ctx.fillStyle = '#1a1e3a';
  ctx.fillRect(sw.x - 3, sw.y + 4, 50, 8);
  ctx.fillStyle = pressed ? PALETTE.gold : PALETTE.stone;
  ctx.fillRect(sw.x, sw.y + (pressed ? 5 : 0), 44, pressed ? 6 : 10);
  ctx.fillStyle = pressed ? '#fff3c4' : PALETTE.stoneEdge;
  ctx.fillRect(sw.x, sw.y + (pressed ? 5 : 0), 44, 2);
  if (sw.latched) {
    ctx.fillStyle = 'rgba(245, 197, 66, 0.25)';
    ctx.beginPath();
    ctx.arc(sw.x + 22, sw.y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGate(ctx, gate) {
  const lift = gate.openAnim * (gate.h - 12);
  ctx.save();
  ctx.translate(0, -lift);
  ctx.globalAlpha = gate.open ? Math.max(0.25, 1 - gate.openAnim * 0.6) : 1;
  ctx.fillStyle = '#141830';
  ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
  ctx.fillStyle = PALETTE.stoneEdge;
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(gate.x + 3 + i * 7, gate.y, 4, gate.h);
  }
  ctx.fillStyle = PALETTE.goldDim;
  ctx.fillRect(gate.x, gate.y, gate.w, 6);
  ctx.fillRect(gate.x, gate.y + gate.h - 6, gate.w, 6);
  ctx.restore();
}

function drawDoor(ctx, world, time) {
  const [dx, dy] = world.level.door;
  const open = world.doorOpen;
  // Frame.
  ctx.fillStyle = PALETTE.stoneDark;
  ctx.fillRect(dx - 6, dy - 8, 56, 72);
  ctx.fillStyle = PALETTE.stone;
  ctx.fillRect(dx - 3, dy - 5, 50, 69);
  if (open) {
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);
    const glow = ctx.createRadialGradient(dx + 22, dy + 32, 4, dx + 22, dy + 32, 60);
    glow.addColorStop(0, `rgba(77, 227, 224, ${0.45 * pulse})`);
    glow.addColorStop(1, 'rgba(77, 227, 224, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(dx + 22, dy + 32, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0e3a3a';
    ctx.fillRect(dx, dy, 44, 64);
    ctx.fillStyle = `rgba(77, 227, 224, ${0.55 * pulse})`;
    ctx.beginPath();
    ctx.ellipse(dx + 22, dy + 32, 12 + 3 * Math.sin(time * 2), 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(dx + 22, dy + 32, 5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#141830';
    ctx.fillRect(dx, dy, 44, 64);
    ctx.strokeStyle = 'rgba(77, 227, 224, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 6, dy + 6, 32, 52);
    // Chains + lock.
    ctx.strokeStyle = '#0a0c1c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(dx, dy + 18);
    ctx.lineTo(dx + 44, dy + 18);
    ctx.moveTo(dx, dy + 44);
    ctx.lineTo(dx + 44, dy + 44);
    ctx.stroke();
    ctx.fillStyle = PALETTE.gold;
    roundRect(ctx, dx + 15, dy + 26, 14, 12, 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(dx + 22, dy + 26, 6, Math.PI, 0);
    ctx.stroke();
  }
  ctx.fillStyle = open ? PALETTE.cyan : 'rgba(242, 231, 201, 0.75)';
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'OPEN →' : 'LOCKED', dx + 22, dy - 12);
}

function drawTargetHighlight(ctx, world, time) {
  const target = world.stealTarget || world.giveTarget;
  if (!target) return;
  const obj = target.obj;
  const cx = obj.x + obj.w / 2;
  const cy = obj.y + obj.h / 2;
  const r = Math.max(obj.w, obj.h) * 0.75 + 4 + Math.sin(time * 6) * 2;
  const color = world.stealTarget ? PALETTE.cyan : PALETTE.gold;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(world.stealTarget ? 'E · STEAL' : 'Q · GIVE', cx, obj.y - 16);
  ctx.restore();
}

export function drawPlayer(ctx, player, time) {
  const g = player.gauge;
  const widths = [26, 30, 34, 38];
  const heights = [38, 42, 40, 44];
  const w = widths[g];
  const h = heights[g];
  const cx = player.x + player.w / 2;
  const feet = player.y + player.h;
  const blink = player.invuln > 0 && Math.floor(time * 14) % 2 === 0;

  ctx.save();
  if (blink) ctx.globalAlpha = 0.45;
  ctx.translate(cx, feet);
  ctx.scale(player.squashX, player.squashY);
  ctx.translate(-cx, -feet);

  // FEATHER aura / ANCHOR ground ring.
  if (g === 0) {
    const glow = ctx.createRadialGradient(cx, feet - h / 2, 4, cx, feet - h / 2, 34);
    glow.addColorStop(0, 'rgba(77, 227, 224, 0.35)');
    glow.addColorStop(1, 'rgba(77, 227, 224, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, feet - h / 2, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  if (g === 3) {
    ctx.strokeStyle = 'rgba(245, 197, 66, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, feet + 1, w / 2 + 4, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Scarf: flutters opposite the facing, faster when moving.
  const flutter = Math.sin(time * 9) * 3 + Math.sin(time * 23) * 1.5;
  const scarfLen = 16 + Math.abs(player.vx) * 0.03;
  ctx.fillStyle = PALETTE.magenta;
  ctx.beginPath();
  ctx.moveTo(cx - player.facing * (w / 2 - 4), feet - h + 12);
  ctx.quadraticCurveTo(
    cx - player.facing * (w / 2 + scarfLen * 0.6), feet - h + 10 + flutter,
    cx - player.facing * (w / 2 + scarfLen), feet - h + 14 + flutter * 1.4,
  );
  ctx.lineTo(cx - player.facing * (w / 2 + scarfLen), feet - h + 20 + flutter * 1.4);
  ctx.quadraticCurveTo(
    cx - player.facing * (w / 2 + scarfLen * 0.6), feet - h + 18 + flutter,
    cx - player.facing * (w / 2 - 4), feet - h + 19,
  );
  ctx.closePath();
  ctx.fill();

  // Body: silhouette morphs with weight.
  const bx = cx - w / 2;
  const by = feet - h;
  ctx.fillStyle = PALETTE.pipDark[g];
  roundRect(ctx, bx - 1.5, by - 1.5, w + 3, h + 3, g === 3 ? 6 : 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.pip[g];
  roundRect(ctx, bx, by, w, h, g === 3 ? 5 : 9);
  ctx.fill();
  // Belly weight-stone.
  ctx.fillStyle = 'rgba(16, 20, 46, 0.85)';
  ctx.beginPath();
  ctx.arc(cx, feet - h * 0.42, 6 + g * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.cyan;
  ctx.beginPath();
  ctx.arc(cx, feet - h * 0.42, 3 + g, 0, Math.PI * 2);
  ctx.fill();

  // Feet.
  const stepping = player.onGround && Math.abs(player.vx) > 30 ? Math.sin(time * 14) * 3 : 0;
  ctx.fillStyle = PALETTE.pipDark[g];
  ctx.fillRect(bx + 3, feet - 5, 9, 5);
  ctx.fillRect(bx + w - 12, feet - 5 + stepping * 0.4, 9, 5);

  // Eye: white + pupil toward facing.
  const ex = cx + player.facing * (w / 2 - 9);
  const ey = feet - h + 11;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(ex + player.facing * 2, ey, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // FEATHER wisp tail.
  if (g === 0) {
    ctx.fillStyle = 'rgba(189, 243, 242, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx - player.facing * (w / 2 + 4), feet - h * 0.6 + flutter * 0.5, 7, 4, 0.4 * player.facing, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Weight name tag above the head (hidden on backdrops and in strips).
  if (!player.hideTag) {
    ctx.save();
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(7, 10, 24, 0.7)';
    const label = WEIGHT_NAMES[g];
    const tw = ctx.measureText(label).width + 12;
    roundRect(ctx, cx - tw / 2, feet - h - 20, tw, 15, 7);
    ctx.fill();
    ctx.fillStyle = g === 0 ? PALETTE.cyan : g === 3 ? PALETTE.gold : '#ffffff';
    ctx.fillText(label, cx, feet - h - 9);
    ctx.restore();
  }
}

export function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(480, 300, 260, 480, 300, 560);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(3, 4, 12, 0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

export function drawWorld(ctx, world, juice, time) {
  const level = world.level;
  drawBackground(ctx, world.levelIndex, time);
  drawZones(ctx, world, time);
  // Stone: floor first, then ledges and walls.
  drawFloor(ctx, world.levelIndex);
  for (const [x, y, w, h] of level.solids) {
    if (y >= 540) continue; // the floor band is drawn above
    drawStoneRect(ctx, x, y, w, h, true);
  }
  for (const slab of world.cracked) drawCracked(ctx, slab, world, time);
  for (const [x, y] of level.lanterns) drawLantern(ctx, x, y, time, x);
  for (const [x, y] of level.banners) drawBanner(ctx, x, y);
  for (const sw of world.switches) drawSwitch(ctx, sw);
  for (const gate of world.gates) drawGate(ctx, gate);
  drawDoor(ctx, world, time);
  drawTargetHighlight(ctx, world, time);
  for (const orb of world.orbs) drawOrb(ctx, orb, time);
  for (const crate of world.crates) drawCrate(ctx, crate);
  for (const boulder of world.boulders) drawBoulder(ctx, boulder);
  for (const golem of world.golems) drawGolem(ctx, golem, world, time);
  for (const mine of world.mines) drawMine(ctx, mine, time);
  drawPlayer(ctx, world.player, time);
}
