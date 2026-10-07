<script setup lang="ts">
import { Heart } from "@lucide/vue";

defineProps<{ active: boolean; label: string }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    class="icon-btn fav"
    :class="{ active }"
    type="button"
    :aria-pressed="active"
    :aria-label="label"
    @click.stop.prevent="$emit('toggle')"
  >
    <Heart :size="20" :fill="active ? 'currentColor' : 'none'" />
  </button>
</template>

<style scoped>
.fav.active {
  color: var(--danger);
}

.fav.active :deep(svg) {
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  50% {
    transform: scale(1.25);
  }
}
</style>
