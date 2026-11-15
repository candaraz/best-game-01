// Screenshot staging: ?shot= poses REAL simulated state for the dossier
// screenshots — the same world, the same renderer, the same physics, just
// staged into a photogenic moment instead of played into one. Nothing here
// draws anything the game itself cannot show.

export function applyShot(shot, game, helpers) {
  const { startRoom, fx } = helpers;

  if (shot === 'title') {
    // The title screen is already the default state.
    return;
  }

  if (shot === 'play') {
    // Room 3: platforms, a patrolling golem, glowing orbs, Pip mid-room.
    // Pip stands clear of the golem's patrol so the pose survives: feet
    // exactly on the floor (y 526), facing the golem.
    startRoom(2);
    game.state = 'play';
    const p = game.room.player;
    p.x = 600;
    p.y = 526;
    p.vx = 0;
    p.vy = 0;
    p.facing = -1;
    return;
  }

  if (shot === 'weight') {
    // Room 2: one crate floats weightless after a steal, Pip holds the
    // weight at gauge 2, and the second crate holds the switch down so the
    // door stands open. All of it evolves through the real simulation.
    // Every body is staged resting exactly ON its surface: staging a body
    // inside the floor makes the anti-teleport check drop it through the
    // world and reset the room.
    startRoom(1);
    game.state = 'play';
    const crates = game.room.objects.filter((o) => o.kind === 'crate');
    const p = game.room.player;
    if (crates[0]) {
      crates[0].weight = 0; // stolen: floats to the ceiling
      crates[0].vy = -20;
    }
    if (crates[1]) {
      crates[1].weight = 2;
      crates[1].x = 540; // resting on the switch plates (cols 13-14)
      crates[1].y = 524; // crate bottom exactly on the floor top
    }
    p.gauge = 2;
    p.x = 470;
    p.y = 526;
    p.vx = 0;
    p.vy = 0;
    p.facing = 1;
    fx.burst(220, 480, { count: 14, color: '#ffd75e', speed: 110, size: 3, life: 0.7, gravity: 0, glow: true });
    return;
  }

  if (shot === 'win') {
    // The all-clear finale over the final room. The win screen reads its
    // star total from stored bests, so stage a finished playthrough: all
    // eight rooms at three stars, the same screen a perfect run shows.
    try {
      const rooms = {};
      for (let i = 0; i < 8; i++) rooms[i] = { stars: 3, time: 20 + i, score: 300 };
      localStorage.setItem('ballast-bests-v1', JSON.stringify({ rooms, furthest: 8, finished: true }));
    } catch {
      // Storage unavailable: the screen simply shows fewer stars.
    }
    startRoom(7);
    game.state = 'win';
    game.winTime = 1.2;
    game.totalScore = 2450;
    return;
  }
}
