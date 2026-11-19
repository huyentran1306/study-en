"use client";

import { useGame } from "@/contexts/game-context";
import type { IslandState } from "@/lib/island/state";

/**
 * Tên người chơi trên đảo. Tên mặc định của cả web ("Trân") chỉ dành cho chủ tài khoản,
 * nên khách chưa đăng nhập dùng tên trong Hồ sơ của tôi; chưa có thì trả về null (hiển thị "Bạn").
 */
export function usePlayerName(s: IslandState): string | null {
  const { username, isAuthenticated } = useGame();
  if (isAuthenticated && username?.trim()) return username.trim();
  return s.profile?.name?.trim() || null;
}
