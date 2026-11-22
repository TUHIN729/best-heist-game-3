// The Midnight Gala — game loop. Title screen, play, win/lose, restart.
// ?shot=start|play|vault|end renders a fixed scene for screenshots.
import { FIELD, STEP } from './config.js';
import { createWorld, step, STATUS_PLAY, STATUS_WON, STATUS_LOST } from './world.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { createInput, consumeEdges } from './input.js';
import { captureShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const statusEl = document.getElementById('status');

if (shot) {
  // Screenshot mode: render one fixed scene, no input loop.
  const { state, screen } = captureShot(shot, seed);
  render(ctx, state, screen);
  statusEl.textContent = `Screenshot scene: ${shot}.`;
} else {
  const input = createInput();
  let state = createWorld(seed);
  let screen = SCREEN_TITLE;
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_TITLE) {
      if (input.enter) {
        screen = SCREEN_PLAY;
        statusEl.textContent = 'Playing. Steal the Star of Meridian and reach the exit.';
      }
      render(ctx, state, SCREEN_TITLE);
    } else if (screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) {
        step(state, input, STEP);
        consumeEdges(input);
        acc -= STEP;
        if (state.status !== STATUS_PLAY) break;
      }
      render(ctx, state, SCREEN_PLAY);
      if (state.status === STATUS_WON) {
        screen = SCREEN_OVER;
        statusEl.textContent = 'You escaped with the loot!';
      } else if (state.status === STATUS_LOST) {
        screen = SCREEN_OVER;
        statusEl.textContent = `Caught. ${state.reason}`;
      }
    } else {
      if (input.restart) {
        state = createWorld(seed);
        screen = SCREEN_TITLE;
        statusEl.textContent = 'The Midnight Gala. Press Enter to begin.';
      }
      render(ctx, state, SCREEN_OVER);
    }
    requestAnimationFrame(frame);
  }
  statusEl.textContent = 'The Midnight Gala. Press Enter to begin.';
  requestAnimationFrame(frame);
}
