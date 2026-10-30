import test from "node:test";
import assert from "node:assert/strict";
import { allQuestions, scenarios, specialQuestionPools, publicQuestionPool } from "../questions.js";
import { buildRun, evaluate, strategies, personas, validateSubmission } from "../engine.js";
import { readStore, emptyStats, applyEvent } from "../storage.js";

const ids = Object.keys(strategies);
function rng(seed = 42) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function answersFor(types, scenario = "dog") { return buildRun(scenario, rng()).map((q, i) => ({ questionId: q.id, strategy: types[i] })); }

test("every actual question supplies four strategy pools with unique alternatives", () => {
  assert.equal(new Set(allQuestions.map((q) => q.id)).size, allQuestions.length);
  for (const q of allQuestions) {
    assert.deepEqual(Object.keys(q.pools).sort(), [...ids].sort());
    for (const pool of Object.values(q.pools)) {
      assert.ok(pool.length >= 2, q.id);
      assert.equal(new Set(pool.map((option) => option.text)).size, pool.length);
    }
  }
});
test("six scenarios produce two own questions and four public questions without duplicates", () => {
  for (const s of scenarios) for (let seed = 1; seed <= 100; seed += 1) {
    const run = buildRun(s.id, rng(seed));
    assert.equal(run.length, 6);
    assert.equal(new Set(run.map((q) => q.id)).size, 6);
    assert.ok(run.slice(0, 2).every((q) => specialQuestionPools[s.id].some((item) => item.id === q.id)));
    assert.ok(run.slice(2).every((q) => publicQuestionPool.some((item) => item.id === q.id)));
    for (const q of run) assert.deepEqual(q.options.map((o) => o.strategy).sort(), [...ids].sort());
  }
});
test("words, questions and option order vary while the same strategy path keeps its score", () => {
  const orders = new Set(), words = new Set(), combinations = new Set();
  for (let seed = 1; seed <= 200; seed += 1) {
    const run = buildRun("pigeon", rng(seed));
    orders.add(run[0].options.map((o) => o.strategy).join());
    run.forEach((q) => q.options.forEach((o) => words.add(o.text)));
    combinations.add(run.map((q) => q.id).join());
    assert.equal(evaluate(run.map((q) => ({ questionId: q.id, strategy: "rigorous" }))).score, 88);
  }
  assert.ok(orders.size > 15);
  assert.ok(words.size > 60);
  assert.ok(combinations.size > 100);
});
test("all eight personas are reachable through real randomized decks in every scenario", () => {
  const paths = {
    rigorous: ["rigorous", "rigorous", "rigorous", "rigorous", "spark", "spark"],
    spark: ["spark", "spark", "spark", "spark", "rigorous", "rigorous"],
    slacker: ["slacker", "slacker", "slacker", "slacker", "rigorous", "rigorous"],
    grind: ["grind", "grind", "grind", "grind", "rigorous", "rigorous"],
    mixed: ["rigorous", "spark", "slacker", "grind", "rigorous", "spark"],
    hiddenSlacker: Array(6).fill("slacker"),
    hiddenGrind: Array(6).fill("grind"),
    hiddenSpark: Array(6).fill("spark")
  };
  assert.deepEqual(Object.keys(paths).sort(), Object.keys(personas).sort());
  for (const scenario of scenarios) for (const [expected, types] of Object.entries(paths)) {
    const result = validateSubmission(scenario.id, answersFor(types, scenario.id));
    assert.equal(result.id, expected, `${scenario.id}/${expected}`);
  }
});
test("regression: four metric totals are divided by both question count and dimension count", () => {
  const result = evaluate(answersFor(Array(6).fill("rigorous")));
  assert.equal(result.score, 88);
  assert.deepEqual(result.metrics, { innovation: 88, frontier: 84, feasibility: 93, resilience: 85 });
  assert.equal(evaluate(answersFor(Array(6).fill("slacker"))).score, 46);
  assert.equal(evaluate(answersFor(Array(6).fill("grind"))).score, 72);
  assert.equal(evaluate(answersFor(Array(6).fill("spark"))).score, 77);
});
test("all 4096 strategy sequences produce finite bounded scores and stable personas", () => {
  const scoreSet = new Set(), personaSet = new Set();
  for (let n = 0; n < 4096; n += 1) {
    const types = Array.from({ length: 6 }, (_, i) => ids[(n >> (i * 2)) & 3]);
    const result = evaluate(answersFor(types));
    assert.ok(Number.isInteger(result.score) && result.score >= 0 && result.score <= 100);
    assert.equal(Object.values(result.points).reduce((a, b) => a + b, 0), 18);
    assert.ok(Object.values(result.metrics).every((v) => v >= 0 && v <= 100));
    assert.equal(evaluate(answersFor(types)).id, result.id);
    scoreSet.add(result.score); personaSet.add(result.id);
  }
  assert.equal(personaSet.size, 8); assert.ok(scoreSet.size > 30);
});
test("server rejects missing, duplicate, unknown and wrong-scenario answers", () => {
  const valid = answersFor(Array(6).fill("rigorous"));
  assert.throws(() => evaluate(valid.slice(1)));
  assert.throws(() => evaluate(Array(6).fill(valid[0])));
  assert.throws(() => evaluate([{ ...valid[0], strategy: "cheat" }, ...valid.slice(1)]));
  assert.throws(() => validateSubmission("printer", valid));
  assert.throws(() => validateSubmission("unknown", valid));
});
test("local statistics start at zero, handle blocked storage, and keep results separately", () => {
  assert.equal(readStore(null).stats.completions, 0);
  assert.equal(readStore({ getItem: () => "broken{" }).stats.views, 0);
  const stats = emptyStats();
  applyEvent(stats, { type: "view", source: "share" });
  applyEvent(stats, { type: "start" });
  const result = evaluate(answersFor(Array(6).fill("slacker")));
  applyEvent(stats, { type: "complete", scenarioId: "dog" }, result);
  assert.equal(stats.views, 1); assert.equal(stats.starts, 1); assert.equal(stats.completions, 1);
  assert.equal(stats.sources.share, 1); assert.equal(stats.personaCounts.hiddenSlacker, 1);
  assert.equal(stats.history[0].score, 46);
  assert.equal("answers" in stats.history[0], false);
});
