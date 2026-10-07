# CLAUDE.md

## Git

- Never mention Claude in commit messages: no `Co-Authored-By` trailer, no `Claude-Session` link, no other attribution.

## Project

Vue 3 + TypeScript PWA showing live Singapore bus arrivals. Deployed to GitHub Pages with hash routing.

- `src/lib/arrivals.ts`: live arrivals. Uses LTA DataMall v3 BusArrival via `VITE_ARRIVALS_URL` (the Cloudflare Worker in `worker/`) or the Vite dev proxy; falls back to arrivelah.
- `src/lib/transit.ts`: loads stops/services/routes from `public/data/*.json` at runtime.
- `scripts/fetch-lta-data.mjs`: regenerates `public/data/` from LTA DataMall. Runs weekly in `.github/workflows/update-data.yml`. Don't hand-edit `public/data/`.
- `src/stores/favourites.ts`: the store id `card` and state shape must stay compatible with favourites already saved in users' localStorage.

## Commands

- `npm run dev`: dev server on :8080. Set `LTA_ACCOUNT_KEY` in `.env.local` to proxy LTA locally.
- `npm run build`: type-check (vue-tsc) and build. Run before committing.
- `npm run data:update`: refresh bus data (needs `LTA_ACCOUNT_KEY`).

## Secrets

The LTA AccountKey must never reach the browser bundle: never put it in a `VITE_`-prefixed variable or commit it.
