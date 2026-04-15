"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tier = { v: number; p: number };

const PROB: Tier[] = [
  { v: 100, p: 0.305 },
  { v: 200, p: 0.35 },
  { v: 300, p: 0.28 },
  { v: 500, p: 0.05 },
  { v: 1000, p: 0.01 },
  { v: 5000, p: 0.004 },
  { v: 10000, p: 0.001 },
];

function drawOne(rng: () => number): number {
  const r = rng();
  let acc = 0;
  for (const t of PROB) {
    acc += t.p;
    if (r < acc) return t.v;
  }
  return PROB[PROB.length - 1].v;
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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const EXPECTED_VALUE = PROB.reduce((a, t) => a + t.v * t.p, 0);

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

  const [slotText, setSlotText] = useState("???");
  const [slotRolling, setSlotRolling] = useState(false);
  const [slotPop, setSlotPop] = useState(false);
  const [yearLabel, setYearLabel] = useState("");
  const [history, setHistory] = useState<number[]>([]);

  const [draws, setDraws] = useState<number[]>([]);
  const [toast, setToast] = useState("");

  const runIdRef = useRef(0);
  const historyEndRef = useRef<HTMLDivElement>(null);

  const runDraw = useCallback(async (targetYears: number, targetSeed: number) => {
    const myRunId = ++runIdRef.current;
    setScreen("draw");
    setHistory([]);
    setDraws([]);

    const rng = seededRng(targetSeed);
    const months = targetYears * 12;
    const perDraw = months > 120 ? 60 : months > 60 ? 100 : 150;
    const rollFrames = months > 240 ? 3 : months > 120 ? 4 : 6;

    const collected: number[] = [];

    for (let m = 0; m < months; m++) {
      if (runIdRef.current !== myRunId) return;
      const year = Math.floor(m / 12) + 1;
      setYearLabel(`${year}년차 / ${targetYears}년 (${m + 1}/${months}월)`);
      setSlotRolling(true);

      for (let f = 0; f < rollFrames; f++) {
        if (runIdRef.current !== myRunId) return;
        const fake = PROB[Math.floor(Math.random() * PROB.length)].v;
        setSlotText(fmt(fake) + "만");
        await sleep(perDraw / rollFrames);
      }

      const val = drawOne(rng);
      collected.push(val);
      setSlotRolling(false);
      setSlotText(fmt(val) + "만");
      setSlotPop(true);
      setTimeout(() => setSlotPop(false), 500);

      setHistory((h) => [...h, val]);

      if (val >= 1000) {
        burstConfetti(val >= 5000 ? 80 : 30);
      }

      await sleep(val >= 1000 ? 500 : 50);
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
    if (y && s && y >= 1 && y <= 50) {
      setYears(y);
      setSeed(s);
      runDraw(y, s);
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
    runDraw(years, newSeed);
  };

  const handleRetry = () => {
    runIdRef.current++;
    setScreen("input");
    router.replace("/");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?y=${years}&s=${seed}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 링크가 복사됐어요!");
    } catch {
      prompt("링크를 복사하세요:", url);
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

      {screen === "input" && (
        <section>
          <div className="card">
            <h2>📋 뽑기 확률표</h2>
            <div className="ev-banner">
              <div className="ev-label">월 기댓값 (장기 수렴값)</div>
              <div className="ev-value">약 {EXPECTED_VALUE.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원</div>
              <div className="ev-note">
                안정 300만원보다{" "}
                <b>{(300 - EXPECTED_VALUE).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원</b> 낮아요 😈
              </div>
            </div>
            <table className="prob-table">
              <tbody>
                <tr>
                  <td>100만원</td>
                  <td>30.5%</td>
                </tr>
                <tr>
                  <td>200만원</td>
                  <td>35.0%</td>
                </tr>
                <tr>
                  <td>300만원</td>
                  <td>28.0%</td>
                </tr>
                <tr>
                  <td>500만원</td>
                  <td>5.0%</td>
                </tr>
                <tr className="rare">
                  <td>1,000만원</td>
                  <td>1.0%</td>
                </tr>
                <tr className="rare">
                  <td>5,000만원</td>
                  <td>0.4%</td>
                </tr>
                <tr className="rare">
                  <td>10,000만원</td>
                  <td>0.1%</td>
                </tr>
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
      )}

      {screen === "draw" && (
        <section>
          <div className="card draw-stage">
            <div className="year-counter">{yearLabel}</div>
            <div className={`slot${slotRolling ? " rolling" : ""}${slotPop ? " pop" : ""}`}>
              <div className="slot-value">{slotText}</div>
            </div>
            <div className="history">
              {history.map((v, i) => (
                <div key={i} className={`chip t-${v}`}>
                  {fmt(v)}
                </div>
              ))}
              <div ref={historyEndRef} />
            </div>
          </div>
        </section>
      )}

      {screen === "result" && (
        <section>
          <div className="card">
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
                <div className="v">{fmt(avg)}만</div>
                <div className="k">월 평균</div>
              </div>
              <div className="stat">
                <div className="v">{fmt(max)}만</div>
                <div className="k">최고 월</div>
              </div>
              <div className="stat">
                <div className="v">{fmt(min)}만</div>
                <div className="k">최저 월</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleShare}>
              🔗 친구에게 자랑하기
            </button>
            <button className="btn btn-secondary" onClick={handleRetry}>
              🔄 다시 뽑기
            </button>
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
