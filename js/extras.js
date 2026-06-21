/* =========================================================================
   Rahul Wala — Portfolio · extras
   1. Random structural-term pop-ups inside the beam dividers + hero frame
   2. Recognition cards — injected artefact glyphs + accent node (motion)
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var WORDS = ["Deflection", "Bending Moment", "Shear Force", "Tension",
    "Compression", "Stability", "Steel", "Concrete", "Timber", "Eurocode"];
  // bright, high-contrast pop-up colours so the terms stand out on the dark hero
  var WCOLORS = [
    "oklch(0.84 0.15 85)",   // gold
    "oklch(0.84 0.14 195)",  // bright cyan
    "oklch(0.78 0.17 30)",   // coral
    "oklch(0.85 0.16 150)",  // bright green
    "oklch(0.80 0.15 320)",  // magenta
    "oklch(0.96 0.02 95)"    // near-white
  ];
  function color() { return WCOLORS[Math.floor(Math.random() * WCOLORS.length)]; }
  function pick(prev) {
    var w = WORDS[Math.floor(Math.random() * WORDS.length)];
    return w === prev ? pick(prev) : w;
  }

  /* ---------------- recognition artefact glyphs ---------------- */
  var GLYPHS = {
    trophy: "M8 4 H16 V8 A4 4 0 0 1 8 8 Z M8 6 H5 A2 2 0 0 0 7 10 M16 6 H19 A2 2 0 0 1 17 10 M12 12 V16 M9 19 H15",
    seal: "M6 4 H18 V15 H6 Z M9 8 H15 M9 11 H13 M9 15 V20 L12 18 L15 20 V15",
    bars: "M5 19 H19 M8 19 V13 M12 19 V7 M16 19 V11",
    page: "M7 4 H17 V20 H7 Z M10 8 H14 M10 11 H14 M10 14 H13",
    podium: "M12 4 A2 2 0 0 1 12 10 M9 7 H15 M12 10 V15 M8 20 L12 15 L16 20",
    network: "M12 12 L5 6 M12 12 L19 6 M12 12 L6 19 M12 12 L19 18",
    group: "M8 9 A2 2 0 1 0 7.99 9 M16 9 A2 2 0 1 0 15.99 9 M5 18 C5 14 11 14 11 18 M13 18 C13 14 19 14 19 18",
    shield: "M12 4 L19 7 V12 C19 17 12 20 12 20 C12 20 5 17 5 12 V7 Z M9 12 L11 14 L15 9",
    leaf: "M6 18 C6 10 12 5 19 5 C19 12 14 18 6 18 Z M10 14 C12 11 15 9 18 8",
    cycle: "M7 8 A6 6 0 0 1 18 9 M18 6 V9 H15 M17 16 A6 6 0 0 1 6 15 M6 18 V15 H9"
  };
  function glyphFor(text) {
    var t = (text || "").toLowerCase();
    if (t.indexOf("murray buxton") > -1 || t.indexOf("award") > -1) return GLYPHS.trophy;
    if (t.indexOf("ciob") > -1 || t.indexOf("certificate") > -1) return GLYPHS.seal;
    if (t.indexOf("dissertation") > -1) return GLYPHS.bars;
    if (t.indexOf("published") > -1 || t.indexOf("profession") > -1) return GLYPHS.page;
    if (t.indexOf("speaker") > -1 || t.indexOf("scotland") > -1) return GLYPHS.podium;
    if (t.indexOf("seat") > -1 || t.indexOf("panel") > -1 || t.indexOf("standard") > -1) return GLYPHS.network;
    if (t.indexOf("room") > -1 || t.indexOf("workshop") > -1 || t.indexOf("conference") > -1) return GLYPHS.group;
    if (t.indexOf("site") > -1 || t.indexOf("cscs") > -1 || t.indexOf("50") > -1) return GLYPHS.shield;
    if (t.indexOf("carbon literacy") > -1) return GLYPHS.leaf;
    if (t.indexOf("lca") > -1 || t.indexOf("bootcamp") > -1) return GLYPHS.cycle;
    return GLYPHS.network;
  }
  (function () {
    document.querySelectorAll(".rec__item").forEach(function (item) {
      if (item.querySelector(".rec__spark")) return;
      var title = item.querySelector(".rec__b b");
      var spark = document.createElement("span");
      spark.className = "rec__spark"; spark.setAttribute("aria-hidden", "true");
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      var path = document.createElementNS(NS, "path");
      path.setAttribute("class", "rk-line");
      path.setAttribute("d", glyphFor(title ? title.textContent : ""));
      svg.appendChild(path);
      spark.appendChild(svg);
      item.appendChild(spark);
    });
  })();

  /* ---------------- ensure data-viz bars/charts fill on scroll ----------------
     Robust fallback: charts.js uses an IntersectionObserver; this geometry check
     guarantees every [data-viz] block (the blue sector/region bars included)
     gets .is-in once it enters the viewport, so the blue fills always render. */
  (function () {
    var blocks = [].slice.call(document.querySelectorAll("[data-viz]"));
    if (!blocks.length) return;
    function sweep() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = blocks.length - 1; i >= 0; i--) {
        var b = blocks[i], r = b.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { b.classList.add("is-in"); blocks.splice(i, 1); }
      }
      if (!blocks.length) { window.removeEventListener("scroll", onScroll); }
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { sweep(); ticking = false; });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    sweep();
  })();

  if (reduce) return;

  function inView(el, pad) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight, p = pad || 0;
    return r.bottom > vh * p && r.top < vh * (1 - p) && r.height > 0;
  }

  /* ---------------- hero frame — pop-up terms (home page only) ----------------
     Words appear only in the empty / dark regions of the hero so they stay
     noticeable and never collide with the headline, coords or lede. */
  var hero = document.querySelector(".hero");
  if (hero) {
    var layer = document.createElement("div");
    layer.className = "hero__words"; layer.setAttribute("aria-hidden", "true");
    hero.appendChild(layer);
    // safe rectangles {l, r, t, b} as viewport-% of the hero, avoiding text zones
    var ZONES = [
      { l: 54, r: 88, t: 16, b: 40 },   // upper-right void
      { l: 58, r: 90, t: 44, b: 66 },   // mid-right void
      { l: 12, r: 44, t: 11, b: 22 },   // upper-left band (above headline)
      { l: 30, r: 62, t: 26, b: 44 }    // central void
    ];
    var hlast = "", zlast = -1;
    function hspawn() {
      if (inView(hero, 0) && document.visibilityState === "visible") {
        var w = document.createElement("span");
        w.className = "hero__word";
        hlast = pick(hlast); w.textContent = hlast;
        w.style.color = color();
        var zi = Math.floor(Math.random() * ZONES.length);
        if (zi === zlast) zi = (zi + 1) % ZONES.length;
        zlast = zi;
        var z = ZONES[zi];
        w.style.left = (z.l + Math.random() * (z.r - z.l)) + "%";
        w.style.top = (z.t + Math.random() * (z.b - z.t)) + "%";
        layer.appendChild(w);
        setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 3600);
      }
      setTimeout(hspawn, 1400 + Math.random() * 1500);
    }
    setTimeout(hspawn, 900);
  }
})();
