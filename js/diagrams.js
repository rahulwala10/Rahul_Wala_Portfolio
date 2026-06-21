/* =========================================================================
   Rahul Wala — Portfolio · small graphic injectors
   Adds a live blueprint node to each recognition row (kept out of the
   markup so the register stays easy to edit), and flags the rec grid
   in-view so the nodes pulse.
   ========================================================================= */
(function () {
  "use strict";
  var items = [].slice.call(document.querySelectorAll(".rec__item"));
  if (!items.length) return;

  items.forEach(function (it) {
    if (it.querySelector(".rec__node")) return;
    var node = document.createElement("span");
    node.className = "rec__node";
    node.setAttribute("aria-hidden", "true");
    it.insertBefore(node, it.firstChild);
  });
})();
