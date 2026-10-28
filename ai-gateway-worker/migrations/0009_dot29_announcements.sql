-- Prompt 29A: Hạn hiển thị, ẩn, xoá mềm thông báo của cô
ALTER TABLE announcements ADD COLUMN expires_at TEXT;
ALTER TABLE announcements ADD COLUMN hidden_at TEXT;
ALTER TABLE announcements ADD COLUMN deleted_at TEXT;
