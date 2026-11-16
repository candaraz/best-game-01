// The nine hand-built rooms. Each grid is 24 by 15 tiles of 40 pixels.
// Legend: '#' solid, '=' one-way platform, 'X' cracked floor (a weight-3 landing
// smashes it), 'P' player spawn, 'o' orb, 'C' crate holding 2 weight, 'c' crate
// holding 0, 'B' boulder holding 2, 'G' golem, 'M' mine, 'S' pressure switch,
// '|' gate (opens while its switch holds enough weight). The door and the wind
// zones are explicit: the door is drawn from its base point, zones are rects.
// Every room holds exactly 2 orbs. Par times were set from measured playthroughs
// with a generous margin, and every room is script-solved in the playtest.

export const ROOMS = [
  {
    name: 'First Theft',
    objective: 'Smash the cracked bridge, reach the door',
    hint: 'Steal weight (E) from the crate until you are ANCHOR, then jump and land hard on the cracked bridge.',
    par: 30,
    door: { x: 900, y: 560 },
    zones: [],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.....o..................',
      '....###.................',
      '........................',
      '...................o....',
      '...==...................',
      '.P...C..................',
      '##################XXX###',
      '########################',
    ],
  },
  {
    name: 'Give It Back',
    objective: 'Ride the updraft to the high door',
    hint: 'Give weight (Q) to the empty crate until you are FEATHER, then float up the golden shaft.',
    par: 30,
    door: { x: 900, y: 200 },
    zones: [{ kind: 'updraft', x: 600, y: 120, w: 120, h: 400, strength: 1400 }],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '......o...........######',
      '......==..........#.....',
      '..................#.....',
      '................o.#.....',
      '....==............#.....',
      '..................#.....',
      '..................#.....',
      '.P.c..............#.....',
      '########################',
      '########################',
    ],
  },
  {
    name: 'Hollow Patrol',
    objective: 'Clear the patrol, reach the door',
    hint: 'Golems hate losing weight. Steal once and they pop.',
    par: 35,
    door: { x: 880, y: 520 },
    zones: [],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........o......o........',
      '.......===....===.......',
      '.P.....G......G.........',
      '########################',
      '########################',
    ],
  },
  {
    name: 'Quiet Mines',
    objective: 'Fizzle every mine, reach the door',
    hint: 'Mines sleep when fed. Give weight (Q) to a mine to fizzle it — crates are your batteries.',
    par: 45,
    door: { x: 900, y: 520 },
    zones: [],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..........o.............',
      '.........===............',
      '........................',
      '........==..............',
      '.....................o..',
      '.P..C....M..C..M..M.....',
      '########################',
      '########################',
    ],
  },
  {
    name: 'Gale Corridor',
    objective: 'Cross the gale, ride the shaft, reach the door',
    hint: 'The gale owns the light. Steal to ANCHOR to cross, then give it all back to float up.',
    par: 45,
    door: { x: 900, y: 200 },
    zones: [
      { kind: 'gale', x: 400, y: 340, w: 200, h: 220, dx: -1, strength: 950 },
      { kind: 'updraft', x: 600, y: 120, w: 120, h: 400, strength: 1400 },
    ],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..................######',
      '..................#.....',
      '..................#.....',
      '................o.#.....',
      '..................#.....',
      '..................#.....',
      '............o.....#.....',
      '.P..C.....=====c..#.....',
      '##########.....#########',
      '##########.....#########',
    ],
  },
  {
    name: 'Heavy Work',
    objective: 'Weigh the switch, open the gate',
    hint: 'Push the empty crate onto the switch, then feed it weight until the gate rises.',
    par: 50,
    door: { x: 900, y: 520 },
    zones: [],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '......o.................',
      '.....###................',
      '........................',
      '..................|.....',
      '..==..............|.....',
      '..................|.....',
      '..................|.o...',
      '.P..C..B...c..S...|.....',
      '########################',
      '########################',
    ],
  },
  {
    name: 'The Long Drop',
    objective: 'Smash down, weigh the switch, open the gate',
    hint: 'Fall from high at ANCHOR to smash. What breaks stays broken — the way down is one-way.',
    par: 55,
    door: { x: 900, y: 520 },
    zones: [],
    grid: [
      '........................',
      '........................',
      '........................',
      '.P.C....................',
      '.#####..................',
      '........................',
      '........................',
      '.......XXX..............',
      '............o.....|.....',
      '.......####.......|.....',
      '..................|.....',
      '..................|.....',
      '......c...S.XXXG..|..o..',
      '########################',
      '########################',
    ],
  },
  {
    name: 'Vault Gauntlet',
    objective: 'Run the gauntlet: golem, mines, gale, gate',
    hint: 'Everything you stole, everything you gave — one corridor, no rest.',
    par: 70,
    door: { x: 930, y: 520 },
    zones: [{ kind: 'gale', x: 400, y: 340, w: 160, h: 220, dx: -1, strength: 950 }],
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.......o..............|.',
      '......===.............|.',
      '...........o..........|.',
      '......................|.',
      '.P..C..G.M====.C.M.c.S|.',
      '##########....##########',
      '##########....##########',
    ],
  },
  {
    name: 'The Hollow Vault',
    objective: 'Open the vault: weigh in, float up, smash down',
    hint: 'Push the empty crate onto the switch and feed it to open the gate above. Then float up and drop like a star.',
    par: 80,
    door: { x: 880, y: 520 },
    zones: [{ kind: 'updraft', x: 600, y: 200, w: 40, h: 320, strength: 1500 }],
    grid: [
      '........................',
      '........................',
      '........................',
      '.....................o..',
      '.................#######',
      '...................|....',
      '...................|....',
      '................c.C|B...',
      '..............#.###|#XX#',
      '..............#.#.......',
      '...............o#.......',
      '................#.......',
      '.P..C..G..M.cS..#.......',
      '########################',
      '########################',
    ],
  },
];

/** Parse a room grid into statics and spawn lists. Coordinates are pixels. */
export function parseRoom(room) {
  const tile = 40;
  const solids = [];
  const oneWay = [];
  const cracked = [];
  const gates = [];
  const orbs = [];
  const crates = [];
  const boulders = [];
  const golems = [];
  const mines = [];
  const switches = [];
  let spawn = { x: 60, y: 480 };
  for (let row = 0; row < room.grid.length; row += 1) {
    const line = room.grid[row];
    for (let col = 0; col < line.length; col += 1) {
      const ch = line[col];
      const x = col * tile;
      const y = row * tile;
      if (ch === '#') solids.push({ x, y, w: tile, h: tile });
      else if (ch === '=') oneWay.push({ x, y, w: tile, h: 14 });
      else if (ch === 'X') cracked.push({ x, y, w: tile, h: tile, broken: false });
      else if (ch === '|') gates.push({ x, y, w: tile, h: tile });
      else if (ch === 'P') spawn = { x: x + tile / 2, y: y + tile };
      else if (ch === 'o') orbs.push({ x: x + tile / 2, y: y + tile / 2, taken: false });
      else if (ch === 'C') crates.push({ x: x + 1, y, w: 38, h: 38, weight: 2, maxWeight: 3 });
      else if (ch === 'c') crates.push({ x: x + 1, y, w: 38, h: 38, weight: 0, maxWeight: 3 });
      else if (ch === 'B') boulders.push({ x, y, w: 40, h: 40, weight: 2, maxWeight: 3, roll: 0 });
      else if (ch === 'G') golems.push({ x: x + 3, y, w: 34, h: 42, weight: 1, dir: 1, alive: true });
      else if (ch === 'M') mines.push({ x: x + 5, y: y + 10, w: 30, h: 30, weight: 0, maxWeight: 1, armed: true });
      else if (ch === 'S') switches.push({ x: x + 2, y: y + 26, w: 36, h: 14, threshold: 2, active: false });
    }
  }
  return { solids, oneWay, cracked, gates, orbs, crates, boulders, golems, mines, switches, spawn };
}
