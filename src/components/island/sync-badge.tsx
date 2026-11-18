"use client";

import { Cloud, CloudOff, LogIn, Loader2, RefreshCw } from "lucide-react";
import { syncIsland, useSyncStatus } from "@/lib/island/progress";
import { openLogin } from "@/lib/auth-events";
import { sfx } from "@/lib/island/sfx";

function hhmm(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Trạng thái đồng bộ tiến độ lên máy chủ. Khách bấm vào để mở hộp đăng nhập. */
export function SyncBadge({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { status, at } = useSyncStatus();
  if (compact) return <SyncDot status={status} at={at} className={className} />;
  const base = `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border-2 ${className}`;
  if (status === "idle") return null;
  if (status === "guest")
    return (
      <button
        type="button"
        onClick={() => {
          sfx.pop();
          openLogin();
        }}
        className={`${base} hover:-translate-y-0.5 transition-transform`}
        style={{ background: "#FFF9EE", borderColor: "#D8BF92", color: "#6B4A30" }}
        title="Bạn đang dùng chế độ khách. Đăng nhập để lưu tiến độ lên máy chủ và học tiếp trên thiết bị khác."
      >
        <LogIn className="w-3.5 h-3.5" /> Chế độ khách · <span className="underline underline-offset-2">đăng nhập để đồng bộ</span>
      </button>
    );
  if (status === "syncing")
    return (
      <span className={base} style={{ background: "#FFF9EE", borderColor: "#D8BF92", color: "#6B4A30" }}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đồng bộ...
      </span>
    );
  if (status === "synced")
    return (
      <span className={base} style={{ background: "#EAF3DC", borderColor: "#6FAE4F", color: "#2C5A25" }} title="Tiến độ đã được lưu trên máy chủ">
        <Cloud className="w-3.5 h-3.5" /> Đã lưu lên máy chủ {hhmm(at)}
      </span>
    );
  return (
    <button
      type="button"
      onClick={() => syncIsland()}
      className={base}
      style={{ background: "#FDEEDD", borderColor: "#E0A26E", color: "#A4521D" }}
      title="Tiến độ vẫn được giữ trong máy, sẽ tự đồng bộ khi có mạng"
    >
      <CloudOff className="w-3.5 h-3.5" /> {status === "offline" ? "Mất mạng" : "Chưa đồng bộ được"} · thử lại <RefreshCw className="w-3 h-3" />
    </button>
  );
}

/** Bản gọn đặt cạnh tên người chơi: khách thì nút "Đăng nhập", còn lại là biểu tượng mây. */
function SyncDot({ status, at, className }: { status: string; at?: string; className: string }) {
  const dot = `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${className}`;
  if (status === "idle") return null;
  if (status === "guest")
    return (
      <button
        type="button"
        onClick={() => {
          sfx.pop();
          openLogin();
        }}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 h-8 text-[12px] font-extrabold bg-[#3F7A34] text-white border-2 border-[#2C5A25] shadow-[0_2px_0_#2C5A25] hover:-translate-y-0.5 transition-transform shrink-0 ${className}`}
        title="Bạn đang dùng chế độ khách. Đăng nhập để lưu tiến độ lên máy chủ và học tiếp trên thiết bị khác."
      >
        <LogIn className="w-3.5 h-3.5" /> Đăng nhập
      </button>
    );
  if (status === "syncing")
    return (
      <span className={dot} style={{ background: "#FFF9EE", color: "#6B4A30" }} title="Đang đồng bộ...">
        <Loader2 className="w-4 h-4 animate-spin" />
      </span>
    );
  if (status === "synced")
    return (
      <span className={dot} style={{ background: "#EAF3DC", color: "#2C5A25" }} title={`Đã lưu lên máy chủ ${hhmm(at)}`} aria-label={`Đã lưu lên máy chủ ${hhmm(at)}`}>
        <Cloud className="w-4 h-4" />
      </span>
    );
  return (
    <button type="button" onClick={() => syncIsland()} className={dot} style={{ background: "#FDEEDD", color: "#A4521D" }} title="Chưa đồng bộ được — bấm để thử lại" aria-label="Thử đồng bộ lại">
      <CloudOff className="w-4 h-4" />
    </button>
  );
}
