<script setup lang="ts">
withDefaults(defineProps<{ serviceNo: string; size?: "sm" | "md" | "lg"; muted?: boolean }>(), {
  size: "md",
  muted: false,
});
</script>

<template>
  <span class="badge tnum" :class="[size, { muted }]">{{ serviceNo }}</span>
</template>

<style scoped>
.badge {
  display: inline-grid;
  place-items: center;
  flex: none;
  min-width: 4rem;
  height: 2.5rem;
  padding: 0 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 750;
  font-size: 1.125rem;
  letter-spacing: -0.02em;
}

.sm {
  min-width: 2.75rem;
  height: 1.875rem;
  font-size: 0.875rem;
  border-radius: 8px;
}

.lg {
  min-width: 4.25rem;
  height: 3rem;
  font-size: 1.375rem;
}

.muted {
  background: var(--surface-2);
  color: var(--text-muted);
}
</style>
