import { scenarios } from "./questions.js";
import { buildRun, evaluate, personas, strategies, metricNames } from "./engine.js";
import { analyticsBaseUrl } from "./config.js";
import { readStore, applyEvent, emptyStats, STORAGE_KEY } from "./storage.js";

const $ = (selector) => document.querySelector(selector);
let storage = null;
try { storage = window.localStorage; } catch { /* Private mode can deny storage. */ }
const saved = readStore(storage);
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
saved.visitorId ||= uuid();
const sourceParam = new URLSearchParams(location.search).get("from");
const source = ["xiaohongshu", "share", "github", "wechat"].includes(sourceParam) ? sourceParam : "direct";
let persistent = Boolean(storage);
let sending = false;
let serverStats = null;
let lastCompletion = null;
let lastFocus = null;
let toastTimer;
const apiBase = analyticsBaseUrl.replace(/\/$/, "");
const state = { phase: "landing", scenario: null, queue: [], answers: [], selected: null, index: 0, rerollUsed: false, runId: null, result: null };

function persist() {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { persistent = false; }
  $("#storageNotice").hidden = persistent;
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("is-visible"), 3500);
}
function setText(selector, text) { $(selector).textContent = text; }
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function showScreen(name) {
  for (const id of ["landing", "quiz", "result"]) $(`#${id}Screen`).hidden = name !== id;
  window.scrollTo({ top: 0, behavior: "instant" });
}
function refreshLandingCount() {
  setText("#landingUnlockCount", serverStats ? `${serverStats.completions.toLocaleString()} 次全站测试完成` : `本机已完成 ${saved.stats.completions} 次测试`);
  setText("#statsConnection", apiBase ? (serverStats ? "全站统计已连接" : "全站统计暂不可用，以下显示本机记录") : "这里是这台设备的记录，不代表全站人数。清除浏览器数据后会重置。");
}

function record(type, result = null) {
  const event = { id: uuid(), visitorId: saved.visitorId, type, source, runId: state.runId, scenarioId: state.scenario?.id };
  if (type === "complete") event.answers = state.answers.map(({ questionId, strategy }) => ({ questionId, strategy }));
  applyEvent(saved.stats, event, result);
  if (apiBase) saved.outbox.push(event);
  persist();
  refreshLandingCount();
  void flushEvents();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timeout); }
}
async function refreshServerStats() {
  if (!apiBase) return;
  try { serverStats = await fetchWithTimeout(`${apiBase}/public-stats`); }
  catch { serverStats = null; }
  refreshLandingCount();
}
async function flushEvents() {
  if (!apiBase || sending) return;
  sending = true;
  try {
    while (saved.outbox.length) {
      const event = saved.outbox[0];
      const response = await fetchWithTimeout(`${apiBase}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) });
      saved.outbox.shift();
      persist();
      if (event.type === "complete" && state.runId === event.runId) {
        lastCompletion = response;
        renderUnlockNumber();
      }
    }
    await refreshServerStats();
  } catch { serverStats = null; refreshLandingCount(); }
  finally { sending = false; }
}

function startQuiz() {
  state.phase = "scenario";
  state.scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  state.queue = [];
  state.answers = [];
  state.selected = null;
  state.index = 0;
  state.rerollUsed = false;
  state.result = null;
  state.runId = uuid();
  lastCompletion = null;
  record("start");
  renderScenario();
  showScreen("quiz");
  $("#quizTitle").focus();
}
function progress(label, percent) {
  setText("#progressLabel", label);
  setText("#progressPercent", `${percent}%`);
  $("#progressValue").style.width = `${percent}%`;
}
function renderScenario() {
  progress("先挑一个科研现场", 0);
  setText("#questionIndex", "✦");
  setText("#questionType", "观察现场");
  setText("#quizTitle", state.scenario.title);
  setText("#questionContext", state.scenario.context);
  $("#scenarioActions").hidden = false;
  $("#answerList").hidden = true;
  $("#answerFooter").hidden = true;
  $("#rerollButton").disabled = state.rerollUsed;
  $("#rerollButton").classList.toggle("is-used", state.rerollUsed);
  setText("#rerollButton", state.rerollUsed ? "本轮换题机会已用完" : "换个问题（仅 1 次）");
}
function renderQuestion() {
  const question = state.queue[state.index];
  progress(`第 ${state.index + 1} / ${state.queue.length} 题`, Math.round(state.index / state.queue.length * 100));
  setText("#questionIndex", String(state.index + 1).padStart(2, "0"));
  setText("#questionType", `${question.type} · ${question.source === "special" ? "现场专属" : "科研日常"}`);
  setText("#quizTitle", question.title);
  setText("#questionContext", question.context);
  $("#scenarioActions").hidden = true;
  $("#answerList").hidden = false;
  $("#answerFooter").hidden = false;
  $("#answerList").replaceChildren();
  state.selected = null;
  $("#nextButton").disabled = true;
  setText("#nextButton", state.index === state.queue.length - 1 ? "生成我的科研人格 →" : "确认选择 →");
  setText("#selectionHint", "先选一个最像你的答案");
  question.options.forEach((option, index) => {
    const button = node("button", "answer-option");
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.append(node("span", "answer-letter", String.fromCharCode(65 + index)), node("span", "answer-copy", option.text));
    button.addEventListener("click", () => {
      state.selected = index;
      $("#answerList").querySelectorAll("button").forEach((other, i) => {
        other.classList.toggle("is-selected", i === index);
        other.setAttribute("aria-pressed", String(i === index));
      });
      $("#nextButton").disabled = false;
      setText("#selectionHint", "已选好，科研命运开始发生微小变化");
    });
    $("#answerList").append(button);
  });
  $("#quizTitle").focus();
}
function finishQuiz() {
  state.phase = "result";
  state.result = evaluate(state.answers);
  record("complete", state.result);
  renderResult();
  showScreen("result");
  $("#resultTitle").focus();
}
function renderUnlockNumber() {
  if (!state.result) return;
  const count = saved.stats.personaCounts[state.result.id] || 0;
  setText("#resultRank", lastCompletion ? "GLOBAL RECORD" : "LOCAL RECORD");
  setText("#resultUnlockNumber", lastCompletion?.ordinal ? `全站第 ${lastCompletion.ordinal} 次解锁该人格` : `本机第 ${count} 次解锁该人格`);
}
function renderResult() {
  const result = state.result;
  setText("#resultBadge", result.badge);
  setText("#resultTitle", result.name);
  setText("#resultDescription", result.description);
  setText("#scoreComment", result.comment);
  setText("#overallScore", result.score);
  setText("#resultFootnote", `纯属娱乐。${state.scenario.ending}`);
  $("#resultTags").replaceChildren(...result.tags.map((tag) => node("span", "result-tag", tag)));
  $("#scoreRing").style.background = `conic-gradient(var(--blue) ${result.score * 3.6}deg, var(--paper-deep) 0deg)`;
  for (const metric of metricNames) {
    const row = $(`[data-metric="${metric}"]`);
    row.querySelector("b").textContent = result.metrics[metric];
    row.querySelector("i").style.width = `${result.metrics[metric]}%`;
  }
  $("#tendencyList").replaceChildren(...result.ranking.map(([id, points]) => {
    const row = node("div", "tendency-row");
    row.append(node("span", "", strategies[id].name));
    const track = node("div", "metric-track");
    const bar = node("i");
    bar.style.width = `${points / 18 * 100}%`;
    track.append(bar); row.append(track);
    return row;
  }));
  renderUnlockNumber();
  const unlocked = Object.keys(saved.stats.personaCounts).filter((id) => personas[id]);
  setText("#collectionCount", `本机已解锁 ${unlocked.length} / ${Object.keys(personas).length}`);
  $("#personaCollection").replaceChildren(...Object.entries(personas).map(([id, persona]) => {
    const known = unlocked.includes(id);
    return node("div", `collection-item ${known ? "is-unlocked" : ""}`, known ? `${persona.badge} ${persona.name}` : persona.hidden ? "? 隐藏人格 · 待解锁" : "? 普通人格 · 待解锁");
  }));
}

function showStats() {
  lastFocus = document.activeElement;
  setText("#statViews", saved.stats.views);
  setText("#statStarts", saved.stats.starts);
  setText("#statCompletions", saved.stats.completions);
  setText("#statPersonas", Object.keys(saved.stats.personaCounts).length);
  setText("#statShares", saved.stats.shares);
  setText("#statRate", saved.stats.starts ? `${Math.round(saved.stats.completions / saved.stats.starts * 100)}%` : "—");
  setText("#globalSummary", serverStats ? `全站访问 ${serverStats.views} 次 · 匿名设备 ${serverStats.visitors} 台 · 完成 ${serverStats.completions} 次` : "尚无可用的全站统计");
  $("#statsDistribution").replaceChildren(...Object.entries(saved.stats.personaCounts).sort((a, b) => b[1] - a[1]).filter(([id]) => personas[id]).map(([id, count]) => node("p", "stats-row", `${personas[id].name} · ${count} 次`)));
  if (!saved.stats.completions) $("#statsDistribution").append(node("p", "modal-copy", "完成一次测试，就会留下第一条人格记录。"));
  $("#statsHistory").replaceChildren(...saved.stats.history.slice(0, 5).map((entry) => node("p", "stats-row", `${new Date(entry.time).toLocaleDateString()} · ${personas[entry.personaId]?.name || "未知人格"} · ${entry.score} 分`)));
  $("#statsModal").hidden = false;
  $("#closeStatsButton").focus();
}
function closeStats() { $("#statsModal").hidden = true; lastFocus?.focus(); }
function downloadStats() {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), scope: "this-browser", stats: saved.stats }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = node("a"); a.href = url; a.download = "research-lab-local-stats.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function shareResult() {
  const result = state.result;
  const url = new URL(location.href); url.search = "?from=share"; url.hash = "";
  const text = `我测出了「${result.name}」，科研指数 ${result.score} 分。你是卷王、咸鱼还是抽象派？`;
  try {
    if (navigator.share) await navigator.share({ title: "科研潜力实验室", text, url: url.href });
    else { await navigator.clipboard.writeText(`${text}\n${url.href}`); toast("文案和链接已复制，发给你的科研搭子吧！"); }
    record("share");
  } catch (error) { if (error.name !== "AbortError") toast("可以截图分享结果，或复制浏览器地址发给朋友。"); }
}

$("#startButton").addEventListener("click", startQuiz);
$("#restartButton").addEventListener("click", startQuiz);
$("#howButton").addEventListener("click", () => toast("随机现场，可换一次；专属题 2 道 + 科研日常 4 道。选项每次重新抽取和排序，放心凭直觉选。"));
for (const selector of ["#brandButton", "#backToLandingButton"]) $(selector).addEventListener("click", () => { state.phase = "landing"; showScreen("landing"); });
$("#acceptScenarioButton").addEventListener("click", () => {
  if (state.phase !== "scenario") return;
  state.queue = buildRun(state.scenario.id); state.phase = "quiz"; renderQuestion();
});
$("#rerollButton").addEventListener("click", () => {
  if (state.phase !== "scenario" || state.rerollUsed) return;
  const options = scenarios.filter((s) => s.id !== state.scenario.id);
  state.scenario = options[Math.floor(Math.random() * options.length)]; state.rerollUsed = true;
  record("reroll"); renderScenario();
});
$("#nextButton").addEventListener("click", () => {
  if (state.phase !== "quiz" || state.selected === null) return;
  const answer = state.queue[state.index].options[state.selected];
  state.answers.push({ questionId: answer.questionId, strategy: answer.strategy });
  state.selected = null;
  if (state.answers.length === state.queue.length) finishQuiz();
  else { state.index += 1; renderQuestion(); window.scrollTo({ top: 0, behavior: "instant" }); }
});
$("#shareButton").addEventListener("click", shareResult);
for (const selector of ["#statsButton", "#resultStatsButton"]) $(selector).addEventListener("click", showStats);
$("#closeStatsButton").addEventListener("click", closeStats);
$("#statsModal").addEventListener("click", (event) => { if (event.target === $("#statsModal")) closeStats(); });
$("#exportStatsButton").addEventListener("click", downloadStats);
$("#resetStatsButton").addEventListener("click", () => {
  if (!confirm("清除这台设备的统计、历史和人格图鉴？全站数据不会受影响。")) return;
  saved.stats = emptyStats(); persist(); refreshLandingCount(); closeStats();
  if (state.result) renderResult();
  toast("本机记录已清除");
});
document.addEventListener("keydown", (event) => {
  if ($("#statsModal").hidden) return;
  if (event.key === "Escape") closeStats();
  if (event.key === "Tab") {
    const buttons = [...$("#statsModal").querySelectorAll("button")];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.addEventListener("online", () => void flushEvents());
record("view");
void refreshServerStats();
