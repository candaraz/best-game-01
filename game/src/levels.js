// The nine vault rooms, hand-built in teaching order: one new idea per
// room, safe first contact, then a twist, then the exam. Coordinates are
// canvas pixels (960x600); the floor top is y=540 and the walls are 24px.
// Jump apexes (see config.js): BALANCED ~168px, FEATHER ~160px + slow fall,
// HEAVY ~133px, ANCHOR ~91px. No step exceeds 64px except routes the
// updraft or a full jump serves; no horizontal gap exceeds 90px at the
// same height without a run-up.

const FLOOR = [0, 540, 960, 60];
const WALL_L = [0, 0, 24, 600];
const WALL_R = [936, 0, 24, 600];

function room(def) {
  return {
    startGauge: 1,
    solids: [],
    cracked: [],
    crates: [],
    boulders: [],
    golems: [],
    mines: [],
    orbs: [],
    switches: [],
    gates: [],
    updrafts: [],
    gales: [],
    lanterns: [],
    banners: [],
    doorLock: 'none',
    ...def,
    solids: [FLOOR, WALL_L, WALL_R, ...def.solids],
  };
}

export const LEVELS = [
  // R1 — ki: steal, then smash. The door stays locked until the slab breaks.
  room({
    name: 'First Theft',
    subtitle: 'Room 1 of 9 · The Vault Door',
    hint: 'Steal weight with E until ANCHOR, then drop onto the cracked slab.',
    par: 45,
    spawn: [56, 498],
    solids: [
      [120, 440, 110, 24],
      [60, 360, 110, 24],
    ],
    cracked: [{ x: 620, y: 480, w: 160, h: 24, id: 'slab' }],
    crates: [
      { x: 300, y: 504, weight: 1 },
      { x: 420, y: 504, weight: 1 },
    ],
    boulders: [{ x: 540, y: 500, weight: 1 }],
    orbs: [[700, 415], [115, 320]],
    door: [880, 476],
    doorLock: 'slab',
    lanterns: [[180, 60], [480, 60], [780, 60]],
    banners: [[340, 84], [640, 84]],
  }),

  // R2 — sho: give it all away, then float. Start heavy, end weightless.
  room({
    name: 'Give It Back',
    subtitle: 'Room 2 of 9 · The Hollow Shaft',
    hint: 'Give all weight to the empty crate (Q), then ride the updraft as FEATHER.',
    par: 50,
    spawn: [56, 498],
    startGauge: 2,
    solids: [
      [576, 100, 24, 300],
      [576, 60, 144, 24],
      [700, 180, 236, 24],
      [150, 430, 110, 24],
      [60, 330, 110, 24],
    ],
    updrafts: [{ x: 602, y: 104, w: 116, h: 436 }],
    crates: [
      { x: 200, y: 504, weight: 0 },
      { x: 280, y: 504, weight: 1 },
    ],
    orbs: [[660, 280], [115, 290]],
    door: [860, 116],
    lanterns: [[200, 60], [500, 60], [850, 60]],
    banners: [[340, 84]],
  }),

  // R3 — golems: steal their weight and they pop. The cover room.
  room({
    name: 'Hollow Patrol',
    subtitle: 'Room 3 of 9 · The Golem Gallery',
    hint: 'Pop both golems: steal their weight (E) when close.',
    par: 60,
    spawn: [56, 498],
    solids: [
      [150, 400, 120, 24],
      [420, 330, 120, 24],
      [690, 400, 120, 24],
    ],
    golems: [
      { x: 250, y: 484, minX: 230, maxX: 430 },
      { x: 600, y: 484, minX: 540, maxX: 740 },
    ],
    crates: [
      { x: 700, y: 364, weight: 1 },
      { x: 560, y: 504, weight: 1 },
      { x: 620, y: 504, weight: 1 },
    ],
    orbs: [[480, 290], [800, 330]],
    door: [880, 476],
    doorLock: 'golems',
    lanterns: [[180, 60], [480, 60], [780, 60]],
    banners: [[340, 84], [640, 84]],
  }),

  // R4 — mines: steal to disarm; touch is a mistake you survive.
  room({
    name: 'Quiet Mines',
    subtitle: 'Room 4 of 9 · The Sleeping Field',
    hint: "Steal each mine's weight to disarm it. Don't touch a live one.",
    par: 55,
    spawn: [56, 498],
    solids: [
      [210, 436, 100, 24],
      [330, 360, 100, 24],
      [550, 440, 100, 24],
      [660, 360, 100, 24],
    ],
    mines: [
      { x: 400, y: 478 },
      { x: 480, y: 420 },
      { x: 780, y: 488 },
    ],
    crates: [
      { x: 150, y: 504, weight: 1 },
      { x: 220, y: 504, weight: 0 },
    ],
    orbs: [[380, 320], [710, 320]],
    door: [880, 476],
    doorLock: 'mines',
    lanterns: [[180, 60], [480, 60], [780, 60]],
    banners: [[340, 84], [640, 84]],
  }),

  // R5 — combination: ANCHOR through the gale, FEATHER up the shaft.
  room({
    name: 'Gale Corridor',
    subtitle: 'Room 5 of 9 · The Wind Gate',
    hint: 'Steal to ANCHOR to cross the gale, then give it all away and float up.',
    par: 65,
    spawn: [56, 498],
    solids: [
      [150, 400, 100, 24],
      [626, 100, 24, 300],
      [626, 60, 120, 24],
      [740, 150, 196, 24],
    ],
    gales: [{ x: 250, y: 300, w: 350, h: 240, dir: -1 }],
    updrafts: [{ x: 652, y: 104, w: 90, h: 436 }],
    crates: [
      { x: 120, y: 504, weight: 1 },
      { x: 200, y: 504, weight: 1 },
      { x: 540, y: 504, weight: 0 },
      { x: 585, y: 504, weight: 0 },
    ],
    boulders: [{ x: 170, y: 360, weight: 1 }],
    orbs: [[420, 430], [697, 280]],
    door: [860, 86],
    lanterns: [[150, 60], [450, 60], [800, 60]],
    banners: [[340, 84]],
  }),

  // R6 — heavy work: make a crate heavy, push it onto the plate.
  room({
    name: 'Heavy Work',
    subtitle: 'Room 6 of 9 · The Press Floor',
    hint: 'Give weight to the middle crate until it is heavy, then push it (HEAVY) onto the plate.',
    par: 60,
    spawn: [56, 498],
    solids: [
      [190, 436, 100, 24],
      [300, 340, 110, 24],
      [690, 440, 60, 24],
      [790, 340, 110, 24],
    ],
    crates: [
      { x: 110, y: 504, weight: 1 },
      { x: 155, y: 504, weight: 1 },
      { x: 210, y: 504, weight: 1 },
    ],
    switches: [{ x: 600, y: 530, id: 's1' }],
    gates: [{ x: 760, y: 180, w: 24, h: 360, condition: { switch: 's1' } }],
    orbs: [[355, 300], [845, 300]],
    door: [880, 476],
    doorLock: 'switch',
    lanterns: [[180, 60], [480, 60], [780, 60]],
    banners: [[340, 84], [640, 84]],
  }),

  // R7 — ten, the twist: you do not smash it. The boulder does.
  room({
    name: 'The Long Drop',
    subtitle: 'Room 7 of 9 · The Drop Shaft',
    hint: 'Make the boulder heavy and let it smash the cracked floor. Then drop in.',
    par: 70,
    spawn: [56, 498],
    solids: [
      [120, 436, 110, 24],
      [240, 360, 110, 24],
      [390, 300, 110, 24],
      [550, 300, 110, 24],
      [400, 404, 24, 136],
      [536, 404, 24, 136],
      [660, 290, 120, 24],
    ],
    cracked: [{ x: 400, y: 380, w: 160, h: 24, id: 'slab' }],
    crates: [{ x: 150, y: 504, weight: 1 }],
    boulders: [{ x: 450, y: 340, weight: 1 }],
    orbs: [[720, 250], [135, 395]],
    door: [490, 476],
    doorLock: 'slab',
    lanterns: [[200, 60], [480, 60], [800, 60]],
    banners: [[340, 84], [640, 84]],
  }),

  // R8 — gauntlet: everything so far, in one corridor, with the wind
  // pushing you toward the danger.
  room({
    name: 'Vault Gauntlet',
    subtitle: 'Room 8 of 9 · The Trial Hall',
    hint: 'Pop the golem, disarm both mines. The gale pushes toward danger.',
    par: 75,
    spawn: [56, 498],
    solids: [
      [150, 400, 110, 24],
      [400, 330, 110, 24],
      [650, 400, 110, 24],
    ],
    cracked: [{ x: 700, y: 460, w: 120, h: 24, id: 'slab' }],
    gales: [{ x: 470, y: 300, w: 140, h: 240, dir: 1 }],
    golems: [{ x: 200, y: 484, minX: 180, maxX: 380 }],
    mines: [
      { x: 500, y: 478 },
      { x: 600, y: 438 },
    ],
    crates: [
      { x: 120, y: 504, weight: 1 },
      { x: 300, y: 504, weight: 1 },
    ],
    boulders: [{ x: 430, y: 290, weight: 1 }],
    orbs: [[455, 290], [760, 420]],
    door: [880, 476],
    doorLock: 'golems+mines',
    lanterns: [[150, 60], [450, 60], [780, 60]],
    banners: [[340, 84], [640, 84]],
  }),

  // R9 — ketsu, the exam: pop, disarm, press, open. The vault awaits.
  room({
    name: 'The Hollow Vault',
    subtitle: 'Room 9 of 9 · The Final Vault',
    hint: 'Everything you know: pop, disarm, press, open. The vault awaits.',
    par: 90,
    spawn: [56, 498],
    solids: [
      [150, 400, 110, 24],
      [350, 330, 110, 24],
      [620, 400, 110, 24],
    ],
    golems: [
      { x: 150, y: 484, minX: 130, maxX: 330 },
      { x: 350, y: 484, minX: 330, maxX: 530 },
    ],
    mines: [
      { x: 560, y: 478 },
      { x: 640, y: 448 },
    ],
    crates: [
      { x: 110, y: 504, weight: 1 },
      { x: 155, y: 504, weight: 1 },
      { x: 210, y: 504, weight: 1 },
      { x: 700, y: 364, weight: 1 },
    ],
    switches: [{ x: 700, y: 530, id: 's1' }],
    gates: [{ x: 800, y: 180, w: 24, h: 360, condition: { switch: 's1' } }],
    orbs: [[405, 290], [675, 360]],
    door: [880, 476],
    doorLock: 'golems+mines+switch',
    lanterns: [[150, 60], [450, 60], [780, 60]],
    banners: [[340, 84], [640, 84]],
  }),
];
