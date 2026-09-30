/* ============================================================
   PARTICLES — particles.js
   Canvas-based abstract constellation background for hero
   Gold × Cyan × Sapphire Blue Micro-Constellation
   ============================================================ */

class ParticleConstellation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 160 };
    this.animationId = null;
    this.particleCount = 70;
    this.connectionDistance = 120;
    this.maxSpeed = 0.35;

    this.colors = [
      'rgba(212, 175, 55, ',    // Sovereign Gold
      'rgba(56, 189, 248, ',    // Cyber Cyan
      'rgba(37, 99, 235, ',     // Sapphire Blue
      'rgba(16, 185, 129, ',    // Emerald Mint
    ];

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Adjust particle count for mobile
    if (window.innerWidth < 768) {
      this.particleCount = 35;
      this.connectionDistance = 75;
    } else if (window.innerWidth < 1200) {
      this.particleCount = 55;
      this.connectionDistance = 100;
    } else {
      this.particleCount = 75;
      this.connectionDistance = 125;
    }
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.maxSpeed,
        vy: (Math.random() - 0.5) * this.maxSpeed,
        radius: Math.random() * 2 + 0.6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        opacity: Math.random() * 0.45 + 0.25,
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    if (this.canvas.parentElement) {
      this.canvas.parentElement.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.parentElement.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Mouse push
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.vx += (dx / dist) * force * 0.025;
          p.vy += (dy / dist) * force * 0.025;
        }
      }

      // Damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + p.opacity + ')';
      this.ctx.fill();

      // Connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDistance) {
          const opacity = (1 - dist / this.connectionDistance) * 0.16;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.stroke();
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
