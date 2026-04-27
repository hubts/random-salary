import type { Tier } from "./presets";

export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawOne(rng: () => number, table: Tier[]): number {
  const r = rng();
  let acc = 0;
  for (const t of table) {
    acc += t.p;
    if (r < acc) return t.v;
  }
  return table[table.length - 1].v;
}

export function drawAll(seed: number, months: number, table: Tier[]): number[] {
  const rng = seededRng(seed);
  const out: number[] = [];
  for (let i = 0; i < months; i++) out.push(drawOne(rng, table));
  return out;
}
