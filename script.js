/* Sebastian / Digital Lab — behaviour */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
document.documentElement.classList.remove('no-js');
if (reduce) document.documentElement.classList.add('reduced-motion');
gsap.registerPlugin(ScrollTrigger);

/* navbar, progress, mobile menu */
const navbar = $('#navbar');
addEventListener('scroll', () => navbar.classList.toggle('scrolled', scrollY > 40), { passive: true });
gsap.to('#scroll-progress', { width: '100%', ease: 'none', scrollTrigger: { scrub: 0.3, start: 0, end: () => document.documentElement.scrollHeight - innerHeight } });
const burger = $('#hamburger'), mm = $('#mobileMenu');
burger.addEventListener('click', () => { const o = mm.classList.toggle('open'); burger.classList.toggle('active'); burger.setAttribute('aria-expanded', o); });
const closeMenu = () => { mm.classList.remove('open'); burger.classList.remove('active'); burger.setAttribute('aria-expanded', 'false'); };
$$('a', mm).forEach(a => a.addEventListener('click', closeMenu));
addEventListener('keydown', e => { if (e.key === 'Escape' && mm.classList.contains('open')) closeMenu(); });

/* theme toggle (light default) */
(function () {
  const root = document.documentElement, btn = $('#themeToggle'), meta = $('meta[name="theme-color"]');
  const sync = () => { const d = root.getAttribute('data-theme') === 'dark'; btn.setAttribute('aria-pressed', d); btn.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode'); if (meta) meta.content = d ? '#15171C' : '#FAF8F4'; };
  sync();
  btn.addEventListener('click', () => {
    const d = root.getAttribute('data-theme') === 'dark';
    root.classList.add('theme-anim');
    d ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('theme', d ? 'light' : 'dark'); } catch (e) {}
    sync(); setTimeout(() => root.classList.remove('theme-anim'), 350);
  });
})();

/* reveals */
const revealIn = els => els.forEach((el, i) => {
  if (reduce) { el.style.opacity = 1; el.style.transform = 'none'; return; }
  gsap.to(el, { opacity: 1, y: 0, duration: 0.6, delay: (i % 3) * 0.07, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
});
if (!reduce) {
  revealIn($$('.reveal'));
  /* section titles: masked word reveal */
  $$('.section-title').forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(w => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
    gsap.from($$('.w > span', h), { yPercent: 110, duration: 0.7, stagger: 0.045, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 90%' } });
  });
  const t = $('.contact-title');
  if (t) gsap.from($$('.ln > span', t), { yPercent: 110, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 85%' } });
} else revealIn($$('.reveal'));

/* hero entrance (~1.6s) */
if (!reduce) {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-grid', { opacity: 0, duration: 0.5 })
    .from('.hero-meta > *', { y: 10, opacity: 0, stagger: 0.06, duration: 0.35 }, '-=0.2')
    .from('.hero-name .ln > span', { yPercent: 110, duration: 0.7, stagger: 0.1 }, '-=0.1')
    .from('.hero-tags, .hero-desc, .hero-actions', { y: 16, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.35')
    .from('.hero-panel', { y: 20, opacity: 0, duration: 0.5 }, '-=0.4')
    .from('.now-building', { x: -20, opacity: 0, duration: 0.4 }, '-=0.2')
    .add(() => document.body.classList.add('ready'));
  setTimeout(() => document.body.classList.add('ready'), 2600);
} else document.body.classList.add('ready');

/* live status panel */
(function () {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Manila' });
  const tick = () => { $('#clock').textContent = fmt(); $('#stime').textContent = fmt(); };
  tick(); setInterval(tick, 1000);
  const words = ['building', 'debugging', 'experimenting', 'shipping', 'learning'], cur = $('#cur'); let i = 0;
  if (!reduce) setInterval(() => {
    i = (i + 1) % words.length;
    gsap.to(cur, { opacity: 0, y: -4, duration: 0.2, onComplete: () => { cur.textContent = words[i]; gsap.fromTo(cur, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.25 }); } });
  }, 3200);
})();

/* rotating personal line in status.json */
(function () {
  const el = $('#stat'); if (!el || reduce) return;
  const lines = ['still learning, always shipping', 'one project, one bug, one late night at a time', 'breaking things on purpose, to see how they work'];
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % lines.length;
    gsap.to(el, { opacity: 0, y: -4, duration: 0.25, onComplete: () => { el.textContent = lines[i]; gsap.fromTo(el, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.3 }); } });
  }, 7400);
})();

/* about: hover / focus / tap a line to read the note */
(function () {
  const note = $('#codeNote'), lines = $$('.about-visual .code-line[data-note]'); if (!note) return;
  const show = l => { lines.forEach(x => x.classList.toggle('on', x === l)); note.textContent = l ? l.dataset.note : 'hover a line'; };
  lines.forEach(l => { ['pointerenter', 'focus', 'click'].forEach(ev => l.addEventListener(ev, () => show(l))); });
  $('.about-visual').addEventListener('pointerleave', () => show(null));
})();

/* nav scrollspy */
(function () {
  const links = new Map($$('.nav-links a').map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.remove('active')); const a = links.get(e.target.id); if (a) a.classList.add('active');
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

/* tab title easter egg */
(function () {
  const t = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'still building… come back' : t; });
  console.log('%cSebastian / Digital Lab', 'font:600 14px monospace;color:#17776F', '\ncuriosity = true. Found something broken? Tell me, I like those.');
})();

/* cursor (fine pointers only) */
if (fine && !reduce) {
  const c = $('#cursor'), lab = $('#cursorLabel'); document.body.classList.add('has-cursor');
  const xq = gsap.quickTo(c, 'x', { duration: 0.3, ease: 'power3' }), yq = gsap.quickTo(c, 'y', { duration: 0.3, ease: 'power3' });
  addEventListener('pointermove', e => { xq(e.clientX); yq(e.clientY); });
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor],a,button'), l = t && t.dataset.cursor;
    c.className = 'cursor' + (l ? ' label' : t ? ' link' : ''); lab.textContent = l || '';
  });
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.28, duration: 0.4, ease: 'power3.out' }); });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.45)' }));
  });
}

/* projects */
const P = [
  ['AI SYSTEM', 'R.A.I.N', 'Risk Awareness & Intelligent Network', 'AI-assisted disaster preparedness: hazard monitoring, verified alerts and calm guidance in English and Filipino.', ['AI', 'Maps', 'Weather', 'Supabase'], './rain/index.html', 'rain', 8, 'RAIN'],
  ['BRAND SITE', 'Auré', 'Confidence in every detail', 'A luxury jewellery boutique with a collection showcase and an AI concierge stylist.', ['HTML', 'CSS', 'JavaScript', 'OpenAI'], 'https://sebgonzaga.github.io/aure/', 'aure', 42, 'Auré'],
  ['BRAND SITE', 'Lihim Café', 'A hidden garden café', 'A quiet, editorial restaurant site: photo menu, weekend breakfast, location and an assistant.', ['HTML', 'CSS', 'JavaScript', 'Gemini'], 'https://lihimcafe.vercel.app/', 'lihim', 24, 'lihim'],
  ['BRAND SITE', 'KRĀV Cafe Tanauan', 'Satisfy your krāvings', 'A lively cafe site with menu photos, an interior and drive-thru gallery and delivery links.', ['HTML', 'CSS', 'JavaScript', 'Gemini'], './krav-cafe/index.html', 'krav', 28, 'KRĀV'],
  ['STUDY TOOL', 'Inkwell Study Notebook', 'Notes that quiz you back', 'A PDF notebook with drawing, annotation, flashcards and AI-generated quizzes.', ['React', 'Vite', 'Tailwind', 'Supabase'], 'https://note-github-io.vercel.app/', 'ink', 265, 'Ink'],
  ['GAME TOOL', 'Pick & Race', 'Fourteen ways to pick a name', 'Classroom pickers: duck and rocket races, wheels, claw machine, brackets and more.', ['JavaScript', 'PixiJS', 'GSAP', 'Canvas'], 'https://pickanamegames.com/', 'race', 172, 'P&R'],
  ['VISUAL LAB', 'NEXUS AI', 'Visualize intelligence', 'A neural network lab that shows a prompt travelling through the network before a reply.', ['JavaScript', 'Canvas', 'AI'], './nexus-ai/index.html', 'nexus', 285, 'NX'],
  ['API EXPLORER', 'Minecraft Block Explorer', 'Search the whole block set', 'Browse and search Minecraft blocks pulled live from a public API.', ['JavaScript', 'REST API'], './minecraft-explorer/index.html', 'block', 130, 'BLOCKS'],
  ['API EXPLORER', 'Pokédex Live Terminal', 'Live data, terminal feel', 'A terminal-style Pokédex that fetches live Pokémon data and artwork from PokéAPI.', ['JavaScript', 'REST API'], './pokedex/index.html', 'poke', 350, ''],
  ['API EXPLORER', 'SolarCircuit', 'A wander through the solar system', 'A space-themed explorer with animated, API-driven planet data.', ['JavaScript', 'anime.js', 'REST API'], './solarcircuit/index.html', 'solar', 35, '( solar )'],
  ['COURSEWORK', 'Inventory Management System', '', 'Track stock, updates and records with JSON storage instead of a full database.', ['Python', 'JSON'], '', 'concept', 215, '{ }'],
  ['COURSEWORK', 'Step Tracking Web App', '', 'A concept app for logging daily steps and reviewing progress.', ['HTML', 'CSS', 'JavaScript'], '', 'concept', 215, '+1'],
  ['COURSEWORK', 'OOP Applications', '', 'Java, C# and C++ projects built around inheritance, encapsulation and polymorphism.', ['Java', 'C#', 'C++'], '', 'concept', 215, 'class'],
];
const GROUPS = [
  ['all', 'All', null],
  ['ai', 'AI & Systems', ['R.A.I.N', 'NEXUS AI', 'Inkwell Study Notebook']],
  ['brand', 'Brand Sites', ['Auré', 'Lihim Café', 'KRĀV Cafe Tanauan']],
  ['tools', 'Tools & Explorers', ['Pick & Race', 'Minecraft Block Explorer', 'Pokédex Live Terminal', 'SolarCircuit']],
  ['school', 'Coursework', ['Inventory Management System', 'Step Tracking Web App', 'OOP Applications']],
];
const track = $('#showTrack'), tabs = $('#projTabs');
const card = (p, i) => {
  const n = String(i + 1).padStart(2, '0'), [cat, name, sub, desc, tech, href, st, h, mark, src] = p;
  return `<article class="panel pcard" data-style="${st}" data-name="${name}" style="--h:${h}">
  ${href ? `<a class="pv" href="${href}" target="_blank" rel="noopener" tabindex="-1" aria-label="Open ${name}" data-cursor="OPEN ↗">` : '<div class="pv">'}<div class="pv-art"><b>${mark}</b></div><span class="pv-tag">${cat}</span><span class="pv-n">${n}</span>${href ? '</a>' : '</div>'}
  <div class="pi"><h3>${name}</h3>${sub ? `<p class="pi-sub">${sub}</p>` : ''}
  <p class="pi-desc">${desc}</p><ul class="pi-tech">${tech.map(t => `<li>${t}</li>`).join('')}</ul>
  <div class="pi-actions">${href ? `<a class="pi-open" href="${href}" target="_blank" rel="noopener" data-cursor="OPEN ↗">OPEN <span>↗</span></a>` : `<span class="pi-open off">IN THE ARCHIVE</span>`}${src ? `<a class="pi-src" href="${src}" target="_blank" rel="noopener">SOURCE ↗</a>` : ''}</div></div></article>`;
};
const cards = P.map(card);
function showGroup(id) {
  const g = GROUPS.find(x => x[0] === id);
  $$('button', tabs).forEach(b => { const on = b.dataset.g === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  track.innerHTML = P.map((p, i) => (!g[2] || g[2].includes(p[1])) ? cards[i] : '').join('');
  if (!reduce) gsap.from($$('.pcard', track), { opacity: 0, y: 18, duration: 0.45, stagger: 0.06, ease: 'power2.out', clearProps: 'all' });
  ScrollTrigger.refresh();
}
tabs.innerHTML = GROUPS.map(g => `<button type="button" role="tab" data-g="${g[0]}" aria-selected="false">${g[1]}<em>${g[2] ? g[2].length : P.length}</em></button>`).join('');
tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showGroup(b.dataset.g); });
if (fine) track.addEventListener('pointermove', e => {
  const pv = e.target.closest('.pv'); if (!pv) return; const r = pv.getBoundingClientRect();
  pv.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5) * 2); pv.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5) * 2);
});
showGroup('all');

/* lab */
const col = {};
function springDots(c, ctx) {
  const W = c.width, H = c.height; let m = { x: W / 2, y: H / 2 }, raf;
  const d = [...Array(44)].map((_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, a: i * 2.4, r: 10 + i * 3.4 }));
  const mv = e => { const b = c.getBoundingClientRect(); m.x = (e.clientX - b.left) * W / b.width; m.y = (e.clientY - b.top) * H / b.height; };
  c.addEventListener('pointermove', mv);
  (function f(t) {
    ctx.clearRect(0, 0, W, H);
    d.forEach(p => { p.vx = (p.vx + (m.x + Math.cos(p.a + t / 900) * p.r - p.x) * 0.06) * 0.82; p.vy = (p.vy + (m.y + Math.sin(p.a + t / 900) * p.r - p.y) * 0.06) * 0.82; p.x += p.vx; p.y += p.vy; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, 7); ctx.fillStyle = col.a; ctx.fill(); });
    raf = requestAnimationFrame(f);
  })(0);
  return () => { cancelAnimationFrame(raf); c.removeEventListener('pointermove', mv); };
}
function gravityDrop(c, ctx) {
  const W = c.width, H = c.height, b = []; let raf;
  const add = e => { const r = c.getBoundingClientRect(); b.push({ x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, vx: (Math.random() - 0.5) * 4, vy: 0, r: 8 + Math.random() * 12 }); if (b.length > 60) b.shift(); };
  c.addEventListener('pointerdown', add);
  (function f() {
    ctx.clearRect(0, 0, W, H);
    b.forEach(p => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; if (p.y + p.r > H) { p.y = H - p.r; p.vy *= -0.72; p.vx *= 0.98; } if (p.x < p.r || p.x > W - p.r) { p.vx *= -1; p.x = Math.min(W - p.r, Math.max(p.r, p.x)); } ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.globalAlpha = 0.75; ctx.fillStyle = col.a; ctx.fill(); ctx.globalAlpha = 1; });
    raf = requestAnimationFrame(f);
  })();
  return () => { cancelAnimationFrame(raf); c.removeEventListener('pointerdown', add); };
}
function neuralPulse(c, ctx) {
  const W = c.width, H = c.height, L = [4, 6, 6, 3], N = []; let t = 0, raf;
  L.forEach((k, i) => { for (let j = 0; j < k; j++) N.push({ l: i, x: W * (0.12 + i * 0.25), y: H * ((j + 1) / (k + 1)) }); });
  const go = () => { t = 0; }; c.addEventListener('pointerdown', go);
  (function f() {
    ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1; ctx.strokeStyle = col.line;
    N.forEach(a => N.forEach(b => { if (b.l === a.l + 1) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }));
    N.forEach(n => { const g = t < 0 ? 0 : Math.max(0, 1 - Math.abs(t - n.l)); ctx.beginPath(); ctx.arc(n.x, n.y, 7 + g * 6, 0, 7); ctx.globalAlpha = 0.35 + 0.65 * g; ctx.fillStyle = g > 0.05 ? col.b : col.a; ctx.fill(); ctx.globalAlpha = 1; });
    if (t >= 0) { t += 0.035; if (t > L.length + 0.5) t = -1; }
    raf = requestAnimationFrame(f);
  })();
  return () => { cancelAnimationFrame(raf); c.removeEventListener('pointerdown', go); };
}
function flowField(c, ctx) {
  const W = c.width, H = c.height; let raf, m = { x: -999, y: -999 };
  const ps = [...Array(220)].map(() => ({ x: Math.random() * W, y: Math.random() * H, k: Math.random() < 0.5 }));
  const mv = e => { const b = c.getBoundingClientRect(); m.x = (e.clientX - b.left) * W / b.width; m.y = (e.clientY - b.top) * H / b.height; };
  const scatter = () => ps.forEach(p => { p.x = Math.random() * W; p.y = Math.random() * H; });
  c.addEventListener('pointermove', mv); c.addEventListener('pointerdown', scatter);
  (function f(t) {
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    ps.forEach(p => {
      let a = Math.sin(p.x * 0.008 + t * 0.0004) * Math.cos(p.y * 0.01 - t * 0.0003) * 6.283;
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
      if (d < 120) a = Math.atan2(dy, dx) * (1 - d / 120) + a * (d / 120);
      p.x += Math.cos(a) * 1.6; p.y += Math.sin(a) * 1.6;
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.x = Math.random() * W; p.y = Math.random() * H; }
      ctx.fillStyle = p.k ? col.a : col.b; ctx.fillRect(p.x, p.y, 2, 2);
    });
    raf = requestAnimationFrame(f);
  })(0);
  return () => { cancelAnimationFrame(raf); c.removeEventListener('pointermove', mv); c.removeEventListener('pointerdown', scatter); };
}
function magnetGrid(c, ctx) {
  const W = c.width, H = c.height, S = 30; let raf, m = { x: -999, y: -999 }, wave = null;
  const d = []; for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) d.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
  const mv = e => { const b = c.getBoundingClientRect(); m.x = (e.clientX - b.left) * W / b.width; m.y = (e.clientY - b.top) * H / b.height; };
  const boom = e => { mv(e); wave = { x: m.x, y: m.y, r: 0 }; };
  c.addEventListener('pointermove', mv); c.addEventListener('pointerdown', boom);
  (function f() {
    ctx.clearRect(0, 0, W, H);
    if (wave) { wave.r += 7; if (wave.r > 520) wave = null; }
    d.forEach(p => {
      let fx = (p.hx - p.x) * 0.08, fy = (p.hy - p.y) * 0.08;
      const dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy) || 1;
      if (dist < 110) { const k = (1 - dist / 110) * 3.2; fx += dx / dist * k; fy += dy / dist * k; }
      if (wave) { const wd = Math.hypot(p.x - wave.x, p.y - wave.y); if (Math.abs(wd - wave.r) < 22) { fx += (p.x - wave.x) / (wd || 1) * 4; fy += (p.y - wave.y) / (wd || 1) * 4; } }
      p.vx = (p.vx + fx) * 0.82; p.vy = (p.vy + fy) * 0.82; p.x += p.vx; p.y += p.vy;
      const off = Math.hypot(p.x - p.hx, p.y - p.hy), g = Math.min(1, off / 40);
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 + g * 3, 0, 7); ctx.fillStyle = g > 0.15 ? col.b : col.line; ctx.fill();
    });
    raf = requestAnimationFrame(f);
  })();
  return () => { cancelAnimationFrame(raf); c.removeEventListener('pointermove', mv); c.removeEventListener('pointerdown', boom); };
}
function orbitWell(c, ctx) {
  const W = c.width, H = c.height, K = 2.4; let raf; const wells = [{ x: W / 2, y: H / 2 }];
  const ps = [...Array(140)].map(() => { const a = Math.random() * 6.283, r = 50 + Math.random() * 150, v = Math.sqrt(K) * (0.8 + Math.random() * 0.4); return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: -Math.sin(a) * v, vy: Math.cos(a) * v }; });
  const add = e => { const b = c.getBoundingClientRect(); wells.push({ x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }); if (wells.length > 3) wells.shift(); };
  c.addEventListener('pointerdown', add);
  (function f() {
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    ps.forEach(p => {
      wells.forEach(w => { const dx = w.x - p.x, dy = w.y - p.y, d = Math.max(14, Math.hypot(dx, dy)), a = K / wells.length / d; p.vx += dx / d * a; p.vy += dy / d * a; });
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = Math.min(W, Math.max(0, p.x)); }
      if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = Math.min(H, Math.max(0, p.y)); }
      ctx.fillStyle = col.a; ctx.fillRect(p.x, p.y, 2.2, 2.2);
    });
    wells.forEach(w => { ctx.beginPath(); ctx.arc(w.x, w.y, 6, 0, 7); ctx.strokeStyle = col.b; ctx.lineWidth = 2; ctx.stroke(); });
    raf = requestAnimationFrame(f);
  })();
  return () => { cancelAnimationFrame(raf); c.removeEventListener('pointerdown', add); };
}
const LAB = [
  ['001', 'Spring Dots', 'Forty-four dots chasing your cursor on springs.', 'move your cursor over the canvas', springDots],
  ['002', 'Gravity Drop', 'Click to drop things. Watch them bounce.', 'click anywhere to drop a ball', gravityDrop],
  ['003', 'Neural Pulse', 'A signal travelling a tiny network, layer by layer.', 'click to send another pulse', neuralPulse],
  ['004', 'Flow Field', 'Two hundred particles riding an invisible current. Your cursor gets in the way.', 'move to disturb the flow · click to scatter', flowField, 'PROTOTYPE'],
  ['005', 'Magnet Grid', 'A grid of dots that can\'t decide whether to stay or leave.', 'move across the grid · click for a shockwave', magnetGrid, 'EXPERIMENTAL'],
  ['006', 'Orbit Well', 'Tiny physics: drop gravity wells and watch things fall in circles.', 'click to add a gravity well · max three', orbitWell, 'STILL TUNING'],
];
$('#labGrid').innerHTML = LAB.map(l => `<article class="lab-card reveal"><p class="lab-code">LAB / ${l[0]}</p><h3>${l[1]}</h3><p>${l[2]}</p><p class="lab-status"><i></i>STATUS: ${l[5] || 'EXPERIMENTAL'}</p><button type="button" class="btn btn-ghost run" data-lab="${l[0]}" data-cursor="RUN"><span>RUN</span></button></article>`).join('');
revealIn($$('#labGrid .lab-card'));
(function () {
  const modal = $('#labModal'), cv = $('#labCanvas'), ctx = cv.getContext('2d'); let stop = null, opener = null;
  const close = () => { if (stop) stop(); stop = null; modal.hidden = true; document.body.style.overflow = ''; if (opener) opener.focus(); };
  $('#labGrid').addEventListener('click', e => {
    const b = e.target.closest('.run'); if (!b) return; const l = LAB.find(x => x[0] === b.dataset.lab); opener = b;
    const s = getComputedStyle(document.documentElement); col.a = s.getPropertyValue('--blue').trim(); col.b = s.getPropertyValue('--cyan').trim(); col.line = s.getPropertyValue('--border-strong').trim();
    $('#labCode').textContent = 'LAB / ' + l[0]; $('#labTitle').textContent = l[1]; $('#labHint').textContent = l[3];
    modal.hidden = false; document.body.style.overflow = 'hidden'; stop = l[4](cv, ctx); $('#labClose').focus();
  });
  $('#labClose').addEventListener('click', close);
  modal.addEventListener('pointerdown', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => { if (modal.hidden) return; if (e.key === 'Escape') close(); else if (e.key === 'Tab') { e.preventDefault(); $('#labClose').focus(); } });
})();

/* contact finale: rule draws, buttons pop, tiny line types out */
(function () {
  const wrap = $('.contact-wrap'); if (!wrap) return;
  const tiny = $('.contact-tiny'), full = tiny.textContent;
  if (!reduce) {
    tiny.textContent = '';
    const pops = $$('.contact-actions .btn, .copy-mail, .social-icon');
    gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 60%', once: true } })
      .to('.contact-rule', { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.5)
      .from(pops, { scale: 0.85, duration: 0.5, stagger: 0.06, ease: 'back.out(2.4)', clearProps: 'scale' }, 0.9)
      .to({ n: 0 }, { n: full.length, duration: 1.4, ease: 'none', onUpdate() { tiny.textContent = full.slice(0, Math.round(this.targets()[0].n)); } }, 1.2);
  }
  const btn = $('#copyMail'), toast = $('#toast'); let tt;
  const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2000); };
  btn.addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(btn.dataset.email); say('Email copied. Say hi.'); }
    catch (err) { say(btn.dataset.email); }
    if (reduce) return;
    const r = btn.getBoundingClientRect(), cx = e.clientX || r.left + r.width / 2, cy = e.clientY || r.top + r.height / 2;
    for (let i = 0; i < 12; i++) {
      const d = document.createElement('i'); d.className = 'dotburst'; d.style.left = cx + 'px'; d.style.top = cy + 'px'; document.body.appendChild(d);
      const a = (i / 12) * 6.283, v = 40 + Math.random() * 50;
      gsap.to(d, { x: Math.cos(a) * v, y: Math.sin(a) * v, opacity: 0, scale: 0.3, duration: 0.7, ease: 'power2.out', onComplete: () => d.remove() });
    }
  });
})();

/* pinned showcase measures fonts + layout; re-measure once they settle */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());

/* certificates: filter + lightbox */
(() => {
  const rows = [...document.querySelectorAll('.cert-row')], lb = document.getElementById('lb');
  if (!lb) return;
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c));
    rows.forEach(r => r.hidden = c.dataset.f !== 'All' && r.dataset.type !== c.dataset.f);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }));
  const close = () => { lb.hidden = true; };
  document.querySelectorAll('.cert-view,.moment').forEach(b0 => b0.addEventListener('click', e => {
    const b = e.currentTarget; lb.querySelector('img').src = b.dataset.img; lb.querySelector('img').alt = b.dataset.cap; lb.querySelector('p').textContent = b.dataset.cap; lb.hidden = false;
  }));
  lb.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
