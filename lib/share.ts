import type { Grade } from "./grade";
import type { Preset } from "./presets";
import { fmtWon } from "./format";

export type ShareInput = {
  origin: string;
  years: number;
  seed: number;
  preset: Preset;
  total: number;
  grade: Grade;
};

export function buildShareUrl(i: Pick<ShareInput, "origin" | "years" | "seed" | "preset">): string {
  return `${i.origin}/?y=${i.years}&s=${i.seed}&v=${i.preset.id}`;
}

export function buildOgUrl(i: Pick<ShareInput, "origin" | "years" | "preset" | "total" | "grade">): string {
  const params = new URLSearchParams({
    y: String(i.years),
    v: i.preset.id,
    t: String(i.total),
    g: i.grade.rank,
  });
  return `${i.origin}/og?${params.toString()}`;
}

export function buildShareText(i: Pick<ShareInput, "years" | "preset" | "total" | "grade">): string {
  return `🎰 월급 뽑기 챌린지\n${i.preset.emoji} ${i.preset.name} · ${i.years}년 근무\n${i.grade.emoji} ${i.grade.rank}급 (${i.grade.label})\n💰 총 ${fmtWon(i.total)}`;
}

export function twitterIntent(text: string, url: string): string {
  const params = new URLSearchParams({ text: `${text}\n\n`, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function threadsIntent(text: string, url: string): string {
  const params = new URLSearchParams({ text: `${text}\n\n${url}` });
  return `https://www.threads.net/intent/post?${params.toString()}`;
}
