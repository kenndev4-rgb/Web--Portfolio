/* ════════════════════════════════════════════════════════════════════
   Kenneth Cueto — Portfolio (Evernight v3)
   Loader · navbar · night sky · Memoria hero · skills bento & sphere ·
   projects sky (cards ⇄ constellation) · case-file modal · coverflow ·
   contact · terminal · cursor & tilt.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PROJECTS = window.PROJECTS || [];
  var Viz = window.Viz, S3D = window.Scenes3D;
  var esc = Viz.esc;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var SVGNS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function store(get, k, v) { try { return get ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } }

  var counts = { all: PROJECTS.length };
  PROJECTS.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });

  /* ═════════ Loader ═════════ */
  var loader = $('#loader');
  var showLoader = !reduceMotion && !store(true, 'ev-seen');
  var introDelay = showLoader ? 1.35 : 0.1;
  if (showLoader) {
    document.body.classList.add('loading');
    setTimeout(function () { loader.classList.add('done'); document.body.classList.remove('loading'); store(false, 'ev-seen', '1'); }, 1500);
  } else loader.classList.add('skip');

  /* ═════════ Petal burst (shared) ═════════ */
  function burst(x, y, n) {
    if (reduceMotion) return;
    for (var i = 0; i < (n || 14); i++) {
      var s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('viewBox', '-50 -50 100 100'); s.setAttribute('class', 'petal-burst');
      var u = document.createElementNS(SVGNS, 'use'); u.setAttribute('href', '#evPetal'); s.appendChild(u);
      s.style.left = (x - 8) + 'px'; s.style.top = (y - 8) + 'px';
      document.body.appendChild(s);
      var a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120, r = (Math.random() - 0.5) * 720;
      var anim = s.animate([
        { transform: 'translate(0,0) rotate(0) scale(.4)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d + 40) + 'px) rotate(' + r + 'deg) scale(' + (0.9 + Math.random()) + ')', opacity: 0 }
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }

  /* ═════════ Navbar: quiet pill ⇄ awake bar, chapter rail, nebula ═════════ */
  var navbar = $('#navbar'), ringFill = $('#ringFill'), toTop = $('#backToTop'), logoFlower = $('#logoFlower');
  var sections = $$('main section[id]'), navLinks = $$('.nav-link'), indicator = $('#navIndicator');
  var heads = $$('.section-head'), heroEl = $('#hero'), heroScene = null, currentSection = '', lastY = window.scrollY;
  var burger = $('#hamburger'), mobileNav = $('#mobileNav'), modal = $('#projectModal');
  var navChapter = $('#navChapter'), rail = $('#chapterRail');
  var CHAP = { hero: ['I', 'Home'], about: ['II', 'About'], skills: ['III', 'Skills'], projects: ['IV', 'Projects'], achievements: ['V', 'Credentials'], contact: ['VI', 'Contact'] };
  var wakeReasons = {}, quietTimer = null, upAccum = 0, upTimer = null, railTimer = null, wasTop = true;
  window.__scrollVel = 0; // read by the night sky for parallax streaks
  var jellyLayer = $("#jellyLayer"), bloomScene = null;

  function moveIndicator() {
    var a = $('.nav-link.active');
    if (!a || !a.offsetWidth || navbar.classList.contains('quiet')) { indicator.style.opacity = 0; return; }
    indicator.style.left = a.offsetLeft + 'px'; indicator.style.width = a.offsetWidth + 'px'; indicator.style.opacity = 1;
  }
  function isAwake() { return Object.keys(wakeReasons).length > 0; }
  function updateNav() {
    var atTop = window.scrollY < 40;
    navbar.classList.toggle('at-top', atTop);
    if (atTop || isAwake()) {
      clearTimeout(quietTimer); quietTimer = null;
      if (navbar.classList.contains('quiet')) { navbar.classList.remove('quiet'); setTimeout(moveIndicator, reduceMotion ? 0 : 620); }
    } else if (!navbar.classList.contains('quiet') && !quietTimer) {
      quietTimer = setTimeout(function () {
        quietTimer = null;
        if (!isAwake() && window.scrollY >= 40) { navbar.classList.add('quiet'); moveIndicator(); }
      }, wasTop ? 250 : 1400);
    }
    wasTop = atTop;
  }
  function wake(reason, on) {
    if (on === !!wakeReasons[reason]) return;
    if (on) wakeReasons[reason] = 1; else delete wakeReasons[reason];
    updateNav();
  }
  function setChapter(id) {
    var c = CHAP[id] || CHAP.hero;
    navChapter.innerHTML = '<i>' + c[0] + '</i><span>' + c[1] + '</span>';
    if (!reduceMotion) { navChapter.classList.remove('turn'); void navChapter.offsetWidth; navChapter.classList.add('turn'); }
  }
  // chapter rail
  var railTicks = sections.map(function (s) {
    var c = CHAP[s.id] || ['', s.id], b = document.createElement('button');
    b.className = 'rail-tick'; b.dataset.id = s.id; b.setAttribute('aria-label', 'Go to ' + c[1]);
    b.innerHTML = '<i>' + c[0] + '</i><b aria-hidden="true"></b><span>' + c[1] + '</span>';
    b.addEventListener('click', function () { s.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
    rail.appendChild(b); return b;
  });

  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight, pct = h > 0 ? y / h : 0, dy = y - lastY;
    ringFill.style.strokeDashoffset = (100 - pct * 100).toFixed(2);
    navbar.classList.toggle('scrolled', y > 30);
    window.__scrollVel = dy;
    // a deliberate scroll-up wakes the bar; scrolling down lets it rest
    if (dy < 0) { upAccum -= dy; if (upAccum > 120) { wake('scrollup', true); clearTimeout(upTimer); upTimer = setTimeout(function () { wake('scrollup', false); }, 1600); } }
    else if (dy > 0) { upAccum = 0; wake('scrollup', false); }
    lastY = y;
    updateNav();
    rail.classList.add('scrolling'); clearTimeout(railTimer); railTimer = setTimeout(function () { rail.classList.remove('scrolling'); }, 1100);
    toTop.classList.toggle('show', y > 600);
    logoFlower.style.transform = 'rotate(' + y * 0.12 + 'deg)';
    var cur = 'hero';
    sections.forEach(function (s) { if (y >= s.offsetTop - 160) cur = s.id; });
    if (cur !== currentSection) {
      var first = !currentSection;
      currentSection = cur;
      navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
      railTicks.forEach(function (t) { t.classList.toggle('active', t.dataset.id === cur); });
      document.body.dataset.chapter = cur;
      setChapter(cur);
      moveIndicator();
      var hd = $('.section-head', $('#' + cur));
      if (hd && !first && !reduceMotion) { hd.classList.remove('pulse'); void hd.offsetWidth; hd.classList.add('pulse'); setTimeout(function () { hd.classList.remove('pulse'); }, 1800); }
    }
    if (!reduceMotion) heads.forEach(function (hd) {
      var r = hd.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
      hd.style.setProperty('--par', ((r.top + r.height / 2 - innerHeight / 2) * 0.18).toFixed(1) + 'px');
    });
    if (heroScene) heroScene.setScroll(y / (heroEl.offsetHeight || 1));
    if (jellyLayer) jellyLayer.classList.toggle('dim', y > heroEl.offsetHeight * 0.55);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  $('.brand').addEventListener('click', function () { var r = logoFlower.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 10); });
  $('#navTerminal').addEventListener('click', function () { $('#terminalToggle').click(); });

  // wake triggers: pointer near the top, hover, keyboard focus, tap on the quiet pill
  var nearTop = false;
  document.addEventListener('mousemove', function (e) { var n = e.clientY < 90; if (n !== nearTop) { nearTop = n; wake('pointer', n); } }, { passive: true });
  navbar.addEventListener('mouseenter', function () { wake('hover', true); });
  navbar.addEventListener('mouseleave', function () { wake('hover', false); });
  navbar.addEventListener('focusin', function () { wake('focus', true); });
  navbar.addEventListener('focusout', function () { setTimeout(function () { wake('focus', navbar.contains(document.activeElement)); }, 0); });
  navbar.addEventListener('click', function (e) {
    if (!navbar.classList.contains('quiet') || e.target.closest('.hamburger')) return;
    e.preventDefault(); e.stopPropagation();
    wake('tap', true); setTimeout(function () { wake('tap', false); }, 3200);
  }, true);
  navbar.addEventListener('transitionend', function (e) { if (e.target === navbar && e.propertyName === 'width') moveIndicator(); });

  function setMenu(open) {
    burger.classList.toggle('open', open); mobileNav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
    navbar.classList.toggle('menu-open', open);
    wake('menu', open);
  }
  burger.addEventListener('click', function () { setMenu(!mobileNav.classList.contains('open')); });
  $$('a', mobileNav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ═════════ Night sky with tumbling petals ═════════ */
  (function nightSky() {
    var cv = $('#nightSky'), ctx = cv.getContext('2d'), stars = [], petals = [], W, H, dpr, raf;
    var petalPath = new Path2D('M0 -4 C 14 -14, 18 -34, 0 -47 C -18 -34, -14 -14, 0 -4 Z');
    function newPetal(anyY) {
      return { x: Math.random() * W, y: anyY ? Math.random() * H : -30 * dpr, k: (0.16 + Math.random() * 0.16) * dpr, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, flip: Math.random() * 6.28, vf: 0.01 + Math.random() * 0.03, vx: (Math.random() - 0.3) * 0.3 * dpr, vy: (Math.random() * 0.35 + 0.2) * dpr, a: Math.random() * 0.4 + 0.35 };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      stars = [];
      for (var i = 0, n = Math.round(innerWidth * innerHeight / 9000); i < n; i++) {
        var pink = Math.random() < 0.18;
        var depth = Math.random();
        stars.push({ x: Math.random() * W, y: Math.random() * H, r: (0.3 + depth * 1.3) * dpr, d: 0.04 + depth * 0.3, a: Math.random() * 6, s: Math.random() * 0.015 + 0.004, c: pink ? '255,143,184' : (Math.random() < 0.5 ? '200,32,63' : '233,221,226'), vy: (Math.random() * 0.06 + 0.02) * dpr, pink: pink });
      }
      petals = [];
      for (var j = 0; j < Math.round(innerWidth / 150); j++) petals.push(newPetal(true));
    }
    var vel = 0, lastScroll = window.scrollY;
    function wrap(v, m) { return ((v % m) + m) % m; }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // smoothed scroll velocity (px per frame) → depth parallax + speed streaks
      var sy = window.scrollY, raw = reduceMotion ? 0 : sy - lastScroll; lastScroll = sy;
      vel += (clamp(raw, -80, 80) - vel) * 0.18;
      var i, s, streak = Math.abs(vel) > 1.2;
      for (i = 0; i < stars.length; i++) {
        s = stars[i]; s.a += s.s;
        if (!reduceMotion) { s.y -= s.vy; if (s.y < 0) s.y += H; }
        s.dy = wrap(s.y - sy * s.d * dpr, H);
        var al = 0.25 + Math.abs(Math.sin(s.a)) * 0.75;
        if (streak) {
          var len = clamp(vel * s.d * 2.2, -60, 60) * dpr;
          ctx.strokeStyle = 'rgba(' + s.c + ',' + al * 0.85 + ')'; ctx.lineWidth = s.r * 1.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(s.x, s.dy); ctx.lineTo(s.x, s.dy + len); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(s.x, s.dy, s.r, 0, 6.283);
          ctx.fillStyle = 'rgba(' + s.c + ',' + al + ')'; ctx.fill();
        }
      }
      ctx.lineWidth = 0.5 * dpr;
      var pinks = stars.filter(function (x) { return x.pink; }), max = 140 * dpr;
      for (var a = 0; a < pinks.length; a++) for (var b = a + 1; b < pinks.length; b++) {
        var dx = pinks[a].x - pinks[b].x, dy = pinks[a].dy - pinks[b].dy, d2 = dx * dx + dy * dy;
        if (d2 < max * max) { ctx.strokeStyle = 'rgba(200,32,63,' + (0.25 * (1 - Math.sqrt(d2) / max) * (streak ? 0.4 : 1)) + ')'; ctx.beginPath(); ctx.moveTo(pinks[a].x, pinks[a].dy); ctx.lineTo(pinks[b].x, pinks[b].dy); ctx.stroke(); }
      }
      for (var k = 0; k < petals.length; k++) {
        var p = petals[k];
        if (!reduceMotion) { p.x += p.vx + Math.sin(p.rot) * 0.25; p.y += p.vy - vel * 0.35 * dpr; p.rot += p.vr + vel * 0.0015; p.flip += p.vf; }
        if (p.y > H + 30) petals[k] = newPetal(false);
        if (p.y < -60 * dpr) p.y = H + 20;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(p.k * Math.cos(p.flip), p.k);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = Math.cos(p.flip) > 0 ? '#0b0609' : '#2a0a14'; ctx.fill(petalPath);
        ctx.lineWidth = 3; ctx.strokeStyle = '#C8203F'; ctx.stroke(petalPath);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }
    resize(); draw();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { cancelAnimationFrame(raf); resize(); draw(); }, 200); });
    document.addEventListener('visibilitychange', function () { cancelAnimationFrame(raf); if (!document.hidden && !reduceMotion) draw(); });
  })();

  /* ═════════ Jellyfish bloom: drifting behind every section ═════════ */
  (function jellyBloom() {
    if (!jellyLayer || !S3D || !S3D.bloom) return;
    var textBlocks = Array.prototype.slice.call(document.querySelectorAll('.hero-content, .section-head, .about-text'));
    bloomScene = S3D.bloom(jellyLayer, { avoid: function () { return textBlocks.map(function (e) { return e.getBoundingClientRect(); }); } });
    if (!bloomScene) { jellyLayer.style.display = 'none'; return; }
    jellyLayer.__bloom = bloomScene;   // handle for tests / console
    bloomScene.start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) bloomScene.stop(); else bloomScene.start(); });
  })();

  /* ═════════ Hero: split letters, Memoria scene, typewriter, stats ═════════ */
  (function heroInit() {
    var ci = 0;
    $$('#heroTitle .w').forEach(function (w) {
      var txt = w.textContent; w.textContent = '';
      txt.split('').forEach(function (c) {
        var sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = c;
        sp.style.animationDelay = (introDelay + ci++ * 0.05) + 's' + (w.classList.contains('accent') ? ', ' + (introDelay + 1.2) + 's' : '');
        w.appendChild(sp);
      });
    });
    $('#heroTitle').setAttribute('aria-label', 'Kenneth Cueto');

    // memories for the glass shards: the most recent real milestone of each project
    var memories = PROJECTS.map(function (p) {
      var real = p.timeline.filter(function (x) { return !/next/i.test(x.date); });
      var m = real[real.length - 1] || p.timeline[0];
      return { id: p.id, project: p.short, date: m.date, label: m.label };
    }).sort(function () { return Math.random() - 0.5; });

    if (!window.matchMedia('(hover: hover)').matches) $('#heroHint').textContent = 'tap a shard to read it · hold to remember';
    heroScene = S3D.hero($('#heroCanvas'), memories, $('#memoryTip'), function (id) { openModal(id); }, {
      introDelay: introDelay,
      onRelease: function (x, y) { if (bloomScene) bloomScene.attract(x, y); }   // a jellyfish comes to see the released memory
    });
    if (!heroScene) {
      document.body.classList.add('no-webgl');
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) heroScene.start(); else heroScene.stop(); }); }).observe(heroEl);
      document.addEventListener('visibilitychange', function () { if (document.hidden) heroScene.stop(); else if (window.scrollY < heroEl.offsetHeight) heroScene.start(); });
    } else heroScene.start();

    var el = $('#typed'), roles = ['University Student', 'Aspiring Data Scientist', 'AI & Computer Vision Builder', 'Night-owl Developer'];
    if (reduceMotion) el.textContent = roles[1];
    else setTimeout(function () {
      var ri = 0, c = 0, del = false;
      (function step() {
        var word = roles[ri]; el.textContent = word.slice(0, c);
        if (!del && c === word.length) { del = true; return setTimeout(step, 1800); }
        if (del && c === 0) { del = false; ri = (ri + 1) % roles.length; }
        c += del ? -1 : 1; setTimeout(step, del ? 40 : 80);
      })();
    }, introDelay * 1000 + 600);

    // Languages: Python, JavaScript, TypeScript, Dart, C++, C#, SQL
    var stats = [[counts.all, 'Projects'], [7, 'Languages'], [5, 'Certifications']];
    $('#heroStats').innerHTML = stats.map(function (s) { return '<li><b data-to="' + s[0] + '">0</b><span>' + s[1] + '</span></li>'; }).join('');
    setTimeout(function () {
      $$('#heroStats b').forEach(function (b) {
        var to = +b.dataset.to, t0 = performance.now();
        if (reduceMotion) { b.textContent = to; return; }
        (function tick(now) { var p = clamp((now - t0) / 1200, 0, 1); b.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0);
      });
    }, introDelay * 1000 + 700);
  })();

  /* ═════════ Marquee ═════════ */
  (function marquee() {
    var words = ['Data Science', 'Computer Vision', 'Local LLMs', 'Machine Learning', 'Analytics', 'Flutter Apps', 'IoT & ESP32', 'Game Systems', 'Encrypted Sync'];
    var flower = '<svg viewBox="0 0 100 100"><use href="#ev-flower"/></svg>';
    var html = words.map(function (w) { return '<span class="marquee-item">' + w + ' ' + flower + '</span>'; }).join('');
    $('#marqueeTrack').innerHTML = html + html;
  })();

  /* ═════════ About medallion (3D follow) ═════════ */
  (function medallion() {
    var m = $('#medallion'); if (reduceMotion) return;
    var wrap = m.parentElement;
    wrap.addEventListener('mousemove', function (e) {
      var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      m.style.transform = 'rotateY(' + x * 30 + 'deg) rotateX(' + -y * 30 + 'deg)';
    });
    wrap.addEventListener('mouseleave', function () { m.style.transform = ''; });
  })();

  /* ═════════ Skills: bento cards + sphere (pin rotates a category to the front) ═════════ */
  (function skills() {
    var box = $('#tagSphere'), caption = $('#sphereCaption'), cards = $$('.skill-card'), tags = [], seen = {};
    cards.forEach(function (card) {
      var chips = $$('.chip', card), strong = chips.filter(function (c) { return c.classList.contains('strong'); }).length, fam = chips.length - strong;
      $('.sk-meter', card).innerHTML = '<div class="sk-bar">' + chips.map(function (c) { return '<i class="' + (c.classList.contains('strong') ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<span>' + (strong ? strong + ' proficient' : '') + (strong && fam ? ' · ' : '') + (fam ? fam + ' familiar' : '') + '</span>';
      chips.forEach(function (c) {
        var t = c.textContent.trim(); if (seen[t]) return; seen[t] = 1;
        tags.push({ text: t, strong: c.classList.contains('strong'), cat: card.dataset.cat });
      });
    });
    ['Three.js', 'FAISS', 'Unity', 'C#', 'TypeScript', 'PostgreSQL'].forEach(function (t) { if (!seen[t]) tags.push({ text: t, strong: false, cat: 'extra' }); });
    var N = tags.length, golden = Math.PI * (3 - Math.sqrt(5));
    tags.forEach(function (t, i) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      t.x = Math.cos(th) * r; t.y = y; t.z = Math.sin(th) * r;
      t.el = document.createElement('span'); t.el.className = 'tag' + (t.strong ? ' strong' : ''); t.el.textContent = t.text; t.el.dataset.cat = t.cat;
      box.appendChild(t.el);
    });
    var ax = 0.3, ay = 0, vx = 0.0012, vy = 0.004, R = 200, drag = false, lx = 0, ly = 0, running = false, raf, moved = 0;
    var pinned = null, tAx = 0, tAy = 0;
    function layout() { R = box.clientWidth * 0.4; }
    function render() {
      var cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      tags.forEach(function (t) {
        var x1 = t.x * cy + t.z * sy, z1 = -t.x * sy + t.z * cy;
        var y2 = t.y * cx - z1 * sx, z2 = t.y * sx + z1 * cx;
        var sc = 0.6 + (z2 + 1) * 0.24;
        t.el.style.transform = 'translate(-50%,-50%) translate3d(' + (x1 * R).toFixed(1) + 'px,' + (y2 * R).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        t.el.style.opacity = (0.22 + (z2 + 1) * 0.39).toFixed(2);
        t.el.style.zIndex = Math.round((z2 + 1) * 50);
      });
    }
    function angDiff(a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
    function frame() {
      raf = requestAnimationFrame(frame);
      if (pinned) { ay += angDiff(ay, tAy) * 0.07; ax += angDiff(ax, tAx) * 0.07; }
      else if (!drag) { vy += (0.004 - vy) * 0.01; vx += (0.0012 - vx) * 0.01; ay += vy; ax += vx; }
      render();
    }
    function highlight(cat) {
      var c = pinned || cat;
      tags.forEach(function (t) { t.el.classList.toggle('hl', !!c && t.cat === c); });
      cards.forEach(function (r) { r.classList.toggle('active', !!c && r.dataset.cat === c); });
    }
    function pin(cat) {
      pinned = pinned === cat ? null : cat;
      cards.forEach(function (c) { var on = c.dataset.cat === pinned; c.classList.toggle('pinned', on); c.setAttribute('aria-pressed', on); });
      if (pinned) {
        var sx = 0, sy = 0, sz = 0;
        tags.forEach(function (t) { if (t.cat === pinned) { sx += t.x; sy += t.y; sz += t.z; } });
        var len = Math.hypot(sx, sy, sz) || 1; sx /= len; sy /= len; sz /= len;
        tAy = Math.atan2(-sx, sz); tAx = Math.atan2(sy, Math.hypot(sx, sz));
        caption.innerHTML = 'Focused: <b>' + esc($('h3', $('.skill-card[data-cat="' + pinned + '"]')).textContent) + '</b>';
        if (!running) { ay = tAy; ax = tAx; render(); }
      } else caption.textContent = '';
      box.classList.toggle('focused', !!pinned);
      highlight(null);
    }
    layout(); render();
    window.addEventListener('resize', function () { layout(); render(); });
    box.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lx = e.clientX; ly = e.clientY; box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6 && pinned) pin(pinned);
      vy = dx * 0.004; vx = dy * -0.004; ay += vy; ax += vx; lx = e.clientX; ly = e.clientY; if (!running) render();
    });
    box.addEventListener('pointerup', function (e) {
      drag = false;
      if (moved < 6) { var el = document.elementFromPoint(e.clientX, e.clientY); if (el && el.classList.contains('tag') && el.dataset.cat !== 'extra') pin(el.dataset.cat); }
    });
    box.addEventListener('pointercancel', function () { drag = false; });
    cards.forEach(function (c) {
      c.addEventListener('mouseenter', function () { highlight(c.dataset.cat); });
      c.addEventListener('mouseleave', function () { highlight(null); });
      c.addEventListener('click', function () { pin(c.dataset.cat); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(c.dataset.cat); } });
      c.addEventListener('mousemove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--sx', (e.clientX - r.left) + 'px'); c.style.setProperty('--sy', (e.clientY - r.top) + 'px'); });
    });
    box.addEventListener('mouseover', function (e) { if (e.target.classList.contains('tag')) highlight(e.target.dataset.cat); });
    box.addEventListener('mouseleave', function () { highlight(null); });
    if (!reduceMotion && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) {
        if (e.isIntersecting && !running) { running = true; frame(); } else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
      }); }).observe(box);
    }
  })();

  /* ═════════ Project cards ═════════ */
  function card(p) {
    var feature = p.category === 'longterm', chips = [];
    Object.keys(p.stack).forEach(function (k) { chips.push(p.stack[k][0]); });
    chips = chips.slice(0, 3);
    var extra = '';
    if (feature) {
      extra = '<div class="progress"><div class="progress-label"><span>Progress</span><b>' + p.progress + '%</b></div><div class="progress-track"><div class="progress-fill" data-w="' + p.progress + '"></div></div></div>' +
        '<div class="milestones">' + p.roadmap.map(function (r) { return '<span class="' + (r.done ? 'done' : '') + '" title="' + esc(r.label) + '">' + r.key + '</span>'; }).join('') + '</div>';
    }
    return '<button class="p-card tilt' + (feature ? ' feature' : '') + '" data-id="' + p.id + '" data-cat="' + p.category + '" data-animate aria-label="Open case file: ' + esc(p.title) + '">' +
      '<span class="p-clip" aria-hidden="true"><svg class="p-water" viewBox="0 0 100 100"><use href="#ev-flower-line"/></svg></span>' +
      (feature ? '<span class="feature-badge" aria-hidden="true"><svg viewBox="0 0 100 100"><use href="#ev-flower"/></svg></span>' : '') +
      '<div class="p-card-top"><span class="p-emblem" aria-hidden="true"><svg viewBox="0 0 100 100"><use href="#ev-flower"/></svg><b>' + esc(p.glyph) + '</b></span><div class="p-head"><span class="p-title" style="display:block">' + esc(feature ? p.title : p.short) + '</span>' +
      '<div class="p-meta"><span class="status-pill" data-s="' + p.status + '">' + p.status + '</span></div></div></div>' +
      (p.source.updatePending ? '<span class="archived-tag">◈ Source archived · update pending</span>' : '') +
      '<p class="p-pitch">' + esc(p.pitch) + '</p>' + extra +
      '<div class="p-mini">' + Viz.miniDiagram(p) + '</div>' +
      '<div class="p-foot"><div class="p-chips">' + chips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div><span class="p-open">Open case file →</span></div>' +
      '</button>';
  }
  ['longterm', 'academic', 'casual'].forEach(function (cat) {
    $('#grid-' + cat).innerHTML = PROJECTS.filter(function (p) { return p.category === cat; }).map(card).join('');
  });
  $$('.filter-btn').forEach(function (b) { $('.count', b).textContent = counts[b.dataset.filter] || 0; });
  $$('.p-card').forEach(function (c) { c.addEventListener('click', function () { openModal(c.dataset.id, null, c); }); });

  /* ═════════ Projects sky: cards ⇄ constellation ═════════ */
  var projSection = $('#projects'), skyCanvas = $('#skyCanvas'), stage = $('#skyStage'), gridView = $('#gridView'), observatory = $('#observatory');
  var viewMode = 'grid', currentFilter = 'all', switching = false;
  var sky = S3D.constellation(skyCanvas, $('#skyTip'), PROJECTS, function (id) { openModal(id, null, null); }, function () {
    var cr = skyCanvas.getBoundingClientRect();
    if (viewMode === 'sky' && !stage.hidden) { var r = stage.getBoundingClientRect(); return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top }; }
    return { x: cr.width / 2, y: cr.height * 0.52 };
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) sky.start(); else sky.stop(); }); }).observe(projSection);
  else sky.start();

  $$('.p-card').forEach(function (c) {
    c.addEventListener('mouseenter', function () { if (viewMode === 'grid') sky.highlight(c.dataset.id, c); });
    c.addEventListener('mouseleave', function () { sky.highlight(null); });
    c.addEventListener('focus', function () { if (viewMode === 'grid') sky.highlight(c.dataset.id, c); });
    c.addEventListener('blur', function () { sky.highlight(null); });
  });

  var ORBIT = { all: '3 orbits', longterm: 'inner orbit', academic: 'middle orbit', casual: 'outer orbit' };
  function updateObs() {
    var n = counts[currentFilter] || 0, label = currentFilter === 'all' ? '' : (Viz.CAT_LABEL[currentFilter].toLowerCase() + ' ');
    $('#obsCount').innerHTML = '<b>' + n + '</b> ' + label + 'project' + (n === 1 ? '' : 's') + ' · ' + ORBIT[currentFilter];
  }
  function placeThumb() {
    var a = $('.vs-btn.active'), th = $('#vsThumb'); if (!a) return;
    th.style.left = a.offsetLeft + 'px'; th.style.width = a.offsetWidth + 'px';
  }
  function inView(el) { var r = el.getBoundingClientRect(); return r.bottom > -40 && r.top < innerHeight + 40 && r.width > 0; }
  function keepToolbar(fn) { // keep the observatory bar steady on screen across layout changes
    var before = observatory.getBoundingClientRect().top; fn();
    var after = observatory.getBoundingClientRect().top; if (Math.abs(after - before) > 1) window.scrollBy(0, after - before);
  }
  function setSwitch(v) {
    $$('.vs-btn').forEach(function (b) { var on = b.dataset.view === v; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
    placeThumb();
  }
  function toSky() {
    if (viewMode === 'sky' || switching) return;
    switching = true; viewMode = 'sky'; setSwitch('sky'); sky.highlight(null);
    projSection.classList.add('sky-mode');
    var cards = $$('.p-card').filter(function (c) { return c.offsetParent && inView(c); });
    function finish() {
      keepToolbar(function () { gridView.hidden = true; stage.hidden = false; });
      $$('.p-card').forEach(function (c) { c.getAnimations().forEach(function (a) { a.cancel(); }); });
      gridView.classList.remove('leaving');
      sky.setMode('focus'); switching = false;
      var top = observatory.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (reduceMotion || !cards.length) return finish();
    gridView.classList.add('leaving');
    var end = 0;
    cards.forEach(function (c, i) {
      var r = c.getBoundingClientRect(), s = sky.starPos(c.dataset.id), delay = i * 40;
      var dx = s.x - (r.left + r.width / 2), dy = s.y - (r.top + r.height / 2);
      c.animate([{ transform: 'none', opacity: 1, filter: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.04) rotate(25deg)', opacity: 0, filter: 'blur(2px)' }],
        { duration: 720, delay: delay, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      setTimeout(function () { sky.pulse(c.dataset.id); }, delay + 650);
      end = Math.max(end, delay + 720);
    });
    setTimeout(finish, end + 40);
  }
  function toGrid() {
    if (viewMode === 'grid' || switching) return;
    switching = true; viewMode = 'grid'; setSwitch('grid');
    projSection.classList.remove('sky-mode');
    keepToolbar(function () { stage.hidden = true; gridView.hidden = false; });
    sky.setMode('ambient');
    var cards = $$('.p-card').filter(function (c) { return c.offsetParent; });
    cards.forEach(function (c) { c.classList.add('in'); });
    $$('.progress-fill[data-w]').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
    var visible = cards.filter(inView);
    if (reduceMotion || !visible.length) { switching = false; return; }
    var end = 0;
    visible.forEach(function (c, i) {
      var r = c.getBoundingClientRect(), s = sky.starPos(c.dataset.id), delay = 120 + i * 55;
      var dx = s.x - (r.left + r.width / 2), dy = s.y - (r.top + r.height / 2);
      sky.pulse(c.dataset.id);
      c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.04) rotate(-25deg)', opacity: 0, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'none' }],
        { duration: 780, delay: delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      end = Math.max(end, delay + 780);
    });
    setTimeout(function () { switching = false; }, end);
  }
  $$('.vs-btn').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.view === 'sky') toSky(); else toGrid(); }); });
  window.addEventListener('resize', placeThumb);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeThumb);

  $$('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.filter-btn').forEach(function (b) { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
      currentFilter = btn.dataset.filter;
      $$('.project-group').forEach(function (g) { g.hidden = !(currentFilter === 'all' || g.dataset.group === currentFilter); });
      sky.setFilter(currentFilter); updateObs();
    });
  });
  updateObs(); setTimeout(placeThumb, 50);

  /* ═════════ Reveal on scroll ═════════ */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.progress-fill[data-w]', e.target).forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  $$('[data-animate]').forEach(function (el, i) {
    el.style.transitionDelay = (i % 3) * 90 + 'ms';
    if (io) io.observe(el); else el.classList.add('in');
  });
  if (!io) $$('.progress-fill[data-w]').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
  var footer = $('#footer');
  if (io) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) footer.classList.add('drawn'); }); }, { threshold: 0.3 }).observe(footer);
  else footer.classList.add('drawn');

  /* ═════════ Case-file modal (FLIP open) ═════════ */
  var modalBox = $('.modal', modal), body = $('#modalBody'), tabInd = $('#mtabIndicator'), lastFocus = null, current = null;
  function placeTabIndicator() {
    var a = $('.mtab.active', modal); if (!a) return;
    tabInd.style.left = a.offsetLeft + 8 + 'px'; tabInd.style.width = (a.offsetWidth - 16) + 'px';
  }
  function setTab(tab) {
    $$('.mtab', modal).forEach(function (t) { var on = t.dataset.tab === tab; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    placeTabIndicator();
    body.scrollTop = 0;
    Viz.render(current, tab, body);
  }
  function openModal(id, tab, originEl) {
    current = PROJECTS.filter(function (p) { return p.id === id; })[0];
    if (!current) return false;
    lastFocus = document.activeElement;
    $('#modalGlyph').textContent = current.glyph;
    $('#modalCategory').textContent = Viz.CAT_LABEL[current.category];
    var st = $('#modalStatus'); st.textContent = current.status; st.dataset.s = current.status;
    $('#modalTitle').textContent = current.title;
    $('#modalPitch').textContent = current.pitch;
    $('#modalFoot').innerHTML = '<span>Source: <code>' + esc(current.source.path) + '</code></span>' + (current.source.updatePending ? '<span class="archived-tag" style="margin:0;transform:none">◈ Archived .zip · update pending</span>' : '');
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTab(tab || 'overview');
    if (!reduceMotion && modalBox.animate) {
      var from = 'translateY(40px) scale(.92) rotateX(16deg)';
      if (originEl) {
        var r = originEl.getBoundingClientRect(), m = modalBox.getBoundingClientRect();
        var dx = (r.left + r.width / 2) - (m.left + m.width / 2), dy = (r.top + r.height / 2) - (m.top + m.height / 2);
        from = 'translate(' + dx + 'px,' + dy + 'px) scale(' + clamp(r.width / m.width, 0.2, 0.9).toFixed(3) + ') rotateX(24deg)';
      }
      modalBox.animate([{ transform: from, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.22,.61,.36,1)' });
    }
    setTimeout(function () { $('#modalClose').focus(); placeTabIndicator(); }, 60);
    return true;
  }
  function closeModal() {
    if (!reduceMotion && modalBox.animate) modalBox.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(30px) scale(.95) rotateX(-10deg)', opacity: 0 }], { duration: 280, easing: 'ease-in' });
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () { if (!modal.classList.contains('open')) body.innerHTML = ''; }, 320);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $$('.mtab', modal).forEach(function (t) { t.addEventListener('click', function () { setTab(t.dataset.tab); }); });
  $('#modalTabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var tabs = $$('.mtab', modal), i = tabs.indexOf(document.activeElement); if (i < 0) return;
    var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); setTab(n.dataset.tab);
  });
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  window.addEventListener('resize', function () { if (modal.classList.contains('open')) placeTabIndicator(); });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {
      var f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ═════════ Certificates — 3D coverflow ═════════ */
  (function certs() {
    var slides = $$('.cert-slide'), dotsBox = $('#certDots'), idx = 0, lock = false;
    var typeEl = $('#certType'), provEl = $('#certProvider'), nameEl = $('#certName'), linkEl = $('#certLink'), counter = $('#certCounter');
    var badge = $('#badgeImg'), fallback = $('#badgeFallback'), prev = $('#certPrev'), next = $('#certNext');
    slides.forEach(function (s, i) {
      var d = document.createElement('button'); d.className = 'cert-dot'; d.setAttribute('aria-label', 'Certificate ' + (i + 1));
      d.addEventListener('click', function () { go(i); }); dotsBox.appendChild(d);
      s.addEventListener('click', function () { if (i !== idx) go(i); });
    });
    var dots = $$('.cert-dot', dotsBox);
    function swap(el, txt) { el.style.opacity = 0; setTimeout(function () { el.textContent = txt; el.style.opacity = 1; }, 180); }
    function layout() {
      var narrow = innerWidth < 640;
      slides.forEach(function (s, i) {
        var d = i - idx, ad = Math.abs(d);
        s.style.transform = 'translateX(' + d * (narrow ? 34 : 46) + '%) translateZ(' + (-ad * 200) + 'px) rotateY(' + (d === 0 ? 0 : d > 0 ? -42 : 42) + 'deg) scale(' + (d === 0 ? 1 : 0.88) + ')';
        s.style.opacity = ad > 2 ? 0 : 1 - ad * 0.22;
        s.style.zIndex = 10 - ad;
        s.style.filter = d === 0 ? 'none' : 'brightness(.5) saturate(.7)';
        s.style.pointerEvents = ad > 2 ? 'none' : 'auto';
        s.classList.toggle('active', d === 0);
        s.setAttribute('aria-hidden', d !== 0);
      });
    }
    function go(i) {
      idx = clamp(i, 0, slides.length - 1);
      var s = slides[idx];
      layout();
      dots.forEach(function (x, k) { x.classList.toggle('active', k === idx); });
      swap(typeEl, s.dataset.type); swap(provEl, s.dataset.provider); swap(nameEl, s.dataset.name);
      linkEl.href = s.dataset.link;
      counter.textContent = ('0' + (idx + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
      if (s.dataset.badgePng) {
        badge.hidden = false; fallback.style.display = 'none';
        badge.src = 'static/img/badge/' + s.dataset.badgePng; badge.alt = s.dataset.name + ' badge';
        badge.style.animation = 'none'; void badge.offsetWidth; badge.style.animation = '';
      } else { badge.hidden = true; badge.removeAttribute('src'); fallback.style.display = ''; }
      prev.disabled = idx === 0; next.disabled = idx === slides.length - 1;
    }
    prev.addEventListener('click', function () { go(idx - 1); });
    next.addEventListener('click', function () { go(idx + 1); });
    window.addEventListener('resize', layout);
    var flow = $('#certScroll');
    flow.addEventListener('wheel', function (e) {
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, dir = delta > 0 ? 1 : -1;
      if ((dir > 0 && idx === slides.length - 1) || (dir < 0 && idx === 0)) return;
      e.preventDefault();
      if (lock) return; lock = true; setTimeout(function () { lock = false; }, 550);
      go(idx + dir);
    }, { passive: false });
    var sx = null;
    flow.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    flow.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); sx = null; });
    var section = $('#achievements');
    document.addEventListener('keydown', function (e) {
      if (modal.classList.contains('open') || /input|textarea/i.test(document.activeElement.tagName)) return;
      var r = section.getBoundingClientRect();
      if (r.top > innerHeight * 0.6 || r.bottom < innerHeight * 0.4) return;
      if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && idx < slides.length - 1) { e.preventDefault(); go(idx + 1); }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && idx > 0) { e.preventDefault(); go(idx - 1); }
    });
    go(0);
  })();

  /* ═════════ Contact form (Web3Forms) ═════════ */
  (function form() {
    var f = $('#contactForm'), status = $('#formStatus');
    function set(msg, cls) { status.textContent = msg; status.className = 'form-status ' + (cls || ''); }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.name.value.trim(), email = f.email.value.trim(), msg = f.message.value.trim();
      if (!name || !email || !msg) return set('Please fill in every field.', 'err');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return set('Please enter a valid email address.', 'err');
      if (f.access_key.value === 'YOUR_WEB3FORMS_ACCESS_KEY') return set('The contact form is not configured yet — please email me directly.', 'err');
      var btn = $('button[type=submit]', f); btn.disabled = true; set('Sending…');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(f) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success) { set('Thank you! Your message has been sent.', 'ok'); f.reset(); var r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 22); }
          else set(d.message || 'Something went wrong. Please try again.', 'err');
        })
        .catch(function () { set('Network error. Please try again or email me directly.', 'err'); })
        .then(function () { btn.disabled = false; });
    });
  })();

  /* ═════════ Terminal ═════════ */
  (function terminal() {
    var panel = $('#kcTerminal'), toggle = $('#terminalToggle'), input = $('#terminalInput'), out = $('#terminalOutput'), tbody = $('#terminalBody');
    var hist = [], hi = -1;
    function print(html) { var d = document.createElement('div'); d.innerHTML = html; out.appendChild(d); tbody.scrollTop = tbody.scrollHeight; }
    function setOpen(open) {
      panel.classList.toggle('open', open); toggle.classList.toggle('active', open); $('#navTerminal').classList.toggle('active', open);
      if (open) { if (!out.childNodes.length) welcome(); setTimeout(function () { input.focus(); }, 100); }
    }
    function welcome() {
      print('<span class="t-accent">✿ ─────────────────────────────── ✿</span>');
      print('  <span class="t-pink">Kenneth Cueto · Evernight Terminal</span>');
      print('<span class="t-accent">✿ ─────────────────────────────── ✿</span>');
      print('Type <span class="t-cmd">help</span> to see available commands.');
      print('<span class="t-muted">Ctrl+` toggles this terminal.</span>');
      print('');
    }
    toggle.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    $('#terminalClose').addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.key === '`') { e.preventDefault(); setOpen(!panel.classList.contains('open')); }
      if (e.key === 'Escape' && panel.classList.contains('open') && !modal.classList.contains('open')) setOpen(false);
    });
    tbody.addEventListener('click', function (e) {
      if (e.target.dataset && e.target.dataset.open) { openModal(e.target.dataset.open); return; }
      input.focus();
    });
    function listProjects(filter) {
      (filter ? [filter] : ['academic', 'casual', 'longterm']).forEach(function (c) {
        var list = PROJECTS.filter(function (p) { return p.category === c; });
        print('<span class="t-pink">' + Viz.CAT_LABEL[c] + '</span> <span class="t-muted">(' + list.length + ')</span>');
        list.forEach(function (p) {
          var tag = p.status === 'Completed' ? '<span class="t-pink">[done]</span>' : p.status === 'Ongoing' ? '<span class="t-pink">[ongoing]</span>' : p.status === 'In Design' ? '<span class="t-muted">[design]</span>' : '<span class="t-accent">[wip]</span>';
          print('  ✦ <span class="t-link" data-open="' + p.id + '">' + esc(p.short) + '</span> ' + tag + ' <span class="t-muted">' + p.id + '</span>');
        });
      });
      print(''); print('<span class="t-muted">Click a name, or type: open &lt;id&gt;</span>');
    }
    var cmds = {
      help: function () {
        print('<span class="t-pink">Available commands</span>');
        [['whoami', 'Who is Kenneth?'], ['education', 'Academic background'], ['skills', 'Technical skills'],
         ['projects [--academic|--casual|--longterm]', 'List projects'], ['open &lt;id&gt;', 'Open a project case file'],
         ['sky', 'Show the projects constellation'], ['bloom', 'Release memoria'], ['jelly', 'Call the jellyfish'], ['remember', 'Make the shattered pane whole'],
         ['certs', 'Certifications'], ['neofetch', 'Profile card'], ['goto &lt;section&gt;', 'Jump to a section'],
         ['echo &lt;text&gt;', 'Echo text'], ['history', 'Command history'], ['clear', 'Clear the screen'], ['exit', 'Close terminal']
        ].forEach(function (c) { print('  <span class="t-cmd">' + c[0] + '</span> <span class="t-muted">— ' + c[1] + '</span>'); });
        print(''); print('<span class="t-muted">Try: sudo hire kenneth</span>');
      },
      whoami: function () {
        print('<span class="t-head">Kenneth Cueto</span>'); print('University Student · Aspiring Data Scientist'); print('');
        print('A curious builder who sits at the crossroads of technology and data. I prototype with local LLMs, study computer vision, and hunt patterns in data. When I\'m not coding, I\'m earning certifications and chasing the next project idea.');
      },
      education: function () {
        print('<span class="t-pink">Education</span>'); print('  <span class="t-head">Bachelor of Industrial Technology</span>');
        print('  Major in Computer Technology <span class="t-muted">(undergraduate, in progress)</span>'); print(''); print('Career goal: <span class="t-accent">Data Science</span>');
      },
      skills: function () {
        print('<span class="t-pink">Technical skills</span>');
        print('  <span class="t-accent">Frontend  </span> HTML5 · CSS3 · JavaScript · React');
        print('  <span class="t-accent">Backend   </span> Python · Flask · SQL · Pandas · Node.js');
        print('  <span class="t-accent">AI / ML   </span> OpenCV · Ollama · LangChain · TensorFlow · PyTorch');
        print('  <span class="t-accent">Analytics </span> Excel · Tableau · Matplotlib · Streamlit');
        print('  <span class="t-accent">Mobile/IoT</span> Flutter · ESP32 · Firebase');
        print('  <span class="t-accent">Tools     </span> Git · GitHub · VS Code · Docker · Linux');
      },
      certs: function () {
        print('<span class="t-pink">Certifications</span>');
        print('  <span class="t-head">Professional</span>'); print('    ✦ Google Data Analytics — Coursera'); print('    ✦ IBM AI Developer — Coursera');
        print('  <span class="t-head">Specializations</span>'); print('    ✦ Data Analysis &amp; Visualization Foundations — IBM'); print('    ✦ Python for Everybody — University of Michigan');
        print('  <span class="t-head">Training</span>'); print('    ✦ Data Analytics Training — YouView Company');
      },
      neofetch: function () {
        var rows = [['Role', 'University Student'], ['Goal', 'Data Scientist'], ['Major', 'Computer Technology'], ['Stack', 'Python · JS · SQL · Dart'],
          ['AI', 'Ollama · OpenCV · PyTorch'], ['Certs', '5'], ['Projects', counts.all + ' (' + counts.academic + ' academic · ' + counts.casual + ' casual · ' + counts.longterm + ' long-term)'], ['Theme', 'Evernight · Memoria']];
        var art = ['   ▄▀▀▀▀▀▄  ', '  █ ░ ✿ ░ █ ', '  ▀▄▄▄▄▄▄▀  ', '   ╎ ╎╎ ╎   ', '   ╎ ╎╎ ╎   ', '    ╎  ╎    ', '            ', '            '];
        print(''); print('  ' + ' '.repeat(12) + '   <span class="t-head">Kenneth Cueto</span>');
        rows.forEach(function (r, i) { print('  <span class="t-accent">' + art[i] + '</span>   <span class="t-pink">' + r[0] + ':</span> ' + esc(r[1])); });
        print('');
        print('  <span style="color:#07050A">██</span><span style="color:#21151C">██</span><span style="color:#6E0B1E">██</span><span style="color:#A3142F">██</span><span style="color:#C8203F">██</span><span style="color:#FF8FB8">██</span><span style="color:#FFC1D6">██</span>');
      },
      sky: function () { projSection.scrollIntoView({ behavior: 'auto' }); setTimeout(toSky, 60); print('Opening the constellation… <span class="t-pink">✦</span>'); },
      bloom: function () { burst(innerWidth / 2, innerHeight / 2, 30); if (heroScene && window.scrollY < heroEl.offsetHeight) heroScene.burst(); print('<span class="t-pink">✿</span> memoria released.'); },
      jelly: function () {
        if (!bloomScene) { print('<span class="t-muted">The jellyfish are resting (WebGL unavailable or reduced motion).</span>'); return; }
        bloomScene.attract(innerWidth / 2, innerHeight / 2, true); print('<span class="t-pink">~</span> the jellyfish drift closer…');
      },
      remember: function () {
        if (!heroScene || window.scrollY > heroEl.offsetHeight * 0.5) { print('<span class="t-muted">Scroll back to the top to see the pane.</span>'); return; }
        heroScene.remember(); print('<span class="t-pink">◇</span> the fragments remember their shape.');
      },
      clear: function () { out.innerHTML = ''; },
      exit: function () { setOpen(false); },
      history: function () { if (!hist.length) return print('<span class="t-muted">No history yet.</span>'); hist.forEach(function (c, i) { print('  <span class="t-muted">' + (i + 1) + '</span>  ' + esc(c)); }); }
    };
    function gotoSection(arg) {
      var map = { home: 'hero', about: 'about', skills: 'skills', projects: 'projects', achievements: 'achievements', certs: 'achievements', credentials: 'achievements', contact: 'contact' };
      var id = map[arg];
      if (!id) { print('<span class="t-err">Unknown section:</span> ' + esc(arg)); print('<span class="t-muted">Available: home, about, skills, projects, credentials, contact</span>'); return; }
      $('#' + id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); print('Navigating to <span class="t-accent">' + arg + '</span>…');
    }
    function run(raw) {
      var line = raw.trim(); if (!line) return;
      hist.push(line); hi = hist.length;
      print('<span class="t-cmd">visitor@evernight:~$</span> ' + esc(line));
      var parts = line.split(/\s+/), cmd = parts[0].toLowerCase(), args = parts.slice(1).join(' ');
      if (cmds[cmd]) cmds[cmd]();
      else if (cmd === 'projects' || (cmd === 'ls' && args === 'projects')) {
        var f = { '--academic': 'academic', '--casual': 'casual', '--longterm': 'longterm', '--long-term': 'longterm' }[args.toLowerCase()];
        if (args && !f && cmd === 'projects') print('<span class="t-err">Unknown filter:</span> ' + esc(args)); else listProjects(f);
      }
      else if (cmd === 'open') { if (!openModal(args.toLowerCase())) { print('<span class="t-err">No project with id</span> ' + esc(args || '(missing)')); print('<span class="t-muted">Type projects to see ids.</span>'); } else print('Opening case file <span class="t-pink">' + esc(args) + '</span>…'); }
      else if (cmd === 'goto' || cmd === 'cd') gotoSection(args.toLowerCase());
      else if (cmd === 'echo') print(esc(args));
      else if (cmd === 'date') print(new Date().toLocaleString());
      else if (cmd === 'sudo' && args.toLowerCase() === 'hire kenneth') { print('<span class="t-pink">✿ Excellent decision!</span>'); print('Kenneth has been added to your team.'); print('<span class="t-muted">(This may or may not be legally binding.)</span>'); burst(innerWidth / 2, innerHeight / 2, 24); }
      else if (cmd === 'sudo') print('<span class="t-err">Permission denied.</span> Nice try though.');
      else if (cmd === 'ls') print('about/  skills/  projects/  credentials/  contact/');
      else if (cmd === 'pwd') print('/home/visitor/evernight-portfolio');
      else if (cmd === 'cat' && args === 'readme.md') { print('<span class="t-head"># Kenneth Cueto — Portfolio</span>'); print('University Student | Aspiring Data Scientist'); print('<span class="t-muted">Built with HTML, CSS, vanilla JS and three.js. Theme: Evernight · Memoria.</span>'); }
      else if (cmd === 'cat') print('<span class="t-err">cat:</span> ' + esc(args || 'missing file') + ': No such file <span class="t-muted">(try readme.md)</span>');
      else if (cmd === 'rm' && args.indexOf('-rf') > -1) print('<span class="t-err">Nice try!</span> This portfolio is protected by moonlight.');
      else if (/^(hello|hi|hey)$/.test(cmd)) print('Hey there! Type <span class="t-cmd">help</span> to explore.');
      else if (cmd === 'coffee') print('☕ Brewing… <span class="t-pink">done!</span> +10 productivity.');
      else if (cmd === 'moon') print('<span class="t-pink">☾</span> Even the longest night keeps its stars.');
      else { print('<span class="t-err">Command not found:</span> ' + esc(cmd)); print('Type <span class="t-cmd">help</span> for available commands.'); }
      print('');
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; } }
    });
  })();

  /* ═════════ Cursor, glow, tilt, magnetic ═════════ */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduceMotion) {
    document.body.classList.add('has-cursor');
    var dot = $('#curDot'), ring = $('#curRing'), glow = $('#cursorGlow');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, gx = mx, gy = my;
    document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; glow.style.opacity = 1; });
    document.addEventListener('mouseleave', function () { glow.style.opacity = 0; });
    document.addEventListener('mousedown', function () { ring.classList.add('press'); });
    document.addEventListener('mouseup', function () { ring.classList.remove('press'); });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      ring.classList.toggle('view', !!t.closest('.p-card'));
      ring.classList.toggle('hover', !t.closest('.p-card') && !!t.closest('a, button, input[type=range], .arch-node, .gesture, .tag, .skill-card, #skyCanvas, #heroCanvas, .cert-slide'));
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; gx += (mx - gx) * 0.08; gy += (my - gy) * 0.08;
      dot.style.transform = 'translate(' + (mx - 8) + 'px,' + (my - 8) + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      glow.style.transform = 'translate(' + (gx - 230) + 'px,' + (gy - 230) + 'px)';
      requestAnimationFrame(loop);
    })();

    $$('.tilt').forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.classList.add('is-tilting'); el.style.transition = 'border-color .3s, box-shadow .4s, transform .15s ease-out'; });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(1000px) rotateX(' + ((0.5 - py) * 10) + 'deg) rotateY(' + ((px - 0.5) * 12) + 'deg) translateZ(10px)';
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
        el.style.setProperty('--sheen', (120 - px * 140) + '%');
      });
      el.addEventListener('mouseleave', function () { el.style.transition = ''; el.style.transform = ''; setTimeout(function () { if (!el.matches(':hover')) el.classList.remove('is-tilting'); }, 450); });
    });
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.2) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  onScroll();
  setTimeout(moveIndicator, 300);
})();
