/**
 * Static bus network data (stops, services, routes). Generated from LTA DataMall
 * by scripts/fetch-lta-data.mjs and served from public/data so it can be
 * refreshed without rebuilding the app.
 */

export interface BusStop {
  code: string;
  name: string;
  road: string;
  lat: number;
  lng: number;
}

export interface BusService {
  serviceNo: string;
  name: string;
  operator: string;
  category: string;
  /** Single-direction service that ends where it starts. */
  loop: boolean;
  /** One ordered list of stop codes per direction. */
  routes: string[][];
}

export interface DataMeta {
  updatedAt: string;
  source: string;
  stops: number;
  services: number;
}

export interface TransitData {
  stops: Map<string, BusStop>;
  services: Map<string, BusService>;
  meta: DataMeta;
}

type RawStops = Record<string, [name: string, road: string, lat: number, lng: number]>;
type RawServices = Record<string, Omit<BusService, "serviceNo">>;

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${file}`);
  if (!res.ok) throw new Error(`Couldn't load ${file} (${res.status})`);
  return res.json() as Promise<T>;
}

let pending: Promise<TransitData> | null = null;

export function loadTransitData(): Promise<TransitData> {
  pending ??= Promise.all([
    getJson<RawStops>("stops.json"),
    getJson<RawServices>("services.json"),
    getJson<DataMeta>("meta.json"),
  ])
    .then(([rawStops, rawServices, meta]) => ({
      stops: new Map(
        Object.entries(rawStops).map(([code, [name, road, lat, lng]]) => [code, { code, name, road, lat, lng }]),
      ),
      services: new Map(
        Object.entries(rawServices).map(([serviceNo, svc]) => [serviceNo, { serviceNo, ...svc }]),
      ),
      meta,
    }))
    .catch((err) => {
      pending = null; // allow a retry
      throw err;
    });
  return pending;
}

/** Index of the direction a stop belongs to, preferring the one where it's earliest (not the terminus). */
export function directionForStop(service: BusService, stopCode: string): number {
  let best = 0;
  let bestIndex = Infinity;
  service.routes.forEach((route, dir) => {
    const index = route.indexOf(stopCode);
    if (index !== -1 && index < bestIndex) {
      best = dir;
      bestIndex = index;
    }
  });
  return best;
}
