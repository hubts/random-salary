"use client";

import { PRESETS, expectedValue, getPreset } from "@/lib/presets";
import { fmtShort } from "@/lib/format";

type Props = {
  presetId: string;
  setPresetId: (id: string) => void;
  years: number;
  setYears: (y: number) => void;
  onStart: () => void;
};

export function InputScreen({ presetId, setPresetId, years, setYears, onStart }: Props) {
  const currentPreset = getPreset(presetId);
  const ev = expectedValue(currentPreset.table);
  const diff300 = 300 - ev;

  return (
    <section>
      <div className="card">
        <h2>🎮 확률표 버전 선택</h2>
        <div className="preset-grid">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`preset-btn${p.id === presetId ? " active" : ""}`}
              onClick={() => setPresetId(p.id)}
              type="button"
            >
              <div className="preset-emoji">{p.emoji}</div>
              <div className="preset-name">{p.name}</div>
              <div className="preset-desc">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>📋 {currentPreset.emoji} {currentPreset.name} 확률표</h2>
        <div className="ev-banner">
          <div className="ev-label">월 기댓값 (장기 수렴값)</div>
          <div className="ev-value">{fmtShort(Math.round(ev))}원</div>
          <div className="ev-note">
            {diff300 > 0 ? (
              <>
                안정 300만원보다{" "}
                <b>{diff300.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원</b> 낮아요 😈
              </>
            ) : (
              <>
                안정 300만원보다{" "}
                <b>+{Math.abs(diff300).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원</b> 높아요 🔥
              </>
            )}
          </div>
        </div>
        <table className="prob-table">
          <tbody>
            {currentPreset.table.map((t) => (
              <tr key={t.v} className={t.p <= 0.02 ? "rare" : ""}>
                <td>{fmtShort(t.v)}원</td>
                <td>{(t.p * 100).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <label htmlFor="years">몇 년 동안 일하실 건가요?</label>
        <input
          id="years"
          type="number"
          min={1}
          max={50}
          value={years}
          onChange={(e) => setYears(parseInt(e.target.value, 10) || 0)}
        />
        <button className="btn btn-primary" onClick={onStart}>
          🎲 운명의 뽑기 시작!
        </button>
      </div>
    </section>
  );
}
