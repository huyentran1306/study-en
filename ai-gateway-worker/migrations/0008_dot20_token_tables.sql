-- Migration 0008: Dot 20 Tables (Đo token thật, Lesson Cache & Eval Runs)

-- 1. Bảng ai_calls (nếu chưa có thì tạo mới đầy đủ)
CREATE TABLE IF NOT EXISTS ai_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id TEXT,
  session_id TEXT,
  endpoint TEXT NOT NULL,
  prompt_id TEXT,
  prompt_version TEXT,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  neurons REAL DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  ms INTEGER DEFAULT 0,
  ok INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'ok',
  error_code TEXT,
  cache_hit INTEGER DEFAULT 0,
  retry_of INTEGER,
  family_hash TEXT,
  estimated INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_calls_created_at ON ai_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_calls_prompt_id ON ai_calls(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_status ON ai_calls(status);

-- 2. Bảng lesson_cache (Bộ nhớ bài giảng đã soạn)
CREATE TABLE IF NOT EXISTS lesson_cache (
  cache_key TEXT PRIMARY KEY,
  problem_hash TEXT NOT NULL,
  normalized_problem TEXT NOT NULL,
  grade TEXT NOT NULL,
  book_series TEXT NOT NULL,
  subject TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  child_profile_hash TEXT,
  lesson_json TEXT NOT NULL,
  tokens_saved INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lesson_cache_problem_hash ON lesson_cache(problem_hash);
CREATE INDEX IF NOT EXISTS idx_lesson_cache_expires_at ON lesson_cache(expires_at);

-- 3. Bảng eval_runs (Lịch sử chạy Bảng điểm AI)
CREATE TABLE IF NOT EXISTS eval_runs (
  id TEXT PRIMARY KEY,
  run_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_cases INTEGER NOT NULL,
  passed_cases INTEGER NOT NULL,
  total_tokens INTEGER DEFAULT 0,
  leak_count INTEGER DEFAULT 0,
  wrong_math_count INTEGER DEFAULT 0,
  ocr_correct_count INTEGER DEFAULT 0,
  voice_correct_count INTEGER DEFAULT 0,
  safety_fallback_pct REAL DEFAULT 0,
  parent_reason_pct REAL DEFAULT 100,
  latency_median_sec REAL DEFAULT 0,
  latency_p95_sec REAL DEFAULT 0,
  server_error_count INTEGER DEFAULT 0,
  metrics_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eval_runs_run_at ON eval_runs(run_at);
