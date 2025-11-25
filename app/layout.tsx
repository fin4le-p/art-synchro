import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Analytics from "./analytics";
import "./globals.css";

const siteUrl = new URL("https://art-synchro.nakano6.com");
const gaId = process.env.NEXT_PUBLIC_GA_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "絵心伝心 - パーティーゲーム！",
  description: "以心伝心ゲームの絵心伝心！「お題 → 絵 → 絵…」で以心伝心できる、ブラウザだけで遊べるオンラインお絵かき伝言ゲーム。配信・VC・オフ会の場を盛り上げたいときにぴったりです。ルームを作成してURLを共有するだけで、PC・スマホからすぐ参加できます。",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "絵心伝心 - パーティーゲーム！",
    description: "以心伝心ゲームの絵心伝心！「お題 → 絵 → 絵…」で以心伝心できる、ブラウザだけで遊べるオンラインお絵かき伝言ゲーム。配信・VC・オフ会の場を盛り上げたいときにぴったりです。ルームを作成してURLを共有するだけで、PC・スマホからすぐ参加できます。",
    siteName: "art-synchro.nakano6.com",
    images: [
      {
        url: "/ogp.png",
        width: 1200,
        height: 630,
        alt: "art-synchro",
      },
    ],
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "絵心伝心 - パーティーゲーム！",
    description: "以心伝心ゲームの絵心伝心！",
    images: ["/ogp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* ① gtag本体 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />

        {/* ② 初期化（自動PVは切る） */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { send_page_view: false });
          `}
        </Script>

        {/* ③ ルータ監視（あなたの Analytics コンポーネント） */}
        <Analytics />
      </body>
    </html>
  );
}
