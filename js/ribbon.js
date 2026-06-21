/* =========================================================================
   Rahul Wala — Portfolio · section ribbon + crosshair cursor
   ========================================================================= */
(function () {
  "use strict";
  var touch = window.matchMedia("(max-width: 980px)").matches || ("ontouchstart" in window);

  /* ---------------- keep --navh in sync so the top ribbon sits under the nav ---------------- */
  (function () {
    var nav = document.querySelector(".nav");
    var root = document.documentElement;
    if (!nav) return;
    var ticking = false;
    function setH() { root.style.setProperty("--navh", nav.offsetHeight + "px"); ticking = false; }
    setH();
    window.addEventListener("resize", setH);
    window.addEventListener("load", setH);
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(setH); } }, { passive: true });
  })();

  /* ---------------- section ribbon scroll-spy ---------------- */
  (function () {
    var ribbon = document.querySelector(".ribbon");
    if (!ribbon) return;
    var links = [].slice.call(ribbon.querySelectorAll("a"));
    var sections = links.map(function (a) {
      var id = a.getAttribute("href").slice(1);
      return { a: a, id: id, el: document.getElementById(id) };
    }).filter(function (s) { return s.el; });

    var ticking = false;
    function update() {
      var mid = window.scrollY + window.innerHeight * 0.42;
      var active = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= mid) active = s;
      });
      links.forEach(function (a) { a.classList.remove("active"); });
      if (active) {
        active.a.classList.add("active");
        // dark contrast: is the active section dark?
        var dark = active.el.getAttribute("data-theme") === "dark";
        ribbon.classList.toggle("on-dark", dark);
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ---------------- crosshair cursor (engineering reticle) ---------------- */
  (function () {
    if (touch) return;
    var cross = document.querySelector(".cursor-cross");
    if (!cross) return;
    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, shown = false;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { cross.classList.add("show"); shown = true; }
    });
    document.addEventListener("mouseleave", function () { cross.classList.remove("show"); shown = false; });
    // dim the reticle when hovering interactive targets (the dot cursor takes over)
    document.querySelectorAll("[data-cursor], a, button, .image-slot, image-slot, doc-slot").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cross.style.opacity = "0.18"; });
      el.addEventListener("mouseleave", function () { cross.style.opacity = ""; });
    });
    function tick() {
      x += (tx - x) * 0.28; y += (ty - y) * 0.28;
      cross.style.transform = "translate(" + x + "px," + y + "px)";
      requestAnimationFrame(tick);
    }
    tick();
  })();
})();
