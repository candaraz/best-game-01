// Juice: a pooled particle system, floating score text, trauma-based screen
// shake (offset = max x trauma^2 x noise, decaying quadratically) and
// hit-stop freezes. Every player action gets several layered responses.

export function createJuice() {
  const particles = [];
  const texts = [];
  let trauma = 0;
  let hitStop = 0;
  let time = 0;

  function burst(x, y, { count = 12, color = '#ffd75e', speed = 160, size = 3, life = 0.6, gravity = 300, glow = false }) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.9);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - speed * 0.25,
        life: life * (0.6 + Math.random() * 0.7),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color, gravity, glow,
      });
    }
  }

  function ring(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      particles.push({
        x, y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190,
        life: 0.35, maxLife: 0.35, size: 3, color, gravity: 0, glow: true,
      });
    }
  }

  function floatText(x, y, text, color = '#f4f1de') {
    texts.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
  }

  function shake(amount) {
    trauma = Math.min(1, trauma + amount);
  }

  function freeze(seconds) {
    hitStop = Math.max(hitStop, seconds);
  }

  function update(dt) {
    time += dt;
    trauma = Math.max(0, trauma - dt * 1.6);
    if (hitStop > 0) hitStop -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life -= dt;
      t.y -= 34 * dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
  }

  function offset() {
    if (trauma <= 0) return { x: 0, y: 0 };
    const mag = 9 * trauma * trauma;
    return {
      x: mag * (Math.sin(time * 91.7) * 0.6 + Math.sin(time * 47.3) * 0.4),
      y: mag * (Math.cos(time * 83.1) * 0.6 + Math.cos(time * 53.9) * 0.4),
    };
  }

  function draw(ctx) {
    for (const p of particles) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      if (p.glow) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + a), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  return {
    burst, ring, floatText, shake, freeze, update, offset, draw,
    get frozen() { return hitStop > 0; },
    get count() { return particles.length; },
  };
}
