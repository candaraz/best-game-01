// Synthesized sound: every effect is built from oscillators and filtered noise,
// no audio files. The context is created lazily on the first user gesture (the
// browser's autoplay rule) and the ambient pad starts with it. M mutes.

import { MUTE_KEY } from './config.js';

let context = null;
let master = null;
let padNodes = null;
let muted = false;

try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

function ensure() {
  if (context) {
    if (context.state === 'suspended') context.resume();
    return true;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(context.destination);
    startPad();
    return true;
  } catch {
    return false;
  }
}

function tone({ freq, endFreq, dur, type = 'sine', gain = 0.2, delay = 0 }) {
  if (!ensure() || muted) return;
  const t0 = context.currentTime + delay;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur, gain = 0.2, filterFreq = 800, type = 'lowpass', delay = 0 }) {
  if (!ensure() || muted) return;
  const t0 = context.currentTime + delay;
  const length = Math.max(1, Math.floor(context.sampleRate * dur));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  const amp = context.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  source.connect(filter).connect(amp).connect(master);
  source.start(t0);
}

function startPad() {
  if (padNodes) return;
  const amp = context.createGain();
  amp.gain.value = 0.035;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const oscA = context.createOscillator();
  oscA.type = 'sine';
  oscA.frequency.value = 110;
  const oscB = context.createOscillator();
  oscB.type = 'sine';
  oscB.frequency.value = 164.8;
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoAmp = context.createGain();
  lfoAmp.gain.value = 0.015;
  lfo.connect(lfoAmp).connect(amp.gain);
  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(amp).connect(master);
  oscA.start();
  oscB.start();
  lfo.start();
  padNodes = { oscA, oscB, lfo };
}

export const sfx = {
  unlock() {
    ensure();
  },
  isMuted() {
    return muted;
  },
  toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* storage unavailable: mute still applies this visit */
    }
    if (master) master.gain.value = muted ? 0 : 0.5;
    return muted;
  },
  jump() {
    tone({ freq: 280, endFreq: 520, dur: 0.12, type: 'triangle', gain: 0.12 });
  },
  land(hard) {
    if (hard) {
      tone({ freq: 120, endFreq: 55, dur: 0.14, type: 'sine', gain: 0.22 });
      noise({ dur: 0.1, gain: 0.1, filterFreq: 500 });
    } else {
      tone({ freq: 160, endFreq: 90, dur: 0.07, type: 'sine', gain: 0.07 });
    }
  },
  steal() {
    tone({ freq: 520, endFreq: 1040, dur: 0.16, type: 'sine', gain: 0.16 });
    tone({ freq: 780, endFreq: 1560, dur: 0.14, type: 'sine', gain: 0.1, delay: 0.05 });
  },
  give() {
    tone({ freq: 420, endFreq: 180, dur: 0.16, type: 'triangle', gain: 0.16 });
    tone({ freq: 210, endFreq: 110, dur: 0.14, type: 'sine', gain: 0.12, delay: 0.04 });
  },
  denied() {
    tone({ freq: 160, endFreq: 120, dur: 0.09, type: 'square', gain: 0.06 });
  },
  orb() {
    tone({ freq: 880, dur: 0.1, type: 'sine', gain: 0.14 });
    tone({ freq: 1320, dur: 0.14, type: 'sine', gain: 0.12, delay: 0.06 });
  },
  pop() {
    noise({ dur: 0.16, gain: 0.2, filterFreq: 1800, type: 'bandpass' });
    tone({ freq: 340, endFreq: 60, dur: 0.18, type: 'square', gain: 0.12 });
  },
  fizzle() {
    noise({ dur: 0.3, gain: 0.14, filterFreq: 3200, type: 'highpass' });
    tone({ freq: 900, endFreq: 300, dur: 0.22, type: 'sine', gain: 0.08 });
  },
  smash() {
    tone({ freq: 90, endFreq: 38, dur: 0.3, type: 'sine', gain: 0.3 });
    noise({ dur: 0.24, gain: 0.24, filterFreq: 700 });
  },
  hurt() {
    tone({ freq: 220, endFreq: 90, dur: 0.22, type: 'sawtooth', gain: 0.14 });
  },
  switchOn() {
    tone({ freq: 440, dur: 0.1, type: 'triangle', gain: 0.14 });
    tone({ freq: 660, dur: 0.16, type: 'triangle', gain: 0.14, delay: 0.08 });
  },
  door() {
    [523, 659, 784, 1047].forEach((freq, i) =>
      tone({ freq, dur: 0.16, type: 'triangle', gain: 0.13, delay: i * 0.07 }),
    );
  },
  clear() {
    [392, 523, 659, 784].forEach((freq, i) =>
      tone({ freq, dur: 0.2, type: 'triangle', gain: 0.14, delay: i * 0.09 }),
    );
  },
  win() {
    [523, 587, 659, 784, 880, 1047, 1319].forEach((freq, i) =>
      tone({ freq, dur: 0.26, type: 'triangle', gain: 0.13, delay: i * 0.11 }),
    );
  },
  click() {
    tone({ freq: 700, dur: 0.05, type: 'sine', gain: 0.08 });
  },
  star() {
    tone({ freq: 1047, dur: 0.12, type: 'sine', gain: 0.15 });
    tone({ freq: 1568, dur: 0.2, type: 'sine', gain: 0.13, delay: 0.07 });
  },
};
