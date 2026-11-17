"use client";

import Link from "next/link";
import { ArrowRight, Check, Flag, Pencil, Rocket, Star, UserRound } from "lucide-react";
import { SPRINT_DAYS, SPRINT_UNITS, sprintInfo, sprintUnitDone, startSprint, stopSprint, todayPlan, useIsland } from "@/lib/island/progress";
import { hasProfile, withArticle } from "@/lib/island/me";
import { sfx } from "@/lib/island/sfx";
import { cx } from "./ui";

/** Thẻ "Nước rút 30 ngày" ở trang Lộ trình: bật/tắt, lịch 30 ô, các chặng hôm nay. */
export function SprintCard({ mounted }: { mounted: boolean }) {
  const s = useIsland();
  const info = sprintInfo(s);
  const on = mounted && info.on;

  if (!on) {
    return (
      <div className="clay rounded-[26px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "linear-gradient(135deg,#FFE9B8,#FFD27A)" }}>
        <span className="gem w-14 h-14 shrink-0 rounded-[18px] flex items-center justify-center text-white" style={{ ["--tone" as string]: "#E0762B" }}>
          <Rocket className="w-7 h-7" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#A4521D]">Chế độ mới</div>
          <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">Nước rút 30 ngày</h2>
          <p className="text-sm sm:text-[15px] font-semibold text-[#6B4A30] mt-0.5">
            Đi hết 13 tình huống giao tiếp trong 30 ngày thay vì 13 tuần. Mỗi ngày 3–4 chặng, khoảng 25 phút: học, nghe, nói, tám với AI, ôn lỗi sai.
          </p>
        </div>
        <button
          type="button"
          data-sfx="none"
          className="cci-btn cci-btn-primary cci-btn-big gloss shrink-0"
          onClick={() => {
            startSprint();
            sfx.unlock();
          }}
        >
          {mounted && s.sprint ? "Tiếp tục nước rút" : "Bắt đầu nước rút"} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const plan = todayPlan(s);
  const next = plan.find((p) => !p.done);
  const pace = info.finished
    ? "Bạn đã hoàn thành cả 30 ngày!"
    : info.behind > 0
      ? `Đang chậm ${info.behind} ngày so với lịch. Hôm nào rảnh, làm thêm một chặng để bắt kịp.`
      : info.ahead > 0
        ? `Đang vượt lịch ${info.ahead} ngày. Giữ nhịp nhé!`
        : "Đang theo kịp lịch. Mỗi ngày một chặng là tới đích.";

  return (
    <div className="clay rounded-[26px] p-4 sm:p-5 flex flex-col gap-4" style={{ background: "linear-gradient(135deg,#FFF3D6,#FFE2A6)" }}>
      <div className="flex items-center gap-3">
        <span className="gem w-12 h-12 shrink-0 rounded-[16px] flex items-center justify-center text-white" style={{ ["--tone" as string]: "#E0762B" }}>
          <Rocket className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#A4521D]">Nước rút 30 ngày</div>
          <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">
            Ngày {info.day}/{SPRINT_DAYS} · {info.unit.title}
          </h2>
          <p className="text-sm font-semibold text-[#6B4A30]">{pace}</p>
        </div>
      </div>

      {/* Lịch 30 ô */}
      <ol className="grid grid-cols-10 gap-1 sm:gap-1.5" aria-label="Lịch 30 ngày">
        {SPRINT_UNITS.map((u, i) => {
          const done = sprintUnitDone(s, u);
          const cur = i === info.day - 1 && !done;
          return (
            <li
              key={u.day}
              title={`Ngày ${u.day}: ${u.title}`}
              className={cx(
                "h-8 sm:h-10 rounded-[10px] border-2 flex items-center justify-center text-[11px] sm:text-xs font-extrabold",
                done ? "bg-[#3F7A34] border-[#2C5A25] text-white" : cur ? "bg-[#F2C14E] border-[#4A3222] ring-2 ring-white" : "bg-white/70 border-[#E6CF9A] text-[#8B6B45]",
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : u.kind === "challenge" ? <Star className="w-3.5 h-3.5" /> : u.kind === "final" ? <Flag className="w-3.5 h-3.5" /> : u.day}
            </li>
          );
        })}
      </ol>

      {/* Chặng hôm nay */}
      <ul className="grid sm:grid-cols-2 gap-2">
        {plan.map((p, i) => (
          <li key={p.key}>
            <Link
              href={p.href}
              data-sfx="whoosh"
              className={cx("flex items-center gap-2.5 rounded-[16px] border-2 px-3 py-2 bg-white", p.done ? "border-[#6FAE4F] bg-[#F4FAEC]" : p === next ? "border-[#4A3222]" : "border-[#E6CF9A]")}
            >
              <span className={cx("w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-extrabold border-2", p.done ? "bg-[#3F7A34] border-[#2C5A25] text-white" : "bg-[#FFF1C7] border-[#4A3222]")}>
                {p.done ? <Check className="w-3.5 h-3.5" strokeWidth={3.5} /> : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-extrabold leading-tight truncate">{p.title}</span>
                <span className="block text-xs font-semibold text-[#6B4A30] truncate">{p.desc}</span>
              </span>
              <span className="text-xs font-bold text-[#6B4A30] shrink-0">{p.done ? "Xong" : `~${p.mins}′`}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {next ? (
          <Link href={next.href} data-sfx="whoosh" className="cci-btn cci-btn-primary gloss">
            Làm chặng tiếp theo <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="font-extrabold text-[#2C5A25]">Xong chặng hôm nay! Còn sức thì học vượt ở các chương bên dưới.</span>
        )}
        <button
          type="button"
          className="text-xs font-extrabold text-[#6B4A30] underline underline-offset-4 ml-auto"
          onClick={() => {
            if (confirm("Quay về nhịp 13 tuần (mỗi ngày một nhiệm vụ)? Tiến độ học vẫn giữ nguyên, bạn có thể bật lại nước rút bất cứ lúc nào.")) stopSprint();
          }}
        >
          Quay về nhịp 13 tuần
        </button>
      </div>
    </div>
  );
}

/** Thẻ nhỏ dẫn tới "Hồ sơ của tôi". */
export function ProfileCard({ mounted }: { mounted: boolean }) {
  const s = useIsland();
  const p = mounted && hasProfile(s.profile) ? s.profile : null;
  return (
    <Link href="/island/me" data-sfx="whoosh" className="clay rounded-[22px] p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform" style={{ background: p ? "#FFFFFF" : "#EAF5FB" }}>
      <span className="gem w-12 h-12 shrink-0 rounded-[16px] flex items-center justify-center text-white" style={{ ["--tone" as string]: "#2F8FB0" }}>
        <UserRound className="w-6 h-6" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-baloo font-extrabold text-lg leading-tight">Hồ sơ của tôi</span>
        <span className="block text-sm font-semibold text-[#6B4A30] leading-snug">
          {p ? [p.name, p.hometown, p.job && withArticle(p.job), p.hobby].filter(Boolean).join(" · ") : "Điền tên, quê, nghề, sở thích để bài học dùng thông tin thật của bạn thay cho câu mẫu."}
        </span>
      </span>
      <span className={cx("cci-btn shrink-0 !min-h-[40px]", !p && "cci-btn-primary")}>{p ? <Pencil className="w-4 h-4" /> : "Điền ngay"}</span>
    </Link>
  );
}
