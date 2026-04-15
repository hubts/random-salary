"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toBlob } from "html-to-image";

type Tier = { v: number; p: number };
type Preset = {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  table: Tier[];
};

const PRESETS: Preset[] = [
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

function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

function drawOne(rng: () => number, table: Tier[]): number {
  const r = rng();
  let acc = 0;
  for (const t of table) {
    acc += t.p;
    if (r < acc) return t.v;
  }
  return table[table.length - 1].v;
}

function expectedValue(table: Tier[]): number {
  return table.reduce((a, t) => a + t.v * t.p, 0);
}

function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmt = (n: number) => n.toLocaleString("ko-KR");
const fmtWon = (n: number) => {
  if (n >= 10000) {
    const eok = Math.floor(n / 10000);
    const man = n % 10000;
    return man > 0 ? `${eok}억 ${fmt(man)}만원` : `${eok}억원`;
  }
  return `${fmt(n)}만원`;
};
const fmtShort = (n: number) => {
  if (n >= 10000) {
    const eok = n / 10000;
    const rounded = Number.isInteger(eok) ? eok.toString() : eok.toFixed(1);
    return `${rounded}억`;
  }
  return `${fmt(n)}만`;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Screen = "input" | "draw" | "result";

function burstConfetti(count = 50) {
  if (typeof document === "undefined") return;
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  const colors = ["#ffd93d", "#ff6b9d", "#4ade80", "#60a5fa", "#c4b5fd"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 0.5 + "s";
    c.style.animationDuration = 2 + Math.random() * 2 + "s";
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4500);
}

function SalaryChallenge() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [screen, setScreen] = useState<Screen>("input");
  const [years, setYears] = useState<number>(10);
  const [seed, setSeed] = useState<number>(0);
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const presetRef = useRef<Preset>(PRESETS[0]);

  const [slotText, setSlotText] = useState("???");
  const [slotRolling, setSlotRolling] = useState(false);
  const [slotPop, setSlotPop] = useState(false);
  const [yearLabel, setYearLabel] = useState("");
  const [history, setHistory] = useState<number[]>([]);

  const [draws, setDraws] = useState<number[]>([]);
  const [toast, setToast] = useState("");

  const runIdRef = useRef(0);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const runDraw = useCallback(async (targetYears: number, targetSeed: number, preset: Preset) => {
    const myRunId = ++runIdRef.current;
    presetRef.current = preset;
    setScreen("draw");
    setHistory([]);
    setDraws([]);

    const rng = seededRng(targetSeed);
    const months = targetYears * 12;
    const perDraw = months > 120 ? 60 : months > 60 ? 100 : 150;
    const rollFrames = months > 240 ? 3 : months > 120 ? 4 : 6;
    const table = preset.table;
    const bigThreshold = Math.max(1000, table[table.length - 1].v / 5);

    const collected: number[] = [];

    for (let m = 0; m < months; m++) {
      if (runIdRef.current !== myRunId) return;
      const year = Math.floor(m / 12) + 1;
      setYearLabel(`${year}년차 / ${targetYears}년 (${m + 1}/${months}월)`);
      setSlotRolling(true);

      for (let f = 0; f < rollFrames; f++) {
        if (runIdRef.current !== myRunId) return;
        const fake = table[Math.floor(Math.random() * table.length)].v;
        setSlotText(fmtShort(fake));
        await sleep(perDraw / rollFrames);
      }

      const val = drawOne(rng, table);
      collected.push(val);
      setSlotRolling(false);
      setSlotText(fmtShort(val));
      setSlotPop(true);
      setTimeout(() => setSlotPop(false), 500);

      setHistory((h) => [...h, val]);

      if (val >= bigThreshold) {
        burstConfetti(val >= bigThreshold * 5 ? 80 : 30);
      }

      await sleep(val >= bigThreshold ? 500 : 50);
    }

    if (runIdRef.current !== myRunId) return;
    await sleep(400);
    setDraws(collected);
    setScreen("result");

    const total = collected.reduce((a, b) => a + b, 0);
    if (total >= 300 * collected.length) burstConfetti(150);
  }, []);

  // Load from share link on mount
  useEffect(() => {
    const y = parseInt(searchParams.get("y") || "", 10);
    const s = parseInt(searchParams.get("s") || "", 10);
    const v = searchParams.get("v") || PRESETS[0].id;
    if (y && s && y >= 1 && y <= 50) {
      const preset = getPreset(v);
      setYears(y);
      setSeed(s);
      setPresetId(preset.id);
      runDraw(y, s, preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history.length]);

  const handleStart = () => {
    if (!years || years < 1 || years > 50) {
      alert("1~50 사이로 입력해주세요!");
      return;
    }
    const newSeed = Math.floor(Math.random() * 2 ** 32);
    setSeed(newSeed);
    runDraw(years, newSeed, getPreset(presetId));
  };

  const handleRetry = () => {
    runIdRef.current++;
    setScreen("input");
    router.replace("/");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?y=${years}&s=${seed}&v=${presetRef.current.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 링크가 복사됐어요!");
    } catch {
      prompt("링크를 복사하세요:", url);
    }
  };

  const handleCopyImage = async () => {
    if (!resultCardRef.current || capturing) return;
    setCapturing(true);
    try {
      const blob = await toBlob(resultCardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0a0a14",
        cacheBust: true,
        filter: (node) => !(node instanceof HTMLElement && node.classList?.contains("no-capture")),
      });
      if (!blob) throw new Error("capture failed");

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("📸 이미지 복사 완료!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `월급뽑기_${years}년.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("📥 이미지 다운로드!");
      }
    } catch (e) {
      console.error(e);
      showToast("❌ 이미지 생성 실패");
    } finally {
      setCapturing(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const drawTotal = draws.reduce((a, b) => a + b, 0);
  const safeTotal = 300 * draws.length;
  const diff = drawTotal - safeTotal;
  const isWin = diff >= 0;
  const avg = draws.length ? Math.round(drawTotal / draws.length) : 0;
  const max = draws.length ? Math.max(...draws) : 0;
  const min = draws.length ? Math.min(...draws) : 0;

  return (
    <div className="container">
      <header>
        <h1>🎰 월급 뽑기 챌린지</h1>
        <p className="subtitle">
          안정적인 월 300만원 vs 운명의 월급 뽑기
          <br />
          과연 당신의 선택은?
        </p>
      </header>

      {screen === "input" && (() => {
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
              <button className="btn btn-primary" onClick={handleStart}>
                🎲 운명의 뽑기 시작!
              </button>
            </div>
          </section>
        );
      })()}

      {screen === "draw" && (
        <section>
          <div className="card draw-stage">
            <div className="year-counter">{yearLabel}</div>
            <div className={`slot${slotRolling ? " rolling" : ""}${slotPop ? " pop" : ""}`}>
              <div className="slot-value">{slotText}</div>
            </div>
            <div className="history">
              {history.map((v, i) => {
                const table = presetRef.current.table;
                const tier = table.find((t) => t.v === v);
                const rarityClass = tier && tier.p <= 0.005 ? "legendary" : tier && tier.p <= 0.02 ? "rare" : tier && tier.p <= 0.06 ? "uncommon" : "common";
                return (
                  <div key={i} className={`chip ${rarityClass}`}>
                    {fmtShort(v)}
                  </div>
                );
              })}
              <div ref={historyEndRef} />
            </div>
          </div>
        </section>
      )}

      {screen === "result" && (
        <section>
          <div className="card" ref={resultCardRef}>
            <h2>📊 최종 결과</h2>
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
            <div className="no-capture">
              <button className="btn btn-primary" onClick={handleCopyImage} disabled={capturing}>
                {capturing ? "📸 생성 중..." : "📸 이미지로 복사"}
              </button>
              <button className="btn btn-secondary" onClick={handleShare}>
                🔗 링크 공유
              </button>
              <button className="btn btn-secondary" onClick={handleRetry}>
                🔄 다시 뽑기
              </button>
            </div>
          </div>
        </section>
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="container"><header><h1>🎰 월급 뽑기 챌린지</h1></header></div>}>
      <SalaryChallenge />
    </Suspense>
  );
}
