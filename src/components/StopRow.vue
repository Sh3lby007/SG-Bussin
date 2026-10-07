<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";

defineProps<{ code: string; name?: string; road?: string; detail?: string }>();
</script>

<template>
  <RouterLink class="stop-row" :to="{ name: 'stop', params: { code } }">
    <span class="code tnum">{{ code }}</span>
    <span class="text">
      <span class="name">{{ name ?? "Unknown stop" }}</span>
      <span v-if="road" class="road">{{ road }}</span>
    </span>
    <span v-if="detail" class="detail tnum">{{ detail }}</span>
    <slot name="trailing">
      <ChevronRight :size="18" class="chev" />
    </slot>
  </RouterLink>
</template>

<style scoped>
.stop-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  min-height: 60px;
  transition: background-color 0.15s;
}

.stop-row:hover {
  background: var(--surface-2);
}

.code {
  flex: none;
  min-width: 3.75rem;
  padding: 4px 0;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.8125rem;
  font-weight: 700;
  text-align: center;
}

.text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.road {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.chev {
  flex: none;
  color: var(--text-faint);
}
</style>
