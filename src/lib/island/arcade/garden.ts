// Ghép 3 vườn rau: lưới 8×8, đổi chỗ hai ô cạnh nhau; đủ 3 cùng loại theo hàng/cột thì nổ.
// Ghép 4 → ô sọc (nổ cả hàng hoặc cả cột). Ghép 5 → ô cầu vồng (đổi với loại nào thì dọn hết loại đó).
export const W = 8;
export const H = 8;
export const KINDS = 6;

export type Special = "row" | "col" | "rainbow";
export interface Cell {
  id: number;
  k: number; // loại rau 0..KINDS-1 (cầu vồng: -1)
  s?: Special;
  /** Vừa rơi xuống / mới mọc (để chạy hiệu ứng). */
  drop?: number;
}
export type Grid = Cell[]; // W*H, theo hàng

type Rand = () => number;
let uid = 1;
const nid = () => uid++;

const idx = (r: number, c: number) => r * W + c;

export function newGrid(rand: Rand = Math.random): Grid {
  for (;;) {
    const g: Grid = [];
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++) {
        let k: number;
        do k = Math.floor(rand() * KINDS);
        while ((c >= 2 && g[idx(r, c - 1)].k === k && g[idx(r, c - 2)].k === k) || (r >= 2 && g[idx(r - 1, c)].k === k && g[idx(r - 2, c)].k === k));
        g.push({ id: nid(), k });
      }
    if (hasMove(g)) return g;
  }
}

export interface Run {
  cells: number[];
  dir: "h" | "v";
}

export function findRuns(g: Grid): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < H; r++) {
    let c = 0;
    while (c < W) {
      const k = g[idx(r, c)].k;
      let e = c + 1;
      while (e < W && k >= 0 && g[idx(r, e)].k === k) e++;
      if (k >= 0 && e - c >= 3) runs.push({ cells: Array.from({ length: e - c }, (_, i) => idx(r, c + i)), dir: "h" });
      c = e;
    }
  }
  for (let c = 0; c < W; c++) {
    let r = 0;
    while (r < H) {
      const k = g[idx(r, c)].k;
      let e = r + 1;
      while (e < H && k >= 0 && g[idx(e, c)].k === k) e++;
      if (k >= 0 && e - r >= 3) runs.push({ cells: Array.from({ length: e - r }, (_, i) => idx(r + i, c)), dir: "v" });
      r = e;
    }
  }
  return runs;
}

export function adjacent(a: number, b: number): boolean {
  const ra = Math.floor(a / W),
    ca = a % W,
    rb = Math.floor(b / W),
    cb = b % W;
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
}

function swapped(g: Grid, a: number, b: number): Grid {
  const n = g.slice();
  [n[a], n[b]] = [n[b], n[a]];
  return n;
}

export function hasMove(g: Grid): boolean {
  for (let i = 0; i < W * H; i++) {
    if (g[i].s === "rainbow") return true;
    const r = Math.floor(i / W),
      c = i % W;
    for (const j of [c + 1 < W ? i + 1 : -1, r + 1 < H ? i + W : -1]) {
      if (j < 0) continue;
      if (findRuns(swapped(g, i, j)).length) return true;
    }
  }
  return false;
}

export interface Step {
  grid: Grid;
  /** Ô vừa nổ ở bước này (vị trí). */
  cleared: number[];
  /** Loại rau chính vừa nổ + số lượng (để hiện chữ tiếng Anh). */
  kind: number;
  count: number;
  combo: number;
  gained: number;
}

export interface SwapResult {
  ok: boolean;
  steps: Step[];
  score: number;
  /** Có tạo ô đặc biệt. */
  special: Special | null;
}

/** Nổ một tập ô, kích hoạt dây chuyền ô sọc. */
function expand(g: Grid, start: Set<number>): Set<number> {
  const out = new Set(start);
  const queue = [...start];
  while (queue.length) {
    const i = queue.pop()!;
    const cell = g[i];
    const r = Math.floor(i / W),
      c = i % W;
    let more: number[] = [];
    if (cell.s === "row") more = Array.from({ length: W }, (_, x) => idx(r, x));
    else if (cell.s === "col") more = Array.from({ length: H }, (_, y) => idx(y, c));
    for (const m of more)
      if (!out.has(m)) {
        out.add(m);
        queue.push(m);
      }
  }
  return out;
}

/** Rơi xuống lấp chỗ trống, mọc rau mới ở trên. drop = số hàng đã rơi (để vẽ hiệu ứng rơi). */
function gravity(g: Grid, rand: Rand): Grid {
  const n: Grid = new Array(W * H);
  for (let c = 0; c < W; c++) {
    let write = H - 1;
    for (let r = H - 1; r >= 0; r--) {
      const cell = g[idx(r, c)];
      if (!cell) continue;
      n[idx(write, c)] = { ...cell, drop: write - r };
      write--;
    }
    const fall = write + 1;
    for (let r = write; r >= 0; r--) n[idx(r, c)] = { id: nid(), k: Math.floor(rand() * KINDS), drop: fall };
  }
  return n;
}

/** Tính một lượt đổi chỗ: các bước nổ dây chuyền cho giao diện vẽ lần lượt. */
export function trySwap(g0: Grid, a: number, b: number, rand: Rand = Math.random): SwapResult {
  if (!adjacent(a, b)) return { ok: false, steps: [], score: 0, special: null };
  const A = g0[a],
    B = g0[b];
  // Cầu vồng: dọn hết loại của ô kia
  if (A.s === "rainbow" || B.s === "rainbow") {
    const other = A.s === "rainbow" ? B : A;
    const set = new Set<number>([a, b]);
    g0.forEach((cell, i) => {
      if (other.k >= 0 && cell.k === other.k) set.add(i);
      if (other.s === "rainbow") set.add(i);
    });
    return cascade(g0.map((c) => ({ ...c, drop: 0 })), expand(g0, set), other.k, rand, null);
  }
  const g = swapped(g0, a, b).map((c) => ({ ...c, drop: 0 }));
  const runs = findRuns(g);
  if (!runs.length) return { ok: false, steps: [], score: 0, special: null };
  return cascade(g, null, -1, rand, [a, b]);
}

function cascade(start: Grid, firstSet: Set<number> | null, firstKind: number, rand: Rand, swapAt: number[] | null): SwapResult {
  let g = start;
  const steps: Step[] = [];
  let score = 0;
  let combo = 0;
  let special: Special | null = null;
  let pre = firstSet;
  for (let guard = 0; guard < 40; guard++) {
    let set: Set<number>;
    let kind = firstKind;
    const create: { at: number; cell: Cell }[] = [];
    if (pre) {
      set = pre;
      pre = null;
    } else {
      const runs = findRuns(g);
      if (!runs.length) break;
      set = new Set<number>();
      for (const run of runs) {
        run.cells.forEach((i) => set.add(i));
        kind = g[run.cells[0]].k;
        if (run.cells.length >= 4) {
          const sw = swapAt;
          const at = (sw && run.cells.find((i) => sw.includes(i))) ?? run.cells[Math.floor(run.cells.length / 2)];
          const s: Special = run.cells.length >= 5 ? "rainbow" : run.dir === "h" ? "row" : "col";
          create.push({ at, cell: { id: nid(), k: s === "rainbow" ? -1 : g[at].k, s } });
          special = special === "rainbow" ? special : s;
        }
      }
      set = expand(g, set);
    }
    combo++;
    const count = set.size;
    const gained = count * 10 * combo;
    score += gained;
    const cleared = [...set];
    const holed: Grid = g.map((c, i) => (set.has(i) ? (null as unknown as Cell) : c));
    for (const cr of create) holed[cr.at] = cr.cell;
    const kindCount = cleared.filter((i) => g[i].k === kind).length || count;
    g = gravity(holed, rand);
    steps.push({ grid: g, cleared, kind, count: kindCount, combo, gained });
    swapAt = null;
  }
  // Hết nước đi thì xáo lại
  if (!hasMove(g)) {
    g = newGrid(rand);
    steps.push({ grid: g, cleared: [], kind: -1, count: 0, combo, gained: 0 });
  }
  return { ok: true, steps, score, special };
}
