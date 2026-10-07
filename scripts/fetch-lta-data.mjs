#!/usr/bin/env node
/**
 * Pulls the static bus datasets (stops, services, routes) from LTA DataMall
 * and writes the compact JSON files the app loads at runtime:
 *
 *   public/data/stops.json     { [stopCode]: [name, road, lat, lng] }
 *   public/data/services.json  { [serviceNo]: { name, operator, category, loop, routes: string[][] } }
 *   public/data/meta.json      { updatedAt, source, stops, services }
 *
 * Usage: LTA_ACCOUNT_KEY=xxxx node scripts/fetch-lta-data.mjs
 *
 * Runs weekly in .github/workflows/update-data.yml. Output is sorted so the
 * git diff only shows real changes, and sanity checks stop a bad API response
 * from wiping out the committed data.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "data");
const MIN_STOPS = 4000;
const MIN_SERVICES = 400;

const accountKey = process.env.LTA_ACCOUNT_KEY;
if (!accountKey) {
  console.error("LTA_ACCOUNT_KEY is not set. Get a free key at https://datamall.lta.gov.sg");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { AccountKey: accountKey, accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return (await res.json()).value;
  } catch (err) {
    if (attempt >= 5) throw new Error(`${url} failed after ${attempt} attempts: ${err.message}`);
    await sleep(1000 * 2 ** attempt);
    return fetchPage(url, attempt + 1);
  }
}

/** DataMall returns 500 records per call; keep paging with $skip until a page comes back empty. */
async function fetchAll(dataset) {
  const records = [];
  for (let skip = 0; skip < 200_000; skip += 500) {
    const page = await fetchPage(`${BASE_URL}/${dataset}?$skip=${skip}`);
    if (!page?.length) break;
    records.push(...page);
  }
  console.log(`${dataset}: ${records.length} records`);
  return records;
}

const naturalCompare = (a, b) => a.localeCompare(b, "en", { numeric: true });

function sortObject(obj, compare = naturalCompare) {
  return Object.fromEntries(Object.keys(obj).sort(compare).map((k) => [k, obj[k]]));
}

function buildStops(rawStops) {
  const stops = {};
  for (const s of rawStops) {
    stops[s.BusStopCode] = [
      s.Description.trim(),
      s.RoadName.trim(),
      Number(Number(s.Latitude).toFixed(6)),
      Number(Number(s.Longitude).toFixed(6)),
    ];
  }
  return sortObject(stops);
}

function buildServices(rawServices, rawRoutes, stops) {
  const stopName = (code) => stops[code]?.[0] ?? code;

  // Group route records into ordered stop lists per service + direction.
  const routeMap = new Map();
  for (const r of rawRoutes) {
    const key = `${r.ServiceNo}|${r.Direction}`;
    if (!routeMap.has(key)) routeMap.set(key, []);
    routeMap.get(key).push(r);
  }

  const services = {};
  for (const svc of rawServices) {
    const entry = (services[svc.ServiceNo] ??= {
      operator: svc.Operator,
      category: svc.Category,
      directions: [],
    });
    entry.directions[svc.Direction - 1] = svc;
  }

  for (const [serviceNo, entry] of Object.entries(services)) {
    const routes = [];
    for (const dir of [1, 2]) {
      const records = routeMap.get(`${serviceNo}|${dir}`);
      if (!records?.length) continue;
      records.sort((a, b) => a.StopSequence - b.StopSequence);
      routes.push(records.map((r) => r.BusStopCode));
    }
    if (!routes.length) {
      delete services[serviceNo];
      continue;
    }

    const first = entry.directions.find(Boolean);
    const origin = first?.OriginCode ?? routes[0][0];
    const destination = first?.DestinationCode ?? routes[0].at(-1);
    const loop = routes.length === 1 && origin === destination;

    let name;
    if (origin === destination) {
      // A true loop, or two loop-shaped directions starting and ending at the same interchange.
      const turnaround = first?.LoopDesc?.trim() || (loop ? stopName(routes[0][Math.floor(routes[0].length / 2)]) : "");
      name = turnaround ? `${stopName(origin)} ⟲ ${turnaround}` : `${stopName(origin)} ⟲`;
    } else if (routes.length === 2) {
      name = `${stopName(origin)} ⇄ ${stopName(destination)}`;
    } else {
      name = `${stopName(origin)} → ${stopName(destination)}`;
    }

    services[serviceNo] = {
      name,
      operator: entry.operator,
      category: entry.category,
      loop,
      routes,
    };
  }
  return sortObject(services);
}

async function writeJson(file, data) {
  await writeFile(join(OUT_DIR, file), JSON.stringify(data) + "\n");
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(join(OUT_DIR, file), "utf8"));
  } catch {
    return null;
  }
}

const [rawStops, rawServices, rawRoutes] = await Promise.all([
  fetchAll("BusStops"),
  fetchAll("BusServices"),
  fetchAll("BusRoutes"),
]);

const stops = buildStops(rawStops);
const services = buildServices(rawServices, rawRoutes, stops);
const stopCount = Object.keys(stops).length;
const serviceCount = Object.keys(services).length;

if (stopCount < MIN_STOPS || serviceCount < MIN_SERVICES) {
  console.error(
    `Sanity check failed: ${stopCount} stops (min ${MIN_STOPS}), ${serviceCount} services (min ${MIN_SERVICES}). Not writing.`,
  );
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const previousStops = await readJson("stops.json");
const previousServices = await readJson("services.json");
const changed =
  JSON.stringify(previousStops) !== JSON.stringify(stops) ||
  JSON.stringify(previousServices) !== JSON.stringify(services);

if (!changed) {
  console.log("No changes in bus data.");
  process.exit(0);
}

await writeJson("stops.json", stops);
await writeJson("services.json", services);
// meta.json only changes when the data does, so unchanged weeks produce no commit.
await writeJson("meta.json", {
  updatedAt: new Date().toISOString(),
  source: "LTA DataMall",
  stops: stopCount,
  services: serviceCount,
});
console.log(`Wrote ${stopCount} stops and ${serviceCount} services to ${OUT_DIR}`);
