/* ====================================================================
   OSGWeb.ge — May 2026 Discount Upgrade
   pricing-discount.js
   Add <script src="pricing-discount.js" defer></script>
   AFTER <script src="script.js"></script>, before </body>
   ==================================================================== */

(function () {
  'use strict';

  /* ── DEADLINE ─────────────────────────────────────────────────────
     Midnight, June 1 2026 in Georgia Standard Time (UTC+4).
     Adjust the UTC offset in the string if you are in a different zone.
  ──────────────────────────────────────────────────────────────────── */
  var DEADLINE = new Date('2026-06-01T00:00:00+04:00');

  /* ── BOOT ─────────────────────────────────────────────────────────
     Safe DOMContentLoaded shim — works even if the script loads late.
  ──────────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ==================================================================
     INIT — wire up all modules
  ================================================================== */
  function init() {
    initSaleMode();
    initBillingToggleIntercept();
    initCountdown();
    initRopePhysics();
    initCardReveal();
  }

  /* ==================================================================
     1. SALE MODE
     Adds/removes `.sale-active` on #pricing.
     The one-time payment tab is the only tab where the sale applies.
  ================================================================== */
  function initSaleMode() {
    var section = document.getElementById('pricing');
    if (!section) return;

    /* Read which tab is active on load. Default HTML tab is "onetime". */
    var activeBtn = section.querySelector('.billing-cycle-toggle .toggle-btn.active');
    var currentPeriod = activeBtn ? (activeBtn.dataset.period || 'onetime') : 'onetime';
    applyOrRemoveSale(section, currentPeriod === 'onetime');
  }

  function applyOrRemoveSale(section, isActive) {
    section.classList.toggle('sale-active', isActive);
  }

  /* ==================================================================
     2. BILLING TOGGLE INTERCEPT
     Listens for the same toggle clicks handled by script.js.
     Uses rAF so it runs after the main script updates `.active` classes.
  ================================================================== */
  function initBillingToggleIntercept() {
    var section = document.getElementById('pricing');
    if (!section) return;

    var toggleBtns = section.querySelectorAll('.billing-cycle-toggle .toggle-btn');
    for (var i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].addEventListener('click', (function (btn) {
        return function () {
          requestAnimationFrame(function () {
            applyOrRemoveSale(section, btn.dataset.period === 'onetime');
          });
        };
      })(toggleBtns[i]));
    }
  }

  /* ==================================================================
     3. COUNTDOWN TIMER
     Updates #sign-countdown with days / hours / minutes remaining.
     Falls back gracefully if the deadline has passed.
  ================================================================== */
  function initCountdown() {
    var el = document.getElementById('sign-countdown');
    if (!el) return;

    function updateCountdown() {
      var diff = DEADLINE - Date.now();

      if (diff <= 0) {
        el.textContent = 'ENDED';
        return;
      }

      var totalSec = Math.floor(diff / 1000);
      var d = Math.floor(totalSec / 86400);
      var h = Math.floor((totalSec % 86400) / 3600);
      var m = Math.floor((totalSec % 3600) / 60);

      if (d > 0) {
        el.textContent = d + 'd ' + h + 'h';
      } else if (h > 0) {
        el.textContent = h + 'h ' + m + 'm';
      } else {
        el.textContent = m + 'm';
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 60000); /* refresh every minute */
  }

  /* ==================================================================
     4. ROPE PHYSICS ANIMATION
     Damped spring pendulum model.

     Physics summary
     ───────────────
       Every rAF frame:
         angularVelocity += -STIFFNESS * angle     ← spring restoring force
         angularVelocity *= DAMPING                 ← energy dissipation
         angle           += angularVelocity         ← Euler integration

       On scroll:
         angularVelocity += scrollPxPerMs * SCROLL_IMPULSE
         ↳ the faster/harder the scroll, the bigger the swing

     Tuning
     ──────
       STIFFNESS      — lower = slower return to centre (looser rope)
       DAMPING        — lower = more friction (sign settles faster)
       SCROLL_IMPULSE — lower = less reactive to scrolling
       MAX_ANGLE      — hard limit in degrees
  ================================================================== */
  function initRopePhysics() {
    var root = document.getElementById('discount-sign');
    if (!root) return;

    var STIFFNESS      = 0.040;
    var DAMPING        = 0.912;
    var SCROLL_IMPULSE = 0.36;
    var MAX_ANGLE      = 22;      /* degrees */

    var angle           = 0;
    var angularVelocity = 0;
    var lastScrollY     = window.scrollY || window.pageYOffset;
    var lastScrollTime  = performance.now();
    var rafId;

    function onScroll() {
      var now = performance.now();
      var dt  = Math.max(now - lastScrollTime, 1);          /* ms, min 1 to avoid ÷0 */
      var dy  = (window.scrollY || window.pageYOffset) - lastScrollY;
      var vel = dy / dt;                                     /* px per ms */

      angularVelocity += vel * SCROLL_IMPULSE;

      lastScrollY    = window.scrollY || window.pageYOffset;
      lastScrollTime = now;
    }

    function physicsLoop() {
      /* Spring + damping */
      angularVelocity += -STIFFNESS * angle;
      angularVelocity *= DAMPING;
      angle           += angularVelocity;

      /* Hard stops with slight bounce */
      if (angle >  MAX_ANGLE) { angle =  MAX_ANGLE; angularVelocity *= -0.25; }
      if (angle < -MAX_ANGLE) { angle = -MAX_ANGLE; angularVelocity *= -0.25; }

      root.style.setProperty('--sign-rotate', angle.toFixed(3) + 'deg');
      rafId = requestAnimationFrame(physicsLoop);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(physicsLoop);

    /* Clean up if the page is unloaded / navigated away */
    window.addEventListener('pagehide', function () {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    });
  }

  /* ==================================================================
     5. PRICING CARD SCROLL REVEAL
     Strategy: add `.pre-reveal` (opacity 0, translateY) to each card
     immediately, then remove it when IntersectionObserver fires.
     The CSS transition on `.pricing-card` carries the element smoothly
     to its natural resting state — so existing :hover rules and the
     `.most-popular { transform: scale(1.05) }` rule from style.css
     are never overridden.

     A short setTimeout lets AOS finish its own initialisation before
     we strip its classes.
  ================================================================== */
  function initCardReveal() {
    setTimeout(function () {
      var cards = Array.from(
        document.querySelectorAll('.pricing-card:not(.individual-plan)')
      );
      if (!cards.length) return;

      /* ── Strip AOS interference ── */
      cards.forEach(function (card) {
        card.removeAttribute('data-aos');
        card.removeAttribute('data-aos-delay');
        card.classList.remove('aos-init', 'aos-animate');
        /* Reset any inline styles AOS injected */
        ['opacity', 'transform', 'transitionDuration', 'transitionDelay']
          .forEach(function (prop) { card.style[prop] = ''; });
        /* Mark as pre-reveal (hidden + displaced) */
        card.classList.add('pre-reveal');
      });

      /* ── IntersectionObserver ── */
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            var card = entry.target;
            var idx  = cards.indexOf(card);

            /* Stagger: each successive card waits 130 ms longer */
            setTimeout(function () {
              card.classList.remove('pre-reveal');
            }, idx * 130);

            observer.unobserve(card);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
      );

      cards.forEach(function (card) { observer.observe(card); });

    }, 90); /* 90 ms: safely after AOS DOMContentLoaded callback */
  }

})();