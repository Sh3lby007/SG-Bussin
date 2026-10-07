<script setup lang="ts">
import { computed } from "vue";
import type { Arrival } from "@/lib/arrivals";
import { LOAD_LABEL, minutesUntil } from "@/lib/format";

const props = defineProps<{ arrival?: Arrival; now: number }>();

const mins = computed(() => (props.arrival ? minutesUntil(props.arrival.eta, props.now) : null));
const label = computed(() => {
  if (!props.arrival || mins.value === null) return "No estimate";
  const when = mins.value <= 0 ? "Arriving" : `${mins.value} minutes`;
  const load = props.arrival.load ? `, ${LOAD_LABEL[props.arrival.load]}` : "";
  return `${when}${load}`;
});
</script>

<template>
  <div class="eta" :aria-label="label" :class="{ scheduled: arrival && !arrival.monitored }">
    <template v-if="mins === null">
      <span class="value none">–</span>
    </template>
    <template v-else-if="mins <= 0">
      <span class="value arr">Arr</span>
    </template>
    <template v-else>
      <span class="value tnum">{{ mins }}</span><span class="unit">min</span>
    </template>
    <span class="load" :class="arrival?.load?.toLowerCase()" aria-hidden="true" />
  </div>
</template>

<style scoped>
.eta {
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  min-width: 3.5rem;
  padding-bottom: 8px;
}

.value {
  font-size: 1.75rem;
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1;
}

.arr {
  font-size: 1.25rem;
  color: var(--accent);
}

.none {
  color: var(--text-faint);
}

.unit {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.scheduled .value {
  color: var(--text-muted);
}

.load {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 26px;
  height: 4px;
  border-radius: 99px;
  transform: translateX(-50%);
  background: transparent;
}

.load.sea {
  background: var(--load-sea);
}
.load.sda {
  background: var(--load-sda);
}
.load.lsd {
  background: var(--load-lsd);
}
</style>
