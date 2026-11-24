/* ════════════════════════════════════════════════════════════════════
   SCENES 3D
   • hero()          — three.js "Shattered Memoria": an arched pane of
                       remembered night, broken by an impact and left
                       suspended in the air. Each fragment carries its
                       piece of the image. Hover to read a memory, click
                       to scatter, double-click / hold to remember.
   • bloom()         — a fixed, site-wide layer of red, four-petal-belled
                       jellyfish that drift and pulse freely behind every
                       section.
   • constellation() — projects as stars on three tilted orbits, drawn as
                       a full-section living sky (2D-canvas 3D projection).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PETAL_D = 'M0 -4 C 14 -14, 18 -34, 0 -47 C -18 -34, -14 -14, 0 -4 Z';

  function webglOK() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function makeGlowTex(T) {
    return function (inner, outer) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new T.CanvasTexture(c);
    };
  }

  /* ── fracture: Voronoi cells of an arched pane, seeded on jittered rings
        around an off-centre impact (small splinters at the impact, broad
        plates at the rim) ── */
  function clipHalf(poly, nx, ny, c) {
    var out = [], n = poly.length;
    for (var k = 0; k < n; k++) {
      var a = poly[k], b = poly[(k + 1) % n], da = nx * a.x + ny * a.y - c, db = nx * b.x + ny * b.y - c;
      if (da <= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) { var t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); }
    }
    return out;
  }
  function shatterPane(rnd, PW, PH, IMP) {
    var AR = PW / 2, Y0 = -PH / 2, YS = PH / 2 - AR, pane = [{ x: -AR, y: Y0 }, { x: AR, y: Y0 }];
    for (var i = 0; i <= 24; i++) { var a = i / 24 * Math.PI; pane.push({ x: Math.cos(a) * AR, y: YS + Math.sin(a) * AR }); }
    function inside(p) { return p.y > Y0 + 0.04 && Math.abs(p.x) < AR - 0.04 && (p.y < YS || Math.hypot(p.x, p.y - YS) < AR - 0.04); }
    var seeds = [{ x: IMP.x, y: IMP.y }], RADII = [0.2, 0.46, 0.82, 1.24, 1.74, 2.32, 2.95];
    RADII.forEach(function (R, ri) {
      var n = ri < 2 ? 7 : 10;
      for (var k = 0; k < n; k++) {
        var ang = (k + 0.5 * (ri % 2) + (rnd() - 0.5) * 0.55) / n * Math.PI * 2, rr = R * (0.86 + rnd() * 0.28);
        var p = { x: IMP.x + Math.cos(ang) * rr, y: IMP.y + Math.sin(ang) * rr };
        if (inside(p)) seeds.push(p);
      }
    });
    var cells = [];
    seeds.forEach(function (s, i) {
      var poly = pane.slice();
      for (var j = 0; j < seeds.length && poly.length > 2; j++) {
        if (j === i) continue;
        var o = seeds[j], nx = o.x - s.x, ny = o.y - s.y;
        poly = clipHalf(poly, nx, ny, nx * (s.x + o.x) / 2 + ny * (s.y + o.y) / 2);
      }
      if (poly.length < 3) return;
      var A = 0, cx = 0, cy = 0;
      for (var k = 0; k < poly.length; k++) { var p = poly[k], q = poly[(k + 1) % poly.length], cr = p.x * q.y - q.x * p.y; A += cr; cx += (p.x + q.x) * cr; cy += (p.y + q.y) * cr; }
      A /= 2; if (Math.abs(A) < 0.004) return;
      cx /= 6 * A; cy /= 6 * A;
      cells.push({ poly: poly, area: Math.abs(A), cx: cx, cy: cy, d: Math.hypot(cx - IMP.x, cy - IMP.y) });
    });
    return { cells: cells, AR: AR, Y0: Y0, YS: YS };
  }

  /* the remembered night painted into the pane */
  function paintMemory(c) {
    var W = c.width, H = c.height, g = c.getContext('2d'), r = mulberry(11);
    var bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#3d0819'); bg.addColorStop(0.5, '#16040c'); bg.addColorStop(1, '#060207');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var mx = W * 0.6, my = H * 0.3, mr = W * 0.2;
    var hz = g.createRadialGradient(mx, my, 0, mx, my, W * 0.75);
    hz.addColorStop(0, 'rgba(255,90,130,.38)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hz; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 260; i++) { g.fillStyle = 'rgba(255,220,230,' + (0.2 + r() * 0.7).toFixed(2) + ')'; g.beginPath(); g.arc(r() * W, r() * H * 0.72, r() * 1.7 + 0.3, 0, 6.283); g.fill(); }
    var halo = g.createRadialGradient(mx, my, mr * 0.9, mx, my, mr * 1.9);
    halo.addColorStop(0, 'rgba(255,143,184,.45)'); halo.addColorStop(1, 'rgba(255,143,184,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(mx, my, mr * 1.9, 0, 6.283); g.fill();
    var mg = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    mg.addColorStop(0, '#fff4f7'); mg.addColorStop(0.7, '#ffc1d6'); mg.addColorStop(1, '#ff8fb8');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();
    // sea + the moon's broken reflection
    var sy = H * 0.74, sea = g.createLinearGradient(0, sy, 0, H);
    sea.addColorStop(0, '#1d0711'); sea.addColorStop(1, '#040103');
    g.fillStyle = sea; g.fillRect(0, sy, W, H - sy);
    g.fillStyle = 'rgba(255,143,184,.5)'; g.fillRect(0, sy, W, 1.5);
    for (i = 0; i < 34; i++) {
      var yy = sy + 6 + i * i * 0.2, ww = mr * 1.3 * (1 - i / 34) * (0.45 + r() * 0.6);
      g.fillStyle = 'rgba(255,193,214,' + (0.55 * (1 - i / 34)).toFixed(2) + ')';
      g.fillRect(mx - ww / 2 + (r() - 0.5) * 24, yy, ww, 2);
    }
    // Evernight's black four-petal flower, silhouetted against the moon
    var path = new Path2D(PETAL_D), fs = W * 0.19 / 47;
    g.save(); g.translate(W * 0.42, H * 0.45); g.rotate(0.3);
    for (var k = 0; k < 4; k++) {
      g.save(); g.rotate(k * Math.PI / 2 + Math.PI / 4); g.scale(fs, fs);
      g.fillStyle = '#070205'; g.fill(path); g.lineWidth = 1.4; g.strokeStyle = 'rgba(200,32,63,.95)'; g.stroke(path);
      g.restore();
    }
    g.fillStyle = '#c8203f'; g.beginPath(); g.arc(0, 0, fs * 5, 0, 6.283); g.fill();
    g.restore();
    // drifting petals
    for (i = 0; i < 9; i++) {
      g.save(); g.translate(r() * W, H * 0.1 + r() * H * 0.6); g.rotate(r() * 6.28); g.scale(fs * 0.22, fs * 0.22);
      g.fillStyle = '#0a0306'; g.fill(path); g.lineWidth = 3; g.strokeStyle = 'rgba(200,32,63,.8)'; g.stroke(path); g.restore();
    }
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,193,214,.88)';
    g.font = 'italic 46px "Cormorant Garamond", Georgia, serif';
    g.fillText('Even the longest night', W / 2, H * 0.875);
    g.fillText('keeps its stars.', W / 2, H * 0.875 + 52);
    // inner arch frame
    g.strokeStyle = 'rgba(255,143,184,.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(18, H - 18); g.lineTo(18, W / 2); g.arc(W / 2, W / 2, W / 2 - 18, Math.PI, 0); g.lineTo(W - 18, H - 18); g.closePath(); g.stroke();
  }

  /* ═══════════════════════ HERO: SHATTERED MEMORIA ═══════════════════════ */
  function hero(canvas, memories, tipEl, onOpen, opts) {
    opts = opts || {};
    if (!window.THREE || !webglOK()) return null;
    var T = window.THREE;
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);
    var glowTex = makeGlowTex(T);
    var dotTex = glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,.35)');
    var sparkTex = glowTex('rgba(255,193,214,1)', 'rgba(255,143,184,.4)');
    var rnd = mulberry(20251123);

    /* ── the memory image ── */
    var PW = 2.5, PH = 3.5, IMP = { x: 0.32, y: 0.38 };
    var memCanvas = document.createElement('canvas'); memCanvas.width = 720; memCanvas.height = 1008;
    paintMemory(memCanvas);
    var memTex = new T.CanvasTexture(memCanvas);
    memTex.minFilter = T.LinearFilter; memTex.generateMipmaps = false;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintMemory(memCanvas); memTex.needsUpdate = true; });

    /* ── glass shader: fresnel rim + the image (slight chromatic split) + a
          travelling specular sweep, the light crossing cutscene glass ── */
    var SV = [
      'varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW;',
      'void main(){',
      '  vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;',
      '  vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * normal); vV = -mv.xyz;',
      '  gl_Position = projectionMatrix * mv;',
      '}'].join('\n');
    var SF = [
      'uniform sampler2D uMap; uniform float uTime; uniform float uGlow; uniform float uHover; uniform float uWhole; uniform vec3 uRim;',
      'varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vW;',
      'void main(){',
      '  vec3 n = normalize(vN), v = normalize(vV);',
      '  float f = pow(1.0 - abs(dot(n, v)), 2.0);',
      '  vec2 off = vec2(0.003 + uHover * 0.009, 0.0);',
      '  vec3 img = vec3(texture2D(uMap, vUv + off).r, texture2D(uMap, vUv).g, texture2D(uMap, vUv - off).b);',
      '  float sweep = pow(max(0.0, sin((vW.x * 0.55 + vW.y * 0.8) * 1.7 - uTime * 0.7 + n.x * 2.4 + n.y * 1.6)), 28.0);',
      '  float lum = 0.5 + 0.4 * uWhole + 0.4 * uHover;',
      '  vec3 col = img * lum + uRim * f * 0.8 + vec3(1.0, 0.82, 0.88) * sweep * (0.5 + uHover * 0.7);',
      '  float a = (0.6 + f * 0.5 + sweep * 0.6) * uGlow;',
      '  gl_FragColor = vec4(col, a);',
      '}'].join('\n');
    function faceMat(rim) {
      return new T.ShaderMaterial({
        uniforms: { uMap: { value: memTex }, uTime: { value: 0 }, uGlow: { value: 0 }, uHover: { value: 0 }, uWhole: { value: 1 }, uRim: { value: new T.Color(rim) } },
        vertexShader: SV, fragmentShader: SF, transparent: true, blending: T.AdditiveBlending, depthWrite: false
      });
    }
    function additive(Mat, color, extra) {
      var o = { color: color, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false };
      for (var k in extra) o[k] = extra[k];
      return new Mat(o);
    }

    /* ── shards ── */
    var frame3 = new T.Group(); scene.add(frame3);         // the suspended formation
    var fr = shatterPane(rnd, PW, PH, IMP), AR = fr.AR, Y0 = fr.Y0;
    var memList = (memories || []).slice(0, 12);
    fr.cells.slice().sort(function (a, b) { return b.area - a.area; }).slice(0, memList.length).forEach(function (c, i) { c.mem = memList[i]; });
    var DEPTH = 0.045, shards = [], meshes = [];

    function buildShard(poly, cx, cy, o) {
      var shape = new T.Shape(), pts = [];
      poly.forEach(function (p, k) { var x = (p.x - cx) * 0.972, y = (p.y - cy) * 0.972; pts.push(new T.Vector3(x, y, o.depth / 2 + 0.012)); if (k) shape.lineTo(x, y); else shape.moveTo(x, y); });
      var geo = new T.ExtrudeGeometry(shape, { depth: o.depth, bevelEnabled: o.bevel, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 1, curveSegments: 1 });
      geo.translate(0, 0, -o.depth / 2);
      var pa = geo.attributes.position, uv = geo.attributes.uv;
      for (var k = 0; k < pa.count; k++) uv.setXY(k, (pa.getX(k) + o.u0 + AR) / PW, (pa.getY(k) + o.v0 - Y0) / PH);
      uv.needsUpdate = true;
      var fm = faceMat(o.rim), em = additive(T.MeshBasicMaterial, 0xffc1d6);
      var m = new T.Mesh(geo, [fm, em]);
      var line = null;
      if (o.outline) { line = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), additive(T.LineBasicMaterial, 0xff8fb8)); m.add(line); }
      frame3.add(m); meshes.push(m);
      return { m: m, fm: fm, em: em, line: line };
    }

    /* ── the vortex: a crack in space at the centre, the pane's fragments flung outward toward
          the viewer and frozen mid-burst. vortexG is the crack's frame: +z is the axis toward
          the camera, turned aside so the funnel is seen in third person. ── */
    var RC = new T.Vector3(0.12, 0.06, -0.75);
    var vq = new T.Quaternion(), axisV = new T.Vector3(0, 0, 1), Z = new T.Vector3(0, 0, 1);
    var vortexG = new T.Group(); vortexG.position.copy(RC); frame3.add(vortexG);
    function setAxis(yaw, pitch, roll) { vq.setFromEuler(new T.Euler(pitch, yaw, roll, 'YXZ')); vortexG.quaternion.copy(vq); axisV.set(0, 0, 1).applyQuaternion(vq); }
    setAxis(-0.64, 0.25, 0.12);
    /* point the crack straight at the viewer: +z of the vortex = from the rift toward the camera */
    var camL = new T.Vector3(), qRoll = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), 0.15);
    function aimAtViewer() {
      frame3.updateMatrixWorld();
      camL.copy(camera.position); frame3.worldToLocal(camL);
      axisV.copy(camL).sub(RC).normalize();
      vq.setFromUnitVectors(Z, axisV).multiply(qRoll);
      vortexG.quaternion.copy(vq);
    }
    var BAND_OM = [0.065, 0.045, 0.032, 0.022];

    fr.cells.forEach(function (c) {
      var b = buildShard(c.poly, c.cx, c.cy, { depth: DEPTH, bevel: true, outline: true, u0: c.cx, v0: c.cy, rim: c.mem ? 0xff6f9a : 0xc8203f });
      var band = c.d < 0.5 ? 0 : c.d < 1.1 ? 1 : c.d < 1.8 ? 2 : 3;
      var s = {
        m: b.m, fm: b.fm, em: b.em, line: b.line, mem: c.mem || null, d: c.d, debris: false,
        A: new T.Vector3(c.cx, c.cy, 0),
        th: Math.atan2(c.cy - IMP.y, c.cx - IMP.x) + (rnd() - 0.5) * 0.08,
        r: 0.3 + Math.pow(c.d, 0.9) * 0.82 + band * 0.07,
        z: -0.3 + c.d * 1.55 + (rnd() - 0.5) * 0.26 + (c.mem ? 0.12 : 0),
        om: BAND_OM[band] * (band % 2 ? -1 : 1), tw: (rnd() - 0.5) * 0.5,
        ph: rnd() * 6.28, w: 0.25 + rnd() * 0.35, glow: 1, glowT: 1, hov: 0, flash: 0, wc: 1
      };
      if (c.mem) {
        var mote = new T.Sprite(new T.SpriteMaterial({ map: sparkTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
        mote.scale.setScalar(0.2); mote.position.set(0, 0, DEPTH); b.m.add(mote); s.mote = mote;
      }
      shards.push(s);
    });
    // fine splinters shed continuously from the crack, spiralling out toward the viewer
    for (var di = 0; di < 30; di++) {
      var sz = 0.03 + rnd() * 0.07, tri = [{ x: 0, y: sz }, { x: -sz * (0.4 + rnd() * 0.5), y: -sz * 0.6 }, { x: sz * (0.4 + rnd() * 0.5), y: -sz * (0.3 + rnd() * 0.5) }];
      var b2 = buildShard(tri, 0, 0, { depth: 0.014, bevel: false, outline: false, u0: (rnd() - 0.5) * 2, v0: (rnd() - 0.5) * 3, rim: 0xff8fb8 });
      shards.push({
        m: b2.m, fm: b2.fm, em: b2.em, line: null, mem: null, d: 1 + rnd(), debris: true,
        A: new T.Vector3(IMP.x, IMP.y, 0), u: rnd(), us: 0.045 + rnd() * 0.06, th: rnd() * 6.283,
        R: new T.Vector3(rnd() * 6, rnd() * 6, rnd() * 6), tw: 0,
        ph: rnd() * 6.28, w: 0.3 + rnd() * 0.5, glow: 1, glowT: 1, hov: 0, flash: 0, wc: 1
      });
    }
    shards.forEach(function (s) {
      s.P = s.A.clone(); s.V = new T.Vector3(); s.spin = new T.Vector3(); s.av = new T.Vector3();
      s.m.position.copy(s.P); s.held = true; s.releaseAt = Infinity;
    });

    /* the rift: a hot point with jagged cracks branching out of it */
    function paintRift() {
      var c = document.createElement('canvas'); c.width = c.height = 512;
      var g = c.getContext('2d'), r2 = mulberry(5);
      var gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
      gr.addColorStop(0, 'rgba(255,246,250,1)'); gr.addColorStop(0.07, 'rgba(255,193,214,.92)'); gr.addColorStop(0.22, 'rgba(255,70,120,.32)'); gr.addColorStop(0.55, 'rgba(120,10,30,.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
      g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(255,143,184,1)'; g.shadowBlur = 8;
      function crack(x, y, a, len, w, depth) {
        var steps = 9, pts = [[x, y]];
        for (var i = 0; i < steps; i++) {
          a += (r2() - 0.5) * 0.55; x += Math.cos(a) * len / steps; y += Math.sin(a) * len / steps; pts.push([x, y]);
          if (depth < 2 && r2() < 0.2) crack(x, y, a + (r2() < 0.5 ? -1 : 1) * (0.45 + r2() * 0.5), len * (0.3 + r2() * 0.25), w * 0.55, depth + 1);
        }
        for (var k = 1; k < pts.length; k++) {
          g.beginPath(); g.moveTo(pts[k - 1][0], pts[k - 1][1]); g.lineTo(pts[k][0], pts[k][1]);
          g.lineWidth = Math.max(0.5, w * (1 - k / pts.length)); g.strokeStyle = 'rgba(255,222,234,' + ((0.95 - depth * 0.28) * (1 - k / pts.length * 0.7)).toFixed(2) + ')'; g.stroke();
        }
      }
      for (var k = 0; k < 17; k++) crack(256, 256, k / 17 * 6.283 + r2() * 0.3, 140 + r2() * 100, 3.4, 0);
      return new T.CanvasTexture(c);
    }
    var riftMat = new T.MeshBasicMaterial({ map: paintRift(), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    var rift = new T.Mesh(new T.PlaneGeometry(2.3, 2.3), riftMat); vortexG.add(rift);
    var flare = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(255,236,242,.95)', 'rgba(255,90,140,.35)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    flare.scale.setScalar(1.3); vortexG.add(flare);
    var ringMat = additive(T.MeshBasicMaterial, 0xff8fb8, { side: T.DoubleSide });
    var ring = new T.Mesh(new T.RingGeometry(0.97, 1, 96), ringMat); vortexG.add(ring);

    /* the crack web: fractures in the void along the funnel, behind the shards */
    var web = [], webC = [];
    function conePt(r, th) { return [Math.cos(th) * r, Math.sin(th) * r, -0.5 + (r - 0.2) * 1.08]; }
    function seg(a, b, ia, ib) { web.push(a[0], a[1], a[2], b[0], b[1], b[2]); webC.push(ia, ia * 0.52, ia * 0.66, ib, ib * 0.52, ib * 0.66); }
    function fall(r) { return Math.max(0, 1 - r / 2.5) * 0.95; }
    for (var ci = 0; ci < 26; ci++) {
      var th = ci / 26 * 6.283 + rnd() * 0.22, r = 0.16, prev = conePt(r, th), steps = 6 + Math.floor(rnd() * 7);
      for (var si = 0; si < steps; si++) {
        th += (rnd() - 0.5) * 0.13; var r1 = r + 0.11 + rnd() * 0.12, p = conePt(r1, th);
        seg(prev, p, fall(r), fall(r1));
        if (rnd() < 0.14) { var bt = th + (rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.2), q = conePt(r1 + 0.2 + rnd() * 0.25, bt); seg(p, q, fall(r1) * 0.8, 0); }
        prev = p; r = r1;
      }
    }
    [0.5, 0.9, 1.4, 1.95].forEach(function (R) {
      for (var a = 0; a < 5; a++) {
        var t0 = rnd() * 6.283, len = 0.25 + rnd() * 0.7, prev2 = conePt(R, t0);
        for (var u = 0.07; u <= len; u += 0.07) { var p2 = conePt(R + (rnd() - 0.5) * 0.05, t0 + u); seg(prev2, p2, fall(R) * 0.7, fall(R) * 0.7); prev2 = p2; }
      }
    });
    var webGeo = new T.BufferGeometry();
    webGeo.setAttribute('position', new T.Float32BufferAttribute(web, 3)); webGeo.setAttribute('color', new T.Float32BufferAttribute(webC, 3));
    var webMat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
    vortexG.add(new T.LineSegments(webGeo, webMat));

        /* ── memoria motes (rising) + sparks (bursts) + a few deep stars ── */
    var MN = 240, mPos = new Float32Array(MN * 3), mU = [], mTh = [], mSp = [], mJ = [];
    for (var mi = 0; mi < MN; mi++) { mU.push(Math.random()); mTh.push(Math.random() * 6.283); mSp.push(0.03 + Math.random() * 0.07); mJ.push((Math.random() - 0.5) * 0.5); }
    var mGeo = new T.BufferGeometry(); mGeo.setAttribute('position', new T.BufferAttribute(mPos, 3));
    var motes = new T.Points(mGeo, new T.PointsMaterial({ color: 0xff6f9a, size: 0.05, map: dotTex, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }));
    motes.frustumCulled = false; vortexG.add(motes);
    var KN = 140, kPos = new Float32Array(KN * 3), kVel = new Float32Array(KN * 3), kLife = new Float32Array(KN);
    var kGeo = new T.BufferGeometry(); kGeo.setAttribute('position', new T.BufferAttribute(kPos, 3));
    var sparks = new T.Points(kGeo, new T.PointsMaterial({ color: 0xffc1d6, size: 0.085, map: dotTex, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false }));
    sparks.frustumCulled = false; scene.add(sparks);
    for (var ki = 0; ki < KN; ki++) kPos[ki * 3 + 1] = 999;
    function emit(x, y, z, n, speed) {
      for (var i = 0, made = 0; i < KN && made < n; i++) {
        if (kLife[i] > 0) continue;
        var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = speed * (0.4 + Math.random() * 0.8);
        kPos[i * 3] = x; kPos[i * 3 + 1] = y; kPos[i * 3 + 2] = z;
        kVel[i * 3] = Math.sin(ph) * Math.cos(th) * sp; kVel[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * sp; kVel[i * 3 + 2] = Math.cos(ph) * sp * 0.5;
        kLife[i] = 1; made++;
      }
    }
    var N = 320, sp3 = new Float32Array(N * 3), sc = new Float32Array(N * 3), cA = new T.Color(0xff8fb8), cB = new T.Color(0xc8203f), cC = new T.Color(0xe9dde2);
    for (var n = 0; n < N; n++) {
      var r = 7 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      sp3[n * 3] = r * Math.sin(ph) * Math.cos(th); sp3[n * 3 + 1] = r * Math.sin(ph) * Math.sin(th); sp3[n * 3 + 2] = -Math.abs(r * Math.cos(ph)) - 1;
      var cc = Math.random(), col = cc < 0.2 ? cA : cc < 0.55 ? cB : cC;
      sc[n * 3] = col.r; sc[n * 3 + 1] = col.g; sc[n * 3 + 2] = col.b;
    }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp3, 3)); sg.setAttribute('color', new T.BufferAttribute(sc, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ size: 0.07, map: dotTex, vertexColors: true, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }));
    scene.add(stars);
    var bgGlow = new T.Sprite(new T.SpriteMaterial({ map: glowTex('rgba(163,20,47,.42)', 'rgba(74,8,21,.2)'), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    bgGlow.scale.set(7.5, 7.5, 1); bgGlow.position.set(0, 0, -0.9); vortexG.add(bgGlow);

    /* ── interaction ── */
    var ray = new T.Raycaster(), ndc = new T.Vector2(-9, -9), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hit = new T.Vector3();
    var mouseWorld = new T.Vector3(), mouseLocal = new T.Vector3(), hasMouse = false, hovered = null, pinned = null, pinUntil = 0;
    var tilt = { x: 0, y: 0 };
    var layout = { x: 2, y: 0, s: 1 }, scrollP = 0;
    var tAcc = 0, lastNow = 0, intro = reduceMotion ? null : { crack: (opts.introDelay || 0) + 0.25, shatter: (opts.introDelay || 0) + 1.55 };
    var wholeUntil = 0, wholeActive = false, suppressClick = false, pressTimer = 0, pressAt = null;

    function setNdc(e) {
      var r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) { mouseWorld.copy(hit); hasMouse = true; }
    }
    function pickShard() {
      var hits = ray.intersectObjects(meshes, false);
      if (!hits.length) return null;
      for (var i = 0; i < shards.length; i++) if (shards[i].m === hits[0].object) return shards[i];
      return null;
    }
    function screenOf(obj) {
      var v = new T.Vector3(); obj.getWorldPosition(v); v.project(camera);
      return { x: (v.x + 1) / 2 * canvas.clientWidth, y: (1 - v.y) / 2 * canvas.clientHeight };
    }
    function showTip(s) {
      if (!tipEl) return;
      if (!s || !s.mem) { tipEl.classList.remove('show'); return; }
      tipEl.innerHTML = '<small>Memoria · ' + esc(s.mem.date) + '</small><b>' + esc(s.mem.project) + '</b><span>' + esc(s.mem.label) + '</span><em>' + (pinned === s ? 'Click again to open the case file →' : 'Click to release this memory') + '</em>';
      tipEl.classList.add('show');
    }
    function placeTip() {
      var s = pinned || hovered; if (!tipEl || !s || !s.mem) return;
      var p = screenOf(s.m), w = canvas.clientWidth;
      var x = clamp(p.x + 26, 8, w - 268), y = clamp(p.y - 30, 80, canvas.clientHeight - 140);
      if (p.x + 294 > w) x = clamp(p.x - 286, 8, w - 268);
      tipEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
    function worldOf(s) { var w = new T.Vector3(); s.m.getWorldPosition(w); return w; }
    /* is the pointer on, or close to, this shard on screen? (shards keep drifting under a still cursor) */
    function nearShard(c, e) {
      if (ray.intersectObject(c.m, false).length) return true;
      var pp = screenOf(c.m), cr0 = canvas.getBoundingClientRect();
      c.m.geometry.computeBoundingSphere();
      var edge = worldOf(c).add(new T.Vector3(c.m.geometry.boundingSphere.radius * c.m.getWorldScale(new T.Vector3()).x, 0, 0)).project(camera);
      var rad = Math.abs((edge.x + 1) / 2 * canvas.clientWidth - pp.x);
      return Math.hypot(e.clientX - cr0.left - pp.x, e.clientY - cr0.top - pp.y) < Math.max(60, rad * 1.1);
    }

    window.addEventListener('pointermove', function (e) {
      if (!running) return;
      setNdc(e);
      if (pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 10) { clearTimeout(pressTimer); pressAt = null; }
      var r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) { hasMouse = false; if (hovered) { hovered.glowT = 1; hovered = null; } return; }
      var s = wholeActive ? null : pickShard();
      if (hovered && s !== hovered && !wholeActive && (!s || !s.mem) && nearShard(hovered, e)) s = hovered;   // sticky hover
      if (s !== hovered) {
        if (hovered && hovered !== pinned) hovered.glowT = 1;
        hovered = s;
        if (s) s.glowT = s.mem ? 1.7 : 1.35;
        if (!pinned || Date.now() > pinUntil) { pinned = null; showTip(s); }
        canvas.style.cursor = s && s.mem ? 'pointer' : '';
      }
    }, { passive: true });

    canvas.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; return; }
      if (wholeActive) return;
      setNdc(e);
      var s = pickShard();
      // a pinned memory turns to face you; a click close to it still counts as "open"
      // the vortex keeps turning: a click near the shard you are reading (pinned or hovered) still counts as that shard
      var cand = pinned || (hovered && hovered.mem ? hovered : null);
      if (cand && s !== cand && nearShard(cand, e)) s = cand;
      if (s && s.mem) {
        if (pinned === s && onOpen) { onOpen(s.mem.id); return; }
        pinned = s; pinUntil = Date.now() + 4000; showTip(s);
        s.flash = 1.2; s.glowT = 1.7;
        var w = worldOf(s); emit(w.x, w.y, w.z, 34, 0.05);
        if (opts.onRelease) { var p = screenOf(s.m), cr = canvas.getBoundingClientRect(); opts.onRelease(cr.left + p.x, cr.top + p.y); }
      } else if (s) {
        s.flash = 1; s.av.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.06);
        var w2 = worldOf(s); emit(w2.x, w2.y, w2.z, 14, 0.04);
      } else burst(true);
    });
    canvas.addEventListener('dblclick', function (e) { e.preventDefault(); remember(); });
    canvas.addEventListener('pointerdown', function (e) {
      pressAt = { x: e.clientX, y: e.clientY }; clearTimeout(pressTimer);
      pressTimer = setTimeout(function () { pressAt = null; suppressClick = true; remember(); }, 650);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { canvas.addEventListener(ev, function () { clearTimeout(pressTimer); pressAt = null; }); });
    canvas.addEventListener('contextmenu', function (e) { if (wholeActive) e.preventDefault(); });

    /* scatter from a point (the cursor, or the impact) */
    function burst(fromCursor) {
      var o = fromCursor && hasMouse ? mouseLocal.clone() : RC.clone();
      shards.forEach(function (s) {
        var dv = tmp.copy(s.P).sub(o); dv.z *= 0.3;
        var d = dv.length() || 1, k = Math.max(0.25, 1 - d / 4);
        dv.normalize().multiplyScalar(0.085 * k).addScaledVector(axisV, 0.04 * k);
        s.V.add(dv);
        s.av.set((Math.random() - 0.5) * 0.2 * k, (Math.random() - 0.5) * 0.2 * k, (Math.random() - 0.5) * 0.1 * k);
      });
      riftKick = 1;
      var w = frame3.localToWorld(o.clone()); emit(w.x, w.y, w.z, 60, 0.07);
    }
    /* draw every fragment back into the intact pane for a moment */
    function remember() {
      if (reduceMotion) return;
      wholeActive = true; wholeUntil = performance.now() + 3400;
      pinned = null; hovered = null; showTip(null);
      shards.forEach(function (s) { if (!s.debris) { s.releaseAt = Infinity; s.held = true; } });
    }
    function release(t, strength) {
      shards.forEach(function (s) { if (!s.debris || strength > 1) s.releaseAt = t + s.d * 0.1 + (s.debris ? 0.05 : 0); s.kick = strength; });
    }

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      var halfW = Math.tan(camera.fov * Math.PI / 360) * camera.position.z * camera.aspect;
      layout = w >= 960 ? { x: Math.min(halfW * 0.52, 2.6), y: -0.05, s: 0.78 } : { x: 0, y: 1.12, s: Math.min(0.5, halfW / 2.9) };
      // the crack axis is re-aimed at the camera every frame (see aimAtViewer)
    }
    window.addEventListener('resize', resize);

    var running = false, raf = 0;
    var perfN = 0, perfStart = 0, pr = renderer.getPixelRatio();
    var tgt = new T.Vector3(), tmp = new T.Vector3(), vl = new T.Vector3(), nrm = new T.Vector3(), qA = new T.Quaternion(), qB = new T.Quaternion(), qT = new T.Quaternion(), eul = new T.Euler();
    var riftKick = 0, riftI = 0, snap = false;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016; lastNow = now;
      tAcc += dt; var t = tAcc;
      if (perfN === 0) perfStart = now;
      if (++perfN === 90) {
        var ms = (now - perfStart) / 89;
        if (ms > 30 && pr > 0.75) { pr = Math.max(0.75, pr * 0.65); renderer.setPixelRatio(pr); resize(); perfN = 0; }
      }

      /* intro: the pane appears whole, cracks race out from the impact, then it breaks */
      var appear = 1, crackA = 0;
      if (intro) {
        appear = clamp((t - (intro.crack - 0.5)) / 0.6, 0, 1);
        if (t >= intro.shatter && !intro.done) {
          intro.done = true; release(t, 2);
          var iw = frame3.localToWorld(RC.clone()); emit(iw.x, iw.y, iw.z, 110, 0.09); riftKick = 1.6;
        }
        if (intro.done && t > intro.shatter + 3) intro = null;
      }
      if (wholeActive && performance.now() > wholeUntil) { wholeActive = false; release(t, 1); var cw = frame3.localToWorld(RC.clone()); emit(cw.x, cw.y, cw.z, 60, 0.065); riftKick = 1.2; }

      /* formation: home position, breathing, tilt toward the cursor */
      var fade = clamp(1 - scrollP * 0.95, 0, 1);
      frame3.position.set(layout.x, layout.y + scrollP * 0.9, 0);
      frame3.scale.setScalar(layout.s);
      var tx = hasMouse ? ndc.x : 0, ty = hasMouse ? ndc.y : 0;
      tilt.x += (tx - tilt.x) * 0.04; tilt.y += (ty - tilt.y) * 0.04;
      frame3.rotation.y = -0.06 + tilt.x * 0.26 + Math.sin(t * 0.21) * 0.04;
      frame3.rotation.x = -tilt.y * 0.16 + Math.sin(t * 0.17) * 0.03;
      aimAtViewer();
      frame3.updateMatrixWorld();
      if (hasMouse) { mouseLocal.copy(mouseWorld); frame3.worldToLocal(mouseLocal); }
      var spread = 1 + Math.sin(t * 0.35) * 0.03 + scrollP * 1.3, wholeSum = 0, wholeN = 0;

      for (var j = 0; j < shards.length; j++) {
        var s = shards[j], wantWhole = t < s.releaseAt;
        if (s.held && !wantWhole) {   // the moment this shard breaks free: outward, toward the viewer
          s.held = false;
          var kk = (s.kick || 1) * (s.debris ? 0.09 : 0.055);
          tmp.set(s.A.x - IMP.x, s.A.y - IMP.y, 0).normalize().multiplyScalar(0.3).add(axisV).normalize();
          s.V.addScaledVector(tmp, kk);
          s.av.set((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.04);
        }
        s.wc += ((wantWhole ? 1 : 0) - s.wc) * (wantWhole ? 0.07 : 0.05);
        s.hov += ((s === hovered || s === pinned ? 1 : 0) - s.hov) * 0.1;
        if (!s.debris) { wholeSum += s.wc; wholeN++; }

        // slot on the funnel (vortex-local), then into the formation's frame
        var df = 1;
        if (s.debris) {
          s.u += s.us * dt * (1 + riftKick * 0.8);
          if (s.u >= 1) { s.u -= 1; s.th = Math.random() * 6.283; s.jump = true; }
          var rr = 0.12 + s.u * 2.9, thd = s.th + s.u * 2.3 + t * 0.05;
          vl.set(Math.cos(thd) * rr, Math.sin(thd) * rr, -0.4 + s.u * 3.1);
          df = Math.sin(Math.PI * s.u);
        } else {
          var thv = s.th + t * s.om + Math.sin(t * s.w + s.ph) * 0.02, rv = s.r * spread;
          vl.set(Math.cos(thv) * rv, Math.sin(thv) * rv, s.z + (spread - 1) * 1.4);
          vl.z += Math.sin(t * s.w * 0.9 + s.ph) * 0.05;
        }
        // orientation: face inward at the crack, opened toward the viewer like petals blown back
        nrm.set(-vl.x, -vl.y, -0.6).normalize().lerp(Z, 0.52 + 0.12 * Math.min(1, s.debris ? 0.5 : s.r / 2.4)).normalize();
        qA.setFromUnitVectors(Z, nrm);
        qB.setFromAxisAngle(Z, s.tw); qA.multiply(qB);
        qT.copy(vq).multiply(qA);
        vl.applyQuaternion(vq).add(RC);

        tgt.copy(vl);
        tgt.z += scrollP * (2.4 + s.d * 0.6) + s.hov * 0.35;
        tgt.lerp(s.A, s.debris ? 0 : s.wc);
        if (s.debris && s.held) tgt.copy(s.A);
        if (snap || s.jump) { s.P.copy(tgt); s.V.set(0, 0, 0); s.jump = false; }
        s.V.addScaledVector(tmp.copy(tgt).sub(s.P), s.held ? 0.08 : (s.debris ? 0.03 : 0.012));
        // cursor field: shards part around the pointer like disturbed water
        if (hasMouse && !wholeActive && !s.held && s !== hovered && s !== pinned) {
          var mdx = s.P.x - mouseLocal.x, mdy = s.P.y - mouseLocal.y, md = Math.hypot(mdx, mdy);
          if (md < 0.85 && md > 0.001) {
            var f = (0.85 - md) * 0.009;
            s.V.x += mdx / md * f; s.V.y += mdy / md * f; s.V.z += f * 0.5;
            s.av.x += mdy * f * 0.15; s.av.y -= mdx * f * 0.15;
          }
        }
        s.V.multiplyScalar(s.held ? 0.7 : 0.92);
        s.P.add(s.V);
        s.m.position.copy(s.P);

        // rotation: slot orientation + a slow living wobble; flat when whole; face the viewer when hovered
        s.spin.add(s.av); s.av.multiplyScalar(0.94); s.spin.multiplyScalar(0.975);
        var free = (1 - s.wc) * (1 - s.hov * 0.85);
        if (s.debris) eul.set(s.R.x + t * s.w, s.R.y + t * s.w * 0.7, s.R.z);
        else eul.set(Math.sin(t * s.w * 0.7 + s.ph) * 0.16 * free + s.spin.x, Math.cos(t * s.w * 0.6 + s.ph) * 0.2 * free + s.spin.y, s.spin.z);
        qB.setFromEuler(eul); qT.multiply(qB);
        qA.identity(); qT.slerp(qA, s.debris ? 0 : Math.max(s.wc, s.hov * 0.85));
        if (snap) s.m.quaternion.copy(qT); else s.m.quaternion.slerp(qT, 0.07);
        s.m.scale.setScalar(1 + s.hov * 0.12);

        // light: fragments nearer the crack burn brighter
        s.glow += (s.glowT - s.glow) * 0.08; s.flash *= 0.93;
        var vis = appear * fade * (s.debris && s.held ? 0 : 1) * (s.debris ? df : 1);
        var core = s.debris ? 1 : 1 + 0.45 * Math.max(0, 1 - s.r / 2.2) * (1 - s.wc);
        s.fm.uniforms.uTime.value = t + j * 0.37;
        s.fm.uniforms.uGlow.value = vis * s.glow * core * (s.debris ? 0.9 : 0.62) * (1 + s.flash * 0.6);
        s.fm.uniforms.uHover.value = s.hov;
        s.fm.uniforms.uWhole.value = s.wc;
        s.em.opacity = vis * (0.24 + s.hov * 0.6 + s.flash * 0.5) * core * (1 - s.wc * 0.55);
        if (s.line) {
          var seam = 0.16 + s.hov * 0.6 + s.flash * 0.4;
          if (intro && !intro.done) seam = clamp((t - intro.crack - s.d * 0.32) / 0.22, 0, 1) * 0.95;   // the cracks spreading
          else if (s.wc > 0.5) seam = 0.1 + (1 - s.wc) * 0.3;
          s.line.material.opacity = appear * fade * seam;
        }
        if (s.mote) { s.mote.material.opacity = fade * (1 - s.wc) * (0.4 + 0.4 * Math.sin(t * 2 + s.ph)) * (s.held ? 0 : 1); }
      }

      // the rift breathes; it flares when the glass breaks, and dims while the pane is whole
      riftKick *= 0.965;
      var whole = wholeN ? wholeSum / wholeN : 0;
      riftI += ((intro && !intro.done ? 0 : 1 - whole) * fade - riftI) * (snap ? 1 : 0.06);
      var pulse = 1 + Math.sin(t * 1.6) * 0.05 + riftKick * 0.35;
      rift.scale.setScalar(pulse); rift.rotation.z = t * 0.03;
      riftMat.opacity = riftI * (0.85 + riftKick * 0.3);
      flare.material.opacity = riftI * (0.55 + Math.sin(t * 2.3) * 0.08 + riftKick * 0.4);
      flare.scale.setScalar(1.2 + riftKick * 0.9);
      var cyc = (t % 4.8) / 4.8;
      ring.scale.setScalar(0.25 + cyc * 3.1); ringMat.opacity = riftI * Math.pow(1 - cyc, 2) * 0.45;
      webMat.opacity = riftI * (0.75 + Math.sin(t * 0.9) * 0.12 + riftKick * 0.25);
      if (pinned && Date.now() > pinUntil && pinned !== hovered) { pinned.glowT = 1; pinned = null; showTip(hovered); }
      placeTip();

      for (var mi2 = 0; mi2 < MN; mi2++) {
        mU[mi2] += mSp[mi2] * dt * (1 + riftKick); if (mU[mi2] > 1) { mU[mi2] -= 1; mTh[mi2] = Math.random() * 6.283; }
        var mu = mU[mi2], mr = 0.15 + mu * 3.3 + mJ[mi2] * mu, mth = mTh[mi2] + mu * 1.9 + t * 0.04;
        mPos[mi2 * 3] = Math.cos(mth) * mr; mPos[mi2 * 3 + 1] = Math.sin(mth) * mr; mPos[mi2 * 3 + 2] = -0.45 + mu * 3.4;
      }
      mGeo.attributes.position.needsUpdate = true;
      motes.material.opacity = 0.75 * fade * (0.35 + riftI * 0.65);
      for (var k2 = 0; k2 < KN; k2++) {
        if (kLife[k2] <= 0) continue;
        kLife[k2] -= dt * 0.8;
        kPos[k2 * 3] += kVel[k2 * 3]; kPos[k2 * 3 + 1] += kVel[k2 * 3 + 1]; kPos[k2 * 3 + 2] += kVel[k2 * 3 + 2];
        kVel[k2 * 3] *= 0.96; kVel[k2 * 3 + 1] = kVel[k2 * 3 + 1] * 0.96 + 0.0006; kVel[k2 * 3 + 2] *= 0.96;
        if (kLife[k2] <= 0) kPos[k2 * 3 + 1] = 999;
      }
      kGeo.attributes.position.needsUpdate = true;
      bgGlow.material.opacity = 0.9 * fade * appear;
      stars.rotation.y = t * 0.008; stars.rotation.x = Math.sin(t * 0.05) * 0.05;

      renderer.render(scene, camera);
    }
    function start() { if (!running) { running = true; lastNow = 0; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    if (reduceMotion) {
      // a single, still moment: already broken, suspended
      shards.forEach(function (s) { s.releaseAt = -1; s.held = false; s.wc = 0; });
      snap = true; running = true; frame(performance.now()); running = false; snap = false; cancelAnimationFrame(raf);
    }

    return {
      start: function () { if (!reduceMotion) start(); },
      stop: stop,
      resize: resize,
      setScroll: function (p) { scrollP = clamp(p, 0, 1); },
      burst: function () { burst(false); },
      remember: remember,
      count: function () { return shards.filter(function (s) { return !s.debris; }).length; }
    };
  }

  /* ════════════════════ BLOOM: FREE-ROAMING RED JELLYFISH ════════════════════ */
  function bloom(canvas, opts) {
    opts = opts || {};
    if (!window.THREE || !webglOK()) return null;
    var T = window.THREE;
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch (e) { return null; }
    var pr = Math.min(window.devicePixelRatio || 1, 1.25);
    renderer.setPixelRatio(pr); renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene(), CAMZ = 10, camera = new T.PerspectiveCamera(40, 1, 0.1, 60);
    camera.position.z = CAMZ;
    var glowTex = makeGlowTex(T);
    var coreTex = glowTex('rgba(255,214,228,.95)', 'rgba(255,70,120,.38)');
    var haloTex = glowTex('rgba(200,32,63,.30)', 'rgba(110,11,30,.10)');
    var dotTex = glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,.3)');
    var UP = new T.Vector3(0, 1, 0);

    /* the bell: a dome pulled into four pointed petals that droop at the rim
       (Evernight's flower, worn as a bell) */
    function lobe(phi) { return Math.pow(1 - Math.abs(Math.sin(2 * phi)), 1.2); }
    function petalRadius(phi, s) { return 1 + (0.6 + 0.52 * lobe(phi) - 1) * Math.pow(s, 1.2); }
    function rimY(phi) { var L = lobe(phi); return -L * 0.5 - (1 - L) * 0.04; }
    function petalGeo(scale, squash) {
      var g = new T.SphereGeometry(1, 72, 22, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        var s = Math.acos(clamp(y, -1, 1)) / (Math.PI / 2), phi = Math.atan2(z, x), L = lobe(phi);
        var rad = petalRadius(phi, s);
        x *= rad; z *= rad;
        y = y * squash - L * Math.pow(s, 3) * 0.5 - (1 - L) * Math.pow(s, 4) * 0.04;
        p.setXYZ(i, x * scale, y * scale, z * scale);
      }
      g.computeVertexNormals();
      return g;
    }
    var JV = [
      'uniform float uTime; uniform float uPulse; uniform float uCrown;',
      'varying vec3 vN; varying vec3 vV; varying vec2 vUv;',
      'void main(){',
      '  vUv = uv; vec3 p = position;',
      '  float s = clamp(1.0 - p.y / uCrown, 0.0, 1.4);',
      '  p.xz *= 1.0 - uPulse * 0.17 * s + 0.018 * sin(uTime * 2.0 + atan(p.z, p.x) * 4.0) * s;',
      '  p.y *= 1.0 + uPulse * 0.1; p.y -= uPulse * 0.05 * s * s;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  vN = normalize(normalMatrix * normal); vV = -mv.xyz;',
      '  gl_Position = projectionMatrix * mv;',
      '}'].join('\n');
    var JF = [
      'uniform vec3 uCore; uniform vec3 uRim; uniform float uGlow; uniform float uTime;',
      'varying vec3 vN; varying vec3 vV; varying vec2 vUv;',
      'void main(){',
      '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.8);',
      '  float ang = vUv.x * 6.2831853;',
      '  float mid = pow(0.5 + 0.5 * cos(4.0 * ang), 36.0);',          // dark vein down each petal
      '  float seam = pow(0.5 - 0.5 * cos(4.0 * ang), 14.0);',         // bright fold between petals
      '  float ribs = pow(0.5 + 0.5 * sin(ang * 32.0), 8.0) * 0.25;',
      '  float edge = pow(1.0 - vUv.y, 5.0);',                         // petal margins light up
      '  float shimmer = 0.85 + 0.15 * sin(uTime * 1.3 + vUv.y * 9.0);',
      '  float rimband = 1.0 - smoothstep(0.0, 0.35, vUv.y);',
      '  vec3 col = mix(uCore, uRim, f) * (1.0 - seam * 0.85) + uRim * ribs * 0.4 + vec3(1.0, 0.6, 0.75) * mid * 0.25 * (1.0 - vUv.y) + vec3(1.0, 0.72, 0.82) * edge * 0.5;',
      '  float a = (0.08 + f * 0.8 + edge * 0.4 + ribs * 0.1 + mid * 0.12 * rimband) * (1.0 - seam * 0.8) * uGlow * shimmer;',
      '  gl_FragColor = vec4(col, a);',
      '}'].join('\n');
    function jellyMat(core, rim, crown) {
      return new T.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPulse: { value: 0 }, uCrown: { value: crown }, uGlow: { value: 1 }, uCore: { value: new T.Color(core) }, uRim: { value: new T.Color(rim) } },
        vertexShader: JV, fragmentShader: JF, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      });
    }
    var bellGeo = petalGeo(1, 0.82), innerGeo = petalGeo(0.56, 0.74);

    /* tentacle layout (bell-radius units): 4 frilled oral ribbons between the
       petals, 8 fine filaments from the rim (petal tips and folds) */
    var CHAINS = [];
    for (var a = 0; a < 4; a++) { var ang = Math.PI / 4 + a * Math.PI / 2; CHAINS.push({ kind: 'ribbon', root: [Math.cos(ang) * 0.13, -0.04, Math.sin(ang) * 0.13], n: 22, len: 2.3 + (a % 2) * 0.3 }); }
    for (var b = 0; b < 8; b++) {
      var phi = b * Math.PI / 4, rr = petalRadius(phi, 1) * 0.9;
      CHAINS.push({ kind: 'fil', root: [Math.cos(phi) * rr, rimY(phi) * 0.9, Math.sin(phi) * rr], n: 24, len: b % 2 ? 3.4 : 2.7 });
    }
    var FRILL = 28;

    var W = 0, H = 0, halfW = 1, halfH = 1, ppu = 100, S = 0.33, mobile = false;
    function measure() {
      W = window.innerWidth; H = window.innerHeight; mobile = W < 768;
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      halfH = Math.tan(camera.fov * Math.PI / 360) * CAMZ; halfW = halfH * camera.aspect;
      ppu = H / (2 * halfH);
      S = (mobile ? 28 : 36) / ppu;       // bell radius in px → world units; the same for every jellyfish
    }
    measure();

    var rnd = Math.random, COUNT = mobile ? 4 : 7, jellies = [];
    var segCount = 0, ptCount = 0;
    CHAINS.forEach(function (c) { segCount += c.n - 1; ptCount += c.kind === 'ribbon' ? (c.n - 1) * 2 : 1; });
    ptCount += FRILL;
    var segPos = new Float32Array(COUNT * segCount * 6), segCol = new Float32Array(COUNT * segCount * 6);
    var ptPos = new Float32Array(COUNT * ptCount * 3), ptCol = new Float32Array(COUNT * ptCount * 3);
    var lineGeo = new T.BufferGeometry();
    lineGeo.setAttribute('position', new T.BufferAttribute(segPos, 3)); lineGeo.setAttribute('color', new T.BufferAttribute(segCol, 3));
    var lines = new T.LineSegments(lineGeo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false }));
    lines.frustumCulled = false; scene.add(lines);
    var ptGeo = new T.BufferGeometry();
    ptGeo.setAttribute('position', new T.BufferAttribute(ptPos, 3)); ptGeo.setAttribute('color', new T.BufferAttribute(ptCol, 3));
    var ptMat = new T.PointsMaterial({ size: 0.05, map: dotTex, vertexColors: true, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false });
    var points = new T.Points(ptGeo, ptMat); points.frustumCulled = false; scene.add(points);

    /* text blocks to keep clear of (viewport rects, refreshed a few times a second) */
    var avoid = [], avoidAt = 0;
    function refreshAvoid(now) {
      if (!opts.avoid || mobile || now - avoidAt < 400) return;
      avoidAt = now; avoid = [];
      opts.avoid().forEach(function (r) { if (r.bottom > -40 && r.top < H + 40 && r.width) avoid.push({ l: r.left - 70, r: r.right + 70, t: r.top - 34, b: r.bottom + 34 }); });
    }
    function inAvoid(wx, wy) {
      var sx = W / 2 + wx * ppu, sy = H / 2 - wy * ppu;
      for (var i = 0; i < avoid.length; i++) { var a = avoid[i]; if (sx > a.l && sx < a.r && sy > a.t && sy < a.b) return a; }
      return null;
    }
    function pickTarget(j, anywhere) {
      for (var tries = 0; tries < 8; tries++) {
        var x;
        if (!mobile && !anywhere && rnd() < 0.78) x = (rnd() < 0.5 ? -1 : 1) * halfW * (0.5 + rnd() * 0.42);
        else x = (rnd() * 2 - 1) * halfW * 0.9;
        j.tgt.set(x, (rnd() * 2 - 1) * halfH * 0.82, j.P.z);
        if (!inAvoid(j.tgt.x, j.tgt.y)) break;
      }
      j.tUntil = j.t + 9 + rnd() * 8;
    }
    function resetChains(j) {
      j.g.updateMatrixWorld();
      j.chains.forEach(function (c) {
        var r = new T.Vector3(c.def.root[0], c.def.root[1], c.def.root[2]).applyMatrix4(j.g.matrixWorld);
        var seg = c.def.len * j.s / (c.def.n - 1);
        for (var k = 0; k < c.def.n; k++) { c.p[k * 3] = c.q[k * 3] = r.x; c.p[k * 3 + 1] = c.q[k * 3 + 1] = r.y - seg * k; c.p[k * 3 + 2] = c.q[k * 3 + 2] = r.z; }
      });
    }
    for (var ji = 0; ji < COUNT; ji++) {
      var g = new T.Group();
      var bm = jellyMat(0x4a0716, 0xff3d6e, 0.82), im = jellyMat(0x0e0207, 0x8a1028, 0.41);
      var bell = new T.Mesh(bellGeo, bm), inner = new T.Mesh(innerGeo, im);
      inner.position.y = -0.02; g.add(bell); g.add(inner);
      var core = new T.Sprite(new T.SpriteMaterial({ map: coreTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      core.scale.setScalar(0.7); core.position.y = 0.42; g.add(core);
      var halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
      halo.scale.set(3.4, 3.8, 1); halo.position.y = -0.6; g.add(halo);
      scene.add(g);
      var z = (rnd() - 0.5) * 1.2;
      var j = {
        g: g, bm: bm, im: im, core: core, halo: halo,
        P: new T.Vector3((rnd() * 2 - 1) * halfW * 0.9, (rnd() * 2 - 1) * halfH * 0.85, z), V: new T.Vector3(),
        A: new T.Vector3((rnd() - 0.5) * 0.6, 1, 0).normalize(), tgt: new T.Vector3(),
        phase: rnd(), tempo: 0.5 * (0.85 + rnd() * 0.3), spin: rnd() * 6.28, spinDir: rnd() < 0.5 ? -1 : 1, ph: rnd() * 6.28,
        glow: 1, glowT: 1, called: 0, t: 0, tUntil: 0, s: S, c: 0, chains: []
      };
      CHAINS.forEach(function (def) { j.chains.push({ def: def, p: new Float32Array(def.n * 3), q: new Float32Array(def.n * 3) }); });
      if (!mobile && ji < COUNT) j.P.x = (ji % 2 ? 1 : -1) * halfW * (0.5 + rnd() * 0.4);   // start in the margins
      pickTarget(j);
      jellies.push(j);
    }

    var mouse = null, lastSY = window.scrollY, tAll = 0;
    window.addEventListener('pointermove', function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
    document.addEventListener('pointerleave', function () { mouse = null; });

    var qA = new T.Quaternion(), qS = new T.Quaternion(), tmp = new T.Vector3(), tmp2 = new T.Vector3(), side = new T.Vector3(), back = new T.Vector3(), root = new T.Vector3();
    var C_RIB = [1.0, 0.5, 0.66], C_FIL = [0.86, 0.13, 0.26], C_FRILL = [1.0, 0.36, 0.52], C_BEAD = [1.0, 0.75, 0.84];

    function step(dt, scrollShift) {
      tAll += dt;
      var mw = mouse ? { x: (mouse.x - W / 2) / ppu, y: -(mouse.y - H / 2) / ppu } : null;
      for (var i = 0; i < jellies.length; i++) {
        var j = jellies[i];
        j.t += dt;
        j.s = S * (CAMZ - j.P.z) / CAMZ;           // depth-compensated: every bell reads the same size
        // pulse: quick contraction, long relaxation
        j.phase += dt * j.tempo * (j.called > 0 ? 1.5 : 1);
        var ph = j.phase % 1, c = ph < 0.3 ? Math.sin(ph / 0.3 * Math.PI / 2) : Math.cos((ph - 0.3) / 0.7 * Math.PI / 2);
        j.c = c * c;
        if (j.called > 0) j.called -= dt;

        // steering toward a wandering goal, with a liking for rising
        if (j.t > j.tUntil || Math.hypot(j.tgt.x - j.P.x, j.tgt.y - j.P.y) < 0.5) pickTarget(j);
        tmp.set(j.tgt.x - j.P.x, j.tgt.y - j.P.y, 0);
        var dist = tmp.length(); tmp.normalize();
        var dirX = tmp.x, dirY = tmp.y;
        tmp.x *= 0.6; tmp.y = tmp.y * 0.45 + 0.85;
        tmp.z = 0.5 + Math.sin(j.t * 0.13 + j.ph) * 0.3;              // crown leans toward the viewer: the four petals show
        tmp.normalize();
        j.A.lerp(tmp, 1 - Math.exp(-(j.called > 0 ? 1.2 : 0.45) * dt)).normalize();
        var heading = clamp(0.25 + j.A.x * dirX + j.A.y * dirY, 0.1, 1);
        if (ph < 0.3) j.V.addScaledVector(tmp2.set(j.A.x, j.A.y, 0), 3 * S * dt * (j.called > 0 ? 1.7 : 1) * clamp(dist, 0.4, 1) * heading);
        j.V.y -= (dirY < -0.3 ? 0.4 : 0.12) * S * dt;
        // shy of the cursor
        j.glowT = 1;
        if (mw) {
          var dx = j.P.x - mw.x, dy = j.P.y - mw.y, d = Math.hypot(dx, dy), R = 150 / ppu;
          if (d < R && d > 0.001) { j.V.x += dx / d * (R - d) * 1.6 * S * dt; j.V.y += dy / d * (R - d) * 1.6 * S * dt; j.glowT = 1.45; }
        }
        // drift out from behind text
        var av = inAvoid(j.P.x, j.P.y);
        if (av) { var sxp = W / 2 + j.P.x * ppu, dir = (sxp - av.l < av.r - sxp) ? -1 : 1; j.V.x += dir * 2.4 * S * dt; if (inAvoid(j.tgt.x, j.tgt.y)) pickTarget(j); }
        // keep a little distance from each other
        for (var k = i + 1; k < jellies.length; k++) {
          var o = jellies[k], sx = j.P.x - o.P.x, sy = j.P.y - o.P.y, sd = Math.hypot(sx, sy), lim = 1.4 * (S / 0.3);
          if (sd < lim && sd > 0.001) { var push = (lim - sd) * 0.5 * S * dt / sd; j.V.x += sx * push; j.V.y += sy * push; o.V.x -= sx * push; o.V.y -= sy * push; }
        }
        j.V.multiplyScalar(Math.exp(-1.15 * dt));
        j.P.x += j.V.x * dt; j.P.y += j.V.y * dt;
        // the page scrolls past, they drift more slowly (parallax)
        j.P.y += scrollShift; j.tgt.y += scrollShift;
        var lim2 = halfH + 1.8 * S / 0.3, wrapped = false;
        if (j.P.y > lim2) { j.P.y = -lim2 + 0.2; wrapped = true; }
        else if (j.P.y < -lim2) { j.P.y = lim2 - 0.2; wrapped = true; }
        if (j.P.x > halfW + 1) j.V.x -= 0.6 * S * dt; else if (j.P.x < -halfW - 1) j.V.x += 0.6 * S * dt;
        if (wrapped) { j.P.x = (mobile ? (rnd() * 2 - 1) * 0.9 : (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.42)) * halfW; pickTarget(j); }
        j.glow += (j.glowT - j.glow) * 0.05;

        // pose
        j.spin += dt * 0.22 * j.spinDir;
        qA.setFromUnitVectors(UP, j.A); qS.setFromAxisAngle(UP, j.spin);
        j.g.quaternion.copy(qA).multiply(qS);
        j.g.position.copy(j.P); j.g.scale.setScalar(j.s);
        j.g.updateMatrixWorld();
        if (wrapped) resetChains(j);

        // tentacles: follow-the-leader verlet chains hanging from the rim
        back.copy(j.A).multiplyScalar(-1);
        side.set(1, 0, 0).applyQuaternion(j.g.quaternion);
        var contract = 1 - j.c * 0.17;
        for (var ci = 0; ci < j.chains.length; ci++) {
          var ch = j.chains[ci], def = ch.def, n = def.n, p = ch.p, q = ch.q, seg = def.len * j.s / (n - 1);
          root.set(def.root[0] * contract, def.root[1], def.root[2] * contract).applyMatrix4(j.g.matrixWorld);
          p[0] = root.x; p[1] = root.y; p[2] = root.z;
          for (var m = 1; m < n; m++) {
            var ix = m * 3, u = m / (n - 1);
            var vx = (p[ix] - q[ix]) * 0.9, vy = (p[ix + 1] - q[ix + 1]) * 0.9, vz = (p[ix + 2] - q[ix + 2]) * 0.9;
            q[ix] = p[ix]; q[ix + 1] = p[ix + 1]; q[ix + 2] = p[ix + 2];
            var sw = Math.sin(tAll * 1.5 - m * 0.38 + j.ph + ci) * 0.0016 * j.s * u * 60 * dt;
            p[ix] += vx + back.x * 0.0018 * j.s * 60 * dt + side.x * sw;
            p[ix + 1] += vy + back.y * 0.0018 * j.s * 60 * dt - 0.0006 * j.s * 60 * dt + side.y * sw;
            p[ix + 2] += vz + back.z * 0.0018 * j.s * 60 * dt + side.z * sw;
            if (scrollShift) { p[ix + 1] += scrollShift * 0.7; q[ix + 1] += scrollShift * 0.7; }
            var ex = p[ix] - p[ix - 3], ey = p[ix + 1] - p[ix - 2], ez = p[ix + 2] - p[ix - 1], el = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1, kf = seg / el;
            p[ix] = p[ix - 3] + ex * kf; p[ix + 1] = p[ix - 2] + ey * kf; p[ix + 2] = p[ix - 1] + ez * kf;
          }
        }
      }
    }

    function writeBuffers() {
      var si = 0, pi = 0;
      for (var i = 0; i < jellies.length; i++) {
        var j = jellies[i], gl = j.glow * (0.85 + j.c * 0.25);
        side.set(1, 0, 0).applyQuaternion(j.g.quaternion);
        for (var ci = 0; ci < j.chains.length; ci++) {
          var ch = j.chains[ci], def = ch.def, n = def.n, p = ch.p, rib = def.kind === 'ribbon', C = rib ? C_RIB : C_FIL;
          for (var m = 1; m < n; m++) {
            var u0 = (m - 1) / (n - 1), u1 = m / (n - 1), f0 = (1 - u0 * (rib ? 0.75 : 0.9)) * gl * (rib ? 0.55 : 0.6), f1 = (1 - u1 * (rib ? 0.75 : 0.9)) * gl * (rib ? 0.55 : 0.6);
            var o = si * 6;
            segPos[o] = p[(m - 1) * 3]; segPos[o + 1] = p[(m - 1) * 3 + 1]; segPos[o + 2] = p[(m - 1) * 3 + 2];
            segPos[o + 3] = p[m * 3]; segPos[o + 4] = p[m * 3 + 1]; segPos[o + 5] = p[m * 3 + 2];
            segCol[o] = C[0] * f0; segCol[o + 1] = C[1] * f0; segCol[o + 2] = C[2] * f0;
            segCol[o + 3] = C[0] * f1; segCol[o + 4] = C[1] * f1; segCol[o + 5] = C[2] * f1;
            si++;
            if (rib) {   // frilled edges along the oral ribbons
              var w = Math.sin(m * 1.7 + tAll * 2 + ci) * 0.09 * j.s * (0.4 + u1);
              for (var sgn = -1; sgn <= 1; sgn += 2) {
                var po = pi * 3, fa = (1 - u1 * 0.8) * gl * 0.5;
                ptPos[po] = p[m * 3] + side.x * w * sgn; ptPos[po + 1] = p[m * 3 + 1] + side.y * w * sgn; ptPos[po + 2] = p[m * 3 + 2] + side.z * w * sgn;
                ptCol[po] = C_FRILL[0] * fa; ptCol[po + 1] = C_FRILL[1] * fa; ptCol[po + 2] = C_FRILL[2] * fa;
                pi++;
              }
            }
          }
          if (!rib) {   // a glowing bead at each filament tip
            var pb = pi * 3, e = (n - 1) * 3;
            ptPos[pb] = p[e]; ptPos[pb + 1] = p[e + 1]; ptPos[pb + 2] = p[e + 2];
            ptCol[pb] = C_BEAD[0] * gl * 0.6; ptCol[pb + 1] = C_BEAD[1] * gl * 0.6; ptCol[pb + 2] = C_BEAD[2] * gl * 0.6;
            pi++;
          }
        }
        // a fine frill of light along the petal margins
        var contract = 1 - j.c * 0.17;
        for (var fi = 0; fi < FRILL; fi++) {
          var phi = fi / FRILL * Math.PI * 2, rr = petalRadius(phi, 1) * contract;
          root.set(Math.cos(phi) * rr, rimY(phi) * 0.78 - j.c * 0.05, Math.sin(phi) * rr).applyMatrix4(j.g.matrixWorld);
          var pf = pi * 3, ff = gl * (0.35 + 0.25 * Math.sin(tAll * 3 + fi));
          ptPos[pf] = root.x; ptPos[pf + 1] = root.y; ptPos[pf + 2] = root.z;
          ptCol[pf] = C_FRILL[0] * ff; ptCol[pf + 1] = C_FRILL[1] * ff; ptCol[pf + 2] = C_FRILL[2] * ff;
          pi++;
        }
        // bell materials
        j.bm.uniforms.uTime.value = tAll + i; j.bm.uniforms.uPulse.value = j.c; j.bm.uniforms.uGlow.value = j.glow;
        j.im.uniforms.uTime.value = tAll + i; j.im.uniforms.uPulse.value = j.c; j.im.uniforms.uGlow.value = j.glow * 0.7;
        j.core.material.opacity = (0.55 + j.c * 0.35) * j.glow;
        j.halo.material.opacity = 0.55 * j.glow;
      }
      lineGeo.attributes.position.needsUpdate = true; lineGeo.attributes.color.needsUpdate = true;
      ptGeo.attributes.position.needsUpdate = true; ptGeo.attributes.color.needsUpdate = true;
      ptMat.size = 0.16 * S;
    }

    // settle the tentacles before the first frame
    jellies.forEach(function (j) {
      j.g.position.copy(j.P); j.g.scale.setScalar(S); j.g.quaternion.setFromUnitVectors(UP, j.A); resetChains(j);
    });
    for (var w0 = 0; w0 < (reduceMotion ? 240 : 90); w0++) step(1 / 60, 0);

    var running = false, raf = 0, lastNow = 0, perfN = 0, perfStart = 0, placed = false;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016; lastNow = now;
      if (perfN === 0) perfStart = now;
      if (++perfN === 90) {
        var ms = (now - perfStart) / 89;
        if (ms > 30 && pr > 0.6) { pr = Math.max(0.6, pr * 0.7); renderer.setPixelRatio(pr); measure(); perfN = 0; }
      }
      var sy = window.scrollY, dy = sy - lastSY; lastSY = sy;
      refreshAvoid(now);
      if (!placed) {   // first frame: lift any jellyfish that starts behind text out to a clear spot
        placed = true;
        jellies.forEach(function (j) {
          for (var k = 0; k < 10 && inAvoid(j.P.x, j.P.y); k++) { pickTarget(j); j.P.x = j.tgt.x; j.P.y = j.tgt.y; }
          j.g.position.copy(j.P); resetChains(j); pickTarget(j);
        });
        for (var w1 = 0; w1 < 60; w1++) step(1 / 60, 0);
      }
      step(dt, clamp(dy * 0.3 / ppu, -0.5, 0.5));
      writeBuffers();
      renderer.render(scene, camera);
    }
    function renderStill() { writeBuffers(); renderer.render(scene, camera); }
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); if (reduceMotion || !running) renderStill(); }, 150);
    });
    renderStill();

    return {
      start: function () { if (reduceMotion) { renderStill(); return; } if (!running) { running = true; lastNow = 0; lastSY = window.scrollY; raf = requestAnimationFrame(frame); } },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      resize: measure,
      /* call the nearest jellyfish to a point on screen (viewport px) */
      attract: function (x, y, all) {
        var wx = (x - W / 2) / ppu, wy = -(y - H / 2) / ppu, best = null, bd = 1e9;
        jellies.forEach(function (j) {
          var d = Math.hypot(j.P.x - wx, j.P.y - wy);
          if (all) { j.tgt.set(wx + (rnd() - 0.5) * 2.4, wy + (rnd() - 0.5) * 1.8, j.P.z); j.tUntil = j.t + 7; j.called = 5; }
          else if (d < bd) { bd = d; best = j; }
        });
        if (best) { best.tgt.set(wx, wy - 0.3, best.P.z); best.tUntil = best.t + 7; best.called = 5; }
      },
      count: function () { return jellies.length; },
      positions: function () { return jellies.map(function (j) { return { x: Math.round(W / 2 + j.P.x * ppu), y: Math.round(H / 2 - j.P.y * ppu) }; }); }
    };
  }

  /* ════════════════════════ PROJECT CONSTELLATION ════════════════════════ */
  function constellation(canvas, tip, projects, onPick, getCenter) {
    var ctx = canvas.getContext('2d');
    var petal = new Path2D(PETAL_D);
    var RING = {
      longterm: { r: 1.35, rx: 1.05, rz: 0.22, color: [255, 143, 184], speed: 0.10 },
      academic: { r: 2.3, rx: 1.2, rz: -0.38, color: [200, 32, 63], speed: 0.065 },
      casual:   { r: 3.35, rx: 0.95, rz: 0.48, color: [233, 221, 226], speed: 0.045 }
    };
    var LABEL = { longterm: 'Long-Term', academic: 'Academic', casual: 'Casual' };
    var nodes = [], byId = {};
    Object.keys(RING).forEach(function (cat) {
      var list = projects.filter(function (p) { return p.category === cat; });
      list.forEach(function (p, i) { var n = { p: p, cat: cat, a0: i / list.length * Math.PI * 2 + (cat === 'academic' ? 0.4 : 0), sx: 0, sy: 0, sz: 0, s: 1, flash: 0 }; nodes.push(n); byId[p.id] = n; });
    });
    var bg = [];
    for (var b = 0; b < 320; b++) {
      var th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1), r = 6 + Math.random() * 5;
      bg.push([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), Math.random()]);
    }

    var W = 0, H = 0, dpr = 1, yaw = 0.5, pitch = -0.25, vy = 0.0015, vp = 0, zoom = 1, filter = 'all', hover = null, running = false, raf = 0, t = 0, last = 0;
    var mode = 'ambient', modeT = 0, cx = 0, cy = 0, hl = null, hlEl = null, centered = false;

    function rotRing(x, y, z, R) {
      var c1 = Math.cos(R.rx), s1 = Math.sin(R.rx), y1 = y * c1 - z * s1, z1 = y * s1 + z * c1;
      var c2 = Math.cos(R.rz), s2 = Math.sin(R.rz);
      return [x * c2 - y1 * s2, x * s2 + y1 * c2, z1];
    }
    function view(v) {
      var c1 = Math.cos(yaw), s1 = Math.sin(yaw), x = v[0] * c1 + v[2] * s1, z = -v[0] * s1 + v[2] * c1;
      var c2 = Math.cos(pitch), s2 = Math.sin(pitch), y = v[1] * c2 - z * s2, z2 = v[1] * s2 + z * c2;
      return [x, y, z2];
    }
    function project(v) {
      var z = zoom * (0.82 + 0.18 * modeT), D = 9.5 / z, f = Math.min(W * 1.05, H * 1.5), s = f / (D - v[2]);
      return { x: cx + v[0] * s, y: cy - v[1] * s, s: s / (f / D) };
    }
    function alphaFor(cat) { return filter === 'all' || filter === cat ? 1 : 0.1; }

    function drawFlower(x, y, size, rot, alpha) {
      ctx.globalAlpha = alpha;
      var g = ctx.createRadialGradient(x, y, 0, x, y, size * 2.6);
      g.addColorStop(0, 'rgba(200,32,63,.45)'); g.addColorStop(1, 'rgba(200,32,63,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, size * 2.6, 0, 6.283); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); var k = size / 47;
      for (var i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(Math.PI / 4 + i * Math.PI / 2); ctx.scale(k, k);
        ctx.fillStyle = '#0b0609'; ctx.fill(petal); ctx.lineWidth = 1.1 / k; ctx.strokeStyle = '#C8203F'; ctx.stroke(petal);
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, size * 0.19, 0, 6.283);
      var cg = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.19); cg.addColorStop(0, '#FFC1D6'); cg.addColorStop(1, '#A3142F');
      ctx.fillStyle = cg; ctx.fill(); ctx.restore();
      ctx.globalAlpha = 1;
    }

    function draw() {
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var amb = 0.5 + 0.5 * modeT;           // overall brightness: dimmer behind the cards
      bg.forEach(function (s) {
        var v = view([s[0], s[1], s[2]]), p = project(v);
        ctx.fillStyle = 'rgba(233,221,226,' + (amb * (0.12 + 0.4 * Math.abs(Math.sin(t * 0.8 + s[3] * 9)))) + ')';
        ctx.fillRect(p.x, p.y, 1.3, 1.3);
      });
      Object.keys(RING).forEach(function (cat) {
        var R = RING[cat], c = R.color, A = alphaFor(cat) * amb, prev = null;
        for (var i = 0; i <= 120; i++) {
          var a = i / 120 * Math.PI * 2, v = view(rotRing(Math.cos(a) * R.r, 0, Math.sin(a) * R.r, R)), p = project(v);
          if (prev) {
            ctx.strokeStyle = 'rgba(' + c.join(',') + ',' + (A * (0.1 + 0.32 * (v[2] + R.r) / (2 * R.r))) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
          prev = p;
        }
      });
      nodes.forEach(function (n) {
        var R = RING[n.cat], a = n.a0 + t * R.speed;
        var v = view(rotRing(Math.cos(a) * R.r, 0, Math.sin(a) * R.r, R)), p = project(v);
        n.sx = p.x; n.sy = p.y; n.sz = v[2]; n.s = p.s;
        if (n.flash > 0) n.flash -= 0.02;
      });
      // tether from a hovered card to its star
      if (hl && hlEl) {
        var cr = canvas.getBoundingClientRect(), er = hlEl.getBoundingClientRect();
        var ex = clamp(hl.sx + cr.left, er.left, er.right) - cr.left, ey = clamp(hl.sy + cr.top, er.top, er.bottom) - cr.top;
        var g = ctx.createLinearGradient(ex, ey, hl.sx, hl.sy);
        g.addColorStop(0, 'rgba(255,143,184,.85)'); g.addColorStop(1, 'rgba(200,32,63,.25)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.setLineDash([5, 6]); ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hl.sx, hl.sy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#FF8FB8'; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, 6.283); ctx.fill();
      }
      var centre = project(view([0, 0, 0]));
      var order = nodes.slice().sort(function (a, b) { return a.sz - b.sz; });
      var flowerDrawn = false;
      order.forEach(function (n) {
        if (!flowerDrawn && n.sz > 0) { drawFlower(centre.x, centre.y, 44 * centre.s * zoom, t * 0.15, amb); flowerDrawn = true; }
        var c = RING[n.cat].color, A = alphaFor(n.cat), on = hover === n || hl === n;
        var bright = on ? 1 : A * amb;
        var size = (n.cat === 'longterm' ? 7 : 5) * n.s * (on ? 1.8 : 1) * (1 + n.flash * 1.5) * Math.max(zoom, 0.8);
        var g2 = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, size * 4);
        g2.addColorStop(0, 'rgba(' + c.join(',') + ',' + (0.6 * bright) + ')'); g2.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(n.sx, n.sy, size * 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,245,' + bright + ')'; ctx.beginPath(); ctx.arc(n.sx, n.sy, size * 0.55, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(' + c.join(',') + ',' + bright + ')'; ctx.lineWidth = on ? 2 : 1; ctx.beginPath(); ctx.arc(n.sx, n.sy, size, 0, 6.283); ctx.stroke();
        if (on || n.flash > 0) { ctx.strokeStyle = 'rgba(255,143,184,' + (on ? 0.6 : n.flash) + ')'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(n.sx, n.sy, size * 2.2, t * 2, t * 2 + 6.283); ctx.stroke(); ctx.setLineDash([]); }
        var la = (on ? 1 : A * modeT * clamp(0.35 + (n.sz + 3) / 6, 0.25, 1));
        if (la > 0.02) {
          ctx.font = (on ? '600 13px' : '500 11.5px') + ' Inter, system-ui, sans-serif';
          ctx.fillStyle = 'rgba(233,221,226,' + la + ')'; ctx.textAlign = 'left';
          ctx.fillText(n.p.short, n.sx + size + 6, n.sy + 4);
        }
      });
      if (!flowerDrawn) drawFlower(centre.x, centre.y, 44 * centre.s * zoom, t * 0.15, amb);
    }

    function updateCenter(snap) {
      var c = getCenter ? getCenter() : { x: W / 2, y: H / 2 };
      if (snap || !centered) { cx = c.x; cy = c.y; centered = true; }
      else { cx += (c.x - cx) * 0.08; cy += (c.y - cy) * 0.08; }
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (!reduceMotion) t += dt;
      modeT += ((mode === 'focus' ? 1 : 0) - modeT) * 0.06;
      if (!dragging) { yaw += vy; pitch = clamp(pitch + vp, -1.25, 1.25); vy += (0.0015 - vy) * 0.02; vp *= 0.9; }
      updateCenter(false);
      draw();
    }
    function resize() {
      var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr;
      updateCenter(true);
      if (!running) draw();
    }
    function pick(x, y) {
      var best = null, bd = 20;
      nodes.forEach(function (n) { if (alphaFor(n.cat) < 1) return; var d = Math.hypot(n.sx - x, n.sy - y); if (d < bd) { bd = d; best = n; } });
      return best;
    }
    function showTip(n) {
      if (!n) { tip.classList.remove('show'); canvas.style.cursor = ''; return; }
      var cr = canvas.getBoundingClientRect();
      tip.innerHTML = '<small>' + LABEL[n.cat] + ' · ' + esc(n.p.status) + '</small><b>' + esc(n.p.title) + '</b><span>' + esc(n.p.pitch) + '</span><em>Click to open the case file →</em>';
      var x = clamp(cr.left + n.sx + 18, 8, innerWidth - 296), y = clamp(cr.top + n.sy - 20, 70, innerHeight - 170);
      tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      tip.classList.add('show'); canvas.style.cursor = 'pointer';
    }

    var dragging = false, lx = 0, ly = 0, dist = 0;
    canvas.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; dist = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (dragging) {
        var dx = e.clientX - lx, dy = e.clientY - ly; dist += Math.abs(dx) + Math.abs(dy);
        vy = dx * 0.006; vp = dy * 0.004; yaw += vy; pitch = clamp(pitch + vp, -1.25, 1.25); lx = e.clientX; ly = e.clientY;
        if (!running) draw();
      }
      var n = pick(x, y); if (n !== hover) { hover = n; showTip(n); if (!running) draw(); }
    });
    canvas.addEventListener('pointerup', function (e) {
      dragging = false;
      if (dist < 6) {
        var r = canvas.getBoundingClientRect(), n = pick(e.clientX - r.left, e.clientY - r.top) || hover;
        if (n) onPick(n.p.id);
      }
    });
    canvas.addEventListener('pointerleave', function () { if (!dragging) { hover = null; showTip(null); } });
    canvas.addEventListener('wheel', function (e) {
      if (mode !== 'focus') return;              // never hijack page scroll behind the cards
      e.preventDefault(); zoom = clamp(zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.6, 1.9); if (!running) draw();
    }, { passive: false });
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', function () { if (hover) { hover = null; showTip(null); } }, { passive: true });

    return {
      start: function () { resize(); if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      setFilter: function (f) { filter = f; hover = null; showTip(null); if (!running) draw(); },
      setMode: function (m) { mode = m; if (m !== 'focus') zoom = 1; },
      highlight: function (id, el) { hl = id ? byId[id] : null; hlEl = id ? el : null; },
      pulse: function (id) { if (byId[id]) byId[id].flash = 1; },
      starPos: function (id) { var n = byId[id], cr = canvas.getBoundingClientRect(); return n ? { x: cr.left + n.sx, y: cr.top + n.sy } : { x: cr.left + W / 2, y: cr.top + H / 2 }; },
      isHighlighted: function (id) { return !!hl && hl.p.id === id; },
      resize: resize
    };
  }

  window.Scenes3D = { hero: hero, bloom: bloom, constellation: constellation, reduceMotion: reduceMotion };
})();
