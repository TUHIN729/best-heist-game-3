// The Midnight Gala — a top-down museum gala art heist.
// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 235,
  walkSpeed: 110, // Shift: slow-walk, needed to blend in the crowd
  grabRadius: 30,
};

export const LOOT = {
  diamond: { x: 640, y: 104, value: 10000, weight: 2, name: 'Star of Meridian' },
  paintings: [
    { x: 150, y: 380, value: 2000, weight: 1, name: 'Portrait of the Duchess' },
    { x: 330, y: 500, value: 2000, weight: 1, name: 'Still Life with Peaches' },
    { x: 950, y: 500, value: 2000, weight: 1, name: 'The Blue Harbour' },
    { x: 1130, y: 380, value: 2000, weight: 1, name: 'Dancers at Dusk' },
  ],
};

/** Loot slows the thief: each unit of weight costs this fraction of speed. */
export const WEIGHT_PENALTY = 0.06;

export const GETAWAY_SECONDS = 90;

export const GUARD = {
  radius: 13,
  speed: 95,
  patrolSpeed: 70,
  chaseSpeed: 150,
  visionRange: 230,
  visionHalfAngle: 0.46, // ~26 degrees each side
  sureTime: 0.9, // seconds of continuous sight before a touch is a catch
  staggerTime: 2.5,
};

export const CAMERA = {
  range: 240,
  halfAngle: 0.38,
  sweepSpeed: 0.55,
};

export const LASER = {
  // Three beams across the vault corridor, cycling on/off out of phase.
  beams: [
    { y: 205, x1: 480, x2: 800, period: 4.0, phase: 0.0, on: 2.0 },
    { y: 238, x1: 480, x2: 800, period: 4.0, phase: 1.3, on: 2.0 },
    { y: 271, x1: 480, x2: 800, period: 4.0, phase: 2.6, on: 2.0 },
  ],
  alarmHit: 25,
};

export const ALARM = {
  seenPerSecond: 42, // while any guard has you in its cone
  cameraPerSecond: 26, // while any camera has you in its sweep
  decayPerSecond: 5,
  max: 100,
  bump: 20, // casual guard touch while unsure
  catchAt: 50, // a touch at or above this alarm is a catch
};

export const TOOLS = {
  smokeSeconds: 4,
  empSeconds: 10,
};

export const GUESTS = 10;

/** Colours. */
export const COLORS = {
  floor: '#23202e',
  floorAlt: '#282536',
  carpet: '#6e1423',
  carpetEdge: '#c9a227',
  wall: '#3a3450',
  wallTop: '#4a4364',
  vaultFloor: '#2e2a1e',
  gold: '#c9a227',
  diamond: '#bfe9ff',
  guard: '#2b3a67',
  guardCone: 'rgba(255, 214, 90, 0.16)',
  guardConeSeen: 'rgba(255, 80, 60, 0.28)',
  cameraCone: 'rgba(255, 90, 90, 0.13)',
  laser: '#ff2e4d',
  laserOff: 'rgba(255, 46, 77, 0.18)',
  thief: '#14141c',
  thiefShirt: '#f5f2e8',
  guest: ['#7a4a8f', '#3f7a6a', '#8f5a2b', '#4a6a9e', '#9e4a6a', '#5a8f3f'],
  text: '#f2ead8',
  muted: '#b9b2a0',
  alarm: '#ff4d4d',
  ok: '#7ddc8a',
};
