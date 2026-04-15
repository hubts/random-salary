import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🎰 월급 뽑기 챌린지",
  description: "안정 월 300만원 vs 운명의 월급 뽑기! 과연 당신의 선택은?",
  openGraph: {
    title: "🎰 월급 뽑기 챌린지",
    description: "안정 월 300만원 vs 운명의 월급 뽑기!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
