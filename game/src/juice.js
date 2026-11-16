// The juice layer: particles, floating text, screen shake and hit-stop. None of
// it touches the simulation — it only reads events the world reports and draws
// over them, so the rules stay deterministic while the feedback stays loud.
// Every effect scales with the importance of what caused it.

export function createJuice() {
  const particles = [];
  const texts = [];
  const beams = [];
  const flashes = [];
  const rings = [];
  const decals = [];
  // Trauma shake (Eiserloh's model, via the Vlambeer/GDC canon): trauma in
  // [0,1] stacks on impacts, drains linearly, and the visible offset is
  // trauma squared — small hits barely move, big hits punch. The offset is
  // smooth sine noise on a clock, not per-frame randomness.
  let trauma = 0;
  let traumaDecay = 4;
  let shakeClock = 0;
  let hitStop = 0;

  function burst(x, y, { count, colour, speed, life, size, gravity = 900, spread = Math.PI * 2, dir = -Math.PI / 2 }) {
    for (let i = 0; i < count; i += 1) {
      const angle = dir + (Math.random() - 0.5) * spread;
      const v = speed * (0.4 + Math.random() * 0.8);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        life: life * (0.6 + Math.random() * 0.7),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        colour,
        gravity,
      });
    }
  }

  return {
    /** A burst of dust at the feet on landing; bigger when the fall was bigger. */
    landDust(x, y, hard) {
      burst(x, y, {
        count: hard ? 16 : 6,
        colour: '#c9c2a8',
        speed: hard ? 190 : 90,
        life: 0.45,
        size: hard ? 4 : 3,
        gravity: 500,
        spread: Math.PI,
        dir: -Math.PI / 2,
      });
    },
    /** The flowing stream of a weight transfer, from donor to receiver. */
    transfer(fromX, fromY, toX, toY, colour) {
      beams.push({ fromX, fromY, toX, toY, colour, life: 0.35, maxLife: 0.35 });
      for (let i = 0; i < 14; i += 1) {
        const t = i / 14;
        particles.push({
          x: fromX + (toX - fromX) * t,
          y: fromY + (toY - fromY) * t,
          vx: (toX - fromX) * 2.2 + (Math.random() - 0.5) * 60,
          vy: (toY - fromY) * 2.2 + (Math.random() - 0.5) * 60,
          life: 0.32,
          maxLife: 0.32,
          size: 3.5,
          colour,
          gravity: 0,
        });
      }
    },
    orbSparkle(x, y) {
      burst(x, y, { count: 12, colour: '#ffd76a', speed: 130, life: 0.5, size: 3, gravity: 200 });
    },
    golemPop(x, y) {
      burst(x, y, { count: 26, colour: '#8b93bd', speed: 260, life: 0.6, size: 5, gravity: 700 });
      burst(x, y, { count: 10, colour: '#ffd76a', speed: 180, life: 0.5, size: 3, gravity: 400 });
    },
    mineFizzle(x, y) {
      burst(x, y, { count: 18, colour: '#9fe8ff', speed: 120, life: 0.7, size: 3, gravity: -160 });
    },
    smashDebris(x, y) {
      burst(x, y, { count: 30, colour: '#8a6a52', speed: 300, life: 0.7, size: 6, gravity: 1100 });
      burst(x, y, { count: 12, colour: '#c99a6b', speed: 220, life: 0.6, size: 4, gravity: 900 });
    },
    hurtBurst(x, y) {
      burst(x, y, { count: 14, colour: '#ff6b5e', speed: 200, life: 0.5, size: 4, gravity: 600 });
    },
    doorGlow(x, y) {
      burst(x, y, { count: 20, colour: '#57e6a8', speed: 90, life: 0.9, size: 3, gravity: -120 });
    },
    /** A 100ms white flash at the contact point: the first frame of feedback. */
    flash(x, y, colour, radius = 34) {
      flashes.push({ x, y, colour, radius, life: 0.1, maxLife: 0.1 });
    },
    /** An expanding shockwave ring for pops, smashes and explosions. */
    ring(x, y, colour, maxR = 56) {
      rings.push({ x, y, colour, maxR, life: 0.35, maxLife: 0.35 });
    },
    /** Permanence (Nijman): what happened leaves residue until the room ends. */
    decal(x, y, kind) {
      const stones = [];
      for (let i = 0; i < 5; i += 1) {
        stones.push({ dx: (Math.random() - 0.5) * 30, dy: (Math.random() - 0.5) * 10, r: 2 + Math.random() * 3 });
      }
      decals.push({ x, y, kind, stones });
    },
    /** Dust kicked up while a crate or boulder is actually moving. */
    pushDust(x, y, dir) {
      burst(x, y, {
        count: 3,
        colour: '#c9c2a8',
        speed: 50,
        life: 0.35,
        size: 2.5,
        gravity: 300,
        spread: Math.PI / 2,
        dir: dir > 0 ? Math.PI : 0,
      });
    },
    /** Wind streaks inside a gale zone, spawned every frame by the renderer. */
    windStreak(x, y, dx, colour) {
      particles.push({
        x,
        y,
        vx: dx * 520,
        vy: (Math.random() - 0.5) * 30,
        life: 0.3,
        maxLife: 0.3,
        size: 2,
        colour,
        gravity: 0,
        streak: true,
      });
    },
    /** A rising spark inside an updraft. */
    updraftMote(x, y) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 24,
        vy: -140 - Math.random() * 60,
        life: 0.7,
        maxLife: 0.7,
        size: 2.5,
        colour: '#ffd76a',
        gravity: 0,
      });
    },
    ambientMote(x, y) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: -8 - Math.random() * 10,
        life: 2.4,
        maxLife: 2.4,
        size: 1.8,
        colour: '#8f97c4',
        gravity: 0,
      });
    },
    /** Floating combat-style text: score, steals, combo calls. */
    floatText(x, y, text, colour, size = 20) {
      texts.push({ x, y, text, colour, size, life: 0.95, maxLife: 0.95 });
    },
    /** Screen shake scaled to the impact. Strength is peak pixels (0-10);
     *  duration sets how fast the trauma drains. Short: 0.1 to 0.3 seconds. */
    shake(strength, duration) {
      trauma = Math.min(1, Math.max(trauma, strength / 10));
      traumaDecay = 1 / Math.max(0.05, duration);
    },
    /** Freeze the world for a few frames on the heaviest hits. */
    freeze(seconds) {
      hitStop = Math.max(hitStop, seconds);
    },
    /** Seconds of hit-stop left; the loop skips world steps while it lasts. */
    hitStopLeft() {
      return hitStop;
    },
    tickHitStop(dt) {
      hitStop = Math.max(0, hitStop - dt);
    },
    /** The current camera offset from shake: trauma squared, sine noise. */
    shakeOffset() {
      if (trauma <= 0) return { x: 0, y: 0 };
      const amp = 10 * trauma * trauma;
      const t = shakeClock;
      return {
        x: amp * (Math.sin(t * 91.7) * 0.6 + Math.sin(t * 47.3 + 1.7) * 0.4),
        y: amp * (Math.sin(t * 83.1 + 0.6) * 0.6 + Math.sin(t * 53.9 + 2.9) * 0.4),
      };
    },
    update(dt) {
      trauma = Math.max(0, trauma - traumaDecay * dt);
      shakeClock += dt;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (let i = texts.length - 1; i >= 0; i -= 1) {
        const t = texts[i];
        t.life -= dt;
        t.y -= 42 * dt;
        if (t.life <= 0) texts.splice(i, 1);
      }
      for (let i = beams.length - 1; i >= 0; i -= 1) {
        beams[i].life -= dt;
        if (beams[i].life <= 0) beams.splice(i, 1);
      }
      for (let i = flashes.length - 1; i >= 0; i -= 1) {
        flashes[i].life -= dt;
        if (flashes[i].life <= 0) flashes.splice(i, 1);
      }
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        rings[i].life -= dt;
        if (rings[i].life <= 0) rings.splice(i, 1);
      }
    },
    draw(ctx) {
      for (const d of decals) {
        if (d.kind === 'scorch') {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#14172c';
          ctx.beginPath();
          ctx.ellipse(d.x, d.y + 12, 20, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          for (const s of d.stones) {
            ctx.fillStyle = '#8a6a52';
            ctx.beginPath();
            ctx.arc(d.x + s.dx, d.y + s.dy + 14, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      for (const b of beams) {
        const a = b.life / b.maxLife;
        const mx = (b.fromX + b.toX) / 2 + Math.sin(b.life * 40) * 8;
        const my = (b.fromY + b.toY) / 2 - 14;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = b.colour;
        ctx.lineWidth = 7;
        ctx.shadowColor = b.colour;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.quadraticCurveTo(mx, my, b.toX, b.toY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff8e0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.quadraticCurveTo(mx, my, b.toX, b.toY);
        ctx.stroke();
        ctx.restore();
      }
      for (const f of flashes) {
        const a = f.life / f.maxLife;
        ctx.save();
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = f.colour;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * (1.15 - 0.15 * a), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const r of rings) {
        const progress = 1 - r.life / r.maxLife;
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.8;
        ctx.strokeStyle = r.colour;
        ctx.lineWidth = 3 * (1 - progress) + 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 8 + (r.maxR - 8) * progress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      for (const p of particles) {
        const a = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = p.colour;
        if (p.streak) {
          ctx.fillRect(p.x - 14, p.y - 1, 28, 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * a), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      for (const t of texts) {
        const a = Math.min(1, (t.life / t.maxLife) * 2);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `bold ${t.size}px ${'system-ui, sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(10, 12, 24, 0.85)';
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.colour;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }
    },
    clear() {
      particles.length = 0;
      texts.length = 0;
      beams.length = 0;
      flashes.length = 0;
      rings.length = 0;
      decals.length = 0;
      trauma = 0;
      hitStop = 0;
    },
  };
}
