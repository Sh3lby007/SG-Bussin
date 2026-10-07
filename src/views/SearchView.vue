<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Fuse from "fuse.js";
import { ArrowLeft, ChevronRight, Search, X } from "@lucide/vue";
import { useFavourites } from "@/stores/favourites";
import { useTransitData } from "@/composables/useTransitData";
import type { BusService, BusStop } from "@/lib/transit";
import ServiceBadge from "@/components/ServiceBadge.vue";
import StopRow from "@/components/StopRow.vue";
import EmptyState from "@/components/EmptyState.vue";

type Filter = "all" | "services" | "stops";

const router = useRouter();
const favourites = useFavourites();
const { data } = useTransitData();
const input = ref<HTMLInputElement | null>(null);
const filter = ref<Filter>("all");
const suggestions = ["83139", "Orchard Rd", "Bedok Int", "190"];

onMounted(() => input.value?.focus());

const query = computed(() => favourites.query.trim());

const stopIndex = computed(
  () =>
    data.value &&
    new Fuse([...data.value.stops.values()], {
      keys: [
        { name: "code", weight: 3 },
        { name: "name", weight: 2 },
        { name: "road", weight: 1 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
    }),
);

const serviceIndex = computed(
  () => data.value && new Fuse([...data.value.services.values()], { keys: ["name"], threshold: 0.3, ignoreLocation: true }),
);

const serviceResults = computed<BusService[]>(() => {
  if (!data.value || !query.value) return [];
  const q = query.value.toLowerCase();
  // Bus numbers match by prefix ("19" -> 19, 190, 197...), names fuzzily.
  const byNumber = [...data.value.services.values()]
    .filter((s) => s.serviceNo.toLowerCase().startsWith(q))
    .sort((a, b) => a.serviceNo.length - b.serviceNo.length || a.serviceNo.localeCompare(b.serviceNo, "en", { numeric: true }));
  const byName = /^\d/.test(q) ? [] : (serviceIndex.value?.search(q, { limit: 8 }).map((r) => r.item) ?? []);
  return [...new Set([...byNumber, ...byName])].slice(0, 8);
});

const stopResults = computed<BusStop[]>(() => {
  if (!query.value) return [];
  // Short numbers are almost always bus services, not stop codes.
  if (/^\d{1,3}[a-z]?$/i.test(query.value)) return [];
  return stopIndex.value?.search(query.value, { limit: 25 }).map((r) => r.item) ?? [];
});

const showServices = computed(() => filter.value !== "stops" && serviceResults.value.length > 0);
const showStops = computed(() => filter.value !== "services" && stopResults.value.length > 0);

function openFirstResult() {
  const stop = stopResults.value[0];
  const service = serviceResults.value[0];
  if (showServices.value && service) router.push({ name: "service", params: { serviceNo: service.serviceNo } });
  else if (showStops.value && stop) router.push({ name: "stop", params: { code: stop.code } });
}

function goBack() {
  if (window.history.state?.back) router.back();
  else router.push({ name: "home" });
}
</script>

<template>
  <div>
    <header class="search-header">
      <div class="inner">
        <button class="icon-btn" type="button" aria-label="Back" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <label class="field">
          <Search :size="18" class="field-icon" />
          <span class="sr-only">Search</span>
          <input
            ref="input"
            v-model="favourites.query"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            placeholder="Bus stop, road or service no."
            @keydown.enter="openFirstResult"
          />
          <button
            v-if="favourites.query"
            class="clear"
            type="button"
            aria-label="Clear search"
            @click="favourites.query = ''; input?.focus()"
          >
            <X :size="16" />
          </button>
        </label>
      </div>
      <div class="inner chips" role="tablist">
        <button
          v-for="f in ['all', 'services', 'stops'] as const"
          :key="f"
          class="chip"
          :class="{ active: filter === f }"
          role="tab"
          :aria-selected="filter === f"
          type="button"
          @click="filter = f"
        >
          {{ f === "all" ? "All" : f === "services" ? "Buses" : "Stops" }}
        </button>
      </div>
    </header>

    <main class="page">
      <div v-if="!query" class="tips">
        <p class="muted">Try searching for</p>
        <div class="suggestions">
          <button v-for="s in suggestions" :key="s" class="chip" type="button" @click="favourites.query = s">
            {{ s }}
          </button>
        </div>
      </div>

      <section v-if="showServices" class="section">
        <h2 class="section-title">Buses</h2>
        <div class="list">
          <RouterLink
            v-for="svc in serviceResults"
            :key="svc.serviceNo"
            class="service-row"
            :to="{ name: 'service', params: { serviceNo: svc.serviceNo } }"
          >
            <ServiceBadge :service-no="svc.serviceNo" />
            <span class="service-text">
              <span class="service-name">{{ svc.name }}</span>
              <span class="service-meta">{{ svc.operator }} · {{ svc.category.toLowerCase() }}</span>
            </span>
            <ChevronRight :size="18" class="chev" />
          </RouterLink>
        </div>
      </section>

      <section v-if="showStops" class="section">
        <h2 class="section-title">Stops</h2>
        <div class="list">
          <StopRow v-for="stop in stopResults" :key="stop.code" :code="stop.code" :name="stop.name" :road="stop.road" />
        </div>
      </section>

      <EmptyState
        v-if="query && data && !showServices && !showStops"
        class="section"
        title="No matches"
        :text="`Nothing found for “${query}”. Check the spelling, or try a 5-digit stop code.`"
      >
        <template #icon><Search :size="26" /></template>
      </EmptyState>
    </main>
  </div>
</template>

<style scoped>
.search-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding-top: env(safe-area-inset-top);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: saturate(1.4) blur(14px);
  -webkit-backdrop-filter: saturate(1.4) blur(14px);
}

.inner {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 8px calc(var(--gutter) - 8px) 4px;
}

.field {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.field-icon {
  position: absolute;
  left: 16px;
  color: var(--accent);
  pointer-events: none;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 44px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s;
  -webkit-appearance: none;
  appearance: none;
}

input::-webkit-search-cancel-button {
  display: none;
}

input:focus {
  border-color: var(--accent);
}

input::placeholder {
  color: var(--text-faint);
}

.clear {
  position: absolute;
  right: 8px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--text-muted);
}

.clear:hover {
  background: var(--surface-2);
}

.chips {
  gap: 8px;
  padding: 6px var(--gutter) 10px calc(var(--gutter) + 46px);
}

.chip {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  font-size: 0.875rem;
  font-weight: 550;
  color: var(--text-muted);
  transition: all 0.15s;
}

.chip:hover {
  color: var(--text);
}

.chip.active {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.tips {
  margin: 24px 4px 0;
  font-size: 0.875rem;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.section:first-child {
  margin-top: 12px;
}

.service-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  transition: background-color 0.15s;
}

.service-row:hover {
  background: var(--surface-2);
}

.service-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.service-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-weight: 600;
  font-size: 0.9375rem;
  line-height: 1.3;
}

.service-meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.chev {
  flex: none;
  color: var(--text-faint);
}

@media (max-width: 380px) {
  .chips {
    padding-left: var(--gutter);
  }
}
</style>
