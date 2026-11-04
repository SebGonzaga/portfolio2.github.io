/* Adventure mode: an overworld map where each building is one of the portfolio sections.
 * Walk with arrow keys / WASD (Shift to run), or tap/click the map and the hero walks around
 * obstacles to get there. Entering a building opens the real section (moved, not copied, so tabs,
 * the RAIN viewer and the lab keep working). Visit every place, squash the hidden bugs. */
(() => {
  'use strict';

  const PLACES = [
    { id: 'about',        sec: 'about',        name: 'Home Cottage',   tag: 'About me',            x: 130, y: 470, kind: 'cottage',    blurb: 'An IT student who learns by breaking things first.' },
    { id: 'skills',       sec: 'skills',       name: 'The Forge',      tag: 'Skills',              x: 200, y: 250, kind: 'forge',      blurb: 'The languages and tools I actually reach for.' },
    { id: 'contact',      sec: 'contact',      name: 'Campfire',       tag: 'Contact',             x: 92,  y: 120, kind: 'camp',       blurb: 'Say hello, copy my email, or download my resume.' },
    { id: 'projects',     sec: 'projects',     name: 'Maker Workshop', tag: 'Projects',            x: 390, y: 360, kind: 'workshop',   blurb: 'Things I\u2019ve built, sorted by type.' },
    { id: 'why',          sec: 'why',          name: 'Lighthouse',     tag: 'Why work with me',    x: 340, y: 530, kind: 'lighthouse', blurb: 'How I work with a team and on a hard problem.' },
    { id: 'rain',         sec: 'rain',         name: 'R.A.I.N Tower',  tag: 'Disaster management', x: 610, y: 178, kind: 'tower',      blurb: 'AI-assisted disaster preparedness for Tanauan City.' },
    { id: 'lab',          sec: 'lab',          name: 'Wizard Lab',     tag: 'Experiments',         x: 570, y: 490, kind: 'lab',        blurb: 'Small, unfinished, occasionally weird experiments.' },
    { id: 'experience',   sec: 'experience',   name: 'Guild Hall',     tag: 'Experience',          x: 770, y: 335, kind: 'guild',      blurb: 'IT internships at two city halls, plus hands-on practice.' },
    { id: 'education',    sec: 'education',    name: 'Academy',        tag: 'Education',           x: 905, y: 210, kind: 'academy',    blurb: 'From junior high to PUP, where it all started.' },
    { id: 'certificates', sec: 'certificates', name: 'Trophy Hall',    tag: 'Certificates',        x: 885, y: 480, kind: 'trophy',     blurb: 'Awards, licenses, seminars and campus events.' },
  ];
  const EDGES = [['about', 'skills'], ['skills', 'contact'], ['skills', 'projects'], ['about', 'why'], ['projects', 'why'],
    ['projects', 'lab'], ['projects', 'rain'], ['projects', 'experience'], ['lab', 'experience'], ['rain', 'education'],
    ['experience', 'education'], ['experience', 'certificates']];
  /* page order, used by the "Next stop" button inside a building */
  const TOUR = ['about', 'skills', 'projects', 'rain', 'lab', 'experience', 'education', 'certificates', 'why', 'contact'];
  /* footprint half-width (collision) and roof height (where the ! marker floats) per building */
  const KIND = {
    cottage: { hw: 30, top: 56 }, forge: { hw: 38, top: 70 }, workshop: { hw: 36, top: 54 }, tower: { hw: 16, top: 92 }, lab: { hw: 26, top: 84 },
    guild: { hw: 42, top: 70 }, academy: { hw: 40, top: 74 }, trophy: { hw: 34, top: 74 }, camp: { hw: 40, top: 42 }, lighthouse: { hw: 18, top: 88 },
  };
  const GLOW = { camp: 1, forge: 1, lighthouse: 1 };
  const VOLCANO = { x: 770, y: 110 }, POND = { x: 720, y: 522, rx: 72, ry: 34 }, SPAWN = { x: 255, y: 415 };
  /* hidden bugs: hand-picked corners of the map, nudged to a free spot at build time */
  const BUG_SEEDS = [[60, 560], [905, 85], [500, 575], [40, 330], [480, 70], [950, 345]];
  const BUG_COUNT = BUG_SEEDS.length;
  const KEY = 'advVisited', KEY_BUGS = 'advBugs', KEY_DONE = 'advDone', KEY_SND = 'advSound';
  const SPEED = 235, RUN = 1.6, HR = 6, CELL = 8;

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

  /* windows become CSS-driven so they can light up at night */
  Object.keys(ICON).forEach(k => { ICON[k] = ICON[k].replace(/fill="#9ad3e6"|fill="#fff6d8"/g, 'class="adv-win"'); });

  /* ---------- state ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };
  const visited = new Set((Array.isArray(store.get(KEY)) ? store.get(KEY) : []).filter(id => PLACES.some(p => p.id === id)));
  const found = new Set((Array.isArray(store.get(KEY_BUGS)) ? store.get(KEY_BUGS) : []).filter(i => i >= 0 && i < BUG_COUNT));
  let soundOn = store.get(KEY_SND) === true, actx = null;

  let root, bar, stage, promptEl, svg, heroG, flipG, markG, dustG, depth, nearBox, hintBox, panel, panelCard, panelBody, toastEl, modal;
  let progTxt, progBar, bugTxt, fastList, nextBtn, soundBtn;
  let on = false, built = false, mounted = null, closing = false, modalOpen = false, pendingDone = false, pushed = false;
  let raf = 0, last = 0, tt = 0, rz = 0;
  let portrait = false, S = 1, W = 1000, H = 600, bounds = { x0: 30, x1: 970, y0: 45, y1: 570 };
  let colliders = [], grid = null, cols = 0, rows = 0, bugs = [], bugSpots = null, depthEls = [], depthKeys = [], heroIdx = -1;
  const me = { x: SPAWN.x, y: SPAWN.y };
  let face = 1, near = null, route = null, goal = null, pending = null, stuck = 0, dustAcc = 0;
  const keys = new Set();
  const T = (x, y) => (portrait ? [y, x] : [x, y]);
  const inv = (sx, sy) => (portrait ? [sy, sx] : [sx, sy]);
  const find = id => PLACES.find(p => p.id === id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const doorOf = p => { const [x, y] = T(p.x, p.y); return { x, y: y + 18 * S }; };

  /* ---------- tiny synth sounds (off until the visitor turns them on) ---------- */
  function tone(f, at, dur, type, vol) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* audio unavailable */ }
  }
  const sfx = {
    enter() { tone(392, 0, .12); tone(587, .09, .18); },
    back() { tone(587, 0, .09); tone(392, .08, .16); },
    bug() { tone(880, 0, .07, 'square', .025); tone(1320, .06, .11, 'square', .025); },
    done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .11, .34)); },
    blip() { tone(660, 0, .08); },
  };

  /* ---------- overlay shell (built once) ---------- */
  function build() {
    built = true;
    root = document.createElement('div');
    root.className = 'adv'; root.id = 'adv'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Adventure mode');
    root.innerHTML = `
      <div class="adv-bar">
        <div class="adv-brand"><i aria-hidden="true">&#9873;</i><span>Adventure mode</span></div>
        <div class="adv-stats">
          <div class="adv-prog" title="Places explored"><span id="advProg"></span><span class="adv-prog-bar"><b id="advBar"></b></span></div>
          <div class="adv-bugs" title="Hidden bugs squashed">
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M8 3.6V14M3.4 6.4 1.6 5M3 9H.8M3.6 12l-1.6 1.4M12.6 6.4 14.4 5M13 9h2.2M12.4 12l1.6 1.4" stroke="#2b2118" stroke-width="1.2" stroke-linecap="round" fill="none"/><circle cx="8" cy="9" r="4.8" fill="#e85d5d" stroke="#2b2118" stroke-width="1"/><circle cx="8" cy="3.6" r="2.4" fill="#2b2118"/><circle cx="5.9" cy="8" r=".95" fill="#2b2118"/><circle cx="10.1" cy="8" r=".95" fill="#2b2118"/><circle cx="6.1" cy="11" r=".8" fill="#2b2118"/><circle cx="9.9" cy="11" r=".8" fill="#2b2118"/></svg>
            <span id="advBugTxt"></span>
          </div>
        </div>
        <div class="adv-sp"></div>
        <div class="adv-actions">
        <details class="adv-fast" id="advFast"><summary class="adv-btn">Fast travel</summary><div class="adv-fast-list" id="advFastList"></div></details>
        <button type="button" class="adv-btn" id="advSound" aria-pressed="false">Sound off</button>
        <button type="button" class="adv-btn" id="advTheme" aria-label="Toggle light or dark theme">Theme</button>
        <button type="button" class="adv-btn primary" id="advExit">Exit<span class="adv-long"> to normal view</span></button>
        </div>
      </div>
      <div class="adv-stage" id="advStage"></div>
      <div class="adv-prompt" aria-live="polite">
        <div class="adv-hint" id="advHint"></div>
        <div class="adv-near" id="advNear" hidden>
          <div class="adv-near-name"><span class="adv-near-line"><b id="advNearName"></b><em id="advNearTag"></em></span><small id="advNearBlurb"></small></div>
          <button type="button" class="adv-enter" id="advEnter">Enter${coarse ? '' : ' <kbd>E</kbd>'}</button>
        </div>
      </div>
      <div class="adv-panel" id="advPanel" hidden role="dialog" aria-modal="true" aria-labelledby="advPanelTitle">
        <div class="adv-panel-card" id="advPanelCard">
          <div class="adv-panel-bar">
            <button type="button" class="adv-btn" id="advBack">&larr; Back to map</button>
            <b id="advPanelTitle"></b><span class="adv-panel-tag" id="advPanelTag"></span>
            <span class="adv-sp"></span>
            <button type="button" class="adv-btn" id="advNext" hidden><span>Next<span class="adv-next-name">: <span id="advNextName"></span></span></span><span aria-hidden="true">&rarr;</span></button>
          </div>
          <div class="adv-panel-body" id="advPanelBody" tabindex="-1"></div>
        </div>
      </div>
      <div class="adv-modal" id="advDone" hidden role="dialog" aria-modal="true" aria-labelledby="advDoneTitle">
        <div class="adv-modal-card">
          <svg class="adv-modal-flag" viewBox="0 0 40 48" width="40" height="48" aria-hidden="true"><path d="M8 4V44" stroke="#5c3b22" stroke-width="3" stroke-linecap="round"/><path d="M8 6 L36 15 L8 24Z" fill="#17776f"/></svg>
          <h2 id="advDoneTitle">Map complete</h2>
          <p id="advDoneText"></p>
          <div class="adv-modal-actions">
            <a class="adv-cta primary" id="advDoneResume" href="Sebastian_Gonzaga_Resume.pdf" download>Download resume</a>
            <a class="adv-cta" id="advDoneMail" href="mailto:sebastiangonzaga08@gmail.com">Email me</a>
            <button type="button" class="adv-cta ghost" id="advDoneClose">Keep exploring</button>
          </div>
        </div>
      </div>
      <div class="adv-toast" id="advToast" role="status" aria-live="polite"></div>`;
    document.body.appendChild(root);
    bar = $('.adv-bar', root); stage = $('#advStage', root); promptEl = $('.adv-prompt', root); nearBox = $('#advNear', root); hintBox = $('#advHint', root);
    panel = $('#advPanel', root); panelCard = $('#advPanelCard', root); panelBody = $('#advPanelBody', root); toastEl = $('#advToast', root); modal = $('#advDone', root);
    progTxt = $('#advProg', root); progBar = $('#advBar', root); bugTxt = $('#advBugTxt', root); fastList = $('#advFastList', root);
    nextBtn = $('#advNext', root); soundBtn = $('#advSound', root);
    hintBox.innerHTML = '<span class="adv-hint-keys">Walk with <kbd>&larr;</kbd><kbd>&uarr;</kbd><kbd>&darr;</kbd><kbd>&rarr;</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> (hold <kbd>Shift</kbd> to run), or click the map. Buildings marked ! are unexplored. Walk over a hidden bug to squash it.</span>'
      + '<span class="adv-hint-touch">Tap the map to walk. Tap a building to visit it. Buildings marked ! are unexplored, and bugs are hiding out there.</span>';
    fastList.innerHTML = PLACES.map(p => `<button type="button" data-fast="${p.id}"><span>${p.name}</span><small>${p.tag}</small></button>`).join('')
      + '<button type="button" class="adv-reset" id="advReset">Reset progress</button>';
    syncSound();

    $('#advExit', root).addEventListener('click', requestExit);
    $('#advBack', root).addEventListener('click', requestClose);
    nextBtn.addEventListener('click', () => { const n = find(nextBtn.dataset.id); if (n) swapPlace(n); });
    $('#advEnter', root).addEventListener('click', () => near && openPlace(near));
    $('#advTheme', root).addEventListener('click', () => { const b = document.getElementById('themeToggle'); if (b) b.click(); });
    soundBtn.addEventListener('click', () => { soundOn = !soundOn; store.set(KEY_SND, soundOn); syncSound(); sfx.blip(); });
    $('#advDoneClose', root).addEventListener('click', hideDone);
    let resetArmed = 0;
    fastList.addEventListener('click', e => {
      const rb = e.target.closest('#advReset');
      if (rb) {
        if (!resetArmed) { resetArmed = 1; rb.textContent = 'Click again to confirm'; setTimeout(() => { resetArmed = 0; rb.textContent = 'Reset progress'; }, 3000); return; }
        resetArmed = 0; rb.textContent = 'Reset progress'; $('#advFast', root).open = false; resetProgress(); return;
      }
      const b = e.target.closest('[data-fast]'); if (!b) return;
      $('#advFast', root).open = false;
      const p = find(b.dataset.fast), d = doorOf(p); setHeroView(d.x, d.y); route = null; pending = null;
      openPlace(p);
    });
  }
  function syncSound() { soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off'; soundBtn.setAttribute('aria-pressed', soundOn); }

  /* ---------- map ---------- */
  function curve(a, b, i) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, bend = (i % 2 ? 1 : -1) * len * 0.12;
    return { cx: (a.x + b.x) / 2 - (dy / len) * bend, cy: (a.y + b.y) / 2 + (dx / len) * bend };
  }

  function renderMap() {
    const r = stage.getBoundingClientRect();
    portrait = r.width / Math.max(1, r.height) < 0.9;
    W = portrait ? 600 : 1000; H = portrait ? 1000 : 600; S = portrait ? 1.3 : 1;
    const ca = T(30, 45), cb = T(970, 570);
    bounds = { x0: Math.min(ca[0], cb[0]), x1: Math.max(ca[0], cb[0]), y0: Math.min(ca[1], cb[1]), y1: Math.max(ca[1], cb[1]) };
    const rand = rng(11), samples = [], items = [];
    colliders = [];

    // paths (+ samples so trees keep off them)
    const paths = EDGES.map(([ia, ib], i) => {
      const a = find(ia), b = find(ib), c = curve(a, b, i);
      for (let t = 0; t <= 1.001; t += 0.08) samples.push([(1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.cx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.cy + t * t * b.y]);
      const [ax, ay] = T(a.x, a.y), [bx, by] = T(b.x, b.y), [qx, qy] = T(c.cx, c.cy);
      return `<path class="adv-path" d="M${ax} ${ay}Q${qx} ${qy} ${bx} ${by}"/><path class="adv-path2" d="M${ax} ${ay}Q${qx} ${qy} ${bx} ${by}"/>`;
    }).join('');

    // ground patches
    let patches = '';
    for (let i = 0; i < 16; i++) { const [x, y] = T(60 + rand() * 880, 50 + rand() * 500); patches += `<ellipse class="adv-patch" cx="${x}" cy="${y}" rx="${30 + rand() * 40}" ry="${16 + rand() * 20}"/>`; }

    // pond (water you cannot walk into)
    const [px, py] = T(POND.x, POND.y), prx = portrait ? POND.ry : POND.rx, pry = portrait ? POND.rx : POND.ry;
    colliders.push({ t: 'e', x: px, y: py, rx: prx - 5, ry: pry - 3 });
    const duck = (dx, dy, d, dl) => `<g class="adv-amb" transform="translate(${px + dx * prx} ${py + dy * pry})"><g class="adv-duck" style="--dx:${(prx * 0.34).toFixed(1)}px;--d:${d}s;animation-delay:${dl}s"><ellipse cx="0" cy="0" rx="5.6" ry="3.5" fill="#fff" stroke="#c9d3da" stroke-width=".8"/><circle cx="4.6" cy="-3" r="2.4" fill="#fff" stroke="#c9d3da" stroke-width=".8"/><path d="M6.7 -3 l3 .6 -3 .9z" fill="#f2a43a"/><circle cx="5.2" cy="-3.4" r=".55" fill="#2b2118"/><path d="M-5 -1.5 q-3 -1.6 -4 -4.6 q3.4 .8 4.6 3z" fill="#e9eef2"/></g></g>`;
    const pond = `<ellipse class="adv-water" cx="${px}" cy="${py}" rx="${prx}" ry="${pry}"/><path class="adv-wave" d="M${px - prx * .45} ${py - pry * .15}q8 -5 16 0t16 0M${px + prx * .05} ${py + pry * .3}q8 -5 16 0t16 0"/>${duck(-.22, -.12, 9, 0)}${duck(.24, .3, 12, -4)}`;

    // trees + flowers (positions are world-space so both layouts share the same forest)
    const free = (x, y, pad) => PLACES.every(p => Math.hypot(p.x - x, p.y - y) > 78 + pad) && samples.every(s => Math.hypot(s[0] - x, s[1] - y) > 30 + pad)
      && Math.hypot(VOLCANO.x - x, VOLCANO.y - y) > 85 && Math.hypot(SPAWN.x - x, SPAWN.y - y) > 45 && Math.pow((x - POND.x) / (POND.rx + 22), 2) + Math.pow((y - POND.y) / (POND.ry + 22), 2) > 1;
    const trees = [];
    for (let n = 0; n < 220 && trees.length < 40; n++) { const x = 30 + rand() * 940, y = 50 + rand() * 520; if (free(x, y, 6)) trees.push([x, y, 0.8 + rand() * 0.55]); }
    trees.forEach(([x, y, s]) => {
      const [sx, sy] = T(x, y), k = s * (portrait ? 1.15 : 1);
      colliders.push({ t: 'c', x: sx, y: sy, r: 7.5 * k });
      items.push({ k: sy, h: `<g class="adv-tree" transform="translate(${sx} ${sy}) scale(${k})"><ellipse class="adv-shadow" cx="0" cy="2" rx="12" ry="3.5"/><rect class="adv-trunk" x="-2.5" y="-8" width="5" height="10" rx="1.5"/><circle class="adv-leaf" cx="0" cy="-19" r="11"/><circle class="adv-leaf2" cx="-5" cy="-15" r="7"/><circle class="adv-leaf2" cx="6" cy="-14" r="6.5"/></g>` });
    });
    const cols4 = ['#fff', '#ffd1e0', '#fff0a0', '#d8c8ff']; let flowers = '';
    for (let n = 0; n < 90 && flowers.length < 2600; n++) { const x = 20 + rand() * 960, y = 40 + rand() * 530; if (rand() < 0.45 && free(x, y, 0)) { const [fx, fy] = T(x, y); flowers += `<circle cx="${fx}" cy="${fy}" r="2.6" fill="${cols4[n % 4]}"/><circle cx="${fx}" cy="${fy}" r="1" fill="#f3b63f"/>`; } }

    // grass tufts: one path, cheap texture
    const rt = rng(21); let tufts = '';
    for (let n = 0; n < 90; n++) { const [x, y] = T(25 + rt() * 950, 45 + rt() * 535); tufts += `M${x.toFixed(0)} ${y.toFixed(0)}l-2.4 -5M${x.toFixed(0)} ${y.toFixed(0)}l0 -6.5M${x.toFixed(0)} ${y.toFixed(0)}l2.4 -5`; }

    // volcano (an obstacle too)
    const [vx, vy] = T(VOLCANO.x, VOLCANO.y);
    colliders.push({ t: 'e', x: vx, y: vy + 8 * S, rx: 56 * S, ry: 42 * S });
    items.push({ k: vy + 40 * S, h: `<g class="adv-volcano" transform="translate(${vx} ${vy}) scale(${S})"><ellipse class="adv-shadow" cx="0" cy="40" rx="70" ry="8"/>
      <path d="M-64 40 L-15 -48 Q0 -57 15 -48 L64 40Z" fill="#7b6a63" stroke="#4d403b" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M-34 40 L-12 -6 L2 14 L16 -12 L38 40Z" fill="#6a5a53"/>
      <path d="M-15 -48 Q0 -40 15 -48 Q0 -58 -15 -48Z" fill="#ff7a3d"/><path d="M-3 -44 L-11 -12 M4 -44 L11 0" stroke="#ff7a3d" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <circle class="adv-smoke" cx="0" cy="-54" r="9" style="animation-delay:0s"/><circle class="adv-smoke" cx="4" cy="-54" r="8" style="animation-delay:1.7s"/><circle class="adv-smoke" cx="-3" cy="-54" r="7" style="animation-delay:3.3s"/></g>` });

    // places
    PLACES.forEach(p => {
      const [x, y] = T(p.x, p.y), w = Math.round(p.name.length * 7.3 + 26), kd = KIND[p.kind], lx = (clamp(x, (w / 2) * S + 6, W - (w / 2) * S - 6) - x) / S;
      colliders.push({ t: 'r', x0: x - kd.hw * S, x1: x + kd.hw * S, y0: y - 24 * S, y1: y + 6 * S });
      const glow = GLOW[p.kind] ? '<circle class="adv-glow" r="62" cy="-14" fill="url(#advGlowG)"/>' : '';
      items.push({ k: y + 4 * S, h: `<g class="adv-place${visited.has(p.id) ? ' done' : ''}" data-id="${p.id}" role="button" tabindex="0" aria-label="${p.name}: ${p.tag}. ${p.blurb}" transform="translate(${x} ${y}) scale(${S})">
        <title>${p.name}: ${p.blurb}</title>
        ${glow}<circle class="adv-ring" r="52" cy="-16"/><ellipse class="adv-shadow" cx="0" cy="6" rx="38" ry="7"/>
        <g class="adv-icon">${ICON[p.kind]}</g>
        <g class="adv-flag" transform="translate(${Math.round(w / 2) - 2 + lx} 24)"><path d="M0 0V-20" stroke="#5c3b22" stroke-width="2"/><path d="M0 -20L13 -15L0 -10Z" fill="#17776f"/></g>
        <g class="adv-badge" transform="translate(0 ${-(kd.top + 15)})"><g class="adv-badge-in"><circle r="9" fill="#f3b63f" stroke="#8a5a14" stroke-width="1.6"/><text y="4.6" text-anchor="middle">!</text></g></g>
        <g transform="translate(${lx} 24)"><rect class="adv-lbl-bg" x="${-w / 2}" y="0" width="${w}" height="22" rx="11"/><text class="adv-lbl-t" x="0" y="15">${p.name}</text></g>
        <circle r="56" cy="-18" fill="transparent"/></g>` });
    });
    items.sort((a, b) => a.k - b.k);
    depthKeys = items.map(i => i.k);

    // hidden bugs (ground level, beneath the depth layer)
    if (!bugSpots) bugSpots = pickBugSpots(trees);
    bugs = [];
    let bugHtml = '';
    bugSpots.forEach(([bx, by], i) => {
      if (found.has(i)) return;
      const [x, y] = T(bx, by), k = portrait ? 1.15 : 1;
      bugs.push({ i, x, y });
      bugHtml += `<g class="adv-bug" data-i="${i}" transform="translate(${x} ${y}) scale(${k})"><ellipse class="adv-shadow" cx="0" cy="3.5" rx="6.5" ry="2.2"/><g class="adv-bug-in" style="animation-delay:${(-i * 0.73).toFixed(2)}s">
        <path d="M-5 -3 -9 -6M-5.6 0 -10 0M-5 3 -9 6M5 -3 9 -6M5.6 0 10 0M5 3 9 6" stroke="#2b2118" stroke-width="1.3" stroke-linecap="round" fill="none"/>
        <ellipse cx="0" cy="0" rx="6.4" ry="5.2" fill="#e85d5d" stroke="#2b2118" stroke-width="1.1"/><path d="M0 -5v10" stroke="#2b2118" stroke-width="1"/>
        <circle cx="-2.7" cy="-1.3" r="1.1" fill="#2b2118"/><circle cx="2.7" cy="-1.3" r="1.1" fill="#2b2118"/><circle cx="-2.6" cy="2.2" r=".9" fill="#2b2118"/><circle cx="2.6" cy="2.2" r=".9" fill="#2b2118"/>
        <circle cx="0" cy="-6.4" r="2.5" fill="#2b2118"/><path d="M-1.2 -8.4 -3 -11M1.2 -8.4 3 -11" stroke="#2b2118" stroke-width="1" stroke-linecap="round" fill="none"/></g></g>`;
    });

    // ambient life: butterflies by day, fireflies after dark (CSS toggles them with the theme)
    const ra = rng(5), wing = ['#ff9bb8', '#ffd45e', '#a99bff'];
    let butter = '', flies = '';
    for (let i = 0; i < 3; i++) {
      const [bx, by] = T(120 + ra() * 760, 90 + ra() * 400);
      butter += `<g class="adv-amb" transform="translate(${bx.toFixed(0)} ${by.toFixed(0)})"><g class="adv-bfly" style="--dx:${(ra() * 70 - 35).toFixed(0)}px;--dy:${(ra() * 40 - 20).toFixed(0)}px;--d:${(8 + ra() * 5).toFixed(1)}s;animation-delay:${(-i * 3).toFixed(1)}s"><g class="adv-wings"><ellipse cx="-3" cy="-1" rx="3.4" ry="2.6" fill="${wing[i]}"/><ellipse cx="3" cy="-1" rx="3.4" ry="2.6" fill="${wing[i]}"/></g><rect x="-.6" y="-3" width="1.2" height="6" rx=".6" fill="#2b2118"/></g></g>`;
    }
    for (let i = 0; i < 16; i++) {
      const [fx, fy] = T(40 + ra() * 920, 60 + ra() * 500);
      flies += `<circle class="adv-fly" cx="${fx.toFixed(0)}" cy="${fy.toFixed(0)}" r="2.2" style="--dx:${(ra() * 40 - 20).toFixed(0)}px;--dy:${(ra() * 40 - 20).toFixed(0)}px;--d:${(3 + ra() * 4).toFixed(1)}s;animation-delay:${(-ra() * 6).toFixed(1)}s"/>`;
    }

    // clouds
    let clouds = '';
    [[40, 60, 1], [420, 150, .8], [180, 545, .9]].forEach(([x, y, s], i) => { const [cx, cy] = T(x, y); clouds += `<g class="adv-cloud" style="animation-delay:${-i * 22}s"><g transform="translate(${cx} ${cy}) scale(${s * S})"><ellipse cx="0" cy="0" rx="34" ry="11"/><ellipse cx="-14" cy="-7" rx="16" ry="11"/><ellipse cx="10" cy="-9" rx="19" ry="13"/></g></g>`; });

    // hero
    const hero = `<g id="advMe" class="adv-me"><g id="advFlip"><ellipse class="adv-shadow" cx="0" cy="3" rx="10" ry="3.4"/>
      <g class="adv-me-in"><g class="adv-leg l"><rect x="-6" y="-7" width="5" height="10" rx="2.4" fill="#33384e"/></g><g class="adv-leg r"><rect x="1" y="-7" width="5" height="10" rx="2.4" fill="#33384e"/></g>
      <rect x="-9" y="-22" width="18" height="17" rx="6.5" fill="#17776f" stroke="#0f524c" stroke-width="1.5"/><rect x="5" y="-19" width="6" height="11" rx="3" fill="#e0a64a" stroke="#a5742a" stroke-width="1"/>
      <circle cx="0" cy="-29" r="8.6" fill="#f2c9a0" stroke="#c99a6c" stroke-width="1"/><path d="M-9.2 -30 a9.2 9.2 0 0 1 18.4 0 q-9.2 -6 -18.4 0z" fill="#2b2118"/><circle cx="3.4" cy="-28.5" r="1.3" fill="#2b2118"/></g></g></g>`;

    stage.innerHTML = `<svg class="adv-map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="overflow:visible" aria-label="Adventure map">
      <defs><radialGradient id="advGlowG"><stop offset="0" stop-color="#ffc766" stop-opacity=".75"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient></defs>
      <rect class="adv-grass" x="-3000" y="-3000" width="7000" height="7000"/>${patches}<path class="adv-tuft" d="${tufts}"/>${paths}${pond}${flowers}${butter}
      <g id="advBugs">${bugHtml}</g><g id="advDust"></g><circle id="advMark" class="adv-mark" r="12"/>
      <g id="advDepth">${items.map(i => i.h).join('')}${hero}</g>${clouds}${flies}</svg>`;
    svg = $('.adv-map', stage); depth = $('#advDepth', stage); heroG = $('#advMe', stage); flipG = $('#advFlip', stage); markG = $('#advMark', stage); dustG = $('#advDust', stage);
    depthEls = [...depth.children].filter(el => el !== heroG); heroIdx = -1;
    bugs.forEach(b => { b.el = svg.querySelector(`.adv-bug[data-i="${b.i}"]`); });
    svg.addEventListener('pointerdown', onPointer);
    svg.addEventListener('keydown', e => {
      const g = e.target.closest && e.target.closest('.adv-place');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); openPlace(find(g.dataset.id)); }
    });
    buildGrid(); route = null; goal = null; pending = null;
    unstick(); place(); updateProgress(); updateNear(true);
  }

  function pickBugSpots(trees) {
    const ok = (x, y) => x > 40 && x < 960 && y > 55 && y < 562
      && PLACES.every(p => Math.hypot(p.x - x, p.y - y) > 95) && trees.every(t => Math.hypot(t[0] - x, t[1] - y) > 46)
      && Math.hypot(VOLCANO.x - x, VOLCANO.y - y) > 112 && Math.hypot(SPAWN.x - x, SPAWN.y - y) > 60
      && Math.pow((x - POND.x) / (POND.rx + 34), 2) + Math.pow((y - POND.y) / (POND.ry + 34), 2) > 1;
    return BUG_SEEDS.map(([sx, sy], i) => {
      const rb = rng(100 + i); let x = sx, y = sy;
      for (let n = 0; n < 120; n++) { if (ok(x, y)) return [x, y]; x = sx + (rb() - 0.5) * 120 * (1 + n / 40); y = sy + (rb() - 0.5) * 120 * (1 + n / 40); }
      return [sx, sy];
    });
  }

  /* ---------- collision + pathfinding (all in view space, so both layouts behave) ---------- */
  function blocked(x, y) {
    if (x < bounds.x0 || x > bounds.x1 || y < bounds.y0 || y > bounds.y1) return true;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.t === 'r') { if (x > c.x0 - HR && x < c.x1 + HR && y > c.y0 - HR && y < c.y1 + HR) return true; }
      else if (c.t === 'c') { const dx = x - c.x, dy = y - c.y, rr = c.r + HR; if (dx * dx + dy * dy < rr * rr) return true; }
      else { const nx = (x - c.x) / (c.rx + HR), ny = (y - c.y) / (c.ry + HR); if (nx * nx + ny * ny < 1) return true; }
    }
    return false;
  }
  function buildGrid() {
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL); grid = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid[j * cols + i] = blocked((i + 0.5) * CELL, (j + 0.5) * CELL) ? 1 : 0;
  }
  function nearestFree(x, y) {
    const ci = clamp(Math.floor(x / CELL), 0, cols - 1), cj = clamp(Math.floor(y / CELL), 0, rows - 1);
    if (!grid[cj * cols + ci]) return [ci, cj];
    for (let r = 1; r < 60; r++) {
      let best = null, bd = 1e9;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= cols || j >= rows || grid[j * cols + i]) continue;
        const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i, j]; }
      }
      if (best) return best;
    }
    return null;
  }
  function clear(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
    for (let k = 1; k <= n; k++) if (blocked(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n)) return false;
    return true;
  }
  function findPath(a, b) {
    const s = nearestFree(a.x, a.y), g = nearestFree(b.x, b.y); if (!s || !g) return null;
    const N = cols * rows, gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const hf = [], hi = [];
    const push = (f, i) => { let k = hf.length; hf.push(f); hi.push(i); while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= hf[k]) break; [hf[p], hf[k]] = [hf[k], hf[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
    const pop = () => {
      const top = hi[0], lf = hf.pop(), li = hi.pop();
      if (hf.length) { hf[0] = lf; hi[0] = li; let k = 0; for (;;) { let l = 2 * k + 1, r = l + 1, m = k; if (l < hf.length && hf[l] < hf[m]) m = l; if (r < hf.length && hf[r] < hf[m]) m = r; if (m === k) break; [hf[m], hf[k]] = [hf[k], hf[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } }
      return top;
    };
    const h = (i, j) => { const dx = Math.abs(i - g[0]), dy = Math.abs(j - g[1]); return dx + dy - 0.5858 * Math.min(dx, dy); };
    const s0 = s[1] * cols + s[0], g0 = g[1] * cols + g[0];
    gs[s0] = 0; push(h(s[0], s[1]), s0);
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let ok = false;
    while (hf.length) {
      const cur = pop(); if (closed[cur]) continue; closed[cur] = 1;
      if (cur === g0) { ok = true; break; }
      const ci = cur % cols, cj = (cur / cols) | 0;
      for (const [di, dj] of DIRS) {
        const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= cols || j >= rows) continue;
        const ni = j * cols + i; if (grid[ni] || closed[ni]) continue;
        if (di && dj && (grid[cj * cols + i] || grid[j * cols + ci])) continue; // no cutting corners
        const t = gs[cur] + (di && dj ? 1.4142 : 1);
        if (t < gs[ni]) { gs[ni] = t; came[ni] = cur; push(t + h(i, j), ni); }
      }
    }
    if (!ok) return null;
    const cells = []; for (let c = g0; c !== -1; c = came[c]) cells.push({ x: ((c % cols) + 0.5) * CELL, y: (((c / cols) | 0) + 0.5) * CELL });
    cells.reverse();
    const end = blocked(b.x, b.y) ? cells[cells.length - 1] : { x: b.x, y: b.y };
    const pts = [{ x: a.x, y: a.y }, ...cells.slice(1, -1), end], out = [];
    let i = 0;
    while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !clear(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
    return out;
  }
  function unstick() {
    const [x, y] = T(me.x, me.y); if (!blocked(x, y)) return;
    for (let r = 4; r < 240; r += 4) for (let a = 0; a < 24; a++) {
      const nx = x + Math.cos(a / 24 * 6.2832) * r, ny = y + Math.sin(a / 24 * 6.2832) * r;
      if (!blocked(nx, ny)) { setHeroView(nx, ny); return; }
    }
  }
  function setHeroView(x, y) { const [wx, wy] = inv(x, y); me.x = wx; me.y = wy; if (heroG) { place(); updateNear(); } }

  /* ---------- movement ---------- */
  function place() {
    const [x, y] = T(me.x, me.y);
    heroG.setAttribute('transform', `translate(${x} ${y}) scale(${S * 0.95})`);
    flipG.setAttribute('transform', `scale(${face} 1)`);
    let lo = 0, hi = depthKeys.length;                       // keep the hero in y-order with trees and buildings
    while (lo < hi) { const m = (lo + hi) >> 1; if (depthKeys[m] <= y + 3) lo = m + 1; else hi = m; }
    if (lo !== heroIdx) { heroIdx = lo; depth.insertBefore(heroG, depthEls[lo] || null); }
  }
  function goTo(x, y, p) {
    const [hx, hy] = T(me.x, me.y), path = findPath({ x: hx, y: hy }, { x, y });
    pending = p || null; stuck = 0;
    if (!path || !path.length) { route = null; goal = null; if (p) { const d = doorOf(p); if (Math.hypot(d.x - hx, d.y - hy) < 24) { pending = null; openPlace(p); } } return; }
    route = path; goal = { x, y };
    const e = path[path.length - 1]; markG.setAttribute('cx', e.x); markG.setAttribute('cy', e.y);
    markG.classList.remove('show'); void markG.getBoundingClientRect(); markG.classList.add('show');
  }
  function onPointer(e) {
    if (mounted || closing || modalOpen) return;
    const fm = $('#advFast', root); if (fm.open) fm.open = false;
    const g = e.target.closest && e.target.closest('.adv-place');
    if (g) { e.preventDefault(); goPlace(find(g.dataset.id)); return; }
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    goTo(clamp(q.x, bounds.x0, bounds.x1), clamp(q.y, bounds.y0, bounds.y1), null);
  }
  function goPlace(p) {
    if (near && near.id === p.id) { openPlace(p); return; }
    const d = doorOf(p); goTo(d.x, d.y, p);
  }
  function step(dt) {
    if (mounted || closing || modalOpen) return;
    const ix = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0), iy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    let vx = 0, vy = 0, arrived = false, maxStep = Infinity, [x, y] = T(me.x, me.y);
    if (ix || iy) { const l = Math.hypot(ix, iy); vx = ix / l; vy = iy / l; route = null; goal = null; pending = null; }
    else if (route && route.length) {
      const t = route[0], dx = t.x - x, dy = t.y - y, d = Math.hypot(dx, dy);
      if (d < 4) { route.shift(); if (!route.length) { route = null; goal = null; arrived = true; } } else { vx = dx / d; vy = dy / d; maxStep = d; }
    }
    let moved = 0;
    if (vx || vy) {
      const sp = Math.min(SPEED * (keys.has('run') ? RUN : 1) * dt, maxStep), ox = x, oy = y;
      if (!blocked(x + vx * sp, y)) x += vx * sp;           // slide along obstacles one axis at a time
      if (!blocked(x, y + vy * sp)) y += vy * sp;
      moved = Math.hypot(x - ox, y - oy);
      if (Math.abs(vx) > 0.15) face = vx < 0 ? -1 : 1;
      if (moved > 0.01) { const [wx, wy] = inv(x, y); me.x = wx; me.y = wy; place(); updateNear(); checkBugs(x, y); }
      if (route) { stuck = moved < sp * 0.2 ? stuck + 1 : 0; if (stuck > 14) { stuck = 0; if (goal) goTo(goal.x, goal.y, pending); else route = null; } }
    }
    const walking = moved > 0.01;
    heroG.classList.toggle('walking', walking);
    heroG.classList.toggle('running', walking && keys.has('run'));
    if (walking && !reduced()) { dustAcc += dt; if (dustAcc > (keys.has('run') ? 0.1 : 0.17)) { dustAcc = 0; puff(x - face * 4, y + 2); } }
    if (arrived) { updateNear(); if (pending) { const p = pending; pending = null; openPlace(p); } }
  }
  function tick(t) {
    if (!on) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    step(dt); raf = requestAnimationFrame(tick);
  }

  /* ---------- little effects ---------- */
  function puff(x, y) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('class', 'adv-dust'); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', (2 + Math.random() * 1.4).toFixed(1));
    c.addEventListener('animationend', () => c.remove()); dustG.appendChild(c);
    while (dustG.childElementCount > 14) dustG.firstChild.remove();
  }
  function poof(x, y) {
    if (reduced()) return;
    let h = '';
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + 0.4, d = 16 + (i % 2) * 8; h += `<circle class="adv-spark" cx="0" cy="0" r="${i % 2 ? 2.2 : 3}" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d - 6).toFixed(1)}px"/>`; }
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x} ${y})`); g.innerHTML = h; dustG.appendChild(g); setTimeout(() => g.remove(), 800);
  }
  function checkBugs(x, y) {
    for (const b of bugs) if (!found.has(b.i) && Math.hypot(b.x - x, b.y - y) < 17) squash(b);
  }
  function squash(b) {
    found.add(b.i); store.set(KEY_BUGS, [...found]);
    poof(b.x, b.y); if (b.el) { b.el.classList.add('found'); const el = b.el; setTimeout(() => el.remove(), 450); }
    updateProgress(); sfx.bug();
    toast(found.size === BUG_COUNT ? `All ${BUG_COUNT} bugs squashed. Nothing left to debug.` : `Bug squashed. ${found.size} of ${BUG_COUNT} found.`);
  }

  /* ---------- proximity + prompt + progress ---------- */
  function updateNear(force) {
    const [mx, my] = T(me.x, me.y); let best = null, bd = 56 * S;
    PLACES.forEach(p => { const [px, py] = T(p.x, p.y), d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = p; } });
    if (!force && best === near) return;
    near = best;
    svg.querySelectorAll('.adv-place').forEach(g => g.classList.toggle('near', !!near && g.dataset.id === near.id));
    nearBox.hidden = !near; hintBox.hidden = !!near;
    if (near) { $('#advNearName', root).textContent = near.name; $('#advNearTag', root).textContent = near.tag; $('#advNearBlurb', root).textContent = near.blurb; }
  }
  function updateProgress() {
    progTxt.textContent = `Explored ${visited.size} / ${PLACES.length}`; progBar.style.width = (visited.size / PLACES.length * 100) + '%';
    bugTxt.textContent = `Bugs ${found.size} / ${BUG_COUNT}`;
    fastList.querySelectorAll('[data-fast]').forEach(b => b.classList.toggle('done', visited.has(b.dataset.fast)));
  }
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 3200); }
  function lockMap(v) { [bar, stage, promptEl].forEach(el => (v ? el.setAttribute('inert', '') : el.removeAttribute('inert'))); }

  /* ---------- open / close a building ---------- */
  function placeCenter(p) {
    const g = svg.querySelector(`.adv-place[data-id="${p.id}"]`), r = g ? g.getBoundingClientRect() : stage.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 };
  }
  let lastIris = null;
  function iris(opening, c) {
    if (reduced() || !panelCard.animate) return Promise.resolve();
    const r = panelCard.getBoundingClientRect(), x = c.x - r.left, y = c.y - r.top, R = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 12;
    const a = `circle(0px at ${x}px ${y}px)`, b = `circle(${R}px at ${x}px ${y}px)`;
    const anim = panelCard.animate({ clipPath: opening ? [a, b] : [b, a] },
      { duration: opening ? 560 : 340, easing: opening ? 'cubic-bezier(.16,.84,.44,1)' : 'cubic-bezier(.4,0,.7,.2)', fill: 'both' });
    lastIris = anim;
    return anim.finished.then(() => { if (opening) anim.cancel(); }).catch(() => {});
  }
  function mount(p) {
    const sec = document.getElementById(p.sec); if (!sec) return null;
    const ph = document.createComment('adv:' + p.sec); sec.parentNode.insertBefore(ph, sec);
    panelBody.appendChild(sec); sec.classList.add('adv-mounted');
    if (p.sec === 'contact') { const t = sec.querySelector('.contact-tiny'); if (t && t.dataset.full) t.textContent = t.dataset.full; }
    return { p, sec, ph };
  }
  function unmount(m) { m.sec.classList.remove('adv-mounted'); if (m.ph.parentNode) m.ph.parentNode.replaceChild(m.sec, m.ph); }
  function nextFor(p) {
    const i = TOUR.indexOf(p.id);
    for (let k = 1; k < TOUR.length; k++) { const q = find(TOUR[(i + k) % TOUR.length]); if (!visited.has(q.id)) return q; }
    return i < TOUR.length - 1 ? find(TOUR[i + 1]) : null;
  }
  function setHeader(p) {
    $('#advPanelTitle', root).textContent = p.name; $('#advPanelTag', root).textContent = p.tag;
    const n = nextFor(p); nextBtn.hidden = !n; if (n) { nextBtn.dataset.id = n.id; $('#advNextName', root).textContent = n.name; }
  }
  function markVisited(p) {
    if (visited.has(p.id)) return;
    visited.add(p.id); store.set(KEY, [...visited]);
    const g = svg.querySelector(`.adv-place[data-id="${p.id}"]`); if (g) g.classList.add('done');
    updateProgress();
    if (visited.size === PLACES.length && !store.get(KEY_DONE)) pendingDone = true;
  }
  function openPlace(p) {
    if (mounted || closing || modalOpen || !p) return;
    const m = mount(p); if (!m) return;
    keys.clear(); route = null; goal = null; pending = null; heroG.classList.remove('walking', 'running');
    mounted = m; setHeader(p); panel.hidden = false; lockMap(true); panelBody.scrollTop = 0;
    try { history.pushState({ adv: 2 }, '', '#adventure'); } catch (e) { /* ignore */ }
    iris(true, placeCenter(p));
    requestAnimationFrame(() => panelBody.focus({ preventScroll: true }));
    markVisited(p); sfx.enter();
  }
  function swapPlace(n) {
    if (!mounted || closing || !n) return;
    const old = mounted, m = mount(n); if (!m) return;
    unmount(old); mounted = m;
    const d = doorOf(n); setHeroView(d.x, d.y);
    setHeader(n); panelBody.scrollTop = 0; markVisited(n);
    try { history.replaceState({ adv: 2 }, '', '#adventure'); } catch (e) { /* ignore */ }
    if (!reduced() && panelBody.animate) panelBody.animate({ opacity: [0, 1], transform: ['translateY(12px)', 'none'] }, { duration: 280, easing: 'ease-out' });
    panelBody.focus({ preventScroll: true }); sfx.enter();
  }
  function doClose() {
    if (!mounted || closing) return;
    closing = true; const m = mounted;
    iris(false, placeCenter(m.p)).then(() => {
      unmount(m); mounted = null; closing = false; panel.hidden = true; lockMap(false);
      if (lastIris) { lastIris.cancel(); lastIris = null; }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      last = performance.now(); sfx.back();
      const g = svg.querySelector(`.adv-place[data-id="${m.p.id}"]`); if (g) g.focus({ preventScroll: true });
      if (pendingDone) showDone();
    });
  }
  const histLevel = () => (history.state && history.state.adv) || 0;
  function requestClose() { if (!mounted || closing) return; if (histLevel() === 2) history.back(); else doClose(); }

  /* ---------- finish card ---------- */
  function showDone() {
    pendingDone = false; store.set(KEY_DONE, true); modalOpen = true;
    const rs = document.querySelector('a[href$=".pdf"]'), ml = document.querySelector('a[href^="mailto:"]');
    if (rs) $('#advDoneResume', root).setAttribute('href', rs.getAttribute('href'));
    if (ml) $('#advDoneMail', root).setAttribute('href', ml.getAttribute('href'));
    const left = BUG_COUNT - found.size;
    $('#advDoneText', root).textContent = `You visited all ${PLACES.length} places.` + (left ? ` ${left} of ${BUG_COUNT} hidden bugs are still out there.` : ` You also squashed every hidden bug.`)
      + ' Want the short version? Take my resume, or say hello.';
    modal.hidden = false; lockMap(true); sfx.done();
    requestAnimationFrame(() => $('#advDoneResume', root).focus({ preventScroll: true }));
  }
  function hideDone() { if (!modalOpen) return; modal.hidden = true; modalOpen = false; lockMap(false); last = performance.now(); root.focus({ preventScroll: true }); }

  function resetProgress() {
    visited.clear(); found.clear(); store.del(KEY); store.del(KEY_BUGS); store.del(KEY_DONE); pendingDone = false;
    me.x = SPAWN.x; me.y = SPAWN.y; route = null; goal = null; pending = null;
    renderMap(); toast('Progress reset. The bugs are back.');
  }

  /* ---------- input ---------- */
  const MAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  function onKeyDown(e) {
    if (!on || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      e.preventDefault(); if (closing) return;
      if (modalOpen) { hideDone(); return; }
      const f = $('#advFast', root); if (f.open) { f.open = false; return; }
      mounted ? requestClose() : requestExit(); return;
    }
    if (e.key === 'Shift') { keys.add('run'); return; }
    if (mounted || closing || modalOpen) return;
    const typing = e.target.closest && e.target.closest('button,summary,input,select,textarea,a,.adv-place');
    if (MAP[e.key]) { e.preventDefault(); keys.add(MAP[e.key]); return; }
    if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && near && !typing) { e.preventDefault(); openPlace(near); }
  }
  function onKeyUp(e) { const k = MAP[e.key]; if (k) keys.delete(k); if (e.key === 'Shift') keys.delete('run'); }
  const onBlur = () => keys.clear();
  function onResize() { clearTimeout(rz); rz = setTimeout(() => { if (on) renderMap(); }, 120); }
  function onPop(e) {
    if (!on) return;
    const lvl = (e.state && e.state.adv) || 0;
    if (mounted && lvl < 2) { doClose(); return; }
    if (!mounted && !closing && lvl >= 2) { history.back(); return; }   // forward into a stale building entry
    if (!mounted && !closing && lvl < 1) teardown();
  }

  /* ---------- start / exit ---------- */
  function setInert(v) { [...document.body.children].forEach(el => { if (el === root || el.id === 'cursor' || el.id === 'toast' || el.tagName === 'SCRIPT') return; if (v) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
  function start(auto) {
    if (on) return;
    if (!built) build();
    on = true; document.documentElement.classList.add('adv-on');
    const m = document.getElementById('mobileMenu'); if (m) m.classList.remove('open');
    const h = document.getElementById('hamburger'); if (h) h.setAttribute('aria-expanded', 'false');
    try { if (auto) { history.replaceState({ adv: 1 }, '', location.href); pushed = false; } else { history.pushState({ adv: 1 }, '', '#adventure'); pushed = true; } } catch (e) { pushed = false; }
    setInert(true); root.hidden = false; renderMap();
    addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp); addEventListener('resize', onResize); addEventListener('blur', onBlur); addEventListener('popstate', onPop);
    last = performance.now(); raf = requestAnimationFrame(tick);
    toast(visited.size ? 'Welcome back, traveler.' : 'Welcome, traveler. Explore the map.');
    root.setAttribute('tabindex', '-1'); root.focus({ preventScroll: true });
  }
  function requestExit() {
    if (!on || closing) return;
    if (mounted) { requestClose(); return; }
    if (pushed && histLevel() === 1) history.back(); else teardown();
  }
  function teardown() {
    if (!on) return;
    if (mounted) { unmount(mounted); mounted = null; panel.hidden = true; if (lastIris) { lastIris.cancel(); lastIris = null; } }
    closing = false; modalOpen = false; modal.hidden = true; lockMap(false);
    on = false; cancelAnimationFrame(raf); keys.clear();
    removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); removeEventListener('resize', onResize); removeEventListener('blur', onBlur); removeEventListener('popstate', onPop);
    root.hidden = true; setInert(false); document.documentElement.classList.remove('adv-on');
    if (!pushed && location.hash === '#adventure') { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }
    pushed = false;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    const b = document.querySelector('.adv-link'); if (b) b.focus({ preventScroll: true });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.adv-link'); if (!a) return;
    e.preventDefault(); start(false);
  });
  if (/[?&]adventure\b/.test(location.search) || location.hash === '#adventure') addEventListener('load', () => setTimeout(() => start(true), 300));
  window.Adventure = { start: () => start(false), exit: requestExit };
})();
