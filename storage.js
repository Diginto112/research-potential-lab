export const STORAGE_KEY = "research-lab-v2";
export function emptyStats() {
  return { views: 0, starts: 0, completions: 0, shares: 0, rerolls: 0, personaCounts: {}, days: {}, sources: {}, history: [] };
}
export function readStore(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!parsed || parsed.version !== 2) throw new Error("New store");
    const stats = parsed.stats;
    if (!["views", "starts", "completions", "shares", "rerolls"].every((key) => Number.isSafeInteger(stats[key]) && stats[key] >= 0) || !Array.isArray(stats.history) || ![stats.personaCounts, stats.days, stats.sources].every((value) => value && typeof value === "object" && !Array.isArray(value)) || !Array.isArray(parsed.outbox)) throw new Error("Invalid store");
    return parsed;
  } catch { return { version: 2, visitorId: null, stats: emptyStats(), outbox: [] }; }
}
export function applyEvent(stats, event, result = null, day = new Date().toLocaleDateString("en-CA")) {
  const keys = { view: "views", start: "starts", complete: "completions", share: "shares", reroll: "rerolls" };
  const key = keys[event.type];
  if (!key) throw new Error("Unknown event");
  stats[key] += 1;
  stats.days[day] ||= { views: 0, starts: 0, completions: 0, shares: 0, rerolls: 0 };
  stats.days[day][key] += 1;
  if (event.type === "view") stats.sources[event.source] = (stats.sources[event.source] || 0) + 1;
  if (result) {
    stats.personaCounts[result.id] = (stats.personaCounts[result.id] || 0) + 1;
    stats.history.unshift({ personaId: result.id, score: result.score, scenarioId: event.scenarioId, time: new Date().toISOString() });
    stats.history = stats.history.slice(0, 30);
  }
  Object.keys(stats.days).sort().slice(0, -60).forEach((key) => delete stats.days[key]);
  return stats;
}
