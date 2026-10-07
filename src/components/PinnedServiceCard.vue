<script setup lang="ts">
import { computed } from "vue";
import { useArrivals } from "@/composables/useArrivals";
import { useTransitData } from "@/composables/useTransitData";
import { useFavourites } from "@/stores/favourites";
import { formatEta } from "@/lib/format";
import ServiceBadge from "./ServiceBadge.vue";
import EtaDisplay from "./EtaDisplay.vue";
import FavouriteButton from "./FavouriteButton.vue";

const props = defineProps<{ serviceNo: string; stopCode: string; now: number }>();

const favourites = useFavourites();
const { data } = useTransitData();
const { services, error } = useArrivals(() => props.stopCode);

const stop = computed(() => data.value?.stops.get(props.stopCode));
const arrivals = computed(() => services.value?.find((s) => s.serviceNo === props.serviceNo)?.arrivals ?? []);
const later = computed(() => arrivals.value.slice(1).map((a) => formatEta(a.eta, props.now)));
const status = computed(() => {
  if (error.value && !services.value) return "Couldn't load";
  if (!services.value) return "Loading…";
  return arrivals.value.length ? "" : "Not operating now";
});
</script>

<template>
  <RouterLink class="pinned card" :to="{ name: 'stop', params: { code: stopCode } }">
    <ServiceBadge :service-no="serviceNo" size="lg" />
    <div class="where">
      <p class="stop-name">{{ stop?.name ?? `Stop ${stopCode}` }}</p>
      <p class="stop-meta tnum">
        <template v-if="status">{{ status }}</template>
        <template v-else-if="later.length">then {{ later.join(" · ") }} min</template>
        <template v-else>Last bus for now</template>
      </p>
    </div>
    <EtaDisplay v-if="!status" :arrival="arrivals[0]" :now="now" />
    <FavouriteButton
      active
      class="unpin"
      :label="`Unpin bus ${serviceNo}`"
      @toggle="favourites.toggleService(serviceNo, stopCode)"
    />
  </RouterLink>
</template>

<style scoped>
.pinned {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 6px 12px 12px;
  transition: transform 0.15s;
}

.pinned:active {
  transform: scale(0.99);
}

.where {
  flex: 1;
  min-width: 0;
}

.stop-name {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stop-meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>
