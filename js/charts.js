/* =========================================================================
   Rahul Wala — Portfolio · data-viz reveal
   Adds .is-in to [data-viz] blocks (bar meters, dials, stacks, checks,
   grade meters, distribution + impact charts) when they scroll into view,
   driving the CSS width / conic / dash transitions in portfolio.css.
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nodes = [].slice.call(document.querySelectorAll("[data-viz]"));
  if (!nodes.length) return;

  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach(function (n) { n.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
  nodes.forEach(function (n) { io.observe(n); });
})();
