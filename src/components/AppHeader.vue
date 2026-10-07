<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue";
import { useRouter } from "vue-router";

defineProps<{ title: string; subtitle?: string }>();

const router = useRouter();

function goBack() {
  // Opened from a shared link or home-screen bookmark: there's nothing to go back to.
  if (window.history.state?.back) router.back();
  else router.push({ name: "home" });
}
</script>

<template>
  <header class="app-header">
    <div class="inner">
      <button class="icon-btn" type="button" aria-label="Back" @click="goBack">
        <ArrowLeft :size="22" />
      </button>
      <div class="titles">
        <h1 class="title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions"><slot name="actions" /></div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-top: env(safe-area-inset-top);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  backdrop-filter: saturate(1.4) blur(14px);
  -webkit-backdrop-filter: saturate(1.4) blur(14px);
}

.inner {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 8px calc(var(--gutter) - 8px);
  min-height: 60px;
}

.titles {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 1.0625rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 2px;
}
</style>
