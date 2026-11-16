// Keyboard + mouse input: edge-triggered presses, held state, and a mouse
// position in canvas pixels. The game reads this, never the DOM directly.

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, left: false, right: false, leftPressed: false, rightPressed: false };

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    ArrowDown: 'down', KeyS: 'down',
    KeyE: 'steal', KeyQ: 'give',
    KeyP: 'pause', Escape: 'pause',
    KeyR: 'retry', KeyM: 'mute',
    Enter: 'confirm',
    Digit1: 'one', Digit2: 'two', Digit3: 'three',
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  });
  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (action) held.delete(action);
  });
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    if (event.button === 0) { mouse.left = true; mouse.leftPressed = true; }
    if (event.button === 2) { mouse.right = true; mouse.rightPressed = true; }
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouse.left = false;
    if (event.button === 2) mouse.right = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    held,
    mouse,
    isDown(action) { return held.has(action); },
    wasPressed(action) { return pressed.has(action); },
    axis() { return (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0); },
    endFrame() {
      pressed.clear();
      mouse.leftPressed = false;
      mouse.rightPressed = false;
    },
  };
}
