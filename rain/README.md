# RAIN: Resilience, Alerts & Information Network (showcase)

A disaster-preparedness web app for **Tanauan City, Batangas**: hazard monitoring, verified alerts, incident reporting, an AI assistant, and an admin command center.

**This is the public demo. No account, no sign-up, no server database.** Open `index.html` (or the deployed site) and click *Open the demo*.

## Try it
- **Resident / Admin switch** in the sidebar lets you inspect both sides of the app.
- Everything you add (reports, alerts, bulletins, mosquito reports) is stored **only in your browser**. *Reset demo data* in the sidebar restores the sample data.
- All alerts, reports, users and "official" figures in the demo are **invented samples**.

## Key pages
| Area | Pages |
|---|---|
| Monitoring | `dashboard`, `weather`, `heat-index`, `air-quality`, `typhoon-map`, `flood-landslide` (+ `flood-landslide-3d`), `mosquito`, `volcano`, `earthquake` |
| Assistance | `virtual-assistance` (AI chat), `emergency` (barangay boundaries, shelters, contacts), `alerts`, `report` |
| Admin | `admin-dashboard`, `admin-alerts`, `admin-incidents`, `admin-analytics`, `admin-users` |

## How the demo works
- `assets/js/demo-db.js`: small in-browser stand-in for the backend (same `from().select().eq()...` style calls, stored in `localStorage`).
- `assets/js/demo-seed.js`: the sample data (times are relative to "now", refreshed every 24 h).
- `assets/js/rain-auth.js`: built-in demo personas instead of sign-in.
- `api/`: optional Vercel serverless functions (live weather proxy, map tiles, hazard lookups, AI assistant). They need `OPENWEATHER_API_KEY` / `GEMINI_API_KEY`; without them the pages fall back to demo readings. On plain static hosting (GitHub Pages) `/api` is unavailable, so live weather and the AI assistant use their built-in demo replies.
- `sw.js` + `assets/js/offline-store.js`: offline support (cached shell and last-known data).

## Tests
`npm test` (Node 20.19+/22+, no dependencies). Two tests currently fail and are data-related, not demo-related: *find_evacuation_centers (no CDRRMO records loaded)* and *every barangay has a matching boundary polygon*.

## Data sources
See `data/SOURCES.md`. Hazard and bulletin content links to the official PAGASA and PHIVOLCS sources; RAIN is a research prototype and not an official product.

*Academic capstone prototype.*
