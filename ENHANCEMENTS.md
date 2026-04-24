# 🌈 Suggested Enhancements for Study-EN App

---

## 📌 Design Direction
> **Tham khảo UI kiểu Duolingo + BiBo** — giao diện dễ thương, nhiều hình minh hoạ cho bé.

- Redesign toàn bộ UI theo phong cách **cute, colorful, child-friendly** (tham khảo Duolingo, BiBo App).
- Sử dụng **grid các chủ đề** với icon/emoji lớn, bo tròn, màu pastel (như hình BiBo: Vegetable, Sport, Alphabet...).
- Có **learning path dạng skill tree** (như Duolingo) — các node tròn nối nhau, unlock dần khi hoàn thành.
- **Mascot dễ thương** xuất hiện khắp app để động viên, hướng dẫn bé.
- Mỗi chủ đề có **themed background** riêng (xanh lá cho rau củ, xanh dương cho biển...).
- Hiệu ứng **confetti, star burst, bounce animation** khi trả lời đúng.
- Hình ảnh minh hoạ dùng **emoji lớn hoặc SVG illustration** cho mỗi từ vựng.

---

## 1. 🖼️ Picture Guessing Game (Đoán từ qua hình)
- **Feature**: Hiển thị hình ảnh (con chó, con mèo, trái cây...) → bé đoán từ tiếng Anh.
- **Implementation**:
  - Grid 2x2 hoặc carousel hiển thị hình minh hoạ (emoji/SVG).
  - Bé chọn đáp án đúng từ 4 lựa chọn (multiple choice) hoặc gõ từ.
  - Có hint: phát âm từ, hiện chữ cái đầu, hiện nghĩa tiếng Việt.
  - Sau khi đúng → phát âm từ bằng Speech Synthesis + animation celebration 🎉.
  - Chia theo chủ đề: Animals, Fruits, Colors, Body Parts, Family...
- **UI**: Card bo tròn lớn, hình ảnh chiếm 60% card, pastel background.

## 2. 🎮 Gamification & Rewards
- XP, coins, stickers cho mỗi câu đúng.
- **Streak system** (chuỗi ngày học liên tục).
- **Skill tree / Learning path** giống Duolingo — unlock chủ đề mới khi hoàn thành.
- **Leaderboard** tuần cho bé so sánh với bạn bè.
- **Achievement badges**: "Animal Expert 🦁", "Veggie Master 🥦", "100 Words 📖"...

## 3. 🎨 Kid-Friendly UI (Giao diện dễ thương)
- Màu sắc: pastel xanh dương (#B3E5FC), hồng (#F8BBD0), vàng (#FFF9C4), xanh lá (#C8E6C9).
- Font: rounded, playful (Nunito, Bubblegum Sans).
- Buttons: bo tròn lớn, có shadow mềm, bounce khi tap.
- Category cards: grid 2 cột, mỗi card có emoji lớn + tên chủ đề (như BiBo).
- Mascot hiện ở góc màn hình, thay đổi biểu cảm theo kết quả.
- Sound effects: "ding!" khi đúng, "oops!" khi sai, nhạc nền nhẹ nhàng.

## 4. 📦 JSON-Based Vocabulary Data (1000 từ Kid + 1000 từ Adult)
- **Cấu trúc file**: `src/data/vocab-kids.json` và `src/data/vocab-adults.json`
- **Schema mỗi từ**:
  ```json
  {
    "id": 1,
    "word": "dog",
    "meaning": "con chó",
    "emoji": "🐕",
    "image": "/images/vocab/dog.svg",
    "category": "animals",
    "difficulty": 1,
    "example": "The dog is running.",
    "pronunciation": "/dɒɡ/"
  }
  ```
- **Chủ đề cho bé** (~1000 từ):
  - 🐾 Animals (farm, pets, wild, sea) — ~120 từ
  - 🍎 Fruits & Vegetables — ~80 từ
  - 🎨 Colors & Shapes — ~40 từ
  - 🔢 Numbers & Counting — ~50 từ
  - 👨‍👩‍👧 Family & People — ~60 từ
  - 🏠 Home & Furniture — ~80 từ
  - 🍽️ Food & Drinks — ~100 từ
  - 👕 Clothes — ~60 từ
  - 🚗 Vehicles & Transport — ~60 từ
  - 🌦️ Weather & Nature — ~60 từ
  - 🏫 School & Stationery — ~70 từ
  - 🎾 Sports & Activities — ~60 từ
  - 💪 Body Parts — ~50 từ
  - 📅 Days, Months, Time — ~50 từ
  - 🎵 Action Verbs (run, jump, eat...) — ~60 từ
- **Chủ đề cho người lớn** (~1000 từ):
  - 💼 Business & Work — ~120 từ
  - 🏥 Health & Medicine — ~80 từ
  - 💻 Technology — ~100 từ
  - ✈️ Travel & Tourism — ~100 từ
  - 🍳 Cooking & Kitchen — ~80 từ
  - 📰 News & Media — ~70 từ
  - 🏛️ Government & Law — ~60 từ
  - 🎓 Education — ~70 từ
  - 💰 Finance & Banking — ~80 từ
  - 🌍 Environment — ~60 từ
  - 🎭 Entertainment & Culture — ~60 từ
  - 🏋️ Fitness & Wellness — ~50 từ
  - 🛒 Shopping & Services — ~70 từ

## 5. 🎤 Speech Recognition & Pronunciation
- Bé bấm nút mic → nói từ → so sánh với phát âm chuẩn.
- Hiển thị điểm accuracy (⭐⭐⭐).
- Phát lại audio chuẩn để bé nghe và lặp lại.

## 6. 📊 Parent Dashboard
- Thống kê: số từ đã học, thời gian học, streak, chủ đề yếu.
- Đặt mục tiêu hàng ngày (ví dụ: 10 từ/ngày).
- Xem lịch sử hoạt động của bé.

## 7. 📱 Offline Mode
- Cache dữ liệu JSON và hình ảnh để học offline.
- Sync lại khi có mạng.