'use strict';

/* Тривиум — веб-версия. Данные (SPEC) приходят из data.js,
 * расчёт — из scoring.js, здесь только интерфейс.
 */

(function () {
  const $ = sel => document.querySelector(sel);

  const VERTEX_KEYS = ['art', 'reason', 'body', 'soul'];
  const BLOCKS = SPEC.blocks;
  const BY_KEY = {};
  BLOCKS.forEach(b => { BY_KEY[b.key] = b; });

  const state = {
    ovA: null,
    ovB: null,
    base: {},
    art: {},
    active: null,
    result: null,
    compact: false,
    theme: 'dark',
  };

  /* ── утилиты ─────────────────────────────────────── */
  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(message) {
    const box = document.createElement('div');
    box.className = 'toast';
    box.textContent = message;
    document.body.append(box);
    setTimeout(() => box.remove(), 7000);
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function blockTitle(key) {
    return BY_KEY[key] ? BY_KEY[key].title : '';
  }

  /* ── тема ────────────────────────────────────────── */
  function loadTheme() {
    try {
      const saved = localStorage.getItem('trivium-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* локальное хранилище может быть недоступно */ }
    return 'dark';
  }

  function setTheme(name) {
    state.theme = name;
    document.documentElement.dataset.theme = name;
    $('#themeBtn').textContent = name === 'dark' ? 'светлая тема' : 'тёмная тема';
    try { localStorage.setItem('trivium-theme', name); } catch (e) { /* ignore */ }
    if (state.active) renderPanel();
    if (state.result) renderResult();
    drawTetra();
  }

  /* ── тетраэдр ────────────────────────────────────── */
  const canvas = $('#tetra');
  const ctx = canvas.getContext('2d');

  const VERTS = [
    [0, 1, 0],
    [0.9428, -0.3333, 0],
    [-0.4714, -0.3333, 0.8165],
    [-0.4714, -0.3333, -0.8165],
  ];
  const EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const TILT = -0.32;

  let spin = 0.7;
  let clock = 0;
  let reducedMotion = false;
  let morph = 0;          // 0 — фигура целиком, 1 — раскрыта вокруг вершины
  let anchorIdx = -1;     // вершина, к которой раскрылись
  let hovered = -1;
  let nodes = [];

  function fitCanvas(item, context) {
    const dpr = window.devicePixelRatio || 1;
    const w = item.clientWidth;
    const h = item.clientHeight;
    if (!w || !h) return null;
    if (item.width !== Math.round(w * dpr) || item.height !== Math.round(h * dpr)) {
      item.width = Math.round(w * dpr);
      item.height = Math.round(h * dpr);
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  // положение вершины в закрытой фигуре
  function projectPoint(point, cx, radius) {
    const cy = Math.cos(spin);
    const sy = Math.sin(spin);
    const x = point[0] * cy + point[2] * sy;
    const z = -point[0] * sy + point[2] * cy;
    const y = point[1];
    const y2 = y * Math.cos(TILT) - z * Math.sin(TILT);
    const z2 = y * Math.sin(TILT) + z * Math.cos(TILT);
    const depth = 3.4;
    const f = depth / (depth + z2);
    return { x: cx + x * radius * f, y: 0, yRel: y2 * radius * f, z: z2, f };
  }

  function axisPoint(i, dock, orb, t) {
    // три свободные вершины вращаются вокруг горизонтальной оси слева от опоры
    if (i === anchorIdx) return { x: dock.x, y: dock.y };
    const k = i < anchorIdx ? i : i - 1;
    const ang = clock * 0.0005 + k * 2 * Math.PI / 3;
    return {
      x: dock.x - orb.dist - 55 * Math.cos(ang),
      y: dock.y - orb.radius * Math.sin(ang),
    };
  }

  function geometry(size) {
    const panel = $('#panel');
    const stageRect = canvas.getBoundingClientRect();
    let dockX = size.w * 0.62;
    let dockY = size.h / 2;
    if (anchorIdx >= 0 && panel && !panel.hidden) {
      const pr = panel.getBoundingClientRect();
      dockX = pr.left - stageRect.left - 26;
      dockY = pr.top - stageRect.top + pr.height / 2;
    }
    const dist = Math.max(120, Math.min(200, dockX * 0.38));
    const radius = Math.min(140, size.h * 0.27);
    const closedR = Math.min(size.w, size.h) * 0.34;
    const openR = Math.min(150, size.h * 0.30);
    return {
      dock: { x: dockX, y: dockY },
      orb: { dist, radius },
      cx: size.w / 2 + (dockX - dist - size.w / 2) * morph,
      radius: closedR + (openR - closedR) * morph,
    };
  }

  function drawTetra() {
    if (!ctx) return;
    const size = fitCanvas(canvas, ctx);
    if (!size) return;
    ctx.clearRect(0, 0, size.w, size.h);

    const ring = cssVar('--ring');
    const accent = cssVar('--accent');
    const mute = cssVar('--text-mute');
    const line = cssVar('--line');

    const geo = geometry(size);
    const t = morph;

    // направляющие — только в закрытой фигуре
    if (t < 0.99) {
      ctx.save();
      ctx.globalAlpha = 0.5 * (1 - t);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      const r = geo.radius;
      [0.62, 1].forEach(k => {
        ctx.beginPath();
        ctx.ellipse(geo.cx, size.h / 2, r * k, r * k * 0.44, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    nodes = VERTS.map((v, i) => {
      const closed = projectPoint(v, geo.cx, geo.radius);
      const closedY = size.h / 2 - closed.yRel;
      if (t <= 0.001) return { x: closed.x, y: closedY };
      const open = axisPoint(i, geo.dock, geo.orb, t);
      return {
        x: closed.x + (open.x - closed.x) * t,
        y: closedY + (open.y - closedY) * t,
      };
    });

    // рёбра
    ctx.strokeStyle = cssVar('--text');
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.34;
    EDGES.forEach(e => {
      ctx.beginPath();
      ctx.moveTo(nodes[e[0]].x, nodes[e[0]].y);
      ctx.lineTo(nodes[e[1]].x, nodes[e[1]].y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // вершины
    nodes.forEach((p, i) => {
      const key = VERTEX_KEYS[i];
      const active = state.active === key;
      const hot = active || hovered === i;
      ctx.beginPath();
      ctx.arc(p.x, p.y, hot ? 10 : 8, 0, Math.PI * 2);
      ctx.fillStyle = hot ? accent : ring;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, hot ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cssVar('--bg');
      ctx.fill();

      ctx.font = (hot ? '600 ' : '500 ') + '10px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = hot ? accent : mute;
      ctx.textBaseline = 'middle';
      const docked = morph > 0.5 && i === anchorIdx;
      ctx.textAlign = docked ? 'right' : 'center';
      ctx.fillText(String(blockTitle(key)).toUpperCase(),
        docked ? p.x - 16 : p.x,
        docked ? p.y : p.y + 20);
    });
  }

  function hitTest(x, y) {
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      const dx = x - p.x;
      const dy = y - p.y;
      if (dx * dx + dy * dy <= 30 * 30) return i;
    }
    return -1;
  }

  canvas.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit !== hovered) {
      hovered = hit;
      canvas.style.cursor = hit >= 0 ? 'pointer' : 'default';
      drawTetra();
    }
  });

  canvas.addEventListener('pointerleave', () => {
    if (hovered !== -1) { hovered = -1; drawTetra(); }
  });

  canvas.addEventListener('pointerdown', e => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit >= 0) openBlock(VERTEX_KEYS[hit]);
  });

  function loop(ts) {
    const dt = lastTs ? Math.min(64, ts - lastTs) : 16;
    lastTs = ts;
    clock += dt;

    const target = state.active ? 1 : 0;
    if (morph !== target) {
      const step = Math.min(1, dt / 140);
      morph += (target - morph) * step;
      if (Math.abs(target - morph) < 0.003) morph = target;
    } else if (!state.active) {
      spin += dt * 0.00034;
    }
    drawTetra();
    requestAnimationFrame(loop);
  }

  let lastTs = 0;

  /* ── панель блока ────────────────────────────────── */
  function positionsOf(kind) {
    return kind === 'art' ? state.art : state.base;
  }

  function makeFader(key, kind, value) {
    const wrap = document.createElement('div');
    wrap.className = 'fader';
    wrap.innerHTML =
      '<div class="fader-track"></div><div class="fader-notch"></div>' +
      '<div class="fader-fill"></div><div class="fader-handle"></div>';
    const fill = wrap.querySelector('.fader-fill');
    const handle = wrap.querySelector('.fader-handle');
    const store = positionsOf(kind);
    let pos = value || 0;

    function paint() {
      const left = 50 + pos * 50;
      handle.style.left = left + '%';
      if (Math.abs(pos) < 1e-6) {
        fill.style.opacity = '0';
        handle.style.background = cssVar('--text');
        handle.style.borderColor = cssVar('--ring');
      } else {
        const color = pos < 0 ? cssVar('--side-a') : cssVar('--side-b');
        fill.style.opacity = '1';
        fill.style.background = color;
        fill.style.left = (pos < 0 ? left : 50) + '%';
        fill.style.width = Math.abs(pos) * 50 + '%';
        handle.style.background = color;
        handle.style.borderColor = cssVar('--surface');
      }
    }

    function set(next) {
      let p = Math.max(-1, Math.min(1, next));
      if (Math.abs(p) < 0.02) p = 0;
      pos = p;
      store[key] = p;
      paint();
    }

    function fromEvent(e) {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    }

    let downAt = 0;
    let downX = 0;
    let downY = 0;

    wrap.addEventListener('pointerdown', e => {
      e.preventDefault();
      wrap.setPointerCapture(e.pointerId);
      wrap.classList.add('dragging');
      const now = Date.now();
      if (now - downAt < 320 &&
          Math.abs(e.clientX - downX) < 26 &&
          Math.abs(e.clientY - downY) < 26) {
        downAt = 0;
        set(0);
        return;
      }
      downAt = now;
      downX = e.clientX;
      downY = e.clientY;
      fromEvent(e);
    });

    wrap.addEventListener('pointermove', e => {
      if (wrap.classList.contains('dragging')) fromEvent(e);
    });

    const stop = () => wrap.classList.remove('dragging');
    wrap.addEventListener('pointerup', stop);
    wrap.addEventListener('pointercancel', stop);
    wrap.addEventListener('dblclick', e => { e.preventDefault(); set(0); });

    paint();
    return wrap;
  }

  function renderPanel() {
    const block = BY_KEY[state.active];
    if (!block) return;
    $('#panelTitle').textContent = block.title;
    $('#panelSub').textContent = block.subtitle || '';
    const holder = $('#rows');
    holder.innerHTML = '';
    const store = positionsOf(block.kind);
    block.criteria.forEach(crit => {
      const row = document.createElement('div');
      row.className = 'row';
      const label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = crit.label;
      const value = store[crit.key];
      row.append(label, makeFader(crit.key, block.kind, value));
      holder.append(row);
    });
    $('#panel').hidden = false;
    $('#hint').classList.add('off');
    drawTetra();
  }

  function renderInfo() {
    const block = BY_KEY[state.active];
    if (!block) return;
    $('#infoTitle').textContent = block.title;
    const body = $('#infoBody');
    body.innerHTML = '';
    block.criteria.forEach(crit => {
      const h = document.createElement('h4');
      h.textContent = crit.label;
      body.append(h);
      const desc = crit.desc || {};
      if (desc.intro) {
        const p = document.createElement('p');
        p.textContent = desc.intro;
        body.append(p);
      }
      (desc.sections || []).forEach(section => {
        const h5 = document.createElement('h5');
        h5.textContent = section.title;
        body.append(h5);
        (section.items || []).forEach(item => {
          const p = document.createElement('p');
          p.className = 'bullet';
          p.innerHTML = '— <b>' + esc(item.title) + ':</b> ' + esc(item.text);
          body.append(p);
        });
      });
    });
    $('#info').hidden = false;
  }

  function openBlock(key) {
    if (!BY_KEY[key]) return;
    state.active = key;
    anchorIdx = VERTEX_KEYS.indexOf(key);
    if (reducedMotion) morph = 1;
    renderPanel();
    renderInfo();
    // на телефоне пояснения занимают весь экран — показываем по кнопке «?»
    if (state.compact) document.querySelector("#info").hidden = true;
    if (state.compact) $('#blockbar').classList.add('has-active');
    markBlockbar();
  }

  function closeBlock() {
    state.active = null;
    if (reducedMotion) morph = 0;
    $('#panel').hidden = true;
    $('#info').hidden = true;
    $('#hint').classList.remove('off');
    drawTetra();
    markBlockbar();
  }

  /* ── блоки в компактном режиме ───────────────────── */
  function buildBlockbar() {
    const bar = $('#blockbar');
    if (bar.childElementCount) return;
    VERTEX_KEYS.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'ghost';
      btn.dataset.key = key;
      btn.textContent = blockTitle(key);
      btn.addEventListener('click', () => openBlock(key));
      bar.append(btn);
    });
  }

  function markBlockbar() {
    document.querySelectorAll('#blockbar button').forEach(btn => {
      btn.classList.toggle('primary', btn.dataset.key === state.active);
      btn.classList.toggle('ghost', btn.dataset.key !== state.active);
    });
  }

  /* ── ОВ ──────────────────────────────────────────── */
  let ovSide = null;

  function ovText(value) {
    return value === null ? '▾ ОВ —' : '▾ ОВ ' + value;
  }

  function syncOvButtons() {
    $('#ovBtnA').textContent = ovText(state.ovA);
    $('#ovBtnB').textContent = ovText(state.ovB);
    $('#ovBtnA').classList.toggle('filled', state.ovA !== null);
    $('#ovBtnB').classList.toggle('filled', state.ovB !== null);
  }

  function buildTicks() {
    const holder = $('#ovTicks');
    holder.innerHTML = '';
    const max = SPEC.scales.ov.max;
    for (let i = 0; i <= max; i++) {
      const s = document.createElement('span');
      s.textContent = String(i);
      holder.append(s);
    }
  }

  function paintTicks(value) {
    document.querySelectorAll('#ovTicks span').forEach((s, i) => {
      s.classList.toggle('active', i === value);
    });
  }

  function openOv(side, anchor) {
    ovSide = side;
    const current = side === 'a' ? state.ovA : state.ovB;
    const range = $('#ovRange');
    range.min = SPEC.scales.ov.min;
    range.max = SPEC.scales.ov.max;
    range.step = SPEC.scales.ov.step;
    range.value = current === null ? 0 : current;
    paintTicks(Number(range.value));
    $('#ovPopTitle').textContent = 'ОБЩЕЕ ВПЕЧАТЛЕНИЕ — ПЕСНЯ ' + (side === 'a' ? '1' : '2');

    const pop = $('#ovPop');
    pop.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const width = pop.offsetWidth;
    let left = rect.left;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    pop.style.left = Math.max(12, left) + 'px';
    pop.style.top = (rect.bottom + 8) + 'px';
  }

  function closeOv() {
    $('#ovPop').hidden = true;
    ovSide = null;
  }

  /* ── модалка ─────────────────────────────────────── */
  let modalAction = null;

  function ask(title, text, okLabel, action) {
    $('#modalTitle').textContent = title;
    $('#modalText').textContent = text;
    $('#modalOk').textContent = okLabel;
    modalAction = action;
    $('#modal').hidden = false;
    $('#modalOk').focus();
  }

  function closeModal() {
    $('#modal').hidden = true;
    modalAction = null;
  }

  /* ── результат ───────────────────────────────────── */
  function currentPayload() {
    return {
      song_a: $('#nameA').value,
      song_b: $('#nameB').value,
      ov_a: state.ovA,
      ov_b: state.ovB,
      base: state.base,
      art: state.art,
    };
  }

  function showResult() {
    state.result = evaluate(currentPayload());
    closeBlock();
    closeHelp();
    renderResult();
    $('#result').hidden = false;
    $('#resultBtn').classList.add('active');
    $('#resultBtn').textContent = 'скрыть результат';
  }

  function hideResult() {
    state.result = null;
    $('#result').hidden = true;
    $('#resultBtn').classList.remove('active');
    $('#resultBtn').textContent = 'результат';
  }

  function sideList(holder, name, items, color) {
    holder.innerHTML = '';
    const cap = document.createElement('div');
    cap.className = 'side-name';
    cap.style.color = color;
    cap.textContent = name;
    holder.append(cap);

    const label = document.createElement('div');
    label.className = 'side-cap';
    label.textContent = 'сильнее оппонента';
    holder.append(label);

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'side-empty';
      empty.textContent = '—';
      holder.append(empty);
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'side-item';
      row.textContent = item.label;
      holder.append(row);
    });
  }

  function renderResult() {
    const res = state.result;
    if (!res) return;

    const cards = $('#resultCards');
    cards.innerHTML = '';
    const sides = [
      { name: res.name_a, ov: res.ov_a, win: res.winner === 'A', lose: res.winner === 'B' },
      { name: res.name_b, ov: res.ov_b, win: res.winner === 'B', lose: res.winner === 'A' },
    ];
    sides.forEach(side => {
      const card = document.createElement('div');
      card.className = 'rcard' + (side.lose ? ' muted' : '');
      const cap = side.win ? 'ПОБЕДИТЕЛЬ' : (side.lose ? 'ПРОИГРАВШИЙ' : 'НИЧЬЯ');
      card.innerHTML =
        '<div class="rcard-cap" style="color:' + (side.win ? 'var(--accent)' : '') + '">' + cap + '</div>' +
        '<div class="rcard-name">' + esc(side.name) + '</div>' +
        '<div class="rcard-ov">ОВ ' + esc(side.ov) + '</div>';
      cards.append(card);
    });

    sideList($('#sideA'), res.name_a, res.strengths_a, cssVar('--side-a'));
    sideList($('#sideB'), res.name_b, res.strengths_b, cssVar('--side-b'));

    const chip = $('#verdict');
    chip.textContent = res.verdict_label;
    chip.classList.toggle('accent', res.kind !== 'draw');

    drawRadar();
  }

  function drawRadar() {
    const res = state.result;
    const item = $('#radar');
    if (!res || !item) return;

    const box = item.parentElement;
    const height = Math.max(220, box.clientHeight - 16);
    const size = Math.min(height, 520);
    const dpr = window.devicePixelRatio || 1;
    item.style.width = size + 'px';
    item.style.height = size + 'px';
    item.width = Math.round(size * dpr);
    item.height = Math.round(size * dpr);
    const c = item.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size, size);

    const labels = res.radar.labels;
    const count = labels.length;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.34;
    const step = (Math.PI * 2) / count;
    const start = -Math.PI / 2;

    const pointAt = (index, value) => {
      const angle = start + step * index;
      const r = radius * Math.max(0, Math.min(1, value));
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    };

    // сетка
    c.strokeStyle = cssVar('--text');
    c.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++) {
      c.globalAlpha = 0.07 + ring * 0.015;
      c.beginPath();
      for (let i = 0; i <= count; i++) {
        const p = pointAt(i % count, ring / 4);
        if (i === 0) c.moveTo(p.x, p.y);
        else c.lineTo(p.x, p.y);
      }
      c.stroke();
    }
    c.globalAlpha = 0.12;
    for (let i = 0; i < count; i++) {
      const p = pointAt(i, 1);
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(p.x, p.y);
      c.stroke();
    }
    c.globalAlpha = 1;

    const max = res.radar.max || 1;
    const drawPoly = (values, color, alpha) => {
      c.beginPath();
      values.forEach((value, i) => {
        const p = pointAt(i, value / max);
        if (i === 0) c.moveTo(p.x, p.y);
        else c.lineTo(p.x, p.y);
      });
      c.closePath();
      c.globalAlpha = alpha;
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.stroke();
      c.globalAlpha = 1;
    };

    const colorA = cssVar('--side-a');
    const colorB = cssVar('--side-b');
    const aFirst = res.winner !== 'A';
    if (aFirst) {
      drawPoly(res.radar.a, colorA, 0.55);
      drawPoly(res.radar.b, colorB, 1);
      drawPoly(res.radar.a, colorA, 1);
    } else {
      drawPoly(res.radar.b, colorB, 0.55);
      drawPoly(res.radar.a, colorA, 1);
      drawPoly(res.radar.b, colorB, 1);
    }

    // подписи
    c.font = '10px "Segoe UI", Roboto, sans-serif';
    c.fillStyle = cssVar('--text-mute');
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    labels.forEach((label, i) => {
      const p = pointAt(i, 1.13);
      c.fillText(label, p.x, p.y);
    });
  }

  /* ── справка ─────────────────────────────────────── */
  function renderHelp() {
    const body = $('#helpBody');
    if (body.childElementCount) return;
    SPEC.algorithm.forEach(section => {
      const h = document.createElement('h4');
      h.innerHTML = (section.num ? '<span class="num">' + esc(section.num) + '.</span>' : '') +
        esc(section.title);
      body.append(h);
      (section.items || []).forEach(item => {
        if (item.h) {
          const sub = document.createElement('h5');
          sub.textContent = item.text;
          body.append(sub);
        } else {
          const p = document.createElement('p');
          p.textContent = item.text;
          body.append(p);
        }
      });
    });
  }

  function openHelp() {
    renderHelp();
    $('#help').hidden = false;
    $('#helpBtn').classList.add('active');
  }

  function closeHelp() {
    $('#help').hidden = true;
    $('#helpBtn').classList.remove('active');
  }

  /* ── сброс ───────────────────────────────────────── */
  function resetAll() {
    state.base = {};
    state.art = {};
    state.ovA = null;
    state.ovB = null;
    $('#nameA').value = '';
    $('#nameB').value = '';
    syncOvButtons();
    closeBlock();
    hideResult();
    drawTetra();
  }

  /* ── компактный режим ────────────────────────────── */
  function updateMode() {
    const compact = window.innerWidth < 900 || window.innerHeight < 520;
    if (compact !== state.compact) {
      state.compact = compact;
      document.body.classList.toggle('compact', compact);
      if (state.active) renderPanel();
    }
    if (compact) buildBlockbar();
  }

  /* ── демонстрация (?demo=block|result|help) ──────── */
  function applyDemo(kind) {
    document.querySelector('#nameA').value = 'Трек 1';
    document.querySelector('#nameB').value = 'Трек 2';
    state.ovA = 7;
    state.ovB = 5;
    state.base = {
      image: -0.62, rhyme: -0.18, rhythm: 0.34,
      technique: -0.44, density: 0.52, conformity: -0.12,
      individuality: -0.3, nativity: 0.22, quality: 0.41,
    };
    state.art = { depth: -0.35, reach: 0.28 };
    syncOvButtons();
    if (kind === 'block') openBlock('reason');
    else if (kind === 'help') openHelp();
    else if (kind === 'result') showResult();
  }

  /* ── запуск ──────────────────────────────────────── */
  function boot() {
    const params = new URLSearchParams(location.search);
    setTheme(params.get("theme") === "light" ? "light" : loadTheme());
    buildTicks();
    syncOvButtons();
    updateMode();

    $('#themeBtn').addEventListener('click', () => {
      setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    $('#panelClose').addEventListener('click', closeBlock);
    $('#infoClose').addEventListener('click', closeBlock);
    $('#panelInfo').addEventListener('click', () => {
      $('#info').hidden = !$('#info').hidden;
    });

    $('#helpBtn').addEventListener('click', () => {
      if ($('#help').hidden) openHelp(); else closeHelp();
    });
    $('#helpClose').addEventListener('click', closeHelp);

    $('#ovBtnA').addEventListener('click', e => openOv('a', e.currentTarget));
    $('#ovBtnB').addEventListener('click', e => openOv('b', e.currentTarget));
    $('#ovRange').addEventListener('input', e => paintTicks(Number(e.target.value)));
    $('#ovDone').addEventListener('click', () => {
      const value = Number($('#ovRange').value);
      if (ovSide === 'a') state.ovA = value; else state.ovB = value;
      syncOvButtons();
      closeOv();
    });
    $('#ovClear').addEventListener('click', () => {
      if (ovSide === 'a') state.ovA = null; else state.ovB = null;
      syncOvButtons();
      closeOv();
    });

    $('#resetBtn').addEventListener('click', () => {
      ask('Сброс', 'Очистить названия, фейдеры, ОВ и результат?', 'Сбросить', resetAll);
    });

    $('#resultBtn').addEventListener('click', () => {
      if (state.result) { hideResult(); return; }
      ask('Результат', 'Посчитать результат по выставленным фейдерам?', 'Посчитать', showResult);
    });

    $('#modalCancel').addEventListener('click', closeModal);
    $('#modalOk').addEventListener('click', () => {
      const action = modalAction;
      closeModal();
      if (action) action();
    });
    $('#modal').addEventListener('click', e => {
      if (e.target === $('#modal')) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!$('#modal').hidden) { closeModal(); return; }
      if (!$('#ovPop').hidden) { closeOv(); return; }
      if (!$('#help').hidden) { closeHelp(); return; }
      if (state.active) { closeBlock(); return; }
      if (state.result) hideResult();
    });

    const closeOnOutside = e => {
      const pop = $('#ovPop');
      if (pop.hidden) return;
      if (pop.contains(e.target) || e.target.classList.contains('ov-btn')) return;
      closeOv();
    };
    document.addEventListener('pointerdown', closeOnOutside);

    window.addEventListener('resize', () => {
      updateMode();
      drawTetra();
      if (state.result) drawRadar();
    });

    if (params.get("demo")) {
      window.__tri = {
        state: state,
        nodes: () => nodes,
        morph: () => morph,
        anchor: () => anchorIdx,
        geo: () => geometry(fitCanvas(canvas, ctx)),
      };
    }

    const demo = params.get("demo");
    if (demo) applyDemo(demo);

    window.addEventListener('error', e => {
      toast('Ошибка: ' + (e.message || 'что-то пошло не так'));
    });

    document.body.classList.remove('booting');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = reduce.matches;
    if (reduce.matches) {
      drawTetra();
    } else {
      requestAnimationFrame(loop);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
