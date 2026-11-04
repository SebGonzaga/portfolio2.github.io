/* Adventure mode: an overworld map where each building is one of the portfolio sections.
 * Walk with arrow keys / WASD, or tap/click the map. Entering a building slides in the
 * real section (moved, not copied, so tabs, the RAIN viewer and the lab keep working). */
(() => {
  'use strict';

  const PLACES = [
    { id: 'about',        sec: 'about',        name: 'Home Cottage',   tag: 'About me',          x: 130, y: 470, kind: 'cottage' },
    { id: 'skills',       sec: 'skills',       name: 'The Forge',      tag: 'Skills',            x: 200, y: 250, kind: 'forge' },
    { id: 'contact',      sec: 'contact',      name: 'Campfire',       tag: 'Contact',           x: 92,  y: 120, kind: 'camp' },
    { id: 'projects',     sec: 'projects',     name: 'Maker Workshop', tag: 'Projects',          x: 390, y: 360, kind: 'workshop' },
    { id: 'why',          sec: 'why',          name: 'Lighthouse',     tag: 'Why work with me',  x: 340, y: 530, kind: 'lighthouse' },
    { id: 'rain',         sec: 'rain',         name: 'R.A.I.N Tower',  tag: 'Disaster management', x: 610, y: 178, kind: 'tower' },
    { id: 'lab',          sec: 'lab',          name: 'Wizard Lab',     tag: 'Experiments',       x: 570, y: 490, kind: 'lab' },
    { id: 'experience',   sec: 'experience',   name: 'Guild Hall',     tag: 'Experience',        x: 770, y: 335, kind: 'guild' },
    { id: 'education',    sec: 'education',    name: 'Academy',        tag: 'Education',         x: 905, y: 210, kind: 'academy' },
    { id: 'certificates', sec: 'certificates', name: 'Trophy Hall',    tag: 'Certificates',      x: 885, y: 480, kind: 'trophy' },
  ];
  const EDGES = [['about', 'skills'], ['skills', 'contact'], ['skills', 'projects'], ['about', 'why'], ['projects', 'why'],
    ['projects', 'lab'], ['projects', 'rain'], ['projects', 'experience'], ['lab', 'experience'], ['rain', 'education'],
    ['experience', 'education'], ['experience', 'certificates']];
  const VOLCANO = { x: 770, y: 110 }, POND = { x: 720, y: 522, rx: 72, ry: 34 }, SPAWN = { x: 238, y: 428 };
  const KEY = 'advVisited', SPEED = 230;

  /* ---------- little SVG buildings (drawn around 0,0, base at y~4) ---------- */
  const ICON = {
    cottage: `<rect x="14" y="-52" width="9" height="20" fill="#9b6b4a"/><circle class="adv-smoke" cx="18" cy="-56" r="5" style="animation-delay:0s"/><circle class="adv-smoke" cx="19" cy="-56" r="4" style="animation-delay:2.4s"/>
      <rect x="-27" y="-26" width="54" height="30" rx="3" fill="#f3e2c7" stroke="#7a5a3a" stroke-width="2"/>
      <path d="M-33 -24 L0 -54 L33 -24Z" fill="#c8553d" stroke="#7a3a2a" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-6" y="-14" width="12" height="18" rx="2" fill="#7a5a3a"/><rect x="-23" y="-19" width="11" height="11" fill="#9ad3e6" stroke="#7a5a3a" stroke-width="1.5"/><rect x="12" y="-19" width="11" height="11" fill="#9ad3e6" stroke="#7a5a3a" stroke-width="1.5"/>`,
    forge: `<rect x="14" y="-66" width="11" height="28" fill="#6d727d" stroke="#4c5059" stroke-width="1.5"/><circle class="adv-smoke" cx="19" cy="-68" r="5" style="animation-delay:.6s"/><circle class="adv-smoke" cx="20" cy="-68" r="4" style="animation-delay:3s"/>
      <rect x="-32" y="-28" width="64" height="32" rx="3" fill="#8b8f99" stroke="#4c5059" stroke-width="2"/>
      <path d="M-36 -28 L-27 -42 H27 L36 -28Z" fill="#5d626d" stroke="#4c5059" stroke-width="2" stroke-linejoin="round"/>
      <path class="adv-fire" d="M-14 4 V-12 a14 14 0 0 1 28 0 V4Z" fill="#ff8a3d"/><path class="adv-fire" d="M-7 4 V-9 a7 7 0 0 1 14 0 V4Z" fill="#ffd36b"/>
      <path d="M-46 4 h20 l-3 -8 h-14z" fill="#454a55"/><rect x="-42" y="-14" width="12" height="6" rx="2" fill="#5a606c"/>`,
    workshop: `<rect x="-34" y="-26" width="68" height="30" fill="#d9a066" stroke="#8a5a2b" stroke-width="2"/>
      <path d="M-38 -26 L0 -54 L38 -26Z" fill="#a8643a" stroke="#7a431f" stroke-width="2" stroke-linejoin="round"/>
      <g class="adv-spin"><circle cx="0" cy="-36" r="8" fill="#f5d36b" stroke="#a9852f" stroke-width="1.5"/><circle cx="0" cy="-36" r="3" fill="#a8643a"/><path d="M0 -47v4M0 -29v4M-11 -36h4M7 -36h4M-8 -44l3 3M5 -31l3 3M8 -44l-3 3M-5 -31l-3 3" stroke="#f5d36b" stroke-width="3" stroke-linecap="round"/></g>
      <rect x="-9" y="-14" width="18" height="18" rx="1" fill="#6b4423"/><rect x="-28" y="-18" width="12" height="9" fill="#9ad3e6" stroke="#8a5a2b" stroke-width="1.5"/><rect x="16" y="-18" width="12" height="9" fill="#9ad3e6" stroke="#8a5a2b" stroke-width="1.5"/>`,
    tower: `<path d="M-14 4 L-10 -60 H10 L14 4Z" fill="#d6dfea" stroke="#51607a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-12 -18 H12 M-11 -38 H11" stroke="#51607a" stroke-width="1.5"/>
      <rect x="-15" y="-74" width="30" height="16" rx="4" fill="#67e0ee" stroke="#2a7a8a" stroke-width="2"/><rect x="-6" y="-70" width="12" height="8" rx="2" fill="#e8fbff"/>
      <path d="M0 -74 V-86" stroke="#51607a" stroke-width="2"/>
      <g class="adv-spin" style="animation-duration:2.6s"><path d="M-12 -86 H12" stroke="#51607a" stroke-width="2.4" stroke-linecap="round"/><circle cx="-12" cy="-86" r="3.4" fill="#e85d5d"/><circle cx="12" cy="-86" r="3.4" fill="#e85d5d"/></g>
      <g><ellipse cx="22" cy="-70" rx="15" ry="8" fill="#9aa7bb"/><ellipse cx="12" cy="-73" rx="9" ry="7" fill="#aab6c8"/>
      <path class="adv-drop" d="M14 -60v6" stroke="#4aa8e0" stroke-width="2" stroke-linecap="round"/><path class="adv-drop" style="animation-delay:.35s" d="M22 -60v6" stroke="#4aa8e0" stroke-width="2" stroke-linecap="round"/><path class="adv-drop" style="animation-delay:.7s" d="M30 -60v6" stroke="#4aa8e0" stroke-width="2" stroke-linecap="round"/></g>`,
    lab: `<rect x="-19" y="-42" width="38" height="46" rx="4" fill="#bba9ea" stroke="#5b3f9a" stroke-width="2"/>
      <path d="M-27 -40 L0 -82 L27 -40Z" fill="#6b4fb8" stroke="#432d80" stroke-width="2" stroke-linejoin="round"/>
      <path class="adv-twinkle" d="M0 -70l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill="#ffe27a"/>
      <circle cx="0" cy="-20" r="8" fill="#fff6b0" stroke="#5b3f9a" stroke-width="1.5"/><rect x="-6" y="-12" width="12" height="16" rx="2" fill="#5b3f9a"/>
      <g><circle class="adv-bubble" cx="28" cy="-6" r="3" fill="#8ee6a8"/><circle class="adv-bubble" style="animation-delay:.9s" cx="33" cy="-8" r="2.4" fill="#8ee6a8"/><path d="M26 4 v-10 l-5 -8 h14 l-5 8 v10z" fill="#8ee6a8" stroke="#2c8a54" stroke-width="1.5" transform="translate(5 0)"/></g>`,
    guild: `<rect x="-40" y="-30" width="80" height="34" fill="#ead6ac" stroke="#7a5a3a" stroke-width="2"/>
      <path d="M-45 -30 L-30 -48 H30 L45 -30Z" fill="#8a5a3a" stroke="#5c3b22" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-8" y="-15" width="16" height="19" rx="2" fill="#5c3b22"/><rect x="-33" y="-22" width="12" height="10" fill="#9ad3e6" stroke="#7a5a3a" stroke-width="1.5"/><rect x="21" y="-22" width="12" height="10" fill="#9ad3e6" stroke="#7a5a3a" stroke-width="1.5"/>
      <path d="M-34 -46 V-68" stroke="#5c3b22" stroke-width="2"/><path d="M-34 -68 L-16 -62 L-34 -55Z" fill="#d9534f"/><path d="M34 -46 V-68" stroke="#5c3b22" stroke-width="2"/><path d="M34 -68 L16 -62 L34 -55Z" fill="#17776f"/>`,
    academy: `<path d="M-38 -34 L0 -58 L38 -34Z" fill="#f1ece0" stroke="#8d8570" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-36" y="-34" width="72" height="6" fill="#e5dfce" stroke="#8d8570" stroke-width="1.5"/>
      <rect x="-30" y="-28" width="9" height="30" fill="#f7f3e8" stroke="#8d8570" stroke-width="1.5"/><rect x="-12" y="-28" width="9" height="30" fill="#f7f3e8" stroke="#8d8570" stroke-width="1.5"/><rect x="3" y="-28" width="9" height="30" fill="#f7f3e8" stroke="#8d8570" stroke-width="1.5"/><rect x="21" y="-28" width="9" height="30" fill="#f7f3e8" stroke="#8d8570" stroke-width="1.5"/>
      <rect x="-40" y="2" width="80" height="6" fill="#cfc7b0" stroke="#8d8570" stroke-width="1.5"/>
      <path d="M-12 -66 L0 -72 L12 -66 L0 -60Z" fill="#2a2b30"/><path d="M-7 -63 v5 q7 4 14 0 v-5" fill="#3a3c45"/><path d="M12 -66 v8" stroke="#e0a64a" stroke-width="1.6"/>`,
    trophy: `<rect x="-31" y="-26" width="62" height="30" fill="#f6e7b8" stroke="#a9852f" stroke-width="2"/>
      <path d="M-36 -26 L0 -46 L36 -26Z" fill="#d6a93a" stroke="#a9852f" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-8" y="-14" width="16" height="18" rx="2" fill="#a9852f"/><rect x="-26" y="-19" width="11" height="10" fill="#fff6d8" stroke="#a9852f" stroke-width="1.5"/><rect x="15" y="-19" width="11" height="10" fill="#fff6d8" stroke="#a9852f" stroke-width="1.5"/>
      <path d="M-10 -72 h20 v9 a10 10 0 0 1 -20 0z" fill="#ffc83d" stroke="#a9852f" stroke-width="2"/><path d="M-10 -69 h-7 a6 6 0 0 0 7 9M10 -69 h7 a6 6 0 0 1 -7 9" fill="none" stroke="#a9852f" stroke-width="2"/>
      <rect x="-3" y="-54" width="6" height="8" fill="#e0a92a"/><rect x="-9" y="-48" width="18" height="4" rx="1" fill="#a9852f"/>
      <path class="adv-twinkle" d="M20 -70l1.6 3.4 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff"/>`,
    camp: `<path d="M-46 4 L-22 -36 L2 4Z" fill="#e9835b" stroke="#8a3f26" stroke-width="2" stroke-linejoin="round"/><path d="M-22 -36 L-22 4" stroke="#8a3f26" stroke-width="2"/><path d="M-28 4 L-22 -10 L-16 4Z" fill="#6b2f1c"/>
      <rect x="10" y="0" width="26" height="6" rx="3" fill="#7a5233" transform="rotate(-14 23 3)"/><rect x="10" y="0" width="26" height="6" rx="3" fill="#8a5d39" transform="rotate(14 23 3)"/>
      <path class="adv-fire" d="M23 2 C11 -8 18 -22 23 -34 C29 -20 36 -8 23 2Z" fill="#ff8a3d"/><path class="adv-fire" d="M23 2 C17 -4 21 -12 23 -20 C26 -12 30 -4 23 2Z" fill="#ffd36b"/>
      <circle class="adv-bubble" cx="20" cy="-38" r="1.8" fill="#ffd36b"/><circle class="adv-bubble" style="animation-delay:1s" cx="28" cy="-36" r="1.5" fill="#ff8a3d"/>`,
    lighthouse: `<path class="adv-beam" d="M12 -64 L58 -80 L58 -50Z" fill="#fff3a0"/>
      <path d="M-14 4 L-9 -58 H9 L14 4Z" fill="#fff" stroke="#c84a4a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M-12.4 -10 L-11.4 -22 H11.4 L12.4 -10Z" fill="#d9534f"/><path d="M-10.6 -34 L-9.8 -46 H9.8 L10.6 -34Z" fill="#d9534f"/>
      <rect x="-12" y="-70" width="24" height="12" rx="2" fill="#ffe27a" stroke="#a9852f" stroke-width="1.6"/><rect class="adv-twinkle" x="-7" y="-67" width="14" height="6" fill="#fff8c4"/>
      <path d="M-15 -70 L0 -84 L15 -70Z" fill="#c84a4a" stroke="#8a2d2d" stroke-width="1.6" stroke-linejoin="round"/><rect x="-16" y="4" width="32" height="5" rx="2" fill="#9aa2ad"/>`,
  };

  /* ---------- state ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const coarse = matchMedia('(pointer: coarse)').matches;
  let visited = new Set();
  try { visited = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { /* storage unavailable */ }
  let root, bar, stage, svg, meG, flipG, markG, nearBox, hintBox, panel, panelBody, toastEl, progTxt, progBar, fastList;
  let on = false, built = false, mounted = null, raf = 0, last = 0, tt = 0, done = false;
  let portrait = false, S = 1, W = 1000, H = 600;
  const me = { x: SPAWN.x, y: SPAWN.y }; let face = 1, near = null, target = null, pending = null;
  const keys = new Set();
  const T = (x, y) => (portrait ? [y, x * 0.9] : [x, y]);
  const inv = (sx, sy) => (portrait ? [sy / 0.9, sx] : [sx, sy]);
  const find = id => PLACES.find(p => p.id === id);

  /* ---------- overlay shell (built once) ---------- */
  function build() {
    built = true;
    root = document.createElement('div');
    root.className = 'adv'; root.id = 'adv'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Adventure mode');
    root.innerHTML = `
      <div class="adv-bar">
        <div class="adv-brand"><i aria-hidden="true">&#9873;</i><span>Adventure mode</span></div>
        <div class="adv-prog"><span id="advProg">Explored 0 / ${PLACES.length}</span><span class="adv-prog-bar"><b id="advBar"></b></span></div>
        <div class="adv-sp"></div>
        <details class="adv-fast" id="advFast"><summary class="adv-btn">Fast travel</summary><div class="adv-fast-list" id="advFastList"></div></details>
        <button type="button" class="adv-btn" id="advTheme" aria-label="Toggle light or dark theme">Theme</button>
        <button type="button" class="adv-btn primary" id="advExit">Exit to normal view</button>
      </div>
      <div class="adv-stage" id="advStage"></div>
      <div class="adv-prompt" aria-live="polite">
        <div class="adv-hint" id="advHint"></div>
        <div class="adv-near" id="advNear" hidden>
          <div class="adv-near-name"><b id="advNearName"></b><small id="advNearTag"></small></div>
          <button type="button" class="adv-enter" id="advEnter">Enter${coarse ? '' : ' <kbd>E</kbd>'}</button>
        </div>
      </div>
      <div class="adv-panel" id="advPanel" hidden role="dialog" aria-modal="true" aria-labelledby="advPanelTitle">
        <div class="adv-panel-card">
          <div class="adv-panel-bar">
            <button type="button" class="adv-btn" id="advBack">&larr; Back to map</button>
            <b id="advPanelTitle"></b><span class="adv-panel-tag" id="advPanelTag"></span>
          </div>
          <div class="adv-panel-body" id="advPanelBody" tabindex="-1"></div>
        </div>
      </div>
      <div class="adv-toast" id="advToast" role="status" aria-live="polite"></div>`;
    document.body.appendChild(root);
    bar = $('.adv-bar', root); stage = $('#advStage', root); nearBox = $('#advNear', root); hintBox = $('#advHint', root);
    panel = $('#advPanel', root); panelBody = $('#advPanelBody', root); toastEl = $('#advToast', root);
    progTxt = $('#advProg', root); progBar = $('#advBar', root); fastList = $('#advFastList', root);
    hintBox.innerHTML = coarse
      ? 'Tap the map to walk. Tap a building to visit it.'
      : 'Walk with <kbd>&larr;</kbd><kbd>&uarr;</kbd><kbd>&darr;</kbd><kbd>&rarr;</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, or click the map. Step up to a building to enter.';
    fastList.innerHTML = PLACES.map(p => `<button type="button" data-fast="${p.id}"><span>${p.name}</span><small>${p.tag}</small></button>`).join('');

    $('#advExit', root).addEventListener('click', exit);
    $('#advBack', root).addEventListener('click', closePlace);
    $('#advEnter', root).addEventListener('click', () => near && openPlace(near));
    $('#advTheme', root).addEventListener('click', () => { const b = document.getElementById('themeToggle'); if (b) b.click(); });
    fastList.addEventListener('click', e => {
      const b = e.target.closest('[data-fast]'); if (!b) return;
      $('#advFast', root).open = false;
      const p = find(b.dataset.fast), [ox, oy] = offsetFor(p); me.x = p.x + ox; me.y = p.y + oy; target = null; pending = null;
      place(); openPlace(p);
    });
  }

  /* ---------- map ---------- */
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const offsetFor = () => (portrait ? [38, 0] : [0, 34]);

  function curve(a, b, i) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, bend = (i % 2 ? 1 : -1) * len * 0.12;
    return { cx: (a.x + b.x) / 2 - (dy / len) * bend, cy: (a.y + b.y) / 2 + (dx / len) * bend };
  }

  function renderMap() {
    const r = stage.getBoundingClientRect();
    portrait = r.width / Math.max(1, r.height) < 0.9;
    W = portrait ? 600 : 1000; H = portrait ? 900 : 600; S = portrait ? 1.3 : 1;
    const rand = rng(11), parts = [];

    // paths (+ samples so trees keep off them)
    const samples = [];
    const paths = EDGES.map(([ia, ib], i) => {
      const a = find(ia), b = find(ib), c = curve(a, b, i);
      for (let t = 0; t <= 1.001; t += 0.08) samples.push([(1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.cx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.cy + t * t * b.y]);
      const [ax, ay] = T(a.x, a.y), [bx, by] = T(b.x, b.y), [qx, qy] = T(c.cx, c.cy);
      return `<path class="adv-path" d="M${ax} ${ay}Q${qx} ${qy} ${bx} ${by}"/><path class="adv-path2" d="M${ax} ${ay}Q${qx} ${qy} ${bx} ${by}"/>`;
    }).join('');

    // ground patches
    for (let i = 0; i < 16; i++) { const [x, y] = T(60 + rand() * 880, 50 + rand() * 500); parts.push(`<ellipse class="adv-patch" cx="${x}" cy="${y}" rx="${30 + rand() * 40}" ry="${16 + rand() * 20}"/>`); }
    const patches = parts.splice(0).join('');

    // pond
    const [px, py] = T(POND.x, POND.y), prx = portrait ? POND.ry : POND.rx, pry = portrait ? POND.rx * 0.9 : POND.ry;
    const pond = `<ellipse class="adv-water" cx="${px}" cy="${py}" rx="${prx}" ry="${pry}"/><path class="adv-wave" d="M${px - prx * .45} ${py - pry * .15}q8 -5 16 0t16 0M${px + prx * .05} ${py + pry * .3}q8 -5 16 0t16 0"/>`;

    // trees + flowers
    const free = (x, y, pad) => PLACES.every(p => Math.hypot(p.x - x, p.y - y) > 78 + pad) && samples.every(s => Math.hypot(s[0] - x, s[1] - y) > 30 + pad)
      && Math.hypot(VOLCANO.x - x, VOLCANO.y - y) > 85 && Math.hypot(SPAWN.x - x, SPAWN.y - y) > 45 && Math.pow((x - POND.x) / (POND.rx + 22), 2) + Math.pow((y - POND.y) / (POND.ry + 22), 2) > 1;
    const trees = [];
    for (let n = 0; n < 220 && trees.length < 40; n++) { const x = 30 + rand() * 940, y = 50 + rand() * 520; if (free(x, y, 6)) trees.push([x, y, 0.8 + rand() * 0.55]); }
    const tv = trees.map(([x, y, s]) => { const [sx, sy] = T(x, y); return [sx, sy, s]; }).sort((a, b) => a[1] - b[1])
      .map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s * (portrait ? 1.15 : 1)})"><ellipse class="adv-shadow" cx="0" cy="2" rx="12" ry="3.5"/><rect class="adv-trunk" x="-2.5" y="-8" width="5" height="10" rx="1.5"/><circle class="adv-leaf" cx="0" cy="-19" r="11"/><circle class="adv-leaf2" cx="-5" cy="-15" r="7"/><circle class="adv-leaf2" cx="6" cy="-14" r="6.5"/></g>`).join('');
    const cols = ['#fff', '#ffd1e0', '#fff0a0', '#d8c8ff']; let flowers = '';
    for (let n = 0; n < 90 && flowers.length < 2600; n++) { const x = 20 + rand() * 960, y = 40 + rand() * 530; if (rand() < 0.45 && free(x, y, 0)) { const [fx, fy] = T(x, y); flowers += `<circle cx="${fx}" cy="${fy}" r="2.6" fill="${cols[n % 4]}"/><circle cx="${fx}" cy="${fy}" r="1" fill="#f3b63f"/>`; } }

    // volcano
    const [vx, vy] = T(VOLCANO.x, VOLCANO.y);
    const volcano = `<g transform="translate(${vx} ${vy}) scale(${S})"><ellipse class="adv-shadow" cx="0" cy="40" rx="70" ry="8"/>
      <path d="M-64 40 L-15 -48 Q0 -57 15 -48 L64 40Z" fill="#7b6a63" stroke="#4d403b" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M-34 40 L-12 -6 L2 14 L16 -12 L38 40Z" fill="#6a5a53"/>
      <path d="M-15 -48 Q0 -40 15 -48 Q0 -58 -15 -48Z" fill="#ff7a3d"/><path d="M-3 -44 L-11 -12 M4 -44 L11 0" stroke="#ff7a3d" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <circle class="adv-smoke" cx="0" cy="-54" r="9" style="animation-delay:0s"/><circle class="adv-smoke" cx="4" cy="-54" r="8" style="animation-delay:1.7s"/><circle class="adv-smoke" cx="-3" cy="-54" r="7" style="animation-delay:3.3s"/></g>`;

    // clouds
    let clouds = '';
    [[40, 60, 1], [420, 150, .8], [180, 545, .9]].forEach(([x, y, s], i) => { const [cx, cy] = T(x, y); clouds += `<g class="adv-cloud" style="animation-delay:${-i * 22}s"><g transform="translate(${cx} ${cy}) scale(${s * S})"><ellipse cx="0" cy="0" rx="34" ry="11"/><ellipse cx="-14" cy="-7" rx="16" ry="11"/><ellipse cx="10" cy="-9" rx="19" ry="13"/></g></g>`; });

    // places
    const places = PLACES.map(p => {
      const [x, y] = T(p.x, p.y), w = Math.round(p.name.length * 7.3 + 26);
      return `<g class="adv-place${visited.has(p.id) ? ' done' : ''}" data-id="${p.id}" role="button" tabindex="0" aria-label="${p.name}: ${p.tag}" transform="translate(${x} ${y}) scale(${S})">
        <circle class="adv-ring" r="52" cy="-16"/><ellipse class="adv-shadow" cx="0" cy="6" rx="38" ry="7"/>
        <g class="adv-icon">${ICON[p.kind]}</g>
        <g class="adv-flag" transform="translate(${Math.round(w / 2) - 2} 16)"><path d="M0 0V-20" stroke="#5c3b22" stroke-width="2"/><path d="M0 -20L13 -15L0 -10Z" fill="#17776f"/></g>
        <g transform="translate(0 18)"><rect class="adv-lbl-bg" x="${-w / 2}" y="0" width="${w}" height="22" rx="11"/><text class="adv-lbl-t" x="0" y="15">${p.name}</text></g>
        <circle r="56" cy="-18" fill="transparent"/></g>`;
    }).join('');

    // hero
    const hero = `<g id="advMe" class="adv-me"><g id="advFlip"><ellipse class="adv-shadow" cx="0" cy="3" rx="10" ry="3.4"/>
      <g class="adv-me-in"><g class="adv-leg l"><rect x="-6" y="-7" width="5" height="10" rx="2.4" fill="#33384e"/></g><g class="adv-leg r"><rect x="1" y="-7" width="5" height="10" rx="2.4" fill="#33384e"/></g>
      <rect x="-9" y="-22" width="18" height="17" rx="6.5" fill="#17776f" stroke="#0f524c" stroke-width="1.5"/><rect x="5" y="-19" width="6" height="11" rx="3" fill="#e0a64a" stroke="#a5742a" stroke-width="1"/>
      <circle cx="0" cy="-29" r="8.6" fill="#f2c9a0" stroke="#c99a6c" stroke-width="1"/><path d="M-9.2 -30 a9.2 9.2 0 0 1 18.4 0 q-9.2 -6 -18.4 0z" fill="#2b2118"/><circle cx="3.4" cy="-28.5" r="1.3" fill="#2b2118"/></g></g></g>`;

    svg = null;
    stage.innerHTML = `<svg class="adv-map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="overflow:visible" aria-label="Adventure map"><rect class="adv-grass" x="-3000" y="-3000" width="7000" height="7000"/>${patches}${paths}${pond}${flowers}${volcano}${tv}${places}<circle id="advMark" class="adv-mark" r="12"/>${hero}${clouds}</svg>`;
    svg = $('.adv-map', stage); meG = $('#advMe', stage); flipG = $('#advFlip', stage); markG = $('#advMark', stage);
    svg.addEventListener('pointerdown', onPointer);
    svg.addEventListener('keydown', e => {
      const g = e.target.closest && e.target.closest('.adv-place');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); openPlace(find(g.dataset.id)); }
    });
    place(); updateProgress(); updateNear(true);
  }

  /* ---------- movement ---------- */
  function place() {
    const [x, y] = T(me.x, me.y);
    meG.setAttribute('transform', `translate(${x} ${y}) scale(${S * 0.95})`);
    flipG.setAttribute('transform', `scale(${face} 1)`);
  }
  function onPointer(e) {
    if (mounted) return;
    const g = e.target.closest && e.target.closest('.adv-place');
    if (g) { e.preventDefault(); goPlace(find(g.dataset.id)); return; }
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse()), [wx, wy] = inv(q.x, q.y);
    target = { x: Math.max(30, Math.min(970, wx)), y: Math.max(45, Math.min(570, wy)) }; pending = null;
    const [mx, my] = T(target.x, target.y); markG.setAttribute('cx', mx); markG.setAttribute('cy', my);
    markG.classList.remove('show'); void markG.getBoundingClientRect(); markG.classList.add('show');
  }
  function goPlace(p) {
    if (near && near.id === p.id) { openPlace(p); return; }
    const [ox, oy] = offsetFor(p); target = { x: p.x + ox, y: p.y + oy }; pending = p;
  }
  function step(dt) {
    if (mounted) return;
    let ix = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), iy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0), vx = 0, vy = 0, arrived = false;
    if (ix || iy) { const l = Math.hypot(ix, iy); vx = ix / l; vy = iy / l; target = null; pending = null; }
    else if (target) {
      const [mx, my] = T(me.x, me.y), [tx, ty] = T(target.x, target.y), dx = tx - mx, dy = ty - my, d = Math.hypot(dx, dy);
      if (d < 5) { target = null; arrived = true; } else { vx = dx / d; vy = dy / d; }
    }
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const dvx = vx * SPEED * dt, dvy = vy * SPEED * dt, [dx, dy] = portrait ? [dvy / 0.9, dvx] : [dvx, dvy];
      me.x = Math.max(30, Math.min(970, me.x + dx)); me.y = Math.max(45, Math.min(570, me.y + dy));
      if (Math.abs(vx) > 0.15) face = vx < 0 ? -1 : 1;
      place(); updateNear();
    }
    meG.classList.toggle('walking', moving);
    if (arrived) { updateNear(); if (pending) { const p = pending; pending = null; openPlace(p); } }
  }
  function tick(t) {
    if (!on) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    step(dt); raf = requestAnimationFrame(tick);
  }

  /* ---------- proximity + prompt ---------- */
  function updateNear(force) {
    const [mx, my] = T(me.x, me.y); let best = null, bd = 56 * S;
    PLACES.forEach(p => { const [px, py] = T(p.x, p.y), d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = p; } });
    if (!force && best === near) return;
    near = best;
    svg.querySelectorAll('.adv-place').forEach(g => g.classList.toggle('near', !!near && g.dataset.id === near.id));
    nearBox.hidden = !near; hintBox.hidden = !!near;
    if (near) { $('#advNearName', root).textContent = near.name; $('#advNearTag', root).textContent = near.tag; }
  }
  function updateProgress() {
    progTxt.textContent = `Explored ${visited.size} / ${PLACES.length}`; progBar.style.width = (visited.size / PLACES.length * 100) + '%';
    fastList.querySelectorAll('[data-fast]').forEach(b => b.classList.toggle('done', visited.has(b.dataset.fast)));
  }
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 3200); }

  /* ---------- open / close a building ---------- */
  function openPlace(p) {
    if (mounted || !p) return;
    const sec = document.getElementById(p.sec); if (!sec) return;
    keys.clear(); target = null; pending = null; meG.classList.remove('walking');
    const ph = document.createComment('adv:' + p.sec); sec.parentNode.insertBefore(ph, sec);
    mounted = { p, sec, ph };
    panelBody.appendChild(sec); sec.classList.add('adv-mounted');
    if (p.sec === 'contact') { const t = sec.querySelector('.contact-tiny'); if (t && t.dataset.full) t.textContent = t.dataset.full; }
    $('#advPanelTitle', root).textContent = p.name; $('#advPanelTag', root).textContent = p.tag;
    panel.hidden = false; panelBody.scrollTop = 0;
    requestAnimationFrame(() => panelBody.focus({ preventScroll: true }));
    if (!visited.has(p.id)) {
      visited.add(p.id); try { localStorage.setItem(KEY, JSON.stringify([...visited])); } catch (e) { /* ignore */ }
      svg.querySelector(`.adv-place[data-id="${p.id}"]`).classList.add('done'); updateProgress();
      if (visited.size === PLACES.length && !done) { done = true; setTimeout(() => toast('Map complete! You have visited every place. Thanks for exploring.'), 600); }
    }
  }
  function closePlace() {
    if (!mounted) return;
    const { sec, ph } = mounted; mounted = null;
    sec.classList.remove('adv-mounted'); if (ph.parentNode) ph.parentNode.replaceChild(sec, ph);
    panel.hidden = true;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    last = performance.now();
  }

  /* ---------- input ---------- */
  const MAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  function onKeyDown(e) {
    if (!on || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') { e.preventDefault(); if ($('#advFast', root).open) { $('#advFast', root).open = false; return; } mounted ? closePlace() : exit(); return; }
    if (mounted) return;
    const typing = e.target.closest && e.target.closest('button,summary,input,select,textarea,a,.adv-place');
    if (MAP[e.key]) { e.preventDefault(); keys.add(MAP[e.key]); return; }
    if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && near && !typing) { e.preventDefault(); openPlace(near); }
  }
  function onKeyUp(e) { const k = MAP[e.key]; if (k) keys.delete(k); }
  let rz = 0;
  function onResize() { clearTimeout(rz); rz = setTimeout(() => { if (on) { renderMap(); } }, 120); }

  /* ---------- start / exit ---------- */
  function setInert(v) { [...document.body.children].forEach(el => { if (el === root || el.id === 'cursor' || el.id === 'toast' || el.tagName === 'SCRIPT') return; if (v) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
  function start() {
    if (on) return;
    if (!built) build();
    on = true; document.documentElement.classList.add('adv-on');
    const m = document.getElementById('mobileMenu'); if (m) m.classList.remove('open');
    const h = document.getElementById('hamburger'); if (h) h.setAttribute('aria-expanded', 'false');
    setInert(true); root.hidden = false; renderMap();
    addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp); addEventListener('resize', onResize);
    last = performance.now(); raf = requestAnimationFrame(tick);
    toast(visited.size ? 'Welcome back, traveler.' : 'Welcome, traveler. Explore the map.');
    root.setAttribute('tabindex', '-1'); root.focus({ preventScroll: true });
  }
  function exit() {
    if (!on) return;
    closePlace(); on = false; cancelAnimationFrame(raf); keys.clear();
    removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); removeEventListener('resize', onResize);
    root.hidden = true; setInert(false); document.documentElement.classList.remove('adv-on');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    const b = document.querySelector('.adv-link'); if (b) b.focus({ preventScroll: true });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.adv-link'); if (!a) return;
    e.preventDefault(); start();
  });
  if (/[?&]adventure\b/.test(location.search) || location.hash === '#adventure') addEventListener('load', () => setTimeout(start, 300));
  window.Adventure = { start, exit };
})();
