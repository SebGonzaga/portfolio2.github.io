/* =========================================================================
   RAIN — showcase data layer (in-browser stand-in for the backend)
   --------------------------------------------------------------------------
   This public demo needs no account and talks to no server database.
   `sb` mimics the small slice of the supabase-js API the pages use
   (from/select/insert/update/delete + filters, auth.getUser/getSession,
   storage), but stores everything in this browser's localStorage, seeded
   with sample data from demo-seed.js. Visitors can file reports, post
   alerts as the admin, verify mosquito reports, etc.; "Reset demo" in the
   sidebar restores the sample data. Nothing leaves the browser.
   ========================================================================= */
const RainDemoDB = (() => {
  const KEY = "rain_demo_db_v1", TTL = 24 * 36e5;
  let db = null;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage full: keep in memory */ } };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + Math.random().toString(16).slice(2));
  function ensure() {
    if (db) return db;
    db = load();
    if (!db || !db.seededAt || Date.now() - db.seededAt > TTL) { db = { seededAt: Date.now(), tables: RAIN_SEED(Date.now()) }; save(); }
    return db;
  }
  const table = (n) => (ensure().tables[n] = ensure().tables[n] || []);
  const VIEWS = { mosquito_reports_public: () => table("mosquito_reports").filter((r) => r.status === "verified") };
  const rows = (n) => (VIEWS[n] ? VIEWS[n]() : table(n));
  const cmp = (a, b) => (a == null ? -1 : b == null ? 1 : a < b ? -1 : a > b ? 1 : 0);
  const pick = (r, cols) => { if (!cols || cols === "*") return { ...r }; const o = {}; cols.split(",").map((s) => s.trim()).filter(Boolean).forEach((c) => { if (c in r) o[c] = r[c]; }); return o; };

  class Q {
    constructor(name) { this.n = name; this.op = "select"; this.f = []; this.ord = null; this.lim = null; this.rg = null; this.cols = "*"; this.one = false; this.payload = null; }
    select(c) { this.cols = c || "*"; return this; }
    insert(p) { this.op = "insert"; this.payload = p; return this; }
    update(p) { this.op = "update"; this.payload = p; return this; }
    delete() { this.op = "delete"; return this; }
    _f(fn) { this.f.push(fn); return this; }
    eq(c, v) { return this._f((r) => r[c] === v); }
    neq(c, v) { return this._f((r) => r[c] !== v); }
    gt(c, v) { return this._f((r) => r[c] > v); }
    gte(c, v) { return this._f((r) => r[c] >= v); }
    lt(c, v) { return this._f((r) => r[c] < v); }
    lte(c, v) { return this._f((r) => r[c] <= v); }
    in(c, a) { return this._f((r) => a.includes(r[c])); }
    is(c, v) { return this._f((r) => (v === null ? r[c] == null : r[c] === v)); }
    not(c, op, v) { return this._f((r) => (op === "is" ? !(v === null ? r[c] == null : r[c] === v) : r[c] !== v)); }
    order(c, o) { this.ord = [c, !(o && o.ascending === false)]; return this; }
    limit(n) { this.lim = n; return this; }
    range(a, b) { this.rg = [a, b]; return this; }
    single() { this.one = true; return this; }
    maybeSingle() { this.one = true; return this; }
    then(res, rej) { return Promise.resolve(this._run()).then(res, rej); }
    _run() {
      try {
        const all = rows(this.n), hit = (r) => this.f.every((fn) => fn(r));
        if (this.op === "insert") {
          const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p) => ({ id: uid(), created_at: new Date().toISOString(), status: "pending", ...p }));
          list.forEach((r) => table(this.n).unshift(r)); save();
          return { data: this.one ? list[0] : list, error: null };
        }
        if (this.op === "update") {
          const t = all.filter(hit); t.forEach((r) => Object.assign(r, this.payload, { updated_at: new Date().toISOString() })); save();
          return { data: this.one ? t[0] || null : t, error: null };
        }
        if (this.op === "delete") { const t = table(this.n); const keep = t.filter((r) => !hit(r)); t.length = 0; t.push(...keep); save(); return { data: null, error: null }; }
        let out = all.filter(hit);
        if (this.ord) { const [c, asc] = this.ord; out = out.slice().sort((a, b) => (asc ? 1 : -1) * cmp(a[c], b[c])); }
        if (this.rg) out = out.slice(this.rg[0], this.rg[1] + 1);
        if (this.lim != null) out = out.slice(0, this.lim);
        const emb = /(\w+)\(([^)]*)\)/.exec(this.cols);
        const base = this.cols.replace(/,?\s*\w+\([^)]*\)/, "");
        out = out.map((r) => {
          const o = pick(r, base || "*");
          if (emb) o[emb[1]] = pick(table(emb[1]).find((p) => p.id === r.reporter_id) || {}, emb[2]);
          return o;
        });
        if (this.one) return out.length ? { data: out[0], error: null } : { data: null, error: { code: "PGRST116", message: "No rows" } };
        return { data: out, error: null };
      } catch (e) { return { data: null, error: { message: String(e && e.message || e) } }; }
    }
  }
  return { from: (n) => new Q(n), reset() { localStorage.removeItem(KEY); db = null; ensure(); }, ensure };
})();

const sb = {
  from: (n) => RainDemoDB.from(n),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: (typeof RainAuth !== "undefined" && RainAuth.getUser()) || null }, error: null }),
  },
  storage: { from: () => ({
    // Photos stay in the browser as data URLs; nothing is uploaded.
    upload: async (path, file) => new Promise((ok) => { const r = new FileReader(); r.onload = () => { (sb._files = sb._files || {})[path] = r.result; ok({ data: { path }, error: null }); }; r.onerror = () => ok({ error: { message: "read failed" } }); r.readAsDataURL(file); }),
    getPublicUrl: (path) => ({ data: { publicUrl: (sb._files || {})[path] || "" } }),
  }) },
};
