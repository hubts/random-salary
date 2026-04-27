"use client";

import { forwardRef } from "react";
import type { Preset } from "@/lib/presets";
import type { Grade } from "@/lib/grade";
import { fmtShort, fmtWon } from "@/lib/format";

type Props = {
  preset: Preset;
  years: number;
  draws: number[];
  grade: Grade;
  capturing: boolean;
  onCopyImage: () => void;
  onShare: () => void;
  onShareX: () => void;
  onShareThreads: () => void;
  onRetry: () => void;
};

export const ResultScreen = forwardRef<HTMLDivElement, Props>(function ResultScreen(
  { preset, years, draws, grade, capturing, onCopyImage, onShare, onShareX, onShareThreads, onRetry },
  ref,
) {
  const drawTotal = draws.reduce((a, b) => a + b, 0);
  const safeTotal = 300 * draws.length;
  const diff = drawTotal - safeTotal;
  const isWin = diff >= 0;
  const avg = draws.length ? Math.round(drawTotal / draws.length) : 0;
  const max = draws.length ? Math.max(...draws) : 0;
  const min = draws.length ? Math.min(...draws) : 0;

  return (
    <section>
      <div className="card" ref={ref}>
        <div
          className="grade-badge"
          style={{ ["--grade-color" as never]: grade.color }}
        >
          <div className="grade-rank">
            <span className="grade-emoji">{grade.emoji}</span>
            {grade.rank}
          </div>
          <div className="grade-label">{grade.label}</div>
        </div>

        <h2>📊 최종 결과</h2>
        <div className="result-meta">
          <span className="meta-badge">
            {preset.emoji} {preset.name}
          </span>
          <span className="meta-years">{years}년 근무</span>
        </div>
        <div className="result-grid">
          <div className="result-box safe">
            <div className="label">💼 안정 월 300만원</div>
            <div className="amount">{fmtWon(safeTotal)}</div>
          </div>
          <div className={`result-box draw ${isWin ? "win" : "lose"}`}>
            <div className="label">🎰 월급 뽑기</div>
            <div className="amount">{fmtWon(drawTotal)}</div>
          </div>
        </div>
        <div className={`verdict ${isWin ? "win" : "lose"}`}>
          {isWin ? (
            <>
              🎉 뽑기 대승! 인생역전!
              <span className="diff">+{fmtWon(diff)} 더 벌었어요</span>
            </>
          ) : (
            <>
              😭 안정이 최고였네요...
              <span className="diff">{fmtWon(diff)} 손해</span>
            </>
          )}
        </div>
        <div className="stats">
          <div className="stat">
            <div className="v">{fmtShort(avg)}</div>
            <div className="k">월 평균</div>
          </div>
          <div className="stat">
            <div className="v">{fmtShort(max)}</div>
            <div className="k">최고 월</div>
          </div>
          <div className="stat">
            <div className="v">{fmtShort(min)}</div>
            <div className="k">최저 월</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onCopyImage} disabled={capturing}>
          {capturing ? "📸 생성 중..." : "📸 이미지로 복사"}
        </button>
        <div className="share-row">
          <button className="btn btn-secondary share-btn" onClick={onShare}>
            🔗 공유
          </button>
          <button className="btn btn-secondary share-btn" onClick={onShareX} type="button">
            𝕏 트위터
          </button>
          <button className="btn btn-secondary share-btn" onClick={onShareThreads} type="button">
            @ 스레드
          </button>
        </div>
        <button className="btn btn-secondary" onClick={onRetry}>
          🔄 다시 뽑기
        </button>
      </div>
    </section>
  );
});
