// BALLAST: the loop, the screens, and the wiring between the simulation and
// the feedback. The world reports events; this file turns them into particles,
// floating text, shake and sound. Nothing here changes the rules — it only
// presents them, tracks the run, and keeps the bests between visits.

import { FIELD, STEP, SCORE, BEST_KEY } from './config.js';
import { ROOMS } from './levels.js';
import {
  ACT_CONFIRM,
  ACT_JUMP,
  ACT_MUTE,
  ACT_PAUSE,
  ACT_RETRY,
  createInput,
} from './input.js';
import { createWorld } from './world.js';
import { createJuice } from './juice.js';
import { sfx } from './audio.js';
import { drawWorld } from './render.js';
import { drawHud } from './hud.js';
import {
  drawTitle,
  drawPause,
  drawClear,
  drawVictory,
  drawFailed,
} from './screens.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const juice = createJuice();

function defaultBests() {
  return {
    bestScore: 0,
    stars: Array(ROOMS.length).fill(0),
    perRoom: ROOMS.map(() => ({ score: 0, stars: 0 })),
    unlocked: 1,
  };
}

function loadBests() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return defaultBests();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.stars) || parsed.stars.length !== ROOMS.length) {
      return defaultBests();
    }
    return {
      bestScore: parsed.bestScore || 0,
      stars: parsed.stars,
      perRoom: Array.isArray(parsed.perRoom) ? parsed.perRoom : ROOMS.map(() => ({ score: 0, stars: 0 })),
      unlocked: Math.max(1, Math.min(ROOMS.length, parsed.unlocked || 1)),
    };
  } catch {
    return defaultBests();
  }
}

let bests = loadBests();

function saveBests() {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(bests));
  } catch {
    /* private mode: the run still counts, it just is not kept */
  }
}

let screen = 'title';
let world = null;
let totalScore = 0;
let runScores = Array(ROOMS.length).fill(0);
let runStars = Array(ROOMS.length).fill(0);
let runTime = 0;
let selected = 0;
let showHelp = false;
let buttons = [];
let clearInfo = null;
let clearT = 0;
let starSfxFired = 0;
let victoryInfo = null;
let time = 0;
let accumulator = 0;
let last = performance.now();

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Turn the world's events into feedback. Shot staging reuses this handler,
 *  so a staged frame shows exactly the feedback a player would see. */
function handleEvents(aWorld, aJuice) {
  for (const event of aWorld.drainEvents()) {
    switch (event.type) {
      case 'jump':
        aJuice.landDust(event.x, event.y, false);
        sfx.jump();
        break;
      case 'push':
        aJuice.pushDust(event.x, event.y, event.dir);
        break;
      case 'land':
        aJuice.landDust(event.x, event.y, event.hard);
        sfx.land(event.hard);
        if (event.hard) {
          aJuice.ring(event.x, event.y, '#c9c2a8', 44);
          aJuice.shake(4, 0.15);
        }
        break;
      case 'steal':
        aJuice.transfer(event.fromX, event.fromY, event.toX, event.toY, '#ffd76a');
        aJuice.flash(event.fromX, event.fromY, '#fff3c4', 26);
        aJuice.floatText(event.toX, event.toY - 34, '+1 WEIGHT', '#ffd76a', 17);
        sfx.steal();
        break;
      case 'give':
        aJuice.transfer(event.fromX, event.fromY, event.toX, event.toY, '#9fe8ff');
        aJuice.flash(event.toX, event.toY, '#bdf3ff', 26);
        aJuice.floatText(event.toX, event.toY - 34, '+1 WEIGHT', '#9fe8ff', 17);
        sfx.give();
        break;
      case 'denied':
        aJuice.floatText(event.x, event.y, event.text, '#ff9a5c', 13);
        sfx.denied();
        break;
      case 'orb':
        aJuice.orbSparkle(event.x, event.y);
        aJuice.floatText(event.x, event.y - 20, `+${event.gained}`, '#ffd76a', 18);
        sfx.orb();
        break;
      case 'pop':
        aJuice.golemPop(event.x, event.y);
        aJuice.flash(event.x, event.y, '#fff3c4', 40);
        aJuice.ring(event.x, event.y, '#ffd76a', 64);
        aJuice.floatText(event.x, event.y - 30, `POP! +${event.gained}`, '#ffd76a', 20);
        aJuice.shake(6, 0.2);
        aJuice.freeze(0.05);
        sfx.pop();
        break;
      case 'fizzle':
        aJuice.mineFizzle(event.x, event.y);
        aJuice.decal(event.x, event.y, 'scorch');
        aJuice.floatText(event.x, event.y - 26, `FIZZLE +${event.gained}`, '#9fe8ff', 18);
        sfx.fizzle();
        break;
      case 'smashTile':
        aJuice.smashDebris(event.x, event.y);
        aJuice.decal(event.x, event.y, 'rubble');
        break;
      case 'smash':
        // The rarest, heaviest hit earns the longest freeze: ~5 frames.
        aJuice.flash(event.x, event.y, '#fff3c4', 46);
        aJuice.ring(event.x, event.y, '#c99a6b', 72);
        aJuice.shake(9, 0.28);
        aJuice.freeze(0.09);
        sfx.smash();
        break;
      case 'hurt':
        aJuice.hurtBurst(event.x, event.y);
        aJuice.shake(7, 0.25);
        sfx.hurt();
        break;
      case 'explode':
        aJuice.hurtBurst(event.x, event.y);
        aJuice.flash(event.x, event.y, '#ff6b5e', 44);
        aJuice.ring(event.x, event.y, '#ff6b5e', 64);
        aJuice.shake(8, 0.3);
        aJuice.freeze(0.06);
        sfx.smash();
        break;
      case 'pit':
        aJuice.shake(5, 0.2);
        sfx.hurt();
        break;
      case 'switchOn':
        aJuice.floatText(event.x, event.y - 16, 'GATE OPEN', '#57e6a8', 16);
        sfx.switchOn();
        break;
      case 'clear':
        aJuice.doorGlow(event.x, event.y);
        sfx.door();
        break;
      case 'galeStreak': {
        const zone = event.zone;
        aJuice.windStreak(
          zone.x + Math.random() * zone.w,
          zone.y + Math.random() * zone.h,
          zone.dx,
          'rgba(159, 232, 255, 0.5)',
        );
        break;
      }
      case 'updraftMote': {
        const zone = event.zone;
        aJuice.updraftMote(zone.x + Math.random() * zone.w, zone.y + zone.h - 6);
        break;
      }
      default:
        break;
    }
  }
}

function startRoom(index) {
  world = createWorld(ROOMS[index], index);
  juice.clear();
  accumulator = 0;
  screen = 'playing';
}

function startRun(index) {
  totalScore = 0;
  runScores = Array(ROOMS.length).fill(0);
  runStars = Array(ROOMS.length).fill(0);
  runTime = 0;
  startRoom(index);
}

function onClear() {
  const { state } = world;
  const roomScore = state.score;
  const timeBonus = Math.max(0, Math.floor(state.def.par - state.time)) * SCORE.timeBonusPerSecond;
  const noDamageBonus = state.damageTaken ? 0 : SCORE.noDamageBonus;
  const gained = SCORE.roomClear + roomScore + timeBonus + noDamageBonus;
  const stars = 1 + (state.orbsTaken >= 2 ? 1 : 0) + (state.time <= state.def.par && !state.damageTaken ? 1 : 0);
  totalScore += gained;
  runScores[state.roomIndex] = gained;
  runStars[state.roomIndex] = stars;
  runTime += state.time;
  bests.stars[state.roomIndex] = Math.max(bests.stars[state.roomIndex], stars);
  const best = bests.perRoom[state.roomIndex];
  if (gained > best.score) {
    best.score = gained;
    best.stars = stars;
  }
  bests.unlocked = Math.max(bests.unlocked, Math.min(ROOMS.length, state.roomIndex + 2));
  saveBests();
  clearInfo = {
    room: { index: state.roomIndex, name: state.def.name },
    stars,
    breakdown: {
      roomScore: SCORE.roomClear + roomScore,
      timeBonus,
      noDamageBonus,
      totalScore,
      timeText: `${formatTime(state.time)} / par ${formatTime(state.def.par)}`,
      orbs: state.orbsTaken,
      damageTaken: state.damageTaken,
    },
    isLast: state.roomIndex === ROOMS.length - 1,
  };
  clearT = 0;
  starSfxFired = 0;
  screen = 'clear';
  sfx.clear();
}

function onVictory() {
  const perRoom = ROOMS.map((room, i) => ({
    name: room.name,
    score: runScores[i] || bests.perRoom[i].score,
    stars: runStars[i] || bests.perRoom[i].stars,
  }));
  const isNewBest = totalScore > bests.bestScore;
  if (isNewBest) {
    bests.bestScore = totalScore;
    saveBests();
  }
  victoryInfo = {
    totalScore,
    totalStars: perRoom.reduce((sum, r) => sum + r.stars, 0),
    totalTime: runTime,
    best: bests.bestScore,
    isNewBest,
    perRoom,
  };
  screen = 'victory';
  sfx.win();
}

function hitButton(click) {
  if (!click) return null;
  for (const b of buttons) {
    if (click.x >= b.x && click.x <= b.x + b.w && click.y >= b.y && click.y <= b.y + b.h) return b.id;
  }
  return null;
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
  last = now;
  time += dt;
  const actions = input.takeActions();
  const click = input.takeClick();
  const digit = input.takeDigit();
  const mouse = input.pointer();
  if (actions || click) sfx.unlock();
  if (actions & ACT_MUTE) sfx.toggleMute();

  if (screen === 'title') {
    if (digit >= 0 && digit < bests.unlocked) {
      selected = digit;
      sfx.click();
    }
    if (actions & ACT_CONFIRM) {
      sfx.click();
      startRun(selected);
    }
    const pressed = hitButton(click);
    if (pressed === 'start') {
      sfx.click();
      startRun(selected);
    } else if (pressed === 'help') {
      showHelp = !showHelp;
      sfx.click();
    } else if (pressed === 'mute') {
      sfx.toggleMute();
    } else if (pressed && pressed.startsWith('room-')) {
      selected = Number(pressed.slice(5));
      sfx.click();
    }
    juice.update(dt);
  } else if (screen === 'playing') {
    if (actions & ACT_PAUSE) {
      screen = 'paused';
    } else if (actions & ACT_RETRY) {
      startRoom(world.state.roomIndex);
    } else if (juice.hitStopLeft() > 0) {
      juice.tickHitStop(dt);
    } else {
      accumulator += dt;
      let first = true;
      while (accumulator >= STEP) {
        world.step(STEP, input.direction(), input.jumpHeld(), first ? actions : 0);
        first = false;
        handleEvents(world, juice);
        accumulator -= STEP;
        if (world.state.cleared || world.state.failed) {
          accumulator = 0;
          break;
        }
      }
      juice.update(dt);
      if (world.state.cleared) onClear();
      else if (world.state.failed) screen = 'failed';
    }
  } else if (screen === 'paused') {
    if (actions & ACT_PAUSE) screen = 'playing';
    else if (actions & ACT_RETRY) startRoom(world.state.roomIndex);
    const pressed = hitButton(click);
    if (pressed === 'resume') screen = 'playing';
    else if (pressed === 'retry') startRoom(world.state.roomIndex);
    else if (pressed === 'title') screen = 'title';
  } else if (screen === 'clear') {
    clearT += dt;
    for (let k = starSfxFired; k < clearInfo.stars; k += 1) {
      if (clearT > 0.35 + k * 0.3) {
        sfx.star();
        starSfxFired = k + 1;
      }
    }
    const advance =
      (actions & (ACT_CONFIRM | ACT_JUMP) && clearT > 0.4) || hitButton(click) === 'next';
    if (advance) {
      sfx.click();
      if (clearInfo.isLast) onVictory();
      else startRoom(clearInfo.room.index + 1);
    } else {
      const pressed = hitButton(click);
      if (pressed === 'replay') startRoom(clearInfo.room.index);
      else if (pressed === 'title') screen = 'title';
    }
  } else if (screen === 'failed') {
    if (actions & (ACT_RETRY | ACT_CONFIRM | ACT_JUMP)) {
      startRoom(world.state.roomIndex);
    } else {
      const pressed = hitButton(click);
      if (pressed === 'retry') startRoom(world.state.roomIndex);
      else if (pressed === 'title') screen = 'title';
    }
  } else if (screen === 'victory') {
    if (actions & ACT_CONFIRM) startRun(0);
    const pressed = hitButton(click);
    if (pressed === 'again') startRun(0);
    else if (pressed === 'title') screen = 'title';
  }

  render(mouse);
}

function render(mouse) {
  ctx.save();
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (screen === 'title') {
    buttons = drawTitle(ctx, {
      time,
      juice,
      best: bests.bestScore,
      totalStars: bests.stars.reduce((sum, s) => sum + s, 0),
      unlocked: bests.unlocked,
      selected,
      showHelp,
      muted: sfx.isMuted(),
      mouse,
    }).buttons;
    ctx.restore();
    return;
  }
  // Shake moves the camera (the world), never the HUD: the score, hearts and
  // gauge stay readable while the vault shudders.
  const offset = screen === 'playing' ? juice.shakeOffset() : { x: 0, y: 0 };
  ctx.save();
  ctx.translate(offset.x, offset.y);
  drawWorld(ctx, world, juice, time, world.targets());
  ctx.restore();
  drawHud(ctx, {
    world,
    totalScore: totalScore + world.state.score,
    stars: bests.stars,
    roomCount: ROOMS.length,
    best: bests.bestScore,
    muted: sfx.isMuted(),
    time,
  });
  ctx.restore();
  if (screen === 'paused') buttons = drawPause(ctx, { mouse }).buttons;
  else if (screen === 'clear') buttons = drawClear(ctx, { ...clearInfo, t: clearT, mouse }).buttons;
  else if (screen === 'failed') buttons = drawFailed(ctx, { mouse, cause: world.state.failCause }).buttons;
  else if (screen === 'victory') buttons = drawVictory(ctx, { ...victoryInfo, mouse }).buttons;
  else buttons = [];
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'playing') screen = 'paused';
});

// Screenshot staging: one deterministic frame, then signal the capture script.
const params = new URLSearchParams(location.search);
const shotKind = params.get('shot');
if (shotKind) {
  const seed = Number(params.get('seed') || 1);
  const staged = runShot(shotKind, seed, handleEvents);
  if (staged) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (staged.kind === 'title') {
      drawTitle(ctx, {
        time: staged.time,
        juice: createJuice(),
        best: 24800,
        totalStars: 14,
        unlocked: 5,
        selected: 0,
        showHelp: false,
        muted: false,
        mouse: null,
      });
    } else if (staged.kind === 'win') {
      drawWorld(ctx, staged.world, staged.juice, staged.time, { steal: null, give: null });
      drawVictory(ctx, { ...staged.victory, mouse: null });
    } else {
      drawWorld(ctx, staged.world, staged.juice, staged.time, staged.world.targets());
      drawHud(ctx, {
        world: staged.world,
        totalScore: staged.hud.totalScore,
        stars: staged.hud.stars,
        roomCount: ROOMS.length,
        best: staged.hud.best,
        muted: false,
        time: staged.time,
      });
    }
  }
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}

// A hook for playtesting: state snapshots, scripted input, and room starts.
window.__ballast = {
  screen: () => screen,
  snapshot: () => (world ? world.snapshot() : null),
  start: (index) => startRun(index),
  state: () => (world ? world.state : null),
  input,
  bests: () => bests,
};
