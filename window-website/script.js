'use strict';

/* ── Utilities ──────────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Year ───────────────────────────────────────────────────────────────────── */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Scroll progress bar ────────────────────────────────────────────────────── */
const progressBar = $('.scroll-progress');
function updateProgress() {
  if (!progressBar) return;
  const scrolled = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
}

/* ── Nav scroll state ───────────────────────────────────────────────────────── */
const nav = $('.nav');
function updateNav() {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 40);
}
updateNav();

/* ── Back to top ────────────────────────────────────────────────────────────── */
const btt = $('#back-to-top');
function updateBtt() {
  if (!btt) return;
  if (window.scrollY > 600) {
    btt.removeAttribute('hidden');
  } else {
    btt.setAttribute('hidden', '');
  }
}
updateBtt();

btt?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
});

/* ── Consolidated scroll handler ────────────────────────────────────────────── */
let rafScheduled = false;
window.addEventListener('scroll', () => {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    updateNav();
    updateProgress();
    updateBtt();
    updateActiveNav();
    rafScheduled = false;
  });
}, { passive: true });

/* ── Active nav links ───────────────────────────────────────────────────────── */
const sections = $$('section[id], div[id]').filter(el => el.id);
const navLinks = $$('[data-nav-link]');

function updateActiveNav() {
  if (!navLinks.length || !sections.length) return;
  const navH = nav ? nav.offsetHeight : 72;
  const threshold = navH + 80;
  let current = '';

  sections.forEach(section => {
    const top = section.getBoundingClientRect().top;
    if (top <= threshold) current = section.id;
  });

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const matches = href === '#' + current;
    link.setAttribute('aria-current', matches ? 'page' : 'false');
    if (link.getAttribute('aria-current') === 'false') {
      link.removeAttribute('aria-current');
    }
  });
}
updateActiveNav();

/* ── Mobile menu ────────────────────────────────────────────────────────────── */
const hamburger      = $('.nav__hamburger');
const mobileMenu     = $('#mobile-menu');
const backdrop       = $('#menu-backdrop');
const closeBtn       = $('.mobile-menu__close');
const mobileNavLinks = $$('.mobile-menu nav a, .mobile-menu__footer a');

let lastFocusedBeforeMenu = null;

function getFocusableElements(container) {
  return $$(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    container
  ).filter(el => !el.closest('[hidden]'));
}

function openMenu() {
  if (!mobileMenu) return;
  lastFocusedBeforeMenu = document.activeElement;
  mobileMenu.setAttribute('aria-hidden', 'false');
  hamburger?.setAttribute('aria-expanded', 'true');
  hamburger?.setAttribute('aria-label', 'Close navigation menu');
  backdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Animate hamburger
  const spans = $$('span', hamburger);
  if (spans.length === 3 && !prefersReducedMotion()) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  }

  // Focus first item after transition
  setTimeout(() => {
    const focusable = getFocusableElements(mobileMenu);
    focusable[0]?.focus();
  }, 50);
}

function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.setAttribute('aria-hidden', 'true');
  hamburger?.setAttribute('aria-expanded', 'false');
  hamburger?.setAttribute('aria-label', 'Open navigation menu');
  backdrop?.classList.remove('active');
  document.body.style.overflow = '';

  const spans = $$('span', hamburger);
  if (spans.length === 3) {
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }

  // Return focus
  setTimeout(() => {
    lastFocusedBeforeMenu?.focus();
  }, 50);
}

function isMenuOpen() {
  return mobileMenu?.getAttribute('aria-hidden') === 'false';
}

hamburger?.addEventListener('click', () => isMenuOpen() ? closeMenu() : openMenu());
closeBtn?.addEventListener('click', closeMenu);
backdrop?.addEventListener('click', closeMenu);
mobileNavLinks.forEach(link => link.addEventListener('click', closeMenu));

// Keyboard: Escape + focus trap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen()) {
    closeMenu();
    return;
  }
  // Focus trap
  if (e.key === 'Tab' && isMenuOpen() && mobileMenu) {
    const focusable = getFocusableElements(mobileMenu);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* ── Smooth anchor scrolling ────────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  if (!id) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    return;
  }
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const navH = nav ? nav.offsetHeight : 72;
  const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  // Update URL without triggering scroll
  history.pushState(null, '', '#' + id);

  // Move focus for accessibility
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
});

/* ── Scroll reveal ──────────────────────────────────────────────────────────── */
function initReveal() {
  if (prefersReducedMotion()) return;

  const revealConfigs = [
    { sel: '.section__header',       stagger: false },
    { sel: '.service-card',          stagger: true  },
    { sel: '.portfolio-item',        stagger: true  },
    { sel: '.process__step',         stagger: true  },
    { sel: '.testimonial-card',      stagger: true  },
    { sel: '.faq__item',             stagger: false },
    { sel: '.credentials__stat',     stagger: true  },
    { sel: '.whyus__pillar',         stagger: true  },
    { sel: '.whyus__proof-item',     stagger: true  },
    { sel: '.whyus__content',        stagger: false },
    { sel: '.whyus__illustration',   stagger: false },
    { sel: '.hero__content',         stagger: false },
    { sel: '.finalcta__headline',    stagger: false },
    { sel: '.finalcta__sub',         stagger: false, delay: 1 },
    { sel: '.finalcta__reassurance', stagger: false, delay: 2 },
    { sel: '.contact-form',          stagger: false, delay: 2 },
    { sel: '.finalcta__phone',       stagger: false, delay: 3 },
    { sel: '.finalcta__area',        stagger: false, delay: 4 },
  ];

  revealConfigs.forEach(({ sel, stagger, delay = 0 }) => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      const d = stagger ? Math.min(i % 4, 3) : delay;
      if (d > 0) el.classList.add(`reveal-delay-${d}`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  $$('.reveal').forEach(el => observer.observe(el));
}

/* ── Contact form ───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form     = $('#contact-form');
  if (!form) return;

  const statusEl  = $('#form-status');
  const submitBtn = $('.contact-form__submit', form);
  const btnText   = $('.contact-form__btn-text', form);
  const btnLoad   = $('.contact-form__btn-loading', form);

  function getField(id) { return form.querySelector('#' + id); }
  function getError(id) { return form.querySelector('#' + id + '-error'); }

  function setError(fieldId, msg) {
    const input = getField(fieldId);
    const error = getError(fieldId);
    if (input) input.classList.toggle('is-invalid', !!msg);
    if (error) error.textContent = msg || '';
  }

  function validateField(input) {
    const id    = input.id;
    const val   = input.value.trim();
    const req   = input.required;

    if (id === 'cf-name') {
      if (!val) return 'Please enter your name.';
      if (val.length < 2) return 'Name must be at least 2 characters.';
    }
    if (id === 'cf-email') {
      if (!val) return 'Please enter your email address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.';
    }
    return '';
  }

  // Live validation on blur
  $$('.contact-form__input', form).forEach(input => {
    input.addEventListener('blur', () => {
      const err = validateField(input);
      setError(input.id, err);
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        const err = validateField(input);
        setError(input.id, err);
      }
    });
  });

  function setLoading(on) {
    if (btnText) btnText.hidden = on;
    if (btnLoad) btnLoad.hidden = !on;
    if (submitBtn) submitBtn.setAttribute('aria-disabled', on ? 'true' : 'false');
    submitBtn?.classList.toggle('btn--loading', on);
  }

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className   = 'contact-form__status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all required fields
    let hasErrors = false;
    ['cf-name', 'cf-email'].forEach(id => {
      const input = getField(id);
      if (!input) return;
      const err = validateField(input);
      setError(id, err);
      if (err) hasErrors = true;
    });

    if (hasErrors) {
      // Focus first error
      const firstError = form.querySelector('.is-invalid');
      firstError?.focus();
      return;
    }

    setLoading(true);
    setStatus('', '');

    try {
      // Simulated submission — replace with real endpoint
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());

      // Real implementation would be:
      // const res = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error('Server error');

      // Simulated delay for demo
      await new Promise(r => setTimeout(r, 1200));

      console.log('Form submission payload:', payload); // Remove in production
      setStatus('Thank you. We\'ll be in touch within one business day.', 'success');
      form.reset();
      $$('.contact-form__input', form).forEach(el => el.classList.remove('is-invalid'));

    } catch (err) {
      console.error('Form error:', err);
      setStatus('Something went wrong. Please call us at (312) 448-9200 or try again.', 'error');
    } finally {
      setLoading(false);
    }
  });
}

/* ── Lazy load SVG images ───────────────────────────────────────────────────── */
function initLazyImages() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.opacity = '1';
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.01, rootMargin: '200px' }
  );

  // Mark portfolio images for lazy reveal
  $$('.portfolio-item .portfolio-item__visual').forEach((el, i) => {
    if (i < 2) return; // First two are LCP candidates — skip
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s ease';
    observer.observe(el);
  });
}

/* ── Init ───────────────────────────────────────────────────────────────────── */
function init() {
  initReveal();
  initContactForm();
  initLazyImages();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  requestAnimationFrame(init);
}