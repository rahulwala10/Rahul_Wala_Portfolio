/* =========================================================================
   Rahul Wala — Portfolio · structural motion layer
   Live-sagging beam dividers · split-text reveals · staggered groups ·
   scroll-linked load gauges
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* ---------------- split text into line/word spans for staggered reveal ---------------- */
  (function () {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var mode = el.getAttribute("data-split") || "word";
      var html = el.innerHTML;
      // only handle plain text + <i>/<b> by walking child nodes
      var frag = document.createDocumentFragment();
      var i = 0;
      function wrapWords(node, target) {
        var words = node.textContent.split(/(\s+)/);
        words.forEach(function (w) {
          if (/^\s+$/.test(w) || w === "") { target.appendChild(document.createTextNode(w)); return; }
          var span = document.createElement("span");
          span.className = "w";
          span.style.setProperty("--wi", i++);
          span.textContent = w;
          target.appendChild(span);
        });
      }
      [].slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) { wrapWords(node, frag); }
        else {
          var clone = node.cloneNode(false);
          [].slice.call(node.childNodes).forEach(function (n2) {
            if (n2.nodeType === 3) wrapWords(n2, clone); else clone.appendChild(n2.cloneNode(true));
          });
          frag.appendChild(clone);
        }
      });
      el.innerHTML = "";
      el.appendChild(frag);
      el.classList.add("split-ready");
    });
  })();

  /* ---------------- auto-stagger children of [data-stagger] ---------------- */
  (function () {
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var kids = [].slice.call(group.children);
      kids.forEach(function (k, idx) {
        k.classList.add("st-item");
        k.style.setProperty("--si", idx);
      });
    });
  })();

  /* ---------------- generic IO reveal for split + stagger + dims ---------------- */
  (function () {
    var targets = [].slice.call(document.querySelectorAll(".split-ready, [data-stagger], [data-beam], [data-gauge], .exp__storey"));
    if (!targets.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ---------------- build + live-sag beam dividers ---------------- */
  var beams = [];
  (function () {
    document.querySelectorAll("[data-beam]").forEach(function (host) {
      var label = host.getAttribute("data-beam") || "";
      var nArrows = parseInt(host.getAttribute("data-arrows"), 10) || 7;
      var VW = 1000, VH = 120, m = 60, span = VW - m * 2, baseY = 46;

      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 " + VW + " " + VH);
      svg.setAttribute("preserveAspectRatio", "none");
      svg.setAttribute("class", "beam__svg");

      // load arrows (drop in)
      var arrows = document.createElementNS(NS, "g");
      arrows.setAttribute("class", "beam__loads");
      var arrowXs = [];
      for (var a = 0; a <= nArrows; a++) {
        var ax = m + (span * a) / nArrows;
        arrowXs.push(ax);
        var ln = document.createElementNS(NS, "path");
        ln.setAttribute("d", "M" + ax + " 8 L" + ax + " 30 M" + (ax - 4) + " 24 L" + ax + " 30 L" + (ax + 4) + " 24");
        ln.setAttribute("class", "beam__arrow");
        ln.style.setProperty("--ai", a);
        arrows.appendChild(ln);
      }
      svg.appendChild(arrows);

      // top load line
      var topline = document.createElementNS(NS, "line");
      topline.setAttribute("x1", m); topline.setAttribute("y1", 8);
      topline.setAttribute("x2", VW - m); topline.setAttribute("y2", 8);
      topline.setAttribute("class", "beam__topline");
      svg.appendChild(topline);

      // the beam path (deflects)
      var beam = document.createElementNS(NS, "path");
      beam.setAttribute("class", "beam__line");
      svg.appendChild(beam);

      // supports (pin triangles) at both ends
      [m, VW - m].forEach(function (sx, k) {
        var tri = document.createElementNS(NS, "path");
        tri.setAttribute("d", "M" + sx + " " + baseY + " L" + (sx - 11) + " " + (baseY + 20) + " L" + (sx + 11) + " " + (baseY + 20) + " Z");
        tri.setAttribute("class", "beam__support");
        svg.appendChild(tri);
        // hatching under support
        var hatch = document.createElementNS(NS, "path");
        var hx = sx - 14, hd = "";
        for (var h = 0; h < 6; h++) { hd += "M" + (hx + h * 5) + " " + (baseY + 20) + " l -6 6 "; }
        hatch.setAttribute("d", hd);
        hatch.setAttribute("class", "beam__hatch");
        svg.appendChild(hatch);
      });

      // dimension label
      if (label) {
        var txt = document.createElementNS(NS, "text");
        txt.setAttribute("x", VW / 2); txt.setAttribute("y", baseY + 46);
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("class", "beam__label");
        txt.textContent = label;
        svg.appendChild(txt);
      }

      // section-break caption — make the divider clearly read as a transition
      var next = host.getAttribute("data-next") || "";
      var brk = document.createElement("div");
      brk.className = "beam__brk";
      var tag = document.createElement("span"); tag.className = "beam__brk-tag"; tag.textContent = "Section Break";
      var rule = document.createElement("span"); rule.className = "beam__brk-rule";
      brk.appendChild(tag); brk.appendChild(rule);
      if (next) {
        var nx = document.createElement("span"); nx.className = "beam__brk-next";
        nx.innerHTML = '<span class="ar">\u2193</span> Next \u2014 ' + next;
        brk.appendChild(nx);
      }
      host.appendChild(brk);
      host.appendChild(svg);

      var maxSag = parseFloat(host.getAttribute("data-sag")) || 26;
      var loads = arrowXs.map(function (ax) { return { a: (ax - m) / span, mag: 0, target: 0 }; });
      var bobj = {
        host: host, path: beam, m: m, span: span, baseY: baseY, maxSag: maxSag, VW: VW, VH: VH,
        loads: loads, udl: 0, cursor: { a: 0.5, aT: 0.5, mag: 0, target: 0 }, arrows: arrows, arrowXs: arrowXs
      };

      // full-area capture rect → a roaming point-load tracks the cursor anywhere near the beam
      var capture = document.createElementNS(NS, "rect");
      capture.setAttribute("x", 0); capture.setAttribute("y", 0);
      capture.setAttribute("width", VW); capture.setAttribute("height", VH);
      capture.setAttribute("fill", "transparent");
      capture.setAttribute("class", "beam__hit");
      svg.appendChild(capture);

      function onMove(e) {
        var p = e.touches ? e.touches[0] : e;
        var r = svg.getBoundingClientRect();
        var xVB = ((p.clientX - r.left) / r.width) * VW;
        var a = (xVB - m) / span;
        a = Math.max(0.04, Math.min(0.96, a));
        var cy = (p.clientY - r.top) / r.height;
        var prox = 1 - Math.min(1, Math.abs(cy - 0.4) / 0.75);
        bobj.cursor.aT = a;
        bobj.cursor.target = 0.4 + 0.6 * Math.max(0, prox);
        var best = 0, bd = 1e9;
        bobj.arrowXs.forEach(function (ax, li) { var d = Math.abs(ax - xVB); if (d < bd) { bd = d; best = li; } });
        for (var k = 0; k < bobj.arrows.children.length; k++) bobj.arrows.children[k].classList.toggle("on", k === best);
      }
      function onLeave() {
        bobj.cursor.target = 0;
        for (var k = 0; k < bobj.arrows.children.length; k++) bobj.arrows.children[k].classList.remove("on");
      }
      svg.addEventListener("mousemove", onMove);
      svg.addEventListener("mouseleave", onLeave);
      svg.addEventListener("touchmove", function (e) { onMove(e); }, { passive: true });
      svg.addEventListener("touchend", onLeave);

      beams.push(bobj);
      setPath(bobj);
    });
  })();

  function ptInfluence(t, a) {
    // simply-supported beam point-load deflection shape, normalized to peak 1 at x=a
    var b1 = 1 - a;
    function raw(x) { return x <= a ? b1 * x * (1 - b1 * b1 - x * x) : a * (1 - x) * (1 - a * a - (1 - x) * (1 - x)); }
    var peak = raw(a);
    if (peak <= 1e-6) return 0;
    var v = raw(t) / peak;
    return v < 0 ? 0 : v;
  }

  function setPath(b) {
    var pts = 48, d = "", maxPoint = 44;
    for (var i = 0; i <= pts; i++) {
      var t = i / pts;
      var x = b.m + b.span * t;
      var udlShape = 16 * t * t * (1 - t) * (1 - t);   // 0 at ends, 1 at mid
      var y = b.baseY + b.udl * udlShape;
      for (var li = 0; li < b.loads.length; li++) {
        var ld = b.loads[li];
        if (ld.mag > 0.001) y += maxPoint * ld.mag * ptInfluence(t, ld.a);
      }
      if (b.cursor && b.cursor.mag > 0.001) y += 54 * b.cursor.mag * ptInfluence(t, b.cursor.a);
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    b.path.setAttribute("d", d);
  }

  (function () {
    if (!beams.length) return;
    if (reduce) { beams.forEach(function (b) { b.udl = b.maxSag * 0.6; setPath(b); }); return; }
    var udlTargets = beams.map(function () { return 0; });
    var ticking = false;
    function onScroll() {
      var vh = window.innerHeight;
      beams.forEach(function (b, i) {
        var r = b.host.getBoundingClientRect();
        var center = r.top + r.height / 2;
        var dist = Math.abs(center - vh / 2) / (vh / 2);
        var k = Math.max(0, 1 - dist);
        k = k * k * (3 - 2 * k);
        udlTargets[i] = b.maxSag * k;
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    function anim() {
      beams.forEach(function (b, i) {
        b.udl += (udlTargets[i] - b.udl) * 0.12;
        b.loads.forEach(function (ld) { ld.mag += (ld.target - ld.mag) * 0.16; });
        if (b.cursor) {
          b.cursor.a += (b.cursor.aT - b.cursor.a) * 0.25;
          b.cursor.mag += (b.cursor.target - b.cursor.mag) * 0.18;
        }
        setPath(b);
      });
      requestAnimationFrame(anim);
    }
    anim();
  })();

  /* ---------------- scroll-linked load gauges (vertical fill bars) ---------------- */
  (function () {
    var gauges = [].slice.call(document.querySelectorAll("[data-gauge]"));
    if (!gauges.length || reduce) { gauges.forEach(function (g) { var f = g.querySelector(".gauge__fill"); if (f) f.style.height = "60%"; }); return; }
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      gauges.forEach(function (g) {
        var r = g.getBoundingClientRect();
        var p = 1 - (r.top + r.height / 2 - vh * 0.2) / (vh * 0.8);
        p = Math.max(0, Math.min(1, p));
        var fill = g.querySelector(".gauge__fill");
        var val = g.querySelector(".gauge__val");
        if (fill) fill.style.height = (p * 100).toFixed(1) + "%";
        if (val) val.textContent = Math.round(p * 100) + "%";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ---------------- register rows: incremental stagger on reveal ---------------- */
  (function () {
    var rows = [].slice.call(document.querySelectorAll(".reg__row"));
    rows.forEach(function (r, i) { r.style.setProperty("--ri", i % 6); });
  })();

  /* ---------------- experience spine grows with scroll ---------------- */
  (function () {
    var rail = document.querySelector(".exp__rail");
    var spine = document.querySelector(".exp__spine");
    if (!rail || !spine) return;
    var ticking = false;
    function update() {
      var r = rail.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when rail top hits mid-viewport, 1 when rail bottom passes mid-viewport
      var start = vh * 0.5;
      var p = (start - r.top) / (r.height);
      p = Math.max(0, Math.min(1, p));
      spine.style.setProperty("--grow", (p * 100).toFixed(1) + "%");
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();
})();
