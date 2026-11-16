// Synthesized sound: every effect is a small WebAudio recipe, no assets.
// The context starts lazily on the first user gesture; every call is
// guarded so a missing or blocked AudioContext never breaks the game.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freqA, freqB, dur, type, vol, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c || !master) return;
    try {
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqA, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqB), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch { /* sound is decoration; never fail the game */ }
  }

  function noise(dur, vol, lowpass, delay = 0) {
    if (muted) return;
    const c = ensure();
    if (!c || !master) return;
    try {
      const t0 = c.currentTime + delay;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buffer;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = c.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start(t0);
    } catch { /* sound is decoration; never fail the game */ }
  }

  return {
    unlock() { ensure(); },
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
    jump() { tone(280, 520, 0.12, 'sine', 0.22); },
    land() { tone(140, 70, 0.08, 'triangle', 0.25); noise(0.06, 0.12, 500); },
    hardLand() { tone(110, 50, 0.14, 'triangle', 0.4); noise(0.1, 0.22, 400); },
    steal() { tone(520, 980, 0.14, 'sawtooth', 0.14); tone(780, 1560, 0.12, 'sine', 0.12, 0.03); },
    give() { tone(880, 420, 0.14, 'sawtooth', 0.14); tone(620, 310, 0.12, 'sine', 0.12, 0.03); },
    pop() { noise(0.12, 0.3, 2400); tone(600, 180, 0.12, 'square', 0.16); },
    smash() { tone(90, 38, 0.22, 'triangle', 0.5); noise(0.18, 0.3, 320); },
    explosion() { noise(0.35, 0.4, 900); tone(160, 40, 0.3, 'sawtooth', 0.25); },
    orb() { tone(880, 880, 0.07, 'sine', 0.2); tone(1320, 1320, 0.1, 'sine', 0.2, 0.06); },
    disarm() { tone(700, 990, 0.1, 'sine', 0.18); tone(990, 700, 0.12, 'sine', 0.14, 0.08); },
    gate() { tone(180, 320, 0.25, 'triangle', 0.25); noise(0.2, 0.1, 700, 0.05); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.14, 'triangle', 0.22, i * 0.09)); },
    victory() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.22, i * 0.11)); },
    fail() { [330, 262, 196, 147].forEach((f, i) => tone(f, f * 0.9, 0.16, 'sawtooth', 0.12, i * 0.12)); },
    hurt() { tone(220, 90, 0.18, 'sawtooth', 0.25); noise(0.1, 0.2, 800); },
    ui() { tone(660, 660, 0.05, 'sine', 0.14); },
    seal() { [523, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'sine', 0.2, i * 0.07)); },
    tick() { tone(980, 980, 0.04, 'square', 0.08); },
    beep() { tone(1240, 1240, 0.05, 'square', 0.06); },
  };
}
