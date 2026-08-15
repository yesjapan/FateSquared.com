/* FATE SQUARED — site behaviour
   No dependencies. Everything degrades gracefully if JS is off. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Reveal choreography
     Hero elements reveal on load with their inline --i stagger; everything
     else reveals as it scrolls into view. After the entrance plays we add
     .done so hover transitions aren't delayed by the stagger.
     ------------------------------------------------------------------ */
  const revealEls = $$('.reveal');

  function play(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    const i = parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0;
    window.setTimeout(() => el.classList.add('done'), 1050 + i * 110);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => { el.classList.add('in', 'done'); });
  } else {
    // Hero: play immediately on load.
    $$('.hero .reveal').forEach(play);

    // Everything else: observe. Siblings inside the same parent get a small
    // stagger so paragraph blocks cascade rather than pop.
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (!el.style.getPropertyValue('--i')) {
          const sibs = $$(':scope > .reveal', el.parentElement);
          const idx = sibs.indexOf(el);
          if (idx > 0) el.style.setProperty('--i', String(Math.min(idx, 6)));
        }
        play(el);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

    revealEls.filter(el => !el.closest('.hero')).forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Navigation: scrolled state, mobile menu, active section
     ------------------------------------------------------------------ */
  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $$('#navLinks a');

  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  navLinks.forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) navToggle.click();
  });

  if ('IntersectionObserver' in window) {
    const sections = navLinks
      .map(a => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));
  }

  /* ------------------------------------------------------------------
     Background parallax (tower grid drifts slower than the page)
     ------------------------------------------------------------------ */
  const grid = $('#bgGrid');
  if (grid && !reduceMotion) {
    let ticking = false;
    const update = () => {
      grid.style.setProperty('--parallax', `${window.scrollY * 0.06}px`);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     The book: pointer tilt + click/keyboard flip
     ------------------------------------------------------------------ */
  const book = $('#book');
  if (book) {
    const MAX_Y = 12, MAX_X = 7;
    let raf = null;

    const tilt = (clientX, clientY) => {
      const r = book.getBoundingClientRect();
      const px = (clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      const py = (clientY - r.top) / r.height - 0.5;
      const flipped = book.classList.contains('is-flipped');
      // When flipped the visual left/right is mirrored, so invert Y-tilt.
      const ry = (flipped ? -px : px) * MAX_Y * 2;
      const rx = -py * MAX_X * 2;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        book.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        book.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      });
    };
    const reset = () => {
      book.classList.remove('is-tilting');
      book.style.setProperty('--ry', '0deg');
      book.style.setProperty('--rx', '0deg');
    };

    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      book.addEventListener('pointerenter', () => book.classList.add('is-tilting'));
      book.addEventListener('pointermove', (e) => tilt(e.clientX, e.clientY));
      book.addEventListener('pointerleave', reset);
    }

    const flip = () => {
      const now = book.classList.toggle('is-flipped');
      book.setAttribute('aria-pressed', String(now));
      book.setAttribute('aria-label', now
        ? 'Book back cover. Press to flip to the front cover.'
        : 'Book cover. Press to flip and read the back cover.');
      // Pause the float while flipping so the two motions don't fight.
      book.style.animationPlayState = 'paused';
      window.setTimeout(() => { book.style.animationPlayState = ''; }, 900);
    };
    book.addEventListener('click', flip);
    book.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  }

  /* ------------------------------------------------------------------
     Listen: shows itself only if assets/chapter-1.mp3 actually loads.
     ------------------------------------------------------------------ */
  const listen = $('#listen');
  const audio = $('#audio');
  if (listen && audio) {
    const player = $('.player', listen);
    const playBtn = $('#playBtn');
    const seek = $('#seek');
    const tCur = $('#tCur');
    const tDur = $('#tDur');
    const fmt = (s) => {
      if (!isFinite(s)) return '–:––';
      const m = Math.floor(s / 60), r = Math.floor(s % 60);
      return `${m}:${r < 10 ? '0' : ''}${r}`;
    };
    let scrubbing = false;

    audio.addEventListener('loadedmetadata', () => {
      listen.hidden = false;
      $$('[data-optional="listen"]').forEach(a => { a.hidden = false; });
      tDur.textContent = fmt(audio.duration);
    }, { once: true });
    audio.addEventListener('error', () => { listen.hidden = true; }, { once: true });

    playBtn.addEventListener('click', () => {
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener('play', () => { player.classList.add('is-playing'); playBtn.setAttribute('aria-label', 'Pause'); });
    audio.addEventListener('pause', () => { player.classList.remove('is-playing'); playBtn.setAttribute('aria-label', 'Play'); });
    audio.addEventListener('ended', () => { seek.value = '0'; seek.style.setProperty('--p', '0%'); });

    audio.addEventListener('timeupdate', () => {
      if (scrubbing || !isFinite(audio.duration)) return;
      const p = audio.currentTime / audio.duration;
      seek.value = String(Math.round(p * 1000));
      seek.style.setProperty('--p', `${(p * 100).toFixed(2)}%`);
      tCur.textContent = fmt(audio.currentTime);
    });
    seek.addEventListener('input', () => {
      scrubbing = true;
      const p = Number(seek.value) / 1000;
      seek.style.setProperty('--p', `${(p * 100).toFixed(2)}%`);
      tCur.textContent = fmt(p * (audio.duration || 0));
    });
    seek.addEventListener('change', () => {
      if (isFinite(audio.duration)) audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
      scrubbing = false;
    });
  }

  /* ------------------------------------------------------------------
     Notify: release-alert list.
     Active only once the form action has a real endpoint (no placeholder).
     When active: html.has-notify flips the hero/nav CTAs to "Notify me",
     and the form submits inline with a success message; if the request
     can't be made from the browser it falls back to a normal POST.
     ------------------------------------------------------------------ */
  const notify = $('#notify');
  const notifyForm = $('#notifyForm');
  const action = notifyForm ? (notifyForm.getAttribute('action') || '') : '';
  const notifyConfigured = /^https?:\/\//.test(action) && !/YOUR_FORM_ID|USERNAME/.test(action);

  if (notify && notifyForm && notifyConfigured) {
    document.documentElement.classList.add('has-notify');
    notify.hidden = false;

    const msg = $('#notifyMsg');
    const btn = $('#notifyBtn');
    const input = $('#email');
    const say = (text, kind) => {
      msg.textContent = text;
      msg.classList.remove('is-success', 'is-error');
      if (kind) msg.classList.add(kind);
    };

    notifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        say('That email address doesn’t look right — mind checking it?', 'is-error');
        input.focus();
        return;
      }
      say('');
      notifyForm.classList.add('is-busy');
      btn.disabled = true;

      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(notifyForm),
          headers: { Accept: 'application/json' },
        });
        let status = null;
        try { status = (await res.clone().json()).status || null; } catch (_) { /* non-JSON is fine */ }

        if (res.ok && status !== 'failed') {
          notifyForm.classList.add('is-done');
          say('You’re on the list. Check your inbox for a confirmation email — click it and you’re set.', 'is-success');
        } else {
          say('Something went wrong on the list’s end. Please try again in a moment.', 'is-error');
        }
      } catch (_) {
        // Network/CORS blocked — let the browser do a plain POST instead.
        notifyForm.submit();
        return;
      } finally {
        notifyForm.classList.remove('is-busy');
        btn.disabled = false;
      }
    });
  }
})();
