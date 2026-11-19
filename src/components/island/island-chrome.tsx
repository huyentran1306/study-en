"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Maximize2, Minimize2 } from "lucide-react";
import { AudioToggles } from "./audio-controls";
import { IslandLogo } from "./island-logo";

/** Bật/tắt toàn màn hình cho cả trang (ẩn luôn menu web) — "chui vào" chơi trong khu vườn. */
/** Đang toàn màn hình? Tính cả nút của game (Fullscreen API) lẫn F11 của trình duyệt. */
function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return !!document.fullscreenElement || (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: fullscreen)").matches);
}

export function useFullscreen() {
  const [fs, setFs] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
    const on = () => {
      const active = isFullscreen();
      setFs(active);
      document.documentElement.classList.toggle("cci-fs", active);
    };
    // Đồng bộ ngay khi nút xuất hiện: sang trang khác của đảo vẫn giữ toàn màn hình thì menu web vẫn phải ẩn.
    on();
    document.addEventListener("fullscreenchange", on);
    const mq = typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: fullscreen)") : null;
    mq?.addEventListener?.("change", on);
    return () => {
      document.removeEventListener("fullscreenchange", on);
      mq?.removeEventListener?.("change", on);
    };
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
  };
  return { fs, can, toggle };
}

export function FullscreenButton({ small = false, flat = false }: { small?: boolean; flat?: boolean }) {
  const { fs, can, toggle } = useFullscreen();
  if (!can) return null;
  const size = small ? "w-9 h-9" : "w-11 h-11";
  return (
    <button
      type="button"
      data-sfx="open"
      onClick={toggle}
      className={flat ? "w-10 h-10 rounded-full flex items-center justify-center text-[#4A3222] hover:bg-[#F3E6CC] transition-colors" : `${size} rounded-full flex items-center justify-center border-[3px] border-[#8B5E3C] bg-[#FBF3E2] text-[#4A3222] shadow-[0_3px_0_#8B5E3C] hover:-translate-y-0.5 transition-transform`}
      aria-label={fs ? "Thoát toàn màn hình" : "Chơi toàn màn hình"}
      title={fs ? "Thoát toàn màn hình" : "Chơi toàn màn hình"}
    >
      {fs ? <Minimize2 className={small ? "w-4 h-4" : "w-5 h-5"} /> : <Maximize2 className={small ? "w-4 h-4" : "w-5 h-5"} />}
    </button>
  );
}

/**
 * Thanh trên cùng của đảo khi ở điện thoại (menu web bị ẩn để game liền mạch),
 * và khi đang toàn màn hình trên máy tính.
 */
export function IslandTopBar() {
  const pathname = usePathname();
  // Rời hẳn khu đảo thì trả lại menu web.
  useEffect(() => () => document.documentElement.classList.remove("cci-fs"), []);
  // Trang chủ đảo đã có HUD đầy đủ trên cả máy tính lẫn điện thoại
  if (pathname === "/island") return null;
  return (
    <div className="cci-topbar sticky top-0 z-50 md:hidden flex items-center gap-2 px-3 h-14 bg-[#FBF3E2]/95 backdrop-blur border-b-[3px] border-[#EAD9B8]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/island" className="cci-btn !min-h-[38px] !px-3 !text-sm" aria-label="Về đảo">
        <Home className="w-4 h-4" /> Về đảo
      </Link>
      <Link href="/island" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 font-baloo font-extrabold text-[17px] truncate">
        <IslandLogo size={34} /> Đảo Tám Chuyện
      </Link>
      <FullscreenButton small />
    </div>
  );
}

/** Nút nổi góc trái (máy tính): âm thanh, nhạc nền, toàn màn hình. */
export function FloatingControls() {
  const pathname = usePathname();
  // Bản đồ đã có các nút này trong HUD.
  if (pathname === "/island") return null;
  return (
    <div className="fixed z-40 left-3 bottom-4 hidden xl:flex flex-col gap-2" data-sfx-scope="off">
      <AudioToggles />
      <FullscreenButton />
    </div>
  );
}

/**
 * Sau mỗi lần deploy, file CSS/JS cũ bị xoá. Tab đang mở từ trước mà chuyển trang thì tải hụt
 * → giao diện mất hết kiểu (nút trắng, font thường, chữ đè nhau). Gặp vậy thì tự tải lại trang
 * một lần để lấy bản mới (tối đa 1 lần mỗi 30 giây cho khỏi lặp).
 */
export function StaleAssetGuard() {
  useEffect(() => {
    const KEY = "cci-stale-reload";
    const reload = () => {
      const last = Number(sessionStorage.getItem(KEY) || "0");
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    };
    const onError = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || t === (window as unknown as HTMLElement)) return;
      const url = t instanceof HTMLLinkElement ? t.href : t instanceof HTMLScriptElement ? t.src : "";
      if (url.includes("/_next/static/")) reload();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string; message?: string } | undefined;
      const msg = `${r?.name || ""} ${r?.message || ""}`;
      if (/ChunkLoadError|Loading (CSS )?chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) reload();
    };
    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
