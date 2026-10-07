/**
 * Live bus arrivals.
 *
 * Primary source is LTA DataMall's v3 Bus Arrival API, reached through the
 * worker in worker/ (or the Vite dev proxy). If neither is configured, falls
 * back to the community arrivelah API so the app still works out of the box.
 */

export type Load = "SEA" | "SDA" | "LSD";
export type BusType = "SD" | "DD" | "BD";

export interface Arrival {
  /** Estimated arrival, epoch ms. */
  eta: number;
  load: Load | null;
  type: BusType | null;
  wheelchair: boolean;
  /** false = scheduled time only, no live GPS. */
  monitored: boolean;
  destinationCode: string | null;
}

export interface ServiceArrivals {
  serviceNo: string;
  operator: string;
  arrivals: Arrival[];
}

const LTA_URL = import.meta.env.VITE_ARRIVALS_URL || (__LTA_DEV_PROXY__ ? "/api/arrivals" : "");
const FALLBACK_URL = "https://arrivelah2.busrouter.sg/";

// --- LTA DataMall ---------------------------------------------------------

interface LtaNextBus {
  EstimatedArrival: string;
  Monitored?: number;
  Load: string;
  Feature: string;
  Type: string;
  DestinationCode?: string;
}

interface LtaResponse {
  Services: Array<{
    ServiceNo: string;
    Operator: string;
    NextBus: LtaNextBus;
    NextBus2: LtaNextBus;
    NextBus3: LtaNextBus;
  }>;
}

function fromLta(bus: LtaNextBus | undefined): Arrival | null {
  const eta = bus?.EstimatedArrival ? Date.parse(bus.EstimatedArrival) : NaN;
  if (!bus || Number.isNaN(eta)) return null;
  return {
    eta,
    load: (bus.Load || null) as Load | null,
    type: (bus.Type || null) as BusType | null,
    wheelchair: bus.Feature === "WAB",
    monitored: bus.Monitored !== 0,
    destinationCode: bus.DestinationCode || null,
  };
}

async function fetchLta(stopCode: string): Promise<ServiceArrivals[]> {
  const res = await fetch(`${LTA_URL}?code=${encodeURIComponent(stopCode)}`);
  if (!res.ok) throw new Error(`Arrivals request failed (${res.status})`);
  const data = (await res.json()) as LtaResponse;
  return (data.Services ?? []).map((svc) => ({
    serviceNo: svc.ServiceNo,
    operator: svc.Operator,
    arrivals: [svc.NextBus, svc.NextBus2, svc.NextBus3].map(fromLta).filter((a) => a !== null),
  }));
}

// --- arrivelah fallback ---------------------------------------------------

interface ArrivelahBus {
  time?: string;
  duration_ms?: number;
  load?: string;
  feature?: string;
  type?: string;
  monitored?: number;
  destination_code?: string;
}

interface ArrivelahResponse {
  services: Array<{
    no: string;
    operator: string;
    next?: ArrivelahBus | null;
    next2?: ArrivelahBus | null;
    next3?: ArrivelahBus | null;
  }>;
}

function fromArrivelah(bus: ArrivelahBus | null | undefined, fetchedAt: number): Arrival | null {
  if (!bus) return null;
  const eta = bus.time ? Date.parse(bus.time) : fetchedAt + (bus.duration_ms ?? NaN);
  if (Number.isNaN(eta)) return null;
  return {
    eta,
    load: (bus.load || null) as Load | null,
    type: (bus.type || null) as BusType | null,
    wheelchair: bus.feature === "WAB",
    monitored: bus.monitored !== 0,
    destinationCode: bus.destination_code || null,
  };
}

async function fetchArrivelah(stopCode: string): Promise<ServiceArrivals[]> {
  const res = await fetch(`${FALLBACK_URL}?id=${encodeURIComponent(stopCode)}`);
  if (!res.ok) throw new Error(`Arrivals request failed (${res.status})`);
  const data = (await res.json()) as ArrivelahResponse;
  const fetchedAt = Date.now();
  return (data.services ?? []).map((svc) => ({
    serviceNo: svc.no,
    operator: svc.operator,
    arrivals: [svc.next, svc.next2, svc.next3].map((b) => fromArrivelah(b, fetchedAt)).filter((a) => a !== null),
  }));
}

// --- shared cache ---------------------------------------------------------

const naturalCompare = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

/** Several cards can watch the same stop; share one request per stop for a few seconds. */
const MAX_AGE_MS = 8_000;
const cache = new Map<string, { at: number; promise: Promise<ServiceArrivals[]> }>();

export function getArrivals(stopCode: string, { force = false } = {}): Promise<ServiceArrivals[]> {
  const hit = cache.get(stopCode);
  if (!force && hit && Date.now() - hit.at < MAX_AGE_MS) return hit.promise;

  const promise = (LTA_URL ? fetchLta(stopCode) : fetchArrivelah(stopCode)).then((services) =>
    services.sort((a, b) => naturalCompare(a.serviceNo, b.serviceNo)),
  );
  cache.set(stopCode, { at: Date.now(), promise });
  promise.catch(() => cache.delete(stopCode));
  return promise;
}
