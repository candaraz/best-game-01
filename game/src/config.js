// BALLAST tuning: every number the simulation and the feel layer share.
// Physics first (rooms are tuned around these apexes), presentation second.
// Jump apexes at gravity 2400: FEATHER ~160px + slow fall, BALANCED ~168px,
// HEAVY ~133px, ANCHOR ~91px. Room steps never exceed 64px except routes
// the updraft or a full FEATHER jump serves.

export const VIEW = { w: 960, h: 600 };
export const STEP = 1 / 60;

export const PHYSICS = {
  gravity: 2400,
  // Per gauge: 0 FEATHER, 1 BALANCED, 2 HEAVY, 3 ANCHOR.
  jumpVel: [880, 900, 800, 660],
  fallCap: [240, 780, 840, 980],
  fallGravityScale: [0.5, 1.0, 1.05, 1.2],
  riseGravityScale: [1.0, 1.0, 1.0, 1.1],
  moveSpeed: [250, 300, 265, 215],
  groundAccel: 3200,
  airAccel: 2200,
  groundFriction: 2600,
  coyoteTime: 0.09,
  jumpBuffer: 0.12,
  jumpCut: 0.5,
  playerW: 30,
  playerH: 42,
};

export const WEIGHT = {
  maxGauge: 3,
  stealRange: 170,
  longTetherRange: 240,
  golemPopScore: 150,
  mineDisarmScore: 100,
  orbScore: 100,
  smashScore: 150,
  roomClearScore: 500,
  comboWindow: 3.0,
  quickHandsWindow: 4.5,
  comboCap: 3,
  heartsPerRoom: 3,
  invulnTime: 1.2,
  mineArmRadius: 110,
  golemAlertRadius: 150,
  golemSpeed: 55,
  boulderBreakDelay: 0.35,
  anchorSmashFallSpeed: 500,
};

export const FEEL = {
  shakeDecay: 2.6,
  shakeMax: 14,
  hitStopPop: 0.05,
  hitStopExplosion: 0.06,
  hitStopSmash: 0.09,
  traumaPop: 0.45,
  traumaExplosion: 0.7,
  traumaSmash: 0.8,
  traumaLand: 0.25,
  traumaSteal: 0.12,
};

// Dark saturated vault: deep indigo walls, gold light, cyan weight-energy,
// magenta danger. Characters must read in greyscale: light bodies on dark
// walls, dark outlines, one reserved colour per meaning.
export const PALETTE = {
  sky0: '#0b0f26',
  sky1: '#141a3d',
  wall: '#232a52',
  wallDark: '#1a2044',
  wallEdge: '#3b4474',
  stone: '#4a5280',
  stoneDark: '#333a5e',
  stoneEdge: '#828bb8',
  floor: '#2c3358',
  floorEdge: '#565f96',
  gold: '#f5c542',
  goldDim: '#c99a2e',
  cyan: '#4de3e0',
  cyanDim: '#2a9a98',
  magenta: '#f4517e',
  danger: '#ff5a4e',
  parchment: '#f2e7c9',
  ink: '#10142e',
  pip: ['#bdf3f2', '#ffb35c', '#ff8a3d', '#e2583e'],
  pipDark: ['#7fc4c2', '#d98a3a', '#c95f24', '#a83a28'],
  golem: '#a3a9d4',
  golemDark: '#6e759e',
  crate: '#a8763e',
  crateDark: '#7d5627',
  boulder: '#7a7f9e',
  boulderDark: '#565b78',
  orb: '#ffd94d',
};

export const WEIGHT_NAMES = ['FEATHER', 'BALANCED', 'HEAVY', 'ANCHOR'];
export const WEIGHT_EFFECTS = [
  'Floats · rides updrafts · blown by gales',
  'Balanced · steady jumps',
  'Pushes crates · holds switches',
  'Smashes cracked floors · ignores wind',
];

export const SEALS = [
  {
    id: 'heart',
    name: 'Heart Seal',
    icon: '♥',
    blurb: '+1 max heart, and heal 1 now. Room attempts get roomier.',
  },
  {
    id: 'tether',
    name: 'Long Tether',
    icon: '⇄',
    blurb: 'Steal and give reach 40% farther. Pop golems from safety.',
  },
  {
    id: 'echo',
    name: 'Echo Smash',
    icon: '◎',
    blurb: 'Smashing a cracked floor sends a shockwave that pops golems and disarms mines nearby.',
  },
  {
    id: 'lungs',
    name: 'Feather Lungs',
    icon: '🪶',
    blurb: 'Feather falls slower and updrafts lift harder. The sky is a road.',
  },
  {
    id: 'hands',
    name: 'Quick Hands',
    icon: '✦',
    blurb: 'Combo window grows from 3s to 4.5s. Chains are easier to keep.',
  },
  {
    id: 'skin',
    name: 'Stone Skin',
    icon: '⬡',
    blurb: 'The first hit in every room is ignored. One free mistake per room.',
  },
];

export const STORAGE_KEY = 'ballast-v5-save';
