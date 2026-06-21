/* =========================================================================
   Rahul Wala — Portfolio · project & AI background motion
   A slowly rotating 3D structural wireframe sits behind each project (a
   different motif per sector) and a drifting 3D lattice behind the AI band.
   Renders only while on-screen · cursor adds a touch of parallax.
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ACC = "104,150,255";

  /* ---------------- tiny 3D helpers ---------------- */
  function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c }; }
  function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c }; }

  /* ---------------- structural geometries (per motif) ---------------- */
  function frame(nx, ny, nz) {            // braced multi-bay building skeleton
    var N = [], E = [];
    function id(ix, iy, iz) { return iy * (nx + 1) * (nz + 1) + iz * (nx + 1) + ix; }
    for (var iy = 0; iy <= ny; iy++)
      for (var iz = 0; iz <= nz; iz++)
        for (var ix = 0; ix <= nx; ix++)
          N.push({ x: ix - nx / 2, y: iy - ny / 2, z: iz - nz / 2 });
    for (iy = 0; iy <= ny; iy++)
      for (iz = 0; iz <= nz; iz++)
        for (ix = 0; ix <= nx; ix++) {
          if (iy < ny) E.push([id(ix, iy, iz), id(ix, iy + 1, iz)]);
          if (ix < nx && iy > 0) E.push([id(ix, iy, iz), id(ix + 1, iy, iz)]);
          if (iz < nz && iy > 0) E.push([id(ix, iy, iz), id(ix, iy, iz + 1)]);
        }
    for (iy = 0; iy < ny; iy++) { E.push([id(0, iy, 0), id(1, iy + 1, 0)]); E.push([id(nx, iy, nz), id(nx - 1, iy + 1, nz)]); }
    return { N: N, E: E, s: 1 };
  }

  function pitchedTruss(bays) {           // duo-pitch / glulam style truss
    var N = [], E = [], i;
    for (i = 0; i <= bays; i++) {
      N.push({ x: i - bays / 2, y: -0.7, z: 0 });                                  // bottom chord
      var rise = 1.1 * (1 - Math.abs(i - bays / 2) / (bays / 2));
      N.push({ x: i - bays / 2, y: -0.7 + 0.4 + rise, z: 0 });                     // top chord (apex)
    }
    function b(i) { return i * 2; } function t(i) { return i * 2 + 1; }
    for (i = 0; i < bays; i++) {
      E.push([b(i), b(i + 1)]); E.push([t(i), t(i + 1)]);
      E.push([b(i), t(i)]); E.push([t(i), b(i + 1)]);
    }
    E.push([b(bays), t(bays)]);
    // give it depth (two parallel trusses)
    var N2 = [], E2 = [], n = N.length;
    N.forEach(function (p) { N2.push({ x: p.x, y: p.y, z: -0.7 }); });
    N.forEach(function (p) { N2.push({ x: p.x, y: p.y, z: 0.7 }); });
    E.forEach(function (e) { E2.push([e[0], e[1]]); E2.push([e[0] + n, e[1] + n]); });
    for (i = 0; i < n; i++) E2.push([i, i + n]);
    return { N: N2, E: E2, s: 1 };
  }

  function padGrid(nx, nz) {              // foundation pad layout on the ground plane
    var N = [], E = [], SQ = [];
    function id(ix, iz) { return iz * (nx + 1) + ix; }
    for (var iz = 0; iz <= nz; iz++)
      for (var ix = 0; ix <= nx; ix++) { N.push({ x: ix - nx / 2, y: 0, z: iz - nz / 2 }); SQ.push(id(ix, iz)); }
    for (iz = 0; iz <= nz; iz++)
      for (ix = 0; ix <= nx; ix++) {
        if (ix < nx) E.push([id(ix, iz), id(ix + 1, iz)]);
        if (iz < nz) E.push([id(ix, iz), id(ix, iz + 1)]);
      }
    return { N: N, E: E, s: 1.1, sq: SQ, tiltLock: true };
  }

  function beamGrid(nx, nz) {             // primary + secondary beam slab grid
    var g = padGrid(nx, nz);
    g.sq = null; g.tiltLock = false;
    // lift alternate lines to suggest tee-beams
    g.N.forEach(function (p, i) { p.y = (i % 3 === 0) ? 0.18 : 0; });
    return g;
  }

  var BUILDERS = [
    function () { return frame(3, 4, 1); },
    function () { return pitchedTruss(6); },
    function () { return padGrid(4, 3); },
    function () { return beamGrid(5, 3); }
  ];

  /* ---------------- renderer ---------------- */
  function makeRenderer(canvas, geo, opt) {
    opt = opt || {};
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 1, H = 1;
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    var yaw = opt.yaw0 || 0.5, pitch = opt.pitch0 || -0.22, t = Math.random() * 6;

    function draw(mx, my) {
      ctx.clearRect(0, 0, W, H);
      var ry = yaw + mx * 0.25;
      var rx = pitch + (opt.tiltLock ? 0 : Math.sin(t * 0.4) * 0.12) + my * 0.12;
      var s = Math.min(W, H) / (opt.span || 6);
      var d = 9;
      var pts = geo.N.map(function (n) {
        var p = rotY(n, ry); p = rotX(p, rx);
        var f = d / (d - p.z);
        return { x: W * 0.5 + n.x * 0 + p.x * s * f * geo.s, y: H * 0.5 - p.y * s * f * geo.s, z: p.z };
      });
      geo.E.forEach(function (e) {
        var a = pts[e[0]], b = pts[e[1]];
        var zt = Math.max(0, Math.min(1, ((a.z + b.z) / 2 + 2.5) / 5));
        ctx.strokeStyle = "rgba(" + ACC + "," + (0.1 + 0.4 * zt) + ")";
        ctx.lineWidth = 0.6 + 0.9 * zt;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      if (geo.sq) {
        geo.sq.forEach(function (i) {
          var p = pts[i]; var zt = Math.max(0, Math.min(1, (p.z + 2.5) / 5));
          var w = 3 + 4 * zt;
          ctx.fillStyle = "rgba(" + ACC + "," + (0.12 + 0.4 * zt) + ")";
          ctx.fillRect(p.x - w / 2, p.y - w / 2, w, w);
        });
      } else {
        pts.forEach(function (p) {
          var zt = Math.max(0, Math.min(1, (p.z + 2.5) / 5));
          ctx.fillStyle = "rgba(" + ACC + "," + (0.1 + 0.35 * zt) + ")";
          ctx.fillRect(p.x - 1.4, p.y - 1.4, 2.8, 2.8);
        });
      }
    }

    return {
      canvas: canvas, resize: resize,
      step: function (mx, my, dt) { if (!reduce) { yaw += (opt.spin || 0.0024); t += dt; } draw(mx, my); },
      drawStatic: function () { draw(0, 0); }
    };
  }

  /* ---------------- AI lattice (graph-like, evokes a model) ---------------- */
  function aiLattice() {
    var N = [], E = [], i, j, n = 30;
    for (i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 * 3;
      N.push({ x: Math.cos(a) * (1.4 + 0.6 * Math.sin(i * 1.7)), y: (i / n - 0.5) * 3.2, z: Math.sin(a) * (1.4 + 0.6 * Math.cos(i * 1.3)) });
    }
    for (i = 0; i < n; i++) {
      var dists = [];
      for (j = 0; j < n; j++) if (j !== i) {
        var dx = N[i].x - N[j].x, dy = N[i].y - N[j].y, dz = N[i].z - N[j].z;
        dists.push([dx * dx + dy * dy + dz * dz, j]);
      }
      dists.sort(function (p, q) { return p[0] - q[0]; });
      for (var k = 0; k < 2; k++) if (i < dists[k][1]) E.push([i, dists[k][1]]);
    }
    return { N: N, E: E, s: 1 };
  }

  /* ---------------- wire up all canvases under one loop ---------------- */
  var renderers = [];
  document.querySelectorAll(".proj__bg").forEach(function (cv) {
    var m = parseInt(cv.getAttribute("data-motif"), 10) || 0;
    var geo = BUILDERS[m % BUILDERS.length]();
    renderers.push({ r: makeRenderer(cv, geo, { span: 6.4, spin: m % 2 ? -0.0022 : 0.0026, tiltLock: geo.tiltLock, pitch0: geo.tiltLock ? -0.62 : -0.2 }), vis: false, el: cv });
  });
  var aiCanvas = document.querySelector(".ai__frame");
  if (aiCanvas) renderers.push({ r: makeRenderer(aiCanvas, aiLattice(), { span: 5.2, spin: 0.0016, pitch0: -0.15 }), vis: false, el: aiCanvas });

  if (!renderers.length) return;

  window.addEventListener("resize", function () { renderers.forEach(function (o) { o.r.resize(); }); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        var o = renderers.find(function (r) { return r.el === en.target; });
        if (o) o.vis = en.isIntersecting;
      });
    }, { threshold: 0.02 });
    renderers.forEach(function (o) { io.observe(o.el); });
  } else { renderers.forEach(function (o) { o.vis = true; }); }

  var mx = 0, my = 0;
  window.addEventListener("mousemove", function (e) { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; });

  if (reduce) { renderers.forEach(function (o) { o.r.drawStatic(); }); return; }

  var last = performance.now();
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    renderers.forEach(function (o) { if (o.vis) o.r.step(mx, my, dt); });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
