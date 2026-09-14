CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS engagements_updated_at ON engagements(updated_at);
