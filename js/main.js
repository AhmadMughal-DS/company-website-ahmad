/* ============================================================
   MAIN — main.js
   Application initialization, navigation, form handling
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Initialize Systems ────────────────────────────────────
  new ParticleConstellation('particles-canvas');
  new ScrollAnimations();
  new ActiveNavHighlighter();
  initNavigation();
  initMobileMenu();
  initTechFilter();
  initFormHandling();
  initSmoothScroll();
});

/* ── Navigation Scroll Behavior ──────────────────────────── */
function initNavigation() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ── Mobile Menu ─────────────────────────────────────────── */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('nav-overlay');

  if (!menuBtn || !mobileMenu) return;

  function openMenu() {
    menuBtn.classList.add('active');
    mobileMenu.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuBtn.classList.remove('active');
    mobileMenu.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Close menu when a link is clicked
  const mobileLinks = mobileMenu.querySelectorAll('.nav__link');
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

/* ── Tech Stack Filter Tabs ──────────────────────────────── */
function initTechFilter() {
  const tabs = document.querySelectorAll('.tab-filter');
  const badges = document.querySelectorAll('.tech-badge');

  if (tabs.length === 0 || badges.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter badges
      badges.forEach((badge) => {
        const category = badge.dataset.category;
        if (filter === 'all' || category === filter) {
          badge.style.display = '';
          badge.style.opacity = '1';
          badge.style.transform = 'scale(1)';
        } else {
          badge.style.opacity = '0';
          badge.style.transform = 'scale(0.8)';
          setTimeout(() => {
            if (!badge.dataset.category.includes(filter) && filter !== 'all') {
              badge.style.display = 'none';
            }
          }, 300);
        }
      });
    });
  });
}

/* ── Form Handling ───────────────────────────────────────── */
function initFormHandling() {
  const form = document.getElementById('consultation-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn--primary');
    const originalText = btn.innerHTML;

    // Simulate submission
    btn.innerHTML = `
      <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Message Sent!
    `;
    btn.style.background = 'var(--success)';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
}

/* ── Smooth Scroll for Anchor Links ──────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
