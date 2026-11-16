"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Maximize2, Minimize2, TreePalm } from "lucide-react";
import { AudioToggles } from "./audio-controls";

/** Bật/tắt toàn màn hình cho cả trang (ẩn luôn menu web) — "chui vào" chơi trong khu vườn. */
export function useFullscreen() {
  const [fs, setFs] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(typeof document !== "undefined" && !!document.documentElement.requestFullscreen);
    const on = () => {
      const active = !!document.fullscreenElement;
      setFs(active);
      document.documentElement.classList.toggle("cci-fs", active);
    };
    document.addEventListener("fullscreenchange", on);
    return () => {
      document.removeEventListener("fullscreenchange", on);
      document.documentElement.classList.remove("cci-fs");
    };
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
  };
  return { fs, can, toggle };
}

export function FullscreenButton({ small = false }: { small?: boolean }) {
  const { fs, can, toggle } = useFullscreen();
  if (!can) return null;
  const size = small ? "w-9 h-9" : "w-11 h-11";
  return (
    <button
      type="button"
      data-sfx="open"
      onClick={toggle}
      className={`${size} rounded-full flex items-center justify-center border-[3px] border-[#8B5E3C] bg-[#FBF3E2] text-[#4A3222] shadow-[0_3px_0_#8B5E3C] hover:-translate-y-0.5 transition-transform`}
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
  return (
    <div className="cci-topbar sticky top-0 z-50 md:hidden flex items-center gap-2 px-3 h-14 bg-[#FBF3E2]/95 backdrop-blur border-b-[3px] border-[#EAD9B8]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <Link href="/" className="cci-btn !min-h-[38px] !px-3 !text-sm" aria-label="Về trang chủ">
        <Home className="w-4 h-4" /> Trang chủ
      </Link>
      <Link href="/island" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 font-baloo font-extrabold text-[17px] truncate">
        <TreePalm className="w-5 h-5 text-[#3F7A34] shrink-0" /> Đảo Tám Chuyện
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
