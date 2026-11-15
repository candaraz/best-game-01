// BALLAST tuning: every number that shapes how the game feels lives here,
// so a room or a mechanic can be re-tuned without touching the simulation.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 600
export const WIDTH = VIEW_W;
export const HEIGHT = VIEW_H;
export const STEP = 1 / 60; // fixed simulation step

// Movement, designed by jump height and time-to-apex (rise gravity g = 2h/t^2,
// jump speed v = 2h/t): a full jump rises ~2.6 tiles in ~0.34 s at gauge 1.
export const MOVE = {
  runSpeed: 225,
  accel: 2600,
  groundFriction: 2200,
  airAccel: 1700,
  jumpSpeed: 640,
  riseGravity: 1980,
  fallGravity: 2650,
  maxFall: 720,
  coyote: 0.1,
  buffer: 0.12,
  jumpCut: 0.45, // upward speed kept when the jump key is released early
};

// How Pip's carried weight reshapes the same body. Gauge 0 floats, gauge 3
// is an anchor. Values multiply the gauge-1 baseline.
export const GAUGE = [
  { label: 'Feather', gravity: 0.52, jump: 1.06, maxFall: 0.5, wind: 1.35, color: '#8fd8ff' },
  { label: 'Balanced', gravity: 1.0, jump: 1.0, maxFall: 1.0, wind: 1.0, color: '#ffd75e' },
  { label: 'Heavy', gravity: 1.15, jump: 1.05, maxFall: 1.15, wind: 0.6, color: '#f2a541' },
  { label: 'Anchor', gravity: 1.55, jump: 0.78, maxFall: 1.3, wind: 0.0, color: '#ff7a59' },
];

export const TRANSFER = {
  range: 120, // px from Pip's centre to an object's centre
  cooldown: 0.25,
  switchWeight: 2, // object weight that holds a floor switch down
  smashWeight: 3, // object weight (or gauge) that breaks cracked floors
  smashFallSpeed: 420, // px/s of downward speed needed to smash
};

export const WIND = {
  updraftLift: 2900, // px/s^2 at gauge 0, scaled down per gauge step
  updraftScale: [1.0, 0.75, 0.3, 0.0], // gauge 1 still rises, slowly; gauge 2+ sinks
  updraftRiseCap: 260, // px/s upward speed cap inside a shaft
  galePush: 4800, // px/s^2 at gauge 0, scaled by GAUGE wind factor: beats running below gauge 3
};

export const HEARTS_PER_ROOM = 3;
export const ORB_SCORE = 100;
export const NO_DAMAGE_BONUS = 250;
export const TIME_BONUS_PER_SECOND = 10;

export const PALETTE = {
  skyTop: '#0d1030',
  skyBottom: '#1d2352',
  star: '#e8ecff',
  moon: '#f4f1de',
  moonGlow: 'rgba(244, 241, 222, 0.22)',
  hillFar: '#252c58',
  hillNear: '#1a2048',
  brick: '#3a3f6b',
  brickDark: '#2c3160',
  brickEdge: '#4c538a',
  moss: '#46b98a',
  mossDark: '#2f8f68',
  crack: '#1c1f3d',
  amber: '#f2a541',
  gold: '#ffd75e',
  portal: '#7ef0c8',
  portalDark: '#2f8f68',
  ink: '#0b0e1d',
  paper: '#f4f1de',
  dim: '#9aa3d0',
};
