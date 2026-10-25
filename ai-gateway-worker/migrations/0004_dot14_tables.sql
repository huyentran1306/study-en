-- Migration 0004: Dot 14 Tables (Ba tính năng AI vòng chung kết)
-- 1. guard_log: Nhật ký chặn lộ đáp án & vi phạm an toàn
CREATE TABLE IF NOT EXISTS guard_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  prompt_id TEXT,
  field TEXT,
  before_text TEXT,
  after_text TEXT,
  outcome TEXT CHECK(outcome IN ('regenerated','fallback','leaked'))
);
CREATE INDEX IF NOT EXISTS idx_guard_log_family_created ON guard_log(family_id, created_at);

-- 2. work_checks: Chấm vở, không sửa hộ (Phần A)
CREATE TABLE IF NOT EXISTS work_checks (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  session_id TEXT,
  recheck_of TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  problem_text TEXT,
  lines_json TEXT,
  lines_edited INTEGER DEFAULT 0,
  result TEXT,
  first_wrong_line INTEGER,
  error_type TEXT,
  machine_json TEXT,
  ai_uncertain INTEGER DEFAULT 0,
  guard_status TEXT,
  self_fixed INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_work_checks_family_created ON work_checks(family_id, created_at);
CREATE INDEX IF NOT EXISTS idx_work_checks_child ON work_checks(child_id);

-- 3. teach_backs: Nghe con giảng lại (Phần B)
CREATE TABLE IF NOT EXISTS teach_backs (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  round INTEGER DEFAULT 1,
  duration_s INTEGER DEFAULT 0,
  transcript TEXT,
  criteria_json TEXT,
  ai_level TEXT,
  final_level TEXT,
  guard_status TEXT,
  latency_ms INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_teach_backs_family_created ON teach_backs(family_id, created_at);
CREATE INDEX IF NOT EXISTS idx_teach_backs_session ON teach_backs(session_id);

-- 4. ai_feedback: Phụ huynh báo câu hỏi AI chưa hợp (Phần C)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  session_id TEXT,
  prompt_id TEXT,
  step INTEGER,
  reason TEXT CHECK(reason IN ('leak','too_hard','wrong','teacher_way')),
  note TEXT,
  question_text TEXT,
  status TEXT CHECK(status IN ('open','closed','example')) DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  closed_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_family_created ON ai_feedback(family_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_status ON ai_feedback(status);
