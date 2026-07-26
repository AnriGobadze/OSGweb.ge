/* ====================================================================
   OSGWeb.ge — Exclusivity Badge (hanging sign)
   hanging-badge.js
   ==================================================================== */

(function () {
  'use strict';

  /* ── BOOT ─────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init () {
    initRopePhysics();
    initCardReveal();
  }

  /* ==================================================================
     ROPE PHYSICS — gravity, tension & momentum

     Two damped springs run every frame, both driven off the live scroll
     position:

       - swing (angle)  the existing horizontal pendulum, kicked by the
                         raw frame-to-frame scroll delta.

       - lag   (lagPx)  NEW. `laggedY` is the badge's own "sense" of the
                         scroll position — it chases the real `scrollY`
                         with its own inertia instead of tracking it
                         instantly. `distance` (real scrollY minus
                         laggedY) is how far the badge hasn't caught up
                         yet:
                           - scroll UP fast    -> real position drops out
                             from under the lagging follower -> reads as
                             the sign being wrenched upward against its
                             own weight -> tension (rope straightens,
                             card stretches down away from the nail).
                           - scroll DOWN fast  -> real position outruns
                             the follower -> the rope has more length
                             than the remaining gap needs -> slack (rope
                             wrinkles, card floats up) until the spring
                             catches back up.

     GSAP's ticker drives the frame loop and gsap.set() applies every
     computed value so GSAP owns the actual updates; both fall back to
     plain rAF/DOM writes if GSAP isn't loaded.
  ================================================================== */
  function initRopePhysics () {
    var root = document.getElementById('discount-sign');
    if (!root) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var card = root.querySelector('.sign-card');
    var ropeSvg = root.querySelector('.rope-svg');
    if (!card || !ropeSvg) return;

    var hasGsap = typeof window.gsap !== 'undefined';

    /* ── cache each dynamic strand's authored points ──────────────── */
    var CENTER_X = 8;   // viewBox is "0 0 16 88" -> horizontal centerline
    var ROPE_LEN = 88;  // nail (y=0) to card attachment (y=88), viewBox units

    var strands = ['.rope-core', '.rope-strand-c', '.rope-strand-b', '.rope-strand-a', '.rope-highlight']
      .map(function (sel) {
        var el = ropeSvg.querySelector(sel);
        if (!el) return null;
        var original = el.getAttribute('d');
        return { el: el, original: original, points: parsePathPoints(original) };
      })
      .filter(Boolean);

    function parsePathPoints (d) {
      var nums = d.match(/-?\d+\.?\d*/g).map(Number);
      var pts = [];
      for (var i = 0; i < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
      return pts;
    }

    // Rebuilds "M x,y (C x,y x,y x,y)+" from the cached points, scaling each
    // point's distance from the centerline (wobbleScale) and from the nail
    // (lengthScale). wobbleScale -> MIN_WOBBLE reads as taut/near-straight;
    // wobbleScale > 1 reads as loose, wrinkled slack.
    function buildPathD (points, wobbleScale, lengthScale) {
      var out = new Array(points.length);
      for (var i = 0; i < points.length; i++) {
        var x = CENTER_X + (points[i][0] - CENTER_X) * wobbleScale;
        var y = points[i][1] * lengthScale;
        out[i] = x.toFixed(2) + ',' + y.toFixed(2);
      }
      var d = 'M' + out[0];
      for (var j = 1; j < out.length; j += 3) {
        d += ' C' + out[j] + ' ' + out[j + 1] + ' ' + out[j + 2];
      }
      return d;
    }

    function applyRotate (deg) {
      if (hasGsap) gsap.set(root, { '--sign-rotate': deg.toFixed(3) + 'deg' });
      else root.style.setProperty('--sign-rotate', deg.toFixed(3) + 'deg');
    }
    function applyCardLag (px) {
      if (hasGsap) gsap.set(card, { y: px });
      else card.style.transform = px ? 'translateY(' + px.toFixed(2) + 'px)' : '';
    }
    function applyPathD (el, d) {
      if (hasGsap) gsap.set(el, { attr: { d: d } });
      else el.setAttribute('d', d);
    }

    /* Rope's rendered px height, to convert a real-px lag into the SVG's
       own viewBox units (the mobile breakpoint renders the same viewBox
       into a shorter box via `.rope-svg { height: 40px }`). */
    var ropePxPerUnit = 1;
    function measureRope () {
      var h = ropeSvg.getBoundingClientRect().height;
      if (h > 0) ropePxPerUnit = h / ROPE_LEN;
    }
    measureRope();
    window.addEventListener('load', measureRope);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureRope, 150);
    }, { passive: true });

    /* ── tunables ─────────────────────────────────────────────────── */
    var SWING_STIFFNESS  = 0.032;
    var SWING_DAMP_ACTIVE = 0.918;
    var SWING_DAMP_IDLE   = 0.88;
    var SWING_IDLE_ANGLE  = 0.25;
    var SWING_IMPULSE     = 0.020;
    var MAX_ANGLE         = 20;
    var HOVER_NUDGE       = 0.6;

    var FOLLOW_STIFFNESS = 0.070;  // how eagerly the lag follower chases real scroll
    var FOLLOW_DAMPING   = 0.82;   // < 1 -> underdamped: overshoots, then settles
    var MAX_FOLLOW_VEL   = 60;     // caps how long a long fast fling takes to settle
    var MAX_DISTANCE     = 46;     // clamp on the raw scroll/follower gap (real px)

    var TENSION_GAIN   = 0.24;  // gap(px) -> card lag(px)
    var MAX_STRETCH_PX = 10;    // up-scroll: taut cap
    var MAX_SLACK_PX   = 8;     // down-scroll: free-fall cap
    var MIN_WOBBLE     = 0.12;  // near-straight at max tension
    var MAX_WOBBLE     = 1.7;   // wrinkled at max slack
    var SETTLE_EPSILON = 0.03;

    var angle = 0, angularVelocity = 0;
    var laggedY = window.scrollY || window.pageYOffset;
    var laggedVelocity = 0;
    var lastScrollY = laggedY;
    var atRest = true;

    root.addEventListener('mouseenter', function () {
      angularVelocity += HOVER_NUDGE * (Math.random() > 0.5 ? 1 : -1);
    });

    function tick () {
      var scrollY = window.scrollY || window.pageYOffset;

      // vertical: laggedY chases scrollY with its own inertia
      var gap = scrollY - laggedY;
      laggedVelocity += gap * FOLLOW_STIFFNESS;
      laggedVelocity *= FOLLOW_DAMPING;
      if (laggedVelocity >  MAX_FOLLOW_VEL) laggedVelocity =  MAX_FOLLOW_VEL;
      if (laggedVelocity < -MAX_FOLLOW_VEL) laggedVelocity = -MAX_FOLLOW_VEL;
      laggedY += laggedVelocity;

      var distance = scrollY - laggedY;
      if (distance >  MAX_DISTANCE) distance =  MAX_DISTANCE;
      if (distance < -MAX_DISTANCE) distance = -MAX_DISTANCE;

      // up-scroll (distance < 0) -> tension/stretch; down-scroll (distance > 0) -> slack
      var rawLagPx = -distance * TENSION_GAIN;
      var lagPx = rawLagPx > 0
        ? Math.min(rawLagPx, MAX_STRETCH_PX)
        : Math.max(rawLagPx, -MAX_SLACK_PX);

      // horizontal swing: unchanged pendulum, kicked by raw scroll delta
      var dy = scrollY - lastScrollY;
      lastScrollY = scrollY;
      var impulse = dy * SWING_IMPULSE;
      if (impulse >  2.8) impulse =  2.8;
      if (impulse < -2.8) impulse = -2.8;
      angularVelocity += impulse;

      angularVelocity += -SWING_STIFFNESS * angle;
      var swingIdle = Math.abs(angle) < SWING_IDLE_ANGLE && Math.abs(angularVelocity) < 0.04;
      angularVelocity *= swingIdle ? SWING_DAMP_IDLE : SWING_DAMP_ACTIVE;
      angle += angularVelocity;
      if (angle >  MAX_ANGLE) { angle =  MAX_ANGLE; angularVelocity *= -0.20; }
      if (angle < -MAX_ANGLE) { angle = -MAX_ANGLE; angularVelocity *= -0.20; }

      var vertIdle = Math.abs(lagPx) < SETTLE_EPSILON && Math.abs(laggedVelocity) < SETTLE_EPSILON;
      var settled = swingIdle && vertIdle;

      if (settled) {
        if (!atRest) {
          angle = 0; angularVelocity = 0;
          laggedVelocity = 0; laggedY = scrollY;
          applyRotate(0);
          applyCardLag(0);
          strands.forEach(function (s) { applyPathD(s.el, s.original); });
          atRest = true;
        }
        return;
      }
      atRest = false;

      applyRotate(angle);
      applyCardLag(lagPx);

      var localLag = lagPx / ropePxPerUnit;
      var lengthScale = (ROPE_LEN + localLag) / ROPE_LEN;
      var tensionT = lagPx > 0 ?  lagPx / MAX_STRETCH_PX : 0;
      var slackT   = lagPx < 0 ? -lagPx / MAX_SLACK_PX   : 0;
      var wobbleScale = tensionT > 0
        ? 1 - (1 - MIN_WOBBLE) * tensionT
        : 1 + (MAX_WOBBLE - 1) * slackT;

      strands.forEach(function (s) {
        applyPathD(s.el, buildPathD(s.points, wobbleScale, lengthScale));
      });
    }

    var rafId;
    if (hasGsap) {
      gsap.ticker.add(tick);
    } else {
      (function rafLoop () { tick(); rafId = requestAnimationFrame(rafLoop); })();
    }

    window.addEventListener('pagehide', function () {
      if (hasGsap) gsap.ticker.remove(tick);
      else if (rafId) cancelAnimationFrame(rafId);
    });
  }

  /* ==================================================================
     PRICING CARD SCROLL REVEAL
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
