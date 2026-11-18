"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Flame, Home, Link2, Mail, Send, Share2, Star, Trophy, X } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import type { WorldState } from "@/components/island/world3d";
import { canWebGL } from "@/components/island/webgl";
import { BOSSES } from "@/lib/island/missions";
import { activeSlot, growth, islandLevel, setShareCode, streak, totalStars, useIsland, type IslandState } from "@/lib/island/progress";
import { sfx } from "@/lib/island/sfx";

const Island3D = dynamic(() => import("@/components/island/island3d"), { ssr: false, loading: () => <div className="absolute inset-0 flex items-center justify-center font-bold text-[#24566B]">Đang dựng đảo…</div> });

type Snapshot = { level: number; garden: number; pond: { kind: "shrimp" | "crab" | "lobster"; ready: boolean }[]; office: boolean; trophies: string[]; streak: number; stars: number; chapters: number };
type Note = { id: number; from_name: string; text: string; fixed: string; created_at: string };
type Friend = { code: string; name: string; snapshot: Snapshot; notes: Note[] };
const KEY = "cci-share-key";
const TROPHY_VI = Object.fromEntries(BOSSES.map((b) => [b.boss!.trophy, b.boss!.trophyVi]));

function ownerKey(): string {
  let k = localStorage.getItem(KEY);
  if (!k) {
    k = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 40);
    localStorage.setItem(KEY, k);
  }
  return k;
}

/** Ảnh chụp công khai của đảo mình (không có hồ sơ, ký ức, lỗi sai). */
function snapshotOf(s: IslandState): Snapshot {
  const pond: Snapshot["pond"] = [];
  for (let i = 0; i < s.farm.size; i++) {
    const sl = activeSlot(s, i);
    if (sl) pond.push({ kind: sl.kind, ready: growth(sl).pct >= 1 });
  }
  return { level: islandLevel(s.xp).level, garden: Object.keys(s.garden).length, pond, office: s.unlockedUpTo >= 9, trophies: Object.keys(s.trophies), streak: streak(s), stars: totalStars(s), chapters: Object.values(s.chapters).filter((c) => c.lesson).length };
}

const ago = (sql: string) => {
  const d = (Date.now() - Date.parse(sql.replace(" ", "T") + "Z")) / 60000;
  return d < 60 ? `${Math.max(1, Math.round(d))} phút trước` : d < 1440 ? `${Math.round(d / 60)} giờ trước` : `${Math.round(d / 1440)} ngày trước`;
};

function Inner() {
  const s = useIsland();
  const router = useRouter();
  const sp = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [input, setInput] = useState("");
  const [friend, setFriend] = useState<Friend | null>(null);
  const [mine, setMine] = useState<Friend | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [from, setFrom] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const code = (sp.get("code") || "").toUpperCase();

  useEffect(() => {
    setMounted(true);
    setWebgl(canWebGL());
  }, []);
  useEffect(() => {
    if (mounted) {
      setName((n) => n || s.profile?.name || "");
      setFrom((n) => n || s.profile?.name || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const load = useCallback(async (c: string): Promise<Friend | null> => {
    const r = await fetch(`/api/island-share?code=${encodeURIComponent(c)}`);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Không mở được đảo");
    }
    return (await r.json()) as Friend;
  }, []);

  useEffect(() => {
    if (!code) return setFriend(null);
    setErr(null);
    load(code)
      .then(setFriend)
      .catch((e: Error) => setErr(e.message));
  }, [code, load]);
  // Hộp thư của đảo mình
  useEffect(() => {
    if (mounted && s.shareCode) load(s.shareCode).then(setMine).catch(() => setMine(null));
  }, [mounted, s.shareCode, load]);

  const publish = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/island-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", key: ownerKey(), code: s.shareCode, name: name.trim() || "Bạn đảo", snapshot: snapshotOf(s) }) });
      const j = (await r.json()) as { code?: string; error?: string };
      if (!j.code) throw new Error(j.error || "Không chia sẻ được");
      setShareCode(j.code);
      setMine(await load(j.code));
      sfx.unlock();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const unpublish = async () => {
    if (!s.shareCode || !confirm("Ngừng chia sẻ đảo? Mã cũ và các lời nhắn sẽ bị xoá.")) return;
    const r = await fetch("/api/island-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unpublish", key: ownerKey(), code: s.shareCode }) });
    if (r.ok || r.status === 403) {
      setShareCode(undefined);
      setMine(null);
    }
  };
  const leaveNote = async () => {
    if (!friend || note.trim().split(/\s+/).length < 2) return;
    setBusy(true);
    setErr(null);
    setSent(null);
    try {
      const r = await fetch("/api/island-share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "note", code: friend.code, from: from.trim(), text: note.trim() }) });
      const j = (await r.json()) as { ok?: boolean; fixed?: string; error?: string };
      if (!j.ok) throw new Error(j.error || "Chưa gửi được");
      setSent(j.fixed || "");
      setNote("");
      setFriend(await load(friend.code));
      sfx.coin();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shareUrl = mounted && s.shareCode ? `${location.origin}/island/visit?code=${s.shareCode}` : "";

  if (friend) {
    const snap = friend.snapshot;
    const world: WorldState = { quest: null, level: snap.level, garden: snap.garden, pond: snap.pond, office: snap.office, dusk: false };
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.replace("/island/visit")} className="cci-btn !min-h-[40px] !px-3 !text-sm">
            <Home className="w-4 h-4" /> Đảo của tôi
          </button>
          <h1 className="text-xl sm:text-3xl font-extrabold leading-tight flex-1 min-w-0 truncate">Đảo của {friend.name}</h1>
        </div>
        <div className="relative w-full aspect-[5/4] sm:aspect-[16/9] rounded-[24px] overflow-hidden border-[3px] border-[#8B5E3C]" style={{ background: "linear-gradient(180deg,#A8DDF0,#6EC3E3)" }}>
          {webgl ? <Island3D state={world} labels={[]} onPick={() => {}} onFail={() => setWebgl(false)} /> : <div className="absolute inset-0 flex items-center justify-center font-extrabold text-[#24566B]">Đảo cấp {snap.level}</div>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            [`Cấp ${snap.level}`, "đảo"],
            [snap.streak, "ngày liên tiếp", Flame],
            [snap.stars, "sao", Star],
            [snap.chapters, "chương đã học"],
          ].map(([v, l]) => (
            <div key={l as string} className="cci-card !shadow-none px-2 py-2">
              <div className="font-baloo font-extrabold text-xl">{v as string}</div>
              <div className="text-xs font-bold text-[#6B4A30]">{l as string}</div>
            </div>
          ))}
        </div>
        {snap.trophies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {snap.trophies.map((t) => (
              <span key={t} className="cci-chip !bg-[#FFF4CC] inline-flex items-center gap-1">
                <Trophy className="w-4 h-4 text-[#C99A1E]" /> {TROPHY_VI[t] || t}
              </span>
            ))}
          </div>
        )}
        <section className="cci-card-wood p-4 flex flex-col gap-2">
          <h2 className="font-baloo font-extrabold text-lg">Để lại lời nhắn bằng tiếng Anh</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={24} placeholder="Tên bạn" className="sm:w-40 h-11 rounded-[14px] border-[3px] border-[#D8BF92] bg-white px-3 font-semibold outline-none focus:border-[#3F7A34]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Your island is so cute! I love your…" className="flex-1 min-w-0 h-11 rounded-[14px] border-[3px] border-[#8B5E3C] bg-white px-3 font-semibold outline-none focus:border-[#3F7A34]" />
            <button type="button" className="cci-btn cci-btn-primary !min-h-[44px]" onClick={leaveNote} disabled={busy || note.trim().split(/\s+/).length < 2}>
              <Send className="w-4 h-4" /> Gửi
            </button>
          </div>
          {sent !== null && <p className="text-sm font-bold text-[#2C5A25]">Đã gửi!{sent && ` Câu tự nhiên hơn: “${sent}”`}</p>}
          {err && <p className="text-sm font-bold text-[#A4521D]">{err}</p>}
          <p className="text-xs font-semibold text-[#6B4A30]">Lời nhắn hiện công khai trên đảo của bạn mình. Đừng ghi số điện thoại, địa chỉ hay tài khoản mạng xã hội.</p>
        </section>
        <Notes notes={friend.notes} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island/practice" label="Phòng luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Ghé đảo bạn bè</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Chia sẻ mã đảo với bạn học cùng, ghé thăm đảo nhau và để lại lời nhắn bằng tiếng Anh.</p>
        </div>
      </div>

      <section className="cci-card-wood p-4 flex flex-col gap-3">
        <h2 className="font-baloo font-extrabold text-xl flex items-center gap-2">
          <Link2 className="w-5 h-5" /> Ghé đảo của bạn
        </h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = input.trim().toUpperCase();
            if (/^[A-Z0-9]{6}$/.test(c)) router.push(`/island/visit?code=${c}`);
            else setErr("Mã đảo gồm 6 chữ hoặc số, ví dụ K7PQ2M.");
          }}
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={6} placeholder="Mã đảo, vd. K7PQ2M" className="flex-1 min-w-0 h-11 rounded-[14px] border-[3px] border-[#8B5E3C] bg-white px-3 font-extrabold tracking-[0.2em] uppercase outline-none focus:border-[#3F7A34]" />
          <button type="submit" className="cci-btn cci-btn-primary !min-h-[44px]">
            Ghé thăm
          </button>
        </form>
        {err && <p className="text-sm font-bold text-[#A4521D]">{err}</p>}
      </section>

      <section className="cci-card p-4 flex flex-col gap-3">
        <h2 className="font-baloo font-extrabold text-xl flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Đảo của tôi
        </h2>
        {mounted && s.shareCode ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-baloo font-extrabold text-3xl tracking-[0.25em] bg-[#FFF4CC] border-2 border-[#E2B93B] rounded-[14px] px-3 py-1">{s.shareCode}</span>
              <button
                type="button"
                className="cci-btn !min-h-[40px]"
                onClick={() => {
                  navigator.clipboard?.writeText(shareUrl).then(() => setCopied(true), () => {});
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="w-4 h-4" /> {copied ? "Đã chép link" : "Chép link"}
              </button>
              <button type="button" className="cci-btn !min-h-[40px]" onClick={publish} disabled={busy}>
                Cập nhật đảo
              </button>
              <button type="button" className="text-xs font-extrabold underline underline-offset-4 text-[#A4521D]" onClick={unpublish}>
                <X className="inline w-3.5 h-3.5" /> Ngừng chia sẻ
              </button>
            </div>
            <p className="text-xs font-semibold text-[#6B4A30]">Bạn bè chỉ thấy: tên hiển thị “{mine?.name || name}”, cấp đảo, vườn, ao, cúp, chuỗi ngày học. Không thấy hồ sơ, ký ức hay lỗi sai của bạn. Bấm “Cập nhật đảo” để bạn bè thấy đảo mới nhất.</p>
            <h3 className="font-extrabold flex items-center gap-1.5 mt-1">
              <Mail className="w-4 h-4" /> Lời nhắn bạn bè để lại ({mine?.notes.length || 0})
            </h3>
            {mine && mine.notes.length > 0 ? <Notes notes={mine.notes} bare /> : <p className="text-sm font-semibold text-[#6B4A30]">Chưa có lời nhắn. Gửi mã cho bạn học cùng nhé!</p>}
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-extrabold">Tên hiển thị trên đảo</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="vd. Trân" className="h-11 rounded-[14px] border-[3px] border-[#D8BF92] bg-white px-3 font-semibold outline-none focus:border-[#3F7A34]" />
            </label>
            <p className="text-xs font-semibold text-[#6B4A30]">Chỉ chia sẻ: tên hiển thị, cấp đảo, vườn, ao, cúp và chuỗi ngày học. Bạn có thể ngừng chia sẻ bất cứ lúc nào.</p>
            <button type="button" className={cx("cci-btn cci-btn-primary self-start")} onClick={publish} disabled={busy || !mounted}>
              <Share2 className="w-4 h-4" /> {busy ? "Đang tạo mã…" : "Tạo mã chia sẻ đảo"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function Notes({ notes, bare }: { notes: Note[]; bare?: boolean }) {
  if (!notes.length) return bare ? null : <p className="text-sm font-semibold text-[#6B4A30]">Chưa có lời nhắn nào. Hãy là người đầu tiên!</p>;
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((n) => (
        <li key={n.id} className="rounded-[16px] bg-white border-2 border-[#E6CF9A] px-3 py-2">
          <div className="text-xs font-extrabold text-[#A4521D]">
            {n.from_name} · {ago(n.created_at)}
          </div>
          <div className="font-bold leading-snug">{n.text}</div>
          {n.fixed && <div className="text-xs font-semibold text-[#2C5A25]">✨ Tự nhiên hơn: {n.fixed}</div>}
        </li>
      ))}
    </ul>
  );
}

export default function VisitPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
