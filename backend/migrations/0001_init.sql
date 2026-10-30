CREATE TABLE IF NOT EXISTS events (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('view','start','complete','share','reroll')),
  visitor_id TEXT NOT NULL,
  run_id TEXT,
  scenario_id TEXT,
  source TEXT NOT NULL,
  persona_id TEXT,
  score INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_result_per_run ON events(run_id, type) WHERE type IN ('start','complete','reroll');
CREATE INDEX IF NOT EXISTS events_by_date ON events(created_at);
CREATE INDEX IF NOT EXISTS events_by_persona ON events(persona_id, type, sequence);
