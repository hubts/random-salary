import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/og"] }],
    sitemap: "https://random-salary.vercel.app/sitemap.xml",
    host: "https://random-salary.vercel.app",
  };
}
