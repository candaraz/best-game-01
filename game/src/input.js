// Keyboard and pointer input. Held keys give a steering direction; one-shot
// presses (jump, steal, give, confirm, pause, retry, mute) are queued as bit
// flags and taken once by the loop, so a press between two frames is never lost
// and never counted twice. The pointer steers transfers: left click steals,
// right click gives, and clicks also confirm menu choices.

export const ACT_JUMP = 1;
export const ACT_STEAL = 2;
export const ACT_GIVE = 4;
export const ACT_CONFIRM = 8;
export const ACT_PAUSE = 16;
export const ACT_RETRY = 32;
export const ACT_MUTE = 64;
export const ACT_LEFT = 128;
export const ACT_RIGHT = 256;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const JUMP = new Set(['Space', 'KeyW', 'ArrowUp']);
const STEAL = new Set(['KeyE']);
const GIVE = new Set(['KeyQ']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['Escape', 'KeyP']);
const RETRY = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  let left = false;
  let right = false;
  let jump = false;
  let actions = 0;
  let pointer = { x: 0, y: 0, inside: false };
  let clicked = null;
  let digit = -1;

  window.addEventListener('keydown', (event) => {
    if (/^Digit[1-9]$/.test(event.code) && !event.repeat) digit = Number(event.code.slice(5)) - 1;
    if (LEFT.has(event.code)) {
      left = true;
      if (!event.repeat) actions |= ACT_LEFT;
    } else if (RIGHT.has(event.code)) {
      right = true;
      if (!event.repeat) actions |= ACT_RIGHT;
    } else if (JUMP.has(event.code)) {
      jump = true;
      if (!event.repeat) actions |= ACT_JUMP;
    } else if (STEAL.has(event.code)) {
      if (!event.repeat) actions |= ACT_STEAL;
    } else if (GIVE.has(event.code)) {
      if (!event.repeat) actions |= ACT_GIVE;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACT_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACT_PAUSE;
    } else if (RETRY.has(event.code)) {
      if (!event.repeat) actions |= ACT_RETRY;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACT_MUTE;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (JUMP.has(event.code)) jump = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
    jump = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: ((event.clientX - rect.left) / rect.width) * 960,
      y: ((event.clientY - rect.top) / rect.height) * 600,
      inside: true,
    };
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.inside = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const at = {
      x: ((event.clientX - rect.left) / rect.width) * 960,
      y: ((event.clientY - rect.top) / rect.height) * 600,
    };
    if (event.button === 2) actions |= ACT_GIVE;
    else actions |= ACT_STEAL;
    clicked = at;
    event.preventDefault();
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** -1 for left, 1 for right, 0 for neither or both. */
    direction() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    /** True while the jump key is held (for variable jump height). */
    jumpHeld() {
      return jump;
    },
    /** The one-shot presses since the last call, as ACT_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The pointer position in logical coordinates. */
    pointer() {
      return pointer;
    },
    /** The last click position, once, or null. */
    takeClick() {
      const at = clicked;
      clicked = null;
      return at;
    },
    /** A pressed number key (0-based room index), once, or -1. */
    takeDigit() {
      const taken = digit;
      digit = -1;
      return taken;
    },
    /** Drive the input from a script (screenshot staging, autopilot). */
    drive(script) {
      left = !!script.left;
      right = !!script.right;
      jump = !!script.jump;
      actions |= script.actions || 0;
    },
  };
}
