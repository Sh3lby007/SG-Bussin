/**
 * Proxy for LTA DataMall's Bus Arrival API (v3).
 *
 * The browser can't call DataMall directly: it sends no CORS headers, and the
 * AccountKey would be exposed to anyone opening dev tools. This worker keeps the
 * key as a secret and returns the untouched LTA JSON with CORS headers.
 *
 *   GET /arrivals?code=83139  ->  LTA /v3/BusArrival?BusStopCode=83139
 */
const LTA_BUS_ARRIVAL = "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";
const CACHE_SECONDS = 15;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = corsHeaders(request.headers.get("Origin"), env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...cors, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400" },
      });
    }
    if (request.method !== "GET" || url.pathname !== "/arrivals") {
      return json({ error: "Not found" }, 404, cors);
    }
    if (!cors["Access-Control-Allow-Origin"]) {
      return json({ error: "Origin not allowed" }, 403, cors);
    }

    const code = url.searchParams.get("code") ?? "";
    if (!/^\d{5}$/.test(code)) {
      return json({ error: "code must be a 5-digit bus stop code" }, 400, cors);
    }

    // Share one upstream call per stop across all users for a few seconds.
    // (The Cache API is a no-op on *.workers.dev; it kicks in on a custom domain.)
    const cache = caches.default;
    const cacheKey = new Request(`https://cache.internal/arrivals/${code}`);
    let body = await cache.match(cacheKey).then((res) => res?.text());

    if (body === undefined) {
      const upstream = await fetch(`${LTA_BUS_ARRIVAL}?BusStopCode=${code}`, {
        headers: { AccountKey: env.LTA_ACCOUNT_KEY, accept: "application/json" },
      });
      if (!upstream.ok) {
        return json({ error: `LTA DataMall responded with ${upstream.status}` }, 502, cors);
      }
      body = await upstream.text();
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(body, { headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` } }),
        ),
      );
    }

    return new Response(body, {
      headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  },
};

function corsHeaders(origin, allowedOrigins = "*") {
  const allowed = allowedOrigins.split(",").map((o) => o.trim());
  if (allowed.includes("*")) return { "Access-Control-Allow-Origin": "*" };
  // Requests without an Origin header (curl, server-side) aren't subject to CORS.
  if (!origin) return { "Access-Control-Allow-Origin": allowed[0] };
  return allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : { Vary: "Origin" };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
