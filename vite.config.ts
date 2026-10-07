import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command, mode }) => {
  // Not VITE_-prefixed on purpose: the key stays on the dev server and never reaches the bundle.
  const { LTA_ACCOUNT_KEY } = loadEnv(mode, process.cwd(), "");
  const devProxy = command === "serve" && Boolean(LTA_ACCOUNT_KEY);

  return {
    // Relative base + hash routing lets the same build run at / or at GitHub Pages' /<repo>/.
    base: "./",

    define: {
      __LTA_DEV_PROXY__: JSON.stringify(devProxy),
    },

    server: devProxy
      ? {
          proxy: {
            "/api/arrivals": {
              target: "https://datamall2.mytransport.sg",
              changeOrigin: true,
              headers: { AccountKey: LTA_ACCOUNT_KEY! },
              rewrite: (path) =>
                path.replace(/^\/api\/arrivals\?code=/, "/ltaodataservice/v3/BusArrival?BusStopCode="),
            },
          },
        }
      : undefined,

    plugins: [
      vue(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icons/*.png", "icons/*.svg"],
        manifest: {
          name: "SG Bussin",
          short_name: "Bussin",
          description: "Live Singapore bus arrival times",
          start_url: ".",
          scope: ".",
          display: "standalone",
          background_color: "#f4f5f0",
          theme_color: "#0f7a47",
          icons: [
            { src: "icons/bus-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/bus-512.png", sizes: "512x512", type: "image/png" },
            { src: "icons/bus-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
          // Stop names are Latin script; other Inter subsets are only fetched if ever needed.
          globIgnores: ["**/inter-{cyrillic,greek,vietnamese}*"],
          runtimeCaching: [
            {
              // Bus stop / route data: serve the cached copy instantly, refresh it in the background.
              urlPattern: ({ url }) => url.pathname.includes("/data/") && url.pathname.endsWith(".json"),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "bus-data" },
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
