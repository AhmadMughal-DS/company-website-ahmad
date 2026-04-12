/* ============================================================
   ANIMATIONS — animations.js
   Scroll-triggered reveals, counter animations, parallax
   ============================================================ */

class ScrollAnimations {
  constructor() {
    this.countersAnimated = false;
    this.init();
  }

  init() {
    this.initScrollReveal();
    this.initCounters();
    this.initParallax();
  }

  /* ── Scroll Reveal (Intersection Observer) ─────────────── */
  initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Don't unobserve — allow re-triggering if user scrolls up? No, keep it revealed.
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  /* ── Counter Animation ─────────────────────────────────── */
  initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = 'true';
            this.animateCounter(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;
    const start = performance.now();

    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.floor(easedProgress * target);

      el.textContent = prefix + current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = prefix + target.toLocaleString() + suffix;
      }
    };

    requestAnimationFrame(tick);
  }

  /* ── Subtle Parallax on mouse move ─────────────────────── */
  initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      const glowBlue = hero.querySelector('.hero__glow--blue');
      const glowPurple = hero.querySelector('.hero__glow--purple');

      if (glowBlue) {
        glowBlue.style.transform = `translate(${x * 30}px, ${y * 20}px)`;
      }
      if (glowPurple) {
        glowPurple.style.transform = `translate(${x * -20}px, ${y * -15}px)`;
      }
    });
  }
}

/* ── Active Nav Highlighting ───────────────────────────────── */
class ActiveNavHighlighter {
  constructor() {
    this.sections = document.querySelectorAll('section[id]');
    this.navLinks = document.querySelectorAll('.nav__link[href^="#"]');
    if (this.sections.length && this.navLinks.length) {
      this.init();
    }
  }

  init() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.setActive(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-80px 0px -50% 0px',
      }
    );

    this.sections.forEach((section) => observer.observe(section));
  }

  setActive(sectionId) {
    this.navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });
  }
}
