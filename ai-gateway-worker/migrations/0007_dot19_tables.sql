-- Migration 0007: Dot 19 Tables (Lịch sử phẩm chất, Đổi quà & Thống kê Admin)

-- Bảng 1: badge_events (Lịch sử từng huy hiệu con nhận được)
CREATE TABLE IF NOT EXISTS badge_events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  session_id TEXT,
  trait TEXT NOT NULL,
  sticker_id TEXT NOT NULL,
  subject TEXT,
  problem_type TEXT,
  source TEXT CHECK(source IN ('goi_y', 'chon_khac', 'cu')),
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  timestamp INTEGER
);
CREATE INDEX IF NOT EXISTS idx_badge_events_family_child_created ON badge_events(family_id, child_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_badge_events_dedup ON badge_events(family_id, child_id, timestamp, sticker_id);

-- Bảng 2: reward_events (Mốc con đổi quà 10 sticker)
CREATE TABLE IF NOT EXISTS reward_events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  round INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  sticker_count INTEGER DEFAULT 10,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  timestamp INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reward_events_family_child_created ON reward_events(family_id, child_id, created_at);

-- Bảng 3: analytics_daily (Dữ liệu tổng hợp theo ngày ẩn danh cho Admin)
CREATE TABLE IF NOT EXISTS analytics_daily (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  grade TEXT,
  subject TEXT,
  book_series TEXT,
  problem_type TEXT,
  skill TEXT,
  trait TEXT,
  family_count INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  badge_count INTEGER DEFAULT 0,
  suggested_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, grade, subject, book_series, problem_type, skill, trait)
);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);
