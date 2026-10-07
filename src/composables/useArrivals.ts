import { onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { getArrivals, type ServiceArrivals } from "@/lib/arrivals";

const POLL_MS = 20_000;

/**
 * Polls live arrivals for a stop. Pauses while the tab is hidden, refreshes as
 * soon as it's visible again, and stops when the owning component unmounts.
 */
export function useArrivals(stopCode: MaybeRefOrGetter<string>) {
  const services = shallowRef<ServiceArrivals[] | null>(null);
  const error = shallowRef<Error | null>(null);
  const loading = ref(false);
  const updatedAt = ref<number | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  async function refresh(force = false) {
    clearTimeout(timer);
    const id = ++requestId;
    loading.value = true;
    try {
      const result = await getArrivals(toValue(stopCode), { force });
      if (id !== requestId) return; // a newer request (e.g. stop changed) superseded this one
      services.value = result;
      error.value = null;
      updatedAt.value = Date.now();
    } catch (err) {
      if (id === requestId) error.value = err as Error;
    } finally {
      if (id === requestId) {
        loading.value = false;
        if (document.visibilityState === "visible") timer = setTimeout(refresh, POLL_MS);
      }
    }
  }

  function onVisibility() {
    if (document.visibilityState === "visible") refresh();
    else clearTimeout(timer);
  }

  document.addEventListener("visibilitychange", onVisibility);
  watch(
    () => toValue(stopCode),
    () => {
      services.value = null;
      refresh();
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    requestId++;
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  });

  return { services, error, loading, updatedAt, refresh: () => refresh(true) };
}
