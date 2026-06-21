/* =========================================================================
   Rahul Wala — Portfolio · motion
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(max-width: 860px)").matches || ("ontouchstart" in window);

  /* ---------------- custom cursor (lerp follow) ---------------- */
  (function () {
    if (touch) return;
    var cur = document.querySelector(".cursor");
    if (!cur) return;
    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    document.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    document.addEventListener("mouseleave", function () { cur.classList.add("is-hidden"); });
    document.addEventListener("mouseenter", function () { cur.classList.remove("is-hidden"); });
    function tick() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      cur.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";
      requestAnimationFrame(tick);
    }
    tick();
    var label = cur.querySelector(".cursor__label");
    function bind() {
      document.querySelectorAll("[data-cursor]").forEach(function (el) {
        el.addEventListener("mouseenter", function () {
          cur.classList.add("is-link");
          if (label) label.textContent = el.getAttribute("data-cursor") || "";
        });
        el.addEventListener("mouseleave", function () { cur.classList.remove("is-link"); });
      });
    }
    bind();
  })();

  /* ---------------- live UK clock ---------------- */
  (function () {
    var els = document.querySelectorAll("[data-clock]");
    if (!els.length) return;
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function go() {
      var parts;
      try {
        parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
        }).formatToParts(new Date());
        var h = "", m = "", s = "";
        parts.forEach(function (p) { if (p.type === "hour") h = p.value; if (p.type === "minute") m = p.value; if (p.type === "second") s = p.value; });
        var t = h + ":" + m + ":" + s + " GMT";
        els.forEach(function (e) { e.textContent = t; });
      } catch (err) {
        var d = new Date();
        els.forEach(function (e) { e.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); });
      }
    }
    go(); setInterval(go, 1000);
  })();

  /* ---------------- nav scrolled state + active section ---------------- */
  (function () {
    var nav = document.querySelector(".nav");
    function onScroll() {
      if (!nav) return;
      if (window.scrollY > 40) nav.classList.add("scrolled"); else nav.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var links = [].slice.call(document.querySelectorAll(".nav__links a[href^='#']"));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var t = document.getElementById(id);
      if (t) map[id] = a;
    });
    if ("IntersectionObserver" in window && Object.keys(map).length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (l) { l.style.color = ""; });
            var a = map[en.target.id];
            if (a) a.style.color = "var(--ink)";
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    }
  })();

  /* ---------------- hero reveal on load ---------------- */
  function revealHero() {
    var hero = document.querySelector(".hero");
    if (hero) hero.classList.add("is-in");
  }
  // fire ASAP, on load, and via fallback timers — whichever lands first
  requestAnimationFrame(revealHero);
  window.addEventListener("load", revealHero);
  setTimeout(revealHero, 200);
  setTimeout(revealHero, 800);

  /* ---------------- scroll reveals ---------------- */
  (function () {
    var items = [].slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- marquee (auto-scroll, dual direction) ---------------- */
  (function () {
    if (reduce) return;
    var tracks = [].slice.call(document.querySelectorAll(".marquee__track"));
    tracks.forEach(function (track) {
      // duplicate content for seamless loop
      track.innerHTML = track.innerHTML + track.innerHTML;
      var dir = track.closest(".marquee--alt") ? -1 : 1;
      var x = dir < 0 ? -track.scrollWidth / 2 : 0;
      var speed = 0.45 * dir;
      function step() {
        x -= speed;
        var half = track.scrollWidth / 2;
        if (dir > 0 && x <= -half) x = 0;
        if (dir < 0 && x >= 0) x = -half;
        track.style.transform = "translateX(" + x + "px)";
        requestAnimationFrame(step);
      }
      step();
    });
  })();

  /* ---------------- subtle parallax on media ---------------- */
  (function () {
    if (reduce || touch) return;
    var els = [].slice.call(document.querySelectorAll("[data-parallax]"));
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var center = r.top + r.height / 2;
        var off = (center - vh / 2) / vh; // -0.5..0.5-ish
        var amt = parseFloat(el.getAttribute("data-parallax")) || 18;
        el.style.transform = "translate3d(0," + (-off * amt) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------------- smooth anchor scroll ---------------- */
  document.querySelectorAll("a[href^='#']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        var nav = document.querySelector(".nav");
        var ribbon = document.querySelector(".ribbon");
        var off = (nav ? nav.offsetHeight : 0) + (ribbon ? ribbon.offsetHeight : 0) + 14;
        var top = t.getBoundingClientRect().top + window.scrollY - off;
        window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
      }
    });
  });
})();
