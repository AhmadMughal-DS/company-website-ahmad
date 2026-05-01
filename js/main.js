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

/* ── Form Handling — Real Backend API ────────────────────── */
function initFormHandling() {
  const form = document.getElementById('consultation-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn       = form.querySelector('#form-submit-btn');
    const btnSpan   = btn.querySelector('span');
    const formWrap  = form;
    const successEl = document.getElementById('form-success');

    // Collect form data
    const data = {
      name:    document.getElementById('form-name')?.value?.trim(),
      email:   document.getElementById('form-email')?.value?.trim(),
      company: document.getElementById('form-company')?.value?.trim(),
      phone:   document.getElementById('form-phone')?.value?.trim(),
      country: document.getElementById('form-country')?.value?.trim(),
      service: document.getElementById('form-service')?.value,
      message: document.getElementById('form-message')?.value?.trim()
    };

    if (!data.name || !data.email || !data.message) {
      showFormToast('Please fill in all required fields.', 'error');
      return;
    }

    // Loading state
    btn.disabled = true;
    btnSpan.textContent = 'Sending...';
    btn.style.opacity = '0.7';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Show success state
        form.style.display = 'none';
        if (successEl) {
          successEl.classList.add('show');
        }
        console.log('✅ Lead submitted successfully');
      } else {
        showFormToast(result.message || 'Something went wrong. Please try again.', 'error');
        btn.disabled = false;
        btnSpan.textContent = 'Send Message';
        btn.style.opacity = '';
      }
    } catch (err) {
      // Fallback: if backend is unreachable, show WhatsApp option
      console.warn('Backend unreachable, showing WhatsApp fallback');
      showFormToast('Connection issue. Please reach us via WhatsApp below! ⬇️', 'warning');
      btn.disabled = false;
      btnSpan.textContent = 'Send Message';
      btn.style.opacity = '';
    }
  });
}

/* ── Toast Notification ───────────────────────────────────── */
function showFormToast(message, type = 'info') {
  const existing = document.getElementById('form-toast');
  if (existing) existing.remove();

  const color = type === 'error' ? '#ff4757' : type === 'warning' ? '#f0a500' : '#00c896';

  const toast = document.createElement('div');
  toast.id = 'form-toast';
  toast.style.cssText = `
    position: fixed; bottom: 120px; right: 24px; z-index: 600;
    padding: 14px 20px; border-radius: 12px; max-width: 320px;
    background: rgba(7,13,26,0.98); border: 1px solid ${color};
    color: #f0ece0; font-size: 14px; line-height: 1.5;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
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
