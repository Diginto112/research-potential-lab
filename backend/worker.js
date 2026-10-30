import { validateSubmission, personas } from "../engine.js";
import { scenarios } from "../questions.js";
import { adminHtml } from "./admin.js";

const summarySql = `SELECT COUNT(CASE WHEN type='view' THEN 1 END) views,
  COUNT(DISTINCT CASE WHEN type='view' THEN visitor_id END) visitors,
  COUNT(CASE WHEN type='start' THEN 1 END) starts,
  COUNT(CASE WHEN type='complete' THEN 1 END) completions,
  COUNT(CASE WHEN type='share' THEN 1 END) shares FROM events`;
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{8,90}$/.test(value);
const validTypes = ["view", "start", "complete", "share", "reroll"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowed = origin === env.SITE_ORIGIN;
    const cors = { "Vary": "Origin", "Cache-Control": "no-store", ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}) };
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
    if (request.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: { ...cors, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "3600" } });
    try {
      if (url.pathname === "/admin" && request.method === "GET") {
        const names = JSON.stringify(Object.fromEntries(Object.entries(personas).map(([id, p]) => [id, p.name])));
        return new Response(adminHtml.replace("__PERSONA_NAMES__", names), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" } });
      }
      if (url.pathname === "/admin/stats" && request.method === "GET") {
        if (!env.ADMIN_TOKEN || request.headers.get("Authorization") !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: "Unauthorized" }, 401);
        const [summary, distribution, days, sources, recent] = await Promise.all([
          env.DB.prepare(summarySql).first(),
          env.DB.prepare("SELECT persona_id AS personaId, COUNT(*) count FROM events WHERE type='complete' GROUP BY persona_id ORDER BY count DESC").all(),
          env.DB.prepare("SELECT substr(created_at,1,10) day, SUM(type='view') views, SUM(type='start') starts, SUM(type='complete') completions, SUM(type='share') shares FROM events WHERE created_at >= strftime('%Y-%m-%dT00:00:00Z','now','-29 days') GROUP BY day ORDER BY day DESC").all(),
          env.DB.prepare("SELECT source, COUNT(*) views FROM events WHERE type='view' GROUP BY source ORDER BY views DESC").all(),
          env.DB.prepare("SELECT created_at createdAt, persona_id personaId, score FROM events WHERE type='complete' ORDER BY sequence DESC LIMIT 20").all()
        ]);
        return json({ summary, personas: distribution.results, days: days.results, sources: sources.results, recent: recent.results });
      }
      if (url.pathname === "/public-stats" && request.method === "GET") return json(await env.DB.prepare(summarySql).first());
      if (url.pathname !== "/events" || request.method !== "POST") return json({ error: "Not found" }, 404);
      if (!allowed) return json({ error: "Origin not allowed" }, 403);
      if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json({ error: "JSON required" }, 415);
      const raw = await request.text();
      if (raw.length > 8192) return json({ error: "Payload too large" }, 413);
      let event;
      try { event = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }
      if (!event || !validTypes.includes(event.type) || !validId(event.id) || !validId(event.visitorId)) return json({ error: "Invalid event" }, 400);
      if (event.type !== "view" && (!validId(event.runId) || !scenarios.some((s) => s.id === event.scenarioId))) return json({ error: "Invalid run" }, 400);
      const source = ["direct", "share", "xiaohongshu", "wechat", "github"].includes(event.source) ? event.source : "direct";
      let result = null;
      if (event.type === "complete") {
        try { result = validateSubmission(event.scenarioId, event.answers); }
        catch { return json({ error: "Invalid answers" }, 400); }
        const start = await env.DB.prepare("SELECT visitor_id FROM events WHERE run_id=? AND type='start'").bind(event.runId).first();
        if (!start || start.visitor_id !== event.visitorId) return json({ error: "Start event required" }, 409);
      }
      // Conflict handling deduplicates retries by event ID and completions by run ID.
      await env.DB.prepare("INSERT INTO events(id,type,visitor_id,run_id,scenario_id,source,persona_id,score) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING")
        .bind(event.id, event.type, event.visitorId, event.type === "view" ? null : event.runId, event.scenarioId || null, source, result?.id || null, result?.score ?? null).run();
      if (result) {
        const row = await env.DB.prepare("SELECT sequence,persona_id,visitor_id FROM events WHERE run_id=? AND type='complete'").bind(event.runId).first();
        if (!row || row.visitor_id !== event.visitorId) return json({ error: "Event conflict" }, 409);
        const ordinal = await env.DB.prepare("SELECT COUNT(*) ordinal FROM events WHERE type='complete' AND persona_id=? AND sequence<=?").bind(row.persona_id, row.sequence).first();
        return json({ ok: true, personaId: row.persona_id, ordinal: ordinal.ordinal });
      }
      return json({ ok: true });
    } catch {
      return json({ error: "Statistics temporarily unavailable" }, 503);
    }
  }
};
