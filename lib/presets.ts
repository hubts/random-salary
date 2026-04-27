export type Tier = { v: number; p: number };
export type Preset = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  table: Tier[];
};

export const PRESETS: Preset[] = [
  {
    id: "classic",
    name: "기본판",
    emoji: "🎰",
    desc: "밸런스 있는 원조 확률",
    table: [
      { v: 100, p: 0.165 },
      { v: 150, p: 0.2 },
      { v: 200, p: 0.235 },
      { v: 250, p: 0.18 },
      { v: 300, p: 0.155 },
      { v: 500, p: 0.05 },
      { v: 1000, p: 0.01 },
      { v: 5000, p: 0.004 },
      { v: 10000, p: 0.001 },
    ],
  },
  {
    id: "mild",
    name: "순한맛",
    emoji: "🍼",
    desc: "안정 300 근처, 대박은 귀함",
    table: [
      { v: 200, p: 0.3 },
      { v: 300, p: 0.45 },
      { v: 400, p: 0.18 },
      { v: 500, p: 0.05 },
      { v: 1000, p: 0.015 },
      { v: 5000, p: 0.005 },
    ],
  },
  {
    id: "spicy",
    name: "매운맛",
    emoji: "🌶️",
    desc: "하이리스크 하이리턴",
    table: [
      { v: 50, p: 0.5 },
      { v: 100, p: 0.25 },
      { v: 300, p: 0.15 },
      { v: 1000, p: 0.07 },
      { v: 5000, p: 0.02 },
      { v: 10000, p: 0.008 },
      { v: 50000, p: 0.002 },
    ],
  },
  {
    id: "nuclear",
    name: "핵폭탄판",
    emoji: "💣",
    desc: "거의 다 백수, 희박한 벼락부자",
    table: [
      { v: 0, p: 0.85 },
      { v: 100, p: 0.1 },
      { v: 1000, p: 0.04 },
      { v: 100000, p: 0.01 },
    ],
  },
];

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

export function expectedValue(table: Tier[]): number {
  return table.reduce((a, t) => a + t.v * t.p, 0);
}
