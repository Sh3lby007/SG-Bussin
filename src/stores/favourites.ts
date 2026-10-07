import { defineStore } from "pinia";

interface State {
  /** stopCode -> true */
  favouriteBusStops: Record<string, boolean>;
  /** `${serviceNo}-${stopCode}` -> true */
  favouriteBusServices: Record<string, boolean>;
  query: string;
}

// The "card" id and state shape match the original app, so favourites already
// saved in localStorage carry over after the redesign.
export const useFavourites = defineStore("card", {
  state: (): State => ({
    favouriteBusStops: {},
    favouriteBusServices: {},
    query: "",
  }),

  getters: {
    stopCodes: (state) => Object.keys(state.favouriteBusStops),
    services: (state) =>
      Object.keys(state.favouriteBusServices).map((key) => {
        const [serviceNo = "", stopCode = ""] = key.split("-");
        return { key, serviceNo, stopCode };
      }),
  },

  actions: {
    isStopSaved(stopCode: string) {
      return this.favouriteBusStops[stopCode] === true;
    },
    toggleStop(stopCode: string) {
      if (this.isStopSaved(stopCode)) delete this.favouriteBusStops[stopCode];
      else this.favouriteBusStops[stopCode] = true;
    },
    isServicePinned(serviceNo: string, stopCode: string) {
      return this.favouriteBusServices[`${serviceNo}-${stopCode}`] === true;
    },
    toggleService(serviceNo: string, stopCode: string) {
      const key = `${serviceNo}-${stopCode}`;
      if (this.favouriteBusServices[key]) delete this.favouriteBusServices[key];
      else this.favouriteBusServices[key] = true;
    },
  },

  persist: {
    pick: ["favouriteBusStops", "favouriteBusServices"],
  },
});
