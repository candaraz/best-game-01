// Keyboard + mouse input: held state plus edge-triggered presses, so the
// simulation can tell "just pressed" from "held" without missing a tap that
// lands between fixed steps. Game keys never scroll the page.

const GAME_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ',
  'a', 'A', 'd', 'D', 'w', 'W', 'e', 'E', 'q', 'Q', 'r', 'R', 'm', 'M',
  'p', 'P', 'Escape', 'Enter',
]);

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mousePressed = false;
  let mouseButton = 0;
  let clickPos = { x: 0, y: 0 };

  function onKeyDown(e) {
    if (!GAME_KEYS.has(e.key)) return;
    e.preventDefault();
    const key = e.key.toLowerCase();
    if (!e.repeat) pressed.add(key);
    held.add(key);
  }

  function onKeyUp(e) {
    held.delete(e.key.toLowerCase());
  }

  function onMouseDown(e) {
    mousePressed = true;
    mouseButton = e.button;
    const rect = canvas.getBoundingClientRect();
    clickPos = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
    e.preventDefault();
  }

  function onContextMenu(e) {
    e.preventDefault(); // right click gives weight; never show the menu
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('contextmenu', onContextMenu);

  return {
    // Held-state queries, read every fixed step.
    get left() { return held.has('arrowleft') || held.has('a'); },
    get right() { return held.has('arrowright') || held.has('d'); },
    get jumpHeld() { return held.has(' ') || held.has('w') || held.has('arrowup'); },
    // Edge-triggered queries: true once, then consumed at the end of the step.
    wasPressed(key) { return pressed.has(key); },
    get jumpPressed() { return pressed.has(' ') || pressed.has('w') || pressed.has('arrowup'); },
    get stealPressed() { return pressed.has('e') || (mousePressed && mouseButton === 0); },
    get givePressed() { return pressed.has('q') || (mousePressed && mouseButton === 2); },
    get confirmPressed() { return pressed.has('enter') || mousePressed; },
    get retryPressed() { return pressed.has('r'); },
    get pausePressed() { return pressed.has('escape') || pressed.has('p'); },
    get mutePressed() { return pressed.has('m'); },
    get click() { return clickPos; },
    endStep() {
      pressed.clear();
      mousePressed = false;
    },
  };
}
