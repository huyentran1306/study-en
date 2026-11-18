// Bản đồ "2.5D": thêm khối sáng tối cho cây, bóng đổ dưới gốc, ánh nắng và viền cỏ.
// Biến đổi chuỗi MAP_BG gốc một lần lúc tải module, không sửa file art.ts.
import { MAP_BG } from "./art";

const DEFS = `<defs>
<radialGradient id="g3Tree" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#9DD47A"/><stop offset=".45" stop-color="#5E9B4C"/><stop offset="1" stop-color="#3B6E2E"/></radialGradient>
<radialGradient id="g3Ground" cx="30%" cy="18%" r="95%"><stop offset="0" stop-color="#B5DE84"/><stop offset=".55" stop-color="#9CCB6A"/><stop offset="1" stop-color="#7DB04E"/></radialGradient>
<radialGradient id="g3Pond" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#D4F1F8"/><stop offset=".6" stop-color="#9BD6E6"/><stop offset="1" stop-color="#6BB8D2"/></radialGradient>
<linearGradient id="g3Path" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="800"><stop offset="0" stop-color="#F3E1B4"/><stop offset="1" stop-color="#E4C98E"/></linearGradient>
</defs>`;

/** Bóng đổ dưới tán cây (toạ độ cục bộ của nhóm cây). */
const TREE_SHADOW = `<ellipse cx="10" cy="46" rx="38" ry="10" fill="#2E5A1E" opacity=".22"></ellipse>`;

function enhance(src: string): string {
  let s = src;
  // Nền cỏ: chuyển màu phẳng thành nắng chiếu từ góc trên trái.
  s = s.replace(`fill="#9CCB6A"></rect>`, `fill="url(#g3Ground)"></rect>`);
  // Tán cây: khối tròn có sáng tối.
  s = s.split(`r="40" fill="#5E9B4C"`).join(`r="40" fill="url(#g3Tree)"`);
  // Bóng đổ dưới mỗi cây.
  s = s.split(`<g class="tree"`).join(`${TREE_SHADOW}<g class="tree"`);
  // Hồ: nước có độ sâu.
  s = s.replace(`fill="#9BD6E6"`, `fill="url(#g3Pond)"`);
  // Đường đất: sáng ở trên, đậm dần xuống dưới.
  s = s.replace(`stroke="#EBD5A2" stroke-width="46"`, `stroke="url(#g3Path)" stroke-width="46"`);
  return DEFS + s;
}

export const MAP_BG_3D = enhance(MAP_BG);
