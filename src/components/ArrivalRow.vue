<script setup lang="ts">
import { computed } from "vue";
import type { ServiceArrivals } from "@/lib/arrivals";
import { formatEta } from "@/lib/format";
import ServiceBadge from "./ServiceBadge.vue";
import EtaDisplay from "./EtaDisplay.vue";
import FavouriteButton from "./FavouriteButton.vue";

const props = defineProps<{
  service: ServiceArrivals;
  stopCode: string;
  now: number;
  destination?: string;
  pinned: boolean;
}>();
defineEmits<{ togglePin: [] }>();

const next = computed(() => props.service.arrivals[0]);
const later = computed(() => props.service.arrivals.slice(1).map((a) => formatEta(a.eta, props.now)));
const typeLabel = computed(() => ({ DD: "Double", BD: "Bendy", SD: "" })[next.value?.type ?? "SD"]);
</script>

<template>
  <RouterLink
    class="row"
    :to="{ name: 'service', params: { serviceNo: service.serviceNo }, query: { stop: stopCode } }"
  >
    <ServiceBadge :service-no="service.serviceNo" />
    <div class="info">
      <p class="dest">{{ destination ? `to ${destination}` : service.operator }}</p>
      <p class="meta">
        <span v-if="later.length" class="then tnum">then {{ later.join(" · ") }} min</span>
        <span v-else class="then">Last bus for now</span>
        <span v-if="typeLabel" class="tag" :title="`${typeLabel} bus`">{{ typeLabel }}</span>
      </p>
    </div>
    <EtaDisplay :arrival="next" :now="now" />
    <FavouriteButton
      :active="pinned"
      :label="pinned ? `Unpin bus ${service.serviceNo}` : `Pin bus ${service.serviceNo} to home`"
      @toggle="$emit('togglePin')"
    />
  </RouterLink>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 6px 12px 14px;
  transition: background-color 0.15s;
}

.row:hover {
  background: var(--surface-2);
}

.info {
  flex: 1;
  min-width: 0;
}

.dest {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
}

.then {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag {
  flex: none;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--surface-2);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.5;
}
</style>
