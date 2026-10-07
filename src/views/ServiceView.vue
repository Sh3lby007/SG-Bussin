<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowRightLeft, BusFront } from "@lucide/vue";
import { useTransitData } from "@/composables/useTransitData";
import { directionForStop } from "@/lib/transit";
import AppHeader from "@/components/AppHeader.vue";
import EmptyState from "@/components/EmptyState.vue";

const props = defineProps<{ serviceNo: string }>();

const route = useRoute();
const router = useRouter();
const { data } = useTransitData();

const service = computed(() => data.value?.services.get(props.serviceNo));
const highlight = computed(() => (typeof route.query.stop === "string" ? route.query.stop : null));

const direction = computed(() => {
  const svc = service.value;
  if (!svc) return 0;
  const forced = Number(route.query.dir);
  if (forced === 0 || forced === 1) return Math.min(forced, svc.routes.length - 1);
  return highlight.value ? directionForStop(svc, highlight.value) : 0;
});

const stops = computed(() => {
  const codes = service.value?.routes[direction.value] ?? [];
  return codes.map((code) => ({ code, stop: data.value?.stops.get(code) }));
});

function stopName(code: string | undefined) {
  return (code && data.value?.stops.get(code)?.name) || code || "";
}

/** "To <terminus>", or for loops "Loop via <turnaround>". */
function directionLabel(codes: string[]) {
  const first = codes[0];
  const last = codes.at(-1);
  if (first === last) return `Loop via ${stopName(codes[Math.floor(codes.length / 2)])}`;
  return `To ${stopName(last)}`;
}

function setDirection(dir: number) {
  router.replace({ query: { ...route.query, dir: String(dir) } });
}

const list = ref<HTMLElement | null>(null);
watch(
  [stops, highlight],
  async () => {
    if (!highlight.value) return;
    await nextTick();
    list.value?.querySelector(".current")?.scrollIntoView({ block: "center" });
  },
  { flush: "post" },
);
</script>

<template>
  <div>
    <AppHeader
      :title="`Bus ${serviceNo}`"
      :subtitle="service ? `${service.operator} · ${stops.length} stops` : undefined"
    />

    <main class="page">
      <template v-if="service">
        <div v-if="service.routes.length > 1" class="directions" role="tablist">
          <button
            v-for="(codes, dir) in service.routes"
            :key="dir"
            class="direction"
            :class="{ active: dir === direction }"
            role="tab"
            :aria-selected="dir === direction"
            type="button"
            @click="setDirection(dir)"
          >
            {{ directionLabel(codes) }}
          </button>
        </div>
        <p v-else class="single-direction">
          <ArrowRightLeft :size="16" />
          {{ service.routes[0] ? directionLabel(service.routes[0]) : "" }}
        </p>

        <ol ref="list" class="timeline card">
          <li
            v-for="({ code, stop }, i) in stops"
            :key="`${code}-${i}`"
            :class="{ current: code === highlight, terminus: i === 0 || i === stops.length - 1 }"
          >
            <RouterLink :to="{ name: 'stop', params: { code } }" class="stop">
              <span class="node" aria-hidden="true" />
              <span class="text">
                <span class="name">{{ stop?.name ?? "Unknown stop" }}</span>
                <span class="meta tnum">{{ code }}<template v-if="stop"> · {{ stop.road }}</template></span>
              </span>
              <span v-if="code === highlight" class="here">Your stop</span>
            </RouterLink>
          </li>
        </ol>
      </template>

      <EmptyState
        v-else-if="data"
        title="Bus service not found"
        :text="`There's no route data for service ${serviceNo}. It may have been withdrawn.`"
      >
        <template #icon><BusFront :size="26" /></template>
        <RouterLink class="btn btn-ghost" :to="{ name: 'search' }">Search again</RouterLink>
      </EmptyState>

      <div v-else class="skeleton" style="height: 420px" />
    </main>
  </div>
</template>

<style scoped>
.directions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  margin-bottom: 14px;
  border-radius: var(--radius);
  background: var(--surface-2);
}

.direction {
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1.25;
  transition: all 0.15s;
}

.direction.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}

.single-direction {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 4px 14px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
}

.timeline {
  margin: 0;
  padding: 8px 0;
  list-style: none;
}

.stop {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px 10px 18px;
  transition: background-color 0.15s;
}

.stop:hover {
  background: var(--surface-2);
}

/* The route line: drawn per row so it runs continuously through each node. */
.stop::before {
  content: "";
  position: absolute;
  left: 25px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent);
  opacity: 0.35;
}

li:first-child .stop::before {
  top: 50%;
}

li:last-child .stop::before {
  bottom: 50%;
}

.node {
  position: relative;
  flex: none;
  width: 18px;
  height: 18px;
  border: 4px solid var(--accent);
  border-radius: 50%;
  background: var(--surface);
}

.terminus .node {
  background: var(--accent);
}

.current {
  background: var(--accent-soft);
}

.current .node {
  width: 22px;
  height: 22px;
  margin-left: -2px;
  margin-right: -2px;
  background: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent);
}

.text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.here {
  flex: none;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 0.6875rem;
  font-weight: 700;
}
</style>
