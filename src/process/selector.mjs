import { dateDependencies } from "./date-dependencies.mjs";

export function createProcess(processDate, defaults) {
  return async function process(mode = "current", overrides = {}, dependencies = {}) {
    if (!["current", "latest", "all"].includes(mode)) {
      throw new Error(`Unsupported process mode: ${mode}`);
    }
    const d = { ...dateDependencies, ...defaults, ...dependencies };
    const processDateImpl = d.processDate ?? ((date) => processDate(date, overrides, d));
    const dates = await d.availableDates();
    if (!dates.length) throw new Error("No FAA dates");
    const selected =
      mode === "all"
        ? [...dates].reverse()
        : [mode === "latest" ? dates[0] : dates[Math.min(1, dates.length - 1)]];
    return Promise.all(selected.map(processDateImpl));
  };
}
