/* =========================================================================
   RAIN — RainAuth (showcase version: no accounts, no sign-in)
   Keeps the same synchronous API the pages already use (getUser, isAdmin,
   requireLogin, init) but the "user" is a built-in demo persona. Visitors
   switch between Resident and Administrator in the sidebar to inspect both
   sides of the app. The choice is remembered in this browser only.
   ========================================================================= */
const RainAuth = {
  ROLE_KEY: "rain_demo_role",
  DEMO: {
    resident: { id: "demo-resident", email: "resident@demo.rain", name: "Demo Resident", role: "Community Resident", city: "Sambat" },
    admin: { id: "demo-admin", email: "admin@demo.rain", name: "Demo Administrator", role: "Administrator", city: "Poblacion Barangay 3" },
  },
  getRole() { try { return localStorage.getItem(this.ROLE_KEY) === "admin" ? "admin" : "resident"; } catch (e) { return "resident"; } },
  getUser() { return this.DEMO[this.getRole()]; },
  async init() { return this.getUser(); },
  requireLogin() { return this.getUser(); },
  isAdmin(u) { return !!(u && u.role === "Administrator"); },
  /** Switch persona, then land on that persona's home so the page matches. */
  setRole(role) {
    try { localStorage.setItem(this.ROLE_KEY, role === "admin" ? "admin" : "resident"); } catch (e) { /* ignore */ }
    const page = location.pathname.split("/").pop() || "index.html";
    const toAdmin = role === "admin";
    if (page === "dashboard.html" || page === "admin-dashboard.html") location.href = toAdmin ? "admin-dashboard.html" : "dashboard.html";
    else if (page === "alerts.html" || page === "admin-alerts.html") location.href = toAdmin ? "admin-alerts.html" : "alerts.html";
    else if (/^admin-/.test(page)) location.href = "dashboard.html";
    else location.reload();
  },
  /** Start the demo as a given persona (used by the landing-page buttons). */
  enter(role) {
    try { localStorage.setItem(this.ROLE_KEY, role === "admin" ? "admin" : "resident"); } catch (e) { /* ignore */ }
    location.href = role === "admin" ? "admin-dashboard.html" : "dashboard.html";
  },
  /** Restore the sample data (alerts, reports, etc.) and the Resident persona. */
  resetDemo() {
    try { RainDemoDB.reset(); localStorage.removeItem(this.ROLE_KEY); } catch (e) { /* ignore */ }
    location.href = "dashboard.html";
  },
};
