"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toBlob } from "html-to-image";

import { PRESETS, getPreset, type Preset } from "@/lib/presets";
import { drawOne, seededRng } from "@/lib/rng";
import { fmtShort } from "@/lib/format";
import { calcGrade } from "@/lib/grade";
import { burstConfetti } from "@/lib/confetti";
import {
  buildOgUrl,
  buildShareText,
  buildShareUrl,
  threadsIntent,
  twitterIntent,
} from "@/lib/share";

import { InputScreen } from "@/components/InputScreen";
import { DrawScreen } from "@/components/DrawScreen";
import { ResultScreen } from "@/components/ResultScreen";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
type Screen = "input" | "draw" | "result";

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
  const skipRef = useRef(false);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const finishRun = useCallback(async (collected: number[], target: number) => {
    setDraws(collected);
    setScreen("result");
    const total = collected.reduce((a, b) => a + b, 0);
    if (total >= 300 * target) burstConfetti(150);
  }, []);

  const runDraw = useCallback(
    async (targetYears: number, targetSeed: number, preset: Preset) => {
      const myRunId = ++runIdRef.current;
      skipRef.current = false;
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

        if (skipRef.current) {
          // 남은 월급은 즉시 계산
          while (collected.length < months) collected.push(drawOne(rng, table));
          await sleep(200);
          if (runIdRef.current !== myRunId) return;
          await finishRun(collected, months);
          return;
        }

        const year = Math.floor(m / 12) + 1;
        setYearLabel(`${year}년차 / ${targetYears}년 (${m + 1}/${months}월)`);
        setSlotRolling(true);

        for (let f = 0; f < rollFrames; f++) {
          if (runIdRef.current !== myRunId) return;
          if (skipRef.current) break;
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
      await finishRun(collected, months);
    },
    [finishRun],
  );

  // 공유 링크로 진입 시 자동 실행
  useEffect(() => {
    const y = parseInt(searchParams.get("y") || "", 10);
    const sParam = searchParams.get("s");
    const s = sParam !== null ? parseInt(sParam, 10) : NaN;
    const v = searchParams.get("v") || PRESETS[0].id;
    if (y && !Number.isNaN(s) && y >= 1 && y <= 50) {
      const preset = getPreset(v);
      setYears(y);
      setSeed(s);
      setPresetId(preset.id);
      runDraw(y, s, preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

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

  const handleSkip = () => {
    skipRef.current = true;
  };

  // 결과 화면 데이터
  const drawTotal = draws.reduce((a, b) => a + b, 0);
  const grade = calcGrade(draws, presetRef.current);

  const shareCtx = () => ({
    origin: window.location.origin,
    years,
    seed,
    preset: presetRef.current,
    total: drawTotal,
    grade,
  });

  const handleShare = async () => {
    const ctx = shareCtx();
    const url = buildShareUrl(ctx);
    const text = buildShareText(ctx);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "🎰 월급 뽑기 챌린지", text, url });
        return;
      } catch {
        // 사용자가 취소했거나 미지원 — 클립보드로 폴백
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast("🔗 링크가 복사됐어요!");
    } catch {
      prompt("링크를 복사하세요:", url);
    }
  };

  const handleShareX = () => {
    const ctx = shareCtx();
    window.open(twitterIntent(buildShareText(ctx), buildShareUrl(ctx)), "_blank", "noopener");
  };

  const handleShareThreads = () => {
    const ctx = shareCtx();
    window.open(threadsIntent(buildShareText(ctx), buildShareUrl(ctx)), "_blank", "noopener");
  };

  const handleCopyImage = async () => {
    if (!resultCardRef.current || capturing) return;
    setCapturing(true);
    try {
      const rawBlob = await toBlob(resultCardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        style: { margin: "0", boxShadow: "none" },
      });
      if (!rawBlob) throw new Error("capture failed");

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = URL.createObjectURL(rawBlob);
      });

      const padding = 48 * 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext("2d")!;
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        0,
        0,
        canvas.width / 2,
        0,
        canvas.height,
      );
      grad.addColorStop(0, "#14142b");
      grad.addColorStop(1, "#0a0a14");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      URL.revokeObjectURL(img.src);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/png"),
      );

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
        <InputScreen
          presetId={presetId}
          setPresetId={setPresetId}
          years={years}
          setYears={setYears}
          onStart={handleStart}
        />
      )}

      {screen === "draw" && (
        <DrawScreen
          yearLabel={yearLabel}
          slotText={slotText}
          slotRolling={slotRolling}
          slotPop={slotPop}
          history={history}
          preset={presetRef.current}
          onSkip={handleSkip}
        />
      )}

      {screen === "result" && (
        <ResultScreen
          ref={resultCardRef}
          preset={presetRef.current}
          years={years}
          draws={draws}
          grade={grade}
          capturing={capturing}
          onCopyImage={handleCopyImage}
          onShare={handleShare}
          onShareX={handleShareX}
          onShareThreads={handleShareThreads}
          onRetry={handleRetry}
        />
      )}

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container">
          <header>
            <h1>🎰 월급 뽑기 챌린지</h1>
          </header>
        </div>
      }
    >
      <SalaryChallenge />
    </Suspense>
  );
}
