// Screenshot scenes behind ?shot=start|play|vault|end. Each one plays the real
// rules forward from a fresh world, steered by a greedy lookahead autopilot
// (try 8 directions + stay, simulate half a second ahead in a cloned world,
// keep the move that gets closest to the target without being seen), so the
// frame is what a real game looks like and the same seed gives the same frame.
import { FIELD, STEP, LOOT } from './config.js';
import { createWorld, step, cloneState, STATUS_PLAY, STATUS_WON, STATUS_LOST } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

const PLAY_SECONDS = 8;
const VAULT_SECONDS = 5;
const END_LIMIT_SECONDS = 240;
const LOOKAHEAD = 0.5;
const HOLD = 0.1; // seconds the autopilot holds one chosen direction

const DIRS = [
  [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function targetOf(state) {
  if (!state.diamond.taken) return [LOOT.diamond.x, LOOT.diamond.y];
  return [640, 710]; // the exit
}

function danger(state) {
  let d = 0;
  if (state.status === STATUS_LOST) d += 10000;
  if (state.seen) d += 300;
  d += state.alarm * 3;
  for (const g of state.guards) {
    const dist = Math.hypot(g.x - state.player.x, g.y - state.player.y);
    if (dist < 70) d += (70 - dist) * 2;
  }
  return d;
}

function autopilot(state) {
  // Score against the target as it stands NOW: grabbing the diamond must not
  // look bad just because the next target (the exit) is far away.
  const [tx, ty] = targetOf(state);
  const hadDiamond = state.diamond.taken;
  const hadPaintings = state.paintings.filter((p) => p.taken).length;
  let best = DIRS[0];
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRS) {
    const sim = cloneState(state);
    const input = {
      up: dy < 0, down: dy > 0, left: dx < 0, right: dx > 0,
      walk: false, smoke: false, emp: false,
    };
    const steps = Math.round(LOOKAHEAD / STEP);
    for (let i = 0; i < steps; i += 1) step(sim, input, STEP);
    if (sim.status === STATUS_WON) return [dx, dy];
    const dist = Math.hypot(sim.player.x - tx, sim.player.y - ty);
    let score = -dist - danger(sim);
    if (sim.diamond.taken && !hadDiamond) score += 1000;
    score += (sim.paintings.filter((p) => p.taken).length - hadPaintings) * 200;
    if (score > bestScore) {
      bestScore = score;
      best = [dx, dy];
    }
  }
  return best;
}

/** Run the autopilot for `seconds` of game time and return the state. */
export function runAutopilot(seed, seconds) {
  const state = createWorld(seed);
  let held = [0, 0];
  let holdLeft = 0;
  const total = Math.round(seconds / STEP);
  for (let i = 0; i < total; i += 1) {
    if (state.status !== STATUS_PLAY) break;
    if (holdLeft <= 0) {
      held = autopilot(state);
      holdLeft = HOLD;
    }
    holdLeft -= STEP;
    const [dx, dy] = held;
    step(state, {
      up: dy < 0, down: dy > 0, left: dx < 0, right: dx > 0,
      walk: false, smoke: false, emp: false,
    }, STEP);
  }
  return state;
}

export function captureShot(shot, seed) {
  if (shot === 'start') {
    return { state: createWorld(seed), screen: SCREEN_TITLE };
  }
  if (shot === 'vault') {
    return { state: runAutopilot(seed, VAULT_SECONDS), screen: SCREEN_PLAY };
  }
  if (shot === 'end') {
    return { state: runAutopilot(seed, END_LIMIT_SECONDS), screen: SCREEN_OVER };
  }
  return { state: runAutopilot(seed, PLAY_SECONDS), screen: SCREEN_PLAY };
}
