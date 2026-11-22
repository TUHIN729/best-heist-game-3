// The Midnight Gala — world state and rules. Pure logic, no DOM, so the same
// code runs in the browser and in a headless Node playtest.
import {
  FIELD, STEP, PLAYER, LOOT, WEIGHT_PENALTY, GETAWAY_SECONDS, GUARD,
  CAMERA, LASER, ALARM, TOOLS, GUESTS, COLORS,
} from './config.js';
import { mulberry32, range } from './random.js';

export const STATUS_PLAY = 'play';
export const STATUS_WON = 'won';
export const STATUS_LOST = 'lost';

/** Axis-aligned walls. The exit gap is the hole in the bottom wall. */
export const WALLS = [
  { x: 0, y: 0, w: 1280, h: 24 }, // top
  { x: 0, y: 0, w: 24, h: 720 }, // left
  { x: 1256, y: 0, w: 24, h: 720 }, // right
  { x: 0, y: 696, w: 600, h: 24 }, // bottom left of exit
  { x: 680, y: 696, w: 600, h: 24 }, // bottom right of exit
  { x: 480, y: 24, w: 24, h: 156 }, // vault left
  { x: 776, y: 24, w: 24, h: 156 }, // vault right
  { x: 480, y: 180, w: 120, h: 16 }, // vault door wall left
  { x: 680, y: 180, w: 120, h: 16 }, // vault door wall right
  { x: 400, y: 300, w: 24, h: 120 }, // left gallery divider top
  { x: 400, y: 470, w: 24, h: 90 }, // left gallery divider bottom
  { x: 856, y: 300, w: 24, h: 120 }, // right gallery divider top
  { x: 856, y: 470, w: 24, h: 90 }, // right gallery divider bottom
  { x: 520, y: 420, w: 36, h: 36 }, // gala pillar 1
  { x: 724, y: 420, w: 36, h: 36 }, // gala pillar 2
];

export const EXIT = { x: 600, y: 694, w: 80, h: 26 };

export function createWorld(seed) {
  const rng = mulberry32(seed);
  const guests = [];
  for (let i = 0; i < GUESTS; i += 1) {
    guests.push({
      x: range(rng, 460, 820),
      y: range(rng, 330, 650),
      angle: range(rng, 0, Math.PI * 2),
      tx: range(rng, 460, 820),
      ty: range(rng, 330, 650),
      wait: 0,
      color: COLORS.guest[i % COLORS.guest.length],
      speed: range(rng, 26, 44),
    });
  }
  return {
    seed,
    rng: seed >>> 0,
    time: 0,
    status: STATUS_PLAY,
    reason: '',
    player: { x: 640, y: 655, angle: -Math.PI / 2, moving: false, walking: false },
    guards: [
      { x: 460, y: 340, angle: 0, wp: 0, mode: 'patrol', sure: 0, lost: 0, stagger: 0,
        path: [[460, 340], [820, 340], [820, 600], [460, 600]] },
      { x: 120, y: 340, angle: 0, wp: 0, mode: 'patrol', sure: 0, lost: 0, stagger: 0,
        path: [[120, 340], [360, 340], [360, 520], [120, 520]] },
      { x: 920, y: 340, angle: 0, wp: 0, mode: 'patrol', sure: 0, lost: 0, stagger: 0,
        path: [[920, 340], [1160, 340], [1160, 520], [920, 520]] },
      { x: 520, y: 300, angle: Math.PI / 2, wp: 0, mode: 'patrol', sure: 0, lost: 0, stagger: 0,
        path: [[520, 300], [760, 300]] },
    ],
    cameras: [
      { x: 640, y: 188, base: Math.PI / 2, amp: 0.55 },
      { x: 230, y: 302, base: Math.PI / 2, amp: 0.5 },
      { x: 1050, y: 302, base: Math.PI / 2, amp: 0.5 },
    ],
    guests,
    diamond: { taken: false },
    paintings: LOOT.paintings.map((p) => ({ ...p, taken: false })),
    alarm: 0,
    smoke: 0,
    emp: 0,
    smokeLeft: 1,
    empLeft: 1,
    getaway: null,
    lootValue: 0,
    weight: 0,
    blend: false,
    seen: false,
    laserCooldown: 0,
    message: '',
    messageTimer: 0,
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/** Advance the state's seeded RNG (mulberry32) and return a float in [0, 1). */
export function nextRand(state) {
  let a = state.rng | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  state.rng = a >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pointInRect(px, py, r, pad = 0) {
  return px > r.x - pad && px < r.x + r.w + pad && py > r.y - pad && py < r.y + r.h + pad;
}

/** Cheap line-of-sight: sample the segment; blocked if a sample lands in a wall. */
export function lineOfSight(x1, y1, x2, y2) {
  const samples = 14;
  for (let i = 1; i < samples; i += 1) {
    const t = i / samples;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (const w of WALLS) if (pointInRect(x, y, w, 0)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is the player inside a vision cone at (ox,oy) facing `angle`? */
export function inCone(state, ox, oy, angle, range, halfAngle) {
  const p = state.player;
  const dx = p.x - ox;
  const dy = p.y - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return lineOfSight(ox, oy, p.x, p.y);
}

/** Move a circle with axis-separated collision so it slides along walls. */
export function moveCircle(e, dx, dy, radius) {
  let nx = e.x + dx;
  for (const w of WALLS) {
    if (nx + radius > w.x && nx - radius < w.x + w.w && e.y + radius > w.y && e.y - radius < w.y + w.h) {
      nx = dx > 0 ? w.x - radius : w.x + w.w + radius;
    }
  }
  e.x = Math.min(FIELD.width - radius, Math.max(radius, nx));
  let ny = e.y + dy;
  for (const w of WALLS) {
    if (e.x + radius > w.x && e.x - radius < w.x + w.w && ny + radius > w.y && ny - radius < w.y + w.h) {
      ny = dy > 0 ? w.y - radius : w.y + w.h + radius;
    }
  }
  e.y = Math.min(FIELD.height - radius, Math.max(radius, ny));
}

function nearestGuestDist(state) {
  let best = Infinity;
  for (const g of state.guests) {
    best = Math.min(best, Math.hypot(g.x - state.player.x, g.y - state.player.y));
  }
  return best;
}

export function laserOn(beam, time) {
  return ((time + beam.phase) % beam.period) < beam.on;
}

export function setMessage(state, text, seconds = 2.5) {
  state.message = text;
  state.messageTimer = seconds;
}

export function step(state, input, dt = STEP) {
  if (state.status !== STATUS_PLAY) return state;
  state.time += dt;
  const p = state.player;

  // --- tools (edge-triggered by the caller) ---
  if (input.smoke && state.smokeLeft > 0 && state.smoke <= 0) {
    state.smoke = TOOLS.smokeSeconds;
    state.smokeLeft -= 1;
    setMessage(state, 'Smoke bomb! Guards are blind.');
  }
  if (input.emp && state.empLeft > 0 && state.emp <= 0) {
    state.emp = TOOLS.empSeconds;
    state.empLeft -= 1;
    setMessage(state, 'EMP! Cameras down for 10 seconds.');
  }
  state.smoke = Math.max(0, state.smoke - dt);
  state.emp = Math.max(0, state.emp - dt);
  state.laserCooldown = Math.max(0, state.laserCooldown - dt);
  if (state.messageTimer > 0) state.messageTimer -= dt;

  // --- player movement ---
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  p.moving = len > 0;
  p.walking = !!input.walk;
  if (len > 0) {
    mx /= len;
    my /= len;
    const speed = (p.walking ? PLAYER.walkSpeed : PLAYER.speed) * (1 - WEIGHT_PENALTY * state.weight);
    p.angle = Math.atan2(my, mx);
    moveCircle(p, mx * speed * dt, my * speed * dt, PLAYER.radius);
  }

  // --- blending: slow or still, close to a guest ---
  state.blend = (p.walking || !p.moving) && nearestGuestDist(state) < 70;

  // --- guests wander the gala floor ---
  for (const g of state.guests) {
    if (g.wait > 0) {
      g.wait -= dt;
      continue;
    }
    const dx = g.tx - g.x;
    const dy = g.ty - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      g.wait = 1 + nextRand(state) * 2;
      g.tx = 460 + nextRand(state) * 360;
      g.ty = 330 + nextRand(state) * 320;
    } else {
      g.angle = Math.atan2(dy, dx);
      moveCircle(g, (dx / d) * g.speed * dt, (dy / d) * g.speed * dt, 11);
    }
  }

  // --- lasers ---
  for (const beam of LASER.beams) {
    if (laserOn(beam, state.time) && state.laserCooldown <= 0
      && p.x > beam.x1 && p.x < beam.x2 && Math.abs(p.y - beam.y) < PLAYER.radius + 3) {
      state.alarm = Math.min(ALARM.max, state.alarm + LASER.alarmHit);
      state.laserCooldown = 0.8;
      setMessage(state, 'Laser tripped! Alarm +25.');
    }
  }

  // --- loot pickup ---
  if (!state.diamond.taken && Math.hypot(p.x - LOOT.diamond.x, p.y - LOOT.diamond.y) < PLAYER.grabRadius) {
    state.diamond.taken = true;
    state.lootValue += LOOT.diamond.value;
    state.weight += LOOT.diamond.weight;
    state.getaway = GETAWAY_SECONDS;
    setMessage(state, 'The Star of Meridian is yours! Getaway driver leaves in 90 seconds!', 3.5);
  }
  for (const art of state.paintings) {
    if (!art.taken && Math.hypot(p.x - art.x, p.y - art.y) < PLAYER.grabRadius) {
      art.taken = true;
      state.lootValue += art.value;
      state.weight += art.weight;
      setMessage(state, `Pocketed "${art.name}" — $${art.value.toLocaleString()}.`);
    }
  }

  // --- getaway timer ---
  if (state.getaway !== null) {
    state.getaway -= dt;
    if (state.getaway <= 0) {
      state.status = STATUS_LOST;
      state.reason = 'The getaway driver left without you.';
      return state;
    }
  }

  // --- detection ---
  const blinded = state.smoke > 0;
  const visionRange = GUARD.visionRange * (state.blend ? 0.45 : 1);
  const visionHalf = GUARD.visionHalfAngle * (state.blend ? 0.7 : 1);
  let seen = false;
  for (const g of state.guards) {
    if (g.stagger > 0) {
      g.stagger -= dt;
      continue;
    }
    const sees = !blinded && inCone(state, g.x, g.y, g.angle, visionRange, visionHalf);
    if (sees) {
      seen = true;
      g.sure = Math.min(GUARD.sureTime, g.sure + dt);
      g.lost = 0;
      g.mode = 'chase';
    } else {
      g.sure = Math.max(0, g.sure - dt * 2);
      if (g.mode === 'chase') {
        g.lost += dt;
        if (g.lost > 1.5) g.mode = 'patrol';
      }
    }
    // movement
    if (g.mode === 'chase') {
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        g.angle = Math.atan2(dy, dx);
        moveCircle(g, (dx / d) * GUARD.chaseSpeed * dt, (dy / d) * GUARD.chaseSpeed * dt, GUARD.radius);
      }
    } else {
      const [tx, ty] = g.path[g.wp];
      const dx = tx - g.x;
      const dy = ty - g.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        g.wp = (g.wp + 1) % g.path.length;
      } else {
        g.angle = Math.atan2(dy, dx);
        moveCircle(g, (dx / d) * GUARD.patrolSpeed * dt, (dy / d) * GUARD.patrolSpeed * dt, GUARD.radius);
      }
    }
    // touch
    const touch = Math.hypot(p.x - g.x, p.y - g.y) < PLAYER.radius + GUARD.radius;
    if (touch) {
      if (g.sure >= GUARD.sureTime || state.alarm >= ALARM.catchAt) {
        state.status = STATUS_LOST;
        state.reason = 'A guard caught you red-handed.';
        return state;
      }
      state.alarm = Math.min(ALARM.max, state.alarm + ALARM.bump);
      g.stagger = GUARD.staggerTime;
      g.mode = 'patrol';
      g.sure = 0;
      // knock the thief back a little
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      moveCircle(p, (dx / d) * 26, (dy / d) * 26, PLAYER.radius);
      setMessage(state, 'Bumped into a guard! Alarm +20.');
    }
  }
  if (!blinded && state.emp <= 0) {
    for (const c of state.cameras) {
      const angle = c.base + Math.sin(state.time * CAMERA.sweepSpeed) * c.amp;
      c.angle = angle;
      if (inCone(state, c.x, c.y, angle, CAMERA.range, CAMERA.halfAngle)) seen = true;
    }
  }
  state.seen = seen;

  // --- alarm ---
  if (seen) {
    const guardSees = state.guards.some((g) => g.sure > 0);
    state.alarm = Math.min(ALARM.max, state.alarm + (guardSees ? ALARM.seenPerSecond : ALARM.cameraPerSecond) * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
  }
  if (state.alarm >= ALARM.max) {
    state.status = STATUS_LOST;
    state.reason = 'Lockdown! The alarm hit 100 and the museum sealed shut.';
    return state;
  }

  // --- win: out the exit with the diamond ---
  if (state.diamond.taken && pointInRect(p.x, p.y, EXIT, -4)) {
    state.status = STATUS_WON;
    state.reason = '';
    return state;
  }
  if (!state.diamond.taken && pointInRect(p.x, p.y, EXIT, -4)) {
    setMessage(state, 'You need the Star of Meridian first!', 1.2);
  }
  return state;
}

export function finalScore(state) {
  if (state.status !== STATUS_WON) return state.lootValue;
  const timeBonus = state.getaway !== null ? Math.round(state.getaway) * 20 : 0;
  return state.lootValue + timeBonus;
}
