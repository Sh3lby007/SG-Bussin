import { computed, ref, shallowRef } from "vue";
import { distanceMetres } from "@/lib/format";
import type { BusStop } from "@/lib/transit";
import { useTransitData } from "./useTransitData";

type Status = "idle" | "locating" | "ready" | "denied" | "unavailable";

const RADIUS_M = 800;
const LIMIT = 10;

export function useNearbyStops() {
  const { data } = useTransitData();
  const status = ref<Status>("idle");
  const position = shallowRef<{ lat: number; lng: number } | null>(null);

  const stops = computed<Array<{ stop: BusStop; distance: number }>>(() => {
    if (!position.value || !data.value) return [];
    const { lat, lng } = position.value;
    return [...data.value.stops.values()]
      .map((stop) => ({ stop, distance: distanceMetres(lat, lng, stop.lat, stop.lng) }))
      .filter((s) => s.distance <= RADIUS_M)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, LIMIT);
  });

  function locate() {
    if (!("geolocation" in navigator)) {
      status.value = "unavailable";
      return;
    }
    status.value = "locating";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        position.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        status.value = "ready";
      },
      (err) => (status.value = err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return { status, stops, locate };
}
