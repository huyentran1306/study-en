-- Migration 0006: Dot 18 Tables (Gấu nhớ con & Phân tích tiến bộ trung thực)
-- Bảng 1: learning_events (Sự kiện học tập từng bước của con)
CREATE TABLE IF NOT EXISTS learning_events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  subject TEXT,
  problem_type TEXT,
  step_no INTEGER NOT NULL,
  skill TEXT NOT NULL,
  result TEXT CHECK(result IN ('tu_lam','can_goi_y','me_dan')),
  hints_used INTEGER DEFAULT 0,
  micro_steps INTEGER DEFAULT 0,
  voice_verdict TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, step_no)
);
CREATE INDEX IF NOT EXISTS idx_learning_events_family_child_created ON learning_events(family_id, child_id, created_at);
CREATE INDEX IF NOT EXISTS idx_learning_events_family_child_skill ON learning_events(family_id, child_id, skill);

-- Bảng 2: progress_reports (Báo cáo phân tích tiến bộ trung thực từ dữ kiện 28 ngày)
CREATE TABLE IF NOT EXISTS progress_reports (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  from_date TEXT NOT NULL,
  to_date TEXT NOT NULL,
  sessions_read INTEGER DEFAULT 0,
  report_json TEXT NOT NULL,
  fact_basis_json TEXT,
  model TEXT,
  latency_ms INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_progress_reports_family_child_created ON progress_reports(family_id, child_id, created_at);
