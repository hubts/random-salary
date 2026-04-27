import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = "https://random-salary.vercel.app";
const TITLE = "🎰 월급 뽑기 챌린지";
const DESCRIPTION = "안정 월 300만원 vs 운명의 월급 뽑기! 30년 근무하면 얼마? 운빨로 인생역전 해볼래?";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "월급",
    "뽑기",
    "가챠",
    "월급챌린지",
    "월급 가챠",
    "직장인",
    "랜덤 월급",
    "확률",
    "재미",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "월급 뽑기 챌린지",
    locale: "ko_KR",
    images: [
      {
        url: "/og?y=30&v=classic&t=900000&g=A",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og?y=30&v=classic&t=900000&g=A"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
