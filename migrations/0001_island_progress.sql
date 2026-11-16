-- Tiến độ Chit Chat Island (Đảo Tám Chuyện), 1 dòng / người dùng.
-- data: JSON toàn bộ trạng thái (chương, nhiệm vụ, sổ từ, xp...) — máy chủ gộp (merge) khi nhiều thiết bị cùng ghi.
-- Các cột tóm tắt để sau này làm bảng xếp hạng / thống kê mà không cần parse JSON.
CREATE TABLE IF NOT EXISTS island_progress (
  user_id      TEXT PRIMARY KEY,
  data         TEXT    NOT NULL,
  xp           INTEGER NOT NULL DEFAULT 0,
  lessons_done INTEGER NOT NULL DEFAULT 0,
  words_count  INTEGER NOT NULL DEFAULT 0,
  stars        INTEGER NOT NULL DEFAULT 0,
  start_date   TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_island_progress_xp ON island_progress (xp DESC);
