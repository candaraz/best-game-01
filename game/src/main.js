// Boot, the fixed-timestep loop and the screen state machine: title ->
// room card -> play -> room complete -> next room -> all-clear, with pause
// over play. Simulation steps at a fixed 1/60s; rendering interpolates
// nothing — the sim is the picture. A debug hook exposes the live state
// for automated playtests.

import { WIDTH, HEIGHT, STEP } from './config.js';
import { LEVELS } from './levels.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createJuice } from './particles.js';
import { createRoom, updateRoom, retryRoom } from './room.js';
import { drawWorld } from './render.js';
import { drawHUD } from './hud.js';
import { recordRoom, getBests } from './store.js';
import {
  drawTitle, drawRoomCard, drawPause, drawRoomComplete, drawAllClear,
} from './screens.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;

const input = createInput(canvas);
const audio = createAudio();
const fx = createJuice();

const game = {
  state: 'title', // title | card | play | pause | complete | win
  roomIndex: 0,
  room: null,
  cardTime: 0,
  completeTime: 0,
  winTime: 0,
  titleTime: 0,
  totalScore: 0,
  recorded: false,
  shot: null,
};

function startRoom(index) {
  game.roomIndex = index;
  game.room = createRoom(index, fx, audio);
  game.state = 'card';
  game.cardTime = 0;
  game.recorded = false;
}

function beginPlay() {
  game.totalScore = 0;
  startRoom(0);
}

function advance() {
  if (game.roomIndex < LEVELS.length - 1) {
    startRoom(game.roomIndex + 1);
  } else {
    game.state = 'win';
    game.winTime = 0;
  }
}

function step(dt) {
  if (input.mutePressed) audio.toggleMute();

  if (game.state === 'title') {
    if (input.confirmPressed) {
      audio.unlock();
      audio.click();
      beginPlay();
    }
    return;
  }

  if (game.state === 'card') {
    game.cardTime += dt;
    if (game.cardTime > 1.6 || input.confirmPressed) {
      game.state = 'play';
    }
    return;
  }

  if (game.state === 'play') {
    if (input.pausePressed) {
      game.state = 'pause';
      return;
    }
    if (input.retryPressed) {
      retryRoom(game.room);
      return;
    }
    updateRoom(game.room, input, dt);
    if (game.room.completed && game.room.completeTimer > 1.2) {
      if (!game.recorded) {
        game.recorded = true;
        game.totalScore += game.room.score;
        recordRoom(game.roomIndex, game.room.stars, game.room.time, game.room.score);
        for (let i = 0; i < game.room.stars; i++) audio.star(i);
      }
      game.state = 'complete';
      game.completeTime = 0;
    }
    return;
  }

  if (game.state === 'pause') {
    if (input.pausePressed) game.state = 'play';
    if (input.retryPressed) {
      retryRoom(game.room);
      game.state = 'play';
    }
    return;
  }

  if (game.state === 'complete') {
    game.completeTime += dt;
    if (game.completeTime > 0.6 && input.confirmPressed) {
      audio.click();
      advance();
    }
    return;
  }

  if (game.state === 'win') {
    game.winTime += dt;
    if (game.winTime > 0.8 && input.confirmPressed) {
      audio.click();
      game.state = 'title';
      game.titleTime = 0;
    }
  }
}

function render(time) {
  ctx.save();
  if (game.state === 'title') {
    drawTitle(ctx, game.titleTime);
  } else if (game.state === 'win') {
    if (game.room) drawWorld(ctx, game.room, time);
    drawAllClear(ctx, game.totalScore, game.winTime);
  } else if (game.room) {
    const shake = fx.offset();
    ctx.translate(shake.x, shake.y);
    drawWorld(ctx, game.room, time);
    ctx.restore();
    ctx.save();
    drawHUD(ctx, game.room, audio.muted, time);
    if (game.state === 'card') drawRoomCard(ctx, game.roomIndex, game.cardTime);
    if (game.state === 'pause') drawPause(ctx);
    if (game.state === 'complete') drawRoomComplete(ctx, game.room, game.completeTime);
  }
  ctx.restore();
}

let last = performance.now();
let accumulator = 0;
let simTime = 0;

function frame(now) {
  const frameDt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.titleTime += frameDt;

  if (!fx.frozen) {
    accumulator += frameDt;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      step(STEP);
      // Consume edge-triggered presses after the FIRST step that sees
      // them: later steps in the same frame must not re-trigger (a pause
      // press would pause and unpause at once), and a frame that runs
      // zero steps — fast display, hit-stop freeze — must NOT clear
      // presses before any step has seen them.
      if (steps === 0) input.endStep();
      accumulator -= STEP;
      simTime += STEP;
      steps++;
    }
    if (steps === 5) accumulator = 0; // drop backlog rather than spiral
  }
  fx.update(frameDt);
  render(simTime);
  requestAnimationFrame(frame);
}

// Unlock audio on the first gesture of any kind.
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
window.addEventListener('keydown', () => audio.unlock(), { once: true });

// Screenshot staging: ?shot=title|play|weight|win poses real sim state.
const params = new URLSearchParams(location.search);
game.shot = params.get('shot');
if (game.shot) applyShot(game.shot, game, { startRoom, beginPlay, fx, audio });

// Debug hook for automated playtests: read live state, drive real input
// through the keyboard, and stage rooms directly.
window.__ballast = {
  get state() { return game.state; },
  get roomIndex() { return game.roomIndex; },
  get room() { return game.room; },
  get totalScore() { return game.totalScore; },
  get bests() { return getBests(); },
  start: beginPlay,
  startRoom,
  setGauge(g) { if (game.room) game.room.player.gauge = g; },
  teleport(x, y) {
    if (!game.room) return;
    game.room.player.x = x;
    game.room.player.y = y;
    game.room.player.vx = 0;
    game.room.player.vy = 0;
  },
  snapshot() {
    if (!game.room) return { state: game.state };
    const p = game.room.player;
    return {
      state: game.state,
      room: game.roomIndex,
      hearts: game.room.hearts,
      time: game.room.time,
      score: game.room.score,
      orbs: game.room.orbsTaken,
      completed: game.room.completed,
      player: { x: p.x, y: p.y, vx: p.vx, vy: p.vy, gauge: p.gauge, grounded: p.grounded },
      objects: game.room.objects.map((o) => ({
        kind: o.kind, x: o.x, y: o.y, weight: o.weight, alive: o.alive, safe: o.safe,
      })),
      doors: [...game.room.openDoors],
      exit: game.room.exit,
    };
  },
};

requestAnimationFrame(frame);
