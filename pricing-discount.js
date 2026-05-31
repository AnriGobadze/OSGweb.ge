/* ====================================================================
   OSGWeb.ge — June 2026 Special Promotion
   pricing-june-special.js
   ==================================================================== */

(function () {
  'use strict';


  var TOTAL_SPOTS = 8;

  /* ── BOOT ─────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ==================================================================
     INIT — wire up all modules
  ================================================================== */
  function init () {
    initSaleMode();
    initBillingToggleIntercept();
    initSpotsCounter();
    initRopePhysics();
    initCardReveal();
  }

  /* ==================================================================
     1. SALE MODE
     Adds/removes `.sale-active` on #pricing.
     Only the one-time tab triggers the promotional pricing.
  ================================================================== */
  function initSaleMode () {
    var section = document.getElementById('pricing');
    if (!section) return;

    var activeBtn = section.querySelector('.billing-cycle-toggle .toggle-btn.active');
    var currentPeriod = activeBtn ? (activeBtn.dataset.period || 'onetime') : 'onetime';
    applyOrRemoveSale(section, currentPeriod === 'onetime');
  }

  function applyOrRemoveSale (section, isActive) {
    section.classList.toggle('sale-active', isActive);
  }

  /* ==================================================================
     2. BILLING TOGGLE INTERCEPT
  ================================================================== */
  function initBillingToggleIntercept () {
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
     3. SPOTS COUNTER
  ================================================================== */
  function initSpotsCounter () {
    var el = document.getElementById('sign-spots-count');
    if (!el) return;

    el.textContent = TOTAL_SPOTS;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateSpotsPulse(el);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    observer.observe(document.getElementById('discount-sign') || el);
  }

  function animateSpotsPulse (el) {
    el.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)';
    el.style.transform  = 'scale(1.22)';
    setTimeout(function () {
      el.style.transform = 'scale(1)';
    }, 280);
  }

  window.updateSpotsCount = function (n) {
    var el = document.getElementById('sign-spots-count');
    if (!el) return;
    el.textContent = Math.max(0, parseInt(n, 10) || 0);
    animateSpotsPulse(el);
  };

  /* ==================================================================
     4. ROPE PHYSICS  —  Improved catenary pendulum
     ─────────────────────────────────────────────────────────────────
     ================================================================== */
  function initRopePhysics () {
    var root = document.getElementById('discount-sign');
    if (!root) return;

    var STIFFNESS      = 0.032;   /* lower = lazier return to vertical */
    var DAMPING_ACTIVE = 0.918;   /* damping when swinging freely */
    var DAMPING_IDLE   = 0.88;    /* extra damping when nearly still */
    var IDLE_THRESHOLD = 0.25;    /* degrees — below this = "idle" */
    var SCROLL_IMPULSE = 0.28;    /* scroll-velocity → angular kick */
    var MAX_IMPULSE    = 2.8;     /* hard cap per scroll event */
    var MAX_ANGLE      = 20;      /* hard stop in degrees */
    var HOVER_NUDGE    = 0.6;     /* tiny kick on mouse-enter */

    var angle           = 0;
    var angularVelocity = 0;
    var lastScrollY     = window.scrollY || window.pageYOffset;
    var lastScrollTime  = performance.now();
    var scrollThrottle  = false;
    var rafId;

    function onScroll () {
      if (scrollThrottle) return;
      scrollThrottle = true;

      requestAnimationFrame(function () {
        scrollThrottle = false;

        var now = performance.now();
        var dt  = Math.max(now - lastScrollTime, 1);
        var dy  = (window.scrollY || window.pageYOffset) - lastScrollY;
        var vel = dy / dt;

        var impulse = vel * SCROLL_IMPULSE;
        /* Clamp */
        if (impulse >  MAX_IMPULSE) impulse =  MAX_IMPULSE;
        if (impulse < -MAX_IMPULSE) impulse = -MAX_IMPULSE;

        angularVelocity += impulse;

        lastScrollY    = window.scrollY || window.pageYOffset;
        lastScrollTime = now;
      });
    }

    root.addEventListener('mouseenter', function () {
      angularVelocity += HOVER_NUDGE * (Math.random() > 0.5 ? 1 : -1);
    });

    function physicsLoop () {
      angularVelocity += -STIFFNESS * angle;
      var isIdle = Math.abs(angle) < IDLE_THRESHOLD &&
                   Math.abs(angularVelocity) < 0.04;
      angularVelocity *= isIdle ? DAMPING_IDLE : DAMPING_ACTIVE;

      angle += angularVelocity;

      if (angle >  MAX_ANGLE) { angle =  MAX_ANGLE; angularVelocity *= -0.20; }
      if (angle < -MAX_ANGLE) { angle = -MAX_ANGLE; angularVelocity *= -0.20; }

      root.style.setProperty('--sign-rotate', angle.toFixed(3) + 'deg');

      rafId = requestAnimationFrame(physicsLoop);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(physicsLoop);

    window.addEventListener('pagehide', function () {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    });
  }

  /* ==================================================================
     5. PRICING CARD SCROLL REVEAL  (identical logic to May version)
  ================================================================== */
  function initCardReveal () {
    setTimeout(function () {
      var cards = Array.from(
        document.querySelectorAll('.pricing-card:not(.individual-plan)')
      );
      if (!cards.length) return;

      cards.forEach(function (card) {
        card.removeAttribute('data-aos');
        card.removeAttribute('data-aos-delay');
        card.classList.remove('aos-init', 'aos-animate');
        ['opacity', 'transform', 'transitionDuration', 'transitionDelay']
          .forEach(function (prop) { card.style[prop] = ''; });
        card.classList.add('pre-reveal');
      });

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var card = entry.target;
            var idx  = cards.indexOf(card);
            setTimeout(function () {
              card.classList.remove('pre-reveal');
            }, idx * 130);
            observer.unobserve(card);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
      );

      cards.forEach(function (card) { observer.observe(card); });

    }, 90);
  }

})();