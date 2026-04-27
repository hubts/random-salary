import { ImageResponse } from "next/og";
import { getPreset } from "@/lib/presets";
import { fmtWon } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GRADE_META: Record<string, { label: string; emoji: string; color: string }> = {
  SSS: { label: "전생에 나라를 구한 자", emoji: "👑", color: "#ffd93d" },
  SS: { label: "벼락부자", emoji: "💎", color: "#ff6b9d" },
  S: { label: "운명의 승리자", emoji: "🌟", color: "#fbbf24" },
  A: { label: "운빨 좋네요", emoji: "🍀", color: "#4ade80" },
  B: { label: "그럭저럭 평타", emoji: "🙂", color: "#60a5fa" },
  C: { label: "아쉬운 한 해", emoji: "😐", color: "#a78bfa" },
  D: { label: "운명이 비웃네요", emoji: "😭", color: "#fb923c" },
  F: { label: "전세계가 등 돌렸어요", emoji: "💀", color: "#f87171" },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const years = parseInt(searchParams.get("y") || "10", 10);
  const total = parseInt(searchParams.get("t") || "0", 10);
  const presetId = searchParams.get("v") || "classic";
  const gradeKey = (searchParams.get("g") || "B").toUpperCase();

  const preset = getPreset(presetId);
  const grade = GRADE_META[gradeKey] ?? GRADE_META.B;
  const safeTotal = years * 12 * 300;
  const isWin = total >= safeTotal;
  const diff = total - safeTotal;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #14142b 0%, #0a0a14 100%)",
          fontFamily: "sans-serif",
          color: "#f5f5f7",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", fontSize: 36, marginBottom: 12, opacity: 0.85 }}>
          🎰 월급 뽑기 챌린지
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 28,
            color: "#ffd93d",
            marginBottom: 30,
          }}
        >
          <span>{preset.emoji} {preset.name}</span>
          <span style={{ color: "#8b8ba7" }}>·</span>
          <span style={{ color: "#f5f5f7" }}>{years}년 근무</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 80px",
            borderRadius: 32,
            border: `4px solid ${grade.color}`,
            background: `${grade.color}22`,
            marginBottom: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 110, fontWeight: 900, color: grade.color, lineHeight: 1 }}>
            <span style={{ fontSize: 90 }}>{grade.emoji}</span>
            {gradeKey}
          </div>
          <div style={{ display: "flex", fontSize: 32, marginTop: 16, color: "#f5f5f7", fontWeight: 700 }}>
            {grade.label}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            fontSize: 56,
            fontWeight: 900,
          }}
        >
          <span style={{ color: "#8b8ba7", fontSize: 28 }}>총 수입</span>
          <span
            style={{
              color: isWin ? "#4ade80" : "#f87171",
            }}
          >
            {fmtWon(total)}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 8, color: "#8b8ba7" }}>
          {isWin ? `안정 대비 +${fmtWon(diff)} 🎉` : `안정 대비 ${fmtWon(diff)} 😭`}
        </div>

        <div style={{ display: "flex", marginTop: 40, fontSize: 22, color: "#8b8ba7" }}>
          random-salary.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
