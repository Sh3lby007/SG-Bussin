/** Whole minutes until `eta`; 0 or less means the bus is arriving. */
export function minutesUntil(eta: number, now: number): number {
  return Math.floor((eta - now) / 60_000);
}

export function formatEta(eta: number, now: number): string {
  const mins = minutesUntil(eta, now);
  return mins <= 0 ? "Arr" : String(mins);
}

export function formatAgo(timestamp: number, now: number): string {
  const secs = Math.max(0, Math.round((now - timestamp) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

export function formatDistance(metres: number): string {
  return metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`;
}

/** Great-circle distance in metres. */
export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(a));
}

export const LOAD_LABEL = { SEA: "Seats available", SDA: "Standing room", LSD: "Limited standing" } as const;
export const TYPE_LABEL = { SD: "Single deck", DD: "Double deck", BD: "Bendy" } as const;
