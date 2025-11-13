import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://art-synchro.nakano6.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/room/"], // 動的ルーム全除外
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
