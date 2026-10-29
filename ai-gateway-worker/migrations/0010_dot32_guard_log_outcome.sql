-- Migration 0010: Bo CHECK constraint tren cot outcome cua guard_log
-- Cho phep cac outcome moi: xin_dap_an, sua_bac_chung_chung, sua_phep_tinh, chan_an_toan
CREATE TABLE guard_log_dg_tmp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  prompt_id TEXT,
  field TEXT,
  before_text TEXT,
  after_text TEXT,
  outcome TEXT
);
INSERT INTO guard_log_dg_tmp (id, family_id, session_id, created_at, prompt_id, field, before_text, after_text, outcome)
  SELECT id, family_id, session_id, created_at, prompt_id, field, before_text, after_text, outcome FROM guard_log;
DROP TABLE guard_log;
ALTER TABLE guard_log_dg_tmp RENAME TO guard_log;
CREATE INDEX IF NOT EXISTS idx_guard_log_family_created ON guard_log(family_id, created_at);
