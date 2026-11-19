"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Pencil, Sparkles, Trash2, UserRound, Volume2 } from "lucide-react";
import { Avatar, Character } from "@/components/island/character";
import { NPCS, type NpcId } from "@/lib/island/curriculum";
import { liveMemories } from "@/lib/island/memory";
import { BackLink } from "@/components/island/ui";
import { cleanField, hasProfile, mePhrases, type Profile } from "@/lib/island/me";
import { forgetMemory, saveProfile, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

type Draft = { name: string; hometown: string; job: string; hobby: string };

const FIELDS: { key: keyof Draft; label: string; hint: string; ph: string; frame: string }[] = [
  { key: "name", label: "Tên bạn muốn được gọi", hint: "Viết như bạn hay giới thiệu với người nước ngoài", ph: "vd. Trân", frame: "Hi, I'm ___." },
  { key: "hometown", label: "Quê hoặc nơi bạn đang sống", hint: "Tên thành phố / tỉnh", ph: "vd. Sài Gòn", frame: "I'm from ___." },
  { key: "job", label: "Nghề nghiệp", hint: "Gõ tiếng Việt cũng được, Kero sẽ dịch giúp", ph: "vd. kiểm thử phần mềm", frame: "I work as a ___." },
  { key: "hobby", label: "Một sở thích", hint: "Gõ tiếng Việt cũng được", ph: "vd. chơi cầu lông", frame: "My hobby is ___." },
];

export default function MePage() {
  const s = useIsland();
  const { username, isAuthenticated } = useGame();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: "", hometown: "", job: "", hobby: "" });
  const [preview, setPreview] = useState<Omit<Profile, "at"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // Điền sẵn từ hồ sơ đã lưu (hoặc tên tài khoản) — một lần sau khi tải xong.
  useEffect(() => {
    if (!mounted) return;
    const p = s.profile;
    setDraft(hasProfile(p) ? { name: p.name, hometown: p.hometown, job: p.job, hobby: p.hobby } : { name: isAuthenticated ? username || "" : "", hometown: "", job: "", hobby: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const current = mounted && hasProfile(s.profile) ? s.profile : null;
  const showForm = !current || editing;
  const filled = Object.values(draft).some((v) => v.trim());

  const convert = async () => {
    if (!filled || busy) return;
    setBusy(true);
    setSaved(false);
    const body = { name: cleanField(draft.name, 40), hometown: cleanField(draft.hometown, 40), job: cleanField(draft.job, 50), hobby: cleanField(draft.hobby, 50) };
    let out: Omit<Profile, "at"> = { ...body, jobVi: body.job, hobbyVi: body.hobby };
    let ai = false;
    try {
      const res = await fetch("/api/island-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json()) as { profile?: Omit<Profile, "at">; ai?: boolean };
      if (j.profile) {
        out = j.profile;
        ai = !!j.ai;
      }
    } catch {
      /* dùng nguyên văn người học gõ */
    }
    setOffline(!ai);
    setPreview(out);
    setBusy(false);
    sfx.pop?.();
  };

  const confirm = () => {
    if (!preview) return;
    saveProfile(preview);
    setPreview(null);
    setEditing(false);
    setSaved(true);
    sfx.unlock();
  };

  const sentences = preview ? mePhrases({ ...preview, at: "" }) : current ? mePhrases(current) : [];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <span className="gem w-[52px] h-[52px] shrink-0 rounded-[16px] flex items-center justify-center text-white" style={{ ["--tone" as string]: "#2F8FB0" }}>
          <UserRound className="w-7 h-7" />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Hồ sơ của tôi</h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Bài học sẽ dùng tên, quê, nghề, sở thích của bạn thay cho câu mẫu “Bơ, Da Nang, designer”.</p>
        </div>
      </div>

      {saved && (
        <div className="rounded-[18px] border-[3px] border-[#3F7A34] bg-[#EAF3DC] px-4 py-3 font-bold text-[#2C5A25] flex items-center gap-2 anim-pop">
          <Check className="w-5 h-5 shrink-0" strokeWidth={3} /> Đã lưu! Từ giờ bài học, Ao Phản Xạ và Tám AI đều nói về chính bạn.
        </div>
      )}

      {mounted && showForm && !preview && (
        <form
          className="cci-card-wood p-4 sm:p-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            convert();
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-16 shrink-0">
              <Character who="kero" mood="talk" size="100%" />
            </div>
            <p className="font-semibold text-[#6B4A30]">Điền những gì bạn muốn (bỏ trống ô nào cũng được). Thông tin này chỉ dùng để tạo câu luyện nói cho bạn.</p>
          </div>
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="font-extrabold">
                {f.label} <span className="font-semibold text-sm text-[#6B4A30]">· {f.frame}</span>
              </span>
              <input
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                placeholder={f.ph}
                maxLength={50}
                autoComplete="off"
                className="h-12 rounded-[16px] border-[3px] border-[#8B5E3C] bg-white px-4 font-semibold outline-none focus:border-[#3F7A34]"
              />
              <span className="text-xs font-semibold text-[#6B4A30]">{f.hint}</span>
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="cci-btn cci-btn-primary cci-btn-big gloss" disabled={!filled || busy} data-sfx="none">
              <Sparkles className="w-5 h-5" /> {busy ? "Kero đang soạn câu…" : "Xem các câu của tôi"}
            </button>
            {current && (
              <button type="button" className="cci-btn cci-btn-big" onClick={() => setEditing(false)}>
                Huỷ
              </button>
            )}
          </div>
        </form>
      )}

      {mounted && (preview || (current && !editing)) && (
        <div className="cci-card-wood p-4 sm:p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold leading-tight">{preview ? "Đây là các câu nói về bạn — đúng chưa?" : "Các câu nói về bạn"}</h2>
            {!preview && (
              <button type="button" className="cci-btn !min-h-[40px] shrink-0" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4" /> Sửa
              </button>
            )}
          </div>
          {preview && offline && <p className="text-sm font-bold text-[#A4521D]">AI đang tạm ngoại tuyến nên mình dùng nguyên văn bạn gõ. Nếu bạn gõ tiếng Việt, hãy sửa lại bằng tiếng Anh hoặc thử lại sau.</p>}
          <ul className="flex flex-col gap-2">
            {sentences.map((x) => (
              <li key={x.en}>
                <button type="button" data-sfx="none" onClick={() => speak(x.en, { who: "you" })} className="w-full text-left rounded-[16px] bg-white border-2 border-[#E6CF9A] px-3 py-2 hover:bg-[#FFFBF2]">
                  <span className="block font-baloo font-extrabold text-[17px] leading-tight">
                    {x.en} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
                  </span>
                  <span className="block text-sm font-semibold text-[#6B4A30]">{x.vi}</span>
                </button>
              </li>
            ))}
          </ul>
          {preview ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={confirm} data-sfx="none">
                <Check className="w-5 h-5" /> Đúng rồi, lưu lại
              </button>
              <button type="button" className="cci-btn cci-btn-big" onClick={() => setPreview(null)}>
                Sửa lại
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link href="/island/phrases" className="cci-btn cci-btn-primary" data-sfx="whoosh">
                Luyện nói các câu này <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/island/path" className="cci-btn" data-sfx="whoosh">
                Về Lộ trình
              </Link>
            </div>
          )}
        </div>
      )}

      {mounted && <Memories />}
    </div>
  );
}

const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

/** "Cư dân nhớ gì về bạn": các chuyện cư dân ghi nhớ khi tám chuyện, xoá được từng cái. */
function Memories() {
  const s = useIsland();
  const list = liveMemories(s.memories).sort((a, b) => (a.at < b.at ? 1 : -1));
  return (
    <section id="memories" className="cci-card-wood p-4 sm:p-6 flex flex-col gap-3 scroll-mt-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold leading-tight">💭 Cư dân nhớ gì về bạn</h2>
          <p className="text-sm font-semibold text-[#6B4A30] leading-snug mt-0.5">
            Khi tám chuyện, cư dân ghi nhớ vài chuyện bạn kể (dự định, chuyến đi, sở thích mới…) để hôm sau hỏi lại như bạn bè thật. Chuyện nhạy cảm như sức khoẻ, tiền bạc sẽ không được ghi.
          </p>
        </div>
        {list.length > 1 && (
          <button
            type="button"
            className="cci-btn !min-h-[40px] shrink-0"
            onClick={() => {
              if (confirm(`Xoá cả ${list.length} chuyện cư dân đang nhớ?`)) forgetMemory(null);
            }}
          >
            Xoá hết
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="rounded-[16px] bg-white/70 border-2 border-dashed border-[#E6CF9A] px-3 py-3 text-sm font-semibold text-[#6B4A30]">
          Chưa có chuyện nào. Vào{" "}
          <Link href="/island/chat" className="font-extrabold underline underline-offset-2">
            Tám chuyện
          </Link>{" "}
          và kể một chút về cuộc sống của bạn, như cuối tuần định làm gì, là cư dân sẽ bắt đầu nhớ.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((m) => {
            const who = (m.npc in NPCS ? m.npc : "kero") as NpcId;
            return (
              <li key={m.id} className="flex items-center gap-3 rounded-[16px] bg-white border-2 border-[#E6CF9A] px-3 py-2">
                <Avatar who={who} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold leading-snug">{m.vi || m.fact}</div>
                  <div className="text-xs font-semibold text-[#6B4A30] leading-snug">
                    {NPCS[who].name} nghe ngày {fmtDay(m.at)} · {m.used ? `đã hỏi lại ngày ${fmtDay(m.used)}` : `lần sau sẽ hỏi: “${m.ask}”`}
                  </div>
                </div>
                <button type="button" onClick={() => forgetMemory(m.id)} className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[#A4521D] hover:bg-[#FDEEDD]" aria-label={`Xoá: ${m.vi || m.fact}`} title="Xoá chuyện này">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
