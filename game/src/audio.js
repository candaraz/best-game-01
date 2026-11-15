// Synthesized sound: every effect is an oscillator + gain envelope through
// the Web Audio API, so the game ships no audio files and makes no network
// request. The context starts on the first user gesture; M toggles mute.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function tone({ freq = 440, to = null, dur = 0.12, type = 'sine', vol = 0.5, delay = 0 }) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise({ dur = 0.15, vol = 0.4, delay = 0, low = 1200 }) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    jump() { tone({ freq: 280, to: 520, dur: 0.14, type: 'triangle', vol: 0.35 }); },
    land() { noise({ dur: 0.07, vol: 0.22, low: 500 }); },
    steal() { tone({ freq: 880, to: 220, dur: 0.18, type: 'sine', vol: 0.4 }); noise({ dur: 0.12, vol: 0.15, low: 3000 }); },
    give() { tone({ freq: 220, to: 660, dur: 0.16, type: 'sine', vol: 0.4 }); },
    pop() { tone({ freq: 520, to: 1400, dur: 0.12, type: 'square', vol: 0.25 }); noise({ dur: 0.1, vol: 0.2, low: 4000 }); },
    fizzle() { noise({ dur: 0.35, vol: 0.3, low: 1800 }); tone({ freq: 320, to: 90, dur: 0.3, type: 'sawtooth', vol: 0.12 }); },
    orb() { tone({ freq: 1046, dur: 0.1, type: 'sine', vol: 0.35 }); tone({ freq: 1568, dur: 0.16, type: 'sine', vol: 0.3, delay: 0.07 }); },
    door() { tone({ freq: 140, to: 320, dur: 0.3, type: 'triangle', vol: 0.4 }); noise({ dur: 0.25, vol: 0.12, low: 900 }); },
    smash() { noise({ dur: 0.3, vol: 0.5, low: 700 }); tone({ freq: 90, to: 45, dur: 0.28, type: 'sine', vol: 0.5 }); },
    hurt() { tone({ freq: 300, to: 70, dur: 0.3, type: 'sawtooth', vol: 0.35 }); noise({ dur: 0.2, vol: 0.3, low: 1000 }); },
    click() { tone({ freq: 700, dur: 0.06, type: 'sine', vol: 0.25 }); },
    star(i) { tone({ freq: 660 + i * 220, dur: 0.18, type: 'sine', vol: 0.4, delay: i * 0.12 }); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.35, delay: i * 0.13 })); },
  };
}
