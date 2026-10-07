<script setup lang="ts">
defineProps<{ title: string; text?: string }>();
</script>

<template>
  <div class="empty">
    <div class="icon"><slot name="icon" /></div>
    <p class="title">{{ title }}</p>
    <p v-if="text" class="text">{{ text }}</p>
    <div v-if="$slots.default" class="actions"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  text-align: center;
}

.icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 18px;
  background: var(--accent-soft);
  color: var(--accent);
}

.title {
  font-weight: 650;
  font-size: 1.0625rem;
}

.text {
  max-width: 34ch;
  margin-top: 4px;
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}
</style>
