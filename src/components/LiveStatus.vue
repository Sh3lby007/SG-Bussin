<script setup lang="ts">
import { RefreshCw } from "@lucide/vue";
import { formatAgo } from "@/lib/format";

defineProps<{ updatedAt: number | null; loading: boolean; error: boolean; now: number }>();
defineEmits<{ refresh: [] }>();
</script>

<template>
  <div class="live">
    <span class="dot" :class="{ error }" aria-hidden="true" />
    <span class="text" aria-live="polite">
      <template v-if="error">Couldn't refresh</template>
      <template v-else-if="updatedAt">Live · updated {{ formatAgo(updatedAt, now) }}</template>
      <template v-else>Loading live times…</template>
    </span>
    <button class="icon-btn refresh" type="button" aria-label="Refresh now" @click="$emit('refresh')">
      <RefreshCw :size="16" :class="{ spin: loading }" />
    </button>
  </div>
</template>

<style scoped>
.live {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--load-sea);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--load-sea) 60%, transparent);
  animation: pulse 2s infinite;
}

.dot.error {
  background: var(--danger);
  animation: none;
}

.text {
  flex: 1;
}

.refresh {
  width: 32px;
  height: 32px;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes pulse {
  70% {
    box-shadow: 0 0 0 7px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
