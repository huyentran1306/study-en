-- Ghé đảo bạn bè: người học tự chọn chia sẻ một "ảnh chụp" đảo (chỉ thông tin công khai: tên hiển thị, cấp đảo, ao, vườn, cúp).
-- Bạn bè mở bằng mã 6 ký tự và để lại lời nhắn bằng tiếng Anh. Không chứa hồ sơ, ký ức hay lỗi sai của người học.
CREATE TABLE IF NOT EXISTS island_share (
  code        TEXT PRIMARY KEY,
  owner_key   TEXT    NOT NULL,
  name        TEXT    NOT NULL DEFAULT '',
  snapshot    TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS island_notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT    NOT NULL,
  from_name   TEXT    NOT NULL DEFAULT '',
  text        TEXT    NOT NULL,
  fixed       TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_island_notes_code ON island_notes (code, id DESC);
