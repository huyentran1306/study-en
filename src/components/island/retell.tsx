"use client";

import { useState } from "react";
import { Mic, Send, Volume2 } from "lucide-react";
import { Avatar } from "./character";
import { cx } from "./ui";
import { speak, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

type Result = { score: number; good: string; fixes: { said: string; fixed: string; note: string }[]; model: string };

/** "Kể lại cho Bơ": kể lại cuộc trò chuyện vừa xong bằng 2–4 câu (đổi ngôi, lùi thì). */
export function RetellCard({ npcName, level, history, onDone }: { npcName: string; level: string; history: { role: "user" | "assistant"; content: string }[]; onDone?: (score: number) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { supported, listening, interim, listen, stop } = useListen();
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const submit = async () => {
    if (words < 4 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/island-retell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ npcName, level, history, retell: text }) });
      const j = (await r.json()) as Partial<Result> & { offline?: boolean };
      if (!j.model) throw new Error("offline");
      setRes(j as Result);
      sfx.win();
      onDone?.(j.score || 0);
    } catch {
      setErr("AI đang bận, thử lại sau một chút nhé.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="self-stretch rounded-[22px] border-[3px] border-[#6FAE4F] bg-[#F4FAEC] px-3.5 sm:px-4 py-3 flex flex-col gap-2.5 anim-pop" aria-label="Kể lại cho Bơ">
      <div className="flex items-center gap-2">
        <Avatar who="bo" size={40} />
        <div className="flex-1 min-w-0">
          <h2 className="font-baloo font-extrabold text-lg leading-tight">Kể lại cho Bơ</h2>
          <p className="text-[13px] font-semibold text-[#2C5A25] leading-snug">
            “What did you and {npcName} talk about?” Kể lại 2–4 câu bằng thì quá khứ, ví dụ: <i>{npcName} asked me…, I told {npcName}…</i>
          </p>
        </div>
      </div>
      {!res && (
        <>
          <textarea
            value={listening ? `${text} ${interim}`.trim() : text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={`${npcName} asked me what I wanted to drink. I told ${npcName}…`}
            className="w-full rounded-[16px] border-[3px] border-[#8B5E3C] bg-white px-3 py-2 font-semibold outline-none focus:border-[#3F7A34] resize-none"
            disabled={listening || busy}
          />
          <div className="flex items-center gap-2">
            {supported && (
              <button
                type="button"
                onClick={async () => {
                  if (listening) return stop();
                  const t = await listen();
                  if (t.trim()) setText((v) => `${v} ${t}`.trim());
                }}
                className={cx("cci-btn !min-h-[40px]", listening && "!bg-[#C96A2B] !text-white")}
              >
                <Mic className="w-4 h-4" /> {listening ? "Dừng" : "Nói"}
              </button>
            )}
            <button type="button" className="cci-btn cci-btn-primary !min-h-[40px]" disabled={words < 4 || busy} onClick={submit}>
              <Send className="w-4 h-4" /> {busy ? "Bơ đang nghe…" : "Kể cho Bơ"}
            </button>
            <span className="text-xs font-bold text-[#6B4A30] ml-auto">{words} từ</span>
          </div>
          {err && <p className="text-sm font-bold text-[#A4521D]">{err}</p>}
        </>
      )}
      {res && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex gap-1" aria-label={`${res.score} trên 5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={cx("w-4 h-4 rounded-full border-2", i <= res.score ? "bg-[#F2C14E] border-[#C99A1E]" : "bg-white border-[#E6CF9A]")} />
              ))}
            </span>
            <span className="text-sm font-bold text-[#2C5A25]">{res.good}</span>
          </div>
          {res.fixes.length > 0 && (
            <ul className="flex flex-col gap-1">
              {res.fixes.map((f, i) => (
                <li key={i} className="text-sm leading-snug">
                  <span className="font-semibold text-[#A4521D] line-through decoration-[#C96A2B]/60">{f.said}</span> → <b>{f.fixed}</b> <span className="text-[#6B4A30] font-semibold">({f.note})</span>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-[14px] bg-white border-2 border-[#9CC77F] px-3 py-2">
            <div className="text-xs font-extrabold text-[#2C5A25]">Bơ kể mẫu cho bạn nghe:</div>
            <button type="button" data-sfx="none" onClick={() => speak(res.model, { who: "bo" })} className="text-left font-extrabold leading-snug">
              {res.model} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
            </button>
          </div>
          <button type="button" className="text-xs font-extrabold underline underline-offset-4 self-start text-[#2C5A25]" onClick={() => setRes(null)}>
            Kể lại lần nữa
          </button>
        </div>
      )}
    </section>
  );
}
