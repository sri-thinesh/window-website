'use strict';

/* ── Utilities ──────────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Year ───────────────────────────────────────────────────────────────────── */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Scroll progress ────────────────────────────────────────────────────────── */
const progressBar = $('.scroll-progress');
function updateProgress() {
  if (!progressBar) return;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct   = total > 0 ? Math.round((window.scrollY / total) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
}

/* ── Nav scroll state ───────────────────────────────────────────────────────── */
const nav = $('.nav');
function updateNav() {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}
updateNav();

/* ── Back to top ────────────────────────────────────────────────────────────── */
const btt = $('#back-to-top');
function updateBtt() {
  if (!btt) return;
  window.scrollY > 600 ? btt.removeAttribute('hidden') : btt.setAttribute('hidden', '');
}
updateBtt();
btt?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
});

/* ── Consolidated scroll handler ────────────────────────────────────────────── */
let rafPending = false;
window.addEventListener('scroll', () => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    updateNav();
    updateProgress();
    updateBtt();
    updateActiveNav();
    rafPending = false;
  });
}, { passive: true });

/* ── Active nav links ───────────────────────────────────────────────────────── */
const sections = $$('section[id]');
const navLinks = $$('[data-nav-link]');
function updateActiveNav() {
  if (!navLinks.length || !sections.length) return;
  const threshold = (nav ? nav.offsetHeight : 72) + 80;
  let current = '';
  sections.forEach(s => { if (s.getBoundingClientRect().top <= threshold) current = s.id; });
  navLinks.forEach(link => {
    const match = link.getAttribute('href') === '#' + current;
    if (match) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
updateActiveNav();

/* ═══════════════════════════════════════════════════════════════════════════
   HERO WINDOW INTERACTIONS
═══════════════════════════════════════════════════════════════════════════ */
function initHeroInteraction() {
  if (prefersReducedMotion()) return;

  const hero         = $('.hero');
  const winLeft      = $('#hero-window-left');
  const winCenter    = $('#hero-window-center');
  const winRight     = $('#hero-window-right');
  const lightPool    = $('#hero-light-pool');
  const mouseGlow    = $('#hero-mouse-glow');
  const shimLeft     = $('#shimmer-left');
  const shimCenter   = $('#shimmer-center');
  const shimRight    = $('#shimmer-right');

  if (!hero || !winLeft || !winCenter || !winRight) return;

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let mouseActive = false;
  let heroRect = hero.getBoundingClientRect();
  let animId = null;

  const ro = new ResizeObserver(() => { heroRect = hero.getBoundingClientRect(); });
  ro.observe(hero);

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    const ease = mouseActive ? 0.06 : 0.04;
    currentX = lerp(currentX, targetX, ease);
    currentY = lerp(currentY, targetY, ease);

    winLeft.style.transform   = `translate(${currentX * 6}px, ${currentY * 4}px)`;
    winCenter.style.transform = `translate(${currentX * 14}px, ${currentY * 9}px)`;
    winRight.style.transform  = `translate(${currentX * 5}px, ${currentY * 3}px)`;

    if (lightPool) {
      lightPool.setAttribute('cx', 720 + currentX * 22);
      lightPool.setAttribute('opacity', Math.min(0.10 + Math.abs(currentY) * 0.05, 0.20));
    }
    if (mouseGlow) {
      const gcx = 720 + (targetX * (heroRect.width  || 1440) * 0.5);
      const gcy = 400 + (targetY * (heroRect.height || 900)  * 0.3);
      mouseGlow.setAttribute('cx', gcx);
      mouseGlow.setAttribute('cy', gcy);
      const curO = parseFloat(mouseGlow.getAttribute('opacity') || '0');
      const tgtO = mouseActive ? 0.8 : 0;
      mouseGlow.setAttribute('opacity', lerp(curO, tgtO, 0.08));
    }

    animId = requestAnimationFrame(tick);
  }
  animId = requestAnimationFrame(tick);

  hero.addEventListener('mousemove', (e) => {
    heroRect = hero.getBoundingClientRect();
    targetX = ((e.clientX - heroRect.left) / heroRect.width)  - 0.5;
    targetY = ((e.clientY - heroRect.top)  / heroRect.height) - 0.5;
    mouseActive = true;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0; mouseActive = false;
  });

  /* ── Shimmer ── */
  function runShimmer(el, duration) {
    if (!el) return;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      el.setAttribute('opacity', (Math.sin(p * Math.PI) * 0.5).toFixed(3));
      if (p < 1) requestAnimationFrame(step);
      else el.setAttribute('opacity', '0');
    }
    requestAnimationFrame(step);
  }

  const shimConfig = [
    { el: shimLeft,   delay: 0,    interval: 13000, dur: 1800 },
    { el: shimCenter, delay: 4000, interval: 15000, dur: 2200 },
    { el: shimRight,  delay: 8000, interval: 11000, dur: 1600 },
  ];
  shimConfig.forEach(({ el, delay, interval, dur }) => {
    setTimeout(() => {
      runShimmer(el, dur);
      setInterval(() => runShimmer(el, dur), interval);
    }, delay);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animId = requestAnimationFrame(tick);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE MENU
═══════════════════════════════════════════════════════════════════════════ */
const hamburger      = $('.nav__hamburger');
const mobileMenu     = $('#mobile-menu');
const backdrop       = $('#menu-backdrop');
const closeBtn       = $('.mobile-menu__close');
const mobileNavLinks = $$('.mobile-menu nav a, .mobile-menu__footer a');
let lastFocused = null;

function getFocusable(container) {
  return $$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
    .filter(el => !el.closest('[hidden]'));
}

function openMenu() {
  if (!mobileMenu) return;
  lastFocused = document.activeElement;
  mobileMenu.setAttribute('aria-hidden', 'false');
  hamburger?.setAttribute('aria-expanded', 'true');
  hamburger?.setAttribute('aria-label', 'Close navigation menu');
  backdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';
  const spans = $$('span', hamburger);
  if (spans.length === 3 && !prefersReducedMotion()) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  }
  setTimeout(() => getFocusable(mobileMenu)[0]?.focus(), 50);
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
  setTimeout(() => lastFocused?.focus(), 50);
}

const isMenuOpen = () => mobileMenu?.getAttribute('aria-hidden') === 'false';

hamburger?.addEventListener('click', () => isMenuOpen() ? closeMenu() : openMenu());
closeBtn?.addEventListener('click', closeMenu);
backdrop?.addEventListener('click', closeMenu);
mobileNavLinks.forEach(l => l.addEventListener('click', closeMenu));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isMenuOpen()) { closeMenu(); return; }
  if (e.key === 'Tab' && isMenuOpen() && mobileMenu) {
    const els = getFocusable(mobileMenu);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
  history.pushState(null, '', '#' + id);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
});

/* ── Scroll reveal ──────────────────────────────────────────────────────────── */
function initReveal() {
  if (prefersReducedMotion()) return;

  /* Standard fade-up */
  const fadeUp = [
    { sel: '.section__header',       stagger: false },
    { sel: '.service-card',          stagger: true  },
    { sel: '.portfolio-item',        stagger: true  },
    { sel: '.process__step',         stagger: true  },
    { sel: '.testimonial-card',      stagger: true  },
    { sel: '.faq__item',             stagger: false },
    { sel: '.credentials__stat',     stagger: true  },
    { sel: '.hero__content',         stagger: false },
    { sel: '.finalcta__headline',    stagger: false },
    { sel: '.finalcta__sub',         stagger: false, delay: 1 },
    { sel: '.finalcta__reassurance', stagger: false, delay: 2 },
    { sel: '.contact-form',          stagger: false, delay: 2 },
    { sel: '.finalcta__phone',       stagger: false, delay: 3 },
    { sel: '.finalcta__area',        stagger: false, delay: 4 },
  ];

  fadeUp.forEach(({ sel, stagger, delay = 0 }) => {
    $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      const d = stagger ? Math.min(i % 4, 3) : delay;
      if (d > 0) el.classList.add(`reveal-delay-${d}`);
    });
  });

  /* Scale reveal */
  $$('.whyus__proof-item').forEach((el, i) => {
    el.classList.add('reveal-scale');
    if (i > 0) el.classList.add(`reveal-delay-${i}`);
  });

  /* Directional reveals */
  $$('.whyus__content').forEach(el => el.classList.add('reveal-left'));
  $$('.whyus__illustration').forEach(el => el.classList.add('reveal-right'));

  /* Pillars */
  $$('.whyus__pillar').forEach((el, i) => {
    el.classList.add('reveal');
    if (i > 0) el.classList.add(`reveal-delay-${i}`);
  });

  /* Footer elements */
  $$('.footer__brand-block').forEach(el => el.classList.add('reveal-left'));
  $$('.footer__status').forEach(el => { el.classList.add('reveal'); el.classList.add('reveal-delay-2'); });
  $$('.footer__link-item').forEach((el, i) => {
    el.classList.add('reveal');
    el.classList.add(`reveal-delay-${i + 1}`);
  });
  $$('.footer__bottom').forEach(el => { el.classList.add('reveal'); el.classList.add('reveal-delay-3'); });

  /* Portfolio header */
  $$('.portfolio__header > *').forEach((el, i) => {
    el.classList.add('reveal');
    if (i > 0) el.classList.add('reveal-delay-2');
  });

  const observer = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  $$('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

  /* Process connector line animation */
  const connectorObserver = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        connectorObserver.unobserve(entry.target);
      }
    }),
    { threshold: 0.5 }
  );
  $$('.process__connector').forEach(el => connectorObserver.observe(el));
}

/* ── Contact form ───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;
  const statusEl  = $('#form-status');
  const submitBtn = $('.contact-form__submit', form);
  const btnText   = $('.contact-form__btn-text', form);
  const btnLoad   = $('.contact-form__btn-loading', form);

  function setError(id, msg) {
    const input = form.querySelector('#' + id);
    const error = form.querySelector('#' + id + '-error');
    input?.classList.toggle('is-invalid', !!msg);
    if (error) error.textContent = msg || '';
  }
  function validate(input) {
    const { id, value } = input;
    const v = value.trim();
    if (id === 'cf-name')  { if (!v) return 'Please enter your name.'; if (v.length < 2) return 'Name must be at least 2 characters.'; }
    if (id === 'cf-email') { if (!v) return 'Please enter your email address.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address.'; }
    return '';
  }

  $$('.contact-form__input', form).forEach(input => {
    input.addEventListener('blur',  () => setError(input.id, validate(input)));
    input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) setError(input.id, validate(input)); });
  });

  function setLoading(on) {
    if (btnText) btnText.hidden = on;
    if (btnLoad) btnLoad.hidden = !on;
    submitBtn?.setAttribute('aria-disabled', on ? 'true' : 'false');
  }
  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className   = 'contact-form__status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let hasErrors = false;
    ['cf-name', 'cf-email'].forEach(id => {
      const input = form.querySelector('#' + id);
      if (!input) return;
      const err = validate(input);
      setError(id, err);
      if (err) hasErrors = true;
    });
    if (hasErrors) { form.querySelector('.is-invalid')?.focus(); return; }
    setLoading(true);
    setStatus('', '');
    try {
      await new Promise(r => setTimeout(r, 1200));
      setStatus("Thank you. We'll be in touch within one business day.", 'success');
      form.reset();
      $$('.contact-form__input', form).forEach(el => el.classList.remove('is-invalid'));
    } catch {
      setStatus('Something went wrong. Please call us at (312) 448-9200 or try again.', 'error');
    } finally {
      setLoading(false);
    }
  });
}

/* ── Lazy images ────────────────────────────────────────────────────────────── */
function initLazy() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.style.opacity = '1'; observer.unobserve(entry.target); }
    }),
    { threshold: 0.01, rootMargin: '200px' }
  );
  $$('.portfolio-item .portfolio-item__visual').forEach((el, i) => {
    if (i < 2) return;
    el.style.opacity   = '0';
    el.style.transition = 'opacity 0.4s ease';
    observer.observe(el);
  });
}

/* ── Init ───────────────────────────────────────────────────────────────────── */
function init() {
  initReveal();
  initContactForm();
  initLazy();
  initHeroInteraction();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  requestAnimationFrame(init);
}