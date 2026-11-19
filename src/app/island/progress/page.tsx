"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, KeyRound, Mic, TrendingUp } from "lucide-react";
import { BackLink } from "@/components/island/ui";
import { Columns, StatTile, Trend, type Point } from "@/components/island/progress-charts";
import { CHAPTERS } from "@/lib/island/curriculum";
import { CEFR, type ChatReport } from "@/lib/island/feedback";
import { TALK_GOAL, chapterKeys, today, useIsland } from "@/lib/island/progress";

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};
const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(y, m - 1, d + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const SKILLS: { k: keyof Pick<ChatReport, "f" | "a" | "r" | "i">; name: string; desc: string }[] = [
  { k: "f", name: "Trôi chảy", desc: "Câu dài, liền mạch, có từ nối" },
  { k: "a", name: "Chính xác", desc: "Ít lỗi ngữ pháp, dùng từ đúng" },
  { k: "r", name: "Vốn từ & cấu trúc", desc: "Từ và kiểu câu đa dạng" },
  { k: "i", name: "Tương tác", desc: "Biết hỏi lại, giữ câu chuyện" },
];

/** Tiến bộ của tôi: đo năng lực thật (phút nói, điểm phiếu nhận xét, CEFR, phản xạ, tốc độ nói). */
export default function ProgressPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="max-w-3xl mx-auto px-3 py-6" />;

  const t = today();
  // Phút nói 14 ngày
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const talkPts: Point[] = days.map((d) => ({ x: dayLabel(d), label: d === t ? "Hôm nay" : dayLabel(d), value: Math.round(((s.talk[d] || 0) / 60) * 10) / 10 }));
  const week = (from: number) => days.slice(from, from + 7).reduce((a, d) => a + (s.talk[d] || 0), 0) / 60;
  const thisWeek = week(7),
    lastWeek = week(0);

  // Phiếu nhận xét
  const reports = [...s.reports].sort((p, q) => (p.at < q.at ? -1 : 1)).slice(-20);
  const repPts = (k: "f" | "a" | "r" | "i"): Point[] => reports.map((r, i) => ({ x: String(i + 1), label: `${dayLabel(r.at)} · lần ${i + 1}`, value: r[k] }));
  const cefrIdx = (c: string) => Math.max(0, CEFR.indexOf(c as (typeof CEFR)[number])) + 1;
  const cefrPts: Point[] = reports.map((r, i) => ({ x: String(i + 1), label: `${dayLabel(r.at)} · lần ${i + 1}`, value: cefrIdx(r.cefr) }));
  const head = reports.slice(0, 3),
    tail = reports.slice(-3);
  const skillDelta = (k: "f" | "a" | "r" | "i") => (reports.length >= 4 ? avg(tail.map((r) => r[k])) - avg(head.map((r) => r[k])) : null);

  // Phản xạ (giây, chỉ lượt trả lời bằng giọng)
  const reflex = s.reflex.filter((r) => r.voice && r.avgMs > 0).slice(-20);
  const reflexPts: Point[] = reflex.map((r, i) => ({ x: String(i + 1), label: `${dayLabel(r.at)} · chương ${r.ch}`, value: Math.round(r.avgMs / 100) / 10 }));
  // Tốc độ nói (Gương thời gian)
  const mirrorPts: Point[] = s.mirror.map((m) => ({ x: dayLabel(m.at), label: dayLabel(m.at), value: m.wpm }));

  const wordsKnown = Object.values(s.words).filter((w) => w.box >= 3).length;
  const phrasesKnown = Object.values(s.phrases).filter((p) => p.box >= 3).length;
  const keysDone = CHAPTERS.filter((c) => chapterKeys(s, c.id).all).length;
  const latest = reports[reports.length - 1];
  const first = reports[0];

  // Nhận xét ngắn
  const notes: string[] = [];
  if (thisWeek >= (TALK_GOAL / 60) * 5) notes.push(`Tuần này bạn nói ${Math.round(thisWeek)} phút, đủ nhịp để tiến bộ đều.`);
  else notes.push(`Tuần này bạn mới nói ${Math.round(thisWeek)} phút. Mục tiêu là ${TALK_GOAL / 60} phút mỗi ngày, khoảng ${(TALK_GOAL / 60) * 7} phút mỗi tuần.`);
  if (reports.length >= 4) {
    const best = SKILLS.map((x) => ({ ...x, d: skillDelta(x.k)! })).sort((p, q) => q.d - p.d);
    if (best[0].d > 0.2) notes.push(`${best[0].name} tăng rõ nhất (+${best[0].d.toFixed(1)} điểm so với 3 lần đầu).`);
    const weak = SKILLS.map((x) => ({ ...x, v: avg(tail.map((r) => r[x.k])) })).sort((p, q) => p.v - q.v)[0];
    notes.push(`Nên tập trung: ${weak.name.toLowerCase()} (${weak.desc.toLowerCase()}).`);
  } else notes.push("Cần thêm vài phiếu nhận xét (tám chuyện hoặc gọi điện đủ lượt) để vẽ được đường tiến bộ.");

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island/path" label="Lộ trình" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Tiến bộ của tôi</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Đo năng lực nói thật, không chỉ đếm bài đã làm.</p>
        </div>
      </div>

      <section className="rounded-[20px] border-[3px] border-[#9CC77F] bg-[#F4FAEC] px-4 py-3 flex gap-3">
        <TrendingUp className="w-5 h-5 text-[#2C5A25] shrink-0 mt-0.5" />
        <ul className="flex flex-col gap-1 text-sm font-bold text-[#2C5A25]">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatTile label="Phút nói 7 ngày" value={`${Math.round(thisWeek)}′`} delta={lastWeek || thisWeek ? `${thisWeek - lastWeek >= 0 ? "+" : ""}${Math.round(thisWeek - lastWeek)}′ so với tuần trước` : undefined} good={lastWeek || thisWeek ? thisWeek >= lastWeek : null} />
        <StatTile label="Trình độ nói ước lượng" value={latest ? latest.cefr : "—"} delta={latest && first && latest !== first ? `lần đầu: ${first.cefr}` : undefined} good={latest && first ? (cefrIdx(latest.cefr) > cefrIdx(first.cefr) ? true : cefrIdx(latest.cefr) < cefrIdx(first.cefr) ? false : null) : null} />
        <StatTile label="Từ & câu đã nhớ" value={`${wordsKnown + phrasesKnown}`} delta={`${wordsKnown} từ · ${phrasesKnown} câu`} />
        <StatTile label="Chương đủ 3 chìa khoá" value={`${keysDone}/${CHAPTERS.length}`} />
      </div>

      <Card icon={Mic} title="Phút nói tiếng Anh mỗi ngày" sub={`14 ngày gần nhất · mục tiêu ${TALK_GOAL / 60} phút/ngày. Chỉ tính lúc bạn nói thật (theo số từ nói ra).`}>
        <Columns name="Phút nói mỗi ngày" points={talkPts} unit="phút" goal={TALK_GOAL / 60} goalLabel={`Mục tiêu ${TALK_GOAL / 60}′`} />
      </Card>

      <Card title="Trình độ nói ước lượng (CEFR)" sub="AI ước lượng sau mỗi lần tám chuyện / gọi điện đủ lượt.">
        {cefrPts.length >= 2 ? <Trend name="Trình độ CEFR" points={cefrPts} unit="" min={1} max={4} ticks={[1, 2, 3, 4]} format={(v) => CEFR[Math.round(v) - 1] || ""} /> : <Empty href="/island/chat" text="Tám chuyện với AI ít nhất 2 lần (đủ 5 lượt) để thấy đường này." />}
      </Card>

      <Card title="4 tiêu chí nói" sub="Điểm 1–5 của từng phiếu nhận xét, chấm theo trình độ chương đang học (3 = vững ở mức đó).">
        {reports.length >= 2 ? (
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3">
            {SKILLS.map((sk) => {
              const d = skillDelta(sk.k);
              return (
                <div key={sk.k}>
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-baloo font-extrabold leading-tight">{sk.name}</h3>
                    {d !== null && Math.abs(d) >= 0.1 && <span className="text-xs font-extrabold" style={{ color: d > 0 ? "#2C5A25" : "#A4521D" }}>{d > 0 ? `▲ +${d.toFixed(1)}` : `▼ ${d.toFixed(1)}`}</span>}
                  </div>
                  <p className="text-xs font-semibold text-[#6B4A30]">{sk.desc}</p>
                  <Trend name={sk.name} points={repPts(sk.k)} unit="điểm" min={1} max={5} ticks={[1, 3, 5]} height={96} />
                </div>
              );
            })}
          </div>
        ) : (
          <Empty href="/island/chat" text="Chưa đủ phiếu nhận xét. Tám chuyện hoặc gọi điện đủ lượt để nhận phiếu đầu tiên." />
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Tốc độ phản xạ" sub="Số giây trung bình từ lúc nghe hỏi tới lúc mở miệng. Càng thấp càng tốt.">
          {reflexPts.length >= 2 ? <Trend name="Tốc độ phản xạ" points={reflexPts} unit="giây" min={0} max={Math.max(6, ...reflexPts.map((p) => p.value))} height={110} /> : <Empty href="/island/reflex" text="Chơi Ao Phản Xạ bằng giọng nói 2 lần để thấy đường này." />}
        </Card>
        <Card title="Tốc độ nói (từ/phút)" sub="Từ các lần ghi âm ở Gương thời gian.">
          {mirrorPts.length >= 2 ? <Trend name="Tốc độ nói" points={mirrorPts} unit="từ/phút" min={0} max={Math.max(140, ...mirrorPts.map((p) => p.value))} height={110} /> : <Empty href="/island/mirror" text="Ghi âm ở Gương thời gian 2 lần (vd. ngày 1 và ngày 30) để so." />}
        </Card>
      </div>

      <p className="text-xs font-semibold text-[#6B4A30] flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Chương sau chỉ mở khi chương trước đủ <KeyRound className="inline w-3 h-3" /> 3 chìa khoá: Bài học, Nhập vai bằng giọng, Tám chuyện AI. Như vậy chương nào bạn cũng đã nói thật trước khi đi tiếp.
        </span>
      </p>
    </div>
  );
}

function Card({ title, sub, icon: Icon, children }: { title: string; sub?: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="cci-card-wood p-4 flex flex-col gap-2">
      <div>
        <h2 className="font-baloo font-extrabold text-lg leading-tight flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-[#3F7A34]" />} {title}
        </h2>
        {sub && <p className="text-xs font-semibold text-[#6B4A30] leading-snug">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text, href }: { text: string; href: string }) {
  return (
    <div className="rounded-[14px] border-2 border-dashed border-[#E6CF9A] bg-[#FFFBF2] px-3 py-3 flex items-center gap-2">
      <p className="flex-1 text-sm font-semibold text-[#6B4A30]">{text}</p>
      <Link href={href} className="cci-btn !min-h-[36px] !px-3 !text-sm shrink-0">
        Làm ngay <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
