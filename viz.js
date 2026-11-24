/* ════════════════════════════════════════════════════════════════════
   VIZ — renderers for the project case-file modal and card mini-maps.
   Pure vanilla JS + inline SVG, driven entirely by window.PROJECTS.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PALETTE = ['#C8203F', '#FF8FB8', '#6E0B1E', '#FFC1D6', '#A3142F', '#5A4A52'];
  var CAT_LABEL = { academic: 'Academic', casual: 'Casual', longterm: 'Long-Term' };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  /* ─────────────── layout of a flow graph into columns ─────────────── */
  function layout(flow, opt) {
    opt = opt || {};
    var colW = opt.colW || 180, rowH = opt.rowH || 72, nodeW = opt.nodeW || 140, nodeH = opt.nodeH || 40, padX = opt.padX || 20, padY = opt.padY || 34;
    var cols = {};
    flow.nodes.forEach(function (n) { (cols[n.col] = cols[n.col] || []).push(n); });
    var colKeys = Object.keys(cols).map(Number).sort(function (a, b) { return a - b; });
    var maxRows = Math.max.apply(null, colKeys.map(function (k) { return cols[k].length; }));
    var H = padY * 2 + maxRows * rowH - (rowH - nodeH);
    var W = padX * 2 + (colKeys.length - 1) * colW + nodeW;
    var pos = {};
    colKeys.forEach(function (k, ci) {
      var list = cols[k];
      var total = list.length * rowH - (rowH - nodeH);
      var y0 = (H - total) / 2;
      list.forEach(function (n, i) {
        pos[n.id] = { x: padX + ci * colW, y: y0 + i * rowH, w: nodeW, h: nodeH, n: n };
      });
    });
    return { W: W, H: H, pos: pos, cols: colKeys.length };
  }

  function edgePath(a, b) {
    var x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
    if (b.x <= a.x) { // backward / same column → loop underneath
      x1 = a.x + a.w / 2; y1 = a.y + a.h; x2 = b.x + b.w / 2; y2 = b.y + b.h;
      var dy = Math.max(y1, y2) + 34;
      return 'M' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + dy + ', ' + x2 + ' ' + dy + ', ' + x2 + ' ' + y2;
    }
    var mx = (x1 + x2) / 2;
    return 'M' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
  }

  /* ─────────────── card mini constellation ─────────────── */
  function miniDiagram(p, big) {
    var L = layout(p.flow, { colW: 60, rowH: 26, nodeW: 8, nodeH: 8, padX: 14, padY: 12 });
    var s = '<svg viewBox="0 0 ' + L.W + ' ' + L.H + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    p.flow.edges.forEach(function (e) {
      var a = L.pos[e[0]], b = L.pos[e[1]];
      if (!a || !b) return;
      s += '<line x1="' + (a.x + 4) + '" y1="' + (a.y + 4) + '" x2="' + (b.x + 4) + '" y2="' + (b.y + 4) + '" stroke="#6E0B1E" stroke-width="1"/>';
    });
    Object.keys(L.pos).forEach(function (id, i) {
      var q = L.pos[id];
      var pink = i === 0 || i === Object.keys(L.pos).length - 1;
      s += '<circle cx="' + (q.x + 4) + '" cy="' + (q.y + 4) + '" r="' + (pink ? 3.2 : 2.4) + '" fill="' + (pink ? '#FF8FB8' : '#C8203F') + '"' + (pink ? ' style="filter:drop-shadow(0 0 3px #FF8FB8)"' : '') + '/>';
    });
    return s + '</svg>';
  }

  /* ─────────────── OVERVIEW ─────────────── */
  function renderOverview(p, el) {
    var note = '';
    if (p.status === 'In Design') note = '<p class="ov-note">This project is in the design phase — the overview describes the planned system.</p>';
    if (p.source && p.source.updatePending) note += '<p class="ov-note">Source is archived as a .zip and maintained in another directory — this case file will be updated with the latest version.</p>';
    el.innerHTML =
      '<div class="ov-grid tab-panel">' +
        '<div class="ov-text"><p>' + esc(p.overview) + '</p>' +
          '<h4 class="ov-h">Key features</h4><ul class="feat-list">' + p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>' +
        '<div><h4 class="ov-h">At a glance</h4><div class="metric-grid">' +
          p.metrics.map(function (m) { return '<div class="metric"><b>' + esc(m.value) + '</b><span>' + esc(m.label) + '</span></div>'; }).join('') +
        '</div>' + note + '</div>' +
      '</div>';
  }

  /* ─────────────── ARCHITECTURE ─────────────── */
  function renderArchitecture(p, el) {
    var L = layout(p.flow);
    var svg = '<svg class="arch-svg" viewBox="0 0 ' + L.W + ' ' + (L.H + 30) + '" role="img" aria-label="Architecture diagram of ' + esc(p.title) + '">';
    svg += '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#A3142F"/></marker></defs>';
    p.flow.edges.forEach(function (e, i) {
      var a = L.pos[e[0]], b = L.pos[e[1]];
      if (!a || !b) return;
      var d = edgePath(a, b);
      svg += '<path id="ae-' + i + '" class="arch-edge" data-from="' + e[0] + '" data-to="' + e[1] + '" d="' + d + '" marker-end="url(#arrow)"/>';
      if (!reduceMotion) {
        svg += '<circle class="arch-packet" r="3"><animateMotion dur="' + (2.4 + (i % 3) * 0.6) + 's" begin="' + (i * 0.35) + 's" repeatCount="indefinite"><mpath href="#ae-' + i + '"/></animateMotion></circle>';
      }
    });
    Object.keys(L.pos).forEach(function (id) {
      var q = L.pos[id];
      var label = q.n.label.length > 19 ? q.n.label.slice(0, 18) + '…' : q.n.label;
      svg += '<g class="arch-node" tabindex="0" role="button" data-id="' + id + '" aria-label="' + esc(q.n.label) + '">' +
        '<rect x="' + q.x + '" y="' + q.y + '" width="' + q.w + '" height="' + q.h + '" rx="10"/>' +
        '<text x="' + (q.x + q.w / 2) + '" y="' + (q.y + q.h / 2 + 4) + '" text-anchor="middle">' + esc(label) + '</text></g>';
    });
    svg += '</svg>';

    el.innerHTML = '<div class="tab-panel"><p class="hint">Hover or tap a component to trace its connections. Pink dots show data flowing through the system.</p>' +
      '<div class="arch-wrap"><div class="arch-svg-box">' + svg + '</div>' +
      '<aside class="arch-detail" id="archDetail" aria-live="polite"><h4>' + esc(p.short) + '</h4><p>Select a component to see what it does and how it connects.</p>' +
      '<p class="io"><b>' + p.flow.nodes.length + '</b> components · <b>' + p.flow.edges.length + '</b> connections</p></aside></div></div>';

    var detail = $(el, '#archDetail');
    var nodes = $$(el, '.arch-node'), edges = $$(el, '.arch-edge');
    var byId = {}; p.flow.nodes.forEach(function (n) { byId[n.id] = n; });

    function focusNode(id, sticky) {
      var linked = {}; linked[id] = true;
      edges.forEach(function (e) {
        var on = e.dataset.from === id || e.dataset.to === id;
        e.classList.toggle('hl', on); e.classList.toggle('dim', !on);
        if (on) { linked[e.dataset.from] = true; linked[e.dataset.to] = true; }
      });
      nodes.forEach(function (n) {
        n.classList.toggle('dim', !linked[n.dataset.id]);
        if (sticky) n.classList.toggle('sel', n.dataset.id === id);
      });
      var n = byId[id];
      var ins = p.flow.edges.filter(function (e) { return e[1] === id; }).map(function (e) { return byId[e[0]].label; });
      var outs = p.flow.edges.filter(function (e) { return e[0] === id; }).map(function (e) { return byId[e[1]].label; });
      detail.innerHTML = '<h4>' + esc(n.label) + '</h4><p>' + esc(n.detail) + '</p>' +
        (ins.length ? '<p class="io"><b>From:</b> ' + ins.map(esc).join(', ') + '</p>' : '') +
        (outs.length ? '<p class="io"><b>To:</b> ' + outs.map(esc).join(', ') + '</p>' : '');
    }
    var sticky = null;
    function clear() {
      if (sticky) { focusNode(sticky, true); return; }
      edges.forEach(function (e) { e.classList.remove('hl', 'dim'); });
      nodes.forEach(function (n) { n.classList.remove('dim'); });
    }
    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { focusNode(n.dataset.id, false); });
      n.addEventListener('mouseleave', clear);
      n.addEventListener('focus', function () { focusNode(n.dataset.id, false); });
      n.addEventListener('click', function () { sticky = n.dataset.id; focusNode(sticky, true); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sticky = n.dataset.id; focusNode(sticky, true); } });
    });
  }

  /* ─────────────── STACK ─────────────── */
  function renderStack(p, el) {
    var total = p.langs.reduce(function (s, l) { return s + l[1]; }, 0);
    var bar = p.langs.map(function (l, i) { return '<span style="flex-grow:' + l[1] + ';background:' + PALETTE[i % PALETTE.length] + '" title="' + esc(l[0]) + ' ' + Math.round(l[1] / total * 100) + '%"></span>'; }).join('');
    var legend = p.langs.map(function (l, i) { return '<span><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' + esc(l[0]) + ' · ' + Math.round(l[1] / total * 100) + '%</span>'; }).join('');
    var layers = Object.keys(p.stack).map(function (k) {
      return '<div class="stack-layer"><h4>' + esc(k) + '<small>' + p.stack[k].length + '</small></h4><div class="chips">' +
        p.stack[k].map(function (t, i) { return '<span class="chip' + (i < 2 ? ' strong' : '') + '">' + esc(t) + '</span>'; }).join('') + '</div></div>';
    }).join('');
    var count = Object.keys(p.stack).reduce(function (s, k) { return s + p.stack[k].length; }, 0);
    el.innerHTML = '<div class="tab-panel"><h4 class="ov-h">Approximate language mix</h4><div class="lang-bar">' + bar + '</div><div class="lang-legend">' + legend + '</div>' +
      '<p class="hint" style="margin-top:18px">' + count + ' technologies across ' + Object.keys(p.stack).length + ' layers. Highlighted chips are the core of each layer.</p>' +
      '<div class="stack-grid">' + layers + '</div></div>';
  }

  /* ─────────────── TIMELINE ─────────────── */
  function renderTimeline(p, el) {
    var tl = '<ol class="tl">' + p.timeline.map(function (t) { return '<li><time>' + esc(t.date) + '</time><p>' + esc(t.label) + '</p></li>'; }).join('') + '</ol>';
    var right = '';
    if (p.roadmap) {
      var C = 2 * Math.PI * 40, prog = p.progress || 0;
      right = '<div><div class="ring-wrap"><svg viewBox="0 0 100 100" aria-label="' + prog + '% complete"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C8203F"/><stop offset="1" stop-color="#FF8FB8"/></linearGradient></defs>' +
        '<circle class="rt" cx="50" cy="50" r="40"/><circle class="rf" cx="50" cy="50" r="40" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" data-off="' + (C * (1 - prog / 100)) + '"/>' +
        '<text x="50" y="58" text-anchor="middle">' + prog + '%</text></svg><div><h4 class="ov-h" style="margin:0">Estimated progress</h4><p class="hint" style="margin:0">Remaining milestones on the roadmap</p></div></div>' +
        '<ul class="roadmap">' + p.roadmap.map(function (r) { return '<li class="' + (r.done ? 'done' : '') + '"><b>' + esc(r.key) + '</b>' + esc(r.label) + '<span class="tick">' + (r.done ? '✓ done' : 'open') + '</span></li>'; }).join('') + '</ul></div>';
    } else {
      right = '<div><h4 class="ov-h">Project source</h4><div class="kv"><div><small>Category</small><b>' + CAT_LABEL[p.category] + '</b></div><div><small>Status</small><b>' + esc(p.status) + '</b></div><div><small>Stored as</small><b>' + (p.source.type === 'zip' ? 'Archive' : 'Folder') + '</b></div></div></div>';
    }
    el.innerHTML = '<div class="tl-grid tab-panel"><div><h4 class="ov-h">Milestones</h4>' + tl + '</div>' + right + '</div>';
    var rf = $(el, '.rf');
    if (rf) requestAnimationFrame(function () { requestAnimationFrame(function () { rf.style.strokeDashoffset = rf.dataset.off; }); });
  }

  /* ═════════════════════ CONCEPT DEMO WIDGETS ═════════════════════ */
  var W = {};

  function frame(intro, stage, controls, out) {
    return '<div class="demo tab-panel"><p class="demo-intro">' + intro + '</p>' +
      (controls ? '<div class="demo-controls">' + controls + '</div>' : '') +
      '<div class="demo-stage">' + stage + '</div>' +
      (out !== false ? '<div class="demo-out" aria-live="polite"></div>' : '') + '</div>';
  }
  function slider(name, label, min, max, step, val) {
    return '<label>' + label + ' <output data-for="' + name + '">' + val + '</output><input type="range" name="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
  }
  function bindSliders(el, fn) {
    $$(el, 'input[type=range]').forEach(function (r) {
      r.addEventListener('input', function () {
        var o = $(el, 'output[data-for="' + r.name + '"]'); if (o) o.textContent = r.value;
        fn();
      });
    });
  }
  function val(el, name) { return parseFloat($(el, '[name="' + name + '"]').value); }

  /* 1 ─ Bracket generator (Announcement System) */
  W.bracket = function (el) {
    el.innerHTML = frame('The kiosk\'s bracket engine pads any team count to the next power of two and hands top seeds a BYE. Change the number of teams to watch the single-elimination bracket rebuild.',
      '<div class="bracket-svg"></div>', slider('n', 'Teams', 2, 16, 1, 6));
    function seeds(size) { var o = [1]; while (o.length < size) { var nx = [], L = o.length * 2 + 1; o.forEach(function (s) { nx.push(s, L - s); }); o = nx; } return o; }
    function draw() {
      var n = val(el, 'n'), size = 1; while (size < n) size *= 2;
      var rounds = Math.log2(size), order = seeds(size), byes = size - n;
      var colW = 150, slotH = 26, gap = 10, H = Math.max(120, (size / 2) * (slotH * 2 + gap) + 20), Wd = (rounds + 1) * colW + 20;
      var s = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" style="min-width:' + Math.min(Wd, 640) + 'px;width:100%">';
      var prev = [];
      for (var r = 0; r <= rounds; r++) {
        var matches = size / Math.pow(2, r + 1), cur = [];
        var count = r === rounds ? 1 : matches;
        for (var m = 0; m < count; m++) {
          var cy = (H / count) * (m + 0.5), x = 10 + r * colW;
          if (r === rounds) {
            var champ = prev[0];
            s += '<rect x="' + x + '" y="' + (cy - slotH / 2) + '" width="120" height="' + slotH + '" rx="6" fill="#4A0815" stroke="#FF8FB8"/><text x="' + (x + 60) + '" y="' + (cy + 4) + '" text-anchor="middle" fill="#FFC1D6" font-size="11">🏆 Champion</text>';
            break;
          }
          var a, b;
          if (r === 0) { a = order[m * 2]; b = order[m * 2 + 1]; a = a <= n ? 'Seed ' + a : 'BYE'; b = b <= n ? 'Seed ' + b : 'BYE'; }
          else { a = prev[m * 2]; b = prev[m * 2 + 1]; }
          var adv = a === 'BYE' ? b : b === 'BYE' ? a : (r === 0 ? 'W' + (m + 1) : 'W(R' + (r + 1) + '·' + (m + 1) + ')');
          cur.push(adv);
          [[a, -1], [b, 1]].forEach(function (t) {
            var y = cy + t[1] * (slotH / 2 + 2) - slotH / 2 + (t[1] > 0 ? 0 : 0);
            var isBye = t[0] === 'BYE';
            s += '<rect x="' + x + '" y="' + (t[1] < 0 ? cy - slotH - 2 : cy + 2) + '" width="120" height="' + slotH + '" rx="6" fill="' + (isBye ? '#0E0A0F' : '#160F14') + '" stroke="' + (isBye ? '#2C1C25' : '#A3142F') + '"' + (isBye ? ' stroke-dasharray="3 3"' : '') + '/>' +
              '<text x="' + (x + 10) + '" y="' + ((t[1] < 0 ? cy - slotH - 2 : cy + 2) + 17) + '" fill="' + (isBye ? '#5A4A52' : '#E9DDE2') + '" font-size="11">' + esc(t[0]) + '</text>';
          });
          s += '<path d="M' + (x + 120) + ' ' + cy + ' H ' + (x + colW - 10) + '" stroke="#6E0B1E" fill="none"/>';
        }
        prev = cur;
      }
      s += '</svg>';
      $(el, '.bracket-svg').innerHTML = s;
      $(el, '.demo-out').innerHTML = '<b>' + n + ' teams</b> → bracket of ' + size + ' · <b>' + byes + ' BYE' + (byes === 1 ? '' : 's') + '</b> (auto-advanced) · ' + rounds + ' rounds · ' + (n - 1) + ' matches to crown a champion.';
    }
    bindSliders(el, draw); draw();
  };

  /* 2 ─ Face pipeline (Facial Recognition VMS) */
  W.facepipe = function (el) {
    var scen = {
      returning: { name: 'Returning visitor', det: 0.94, live: 0.91, sim: 0.92 },
      newv:      { name: 'First-time visitor', det: 0.93, live: 0.88, sim: 0.41 },
      dim:       { name: 'Dim lighting', det: 0.52, fix: 0.79, live: 0.83, sim: 0.88 },
      spoof:     { name: 'Printed photo', det: 0.90, live: 0.18, sim: 0.90 }
    };
    var btns = Object.keys(scen).map(function (k, i) { return '<button class="demo-btn' + (i === 0 ? ' on' : '') + '" data-s="' + k + '">' + scen[k].name + '</button>'; }).join('');
    el.innerHTML = frame('Pick who walks up to the gate, then tune the three thresholds the system uses. Each stage passes or rejects the face before the host is ever notified.',
      '<div class="pipe"></div>', '<div style="display:flex;gap:8px;flex-wrap:wrap;width:100%">' + btns + '</div>' + slider('det', 'Detection ≥', 0.3, 0.95, 0.01, 0.65) + slider('live', 'Liveness ≥', 0.1, 0.95, 0.01, 0.5) + slider('match', 'Match ≥', 0.5, 0.99, 0.01, 0.85));
    var cur = 'returning';
    function draw() {
      var s = scen[cur], td = val(el, 'det'), tl = val(el, 'live'), tm = val(el, 'match');
      var steps = [], dead = false;
      var d = s.det, fixed = false;
      if (d < td && s.fix) { d = s.fix; fixed = true; }
      function step(label, score, thr, passTxt, failTxt) {
        if (dead) return '<div class="pipe-step skip"><small>' + label + '</small><b>—</b><em>skipped</em></div>';
        var ok = score >= thr; if (!ok) dead = true;
        return '<div class="pipe-step ' + (ok ? 'pass' : 'fail') + '"><small>' + label + '</small><b>' + score.toFixed(2) + '</b><em>' + (ok ? passTxt : failTxt) + '</em></div>';
      }
      steps.push(step('RetinaFace' + (fixed ? ' + CLAHE' : ''), d, td, fixed ? 'found after fallback' : 'face found', 'no face'));
      steps.push(step('MiniFASNet', s.live, tl, 'live person', 'spoof rejected'));
      var embedOk = !dead;
      steps.push(embedOk ? '<div class="pipe-step pass"><small>Facenet512</small><b>512-d</b><em>embedded</em></div>' : '<div class="pipe-step skip"><small>Facenet512</small><b>—</b><em>skipped</em></div>');
      var matchTxt = '';
      if (!dead) {
        var hit = s.sim >= tm;
        steps.push('<div class="pipe-step ' + (hit ? 'pass' : '') + '"><small>FAISS top-5</small><b>' + s.sim.toFixed(2) + '</b><em>' + (hit ? 'returning — prefill' : 'new visitor') + '</em></div>');
        steps.push('<div class="pipe-step pass"><small>FCM → host</small><b>📱</b><em>awaiting approval</em></div>');
        matchTxt = hit ? 'Recognised as a <b>returning visitor</b> — form pre-filled, host notified.' : 'No match above threshold — treated as a <b>new visitor</b>, host notified.';
      } else {
        steps.push('<div class="pipe-step skip"><small>FAISS top-5</small><b>—</b><em>skipped</em></div>');
        steps.push('<div class="pipe-step skip"><small>FCM → host</small><b>—</b><em>not sent</em></div>');
        matchTxt = '<b>Check-in rejected</b> before any data was stored.';
      }
      $(el, '.pipe').innerHTML = steps.join('');
      $(el, '.demo-out').innerHTML = matchTxt;
    }
    $$(el, '.demo-btn').forEach(function (b) { b.addEventListener('click', function () { $$(el, '.demo-btn').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); cur = b.dataset.s; draw(); }); });
    bindSliders(el, draw); draw();
  };

  /* 3 ─ Benford's Law (DataLens) */
  W.benford = function (el) {
    var exp = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (d) { return Math.log10(1 + 1 / d); });
    var sets = {
      natural:  { name: 'Natural ledger', p: [0.297, 0.181, 0.122, 0.099, 0.081, 0.064, 0.060, 0.052, 0.044] },
      uniform:  { name: 'Fabricated entries', p: [0.118, 0.106, 0.112, 0.109, 0.115, 0.107, 0.113, 0.110, 0.110] },
      rounding: { name: 'Threshold splitting', p: [0.262, 0.143, 0.092, 0.081, 0.071, 0.058, 0.052, 0.046, 0.195] }
    };
    var btns = Object.keys(sets).map(function (k, i) { return '<button class="demo-btn' + (i === 0 ? ' on' : '') + '" data-s="' + k + '">' + sets[k].name + '</button>'; }).join('');
    el.innerHTML = frame('In genuine financial data, about 30% of amounts start with the digit 1 — Benford\'s Law. DataLens tests every procurement ledger against this curve; fabricated or split transactions break the pattern.',
      '<div class="bf"></div>', btns + slider('n', 'Sample size', 100, 2000, 100, 800));
    var cur = 'natural';
    function draw() {
      var o = sets[cur].p, n = val(el, 'n'), chi = 0;
      o.forEach(function (v, i) { var e = exp[i] * n, ob = v * n; chi += (ob - e) * (ob - e) / e; });
      var Wd = 560, H = 220, bw = 44, s = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" style="width:100%;min-width:420px">';
      for (var g = 0; g <= 3; g++) { var gy = 180 - g * 50; s += '<line x1="30" x2="' + (Wd - 10) + '" y1="' + gy + '" y2="' + gy + '" stroke="#21151C"/><text x="4" y="' + (gy + 4) + '" fill="#A8949D" font-size="10">' + (g * 10) + '%</text>'; }
      var pts = [];
      o.forEach(function (v, i) {
        var x = 44 + i * 58, h = v * 500;
        s += '<rect x="' + x + '" y="' + (180 - h) + '" width="' + bw + '" height="' + h + '" rx="4" fill="#A3142F" opacity=".85"><title>Digit ' + (i + 1) + ': ' + (v * 100).toFixed(1) + '%</title></rect>';
        s += '<text x="' + (x + bw / 2) + '" y="198" text-anchor="middle" fill="#E9DDE2" font-size="12">' + (i + 1) + '</text>';
        pts.push((x + bw / 2) + ',' + (180 - exp[i] * 500));
      });
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#FF8FB8" stroke-width="2"/>';
      pts.forEach(function (pt) { var c = pt.split(','); s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3.5" fill="#FF8FB8"/>'; });
      s += '<text x="' + (Wd - 12) + '" y="16" text-anchor="end" fill="#FF8FB8" font-size="11">● Benford expected</text><text x="' + (Wd - 12) + '" y="32" text-anchor="end" fill="#C8203F" font-size="11">■ Observed</text></svg>';
      $(el, '.bf').innerHTML = s;
      var flag = chi > 15.51;
      $(el, '.demo-out').innerHTML = 'χ² = <b>' + chi.toFixed(1) + '</b> (df 8, critical 15.51 at α = 0.05) → ' + (flag ? '<b>⚠ Flagged</b> — first-digit distribution deviates from Benford; send to auditor.' : '<b>✓ Conforms</b> — no first-digit anomaly detected.');
    }
    $$(el, '.demo-btn').forEach(function (b) { b.addEventListener('click', function () { $$(el, '.demo-btn').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); cur = b.dataset.s; draw(); }); });
    bindSliders(el, draw); draw();
  };

  /* 4 ─ Incubator day cycle (IncuWatch) */
  W.incubator = function (el) {
    var miles = { 7: 'Day 7 — first candling check', 14: 'Day 14 — second candling check', 15: 'Day 15 — mid-cycle humidity review', 18: 'Day 18 — lockdown: stop turning, raise humidity', 20: 'Day 20 — pipping begins', 21: 'Day 21 — hatch day' };
    el.innerHTML = frame('Drag through the 21-day cycle. The controller switches stage, setpoints and egg-turning automatically — exactly what the ESP32 firmware and the simulator do.',
      '<div class="inc"></div>', slider('day', 'Incubation day', 0, 22, 1, 3));
    function stage(d) {
      if (d === 0) return { n: 'Pre-Heat', t: 37.5, h: 55, turn: false };
      if (d <= 18) return { n: 'Setter', t: 37.5, h: 55, turn: d < 18 };
      if (d <= 21) return { n: 'Hatcher (lockdown)', t: 36.5, h: 70, turn: false };
      return { n: 'Complete', t: 25, h: 45, turn: false };
    }
    function draw() {
      var d = val(el, 'day'), s = stage(d);
      var next = Object.keys(miles).map(Number).filter(function (m) { return m >= d; })[0];
      var eggs = '';
      for (var i = 0; i < 6; i++) eggs += '<ellipse cx="' + (110 + i * 34) + '" cy="120" rx="13" ry="17" fill="' + (d > 21 ? '#2C1C25' : '#FFC1D6') + '" opacity="' + (d > 21 ? .5 : .9) + '"/>';
      var svg = '<svg viewBox="0 0 400 200" style="width:100%;max-width:520px;display:block;margin:auto">' +
        '<rect x="40" y="20" width="320" height="160" rx="16" fill="#0E0A0F" stroke="#A3142F"/>' +
        '<rect x="60" y="34" width="280" height="14" rx="7" fill="' + (d <= 21 ? '#C8203F' : '#21151C') + '" opacity="' + (d <= 21 ? .9 : .5) + '">' + (d <= 21 && !reduceMotion ? '<animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/>' : '') + '</rect>' +
        '<text x="200" y="45" text-anchor="middle" fill="#fff" font-size="9">HEATER</text>' +
        '<g' + (s.turn && !reduceMotion ? '' : '') + ' style="transform-origin:200px 130px;' + (s.turn ? 'transform:rotate(-8deg)' : '') + ';transition:transform .8s">' +
          '<rect x="90" y="138" width="220" height="8" rx="4" fill="#6E0B1E"/>' + eggs + '</g>' +
        '<text x="200" y="172" text-anchor="middle" fill="#A8949D" font-size="10">' + (s.turn ? 'tray tilted · turns every 2 h' : 'tray level · turning off') + '</text></svg>';
      $(el, '.inc').innerHTML = svg + '<div class="kv" style="margin-top:14px"><div><small>Stage</small><b>' + s.n + '</b></div><div><small>Temp setpoint</small><b>' + s.t + ' °C</b></div><div><small>Humidity</small><b>' + s.h + '%</b></div><div><small>Egg turning</small><b>' + (s.turn ? 'Every 2 h' : 'Off') + '</b></div></div>';
      $(el, '.demo-out').innerHTML = miles[d] ? '🔔 <b>' + miles[d] + '</b>' : (next ? 'Next reminder: <b>' + miles[next] + '</b>' : 'Cycle complete — chamber cooled to 25 °C.');
    }
    bindSliders(el, draw); draw();
  };

  /* 5 ─ Causal graph (CausalLab) */
  W.causal = function (el) {
    var pos = { A: [80, 60], B: [220, 30], C: [220, 150], D: [360, 90], E: [490, 90] };
    var truth = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']];
    var learned = {
      pc: { name: 'PC (from scratch)', edges: [['A', 'B'], ['C', 'A'], ['B', 'D'], ['C', 'D'], ['D', 'E']] },
      hc: { name: 'Hill-climb (BIC)', edges: [['A', 'B'], ['A', 'C'], ['D', 'B'], ['D', 'E'], ['A', 'E']] }
    };
    el.innerHTML = frame('A small five-variable system. Compare the true causal graph with what each algorithm recovers from data — edges are classified exactly as in the CausalLab demo.',
      '<div class="cg"></div>', '<button class="demo-btn on" data-v="truth">True graph</button><button class="demo-btn" data-v="pc">PC learned</button><button class="demo-btn" data-v="hc">Hill-climb learned</button>');
    function key(e) { return e[0] + e[1]; }
    function draw(v) {
      var edges = [], shd = 0;
      if (v === 'truth') edges = truth.map(function (e) { return { e: e, s: 'ok' }; });
      else {
        var L = learned[v].edges, tk = {}, lk = {};
        truth.forEach(function (e) { tk[key(e)] = 1; }); L.forEach(function (e) { lk[key(e)] = 1; });
        L.forEach(function (e) {
          if (tk[key(e)]) edges.push({ e: e, s: 'ok' });
          else if (tk[e[1] + e[0]]) { edges.push({ e: e, s: 'rev' }); shd++; }
          else { edges.push({ e: e, s: 'extra' }); shd++; }
        });
        truth.forEach(function (e) { if (!lk[key(e)] && !lk[e[1] + e[0]]) { edges.push({ e: e, s: 'miss' }); shd++; } });
      }
      var col = { ok: '#FF8FB8', rev: '#C8203F', extra: '#FFC1D6', miss: '#5A4A52' };
      var s = '<svg viewBox="0 0 570 190" style="width:100%;min-width:420px"><defs>' + Object.keys(col).map(function (k) { return '<marker id="cm-' + k + '" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + col[k] + '"/></marker>'; }).join('') + '</defs>';
      edges.forEach(function (x) {
        var a = pos[x.e[0]], b = pos[x.e[1]], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        s += '<line x1="' + (a[0] + ux * 24) + '" y1="' + (a[1] + uy * 24) + '" x2="' + (b[0] - ux * 26) + '" y2="' + (b[1] - uy * 26) + '" stroke="' + col[x.s] + '" stroke-width="2"' + (x.s === 'miss' ? ' stroke-dasharray="5 5"' : x.s === 'extra' ? ' stroke-dasharray="2 4"' : '') + ' marker-end="url(#cm-' + x.s + ')"/>';
      });
      Object.keys(pos).forEach(function (k) { s += '<circle cx="' + pos[k][0] + '" cy="' + pos[k][1] + '" r="22" fill="#160F14" stroke="#A3142F" stroke-width="1.5"/><text x="' + pos[k][0] + '" y="' + (pos[k][1] + 5) + '" text-anchor="middle" fill="#F6ECF0" font-size="15" font-weight="600">' + k + '</text>'; });
      s += '</svg><div class="lang-legend"><span><i style="background:#FF8FB8"></i>correct</span><span><i style="background:#C8203F"></i>reversed</span><span><i style="background:#FFC1D6"></i>extra (dotted)</span><span><i style="background:#5A4A52"></i>missing (dashed)</span></div>';
      $(el, '.cg').innerHTML = s;
      $(el, '.demo-out').innerHTML = v === 'truth' ? 'Ground truth: <b>5 directed edges</b>. Switch views to score each algorithm.' : '<b>' + learned[v].name + '</b> — structural Hamming distance <b>' + shd + '</b>' + (shd <= 1 ? ' · near-perfect recovery.' : ' · score-based search got trapped in a local optimum.');
    }
    $$(el, '.demo-btn').forEach(function (b) { b.addEventListener('click', function () { $$(el, '.demo-btn').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); draw(b.dataset.v); }); });
    draw('truth');
  };

  /* 6 ─ Gesture map (Gestify) */
  W.gestures = function (el) {
    var G = [
      ['✋', 'Open palm', 'Play', 0.65], ['✊', 'Fist', 'Pause', 0.65], ['👈', 'Swipe left', 'Previous', 0], ['👉', 'Swipe right', 'Next', 0],
      ['👆', 'Swipe up', 'Volume +', 0], ['👇', 'Swipe down', 'Volume −', 0], ['✌️', 'Peace sign', 'Shuffle', 1.0], ['☝️', 'Index up', 'Repeat', 1.0],
      ['🖐️', 'Four fingers', 'Playlist', 0.65], ['🤟', 'Three-finger sign', 'Quit', 1.5]
    ];
    var state = { playing: false, vol: 0.5, shuffle: false, repeat: false, track: 1 };
    el.innerHTML = frame('Press and hold a gesture card to perform it. Frequent actions are instant swipes or short holds; rare or irreversible ones — like Quit — need a deliberate 1.5-second hold.',
      '<div class="gesture-grid">' + G.map(function (g, i) {
        return '<button class="gesture" data-i="' + i + '"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="1" y="1" width="98" height="98" rx="8" fill="none" stroke="#FF8FB8" stroke-width="2" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" vector-effect="non-scaling-stroke"/></svg><div class="g-ico">' + g[0] + '</div><b>' + g[2] + '</b><small>' + g[1] + (g[3] ? ' · hold ' + g[3] + 's' : ' · swipe') + '</small></button>';
      }).join('') + '</div>', null);
    function status(msg) {
      $(el, '.demo-out').innerHTML = (msg ? msg + ' — ' : '') + '<b>' + (state.playing ? '▶ Playing' : '⏸ Paused') + '</b> track ' + state.track + ' · volume ' + Math.round(state.vol * 100) + '% · shuffle ' + (state.shuffle ? 'on' : 'off') + ' · repeat ' + (state.repeat ? 'on' : 'off');
    }
    function fire(i, card) {
      var a = G[i][2];
      if (a === 'Play') state.playing = true; else if (a === 'Pause') state.playing = false;
      else if (a === 'Next') state.track++; else if (a === 'Previous') state.track = Math.max(1, state.track - 1);
      else if (a === 'Volume +') state.vol = clamp(state.vol + 0.08, 0, 1); else if (a === 'Volume −') state.vol = clamp(state.vol - 0.08, 0, 1);
      else if (a === 'Shuffle') state.shuffle = !state.shuffle; else if (a === 'Repeat') state.repeat = !state.repeat;
      card.classList.add('fired'); setTimeout(function () { card.classList.remove('fired'); }, 500);
      status(a === 'Quit' ? '👋 <b>Quit</b> recognised (demo keeps running)' : 'Recognised <b>' + G[i][1] + '</b> → ' + a);
    }
    $$(el, '.gesture').forEach(function (card) {
      var i = +card.dataset.i, hold = G[i][3], rect = card.querySelector('rect'), raf, t0;
      function stop() { cancelAnimationFrame(raf); rect.style.strokeDashoffset = 100; }
      function start(e) {
        e.preventDefault();
        if (!hold) { fire(i, card); return; }
        t0 = performance.now();
        (function tick(now) {
          var p = (now - t0) / (hold * 1000);
          rect.style.strokeDashoffset = 100 - clamp(p, 0, 1) * 100;
          if (p >= 1) { stop(); fire(i, card); return; }
          raf = requestAnimationFrame(tick);
        })(t0);
      }
      card.addEventListener('pointerdown', start);
      card.addEventListener('pointerup', stop); card.addEventListener('pointerleave', stop); card.addEventListener('pointercancel', stop);
      card.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); fire(i, card); } });
    });
    status('');
  };

  /* 7 ─ RAG retrieval (Librarian AI) */
  W.rag = function (el) {
    var docs = [
      ['thesis.pdf · p4', 'The facial recognition system uses RetinaFace for detection and Facenet512 embeddings stored in a FAISS index.'],
      ['notes.md', 'Benford law checks the first digit distribution of procurement amounts to flag fabricated entries.'],
      ['manual.docx · p2', 'The incubator holds 37.5 degrees and 55 percent humidity until lockdown on day 18.'],
      ['ideas.txt', 'A local LLM in Ollama can answer questions about documents without sending data to the cloud.'],
      ['report.pdf · p9', 'Prophet forecasting includes Philippine holidays for more accurate sales predictions.'],
      ['readme.md', 'Gestures are recognised from 21 MediaPipe hand landmarks and classified by a small neural network.']
    ];
    var presets = ['What humidity does the incubator need?', 'How are faces matched?', 'Can it run without the cloud?'];
    el.innerHTML = frame('Ask a question about a tiny six-chunk library. The question is compared with every chunk, the top-k most similar are retrieved, and only those are handed to the local LLM. <em>(This demo uses word overlap as a stand-in for real embeddings.)</em>',
      '<div class="rag"></div>', '<label style="flex:2;min-width:220px">Question<input type="text" name="q" value="' + presets[0] + '" style="padding:10px 12px;border-radius:8px;border:1px solid var(--red-line);background:var(--ink-800);color:var(--text);font:inherit;text-transform:none;letter-spacing:0"></label>' + slider('k', 'Top-k', 1, 4, 1, 2) +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;width:100%">' + presets.map(function (p) { return '<button class="demo-btn" data-q="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>');
    var stop = { the: 1, a: 1, an: 1, of: 1, to: 1, and: 1, is: 1, are: 1, it: 1, for: 1, in: 1, does: 1, do: 1, what: 1, how: 1, can: 1, need: 1, by: 1, from: 1, until: 1, on: 1, about: 1, without: 0 };
    function tok(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w && !stop[w]; }).map(function (w) { return w.replace(/(es|s|ed|ing)$/, ''); }); }
    function draw() {
      var q = tok($(el, '[name=q]').value), k = val(el, 'k');
      var scored = docs.map(function (d, i) {
        var t = tok(d[1]), set = {}; t.forEach(function (w) { set[w] = 1; });
        var hit = q.filter(function (w) { return set[w]; }).length;
        return { i: i, s: q.length ? hit / Math.sqrt(q.length * t.length) : 0 };
      }).sort(function (a, b) { return b.s - a.s; });
      var max = Math.max(0.01, scored[0].s);
      var html = scored.map(function (r, rank) {
        var on = rank < k && r.s > 0;
        return '<div style="display:grid;grid-template-columns:120px 1fr 48px;gap:10px;align-items:center;margin-bottom:8px;opacity:' + (on ? 1 : .45) + '"><small style="color:var(--muted)">' + esc(docs[r.i][0]) + '</small>' +
          '<div style="height:10px;border-radius:5px;background:var(--ink-600);overflow:hidden"><div style="height:100%;width:' + (r.s / max * 100) + '%;background:' + (on ? 'linear-gradient(90deg,#C8203F,#FF8FB8)' : '#6E0B1E') + ';transition:width .5s"></div></div><b style="font-size:12px;color:' + (on ? '#FFC1D6' : '#A8949D') + '">' + r.s.toFixed(2) + '</b></div>';
      }).join('');
      var ctx = scored.slice(0, k).filter(function (r) { return r.s > 0; });
      html += '<div class="prompt-box" style="margin-top:12px">SYSTEM: Answer only from the context. Cite sources.\n\n' + (ctx.length ? ctx.map(function (r) { return '<span class="hl">[' + esc(docs[r.i][0]) + ']</span> ' + esc(docs[r.i][1]); }).join('\n') : '(no relevant chunks — the model will say it does not know)') + '\n\nUSER: ' + esc($(el, '[name=q]').value) + '</div>';
      $(el, '.rag').innerHTML = html;
      $(el, '.demo-out').innerHTML = ctx.length ? 'Retrieved <b>' + ctx.length + '</b> chunk' + (ctx.length > 1 ? 's' : '') + ' → sent to Ollama with citations. Nothing leaves your machine.' : 'No chunk is relevant — a grounded assistant answers <b>"I don\'t know"</b> instead of guessing.';
    }
    $(el, '[name=q]').addEventListener('input', draw);
    $$(el, '[data-q]').forEach(function (b) { b.addEventListener('click', function () { $(el, '[name=q]').value = b.dataset.q; draw(); }); });
    bindSliders(el, draw); draw();
  };

  /* 8 ─ ARIA prompt injection */
  W.aria = function (el) {
    el.innerHTML = frame('ARIA reads your system before it answers. Move the sliders to change the live snapshot and see how it is injected into the local model\'s prompt — and how the avatar\'s mood changes.',
      '<div class="aria"></div>', slider('cpu', 'CPU %', 0, 100, 1, 34) + slider('ram', 'RAM %', 0, 100, 1, 61) + slider('gpu', 'GPU °C', 30, 95, 1, 58) + slider('disk', 'Disk %', 0, 100, 1, 72));
    function draw() {
      var c = val(el, 'cpu'), r = val(el, 'ram'), g = val(el, 'gpu'), d = val(el, 'disk');
      var mood = 'idle 😌', reply = 'Everything looks calm — your CPU is basically napping. Want me to keep an eye on anything?';
      if (c > 90) { mood = 'alert 😟'; reply = 'Whoa, your CPU is at ' + c + '% — something\'s chewing on it. Let me check the top processes for you.'; }
      else if (r > 85) { mood = 'alert 😟'; reply = 'RAM is at ' + r + '%. Closing a few browser tabs would give you room to breathe.'; }
      else if (g > 85) { mood = 'worried 😬'; reply = 'Your RTX is running hot at ' + g + '°C. Maybe give the fans some space?'; }
      else if (d > 95) { mood = 'alert 😟'; reply = 'Disk is almost full (' + d + '%). Want to look for big files together?'; }
      else if (c > 60 || g > 75) { mood = 'focused 🤔'; reply = 'You\'re working the machine a bit — nothing alarming, though.'; }
      $(el, '.aria').innerHTML = '<div class="prompt-box">PERSONA: ARIA — witty, casual, no markdown.\n\nSYSTEM_SNAPSHOT = {\n  "cpu_percent": <span class="hl">' + c + '</span>,\n  "ram_percent": <span class="hl">' + r + '</span>,\n  "gpu_temp_c": <span class="hl">' + g + '</span>,\n  "disk_percent": <span class="hl">' + d + '</span>,\n  "gpu": "RTX 3050 4GB"\n}\n\nHISTORY: last 10 exchanges…\nUSER: how\'s my pc doing?</div>';
      $(el, '.demo-out').innerHTML = 'Avatar mood: <b>' + mood + '</b><br>ARIA: “' + esc(reply) + '”';
    }
    bindSliders(el, draw); draw();
  };

  /* 9 ─ Remaining useful life gauge (Predictive Maintenance) */
  W.rul = function (el) {
    el.innerHTML = frame('Replay a turbofan engine cycle by cycle. As sensors drift, the health gauge falls through the green, yellow and red zones while the model counts down the remaining useful life (capped at 125 cycles).',
      '<div class="rul"></div>', slider('cyc', 'Cycle', 0, 200, 1, 40) + '<button class="demo-btn" data-a="play">▶ Replay</button><button class="demo-btn" data-a="fault">⚡ Inject fault</button>');
    var failAt = 200, timer = null;
    function arc(pct) {
      var a = Math.PI * (1 - pct), x = 150 + 110 * Math.cos(a), y = 150 - 110 * Math.sin(a);
      return 'M40 150 A110 110 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    function draw() {
      var c = val(el, 'cyc'), left = Math.max(0, failAt - c), rul = Math.min(125, left);
      var health = clamp(left / failAt, 0, 1); health = Math.pow(health, 0.6);
      var zone = health > 0.6 ? ['Healthy', '#FF8FB8'] : health > 0.3 ? ['Warning', '#C8203F'] : ['Critical', '#6E0B1E'];
      var spark = '';
      for (var i = 0; i <= c; i += 4) { var v = 60 - Math.pow(i / failAt, 3) * 50 + Math.sin(i * 1.7) * 3; spark += (i === 0 ? 'M' : 'L') + (330 + i * 0.9).toFixed(1) + ' ' + (v + 60).toFixed(1); }
      $(el, '.rul').innerHTML = '<svg viewBox="0 0 520 180" style="width:100%;min-width:420px">' +
        '<path d="M40 150 A110 110 0 0 1 260 150" fill="none" stroke="#21151C" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="' + arc(health) + '" fill="none" stroke="' + zone[1] + '" stroke-width="16" stroke-linecap="round"/>' +
        '<text x="150" y="128" text-anchor="middle" fill="#F6ECF0" font-size="36" font-family="Cormorant Garamond" font-weight="600">' + Math.round(health * 100) + '%</text>' +
        '<text x="150" y="150" text-anchor="middle" fill="' + zone[1] + '" font-size="12" letter-spacing="2">' + zone[0].toUpperCase() + '</text>' +
        '<text x="330" y="40" fill="#A8949D" font-size="10" letter-spacing="1.5">SENSOR 11 · STATIC PRESSURE</text>' +
        '<rect x="326" y="50" width="186" height="90" rx="6" fill="#0E0A0F" stroke="#21151C"/><path d="' + spark + '" fill="none" stroke="#C8203F" stroke-width="1.6"/></svg>';
      $(el, '.demo-out').innerHTML = 'Cycle <b>' + c + '</b> · predicted RUL <b>' + rul + ' cycles</b>' + (left < 30 ? ' · <b>⚠ schedule maintenance now</b>' : '') + (left === 0 ? ' · engine failure' : '');
    }
    $(el, '[data-a=play]').addEventListener('click', function (e) {
      var b = e.currentTarget;
      if (timer) { clearInterval(timer); timer = null; b.textContent = '▶ Replay'; return; }
      b.textContent = '⏸ Pause';
      var r = $(el, '[name=cyc]'); if (+r.value >= 200) r.value = 0;
      timer = setInterval(function () {
        if (!document.body.contains(r) || !el.contains(r)) { clearInterval(timer); timer = null; return; }
        r.value = +r.value + 2; $(el, 'output[data-for=cyc]').textContent = r.value; draw();
        if (+r.value >= 200) { clearInterval(timer); timer = null; b.textContent = '▶ Replay'; }
      }, 60);
    });
    $(el, '[data-a=fault]').addEventListener('click', function (e) {
      failAt = failAt === 200 ? Math.min(200, val(el, 'cyc') + 25) : 200;
      e.currentTarget.classList.toggle('on', failAt !== 200); draw();
    });
    bindSliders(el, draw); draw();
  };

  /* 10 ─ Sentinel risk composer */
  W.sentinel = function (el) {
    el.innerHTML = frame('The three stages each contribute a signal. Adjust them to see how the composite 0–100 risk score and tier are formed — risk is always shown with a label, never colour alone.',
      '<div class="sen"></div>', slider('ae', 'Reconstruction error', 0, 1, 0.01, 0.32) + slider('con', 'Pre-symptomatic similarity', 0, 1, 0.01, 0.41) + slider('sv', 'Survival hazard', 0, 1, 0.01, 0.22));
    function draw() {
      var a = val(el, 'ae') * 40, c = val(el, 'con') * 35, s = val(el, 'sv') * 25, tot = Math.round(a + c + s);
      var tier = tot < 25 ? ['LOW', '◯'] : tot < 50 ? ['MODERATE', '◐'] : tot < 75 ? ['HIGH', '◕'] : ['CRITICAL', '⬤'];
      $(el, '.sen').innerHTML = '<div style="display:flex;height:34px;border-radius:8px;overflow:hidden;border:1px solid var(--red-line)">' +
        '<div style="width:' + a + '%;background:#6E0B1E" title="Autoencoder"></div><div style="width:' + c + '%;background:#C8203F" title="Contrastive"></div><div style="width:' + s + '%;background:#FF8FB8" title="Survival"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px"><span>0 · Low</span><span>25</span><span>50</span><span>75</span><span>100 · Critical</span></div>' +
        '<div class="lang-legend"><span><i style="background:#6E0B1E"></i>Autoencoder ×0.40 = ' + a.toFixed(1) + '</span><span><i style="background:#C8203F"></i>Contrastive ×0.35 = ' + c.toFixed(1) + '</span><span><i style="background:#FF8FB8"></i>Survival ×0.25 = ' + s.toFixed(1) + '</span></div>';
      $(el, '.demo-out').innerHTML = 'Composite risk <b>' + tot + ' / 100</b> → ' + tier[1] + ' <b>' + tier[0] + '</b>' + (tot >= 50 ? ' · added to the clinician review queue' : '') + '. <em>Illustrative weights.</em>';
    }
    bindSliders(el, draw); draw();
  };

  /* 11 ─ Temporal progression */
  W.temporal = function (el) {
    var cases = { slow: { n: 'Slow progressor', v: [0.12, 0.18, 0.22, 0.27] }, fast: { n: 'Fast progressor', v: [0.30, 0.52, 0.71, 0.81] }, low: { n: 'Low-confidence case', v: [0.20, 0.35, 0.28, 0.44], wide: true } };
    el.innerHTML = frame('Four past scans give a progression-velocity trajectory. Choose a case and a forecast horizon — the uncertainty band (from Monte-Carlo dropout) widens the further ahead you look.',
      '<div class="tp"></div>', Object.keys(cases).map(function (k, i) { return '<button class="demo-btn' + (i === 1 ? ' on' : '') + '" data-c="' + k + '">' + cases[k].n + '</button>'; }).join('') +
      '<span style="width:100%"></span><button class="demo-btn" data-h="30">+30 days</button><button class="demo-btn on" data-h="60">+60 days</button><button class="demo-btn" data-h="90">+90 days</button>');
    var cur = 'fast', hz = 60;
    function draw() {
      var c = cases[cur], v = c.v, slope = (v[3] - v[1]) / 2, steps = hz / 30;
      var pred = clamp(v[3] + slope * steps * 0.7, 0, 1), band = (c.wide ? 0.09 : 0.04) * steps;
      var X = function (i) { return 60 + i * 90; }, Y = function (y) { return 170 - y * 140; };
      var pts = v.map(function (y, i) { return X(i) + ',' + Y(y); }).join(' ');
      var px = X(3 + steps);
      var s = '<svg viewBox="0 0 ' + (px + 60) + ' 200" style="width:100%;min-width:420px">';
      [0.3, 0.5, 0.75].forEach(function (t) { s += '<line x1="40" x2="' + (px + 40) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="#21151C" stroke-dasharray="4 4"/><text x="' + (px + 44) + '" y="' + (Y(t) + 4) + '" fill="#5A4A52" font-size="9">' + t + '</text>'; });
      s += '<path d="M' + X(3) + ' ' + Y(v[3]) + ' L' + px + ' ' + Y(clamp(pred + band, 0, 1)) + ' L' + px + ' ' + Y(clamp(pred - band, 0, 1)) + 'Z" fill="rgba(255,143,184,.15)"/>';
      s += '<polyline points="' + pts + '" fill="none" stroke="#C8203F" stroke-width="2.2"/>';
      s += '<line x1="' + X(3) + '" y1="' + Y(v[3]) + '" x2="' + px + '" y2="' + Y(pred) + '" stroke="#FF8FB8" stroke-width="2" stroke-dasharray="6 5"/>';
      v.forEach(function (y, i) { s += '<circle cx="' + X(i) + '" cy="' + Y(y) + '" r="5" fill="#160F14" stroke="#C8203F" stroke-width="2"/><text x="' + X(i) + '" y="192" text-anchor="middle" fill="#A8949D" font-size="10">t' + i + '</text>'; });
      s += '<circle cx="' + px + '" cy="' + Y(pred) + '" r="6" fill="#FF8FB8"/><text x="' + px + '" y="192" text-anchor="middle" fill="#FFC1D6" font-size="10">+' + hz + 'd</text></svg>';
      $(el, '.tp').innerHTML = s;
      var tier = pred < 0.3 ? 'LOW' : pred < 0.5 ? 'MODERATE' : pred < 0.75 ? 'HIGH' : 'CRITICAL';
      $(el, '.demo-out').innerHTML = 'Projected velocity at +' + hz + ' days: <b>' + pred.toFixed(2) + ' ± ' + band.toFixed(2) + '</b> → risk tier <b>' + tier + '</b>. <em>Synthetic projection — not a diagnosis.</em>';
    }
    $$(el, '[data-c]').forEach(function (b) { b.addEventListener('click', function () { $$(el, '[data-c]').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); cur = b.dataset.c; draw(); }); });
    $$(el, '[data-h]').forEach(function (b) { b.addEventListener('click', function () { $$(el, '[data-h]').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); hz = +b.dataset.h; draw(); }); });
    draw();
  };

  /* 12 ─ Adaptive savings target (Zenith) */
  W.savings = function (el) {
    el.innerHTML = frame('Zenith never asks for a fixed monthly amount. It divides what\'s left by the months remaining — so skipping a month raises the target, and overpaying lowers it.',
      '<div class="sv"></div>', slider('target', 'Goal (₱)', 10000, 300000, 5000, 120000) + slider('months', 'Months left', 1, 36, 1, 12) + slider('saved', 'Saved so far (₱)', 0, 300000, 1000, 30000) + slider('dep', 'This month\'s deposit (₱)', 0, 50000, 500, 7500));
    var peso = function (n) { return '₱' + Math.round(n).toLocaleString('en-PH'); };
    function draw() {
      var T = val(el, 'target'), m = val(el, 'months'), S = Math.min(val(el, 'saved'), T), D = val(el, 'dep');
      var now = Math.max(0, (T - S) / m), after = m > 1 ? Math.max(0, (T - S - D) / (m - 1)) : 0, skip = m > 1 ? Math.max(0, (T - S) / (m - 1)) : T - S;
      var pct = S / T, bars = '';
      var Wd = 520, bw = Math.max(4, Math.min(30, (Wd - 40) / m - 4));
      for (var i = 0; i < m; i++) { var amt = i === 0 ? D : after, h = clamp(amt / Math.max(now * 2, 1) * 90, 2, 100); bars += '<rect x="' + (20 + i * (bw + 4)) + '" y="' + (110 - h) + '" width="' + bw + '" height="' + h + '" rx="3" fill="' + (i === 0 ? '#FF8FB8' : '#A3142F') + '"/>'; }
      $(el, '.sv').innerHTML = '<div class="progress" style="margin:0 0 16px"><div class="progress-label"><span>Progress to goal</span><b>' + Math.round(pct * 100) + '%</b></div><div class="progress-track"><div class="progress-fill" style="width:' + pct * 100 + '%"></div></div></div>' +
        '<svg viewBox="0 0 ' + Wd + ' 120" style="width:100%">' + bars + '<line x1="16" x2="' + (Wd - 10) + '" y1="' + (110 - clamp(now / Math.max(now * 2, 1) * 90, 2, 100)) + '" y2="' + (110 - clamp(now / Math.max(now * 2, 1) * 90, 2, 100)) + '" stroke="#FFC1D6" stroke-dasharray="4 4"/></svg>' +
        '<div class="kv" style="margin-top:10px"><div><small>Target this month</small><b>' + peso(now) + '</b></div><div><small>Next month after deposit</small><b>' + peso(after) + '</b></div><div><small>If you skip</small><b>' + peso(skip) + '</b></div></div>';
      var diff = after - now;
      $(el, '.demo-out').innerHTML = D >= now ? 'Depositing <b>' + peso(D) + '</b> beats the target — future months drop by <b>' + peso(-diff) + '</b>.' : 'Depositing <b>' + peso(D) + '</b> is short — the plan rebalances and each remaining month rises by <b>' + peso(diff) + '</b>.';
    }
    bindSliders(el, draw); draw();
  };

  /* 13 ─ Diagnostic thresholds */
  W.diagnostic = function (el) {
    var rules = [['cpu', 'CPU', 90, '%'], ['ram', 'RAM', 85, '%'], ['disk', 'Disk', 95, '%'], ['temp', 'CPU temp', 90, '°C']];
    el.innerHTML = frame('The monitor samples the system on a schedule and compares each reading with its alert threshold. Push a slider past its limit — or simulate a spike.',
      '<div class="dg"></div>', rules.map(function (r) { return slider(r[0], r[1] + ' ' + r[3], 0, 100, 1, { cpu: 38, ram: 64, disk: 71, temp: 62 }[r[0]]); }).join('') + '<button class="demo-btn" data-a="spike">⚡ Simulate spike</button>');
    function draw() {
      var alerts = [];
      var html = rules.map(function (r) {
        var v = val(el, r[0]), over = v > r[2];
        if (over) alerts.push(r[1] + ' at ' + v + r[3] + ' (limit ' + r[2] + r[3] + ')');
        return '<div style="margin-bottom:10px"><div class="progress-label"><span>' + r[1] + '</span><b style="color:' + (over ? '#ff5a7a' : '#FF8FB8') + '">' + v + r[3] + (over ? ' ⚠' : '') + '</b></div><div class="progress-track" style="position:relative"><div class="progress-fill" style="width:' + v + '%;' + (over ? 'background:#C8203F' : '') + '"></div><span style="position:absolute;left:' + r[2] + '%;top:-3px;width:2px;height:12px;background:#FFC1D6"></span></div></div>';
      }).join('');
      $(el, '.dg').innerHTML = html;
      $(el, '.demo-out').innerHTML = alerts.length ? '<b>' + alerts.length + ' alert' + (alerts.length > 1 ? 's' : '') + ':</b> ' + alerts.map(esc).join(' · ') : '<b>✓ All clear</b> — every reading is within its threshold.';
    }
    $(el, '[data-a=spike]').addEventListener('click', function () {
      rules.forEach(function (r) { var inp = $(el, '[name=' + r[0] + ']'); inp.value = Math.round(50 + Math.random() * 50); $(el, 'output[data-for=' + r[0] + ']').textContent = inp.value; });
      draw();
    });
    bindSliders(el, draw); draw();
  };

  /* 14 ─ End-to-end encrypted sync (Dear Day) */
  W.e2e = function (el) {
    el.innerHTML = frame('Write a note and sync it. It is padded and encrypted on your device with AES-256-GCM before it leaves, so the server stores only ciphertext. Only a paired device holding the key can read it back.',
      '<div class="e2"></div>', '<label style="flex:3;min-width:220px">Your note<input type="text" name="note" maxlength="120" value="Saw the moon tonight — it was beautiful." style="padding:10px 12px;border-radius:8px;border:1px solid var(--red-line);background:var(--ink-800);color:var(--text);font:inherit;text-transform:none;letter-spacing:0"></label><button class="demo-btn on" data-a="sync">🔒 Encrypt &amp; sync</button>');
    var hex = function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };
    function render(ct, iv, real, plain) {
      var padded = Math.ceil((new TextEncoder().encode(plain).length + 16) / 256) * 256;
      $(el, '.e2').innerHTML = '<div class="pipe">' +
        '<div class="pipe-step pass"><small>📱 This device</small><b>Plaintext</b><em style="color:var(--text)">' + esc(plain) + '</em></div>' +
        '<div class="pipe-step pass"><small>AES-256-GCM</small><b>Encrypt</b><em>padded to ' + padded + ' B</em></div>' +
        '<div class="pipe-step fail" style="border-color:var(--red-400)"><small>☁ Server sees</small><b style="font-family:var(--font-mono);font-size:11px;word-break:break-all">' + ct.slice(0, 48) + '…</b><em style="color:var(--muted)">ciphertext only</em></div>' +
        '<div class="pipe-step pass"><small>💻 Paired device</small><b>Decrypt</b><em style="color:var(--text)">' + esc(plain) + '</em></div></div>' +
        '<p class="hint" style="margin:12px 0 0">IV <code style="font-family:var(--font-mono);color:var(--pink-300)">' + iv + '</code> · ' + (real ? 'encrypted for real in your browser with WebCrypto' : 'simulated ciphertext (WebCrypto unavailable on this page)') + '.</p>' +
        '<div class="chips" style="margin-top:14px">' + ['Quiet Room', 'Scrapbook', 'Night Sky', 'Garden', 'Vanity Studio', 'Journal', 'Little Compass', 'English Corner', 'Keepsakes', 'Songs'].map(function (pl) { return '<span class="chip">' + pl + '</span>'; }).join('') + '</div>';
      $(el, '.demo-out').innerHTML = 'Synced. The server knows the record\'s <b>type, size and timestamp</b> — never its contents.';
    }
    function sync() {
      var plain = $(el, '[name=note]').value || ' ';
      var c = window.crypto && window.crypto.subtle;
      if (c) {
        var iv = crypto.getRandomValues(new Uint8Array(12));
        c.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']).then(function (key) {
          return c.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plain));
        }).then(function (ct) { render(hex(ct), hex(iv), true, plain); }).catch(function () { fake(plain); });
      } else fake(plain);
    }
    function fake(plain) {
      var s = '', iv = '';
      for (var i = 0; i < 64; i++) s += ('0' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
      for (var j = 0; j < 12; j++) iv += ('0' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
      render(s, iv, false, plain);
    }
    $(el, '[data-a=sync]').addEventListener('click', sync);
    $(el, '[name=note]').addEventListener('keydown', function (e) { if (e.key === 'Enter') sync(); });
    sync();
  };

  /* 15 ─ Ending resolver (Aletheia) */
  W.resolver = function (el) {
    var END = {
      neutral: ['Neutral', 'Summer ends. Nothing was asked, nothing was lost.'],
      good: ['Good', 'Warmth earned by not-seeing. She stays.'],
      bad: ['Bad', 'You looked, and she was not there to hold onto.'],
      uncanny: ['Uncanny', 'You saw what she is — and stayed anyway. The menus start to notice you.'],
      mindbreak: ['Mind Break', 'Closeness and prying collide. Your words turn to scribble.'],
      madness: ['Madness', 'You forced the truth out. The title screen begins to decay.'],
      'true': ['True', 'She remembers every ending. The name finally reads ALETHEIA.']
    };
    el.innerHTML = frame('Three hidden meters decide which of the seven endings you reach. A meter counts as "high" at 2 or more. Adjust them — or unlock the True ending by having seen all six others.',
      '<div class="rs"></div>', slider('aff', 'Affinity', 0, 5, 1, 2) + slider('dread', 'Dread', 0, 5, 1, 0) + slider('fix', 'Fixation', 0, 5, 1, 0) +
      '<label style="flex-direction:row;display:flex;align-items:center;gap:8px;min-width:auto"><input type="checkbox" name="all"> All six other endings seen</label>');
    function resolve(a, d, f, all) {
      if (all) return 'true';
      if (d < 2) return a >= 2 ? 'good' : 'neutral';
      if (f >= 2) return a >= 2 ? 'mindbreak' : 'madness';
      return a >= 2 ? 'uncanny' : 'bad';
    }
    function draw() {
      var a = val(el, 'aff'), d = val(el, 'dread'), f = val(el, 'fix'), all = $(el, '[name=all]').checked;
      var k = resolve(a, d, f, all), e = END[k];
      var name = 'ALETHEIA', shown = Math.round(clamp(d / 5 + (all ? 1 : 0), 0, 1) * 3);
      var title = all ? name : ('LETHE').split('').map(function (ch, i) { return i < shown ? '<span style="color:#FF8FB8">' + ch + '</span>' : ch; }).join('');
      var cells = [['neutral', 'good'], ['bad', 'uncanny'], ['madness', 'mindbreak']];
      var rows = ['Dread < 2', 'Dread ≥ 2 · Fix < 2', 'Dread ≥ 2 · Fix ≥ 2'];
      var grid = '<div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:6px;font-size:12.5px">' +
        '<span></span><b style="color:var(--muted);text-align:center;font-weight:500">Affinity &lt; 2</b><b style="color:var(--muted);text-align:center;font-weight:500">Affinity ≥ 2</b>' +
        cells.map(function (row, ri) {
          return '<span style="color:var(--muted);align-self:center">' + rows[ri] + '</span>' + row.map(function (c) {
            var on = c === k;
            return '<div style="padding:12px;text-align:center;border-radius:8px;border:1px solid ' + (on ? '#FF8FB8' : 'var(--red-line)') + ';background:' + (on ? 'var(--red-800)' : 'var(--ink-800)') + ';color:' + (on ? '#FFC1D6' : 'var(--text)') + ';transition:all .3s">' + (on ? '✦ ' : '') + END[c][0] + '</div>';
          }).join('');
        }).join('') + '</div>';
      $(el, '.rs').innerHTML = '<p style="text-align:center;font-family:var(--font-head);font-size:38px;letter-spacing:.3em;color:var(--heading);margin-bottom:16px' + (k === 'madness' || k === 'mindbreak' ? ';filter:blur(.6px);text-shadow:2px 0 #C8203F,-2px 0 #FF8FB8' : '') + '">' + title + '</p>' + grid +
        (all ? '<p class="ov-note" style="text-align:center">✦ The True ending overrides the grid.</p>' : '');
      $(el, '.demo-out').innerHTML = 'Ending: <b>' + e[0] + '</b> — ' + esc(e[1]);
    }
    $(el, '[name=all]').addEventListener('change', draw);
    bindSliders(el, draw); draw();
  };

  /* 16 ─ Ouroboros (Vault): notes as gems on a serpent eating its own tail */
  W.ouroboros = function (el) {
    var GROUPS = [['Dear Day', '#FF8FB8'], ['Aletheia', '#C8203F'], ['DataLens', '#FFC1D6'], ['Retina', '#ff5a7a'], ['Local LLM', '#e9dde2'], ['Vault', '#A3142F']];
    var MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    var N = 53, seed = 7, notes = [], links = [];
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var i = 0; i < N; i++) {
      var g = i < 4 ? 0 : (rnd() < 0.35 && i > 0 ? notes[i - 1].g : Math.floor(rnd() * GROUPS.length));
      notes.push({ i: i, g: g, m: Math.min(9, Math.floor(Math.pow(i / N, 0.85) * 10)), deg: 0 });
      if (i > 0) {   // each note links back to one or two earlier notes, usually in the same project
        for (var k = 0, nl = rnd() < 0.4 ? 2 : 1; k < nl; k++) {
          var j = i - 1 - Math.floor(rnd() * Math.min(i, 14));
          if (rnd() < 0.55) for (var b = i - 1; b >= 0; b--) if (notes[b].g === g) { j = b; break; }
          links.push([j, i]); notes[j].deg++; notes[i].deg++;
        }
      }
    }
    var off = {}, chips = GROUPS.map(function (gr, gi) { return '<button class="demo-btn on" data-g="' + gi + '" style="border-color:' + gr[1] + '">' + gr[0] + '</button>'; }).join('');
    el.innerHTML = frame('Every note in the vault becomes a gem on the serpent — the tail is the oldest note, the head the newest. Drag the timeline to watch the vault grow, replay it, or hover a gem to see its links. <em>Illustrative data — no real note contents.</em>',
      '<canvas class="ouro-cv" style="width:100%;height:320px;display:block;border-radius:12px;background:radial-gradient(circle at 50% 50%,#1a0710,#07050A 70%)"></canvas>',
      slider('mo', 'Up to', 1, 10, 1, 10) + '<button class="demo-btn" data-act="replay">▶ Replay growth</button><div style="display:flex;flex-wrap:wrap;gap:6px;width:100%">' + chips + '</div>');
    var cv = $(el, '.ouro-cv'), ctx = cv.getContext('2d'), W2 = 0, H2 = 0, dpr = 1, hover = -1, shown = N, anim = null, raf = 0, t0 = performance.now();
    var outMo = $(el, 'output[data-for="mo"]');
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); W2 = cv.clientWidth; H2 = cv.clientHeight; cv.width = W2 * dpr; cv.height = H2 * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function pt(s, t) {   // serpent path: an open ellipse, head chasing tail
      var a = -Math.PI / 2 + 0.22 + s * Math.PI * 2 * 0.93, R = Math.min(W2 * 0.36, H2 * 0.62);
      var wob = Math.sin(s * 26 + t * 1.4) * 3;
      return { x: W2 / 2 + Math.cos(a) * (R * 1.3 + wob), y: H2 / 2 + Math.sin(a) * (R * 0.72 + wob), a: a };
    }
    function visible(n) { return n.i < shown && !off[n.g]; }
    function draw() {
      if (!document.body.contains(cv)) { cancelAnimationFrame(raf); return; }
      raf = requestAnimationFrame(draw);
      if (!W2) size();
      var t = (performance.now() - t0) / 1000;
      if (anim) {
        var p = Math.min(1, (performance.now() - anim) / 4200);
        shown = Math.max(1, Math.round(p * N));
        var mo = notes[shown - 1].m + 1; $(el, '[name=mo]').value = mo; outMo.textContent = MONTHS[mo - 1];
        if (p >= 1) anim = null;
      }
      ctx.clearRect(0, 0, W2, H2);
      var last = shown - 1, S;
      // body
      ctx.lineCap = 'round';
      for (var w = 0; w < 2; w++) {
        ctx.beginPath();
        for (var q = 0; q <= last; q++) { S = pt(q / (N - 1), t); if (q) ctx.lineTo(S.x, S.y); else ctx.moveTo(S.x, S.y); }
        ctx.strokeStyle = w ? 'rgba(255,143,184,.35)' : 'rgba(163,20,47,.55)'; ctx.lineWidth = w ? 2 : 16; ctx.stroke();
      }
      // links: arcs through the coil's centre
      links.forEach(function (l) {
        var A = notes[l[0]], B = notes[l[1]];
        if (!visible(A) || !visible(B)) return;
        var pa = pt(A.i / (N - 1), t), pb = pt(B.i / (N - 1), t), hl = hover === A.i || hover === B.i;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.quadraticCurveTo(W2 / 2, H2 / 2, pb.x, pb.y);
        ctx.strokeStyle = hl ? 'rgba(255,193,214,.85)' : 'rgba(200,32,63,.16)'; ctx.lineWidth = hl ? 1.4 : 0.8; ctx.stroke();
      });
      // gems
      notes.forEach(function (n) {
        if (!visible(n)) return;
        var P = pt(n.i / (N - 1), t), r = 3.2 + Math.min(n.deg, 6) * 0.7 + (hover === n.i ? 2.5 : 0), col = GROUPS[n.g][1];
        ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.a + Math.PI / 4);
        ctx.shadowColor = col; ctx.shadowBlur = hover === n.i ? 16 : 7;
        ctx.fillStyle = col; ctx.fillRect(-r / 2, -r / 2, r, r);
        ctx.restore();
      });
      // head, at the newest note, turned along the path
      var H = pt(last / (N - 1), t), Hn = pt(Math.min(1, (last + 1) / (N - 1)), t), ang = Math.atan2(Hn.y - H.y, Hn.x - H.x);
      ctx.save(); ctx.translate(H.x, H.y); ctx.rotate(ang);
      ctx.fillStyle = '#C8203F'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.quadraticCurveTo(4, -11, -8, -7); ctx.lineTo(-8, 7); ctx.quadraticCurveTo(4, 11, 16, 0); ctx.fill();
      ctx.fillStyle = '#FFC1D6'; ctx.beginPath(); ctx.arc(6, -3.5, 1.8, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    function setOut() {
      var vis = notes.filter(visible).length;
      if (hover >= 0) {
        var n = notes[hover], ln = links.filter(function (l) { return l[0] === hover || l[1] === hover; }).length;
        $(el, '.demo-out').innerHTML = '<b>note ' + (hover + 1 < 10 ? '0' : '') + (hover + 1) + '</b> · ' + GROUPS[n.g][0] + ' · first seen ' + MONTHS[n.m] + ' 2026 · <b>' + ln + '</b> link' + (ln === 1 ? '' : 's');
      } else $(el, '.demo-out').innerHTML = '<b>' + vis + '</b> notes on the serpent · ' + links.filter(function (l) { return visible(notes[l[0]]) && visible(notes[l[1]]); }).length + ' links · tail = oldest, head = newest';
    }
    cv.addEventListener('mousemove', function (e) {
      var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = -1, bd = 14, t = (performance.now() - t0) / 1000;
      notes.forEach(function (n) { if (!visible(n)) return; var P = pt(n.i / (N - 1), t), d = Math.hypot(P.x - x, P.y - y); if (d < bd) { bd = d; best = n.i; } });
      if (best !== hover) { hover = best; setOut(); }
    });
    cv.addEventListener('mouseleave', function () { hover = -1; setOut(); });
    bindSliders(el, function () {
      anim = null; var mo = val(el, 'mo'); outMo.textContent = MONTHS[mo - 1];
      shown = notes.filter(function (n) { return n.m < mo; }).length || 1; setOut();
    });
    outMo.textContent = 'Nov';
    $(el, '[data-act=replay]').addEventListener('click', function () { anim = performance.now(); hover = -1; var iv = setInterval(function () { if (!document.body.contains(cv)) { clearInterval(iv); return; } setOut(); if (!anim) clearInterval(iv); }, 200); });
    $$(el, '[data-g]').forEach(function (b) { b.addEventListener('click', function () { var g = +b.dataset.g; off[g] = !off[g]; b.classList.toggle('on', !off[g]); setOut(); }); });
    window.addEventListener('resize', function rs() { if (!document.body.contains(cv)) { window.removeEventListener('resize', rs); return; } size(); });
    setOut(); requestAnimationFrame(function () { size(); draw(); });
  };

  function renderDemo(p, el) {
    var fn = W[p.widget];
    if (fn) fn(el); else el.innerHTML = '<p class="hint">Concept demo coming soon.</p>';
  }

  window.Viz = {
    esc: esc,
    CAT_LABEL: CAT_LABEL,
    miniDiagram: miniDiagram,
    render: function (p, tab, el) {
      ({ overview: renderOverview, architecture: renderArchitecture, stack: renderStack, demo: renderDemo, timeline: renderTimeline }[tab] || renderOverview)(p, el);
    }
  };
})();
