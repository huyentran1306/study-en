// Ghép sinh vật biển: bảng 4×4, vuốt để dồn; hai con cùng bậc chạm nhau thì gộp lên bậc kế.
// Cứ mỗi TIDE_EVERY lượt có "sóng triều" đẩy một chai rác vào bảng; gộp con ngay cạnh để dọn rác (+điểm).
export const SIZE = 4;
export const MAX_TIER = 10;
export const TRASH = -1;
export const TIDE_EVERY = 25;

export interface Tile {
  id: number;
  v: number; // bậc 0..MAX_TIER, hoặc TRASH
  r: number;
  c: number;
  /** Vừa gộp ở lượt này (để chạy hiệu ứng). */
  merged?: boolean;
  /** Vừa xuất hiện. */
  fresh?: boolean;
}

export interface MergeGame {
  tiles: Tile[];
  score: number;
  moves: number;
  nextId: number;
  /** Bậc cao nhất từng có trong ván. */
  top: number;
  over: boolean;
}

export type Dir = "up" | "down" | "left" | "right";

type Rand = () => number;

function empties(tiles: Tile[]): [number, number][] {
  const used = new Set(tiles.map((t) => t.r * SIZE + t.c));
  const out: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!used.has(r * SIZE + c)) out.push([r, c]);
  return out;
}

function spawn(g: MergeGame, rand: Rand, v?: number): MergeGame {
  const e = empties(g.tiles);
  if (!e.length) return g;
  const [r, c] = e[Math.floor(rand() * e.length)];
  const tile: Tile = { id: g.nextId, v: v ?? (rand() < 0.1 ? 1 : 0), r, c, fresh: true };
  return { ...g, tiles: [...g.tiles, tile], nextId: g.nextId + 1 };
}

export function newGame(rand: Rand = Math.random): MergeGame {
  let g: MergeGame = { tiles: [], score: 0, moves: 0, nextId: 1, top: 0, over: false };
  g = spawn(g, rand);
  g = spawn(g, rand);
  return g;
}

/** Điểm khi gộp ra bậc t (giống thang 4, 8, 16…). */
export function mergeScore(t: number): number {
  return 2 ** (t + 1);
}
export const TRASH_BONUS = 24;

export interface MoveResult {
  game: MergeGame;
  moved: boolean;
  /** Các bậc vừa gộp ra ở lượt này. */
  made: number[];
  /** Số rác đã dọn. */
  cleaned: number;
  /** Có sóng triều đẩy rác vào. */
  tide: boolean;
  /** Ô bị gộp vào ô khác: giữ lại một nhịp để vẽ trượt tới chỗ gộp. */
  ghosts: Tile[];
}

export function move(g0: MergeGame, dir: Dir, rand: Rand = Math.random): MoveResult {
  const g: MergeGame = { ...g0, tiles: g0.tiles.map((t) => ({ ...t, merged: false, fresh: false })) };
  const at = new Map(g.tiles.map((t) => [t.r * SIZE + t.c, t]));
  const ghosts: Tile[] = [];
  const made: number[] = [];
  let moved = false;
  let gained = 0;
  const lines: [number, number][][] = [];
  for (let i = 0; i < SIZE; i++) {
    const line: [number, number][] = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === "left") line.push([i, j]);
      else if (dir === "right") line.push([i, SIZE - 1 - j]);
      else if (dir === "up") line.push([j, i]);
      else line.push([SIZE - 1 - j, i]);
    }
    lines.push(line);
  }
  const result: Tile[] = [];
  for (const line of lines) {
    const items = line.map(([r, c]) => at.get(r * SIZE + c)).filter(Boolean) as Tile[];
    const placed: Tile[] = [];
    for (const t of items) {
      const last = placed[placed.length - 1];
      if (last && !last.merged && last.v === t.v && t.v !== TRASH && t.v < MAX_TIER) {
        last.v += 1;
        last.merged = true;
        made.push(last.v);
        gained += mergeScore(last.v);
        ghosts.push({ ...t, r: last.r, c: last.c });
        moved = true;
        continue;
      }
      const [r, c] = line[placed.length];
      if (t.r !== r || t.c !== c) moved = true;
      t.r = r;
      t.c = c;
      placed.push(t);
    }
    result.push(...placed);
  }
  if (!moved) return { game: g0, moved: false, made: [], cleaned: 0, tide: false, ghosts: [] };
  // Dọn rác nằm cạnh ô vừa gộp
  const mergedCells = result.filter((t) => t.merged);
  let cleaned = 0;
  const kept = result.filter((t) => {
    if (t.v !== TRASH) return true;
    const near = mergedCells.some((m) => Math.abs(m.r - t.r) + Math.abs(m.c - t.c) === 1);
    if (near) cleaned++;
    return !near;
  });
  gained += cleaned * TRASH_BONUS;
  let next: MergeGame = { ...g, tiles: kept, score: g.score + gained, moves: g.moves + 1, top: Math.max(g.top, ...made, 0) };
  next = spawn(next, rand);
  let tide = false;
  if (next.moves % TIDE_EVERY === 0 && next.tiles.filter((t) => t.v === TRASH).length < 2 && empties(next.tiles).length > 1) {
    next = spawn(next, rand, TRASH);
    tide = true;
  }
  next = { ...next, over: !canMove(next) };
  return { game: next, moved: true, made, cleaned, tide, ghosts };
}

export function canMove(g: MergeGame): boolean {
  if (empties(g.tiles).length) return true;
  const at = new Map(g.tiles.map((t) => [t.r * SIZE + t.c, t.v]));
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = at.get(r * SIZE + c)!;
      if (v === TRASH || v >= MAX_TIER) continue;
      if (c + 1 < SIZE && at.get(r * SIZE + c + 1) === v) return true;
      if (r + 1 < SIZE && at.get((r + 1) * SIZE + c) === v) return true;
    }
  return false;
}

/** Kiểm tra dữ liệu ván đã lưu (localStorage) còn hợp lệ. */
export function validGame(x: unknown): x is MergeGame {
  const g = x as MergeGame;
  if (!g || !Array.isArray(g.tiles) || typeof g.score !== "number" || typeof g.nextId !== "number") return false;
  const seen = new Set<number>();
  for (const t of g.tiles) {
    if (typeof t.v !== "number" || t.v < TRASH || t.v > MAX_TIER || t.r < 0 || t.r >= SIZE || t.c < 0 || t.c >= SIZE) return false;
    const k = t.r * SIZE + t.c;
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}
