/* ==========================================================================
   Hemraj Singh — Portfolio scripts
   Each feature is a small function; init() at the bottom runs them all.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------------- Settings ---------------- */

  /**
   * Where the contact form sends its data.
   * - Leave empty ('') for demo mode: the form validates but sends nothing.
   * - When you add a backend, put its URL here, e.g. '/api/contact' or
   *   'http://localhost:3000/api/contact'. The form will POST JSON:
   *   { name, email, subject, message }  and expects a 2xx response.
   */
  const CONTACT_ENDPOINT = '';

  const THEME_KEY = 'hs-theme';

  /* ---------------- Helpers ---------------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

  /* ---------------- Theme (dark / light) ---------------- */
  function initTheme() {
    const button = $('#theme-toggle');
    const meta = $('meta[name="theme-color"]');

    const apply = (theme, save) => {
      root.setAttribute('data-theme', theme);
      button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#070B18' : '#F6F8FD');
      if (save) {
        try { localStorage.setItem(THEME_KEY, theme); } catch (error) { /* storage blocked */ }
      }
    };

    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
    button.addEventListener('click', () => {
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------------- Header, mobile menu, progress, back-to-top ---------------- */
  function initHeader() {
    const header = $('#header');
    const nav = $('#nav');
    const menuButton = $('#menu-btn');
    const scrim = $('#scrim');
    const progress = $('#scroll-progress');
    const toTop = $('#to-top');
    const desktop = window.matchMedia('(min-width: 961px)');

    const isOpen = () => nav.classList.contains('is-open');

    function setMenu(open, { restoreFocus = false } = {}) {
      nav.classList.toggle('is-open', open);
      scrim.hidden = !open;
      document.body.classList.toggle('no-scroll', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) $('a', nav)?.focus();
      else if (restoreFocus) menuButton.focus();
    }

    menuButton.addEventListener('click', () => setMenu(!isOpen()));
    scrim.addEventListener('click', () => setMenu(false));
    nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) setMenu(false, { restoreFocus: true });
    });
    desktop.addEventListener('change', (event) => { if (event.matches && isOpen()) setMenu(false); });

    // One rAF-throttled scroll handler drives the header style, progress bar and back-to-top button.
    let ticking = false;
    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 10);
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  /* ---------------- Highlight the nav link of the section in view ---------------- */
  function initActiveLinks() {
    const links = $$('.nav__link');
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    $$('main section[id]').forEach((section) => observer.observe(section));
  }

  /* ---------------- Typing effect in the hero ---------------- */
  function initTyped() {
    const element = $('#typed');
    if (!element || reducedMotion.matches) return;

    let words;
    try { words = JSON.parse(element.dataset.words); } catch (error) { return; }
    if (!Array.isArray(words) || words.length < 2) return;

    let wordIndex = 0;
    let charIndex = words[0].length;
    let deleting = true;

    function tick() {
      const word = words[wordIndex];
      charIndex += deleting ? -1 : 1;
      element.textContent = word.slice(0, charIndex);

      let delay = deleting ? 35 : 70;
      if (!deleting && charIndex === word.length) { deleting = true; delay = 2200; }
      else if (deleting && charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 350;
      }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 2600);
  }

  /* ---------------- Reveal on scroll + skill bars ---------------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    const skills = $$('.skill');
    const showAll = () => {
      items.forEach((item) => item.classList.add('is-visible'));
      skills.forEach((skill) => skill.classList.add('is-filled'));
    };
    if (reducedMotion.matches || !('IntersectionObserver' in window)) { showAll(); return; }

    // Small stagger for siblings that reveal together.
    items.forEach((item) => {
      const siblings = Array.from(item.parentElement.children).filter((el) => el.hasAttribute('data-reveal'));
      item.style.setProperty('--delay', `${Math.min(siblings.indexOf(item), 5) * 80}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        item.classList.add('is-visible');
        if (item.classList.contains('skill')) item.classList.add('is-filled');
        observer.unobserve(item);
        // When the fade finishes, hand control back to the element's own hover transitions.
        item.addEventListener('transitionend', function done(event) {
          if (event.target !== item || event.propertyName !== 'opacity') return;
          item.removeAttribute('data-reveal');
          item.style.removeProperty('--delay');
          item.removeEventListener('transitionend', done);
        });
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    items.forEach((item) => observer.observe(item));
  }

  /* ---------------- Video modal ---------------- */
  function initVideoModal() {
    const modal = $('#video-modal');
    const video = $('#modal-video');
    const title = $('#video-title');
    if (!modal || typeof modal.showModal !== 'function') return;

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-video]');
      if (!trigger) return;
      title.textContent = trigger.dataset.title || 'Project demo';
      if (video.getAttribute('src') !== trigger.dataset.video) video.src = trigger.dataset.video;
      modal.showModal();
      video.play().catch(() => { /* autoplay blocked: the user can press play */ });
    });

    modal.addEventListener('click', (event) => {
      // Close on the close button or on a click outside the dialog box.
      if (event.target.closest('[data-close]') || event.target === modal) modal.close();
    });
    modal.addEventListener('close', () => video.pause());
  }

  /* ---------------- Contact form (validation + optional backend) ---------------- */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('#form-status');
    const submit = $('button[type="submit"]', form);
    const submitLabel = $('.btn__label', submit);
    const fields = $$('input:not([name="website"]), textarea', form);

    const rules = {
      name: (v) => (v.length < 2 ? 'Please enter your name (at least 2 characters).' : ''),
      email: (v) => {
        if (!v) return 'Please enter your email address.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email, like name@example.com.';
      },
      subject: (v) => (v.length < 3 ? 'Please add a subject (at least 3 characters).' : ''),
      message: (v) => (v.length < 10 ? 'Your message should be at least 10 characters.' : ''),
    };

    function validate(input) {
      const message = rules[input.name](input.value.trim());
      const error = $(`#${input.id}-error`);
      error.textContent = message;
      error.hidden = !message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !message;
    }

    function setStatus(text, type) {
      status.textContent = text;
      status.className = `form__status${type ? ` is-${type}` : ''}`;
    }

    fields.forEach((input) => {
      input.addEventListener('blur', () => { if (input.value) validate(input); });
      input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) validate(input); });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('', '');

      const invalid = fields.filter((input) => !validate(input));
      if (invalid.length) {
        setStatus(invalid.length === 1 ? 'Please fix the highlighted field.' : `Please fix the ${invalid.length} highlighted fields.`, 'error');
        invalid[0].focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      if (data.website) return; // spam bot filled the hidden trap field
      delete data.website;

      // Demo mode: no backend connected yet.
      if (!CONTACT_ENDPOINT) {
        setStatus(`Thanks, ${data.name.split(' ')[0]}! Your message looks good. (Demo mode: connect a backend to deliver it.)`, 'success');
        form.reset();
        return;
      }

      submit.disabled = true;
      submitLabel.textContent = 'Sending…';
      try {
        const response = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        setStatus('Thanks! Your message has been sent. I’ll reply soon.', 'success');
        form.reset();
      } catch (error) {
        console.error(error);
        setStatus('Sorry, the message could not be sent. Please email me directly instead.', 'error');
      } finally {
        submit.disabled = false;
        submitLabel.textContent = 'Send message';
      }
    });
  }

  /* ---------------- Smooth scrolling for in-page links ---------------- */
  function initSmoothScroll() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (id === 'home') window.scrollTo({ top: 0, behavior: scrollBehavior() });
      else target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      history.replaceState(null, '', `#${id}`);
      // Move keyboard focus to the section without jumping the page.
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  function initYear() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------- Start ---------------- */
  function init() {
    initTheme();
    initHeader();
    initActiveLinks();
    initTyped();
    initReveal();
    initVideoModal();
    initContactForm();
    initSmoothScroll();
    initYear();
  }

  init();
})();
