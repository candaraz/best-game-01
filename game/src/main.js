// BALLAST — main loop: screens, run state, fixed-timestep simulation,
// event drain into juice + sound, save data, and the debug hook the
// playtests drive. The game runs at 960x600; ?shot=<scene>&seed=<n> freezes
// a staged deterministic frame for screenshots.

import { STEP, STORAGE_KEY, VIEW } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, roomStars, stepWorld } from './world.js';
import { createJuice, drawJuiceWorld, handleEvent, stepJuice } from './juice.js';
import { drawHud } from './hud.js';
import { drawWorld, drawVignette } from './render.js';
import {
  drawClear, drawFailed, drawHowto, drawPause, drawSeals, drawTitle,
  drawTitleDiorama, drawVictory, SEALS,
} from './screens.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function loadSave() {
  const fallback = { best: 0, stars: {}, unlocked: 1, muted: false, runs: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed, stars: parsed.stars || {}, runs: parsed.runs || [] };
  } catch {
    return fallback;
  }
}

function persistSave(save) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch { /* private mode or blocked storage: the game still plays */ }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function freshRun(best) {
  return {
    score: 0, roomStars: {}, starsTotal: 0,
    transfers: 0, pops: 0, disarms: 0, smashes: 0, orbsTaken: 0, sealsTaken: 0,
    bestCombo: 0, startTime: 0, timeText: '0:00', best,
  };
}

const game = {
  input: createInput(canvas),
  audio: createAudio(),
  save: loadSave(),
  screen: 'title',
  world: null,
  juice: createJuice(12345),
  seals: new Set(),
  run: null,
  buttons: [],
  clearState: null,
  clearT: 0,
  sealChoice: [],
  clearPending: 0,
  failPending: 0,
  time: 0,
  frozen: false,
  frozenTime: 0,
  diorama: null,
  dioramaJuice: createJuice(777),
  dioramaBeamTimer: 0,
};
game.run = freshRun(game.save.best);
game.audio.setMuted(game.save.muted);

// The title diorama: room 3 with Pip staged on the middle ledge.
game.diorama = createWorld(2, new Set());
game.diorama.player.x = 450;
game.diorama.player.y = 288;
game.diorama.player.gauge = 1;
game.diorama.player.hideTag = true;
game.diorama.golems[0].x = 372;
game.diorama.golems[0].alert = 0.7;
game.world = createWorld(0, game.seals);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const seed = Number(params.get('seed') || '1') || 1;
  stageShot(game, shot, seed);
}

function startRoom(index) {
  game.world = createWorld(index, game.seals);
  game.juice = createJuice((Math.random() * 2147483647) | 0);
  game.screen = 'playing';
  game.clearPending = 0;
  game.failPending = 0;
  game.clearState = null;
}

function startRun(index) {
  game.seals = new Set();
  game.run = freshRun(game.save.best);
  game.run.startTime = game.time;
  startRoom(index);
}

function showClear() {
  const world = game.world;
  const stars = roomStars(world);
  const earned = world.roomScore - world.clearBonus - world.timeBonus;
  game.clearState = {
    stars,
    earnedText: `+${earned}`,
    clearBonus: world.clearBonus,
    timeBonus: world.timeBonus,
    roomScore: world.roomScore,
    timeText: formatTime(world.roomTime),
  };
  const i = world.levelIndex;
  game.run.score += world.roomScore;
  game.run.roomStars[i] = Math.max(game.run.roomStars[i] || 0, stars);
  game.run.starsTotal = Object.values(game.run.roomStars).reduce((a, b) => a + b, 0);
  game.run.transfers += world.stats.transfers;
  game.run.pops += world.stats.pops;
  game.run.disarms += world.stats.disarms;
  game.run.smashes += world.stats.smashes;
  game.run.orbsTaken += world.stats.orbsTaken;
  game.run.bestCombo = Math.max(game.run.bestCombo, world.stats.bestCombo);
  game.save.stars[i] = Math.max(game.save.stars[i] || 0, stars);
  game.save.unlocked = Math.min(9, Math.max(game.save.unlocked, i + 2));
  game.save.best = Math.max(game.save.best, game.run.score);
  game.run.best = game.save.best;
  persistSave(game.save);
  game.clearT = 0;
  game.screen = 'clear';
}

function showFailed() {
  game.screen = 'failed';
}

function finishRun() {
  const run = game.run;
  run.timeText = formatTime(game.time - run.startTime);
  game.save.runs.unshift({ score: run.score, stars: run.starsTotal, time: run.timeText });
  game.save.runs = game.save.runs.slice(0, 5);
  game.save.best = Math.max(game.save.best, run.score);
  run.best = game.save.best;
  persistSave(game.save);
  game.audio.victory();
  game.screen = 'victory';
}

function offerSeals() {
  const pool = SEALS.filter((s) => !game.seals.has(s.id));
  const options = [];
  const bag = [...pool];
  while (options.length < 3 && bag.length > 0) {
    const pick = Math.floor(Math.random() * bag.length);
    options.push(bag.splice(pick, 1)[0]);
  }
  game.sealChoice = options;
  game.screen = 'seals';
}

function pickSeal(index) {
  const seal = game.sealChoice[index];
  if (!seal) return;
  game.seals.add(seal.id);
  game.run.sealsTaken += 1;
  game.audio.seal();
  startRoom(game.world.levelIndex + 1);
}

function nextFromClear() {
  const i = game.world.levelIndex;
  if (i === 8) { finishRun(); return; }
  if (i === 2 || i === 5) { offerSeals(); return; }
  game.run.score += 0;
  startRoom(i + 1);
}

function toggleMute() {
  game.save.muted = !game.save.muted;
  game.audio.setMuted(game.save.muted);
  persistSave(game.save);
}

function readStepInput(firstStep) {
  const input = game.input;
  return {
    axis: input.axis(),
    jumpHeld: input.isDown('jump'),
    jumpPressed: firstStep && input.wasPressed('jump'),
    stealPressed: firstStep && (input.wasPressed('steal') || input.mouse.leftPressed),
    givePressed: firstStep && (input.wasPressed('give') || input.mouse.rightPressed),
  };
}

function playSound(event) {
  const audio = game.audio;
  switch (event.type) {
    case 'steal': audio.steal(); break;
    case 'give': audio.give(); break;
    case 'pop': audio.pop(); break;
    case 'disarm': audio.disarm(); break;
    case 'smash': audio.smash(); break;
    case 'explosion': audio.explosion(); break;
    case 'orb': audio.orb(); break;
    case 'jump': audio.jump(); break;
    case 'land': audio.land(); break;
    case 'hardLand': audio.hardLand(); break;
    case 'hurt': audio.hurt(); break;
    case 'fail': audio.fail(); break;
    case 'gate': audio.gate(); break;
    case 'switch': audio.tick(); break;
    case 'doorOpen': audio.seal(); break;
    case 'beep': audio.beep(); break;
    case 'skin': audio.seal(); break;
    default: break;
  }
}

function drainEvents() {
  const world = game.world;
  for (const event of world.events) {
    handleEvent(game.juice, event, world);
    playSound(event);
  }
  world.events.length = 0;
}

function hitButton(x, y) {
  for (const b of game.buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}

function handleClick(x, y) {
  const id = hitButton(x, y);
  if (!id) return;
  game.audio.unlock();
  game.audio.ui();
  if (id === 'start') startRun(0);
  else if (id.startsWith('room:')) startRun(Number(id.slice(5)));
  else if (id === 'howto') game.screen = 'howto';
  else if (id === 'back') game.screen = 'title';
  else if (id === 'mute') toggleMute();
  else if (id === 'resume') game.screen = 'playing';
  else if (id === 'restart') startRoom(game.world.levelIndex);
  else if (id === 'title') { game.screen = 'title'; game.clearPending = 0; game.failPending = 0; }
  else if (id === 'next') nextFromClear();
  else if (id === 'replay') startRoom(game.world.levelIndex);
  else if (id.startsWith('seal:')) pickSeal(Number(id.slice(5)));
  else if (id === 'again') startRun(0);
  else if (id === 'retry') startRoom(game.world.levelIndex);
}

function updateScreen(dt) {
  const input = game.input;
  if (input.mouse.leftPressed) handleClick(input.mouse.x, input.mouse.y);
  if (input.wasPressed('mute')) toggleMute();

  switch (game.screen) {
    case 'title':
      if (input.wasPressed('confirm')) startRun(0);
      break;
    case 'howto':
      if (input.wasPressed('confirm') || input.wasPressed('pause')) game.screen = 'title';
      break;
    case 'playing':
      if (input.wasPressed('pause')) { game.screen = 'paused'; break; }
      if (input.wasPressed('retry')) startRoom(game.world.levelIndex);
      break;
    case 'paused':
      if (input.wasPressed('pause') || input.wasPressed('confirm')) game.screen = 'playing';
      else if (input.wasPressed('retry')) startRoom(game.world.levelIndex);
      break;
    case 'clear':
      game.clearT += dt;
      if (input.wasPressed('confirm')) nextFromClear();
      else if (input.wasPressed('retry')) startRoom(game.world.levelIndex);
      break;
    case 'seals':
      if (input.wasPressed('one')) pickSeal(0);
      else if (input.wasPressed('two')) pickSeal(1);
      else if (input.wasPressed('three')) pickSeal(2);
      break;
    case 'victory':
      if (input.wasPressed('confirm')) startRun(0);
      break;
    case 'failed':
      if (input.wasPressed('confirm') || input.wasPressed('retry')) startRoom(game.world.levelIndex);
      break;
    default:
      break;
  }
}

function drawWorldLayer(t, hideTag) {
  game.world.player.hideTag = hideTag;
  ctx.save();
  ctx.translate(Math.round(game.juice.shakeX), Math.round(game.juice.shakeY));
  drawWorld(ctx, game.world, game.juice, t);
  drawJuiceWorld(ctx, game.juice);
  drawVignette(ctx);
  ctx.restore();
}

function render(t) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  switch (game.screen) {
    case 'title':
      game.buttons = drawTitle(ctx, game, t);
      break;
    case 'howto':
      drawTitleDiorama(ctx, game, t);
      game.buttons = drawHowto(ctx, game);
      break;
    case 'playing':
      drawWorldLayer(t, false);
      drawHud(ctx, game.world, game.run, t);
      game.buttons = [];
      break;
    case 'paused':
      drawWorldLayer(t, false);
      drawHud(ctx, game.world, game.run, t);
      game.buttons = drawPause(ctx, game);
      break;
    case 'clear':
      drawWorldLayer(t, true);
      game.buttons = drawClear(ctx, game, game.clearT);
      break;
    case 'seals':
      drawWorldLayer(t, true);
      game.buttons = drawSeals(ctx, game);
      break;
    case 'victory':
      drawWorldLayer(t, true);
      game.buttons = drawVictory(ctx, game);
      break;
    case 'failed':
      drawWorldLayer(t, true);
      game.buttons = drawFailed(ctx, game);
      break;
    default:
      game.buttons = [];
      break;
  }
}

function tickDiorama(dt) {
  stepJuice(game.dioramaJuice, dt);
  game.dioramaBeamTimer -= dt;
  if (game.dioramaBeamTimer <= 0) {
    game.dioramaBeamTimer = 0.4;
    game.dioramaJuice.beams.push({
      x1: 398, y1: 512, x2: 465, y2: 309,
      life: 0.3, maxLife: 0.3, kind: 'steal',
    });
  }
  game.diorama.time += dt;
}

let last = performance.now();
let acc = 0;

function frame(now) {
  const realDt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (game.frozen) {
    render(game.frozenTime);
    if (!window.__shotReady) window.__shotReady = true;
    requestAnimationFrame(frame);
    return;
  }

  game.time += realDt;
  updateScreen(realDt);

  if (game.screen === 'playing' && game.clearPending <= 0 && game.failPending <= 0) {
    if (game.juice.hitStop > 0) {
      stepJuice(game.juice, realDt * 0.15);
    } else {
      acc += realDt;
      let steps = 0;
      let first = true;
      while (acc >= STEP && steps < 4) {
        stepWorld(game.world, readStepInput(first), STEP);
        drainEvents();
        acc -= STEP;
        steps += 1;
        first = false;
        if (game.world.cleared || game.world.failed) { acc = 0; break; }
      }
      if (steps === 4) acc = 0;
      stepJuice(game.juice, realDt);
    }
    if (game.world.cleared && game.clearPending <= 0) {
      game.clearPending = 0.6;
      game.audio.clear();
    }
    if (game.world.failed && game.failPending <= 0) {
      game.failPending = 0.8;
    }
  } else {
    stepJuice(game.juice, realDt);
  }

  if (game.clearPending > 0) {
    game.clearPending -= realDt;
    if (game.clearPending <= 0) showClear();
  }
  if (game.failPending > 0) {
    game.failPending -= realDt;
    if (game.failPending <= 0) showFailed();
  }

  if (game.screen === 'title' || game.screen === 'howto') tickDiorama(realDt);

  render(game.time);
  if (!window.__shotReady) window.__shotReady = true;
  game.input.endFrame();
  requestAnimationFrame(frame);
}

// Audio unlocks on the first gesture, wherever it lands.
window.addEventListener('keydown', () => game.audio.unlock(), { once: false });
window.addEventListener('mousedown', () => game.audio.unlock(), { once: false });

// Debug hook for scripted playtests: read-only state, plus room starts.
window.__ballast = {
  version: 'v5',
  screen() { return game.screen; },
  state() {
    const w = game.world;
    return {
      screen: game.screen,
      room: w.levelIndex,
      x: w.player.x, y: w.player.y,
      vx: w.player.vx, vy: w.player.vy,
      gauge: w.player.gauge, hearts: w.player.hearts,
      onGround: w.player.onGround,
      cleared: w.cleared, failed: w.failed, failCause: w.failCause,
      doorOpen: w.doorOpen,
      roomScore: w.roomScore, combo: w.combo,
      roomTime: w.roomTime,
      orbs: w.orbs.map((o) => o.taken),
      golemsAlive: w.golems.map((g) => g.alive),
      golemX: w.golems.map((g) => g.x),
      minesArmed: w.mines.map((m) => m.armed),
      switchesLatched: w.switches.map((s) => s.latched),
      crackedBroken: w.cracked.map((c) => c.broken),
      crates: w.crates.map((c) => ({ x: c.x, y: c.y, weight: c.weight })),
      boulders: w.boulders.map((b) => ({ x: b.x, y: b.y, weight: b.weight })),
      seals: [...game.seals],
      runScore: game.run.score,
      stealTarget: w.stealTarget ? w.stealTarget.kind : null,
      giveTarget: w.giveTarget ? w.giveTarget.kind : null,
    };
  },
  startRoom(index) { startRun(index); },
};

requestAnimationFrame(frame);
