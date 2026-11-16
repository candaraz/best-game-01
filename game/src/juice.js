// Juice: particles, beams, shockwave rings, floating text, rubble decals,
// trauma shake and hit-stop. Everything here is presentation only — it
// reads world events and never writes back into the simulation.

import { FEEL, PALETTE } from './config.js';
import { makeRng } from './random.js';

export function createJuice(seed) {
  const rng = makeRng(seed);
  const juice = {
    particles: [],
    rings: [],
    beams: [],
    texts: [],
    decals: [],
    trauma: 0,
    hitStop: 0,
    shakeX: 0,
    shakeY: 0,
    time: 0,
    rng,
  };
  return juice;
}

function spawnParticles(juice, x, y, count, opts) {
  const { colors, speed, life, size, gravity, spread } = opts;
  for (let i = 0; i < count; i += 1) {
    const angle = juice.rng() * Math.PI * 2;
    const v = speed * (0.35 + juice.rng() * 0.85);
    juice.particles.push({
      x, y,
      vx: Math.cos(angle) * v * (spread ?? 1),
      vy: Math.sin(angle) * v - speed * 0.35,
      life: life * (0.6 + juice.rng() * 0.7),
      maxLife: life,
      size: size * (0.6 + juice.rng() * 0.8),
      color: colors[Math.floor(juice.rng() * colors.length)],
      gravity: gravity ?? 900,
    });
  }
}

export function addTrauma(juice, amount) {
  juice.trauma = Math.min(1, juice.trauma + amount);
}

export function addHitStop(juice, seconds) {
  juice.hitStop = Math.max(juice.hitStop, seconds);
}

export function handleEvent(juice, event, world) {
  switch (event.type) {
    case 'steal': {
      juice.beams.push({ x1: event.tx, y1: event.ty, x2: event.x, y2: event.y, life: 0.28, maxLife: 0.28, kind: 'steal' });
      spawnParticles(juice, event.tx, event.ty, 10, { colors: [PALETTE.cyan, '#ffffff'], speed: 120, life: 0.4, size: 3, gravity: 200 });
      addTrauma(juice, FEEL.traumaSteal);
      break;
    }
    case 'give': {
      juice.beams.push({ x1: event.x, y1: event.y, x2: event.tx, y2: event.ty, life: 0.28, maxLife: 0.28, kind: 'give' });
      spawnParticles(juice, event.tx, event.ty, 10, { colors: [PALETTE.gold, '#ffffff'], speed: 120, life: 0.4, size: 3, gravity: 200 });
      addTrauma(juice, FEEL.traumaSteal);
      break;
    }
    case 'pop': {
      juice.rings.push({ x: event.x, y: event.y, r: 8, maxR: 90, life: 0.4, maxLife: 0.4, color: PALETTE.cyan, width: 5 });
      spawnParticles(juice, event.x, event.y, 26, { colors: [PALETTE.golem, PALETTE.golemDark, PALETTE.cyan, '#ffffff'], speed: 260, life: 0.7, size: 5, gravity: 1100 });
      juice.decals.push({ x: event.x - 26, y: 540 - 8, w: 52, h: 8, kind: 'rubble', seed: juice.rng() });
      addTrauma(juice, FEEL.traumaPop);
      addHitStop(juice, FEEL.hitStopPop);
      break;
    }
    case 'disarm': {
      juice.rings.push({ x: event.x, y: event.y, r: 6, maxR: 60, life: 0.35, maxLife: 0.35, color: PALETTE.gold, width: 4 });
      spawnParticles(juice, event.x, event.y, 16, { colors: [PALETTE.gold, PALETTE.cyan, '#ffffff'], speed: 160, life: 0.5, size: 3, gravity: 300 });
      break;
    }
    case 'smash': {
      juice.rings.push({ x: event.x, y: event.y, r: 10, maxR: 120, life: 0.5, maxLife: 0.5, color: PALETTE.gold, width: 6 });
      spawnParticles(juice, event.x, event.y, 34, { colors: [PALETTE.stone, PALETTE.stoneDark, PALETTE.gold, '#ffffff'], speed: 320, life: 0.8, size: 6, gravity: 1300 });
      juice.decals.push({ x: event.x - 40, y: event.y + 8, w: 80, h: 10, kind: 'rubble', seed: juice.rng() });
      addTrauma(juice, FEEL.traumaSmash);
      addHitStop(juice, FEEL.hitStopSmash);
      break;
    }
    case 'explosion': {
      juice.rings.push({ x: event.x, y: event.y, r: 10, maxR: 130, life: 0.5, maxLife: 0.5, color: PALETTE.danger, width: 7 });
      juice.rings.push({ x: event.x, y: event.y, r: 4, maxR: 70, life: 0.35, maxLife: 0.35, color: '#ffffff', width: 4 });
      spawnParticles(juice, event.x, event.y, 36, { colors: [PALETTE.danger, PALETTE.magenta, PALETTE.gold, '#ffffff'], speed: 340, life: 0.7, size: 5, gravity: 900 });
      juice.decals.push({ x: event.x - 24, y: 540 - 6, w: 48, h: 6, kind: 'scorch', seed: juice.rng() });
      addTrauma(juice, FEEL.traumaExplosion);
      addHitStop(juice, FEEL.hitStopExplosion);
      break;
    }
    case 'orb': {
      spawnParticles(juice, event.x, event.y, 14, { colors: [PALETTE.orb, '#ffffff', PALETTE.gold], speed: 130, life: 0.5, size: 3, gravity: -60 });
      juice.rings.push({ x: event.x, y: event.y, r: 4, maxR: 44, life: 0.3, maxLife: 0.3, color: PALETTE.orb, width: 3 });
      break;
    }
    case 'score': {
      const label = event.combo > 1 ? `+${event.gained}  ×${event.combo}` : `+${event.gained}`;
      juice.texts.push({ x: event.x, y: event.y - 14, vy: -46, life: 0.9, maxLife: 0.9, text: label, big: event.combo >= 3 });
      break;
    }
    case 'jump': {
      spawnParticles(juice, event.x, event.y, 6, { colors: ['#8f96c4', '#6a74a8'], speed: 70, life: 0.35, size: 3, gravity: 300, spread: 1.6 });
      break;
    }
    case 'land': {
      spawnParticles(juice, event.x, event.y, 8, { colors: ['#8f96c4', '#6a74a8'], speed: 90, life: 0.4, size: 3, gravity: 400, spread: 1.8 });
      break;
    }
    case 'hardLand': {
      spawnParticles(juice, event.x, event.y, 14, { colors: ['#8f96c4', '#6a74a8', PALETTE.gold], speed: 140, life: 0.45, size: 4, gravity: 500, spread: 2 });
      juice.rings.push({ x: event.x, y: event.y, r: 6, maxR: 52, life: 0.3, maxLife: 0.3, color: '#8f96c4', width: 3 });
      addTrauma(juice, FEEL.traumaLand);
      break;
    }
    case 'hurt': {
      spawnParticles(juice, event.x, event.y, 18, { colors: [PALETTE.danger, '#ffffff'], speed: 220, life: 0.5, size: 4, gravity: 600 });
      addTrauma(juice, 0.55);
      addHitStop(juice, 0.06);
      break;
    }
    case 'skin': {
      juice.rings.push({ x: event.x, y: event.y, r: 10, maxR: 70, life: 0.4, maxLife: 0.4, color: PALETTE.cyan, width: 5 });
      juice.texts.push({ x: event.x, y: event.y - 30, vy: -40, life: 0.9, maxLife: 0.9, text: 'STONE SKIN', big: false });
      break;
    }
    case 'switch': {
      spawnParticles(juice, event.x, event.y, 12, { colors: [PALETTE.gold, '#ffffff'], speed: 120, life: 0.4, size: 3, gravity: -100 });
      juice.rings.push({ x: event.x, y: event.y, r: 6, maxR: 56, life: 0.35, maxLife: 0.35, color: PALETTE.gold, width: 4 });
      break;
    }
    case 'gate': {
      spawnParticles(juice, event.x, event.y, 10, { colors: ['#8f96c4'], speed: 80, life: 0.4, size: 3, gravity: 500 });
      addTrauma(juice, 0.2);
      break;
    }
    case 'doorOpen': {
      spawnParticles(juice, event.x, event.y, 20, { colors: [PALETTE.cyan, PALETTE.gold, '#ffffff'], speed: 150, life: 0.7, size: 3, gravity: -80 });
      juice.rings.push({ x: event.x, y: event.y, r: 8, maxR: 80, life: 0.5, maxLife: 0.5, color: PALETTE.cyan, width: 4 });
      break;
    }
    case 'respawn': {
      spawnParticles(juice, event.x, event.y, 12, { colors: [PALETTE.cyan, '#ffffff'], speed: 100, life: 0.4, size: 3, gravity: 0 });
      break;
    }
    default:
      break;
  }
  void world;
}

export function stepJuice(juice, dt) {
  juice.time += dt;
  if (juice.hitStop > 0) juice.hitStop -= dt;
  juice.trauma = Math.max(0, juice.trauma - FEEL.shakeDecay * dt);
  // Trauma squared, noise-driven, camera only (Eiserloh).
  const mag = juice.trauma * juice.trauma * FEEL.shakeMax;
  juice.shakeX = (juice.rng() * 2 - 1) * mag;
  juice.shakeY = (juice.rng() * 2 - 1) * mag;

  for (const pt of juice.particles) {
    pt.life -= dt;
    pt.vy += pt.gravity * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }
  juice.particles = juice.particles.filter((pt) => pt.life > 0);
  for (const ring of juice.rings) {
    ring.life -= dt;
    const t = 1 - Math.max(0, ring.life / ring.maxLife);
    ring.r = 8 + (ring.maxR - 8) * (1 - (1 - t) * (1 - t));
  }
  juice.rings = juice.rings.filter((r) => r.life > 0);
  for (const beam of juice.beams) beam.life -= dt;
  juice.beams = juice.beams.filter((b) => b.life > 0);
  for (const text of juice.texts) {
    text.life -= dt;
    text.y += text.vy * dt;
  }
  juice.texts = juice.texts.filter((t) => t.life > 0);
  if (juice.decals.length > 24) juice.decals.splice(0, juice.decals.length - 24);
}

export function drawJuiceWorld(ctx, juice) {
  // Decals under everything that moves.
  for (const d of juice.decals) {
    if (d.kind === 'rubble') {
      ctx.fillStyle = 'rgba(20, 24, 48, 0.55)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = PALETTE.stoneDark;
      ctx.fillRect(d.x + 6, d.y - 3, 10, 4);
      ctx.fillRect(d.x + d.w - 18, d.y - 2, 12, 3);
    } else {
      ctx.fillStyle = 'rgba(10, 8, 20, 0.6)';
      ctx.beginPath();
      ctx.ellipse(d.x + d.w / 2, d.y + 3, d.w / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Beams: bright core + glow, with a particle stream along the line.
  for (const beam of juice.beams) {
    const a = Math.max(0, beam.life / beam.maxLife);
    const color = beam.kind === 'steal' ? PALETTE.cyan : PALETTE.gold;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = a * 0.3;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.globalAlpha = a * 0.8;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
    for (const [px, py] of [[beam.x1, beam.y1], [beam.x2, beam.y2]]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // Rings.
  for (const ring of juice.rings) {
    const a = Math.max(0, ring.life / ring.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width * a + 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Particles.
  for (const pt of juice.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / pt.maxLife * 1.6));
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    ctx.restore();
  }
  // Floating score text.
  for (const text of juice.texts) {
    const a = Math.max(0, Math.min(1, text.life / text.maxLife * 2));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `bold ${text.big ? 26 : 20}px "Avenir Next", "Segoe UI", Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(7, 10, 24, 0.9)';
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillStyle = text.big ? PALETTE.gold : '#ffffff';
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}
