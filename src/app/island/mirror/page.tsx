"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Mic, Pause, Play, Square } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { addMirror, useIsland, type MirrorTake } from "@/lib/island/progress";
import { canRecord, speechStats, startRecording, transcribe } from "@/lib/island/voice";
import { sfx } from "@/lib/island/sfx";

// Âm thanh chỉ lưu trong máy (IndexedDB) — nặng và riêng tư; số liệu + lời được đồng bộ.
const DB = "cci-mirror";
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("audio");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function putAudio(key: string, blob: Blob) {
  const d = await db();
  await new Promise<void>((res, rej) => {
    const tx = d.transaction("audio", "readwrite");
    tx.objectStore("audio").put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function getAudio(key: string): Promise<Blob | null> {
  try {
    const d = await db();
    return await new Promise((res) => {
      const r = d.transaction("audio").objectStore("audio").get(key);
      r.onsuccess = () => res((r.result as Blob) || null);
      r.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

const PROMPTS = ["Bạn là ai, làm nghề gì?", "Bạn sống ở đâu, với ai?", "Bạn thích làm gì lúc rảnh? Vì sao?", "Gần đây bạn đã làm gì vui?", "Sắp tới bạn định làm gì?"];
const MILESTONES = [1, 30, 90];
const day = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
const daysSince = (iso: string) => Math.floor((Date.now() - Date.parse(iso)) / 86400000);

/** Gương thời gian: ghi âm tự giới thiệu ngày 1, 30, 90 rồi so sánh. */
export default function MirrorPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [rec, setRec] = useState<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const t0 = useRef(0);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs(Math.round((performance.now() - t0.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [rec]);
  useEffect(() => () => rec?.cancel(), [rec]);

  const takes = mounted ? s.mirror : [];
  const first = takes[0];
  const last = takes.length > 1 ? takes[takes.length - 1] : null;
  const age = first ? daysSince(first.at) + 1 : 0;
  const nextMs = MILESTONES.find((m) => m > age);

  const toggle = async () => {
    setErr(null);
    if (rec) {
      setBusy(true);
      const audio = await rec.stop();
      setRec(null);
      if (audio.ms < 5000) {
        setBusy(false);
        return setErr("Hơi ngắn: hãy nói ít nhất 20–30 giây nhé.");
      }
      const t = await transcribe(audio.blob);
      setBusy(false);
      if (!t.text) return setErr(t.offline ? "Mạng chập chờn, chưa nghe được. Thử lại nhé." : "Chưa nghe rõ, thử nói to hơn chút.");
      const st = speechStats(t);
      const take: MirrorTake = { at: new Date().toISOString(), text: t.text, words: st.words, wpm: st.wpm, pauses: st.pauses, fillers: st.fillers, sentenceLen: st.sentenceLen, tenses: st.tenses, secs: Math.round(audio.ms / 1000) };
      putAudio(take.at, audio.blob).catch(() => {});
      addMirror(take, 15);
      sfx.win();
      return;
    }
    try {
      t0.current = performance.now();
      setSecs(0);
      setRec(await startRecording(90_000));
    } catch {
      setErr("Không mở được micro. Hãy cho phép trình duyệt dùng micro.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Gương thời gian</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Ghi âm 30–60 giây tự giới thiệu vào ngày 1, ngày 30, ngày 90. Rồi nghe lại để thấy mình đã khác thế nào.</p>
        </div>
      </div>

      <section className="cci-card-wood p-4 sm:p-5 flex flex-col gap-3">
        {first ? (
          <p className="font-bold">
            Bạn đang ở <b>ngày {age}</b> kể từ lần ghi đầu.{" "}
            {nextMs ? (
              <>
                Mốc tiếp theo: <b>ngày {nextMs}</b> (còn {nextMs - age} ngày). Ghi thêm lúc nào cũng được.
              </>
            ) : (
              "Bạn đã qua cả 3 mốc. Ghi lại bất cứ lúc nào để so tiếp!"
            )}
          </p>
        ) : (
          <p className="font-bold">Đây là lần ghi đầu tiên: “bạn của ngày 1”. Đừng ngại sai, càng thật càng thú vị khi nghe lại sau 30 ngày.</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map((p) => (
            <span key={p} className="cci-chip !text-[13px]">
              {p}
            </span>
          ))}
        </div>
        {mounted && !canRecord() ? (
          <p className="font-bold text-[#A4521D]">Trình duyệt này chưa cho ghi âm. Thử Chrome hoặc Safari mới nhé.</p>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-sfx="none"
              onClick={toggle}
              disabled={busy}
              className={cx("w-16 h-16 rounded-full text-white flex items-center justify-center border-[3px]", rec ? "bg-[#E0583B] border-[#A4521D]" : "bg-[#3F7A34] border-[#2C5A25]", busy && "opacity-60")}
              aria-label={rec ? "Dừng ghi" : "Bắt đầu ghi"}
            >
              {rec ? <Square className="w-7 h-7" fill="currentColor" /> : <Mic className="w-7 h-7" />}
            </button>
            <span className="font-bold text-[#6B4A30]">{busy ? "Đang phân tích giọng nói…" : rec ? `Đang ghi… ${secs}s (tối đa 90s), bấm để dừng` : "Bấm để bắt đầu nói"}</span>
          </div>
        )}
        {err && <p className="text-sm font-bold text-[#A4521D]">{err}</p>}
      </section>

      {first && (
        <section className="cci-card p-4 flex flex-col gap-3">
          <h2 className="font-baloo font-extrabold text-xl">{last ? "Bạn của ngày đầu và bạn bây giờ" : "Lần ghi đầu tiên"}</h2>
          <div className={cx("grid gap-3", last && "sm:grid-cols-2")}>
            <TakeCard t={first} label={`Ngày 1 · ${day(first.at)}`} />
            {last && <TakeCard t={last} label={`Ngày ${daysSince(first.at) - daysSince(last.at) + 1} · ${day(last.at)}`} cmp={first} />}
          </div>
          {takes.length > 2 && (
            <details>
              <summary className="font-extrabold cursor-pointer text-sm">Tất cả {takes.length} lần ghi</summary>
              <ul className="mt-2 flex flex-col gap-1 text-sm font-semibold">
                {takes.map((t) => (
                  <li key={t.at}>
                    {day(t.at)}: {t.wpm} từ/phút · {t.words} từ · {t.pauses} lần ngập ngừng
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function Delta({ v, base, lowerBetter }: { v: number; base?: number; lowerBetter?: boolean }) {
  if (base === undefined || v === base) return null;
  const better = lowerBetter ? v < base : v > base;
  return <span className={cx("inline-flex", better ? "text-[#2C5A25]" : "text-[#A4521D]")}>{v > base ? <ArrowUp className="w-3.5 h-3.5" strokeWidth={3} /> : <ArrowDown className="w-3.5 h-3.5" strokeWidth={3} />}</span>;
}

function TakeCard({ t, label, cmp }: { t: MirrorTake; label: string; cmp?: MirrorTake }) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    let u: string | null = null;
    getAudio(t.at).then((b) => {
      if (b) setUrl((u = URL.createObjectURL(b)));
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
      audio.current?.pause();
    };
  }, [t.at]);
  const rows: [string, number, number | undefined, boolean?][] = [
    ["Tốc độ (từ/phút)", t.wpm, cmp?.wpm],
    ["Số từ đã nói", t.words, cmp?.words],
    ["Từ / câu", t.sentenceLen, cmp?.sentenceLen],
    ["Lần ngập ngừng", t.pauses, cmp?.pauses, true],
    ["Ừm, à…", t.fillers, cmp?.fillers, true],
  ];
  return (
    <div className="rounded-[18px] border-[3px] border-[#E6CF9A] bg-[#FFFBF2] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-extrabold">{label}</span>
        {url ? (
          <button
            type="button"
            className="cci-btn !min-h-[36px] !text-sm"
            onClick={() => {
              if (!audio.current) {
                audio.current = new Audio(url);
                audio.current.onended = () => setPlaying(false);
              }
              if (playing) audio.current.pause();
              else audio.current.play().catch(() => {});
              setPlaying(!playing);
            }}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} Nghe
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-[#8B6B45]">Âm thanh chỉ có trên máy đã ghi</span>
        )}
      </div>
      <ul className="text-sm font-semibold flex flex-col gap-0.5">
        {rows.map(([k, v, base, lower]) => (
          <li key={k} className="flex items-center justify-between gap-2">
            <span className="text-[#6B4A30]">{k}</span>
            <span className="font-extrabold inline-flex items-center gap-1">
              {v} <Delta v={v} base={base} lowerBetter={lower} />
            </span>
          </li>
        ))}
      </ul>
      {t.tenses.length > 0 && <div className="text-xs font-semibold text-[#2C5A25]">Đã dùng: {t.tenses.join(" · ")}</div>}
      <details>
        <summary className="text-xs font-extrabold cursor-pointer">Lời bạn nói</summary>
        <p className="text-sm font-semibold leading-snug mt-1">{t.text}</p>
      </details>
    </div>
  );
}
