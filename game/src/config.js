// Every tuning number and colour in one place. The playfield is a fixed 960x600
// logical area; the renderer scales it to the window, so no rule below depends
// on the screen size. Rooms are single-screen: 24 by 15 tiles of 40 pixels.

export const FIELD = { width: 960, height: 600, tile: 40, cols: 24, rows: 15 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  width: 30,
  height: 44,
  /** Reach of a steal or a give, in pixels, from the player's centre. */
  range: 150,
  /** Seconds between transfers. */
  transferCooldown: 0.22,
  /** Seconds a jump still works after leaving ground. */
  coyote: 0.09,
  /** Seconds a jump pressed early is remembered. */
  jumpBuffer: 0.12,
  /** Seconds of mercy after taking a hit. */
  invulnerable: 1.3,
  /** Knockback on taking a hit. */
  hurtKnockX: 260,
  hurtKnockY: -320,
};

/**
 * The four weight states. Stealing raises the gauge, giving lowers it. Each
 * state is a different way of moving through the same room: light floats and
 * jumps high but the wind owns it; anchor barely jumps but nothing moves it,
 * it pushes crates, holds switches and smashes cracked floors.
 */
export const WEIGHTS = [
  {
    name: 'FEATHER',
    gauge: 0,
    speed: 235,
    gravity: 880,
    jump: -565,
    maxFall: 165,
    wind: 1.0,
    updraft: 1.0,
    push: false,
    smash: false,
    colour: '#9fe8ff',
    glow: '#bdf3ff',
    verb: 'Floats · huge jump · wind tosses you',
  },
  {
    name: 'BALANCED',
    gauge: 1,
    speed: 255,
    gravity: 1500,
    jump: -645,
    maxFall: 540,
    wind: 0.55,
    updraft: 0.35,
    push: false,
    smash: false,
    colour: '#ffd76a',
    glow: '#ffe9a8',
    verb: 'Steady · standard jump',
  },
  {
    name: 'HEAVY',
    gauge: 2,
    speed: 225,
    gravity: 1950,
    jump: -590,
    maxFall: 660,
    wind: 0.25,
    updraft: 0.0,
    push: true,
    smash: false,
    colour: '#ff9a4d',
    glow: '#ffc08a',
    verb: 'Pushes crates · holds switches',
  },
  {
    name: 'ANCHOR',
    gauge: 3,
    speed: 175,
    gravity: 2450,
    jump: -490,
    maxFall: 800,
    wind: 0.0,
    updraft: 0.0,
    push: true,
    smash: true,
    colour: '#ff6b5e',
    glow: '#ffa89e',
    verb: 'Smashes cracked floors · ignores wind',
  },
];

export const HEARTS_PER_ROOM = 3;

/** Score values. Orb and hazard scores are multiplied by the combo. */
export const SCORE = {
  orb: 100,
  golemPop: 150,
  mineFizzle: 150,
  roomClear: 500,
  timeBonusPerSecond: 20,
  noDamageBonus: 300,
  /** Seconds between transfers before the combo chain breaks. */
  comboWindow: 3.0,
  comboMax: 3,
};

/** Fall speed a weight-3 landing needs to smash a cracked floor. */
export const SMASH_MIN_FALL = 420;

export const GOLEM = { width: 34, height: 42, speed: 62, weight: 1 };
export const CRATE = { size: 38 };
export const BOULDER = { size: 40 };
export const MINE = { size: 30, armRadius: 170 };
export const ORB = { radius: 11 };

export const PALETTE = {
  // v4: a sunlit vault. The v3 indigo read as empty dark space in a still
  // frame; warm sandstone walls, bright stone floors and a pale sky make
  // every platform, entity and beam read at a glance, like the bright
  // frames that top the leaderboard. Dark HUD panels keep their contrast
  // on top of the light playfield.
  skyTop: '#f6e7bd',
  skyMid: '#eed9a0',
  skyBottom: '#dcbd7d',
  farArch: '#cfa96b',
  midArch: '#dbbf85',
  ground: '#8a6a45',
  groundTop: '#e0b96a',
  groundEdge: '#5a4026',
  platform: '#a8814e',
  platformTop: '#e8c887',
  cracked: '#9a6a42',
  crackedEdge: '#e0aa6a',
  text: '#241a10',
  muted: '#6a5a3a',
  gold: '#b8860b',
  panel: 'rgba(20, 16, 8, 0.84)',
  panelEdge: '#ffd76a',
  door: '#2f8f66',
  doorGlow: '#a8f5d2',
  gale: 'rgba(46, 130, 180, 0.22)',
  updraft: 'rgba(184, 134, 11, 0.28)',
  danger: '#d92b1f',
  switchOff: '#8a7a5a',
  switchOn: '#2f8f66',
  gate: '#8a6a45',
  player: '#4b3f72',
};

export const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';
export const FONT_DISPLAY = 'Georgia, "Times New Roman", serif';

/** Where bests are kept between visits (this browser only). */
export const BEST_KEY = 'ballast-v4.best';
export const MUTE_KEY = 'ballast-v4.muted';
