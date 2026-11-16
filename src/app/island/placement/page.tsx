"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Character } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { LEVELS, PLACEMENT, type Level } from "@/lib/island/curriculum";
import { applyPlacement } from "@/lib/island/progress";
import { sfx } from "@/lib/island/sfx";

export default function PlacementPage() {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);

  const done = answers.length === PLACEMENT.length;

  const correctBy = (lv: Level) => PLACEMENT.filter((q, k) => q.level === lv && answers[k] === q.answer).length;
  const a1 = correctBy("A1");
  const a2 = correctBy("A2");
  const b1 = correctBy("B1");
  const result: Level = a1 >= 3 && a2 >= 3 && b1 >= 3 ? "B1" : a1 >= 3 && a2 >= 2 ? "A2" : "A1";
  const total = a1 + a2 + b1;

  if (!started) {
    return (
      <div className="max-w-xl mx-auto px-3 sm:px-6 py-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <BackLink href="/island/path" label="Lộ trình" />
          <h1 className="text-2xl sm:text-3xl font-extrabold">Kiểm tra xếp lớp</h1>
        </div>
        <div className="cci-card-wood p-5 flex items-center gap-4" style={{ background: "#F3E4C6" }}>
          <div className="w-24 shrink-0">
            <Character who="kero" mood="wave" size="100%" />
          </div>
          <p className="font-bold leading-snug">
            {PLACEMENT.length} câu ngắn (~3 phút) từ A1 đến B1. Đừng đoán bừa — câu nào không chắc cứ chọn theo cảm giác tự nhiên nhất. Kết quả sẽ mở khoá cấp phù hợp với bạn, các chương trước vẫn học được bất cứ lúc nào.
          </p>
        </div>
        <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={() => setStarted(true)}>
          Bắt đầu <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (done) {
    const lv = LEVELS.find((l) => l.id === result)!;
    return (
      <div className="max-w-xl mx-auto px-3 sm:px-6 py-8 flex flex-col items-center gap-4 text-center">
        <div className="w-36 rounded-[24px] bg-[#E4EFC9] pt-4 flex justify-center">
          <Character who="kero" mood="happy" size="80%" />
        </div>
        <div className="text-sm font-extrabold uppercase tracking-[0.1em] text-[#3F7A34]">Kết quả · đúng {total}/{PLACEMENT.length}</div>
        <h1 className="text-3xl font-extrabold leading-tight">
          Bạn nên bắt đầu ở {result} · {lv.name}
        </h1>
        <div className="grid grid-cols-3 gap-2 w-full">
          {(["A1", "A2", "B1"] as Level[]).map((l) => (
            <div key={l} className="cci-card px-3 py-2">
              <div className="font-baloo font-extrabold text-xl">{l}</div>
              <div className="text-sm font-bold text-[#6B4A30]">{correctBy(l)}/4 đúng</div>
            </div>
          ))}
        </div>
        <p className="font-semibold text-[#6B4A30]">
          {result === "A1"
            ? "Bắt đầu từ Chương 1 sẽ giúp bạn chắc nền móng giao tiếp. Lộ trình 13 tuần là vừa đẹp."
            : `Mình sẽ mở khoá tới ${lv.weeks.toLowerCase()} (${lv.name}). Bạn vẫn nên ôn nhanh các chương trước khi rảnh.`}
        </p>
        {applied ? (
          <Link href="/island/path" className="cci-btn cci-btn-primary cci-btn-big">
            Xem lộ trình <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              type="button"
              className="cci-btn cci-btn-primary cci-btn-big"
              onClick={() => {
                applyPlacement(result, total);
                setApplied(true);
                sfx.correct();
              }}
            >
              Áp dụng kết quả
            </button>
            <button
              type="button"
              className="cci-btn cci-btn-big"
              onClick={() => {
                setAnswers([]);
                setI(0);
                setPicked(null);
              }}
            >
              Làm lại
            </button>
          </div>
        )}
      </div>
    );
  }

  const q = PLACEMENT[i];
  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink href="/island/path" label="Lộ trình" />
        <div className="flex-1 h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
          <div className="h-full bg-[#6FAE4F]" style={{ width: `${(i / PLACEMENT.length) * 100}%` }} />
        </div>
        <span className="text-sm font-extrabold">
          {i + 1}/{PLACEMENT.length}
        </span>
      </div>
      <div className="cci-card p-5 flex flex-col gap-2">
        <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#6B4A30]">{q.qVi}</span>
        <p className="font-baloo font-extrabold text-2xl leading-snug">{q.q}</p>
      </div>
      <div className="flex flex-col gap-3">
        {q.options.map((o, k) => (
          <button key={o} type="button" onClick={() => setPicked(k)} className={cx("cci-option", picked === k && "!border-[#F2C14E] !bg-[#FFF6DA]")}>
            <span className="cci-letter">{"ABC"[k]}</span>
            <span className="font-baloo font-extrabold text-[17px]">{o}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="cci-btn cci-btn-primary cci-btn-big"
        disabled={picked === null}
        onClick={() => {
          setAnswers((a) => [...a, picked!]);
          setPicked(null);
          setI((n) => Math.min(n + 1, PLACEMENT.length - 1));
        }}
      >
        {i + 1 === PLACEMENT.length ? "Xem kết quả" : "Câu tiếp"} <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
