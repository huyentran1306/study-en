"use client";

// Biểu đồ nhỏ cho trang "Tiến bộ của tôi". Mỗi biểu đồ một chuỗi số, một màu (không cần chú thích; tiêu đề nói tên).
// Nét mảnh, lưới mờ, rê chuột / chạm để xem số, luôn có "Xem dạng bảng".
import { useEffect, useRef, useState } from "react";

const MARK = "#3F7A34"; // xanh đảo (đã kiểm tra tương phản ≥ 3:1 trên nền sáng)
const WASH = "rgba(63,122,52,0.10)";
const GRID = "#EFE3CC";
const INK = "#4A3222";
const INK2 = "#6B4A30";
const SURFACE = "#FFFFFF";

function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null) as React.RefObject<T>;
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export interface Point {
  /** Nhãn trục ngang (ngắn). */
  x: string;
  /** Nhãn đầy đủ trong ô gợi ý. */
  label: string;
  value: number;
}

function TableView({ points, unit, name, format = fmt }: { points: Point[]; unit: string; name: string; format?: (v: number) => string }) {
  return (
    <details className="mt-1.5">
      <summary className="text-xs font-extrabold text-[#6B4A30] cursor-pointer select-none">Xem dạng bảng</summary>
      <table className="mt-1 w-full text-xs">
        <caption className="sr-only">{name}</caption>
        <thead>
          <tr className="text-left text-[#6B4A30]">
            <th className="font-bold py-0.5">Thời điểm</th>
            <th className="font-bold py-0.5 text-right">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i} className="border-t border-[#F3E6CC]">
              <td className="py-0.5 font-semibold">{p.label}</td>
              <td className="py-0.5 text-right font-bold tabular-nums">{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function Tip({ x, y, w, title, value }: { x: number; y: number; w: number; title: string; value: string }) {
  const left = Math.max(4, Math.min(w - 124, x - 60));
  return (
    <div className="absolute pointer-events-none z-10 rounded-[10px] bg-white border border-[#E6CF9A] shadow-md px-2 py-1 w-[120px]" style={{ left, top: Math.max(0, y - 52) }}>
      <div className="font-baloo font-extrabold text-sm leading-tight" style={{ color: INK }}>
        {value}
      </div>
      <div className="text-[11px] font-semibold leading-tight" style={{ color: INK2 }}>
        {title}
      </div>
    </div>
  );
}

/** Cột theo ngày (vd. phút nói), có vạch mục tiêu. */
export function Columns({ name, points, unit, goal, goalLabel, height = 150 }: { name: string; points: Point[]; unit: string; goal?: number; goalLabel?: string; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 26,
    padB = 18,
    padT = 10;
  const max = Math.max(goal || 0, ...points.map((p) => p.value), 1);
  const yMax = Math.ceil(max / 5) * 5 || 5;
  const plotW = Math.max(0, w - padL);
  const plotH = height - padB - padT;
  const band = points.length ? plotW / points.length : 0;
  const bw = Math.min(24, Math.max(4, band - 2));
  const y = (v: number) => padT + plotH - (v / yMax) * plotH;
  const ticks = [0, yMax / 2, yMax];
  return (
    <div>
      <div ref={ref} className="relative" style={{ height }}>
        {w > 0 && (
          <svg width={w} height={height} role="img" aria-label={name}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="10" fill={INK2}>
                  {fmt(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) => {
              const cx = padL + i * band + band / 2;
              const top = y(p.value);
              const h = Math.max(0, padT + plotH - top);
              const r = Math.min(4, h);
              return (
                <g key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${p.label}: ${fmt(p.value)} ${unit}`}>
                  <rect x={cx - band / 2} y={padT} width={band} height={plotH} fill="transparent" />
                  {h > 0 && <path d={`M${cx - bw / 2},${padT + plotH} V${top + r} Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top} H${cx + bw / 2 - r} Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r} V${padT + plotH} Z`} fill={MARK} opacity={hover === null || hover === i ? 1 : 0.55} />}
                  {(points.length - 1 - i) % Math.max(1, Math.ceil(points.length / (w < 480 ? 5 : 7))) === 0 && (
                    <text x={cx} y={height - 4} textAnchor="middle" fontSize="10" fill={INK2}>
                      {p.x}
                    </text>
                  )}
                </g>
              );
            })}
            {goal ? (
              <g>
                <line x1={padL} x2={w} y1={y(goal)} y2={y(goal)} stroke={INK2} strokeWidth={1} />
                <text x={padL + 3} y={y(goal) - 4} textAnchor="start" fontSize="10" fontWeight="700" fill={INK2} stroke={SURFACE} strokeWidth={3} paintOrder="stroke">
                  {goalLabel}
                </text>
              </g>
            ) : null}
          </svg>
        )}
        {hover !== null && points[hover] && <Tip x={padL + hover * band + band / 2} y={y(points[hover].value)} w={w} title={points[hover].label} value={`${fmt(points[hover].value)} ${unit}`} />}
      </div>
      <TableView points={points} unit={unit} name={name} />
    </div>
  );
}

/** Đường xu hướng (vd. điểm trôi chảy theo từng phiếu). lowerIsBetter: chỉ để ghi chú. */
export function Trend({ name, points, unit, min, max, height = 120, format = fmt, ticks: tickList }: { name: string; points: Point[]; unit: string; min: number; max: number; height?: number; format?: (v: number) => string; ticks?: number[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 22,
    padR = 30,
    padB = 6,
    padT = 10;
  const plotW = Math.max(0, w - padL - padR);
  const plotH = height - padB - padT;
  const x = (i: number) => padL + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - min) / (max - min || 1)) * plotH;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${d} L${x(points.length - 1).toFixed(1)},${padT + plotH} L${x(0).toFixed(1)},${padT + plotH} Z` : "";
  const last = points[points.length - 1];
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!points.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };
  return (
    <div>
      <div ref={ref} className="relative" style={{ height }}>
        {w > 0 && points.length > 0 && (
          <svg width={w} height={height} role="img" aria-label={name} onPointerMove={onMove} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y" }}>
            {(tickList || [min, (min + max) / 2, max]).map((t) => (
              <g key={t}>
                <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="10" fill={INK2}>
                  {format(t)}
                </text>
              </g>
            ))}
            {area && <path d={area} fill={WASH} />}
            <path d={d} fill="none" stroke={MARK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={INK2} strokeWidth={1} />}
            {points.map((p, i) =>
              i === points.length - 1 || i === hover ? <circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill={MARK} stroke={SURFACE} strokeWidth={2} /> : null,
            )}
            {last && (
              <text x={x(points.length - 1) + 7} y={y(last.value) + 4} fontSize="11" fontWeight="800" fill={INK}>
                {format(last.value)}
              </text>
            )}
          </svg>
        )}
        {hover !== null && points[hover] && <Tip x={x(hover)} y={y(points[hover].value)} w={w} title={points[hover].label} value={`${format(points[hover].value)} ${unit}`.trim()} />}
      </div>
      <TableView points={points} unit={unit} name={name} format={format} />
    </div>
  );
}

/** Ô số liệu: nhãn, giá trị, thay đổi so với kỳ trước (màu theo tốt/xấu). */
export function StatTile({ label, value, delta, good }: { label: string; value: string; delta?: string; good?: boolean | null }) {
  return (
    <div className="clay rounded-[18px] bg-white px-3 py-2.5">
      <div className="text-xs font-bold" style={{ color: INK2 }}>
        {label}
      </div>
      <div className="font-baloo font-extrabold text-2xl leading-tight" style={{ color: INK }}>
        {value}
      </div>
      {delta && (
        <div className="text-xs font-extrabold" style={{ color: good === null || good === undefined ? INK2 : good ? "#2C5A25" : "#A4521D" }}>
          {good === true ? "▲ " : good === false ? "▼ " : ""}
          {delta}
        </div>
      )}
    </div>
  );
}
