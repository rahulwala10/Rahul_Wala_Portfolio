/* =========================================================================
   Rahul Wala — Portfolio · interactive 3D structural frame (hero)
   Assembles bottom-up on load · drag to rotate (inertia) · idle auto-spin ·
   live load arrows · connection plates · scroll fade
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.querySelector(".hero__frame");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, mobileDim = 1;

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width || window.innerWidth; H = r.height || window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobileDim = window.innerWidth <= 680 ? 0.42 : 1;
  }
  window.addEventListener("resize", resize); resize();

  /* ---- geometry: 3 x 2 bay, 6-storey braced frame ---- */
  var BX = 3, BZ = 2, ST = 6, U = 1;
  var perFloor = (BX + 1) * (BZ + 1);
  function idx(ix, iy, iz) { return iy * perFloor + iz * (BX + 1) + ix; }
  var nodes = [];
  for (var iy = 0; iy <= ST; iy++)
    for (var iz = 0; iz <= BZ; iz++)
      for (var ix = 0; ix <= BX; ix++)
        nodes.push({ x: (ix - BX / 2) * U, y: (iy - ST / 2) * U, z: (iz - BZ / 2) * U });

  var edges = [];
  function add(a, b, k) { edges.push({ a: a, b: b, k: k, y: Math.min(nodes[a].y, nodes[b].y) }); }
  for (iy = 0; iy <= ST; iy++)
    for (iz = 0; iz <= BZ; iz++)
      for (ix = 0; ix <= BX; ix++) {
        if (iy < ST) add(idx(ix, iy, iz), idx(ix, iy + 1, iz), "col");
        if (ix < BX && iy > 0) add(idx(ix, iy, iz), idx(ix + 1, iy, iz), "beam");
        if (iz < BZ && iy > 0) add(idx(ix, iy, iz), idx(ix, iy, iz + 1), "beam");
      }
  // X-bracing, alternating bays/storeys on perimeter
  for (iy = 0; iy < ST; iy++) {
    var f = iy % 2 === 0;
    add(idx(0, iy, 0), idx(1, iy + 1, 0), "brace");
    add(idx(1, iy, 0), idx(0, iy + 1, 0), "brace");
    add(idx(BX, iy, BZ), idx(BX, iy + 1, BZ - 1), "brace");
    add(idx(BX, iy, BZ - 1), idx(BX, iy + 1, BZ), "brace");
    if (f) { add(idx(BX - 1, iy, 0), idx(BX, iy + 1, 0), "brace"); add(idx(BX, iy, 0), idx(BX - 1, iy + 1, 0), "brace"); }
  }
  // build order: bottom-up, columns first within a storey
  var rank = { col: 0, beam: 1, brace: 2 };
  edges.sort(function (e1, e2) { return (e1.y - e2.y) || (rank[e1.k] - rank[e2.k]); });
  var NE = edges.length;

  /* ---- view state ---- */
  var yaw = 0.6, pitch = -0.26, vYaw = 0, vPitch = 0;
  var dragging = false, lastX = 0, lastY = 0, lastT = 0, idle = 0;
  var touchMode = null, tStartX = 0, tStartY = 0;   // null | 'rotate' | 'scroll'
  var mx = 0, my = 0, cmx = 0, cmy = 0;
  var fade = 1, persp = 9;
  var progress = 0;            // assemble 0..1
  var hint = canvas.parentNode.querySelector(".hero__hint");

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });

  function down(e) {
    idle = 0;
    var p = e.touches ? e.touches[0] : e;
    lastX = p.clientX; lastY = p.clientY; lastT = performance.now();
    vYaw = vPitch = 0;
    if (e.touches) {
      // Touch: defer the rotate/scroll decision to the first move so a
      // vertical swipe passes straight through to the page (was a scroll-lock
      // on tablets — every touch over the hero hijacked the gesture).
      touchMode = null; tStartX = p.clientX; tStartY = p.clientY; dragging = false;
      return;
    }
    dragging = true;
    if (hint) hint.classList.add("gone");
    canvas.style.cursor = "grabbing";
  }
  function move(e) {
    var p = e.touches ? e.touches[0] : e;
    if (e.touches) {
      if (touchMode === null) {
        var adx = Math.abs(p.clientX - tStartX), ady = Math.abs(p.clientY - tStartY);
        if (adx < 10 && ady < 10) return;                  // too small to classify yet
        if (ady > adx) { touchMode = "scroll"; return; }   // vertical → let the page scroll
        touchMode = "rotate"; dragging = true;
        if (hint) hint.classList.add("gone");
        lastX = p.clientX; lastY = p.clientY; lastT = performance.now();
      }
      if (touchMode === "scroll") return;
    }
    if (!dragging) return;
    var now = performance.now(), dt = Math.max(16, now - lastT);
    var dx = p.clientX - lastX, dy = p.clientY - lastY;
    yaw += dx * 0.0095; pitch += dy * 0.006;
    pitch = Math.max(-0.85, Math.min(0.5, pitch));
    vYaw = dx * 0.0095 / dt * 16; vPitch = dy * 0.006 / dt * 16;
    lastX = p.clientX; lastY = p.clientY; lastT = now;
    if (e.cancelable && e.touches) e.preventDefault();
  }
  function up() { dragging = false; touchMode = null; canvas.style.cursor = "grab"; }

  // pointer target = the hero (so text doesn't block dragging the bg)
  var hitter = canvas.parentNode;
  hitter.addEventListener("mousedown", down);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  hitter.addEventListener("touchstart", down, { passive: true });
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", up);
  canvas.style.cursor = "grab";

  var fticking = false;
  window.addEventListener("scroll", function () {
    if (!fticking) {
      fticking = true;
      requestAnimationFrame(function () {
        fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
        fticking = false;
      });
    }
  }, { passive: true });

  function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c }; }
  function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c }; }

  var ACC = "104,150,255";   // blueprint blue, brightened for dark bg
  var INK = "225,232,245";   // light connection plates on dark

  function project() {
    var ry = yaw + cmx * 0.5, rx = pitch + cmy * 0.22;
    var s = Math.min(W * 0.5, H * 0.92) / ST;
    return nodes.map(function (n) {
      var p = rotY(n, ry); p = rotX(p, rx);
      var fp = persp / (persp - p.z);
      return { x: W * 0.6 + p.x * s * fp, y: H / 2 - p.y * s * fp, z: p.z };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var pts = project();
    var frac = progress * NE;

    // depth sort
    var order = edges.map(function (e, i) { return i; }).sort(function (i, j) {
      return ((pts[edges[i].a].z + pts[edges[i].b].z) - (pts[edges[j].a].z + pts[edges[j].b].z));
    });

    order.forEach(function (i) {
      if (i >= frac) return;                       // not yet assembled
      var e = edges[i];
      var a = pts[e.a], b = pts[e.b];
      var lead = frac - i;                          // 0..1 for the edge being drawn
      var bx = b.x, by = b.y;
      if (lead < 1) { bx = a.x + (b.x - a.x) * lead; by = a.y + (b.y - a.y) * lead; }
      var t = Math.max(0, Math.min(1, ((a.z + b.z) / 2 + 3) / 6));
      var al = Math.max(0.1, Math.min(0.96, 0.22 + 0.72 * t)) * fade;
      if (e.k === "brace") { ctx.strokeStyle = "rgba(" + ACC + "," + (al * 0.62) + ")"; ctx.setLineDash([5, 5]); }
      else { ctx.strokeStyle = "rgba(" + ACC + "," + al + ")"; ctx.setLineDash([]); }
      ctx.lineWidth = (e.k === "col" ? 2.0 : 1.4) * (0.6 + 0.7 * t);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(bx, by); ctx.stroke();
    });
    ctx.setLineDash([]);

    // connection plates (only on assembled nodes near top of build)
    if (progress > 0.4) {
      pts.forEach(function (p, ni) {
        var t = Math.max(0, Math.min(1, (p.z + 3) / 6));
        var sz = 2.2 * (0.6 + 0.7 * t);
        ctx.fillStyle = "rgba(" + INK + "," + ((0.12 + 0.4 * t) * fade) + ")";
        ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
      });
    }

    // live load arrows on roof once built
    if (progress > 0.92) {
      var pulse = 0.5 + 0.5 * Math.sin(performance.now() / 600);
      var roofY = -1e9, top = [];
      pts.forEach(function (p, ni) { if (nodes[ni].y === ST / 2) top.push(p); });
      top.forEach(function (p) {
        var a = (0.5 + 0.4 * pulse) * fade;
        ctx.strokeStyle = "rgba(" + ACC + "," + a + ")";
        ctx.lineWidth = 1.4;
        var len = 22 + 6 * pulse;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - len); ctx.lineTo(p.x, p.y - 5);
        ctx.moveTo(p.x - 4, p.y - 11); ctx.lineTo(p.x, p.y - 5); ctx.lineTo(p.x + 4, p.y - 11);
        ctx.stroke();
      });
    }
  }

  var t0 = null;
  function loop(ts) {
    if (t0 === null) t0 = ts;
    if (reduce) { progress = 1; } else if (progress < 1) {
      progress = Math.min(1, (ts - t0) / 2400);
      progress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2; // easeInOut
    }
    // inertia + idle auto-spin
    if (!dragging) {
      yaw += vYaw; pitch += vPitch;
      pitch = Math.max(-0.85, Math.min(0.5, pitch));
      vYaw *= 0.94; vPitch *= 0.92;
      idle += 16;
      if (Math.abs(vYaw) < 0.0008 && idle > 1400 && !reduce) yaw += 0.0016; // resume gentle spin
    }
    cmx += (mx - cmx) * 0.045; cmy += (my - cmy) * 0.045;
    canvas.style.opacity = (fade * mobileDim).toFixed(3);
    if (fade > 0.015) draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // auto-hide hint after a while even without interaction
  if (hint) setTimeout(function () { hint.classList.add("dim"); }, 6000);
})();

/* =========================================================================
   Contact — slowly rotating 3D Warren truss (lightweight)
   ========================================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.querySelector(".contact__frame");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0, vis = false;

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width || 1; H = r.height || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize); resize();

  // Warren truss: bottom chord, top chord, diagonals — built as 3D nodes
  var bays = 6, U = 1;
  var nodes = [], edges = [];
  for (var i = 0; i <= bays; i++) {
    nodes.push({ x: (i - bays / 2) * U, y: -0.5, z: 0 });        // bottom chord
    nodes.push({ x: (i - bays / 2) * U + 0.5, y: 0.5, z: 0 });   // top chord (offset)
  }
  function bi(i) { return i * 2; }      // bottom node index
  function ti(i) { return i * 2 + 1; }  // top node index
  for (i = 0; i < bays; i++) {
    edges.push([bi(i), bi(i + 1)]);     // bottom chord
    if (i < bays) edges.push([ti(i), ti(i + 1 <= bays ? i + 1 : i)]);
    edges.push([bi(i), ti(i)]);         // diagonal up
    edges.push([ti(i), bi(i + 1)]);     // diagonal down
  }
  // top chord continuous
  for (i = 0; i < bays; i++) edges.push([ti(i), ti(i + 1)]);

  var rot = 0, mx = 0, cmx = 0;
  window.addEventListener("mousemove", function (e) { mx = e.clientX / window.innerWidth - 0.5; });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (ents) { vis = ents[0].isIntersecting; }, { threshold: 0.02 })
      .observe(canvas);
  } else { vis = true; }

  function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c }; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var s = Math.min(W / (bays + 2), H / 2.4);
    var d = 8, ry = 0.5 + rot + cmx * 0.6;
    var pts = nodes.map(function (n) {
      var p = rotY(n, ry);
      var f = d / (d - p.z);
      return { x: W * 0.5 + p.x * s * f, y: H * 0.5 - p.y * s * f, z: p.z };
    });
    edges.forEach(function (e) {
      var a = pts[e[0]], b = pts[e[1]];
      var t = Math.max(0, Math.min(1, ((a.z + b.z) / 2 + 1.5) / 3));
      ctx.strokeStyle = "rgba(120,150,235," + (0.18 + 0.5 * t) + ")";
      ctx.lineWidth = 0.8 + 1.1 * t;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
    pts.forEach(function (p) {
      var t = Math.max(0, Math.min(1, (p.z + 1.5) / 3));
      ctx.fillStyle = "rgba(150,175,240," + (0.2 + 0.5 * t) + ")";
      ctx.fillRect(p.x - 1.6, p.y - 1.6, 3.2, 3.2);
    });
  }

  function loop() {
    cmx += (mx - cmx) * 0.04;
    if (!reduce) rot += 0.0035;
    if (vis) draw();
    requestAnimationFrame(loop);
  }
  if (reduce) draw(); else loop();
})();
