import type { Preset } from "./presets";
import { expectedValue } from "./presets";

export type Grade = {
  rank: "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "F";
  label: string;
  emoji: string;
  color: string;
};

// 안정 300만원 기준 + 기댓값 대비 실제 결과 비율로 등급 산정
export function calcGrade(draws: number[], preset: Preset): Grade {
  if (draws.length === 0) {
    return { rank: "C", label: "평범한 인생", emoji: "🙂", color: "#8b8ba7" };
  }
  const total = draws.reduce((a, b) => a + b, 0);
  const months = draws.length;
  const ev = expectedValue(preset.table);
  const evTotal = ev * months;
  const safeTotal = 300 * months;

  // 기댓값 대비 비율 (운빨 점수)
  const luck = evTotal > 0 ? total / evTotal : 1;
  // 안정 대비 비율 (체감 점수)
  const safe = total / safeTotal;

  // 가중 평균 — 안정 비교가 직관적이라 더 무겁게
  const score = safe * 0.7 + luck * 0.3;

  if (score >= 3.0) return { rank: "SSS", label: "전생에 나라를 구한 자", emoji: "👑", color: "#ffd93d" };
  if (score >= 2.0) return { rank: "SS", label: "벼락부자", emoji: "💎", color: "#ff6b9d" };
  if (score >= 1.5) return { rank: "S", label: "운명의 승리자", emoji: "🌟", color: "#fbbf24" };
  if (score >= 1.15) return { rank: "A", label: "운빨 좋네요", emoji: "🍀", color: "#4ade80" };
  if (score >= 0.95) return { rank: "B", label: "그럭저럭 평타", emoji: "🙂", color: "#60a5fa" };
  if (score >= 0.75) return { rank: "C", label: "아쉬운 한 해", emoji: "😐", color: "#a78bfa" };
  if (score >= 0.5) return { rank: "D", label: "운명이 비웃네요", emoji: "😭", color: "#fb923c" };
  return { rank: "F", label: "전세계가 등 돌렸어요", emoji: "💀", color: "#f87171" };
}
