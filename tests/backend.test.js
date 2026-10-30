import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../backend/worker.js";
import { buildRun } from "../engine.js";

function environment() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../backend/migrations/0001_init.sql", import.meta.url), "utf8"));
  const wrap = (sql, values = []) => ({
    bind: (...next) => wrap(sql, next),
    first: async () => db.prepare(sql).get(...values) || null,
    all: async () => ({ results: db.prepare(sql).all(...values) }),
    run: async () => db.prepare(sql).run(...values)
  });
  return { DB: { prepare: wrap }, ADMIN_TOKEN: "private-admin-test-token", SITE_ORIGIN: "https://wqh12.github.io" };
}
const origin = "https://wqh12.github.io";
const event = (type, extra = {}) => ({ id: crypto.randomUUID(), type, visitorId: "visitor-test-12345", runId: "run-test-12345", scenarioId: "dog", source: "xiaohongshu", ...extra });
const post = (env, body, source = origin) => worker.fetch(new Request("https://stats.example/events", { method: "POST", headers: { Origin: source, "Content-Type": "application/json" }, body: JSON.stringify(body) }), env);
const get = (env, path, headers = {}) => worker.fetch(new Request(`https://stats.example${path}`, { headers }), env);
const answers = () => buildRun("dog").map((q) => ({ questionId: q.id, strategy: "slacker" }));

test("backend recalculates scores, deduplicates retries and assigns stable persona ordinals", async () => {
  const env = environment();
  const view = event("view"); await post(env, view); await post(env, view);
  await post(env, event("start"));
  const complete = event("complete", { answers: answers(), score: 100, personaId: "rigorous" });
  const first = await (await post(env, complete)).json();
  assert.equal(first.personaId, "hiddenSlacker"); assert.equal(first.ordinal, 1);
  const retry = await (await post(env, complete)).json(); assert.equal(retry.ordinal, 1);
  const changedId = await (await post(env, { ...complete, id: crypto.randomUUID() })).json(); assert.equal(changedId.ordinal, 1);
  const nextRun = "run-test-next-12345"; await post(env, event("start", { runId: nextRun }));
  const next = await (await post(env, event("complete", { runId: nextRun, answers: answers() }))).json();
  assert.equal(next.ordinal, 2);
  const summary = await (await get(env, "/public-stats")).json();
  assert.equal(summary.views, 1); assert.equal(summary.visitors, 1); assert.equal(summary.completions, 2);
  const admin = await (await get(env, "/admin/stats", { Authorization: `Bearer ${env.ADMIN_TOKEN}` })).json();
  assert.equal(admin.recent[0].score, 46); assert.equal(admin.days.length, 1); assert.equal(admin.sources[0].source, "xiaohongshu");
  assert.equal(JSON.stringify(admin).includes("visitor-test"), false);
});
test("admin token is required, public responses omit identifiers, and off-site writes are refused", async () => {
  const env = environment();
  assert.equal((await get(env, "/admin/stats")).status, 401);
  assert.equal((await get(env, "/admin/stats", { Authorization: "Bearer wrong" })).status, 401);
  assert.equal((await post(env, event("view"), "https://evil.example")).status, 403);
  const preflight = await worker.fetch(new Request("https://stats.example/events", { method: "OPTIONS", headers: { Origin: origin } }), env);
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
  const page = await (await get(env, "/admin")).text();
  assert.equal(page.includes("__PERSONA_NAMES__"), false); assert.equal(page.includes(env.ADMIN_TOKEN), false);
  assert.equal(page.includes("localStorage"), false);
});
test("invalid and unstarted results are rejected without affecting counters", async () => {
  const env = environment();
  assert.equal((await post(env, null)).status, 400);
  assert.equal((await post(env, event("complete", { answers: answers() }))).status, 409);
  await post(env, event("start"));
  const payload = event("complete", { answers: answers() }); payload.answers[0].strategy = "infinite-score";
  assert.equal((await post(env, payload)).status, 400);
  assert.equal((await (await get(env, "/public-stats")).json()).completions, 0);
});
