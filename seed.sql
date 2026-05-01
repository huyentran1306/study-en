-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example TEXT,
  phonetic TEXT,
  emoji TEXT,
  category TEXT,
  learned BOOLEAN,
  created_at DATETIME
);

-- Tạo bảng daily_challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options TEXT,
  hint TEXT
);

-- Dữ liệu mẫu cho vocabulary
INSERT INTO vocabulary (word, meaning, example, phonetic, emoji, category, learned, created_at) VALUES
  ('Eloquent', 'Fluent or persuasive in speaking or writing', 'She gave an eloquent speech at the conference.', '/ˈeləkwənt/', '🗣️', 'Communication', 0, '2026-04-30T00:00:00.000Z'),
  ('Perseverance', 'Persistence in doing something despite difficulty', 'His perseverance paid off when he finally passed the exam.', '/ˌpɜːrsəˈvɪrəns/', '💪', 'Character', 0, '2026-04-30T00:00:00.000Z'),
  ('Ubiquitous', 'Present, appearing, or found everywhere', 'Smartphones have become ubiquitous in modern society.', '/juːˈbɪkwɪtəs/', '🌍', 'Adjective', 0, '2026-04-30T00:00:00.000Z'),
  ('Pragmatic', 'Dealing with things sensibly and realistically', 'We need a pragmatic approach to solve this problem.', '/præɡˈmætɪk/', '🧠', 'Character', 0, '2026-04-30T00:00:00.000Z'),
  ('Ambiguous', 'Open to more than one interpretation; not clear', 'The contract was ambiguous and led to confusion.', '/æmˈbɪɡjuəs/', '🤔', 'Adjective', 0, '2026-04-30T00:00:00.000Z'),
  ('Resilient', 'Able to recover quickly from difficulties', 'Children are often more resilient than adults think.', '/rɪˈzɪliənt/', '🌱', 'Character', 0, '2026-04-30T00:00:00.000Z'),
  ('Inevitable', 'Certain to happen; unavoidable', 'Change is inevitable in any growing organization.', '/ɪˈnevɪtəbl/', '⏳', 'Adjective', 0, '2026-04-30T00:00:00.000Z'),
  ('Comprehensive', 'Including all or nearly all elements or aspects', 'The report provides a comprehensive overview of the market.', '/ˌkɒmprɪˈhensɪv/', '📋', 'Adjective', 0, '2026-04-30T00:00:00.000Z'),
  ('Enthusiasm', 'Intense and eager enjoyment, interest, or approval', 'She approached every task with great enthusiasm.', '/ɪnˈθjuːziæzəm/', '🔥', 'Emotion', 0, '2026-04-30T00:00:00.000Z'),
  ('Gratitude', 'The quality of being thankful; readiness to show appreciation', 'He expressed his gratitude for all the help he received.', '/ˈɡrætɪtjuːd/', '🙏', 'Emotion', 0, '2026-04-30T00:00:00.000Z');

-- Dữ liệu mẫu cho daily_challenges
INSERT INTO daily_challenges (type, question, answer, options, hint) VALUES
  ('fill-blank', 'She was so ___ that everyone listened to her speech carefully.', 'eloquent', '["eloquent","ambiguous","reluctant","pragmatic"]', 'It means fluent or persuasive in speaking 🗣️'),
  ('translate', 'What does "perseverance" mean? 💪', 'Persistence in doing something despite difficulty', '["Persistence in doing something despite difficulty","The act of giving up easily","Being very talented at something","Speaking multiple languages"]', 'Think about not giving up'),
  ('fill-blank', 'The instructions were ___, so nobody understood what to do.', 'ambiguous', '["comprehensive","ambiguous","resilient","ubiquitous"]', 'It means unclear or open to interpretation 🤔');
