<script setup lang="ts">
import { computed } from "vue";
import { Heart, LocateFixed, Search } from "@lucide/vue";
import { useFavourites } from "@/stores/favourites";
import { useTransitData } from "@/composables/useTransitData";
import { useNearbyStops } from "@/composables/useNearbyStops";
import { useNow } from "@/composables/useNow";
import { formatDistance } from "@/lib/format";
import PinnedServiceCard from "@/components/PinnedServiceCard.vue";
import StopRow from "@/components/StopRow.vue";
import EmptyState from "@/components/EmptyState.vue";

const favourites = useFavourites();
const { data, error, retry } = useTransitData();
const { status: nearbyStatus, stops: nearbyStops, locate } = useNearbyStops();
const logoUrl = `${import.meta.env.BASE_URL}icons/bus.svg`;
const now = useNow();

const hasFavourites = computed(() => favourites.stopCodes.length > 0 || favourites.services.length > 0);
</script>

<template>
  <main class="page">
    <header class="hero">
      <div class="brand">
        <img :src="logoUrl" alt="" width="36" height="36" />
        <h1>SG Bussin</h1>
      </div>
      <RouterLink class="search-field" :to="{ name: 'search' }">
        <Search :size="20" />
        <span>Bus stop, road or service no.</span>
      </RouterLink>
    </header>

    <p v-if="error" class="card notice">
      Couldn't load bus stop data.
      <button class="btn btn-ghost" type="button" @click="retry">Try again</button>
    </p>

    <section v-if="favourites.services.length" class="section">
      <h2 class="section-title">Pinned buses</h2>
      <div class="stack">
        <PinnedServiceCard
          v-for="fav in favourites.services"
          :key="fav.key"
          :service-no="fav.serviceNo"
          :stop-code="fav.stopCode"
          :now="now"
        />
      </div>
    </section>

    <section v-if="favourites.stopCodes.length" class="section">
      <h2 class="section-title">Saved stops</h2>
      <div class="list">
        <StopRow
          v-for="code in favourites.stopCodes"
          :key="code"
          :code="code"
          :name="data?.stops.get(code)?.name"
          :road="data?.stops.get(code)?.road"
        />
      </div>
    </section>

    <EmptyState
      v-if="!hasFavourites"
      class="section"
      title="Nothing saved yet"
      text="Tap the heart on a stop to save it here, or on a bus to pin its live arrival times."
    >
      <template #icon><Heart :size="26" /></template>
      <RouterLink class="btn btn-ghost" :to="{ name: 'search' }">
        <Search :size="18" />
        Find a stop
      </RouterLink>
    </EmptyState>

    <section class="section">
      <h2 class="section-title">
        Nearby
        <button
          v-if="nearbyStatus === 'ready'"
          class="icon-btn"
          type="button"
          aria-label="Update location"
          @click="locate"
        >
          <LocateFixed :size="18" />
        </button>
      </h2>
      <div v-if="nearbyStatus === 'ready' && nearbyStops.length" class="list">
        <StopRow
          v-for="{ stop, distance } in nearbyStops"
          :key="stop.code"
          :code="stop.code"
          :name="stop.name"
          :road="stop.road"
          :detail="formatDistance(distance)"
        />
      </div>
      <div v-else class="card nearby-prompt">
        <p v-if="nearbyStatus === 'ready'" class="muted">No bus stops within 800 m.</p>
        <p v-else-if="nearbyStatus === 'denied'" class="muted">
          Location access is blocked. Allow it in your browser settings to see stops around you.
        </p>
        <p v-else-if="nearbyStatus === 'unavailable'" class="muted">Couldn't get your location.</p>
        <p v-else class="muted">Find the bus stops closest to you.</p>
        <button
          v-if="nearbyStatus !== 'ready'"
          class="btn"
          type="button"
          :disabled="nearbyStatus === 'locating'"
          @click="locate"
        >
          <LocateFixed :size="18" />
          {{ nearbyStatus === "locating" ? "Locating…" : "Use my location" }}
        </button>
      </div>
    </section>


  </main>
</template>

<style scoped>
.hero {
  padding-top: calc(12px + env(safe-area-inset-top));
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 4px 18px;
}

.brand img {
  border-radius: 10px;
}

.brand h1 {
  font-size: 1.5rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 18px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow);
  color: var(--text-faint);
  transition: border-color 0.15s;
}

.search-field:hover {
  border-color: var(--accent);
}

.search-field :deep(svg) {
  color: var(--accent);
}

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 12px 12px 16px;
}

.nearby-prompt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  font-size: 0.9375rem;
}

.nearby-prompt .btn:disabled {
  opacity: 0.7;
  cursor: progress;
}

</style>
