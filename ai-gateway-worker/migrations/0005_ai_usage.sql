-- Migration 0005: Bảng ghi nhận mức tiêu thụ Neurons (Quota Tracker)
CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT NOT NULL,
  scope TEXT NOT NULL,
  neurons REAL DEFAULT 0,
  calls INTEGER DEFAULT 0,
  PRIMARY KEY (day, scope)
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_day ON ai_usage(day);
