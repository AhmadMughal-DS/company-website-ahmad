/* ============================================================
   MAIN — main.js
   Application initialization, navigation, form handling & live console
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
  initLiveConsoleStream();
});

/* ── Navigation Scroll Behavior ──────────────────────────── */
function initNavigation() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
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

  const mobileLinks = mobileMenu.querySelectorAll('.nav__link, .btn');
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

      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      badges.forEach((badge) => {
        const category = badge.dataset.category || '';
        if (filter === 'all' || category.includes(filter)) {
          badge.style.display = 'flex';
          setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transform = 'translateY(0) scale(1)';
          }, 10);
        } else {
          badge.style.opacity = '0';
          badge.style.transform = 'scale(0.85)';
          setTimeout(() => {
            badge.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

/* ── Live Hero Operations Console Dynamic Event Stream ───── */
function initLiveConsoleStream() {
  const stream = document.querySelector('.console-stream');
  if (!stream) return;

  const mockEvents = [
    { tag: '[RAG-ENGINE]', msg: 'LegalHub vector indexing: 48,000 chunks synced', color: 'var(--cyan)' },
    { tag: '[KUBERNETES]', msg: 'me-central-1: node affinity rebalanced (0ms lag)', color: 'var(--emerald)' },
    { tag: '[SECURITY]', msg: 'Zero-Trust mTLS token verified: AES-256-GCM', color: 'var(--gold)' },
    { tag: '[FINOPS]', msg: 'Cloud auto-scaler reduced idle instances by 38%', color: 'var(--emerald)' },
    { tag: '[NETWORK]', msg: 'Dubai edge CDN cache hit ratio: 99.2%', color: 'var(--cyan)' },
    { tag: '[LLM-ROUTER]', msg: 'Model fallback to Claude-3.5-Sonnet: 142ms latency', color: 'var(--gold)' }
  ];

  let eventIdx = 0;

  setInterval(() => {
    const lines = stream.querySelectorAll('.console-stream__line');
    if (lines.length >= 4) {
      lines[0].remove();
    }

    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const ev = mockEvents[eventIdx % mockEvents.length];
    eventIdx++;

    const newLine = document.createElement('div');
    newLine.className = 'console-stream__line';
    newLine.innerHTML = `
      <span class="time">${timeStr}</span>
      <span class="tag" style="color:${ev.color}">${ev.tag}</span>
      <span>${ev.msg}</span>
    `;
    stream.appendChild(newLine);
  }, 4000);
}

/* ── Form Handling — Real Backend API ────────────────────── */
function initFormHandling() {
  const form = document.getElementById('consultation-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn       = form.querySelector('#form-submit-btn');
    const btnSpan   = btn.querySelector('span');
    const successEl = document.getElementById('form-success');

    const data = {
      name:    document.getElementById('form-name')?.value?.trim(),
      email:   document.getElementById('form-email')?.value?.trim(),
      company: document.getElementById('form-company')?.value?.trim() || 'N/A',
      service: document.getElementById('form-service')?.value || 'General Consultation',
      message: document.getElementById('form-message')?.value?.trim()
    };

    if (!data.name || !data.email || !data.message) {
      showFormToast('Please fill in all required fields.', 'error');
      return;
    }

    // Loading state
    btn.disabled = true;
    btnSpan.textContent = 'Transmitting Discovery Request...';
    btn.style.opacity = '0.7';

    // Local host dynamic routing
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isLocal && window.location.port !== '3001' 
      ? `http://localhost:3001/ahmadcompany/contact` 
      : '/ahmadcompany/contact';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        form.style.display = 'none';
        if (successEl) {
          successEl.style.display = 'block';
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        showFormToast(result.message || 'Error sending request. Please reach us via WhatsApp.', 'error');
        btn.disabled = false;
        btnSpan.textContent = 'Submit Technical Discovery Request';
        btn.style.opacity = '';
      }
    } catch (err) {
      console.warn('Backend unreachable, providing WhatsApp fallback');
      showFormToast('Connecting to WhatsApp direct line for instant response...', 'warning');
      btn.disabled = false;
      btnSpan.textContent = 'Submit Technical Discovery Request';
      btn.style.opacity = '';
      window.open('https://wa.me/923226510517', '_blank');
    }
  });
}

/* ── Toast Notification ───────────────────────────────────── */
function showFormToast(message, type = 'info') {
  const existing = document.getElementById('form-toast');
  if (existing) existing.remove();

  const color = type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#10B981';

  const toast = document.createElement('div');
  toast.id = 'form-toast';
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 14px 20px; border-radius: 12px; max-width: 360px;
    background: rgba(5,8,17,0.95); border: 1px solid ${color};
    color: #F8FAFC; font-size: 14px; line-height: 1.5;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6); backdrop-filter: blur(16px);
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
