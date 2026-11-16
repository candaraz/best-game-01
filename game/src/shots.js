// Staged ?shot= scenes: deterministic renders of the real game code at a
// fixed simulated time, the way the house games stage theirs. Each scene
// builds a real world, places a real state, seeds the juice with a fixed
// RNG, and freezes the clock so the capture is byte-stable.

import { createWorld } from './world.js';
import { createJuice, stepJuice } from './juice.js';
import { SEALS } from './config.js';

function stageBeam(juice, x1, y1, x2, y2, kind) {
  juice.beams.push({ x1, y1, x2, y2, life: 0.24, maxLife: 0.28, kind });
}

function stagePop(juice, x, y) {
  juice.rings.push({ x, y, r: 52, maxR: 90, life: 0.22, maxLife: 0.4, color: '#4de3e0', width: 5 });
  for (let i = 0; i < 22; i += 1) {
    const angle = juice.rng() * Math.PI * 2;
    const v = 120 + juice.rng() * 180;
    juice.particles.push({
      x: x + Math.cos(angle) * 18, y: y + Math.sin(angle) * 14,
      vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - 60,
      life: 0.45, maxLife: 0.7, size: 4 + juice.rng() * 3,
      color: ['#8d94c4', '#5d6490', '#4de3e0', '#ffffff'][Math.floor(juice.rng() * 4)],
      gravity: 1100,
    });
  }
  juice.texts.push({ x, y: y - 52, vy: -46, life: 0.7, maxLife: 0.9, text: '+300  ×2', big: true });
}

export function stageShot(game, shot, seed) {
  game.frozen = true;
  game.frozenTime = 1.2;
  if (shot === 'cover') {
    // Room 3, mid-steal from the ledge: the beam cuts diagonally down to
    // the popping golem, the second golem is alert, the combo is live.
    const world = createWorld(2, new Set(['tether']));
    world.player.x = 190;
    world.player.y = 358;
    world.player.gauge = 2;
    world.player.facing = 1;
    world.golems[0].x = 372;
    world.golems[0].alive = false;
    world.golems[1].x = 610;
    world.golems[1].alert = 0.8;
    world.golems[1].dir = -1;
    world.orbs[0].taken = true;
    world.roomScore = 1250;
    world.combo = 2;
    world.comboTimer = 2.0;
    world.roomTime = 34;
    world.time = 1.2;
    game.world = world;
    game.run = { ...game.run, score: 4860, best: 12480 };
    game.screen = 'playing';
    const juice = createJuice(seed);
    stageBeam(juice, 398, 512, 205, 379, 'steal');
    stagePop(juice, 398, 512);
    juice.rings.push({ x: 205, y: 379, r: 20, maxR: 56, life: 0.25, maxLife: 0.35, color: '#f5c542', width: 4 });
    stepJuice(juice, 0.06);
    juice.trauma = 0;
    juice.shakeX = 0;
    juice.shakeY = 0;
    game.juice = juice;
  } else if (shot === 'title') {
    game.screen = 'title';
    // A returning player's title: rooms open, stars earned, a last run.
    game.save = {
      ...game.save,
      best: 12480,
      stars: { 0: 3, 1: 3, 2: 2, 3: 2, 4: 1 },
      unlocked: 6,
      runs: [{ score: 12480, stars: 11, time: '4:12' }],
    };
    game.dioramaJuice = createJuice(seed);
    stageBeam(game.dioramaJuice, 398, 512, 465, 309, 'steal');
    stepJuice(game.dioramaJuice, 0.06);
    game.dioramaJuice.trauma = 0;
    game.dioramaJuice.shakeX = 0;
    game.dioramaJuice.shakeY = 0;
    game.diorama.golems[0].alert = 1;
    game.diorama.golems[1].alert = 0.6;
    game.diorama.time = 1.2;
  } else if (shot === 'seals') {
    // After room 3: three fixed seals, a run in progress.
    game.screen = 'seals';
    game.sealChoice = [SEALS[0], SEALS[1], SEALS[2]];
    game.run = { ...game.run, score: 6420, starsTotal: 7 };
    game.world = createWorld(3, new Set());
    game.world.time = 1.2;
  } else if (shot === 'win') {
    // A completed run: 25 stars, grade A, a full history.
    game.screen = 'victory';
    game.world = createWorld(8, new Set(['tether', 'heart']));
    game.world.time = 1.2;
    game.run = {
      ...game.run,
      score: 24860,
      best: 24860,
      starsTotal: 25,
      roomStars: [3, 3, 3, 2, 3, 3, 2, 3, 3],
      transfers: 41,
      pops: 6,
      disarms: 8,
      smashes: 5,
      orbsTaken: 16,
      sealsTaken: 2,
      bestCombo: 3,
      timeText: '7:42',
    };
    game.save = {
      ...game.save,
      best: 24860,
      stars: { 0: 3, 1: 3, 2: 3, 3: 2, 4: 3, 5: 3, 6: 2, 7: 3, 8: 3 },
      unlocked: 9,
      runs: [
        { score: 24860, stars: 25, time: '7:42' },
        { score: 21340, stars: 22, time: '8:15' },
        { score: 18720, stars: 19, time: '9:03' },
      ],
    };
  }
}
