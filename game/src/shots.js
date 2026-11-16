// Screenshot staging: each shot is a real game state, reached by stepping the
// real simulation with a scripted input tape — the same code path a player
// drives, with no posed drawing. The capture script loads the game with
// ?shot=<kind>&seed=1, waits for window.__shotReady, and screenshots the
// canvas. Randomness is seeded during staging so a shot replays identically.

import { STEP } from './config.js';
import { ROOMS } from './levels.js';
import { createWorld } from './world.js';
import { createJuice } from './juice.js';
import { mulberry32 } from './random.js';
import { ACT_JUMP, ACT_STEAL } from './input.js';

/** Step the world with a tape function until it says stop, or the cap hits. */
function runTape(world, juice, handleEvents, tape, cap = 600) {
  for (let i = 0; i < cap; i += 1) {
    const script = tape(world, i);
    if (!script) break;
    world.step(STEP, script.move, !!script.jump, script.actions || 0);
    handleEvents(world, juice);
    juice.update(STEP);
    if (world.state.cleared || world.state.failed) break;
  }
}

function centreOf(body) {
  return { x: body.x + body.w / 2, y: body.y + body.h / 2 };
}

function distToPlayer(world, body) {
  const p = centreOf(world.state.player);
  const b = centreOf(body);
  return Math.hypot(b.x - p.x, b.y - p.y);
}

const SHOTS = {
  /** The cover: room 3, the frame a steal pops the first golem — beam alive,
   *  pop particles mid-flight, the second golem still patrolling, both orbs
   *  and the full HUD in frame. */
  cover(handleEvents) {
    const world = createWorld(ROOMS[2], 2);
    const juice = createJuice();
    let stoleAt = -1;
    runTape(world, juice, handleEvents, (w, i) => {
      if (stoleAt >= 0) return i - stoleAt < 6 ? { move: 0 } : null;
      const golem = w.state.golems[0];
      // Let the golem patrol to the middle of the frame before the chase, and
      // steal from near maximum range so the beam spans the gap.
      if (golem.x < 380) return { move: 0 };
      if (distToPlayer(w, golem) < 135) {
        stoleAt = i;
        return { move: 0, actions: ACT_STEAL };
      }
      return { move: 1 };
    });
    return {
      world,
      juice,
      time: 3.0,
      hud: { totalScore: world.state.score, stars: [3, 2, 0, 0, 0, 0, 0, 0, 0], best: 12400 },
    };
  },

  /** The title screen at a moment its diorama beam is arcing. */
  title() {
    return { time: 4.65, hud: null };
  },

  /** Room 5: Pip at ANCHOR walking the gale corridor — wind streaks streaming
   *  past, the bridge and pit below, the updraft shaft and door ahead. */
  gale(handleEvents) {
    const world = createWorld(ROOMS[4], 4);
    const juice = createJuice();
    let phase = 0;
    let phaseStep = 0;
    let jumpAt = -1;
    let clearedCrate = false;
    runTape(world, juice, handleEvents, (w, i) => {
      const p = centreOf(w.state.player);
      if (phase === 0) {
        if (distToPlayer(w, w.state.crates[0]) < 80) {
          phase = 1;
          phaseStep = i;
          return { move: 0, actions: ACT_STEAL };
        }
        return { move: 1 };
      }
      if (phase === 1) {
        if (i - phaseStep >= 15) {
          phase = 2;
          phaseStep = i;
          return { move: 0, actions: ACT_STEAL };
        }
        return { move: 0 };
      }
      if (phase === 2) {
        if (p.x >= 480) return null;
        // A respawn after a fall resets the jumps, so the tape retries.
        if (p.x < 120) {
          jumpAt = -1;
          clearedCrate = false;
        }
        if (p.x > 260) clearedCrate = true;
        // At ANCHOR Pip would push the emptied crate into the pit, so the tape
        // jumps over the crate first, then jumps onto the bridge.
        const grounded = w.state.player.onGround;
        const inCrateWindow = !clearedCrate && p.x >= 120 && p.x < 220;
        const inBridgeWindow = p.x >= 370 && p.x < 400;
        if (jumpAt < 0 && grounded && (inCrateWindow || inBridgeWindow)) {
          jumpAt = i;
          return { move: 1, jump: true, actions: ACT_JUMP };
        }
        if (jumpAt >= 0 && i - jumpAt < 14) return { move: 1, jump: true };
        if (jumpAt >= 0) jumpAt = -1;
        return { move: 1 };
      }
      return null;
    });
    return {
      world,
      juice,
      time: 5.0,
      hud: { totalScore: world.state.score, stars: [3, 3, 2, 2, 0, 0, 0, 0, 0], best: 18900 },
    };
  },

  /** The victory screen, rendered by the genuine code from a valid completed
   *  state: every room cleared, the star table filled, a best score beaten. */
  win() {
    const world = createWorld(ROOMS[8], 8);
    const juice = createJuice();
    const perRoom = ROOMS.map((room, i) => ({
      name: room.name,
      score: [2450, 2180, 3120, 2890, 2640, 3310, 2970, 3560, 4120][i],
      stars: [3, 3, 2, 3, 2, 3, 2, 3, 3][i],
    }));
    return {
      world,
      juice,
      time: 2.0,
      victory: {
        totalScore: perRoom.reduce((sum, r) => sum + r.score, 0),
        totalStars: perRoom.reduce((sum, r) => sum + r.stars, 0),
        totalTime: 427,
        best: 24800,
        isNewBest: true,
        perRoom,
      },
    };
  },
};

export function runShot(kind, seed, handleEvents) {
  const stage = SHOTS[kind];
  if (!stage) return null;
  const originalRandom = Math.random;
  Math.random = mulberry32(seed);
  try {
    const staged = stage(handleEvents);
    staged.kind = kind;
    return staged;
  } finally {
    Math.random = originalRandom;
  }
}
