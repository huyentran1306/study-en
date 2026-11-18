// Tự chỉnh độ khó: dựa trên 3 phiếu nhận xét gần nhất, cư dân nói dễ hơn hoặc khó hơn.
// File thuần (không "use client").
import type { IslandState } from "./state";

/** -1 = đang vất vả (nói dễ lại), 0 = vừa sức, 1 = đang tốt (nâng độ khó). */
export function adaptLevel(s: Pick<IslandState, "reports">): -1 | 0 | 1 {
  const last = s.reports.slice(-3);
  if (last.length < 2) return 0;
  const avg = last.reduce((n, r) => n + (r.f + r.a + r.r + r.i) / 4, 0) / last.length;
  return avg < 2.3 ? -1 : avg > 3.7 ? 1 : 0;
}

export const ADAPT_VI: Record<-1 | 0 | 1, string> = {
  [-1]: "Cư dân đang nói chậm và dễ hơn cho bạn",
  0: "Độ khó vừa sức",
  1: "Bạn đang tiến bộ: cư dân nói khó hơn một chút",
};
