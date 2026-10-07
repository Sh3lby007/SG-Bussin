import { onScopeDispose, ref } from "vue";

/** A clock ref that ticks every `intervalMs`, so countdowns stay current between API polls. */
export function useNow(intervalMs = 5_000) {
  const now = ref(Date.now());
  const timer = setInterval(() => (now.value = Date.now()), intervalMs);
  onScopeDispose(() => clearInterval(timer));
  return now;
}
