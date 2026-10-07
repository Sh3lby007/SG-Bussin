import { shallowRef } from "vue";
import { loadTransitData, type TransitData } from "@/lib/transit";

const data = shallowRef<TransitData | null>(null);
const error = shallowRef<Error | null>(null);

function load() {
  error.value = null;
  loadTransitData()
    .then((d) => (data.value = d))
    .catch((err: Error) => (error.value = err));
}

/** Shared, lazily-loaded bus stop/service data. */
export function useTransitData() {
  if (!data.value && !error.value) load();
  return { data, error, retry: load };
}
