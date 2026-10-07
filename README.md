# SG Bussin'

A fast, installable web app for live Singapore bus arrival times.

- **Live arrivals** from LTA DataMall, with crowd level (seats / standing / limited), bus type and destination
- **Pin buses and save stops** to the home screen. They refresh automatically and pause when the tab is hidden
- **Search** by stop code, stop name, road or service number
- **Nearby stops** from your location
- **Full route view** for every service, both directions, with your stop highlighted
- Light and dark mode, works offline once installed (PWA)

[Video demo (original version)](https://youtube.com/shorts/OKFCymNAI9k)

## How it fits together

```
                ┌───────────── weekly GitHub Action ─────────────┐
LTA DataMall ──▶│ scripts/fetch-lta-data.mjs → public/data/*.json │──▶ commit → redeploy Pages
 (BusStops,     └────────────────────────────────────────────────┘
  BusServices,
  BusRoutes)
                                                       ┌──────────────┐
LTA DataMall ◀── worker/ (Cloudflare Worker) ◀─────────│  Vue 3 PWA   │
 (BusArrival v3)  holds AccountKey, adds CORS           │ GitHub Pages │
                                                       └──────────────┘
```

- **Static network data** (5,000+ stops, 500+ services and their routes) lives in `public/data/` and is loaded at runtime, not bundled. The `Update bus data` workflow refreshes it from LTA every Monday, commits only when something changed, and redeploys. New stops, withdrawn services and re-routings show up without anyone touching the code.
- **Live arrivals** go through a tiny Cloudflare Worker (`worker/`). LTA DataMall can't be called from a browser directly: it sends no CORS headers, and the AccountKey would be visible to every visitor. The worker keeps the key secret and caches each stop for 15 s so many users don't multiply upstream calls.
- If no arrivals URL is configured, the app falls back to the community [arrivelah](https://github.com/cheeaun/arrivelah) API so it still works out of the box.

## Development

```sh
npm install
cp .env.example .env.local   # add your LTA_ACCOUNT_KEY to use LTA locally
npm run dev                   # http://localhost:8080
```

With `LTA_ACCOUNT_KEY` in `.env.local`, the Vite dev server proxies `/api/arrivals` to LTA DataMall itself, so you don't need the worker locally.

| Script                | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Dev server                                         |
| `npm run build`       | Type-check (vue-tsc) and production build          |
| `npm run data:update` | Re-download stops/services/routes into `public/data` (needs `LTA_ACCOUNT_KEY`) |

## One-time setup for the self-updating deployment

1. **Get an LTA DataMall key.** It's free: <https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html>
2. **Deploy the arrivals worker.**
   ```sh
   cd worker
   npx wrangler login
   npx wrangler secret put LTA_ACCOUNT_KEY
   npx wrangler deploy        # prints https://sg-bussin-api.<you>.workers.dev
   ```
   Optionally set `ALLOWED_ORIGINS` in `worker/wrangler.toml` to your Pages URL.
3. **Configure the repo** (Settings → Secrets and variables → Actions):
   - Secret `LTA_ACCOUNT_KEY`: your key (used by the weekly data job)
   - Variable `ARRIVALS_URL`: `https://sg-bussin-api.<you>.workers.dev/arrivals`
4. **Switch Pages to Actions.** Settings → Pages → Source: **GitHub Actions**.
5. **Run "Update bus data" once** from the Actions tab. This replaces the seed data (a 2023 snapshot carried over from the old version) with current LTA data.

After that, every push to `main` deploys, and the data job keeps stops and routes current on its own.

> GitHub pauses scheduled workflows in repos with no activity for 60 days. If the data hasn't changed for that long, re-enable the workflow from the Actions tab.

## Tech stack

Vue 3 · Vue Router · Pinia · TypeScript · Vite · vite-plugin-pwa · Fuse.js · Lucide icons · Cloudflare Workers

## Data

Contains information from LTA DataMall, made available under the [Singapore Open Data Licence](https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpenDataLicence.html).

## License

[MIT](LICENSE)

## Contact

Questions or feedback: zhengshaobin00@gmail.com
