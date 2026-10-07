/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the bus arrival proxy (see worker/), e.g. https://sg-bussin-api.<you>.workers.dev/arrivals */
  readonly VITE_ARRIVALS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Set in vite.config.ts: true when `npm run dev` proxies /api/arrivals to LTA using LTA_ACCOUNT_KEY. */
declare const __LTA_DEV_PROXY__: boolean;
