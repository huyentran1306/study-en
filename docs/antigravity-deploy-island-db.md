# Prompt cho Antigravity: deploy phần đồng bộ DB của Đảo Tám Chuyện (Chit Chat Island)

> Dán nguyên file này cho agent. Mọi lệnh chạy ở thư mục gốc repo `study-en`.

## 1. Bối cảnh

App `study-en` là Next.js 15 (App Router) chạy trên Cloudflare Workers qua `@opennextjs/cloudflare`. Worker tên `study-en`.

Đã thêm game **Đảo Tám Chuyện** (`/island`) và phần lưu tiến độ của người chơi lên **Cloudflare D1**. Code đã viết xong và test xong ở local. **Việc của bạn chỉ là deploy lên production và kiểm tra.** Không viết lại logic.

- Database D1: `study-en-db`, id `f6e2c6e8-d2d0-482d-b98e-efc08d327d06`, binding `DB`. Database này nằm trên **cùng tài khoản Cloudflare đang deploy worker `study-en`**.
- Migration `migrations/0001_island_progress.sql` **đã được apply lên remote** (bảng `island_progress` đã có, đang trống). Vẫn phải kiểm tra lại ở bước 3.
- Hệ thống tài khoản người dùng là một worker khác: `https://d1-template.trann46698.workers.dev/api`, thuộc **tài khoản Cloudflare khác**. **Không đụng vào worker và database đó.** API mới chỉ gọi `GET /users/:uid` của nó để kiểm tra user có tồn tại.

### Các file liên quan

| File | Vai trò |
|---|---|
| `wrangler.jsonc` | Thêm khối `d1_databases` (binding `DB`). Đây là thay đổi duy nhất trong file này. |
| `migrations/0001_island_progress.sql` | Tạo bảng `island_progress` và index `idx_island_progress_xp`. |
| `src/app/api/island/progress/route.ts` | API đọc/ghi tiến độ: `GET ?uid=`, `PUT`/`POST` body `{uid, data}`. |
| `src/lib/island/state.ts` | Chuẩn hoá dữ liệu và gộp tiến độ từ nhiều thiết bị (dùng chung client và server). |
| `src/lib/island/progress.ts` | Engine đồng bộ phía trình duyệt (localStorage `cci-progress-v1` ↔ API). |
| `src/components/island/sync-badge.tsx` | Badge trạng thái đồng bộ trên bản đồ và trang lộ trình. |
| `src/app/api/island-chat/route.ts` | API chat với NPC, dùng Workers AI (binding `AI` đã có sẵn). |
| `src/app/api/island-reflex/route.ts` | API chấm câu trả lời trong Ao Phản Xạ (Workers AI). Không cần thêm binding. |

> Bản cập nhật sau (Ao Phản Xạ, Sổ câu khung, Phát âm, Ao Tôm Cua, hành trình hôm nay...) **không đổi schema DB**: dữ liệu mới nằm trong cột JSON `data` và được chuẩn hoá/gộp trong `src/lib/island/state.ts`. Chỉ cần `npm run deploy` lại, không cần migration mới.

Toàn bộ phần game:

- `src/app/island/`, `src/components/island/`, `src/lib/island/`
- `src/app/api/island/`, `src/app/api/island-chat/`
- `migrations/`
- Sửa nhỏ ở `src/app/page.tsx`, `src/components/navbar.tsx`, `src/components/mobile-bottom-nav.tsx` (thêm link tới /island)

### Schema bảng

```sql
island_progress (
  user_id      TEXT PRIMARY KEY,   -- = localStorage "studyen-uid"
  data         TEXT NOT NULL,      -- JSON IslandState đầy đủ
  xp, lessons_done, words_count, stars INTEGER NOT NULL DEFAULT 0,  -- cột tóm tắt
  start_date   TEXT,
  created_at, updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

## 2. Kiểm tra trước khi deploy

```bash
npx wrangler whoami          # tài khoản phải là tài khoản sở hữu worker study-en
npx wrangler d1 list         # phải thấy study-en-db với id f6e2c6e8-d2d0-482d-b98e-efc08d327d06
npx tsc --noEmit
npm run lint
```

- Nếu `d1 list` **không** thấy `study-en-db`, bạn đang đăng nhập sai tài khoản. **Dừng lại và báo người dùng.** Không tự tạo database mới và không sửa `database_id`.
- Nếu tsc hoặc lint báo lỗi, báo lỗi cho người dùng, không tự ý sửa logic.

## 3. Migration trên D1 remote

```bash
npx wrangler d1 migrations list study-en-db --remote
```

- Nếu báo không còn migration nào chờ (`No migrations to apply`): bỏ qua bước này.
- Nếu `0001_island_progress.sql` vẫn đang chờ:

  ```bash
  npx wrangler d1 migrations apply study-en-db --remote
  ```

Kiểm tra bảng:

```bash
npx wrangler d1 execute study-en-db --remote --command "SELECT name FROM sqlite_master WHERE type IN ('table','index') AND name LIKE '%island%';"
```

Kết quả phải có `island_progress` và `idx_island_progress_xp`.

## 4. Deploy

```bash
npm run deploy               # = opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

- Trong output của wrangler phải có binding `env.DB (study-en-db)` cùng với `env.AI` và `env.ASSETS`.
- Ghi lại URL production mà lệnh in ra. Bên dưới gọi URL đó là `$URL`.

## 5. Kiểm tra sau deploy

```bash
# 1) uid sai định dạng → 400
curl -s -o /dev/null -w "%{http_code}\n" "$URL/api/island/progress?uid=bad%20id"

# 2) uid hợp lệ nhưng chưa có dữ liệu → 200, body {"data":null,"updatedAt":null}
curl -s "$URL/api/island/progress?uid=nobody_123"

# 3) ghi cho user không tồn tại → 403 {"error":"Không tìm thấy người dùng"}
curl -s -X PUT "$URL/api/island/progress" -H "content-type: application/json" \
  -d '{"uid":"definitely-not-a-user-xyz","data":{}}'

# 4) trang game lên được
curl -s -o /dev/null -w "%{http_code}\n" "$URL/island"
```

Nếu một trong các kiểm tra này trả **503 "Database chưa được cấu hình"**, nghĩa là binding `DB` không vào được bản deploy. Kiểm tra lại `wrangler.jsonc` rồi deploy lại.

**Kiểm tra bằng trình duyệt** (nhờ người dùng làm, hoặc tự làm nếu có tài khoản test thật):

1. Đăng nhập trên web, vào `/island`, làm xong 1 bài.
2. Badge phải hiện "Đã lưu lên máy chủ HH:MM".
3. Xem dữ liệu đã vào DB:

   ```bash
   npx wrangler d1 execute study-en-db --remote --command "SELECT user_id, xp, lessons_done, words_count, stars, updated_at FROM island_progress ORDER BY updated_at DESC LIMIT 5;"
   ```

4. Mở trình duyệt khác (hoặc cửa sổ ẩn danh), đăng nhập cùng tài khoản, vào `/island`: tiến độ phải giống bản ở bước 1.

Lưu ý: **không** ghi dữ liệu test bằng id `local-test-...` lên production. Id dạng này chỉ được cho qua khi `NODE_ENV !== "production"`, nên trên production sẽ bị 403. Đó là hành vi đúng.

## 6. Git (chỉ làm khi người dùng yêu cầu commit)

Thư mục làm việc đang có **nhiều file untracked không liên quan**, ví dụ `ai-gateway-worker/_backup_*`, `ai-gateway-worker/scripts/`, `assets/`, `bin/`, `scripts/`, `public/guide/`, `ai-gateway-guide.html`. **Không `git add -A`.** Chỉ add các file của game:

```bash
git add wrangler.jsonc tailwind.config.ts migrations/ src/app/island/ src/components/island/ src/lib/island/ \
  src/app/api/island/ src/app/api/island-chat/ src/app/api/island-reflex/ src/lib/auth-events.ts \
  src/app/page.tsx src/components/navbar.tsx src/components/mobile-bottom-nav.tsx \
  src/components/app-shell.tsx src/components/wotd-badge.tsx \
  docs/antigravity-deploy-island-db.md
git status   # xem lại trước khi commit
```

## 7. Những việc KHÔNG được làm

- Không sửa `database_id`, `database_name` hay `binding` trong `wrangler.jsonc`.
- Không `DROP`, `DELETE` hay `UPDATE` trên bảng `island_progress` ở remote. Bảng này chứa tiến độ thật của học sinh.
- Không đổi quy tắc gộp trong `src/lib/island/state.ts` (`mergeStates`). Quy tắc này được thiết kế để không bao giờ làm mất tiến độ khi nhiều thiết bị cùng ghi.
- Không đụng tới worker `d1-template` và tài khoản Cloudflare `trann46698`.
- Không xoá ngoại lệ `local-test-` trong `route.ts`. Nó chỉ có tác dụng khi chạy dev.

## 8. Xử lý sự cố

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| API trả 503 "Database chưa được cấu hình" | Bản deploy thiếu binding `DB`. Kiểm tra `wrangler.jsonc` rồi deploy lại. |
| API trả 500, log có `no such table: island_progress` | Migration chưa apply lên remote. Làm lại bước 3. |
| User thật bị 403 khi lưu | API `d1-template` trả 404 cho uid đó. Kiểm tra `curl https://d1-template.trann46698.workers.dev/api/users/<uid>`. |
| Badge kẹt ở "Chỉ lưu trên máy này" dù đã đăng nhập | localStorage không có key `studyen-uid`. Đây là phần đăng nhập của app, không phải lỗi của game. |
| Deploy lỗi, cần quay lại bản cũ | `npx wrangler rollback`. Dữ liệu D1 không bị ảnh hưởng. |
| Xem log runtime | `npx wrangler tail study-en` (observability đã bật). |

## 9. Hạn chế đã biết (báo lại người dùng, không cần sửa)

- API không có token, chỉ dựa vào user id, giống các API tài khoản hiện có. Ai biết user id của người khác có thể đọc hoặc ghi tiến độ đảo của người đó. Muốn chặt hơn thì phải thêm token ở worker `d1-template`.
- Nếu học offline trên 2 máy cùng lúc, XP sau khi gộp lấy giá trị lớn nhất chứ không cộng dồn. Bài học, sao và thẻ từ không bị mất.

## 10. Báo cáo khi xong

Gửi lại cho người dùng:

- URL production.
- Kết quả 4 lệnh curl ở bước 5.
- Kết quả `migrations list --remote`.
- Có commit hay không, và commit hash nếu có.
