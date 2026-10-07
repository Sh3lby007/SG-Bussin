<script setup lang="ts">
import { computed } from "vue";
import { BusFront, TriangleAlert } from "@lucide/vue";
import { useFavourites } from "@/stores/favourites";
import { useTransitData } from "@/composables/useTransitData";
import { useArrivals } from "@/composables/useArrivals";
import { useNow } from "@/composables/useNow";
import { directionForStop } from "@/lib/transit";
import AppHeader from "@/components/AppHeader.vue";
import ArrivalRow from "@/components/ArrivalRow.vue";
import FavouriteButton from "@/components/FavouriteButton.vue";
import LiveStatus from "@/components/LiveStatus.vue";
import ServiceBadge from "@/components/ServiceBadge.vue";
import EmptyState from "@/components/EmptyState.vue";

const props = defineProps<{ code: string }>();

const favourites = useFavourites();
const { data } = useTransitData();
const { services, error, loading, updatedAt, refresh } = useArrivals(() => props.code);
const now = useNow();

const stop = computed(() => data.value?.stops.get(props.code));
const saved = computed(() => favourites.isStopSaved(props.code));

/** Services that stop here according to the route data, whether or not they're running right now. */
const scheduledServices = computed(() =>
  data.value ? [...data.value.services.values()].filter((s) => s.routes.some((r) => r.includes(props.code))) : [],
);

const notRunning = computed(() => {
  const live = new Set(services.value?.map((s) => s.serviceNo));
  return scheduledServices.value.filter((s) => !live.has(s.serviceNo));
});

function destinationFor(serviceNo: string, destinationCode: string | null | undefined) {
  const stops = data.value?.stops;
  if (!stops) return undefined;
  if (destinationCode) return stops.get(destinationCode)?.name;
  const service = data.value?.services.get(serviceNo);
  const route = service?.routes[directionForStop(service, props.code)];
  return route ? stops.get(route.at(-1) ?? "")?.name : undefined;
}
</script>

<template>
  <div>
    <AppHeader
      :title="stop?.name ?? `Bus stop ${code}`"
      :subtitle="stop ? `${code} · ${stop.road}` : code"
    >
      <template #actions>
        <FavouriteButton
          :active="saved"
          :label="saved ? 'Remove stop from saved' : 'Save this stop'"
          @toggle="favourites.toggleStop(code)"
        />
      </template>
    </AppHeader>

    <main class="page">
      <LiveStatus
        class="status"
        :updated-at="updatedAt"
        :loading="loading"
        :error="!!error"
        :now="now"
        @refresh="refresh"
      />

      <div v-if="!services && !error" class="stack">
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 68px" />
      </div>

      <EmptyState
        v-else-if="!services && error"
        title="Couldn't load arrival times"
        text="Check your connection and try again."
      >
        <template #icon><TriangleAlert :size="26" /></template>
        <button class="btn" type="button" @click="refresh">Try again</button>
      </EmptyState>

      <template v-else-if="services">
        <div v-if="services.length" class="list">
          <ArrivalRow
            v-for="svc in services"
            :key="svc.serviceNo"
            :service="svc"
            :stop-code="code"
            :now="now"
            :destination="destinationFor(svc.serviceNo, svc.arrivals[0]?.destinationCode)"
            :pinned="favourites.isServicePinned(svc.serviceNo, code)"
            @toggle-pin="favourites.toggleService(svc.serviceNo, code)"
          />
        </div>
        <EmptyState
          v-else
          title="No buses right now"
          text="Services here may have ended for the night, or haven't started yet."
        >
          <template #icon><BusFront :size="26" /></template>
        </EmptyState>
      </template>

      <section v-if="services && notRunning.length" class="section">
        <h2 class="section-title">Not running now</h2>
        <div class="not-running">
          <RouterLink
            v-for="svc in notRunning"
            :key="svc.serviceNo"
            :to="{ name: 'service', params: { serviceNo: svc.serviceNo }, query: { stop: code } }"
          >
            <ServiceBadge :service-no="svc.serviceNo" size="sm" muted />
          </RouterLink>
        </div>
      </section>

      <ul class="legend" aria-label="Legend">
        <li><span class="swatch sea" />Seats</li>
        <li><span class="swatch sda" />Standing</li>
        <li><span class="swatch lsd" />Limited</li>
        <li><span class="grey">7</span> Scheduled, not live</li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.status {
  margin: 0 4px 10px;
}

.not-running {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  margin: 32px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.75rem;
  color: var(--text-faint);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  width: 16px;
  height: 4px;
  border-radius: 99px;
}

.sea {
  background: var(--load-sea);
}
.sda {
  background: var(--load-sda);
}
.lsd {
  background: var(--load-lsd);
}

.grey {
  font-weight: 700;
  color: var(--text-muted);
}
</style>
