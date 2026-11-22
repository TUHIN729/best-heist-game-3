// Keyboard input: arrows/WASD to move, Shift to walk slow, E smoke, Q EMP,
// Enter to start, R to restart. Edge-triggered actions are consumed once.
export function createInput() {
  const input = {
    up: false, down: false, left: false, right: false,
    walk: false, smoke: false, emp: false, enter: false, restart: false,
  };
  const down = new Set();
  function key(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') input.up = true;
    else if (k === 'arrowdown' || k === 's') input.down = true;
    else if (k === 'arrowleft' || k === 'a') input.left = true;
    else if (k === 'arrowright' || k === 'd') input.right = true;
    else if (k === 'shift') input.walk = true;
    else if (k === 'e' && !down.has('e')) input.smoke = true;
    else if (k === 'q' && !down.has('q')) input.emp = true;
    else if (k === 'enter' && !down.has('enter')) input.enter = true;
    else if (k === 'r' && !down.has('r')) input.restart = true;
    down.add(k);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  }
  function keyup(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') input.up = false;
    else if (k === 'arrowdown' || k === 's') input.down = false;
    else if (k === 'arrowleft' || k === 'a') input.left = false;
    else if (k === 'arrowright' || k === 'd') input.right = false;
    else if (k === 'shift') input.walk = false;
    down.delete(k);
  }
  window.addEventListener('keydown', key);
  window.addEventListener('keyup', keyup);
  return input;
}

/** Clear the one-shot flags after a step has consumed them. */
export function consumeEdges(input) {
  input.smoke = false;
  input.emp = false;
  input.enter = false;
  input.restart = false;
}
