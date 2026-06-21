/* =========================================================================
   Rahul Wala — Portfolio · cosmic field
   A quiet starfield behind the whole page: parallax depth layers, slow
   twinkle, faint blueprint nebulae that breathe, and the occasional
   shooting star that traces a load path across the void.
   Sits at z-index 0 (behind the grain + every section). Honours
   prefers-reduced-motion by rendering a single static frame.
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "cosmos";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize); resize();

  /* ---- star field: three parallax depths ---- */
  var ACC = "120,160,255";          // blueprint blue glints
  var INK = "232,236,245";          // cold white
  var LAYERS = [
    { n: Math.round(W * H / 16000), depth: 0.18, sz: [0.4, 0.9], a: [0.10, 0.34] },
    { n: Math.round(W * H / 22000), depth: 0.42, sz: [0.6, 1.3], a: [0.16, 0.5] },
    { n: Math.round(W * H / 38000), depth: 0.85, sz: [0.9, 1.9], a: [0.28, 0.78] }
  ];
  var stars = [];
  LAYERS.forEach(function (L) {
    for (var i = 0; i < L.n; i++) {
      var blue = Math.random() < 0.22;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * (H * 1.0),
        r: L.sz[0] + Math.random() * (L.sz[1] - L.sz[0]),
        a0: L.a[0] + Math.random() * (L.a[1] - L.a[0]),
        depth: L.depth,
        tw: Math.random() * Math.PI * 2,           // twinkle phase
        tws: 0.6 + Math.random() * 1.4,            // twinkle speed
        c: blue ? ACC : INK
      });
    }
  });

  /* ---- nebulae: a few faint blueprint blooms that breathe ---- */
  var nebulae = [
    { x: 0.18, y: 0.22, r: 0.42, h: "120,160,255", a: 0.05, ph: 0 },
    { x: 0.82, y: 0.55, r: 0.5, h: "90,130,235", a: 0.045, ph: 2.1 },
    { x: 0.5, y: 0.9, r: 0.46, h: "140,120,235", a: 0.035, ph: 4.0 }
  ];

  /* ---- shooting stars ---- */
  var shots = [];
  var nextShot = 2200 + Math.random() * 4000;
  function spawnShot() {
    var fromLeft = Math.random() < 0.5;
    var y = Math.random() * H * 0.6;
    var ang = (fromLeft ? 1 : -1) * (0.18 + Math.random() * 0.16); // gentle slope
    var spd = 9 + Math.random() * 6;
    shots.push({
      x: fromLeft ? -40 : W + 40,
      y: y,
      vx: (fromLeft ? 1 : -1) * spd * Math.cos(ang),
      vy: spd * Math.sin(ang),
      life: 0, max: 60 + Math.random() * 30,
      len: 70 + Math.random() * 60
    });
  }

  /* ---- parallax inputs ---- */
  var scrollY = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  window.addEventListener("scroll", function () { scrollY = window.scrollY || window.pageYOffset || 0; }, { passive: true });
  window.addEventListener("mousemove", function (e) {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });

  function drawNebulae(t) {
    nebulae.forEach(function (nb) {
      var breathe = reduce ? 1 : 0.82 + 0.18 * Math.sin(t * 0.00018 + nb.ph);
      var cx = nb.x * W + cmx * 26 * 0.4;
      var cy = nb.y * H - (scrollY * 0.04 % H);
      var rad = nb.r * Math.min(W, H) * breathe;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, "rgba(" + nb.h + "," + (nb.a * breathe).toFixed(3) + ")");
      g.addColorStop(1, "rgba(" + nb.h + ",0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    drawNebulae(t);

    // stars
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var px = s.x + cmx * 30 * s.depth;
      // scroll parallax — wrap within viewport so the field is endless
      var py = s.y - (scrollY * s.depth * 0.16);
      py = ((py % H) + H) % H;
      px += cmy * 6 * s.depth;
      var tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.tws + s.tw);
      var a = s.a0 * tw;
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + s.c + "," + a.toFixed(3) + ")";
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      // brightest near stars get a faint cross glint
      if (s.depth > 0.8 && s.r > 1.4) {
        ctx.strokeStyle = "rgba(" + s.c + "," + (a * 0.5).toFixed(3) + ")";
        ctx.lineWidth = 0.5;
        var g = s.r * 2.6;
        ctx.beginPath();
        ctx.moveTo(px - g, py); ctx.lineTo(px + g, py);
        ctx.moveTo(px, py - g); ctx.lineTo(px, py + g);
        ctx.stroke();
      }
    }

    // shooting stars
    for (var j = shots.length - 1; j >= 0; j--) {
      var sh = shots[j];
      sh.x += sh.vx; sh.y += sh.vy; sh.life++;
      var k = sh.life / sh.max;
      var fade = k < 0.2 ? k / 0.2 : (1 - k) / 0.8;
      fade = Math.max(0, Math.min(1, fade));
      var tx = sh.x - sh.vx / Math.hypot(sh.vx, sh.vy) * sh.len;
      var ty = sh.y - sh.vy / Math.hypot(sh.vx, sh.vy) * sh.len;
      var grad = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
      grad.addColorStop(0, "rgba(" + ACC + ",0)");
      grad.addColorStop(1, "rgba(" + INK + "," + (0.6 * fade).toFixed(3) + ")");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sh.x, sh.y); ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + INK + "," + (0.8 * fade).toFixed(3) + ")";
      ctx.arc(sh.x, sh.y, 1.5, 0, Math.PI * 2); ctx.fill();
      if (sh.life >= sh.max || sh.x < -80 || sh.x > W + 80) shots.splice(j, 1);
    }
  }

  if (reduce) { draw(0); return; }

  var last = performance.now();
  function loop(ts) {
    var dt = ts - last; last = ts;
    cmx += (mx - cmx) * 0.04; cmy += (my - cmy) * 0.04;
    nextShot -= dt;
    if (nextShot <= 0) { spawnShot(); nextShot = 5000 + Math.random() * 8000; }
    draw(ts);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
