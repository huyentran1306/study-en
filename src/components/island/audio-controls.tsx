"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Music, Music2, Volume2, VolumeX } from "lucide-react";
import { musicOn, setMusicOn, setSoundOn, sfx, soundOn, startMusic, stopMusic, subscribeAudio } from "@/lib/island/sfx";

type SfxName = keyof typeof sfx;

/**
 * Âm thanh cho cả đảo:
 * - Mọi nút / link trong khu đảo kêu "bóp" khi bấm (thêm data-sfx="tên" để đổi tiếng, data-sfx="none" để tắt).
 * - Nút bật/tắt nằm ở AudioToggles (HUD bản đồ, nút nổi góc màn hình).
 */
export function IslandAudio() {

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".cci button, .cci a, .cci [role=button]");
      if (!el || el.closest("[data-sfx-scope=off]")) return;
      if ((el as HTMLButtonElement).disabled) return;
      const name = el.dataset.sfx;
      if (name === "none") return;
      const fn = name && name in sfx ? (sfx[name as SfxName] as () => void) : sfx.pop;
      fn();
    };
    document.addEventListener("click", onClick, true);
    // Trình duyệt chỉ cho phát âm thanh sau lần tương tác đầu tiên.
    const kick = () => {
      if (musicOn()) startMusic();
      window.removeEventListener("pointerdown", kick);
    };
    window.addEventListener("pointerdown", kick);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pointerdown", kick);
      stopMusic();
    };
  }, []);

  return null;
}

/** Hai nút bật/tắt hiệu ứng và nhạc nền (dùng nổi ở góc màn hình, hoặc nằm trong HUD trên điện thoại). */
export function AudioToggles({ sound: s0, music: m0, className = "", flat = false }: { sound?: boolean; music?: boolean; className?: string; flat?: boolean }) {
  const sSub = useSyncExternalStore(subscribeAudio, soundOn, () => false);
  const mSub = useSyncExternalStore(subscribeAudio, musicOn, () => false);
  const sound = s0 ?? sSub;
  const music = m0 ?? mSub;
  return (
    <div className={`contents ${className}`} data-sfx-scope="off">
      <button
        type="button"
        onClick={() => {
          const next = !sound;
          setSoundOn(next);
          if (next) sfx.correct();
        }}
        className={flat ? "w-10 h-10 rounded-full flex items-center justify-center text-[#4A3222] hover:bg-[#F3E6CC] transition-colors" : "w-11 h-11 rounded-full flex items-center justify-center border-[3px] border-[#8B5E3C] bg-[#FBF3E2] text-[#4A3222] shadow-[0_3px_0_#8B5E3C] hover:-translate-y-0.5 transition-transform"}
        aria-label={sound ? "Tắt hiệu ứng âm thanh" : "Bật hiệu ứng âm thanh"}
        title={sound ? "Tắt hiệu ứng âm thanh" : "Bật hiệu ứng âm thanh"}
      >
        {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
      <button
        type="button"
        onClick={() => setMusicOn(!music)}
        disabled={!sound}
        className={flat ? "w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 hover:brightness-95" : "w-11 h-11 rounded-full flex items-center justify-center border-[3px] border-[#8B5E3C] shadow-[0_3px_0_#8B5E3C] hover:-translate-y-0.5 transition-transform disabled:opacity-40"}
        style={{ background: music && sound ? "#3F7A34" : flat ? "transparent" : "#FBF3E2", color: music && sound ? "#fff" : "#4A3222" }}
        aria-label={music ? "Tắt nhạc nền" : "Bật nhạc nền"}
        title={music ? "Tắt nhạc nền" : "Bật nhạc nền đảo"}
      >
        {music && sound ? <Music2 className="w-5 h-5" /> : <Music className="w-5 h-5" />}
      </button>
    </div>
  );
}
