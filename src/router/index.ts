import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

// Hash history: GitHub Pages has no SPA fallback, so deep links must live after the #.
const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/search", name: "search", component: () => import("@/views/SearchView.vue") },
    {
      path: "/stop/:code",
      name: "stop",
      component: () => import("@/views/StopView.vue"),
      props: true,
    },
    {
      // ?stop=<code> highlights that stop and picks the direction serving it; ?dir=0|1 forces a direction.
      path: "/service/:serviceNo",
      name: "service",
      component: () => import("@/views/ServiceView.vue"),
      props: true,
    },

    // Links and home-screen bookmarks from the previous version of the app.
    { path: "/timing/:busStopID/:busStopName?", redirect: (to) => `/stop/${to.params.busStopID}` },
    {
      path: "/busroute/:busNumber/:target",
      redirect: (to) => {
        const target = String(to.params.target);
        const query = /^\d{5}$/.test(target) ? { stop: target } : { dir: target };
        return { path: `/service/${to.params.busNumber}`, query };
      },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

export default router;
