"use client";

import { useEffect, useRef } from "react";
import type { Preset } from "@/lib/presets";
import { fmtShort } from "@/lib/format";

type Props = {
  yearLabel: string;
  slotText: string;
  slotRolling: boolean;
  slotPop: boolean;
  history: number[];
  preset: Preset;
  onSkip: () => void;
};

export function DrawScreen({ yearLabel, slotText, slotRolling, slotPop, history, preset, onSkip }: Props) {
  const historyEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history.length]);

  return (
    <section>
      <div className="card draw-stage">
        <div className="year-counter">{yearLabel}</div>
        <div className={`slot${slotRolling ? " rolling" : ""}${slotPop ? " pop" : ""}`}>
          <div className="slot-value">{slotText}</div>
        </div>
        <div className="history">
          {history.map((v, i) => {
            const tier = preset.table.find((t) => t.v === v);
            const rarityClass = tier && tier.p <= 0.005
              ? "legendary"
              : tier && tier.p <= 0.02
              ? "rare"
              : tier && tier.p <= 0.06
              ? "uncommon"
              : "common";
            return (
              <div key={i} className={`chip ${rarityClass}`}>
                {fmtShort(v)}
              </div>
            );
          })}
          <div ref={historyEndRef} />
        </div>
        <button className="btn btn-skip" onClick={onSkip} type="button">
          ⏭️ 결과 바로 보기
        </button>
      </div>
    </section>
  );
}
