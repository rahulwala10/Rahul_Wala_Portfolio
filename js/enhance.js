/* =========================================================================
   Rahul Wala — Portfolio · enhancements
   3D wireframe structural frame · tilt · magnetic · progress · count-up
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(max-width: 860px)").matches || ("ontouchstart" in window);

  /* ---------------- scroll progress ---------------- */
  (function () {
    var bar = document.querySelector(".progress span");
    if (!bar) return;
    var ticking = false;
    function upd() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  })();

  /* ---------------- count up ---------------- */
  (function () {
    var els = [].slice.call(document.querySelectorAll(".cnt"));
    if (!els.length) return;
    function fmt(v, p) { var s = Math.round(v).toString(); while (p && s.length < p) s = "0" + s; return s; }
    function run(el) {
      var to = parseInt(el.getAttribute("data-to"), 10) || 0;
      var pad = parseInt(el.getAttribute("data-pad"), 10) || 0;
      if (reduce) { el.textContent = fmt(to, pad); return; }
      var dur = 1200, t0 = null;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e, pad);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- dimension lines reveal ---------------- */
  (function () {
    var dims = [].slice.call(document.querySelectorAll(".dim"));
    if (!dims.length) return;
    if (reduce || !("IntersectionObserver" in window)) { dims.forEach(function (d) { d.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    dims.forEach(function (d) { io.observe(d); });
  })();

  /* ---------------- 3D tilt on project media ---------------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll("[data-tilt]").forEach(function (media) {
      var slot = media.querySelector(".proj__slot");
      if (!slot) return;
      media.addEventListener("mousemove", function (e) {
        var r = media.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        slot.style.transform = "rotateY(" + (px * 9) + "deg) rotateX(" + (-py * 9) + "deg) translateZ(14px)";
      });
      media.addEventListener("mouseleave", function () { slot.style.transform = ""; });
    });
  })();

  /* ---------------- magnetic targets ---------------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (x * 0.22) + "px," + (y * 0.4) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  })();

})();
