import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "絵心伝心 - パーティーゲーム！",
  description: "以心伝心ゲームの絵心伝心！",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "絵心伝心 - パーティーゲーム！",
    description: "以心伝心ゲームの絵心伝心！",
    url: "https://art-synchro.nakano6.com",
    siteName: "art-synchro",
    images: [
      {
        url: "/ogp.png",
        width: 1200,
        height: 630,
        alt: "art-synchro",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "絵心伝心 - パーティーゲーム！",
    description: "以心伝心ゲームの絵心伝心！",
    images: ["/ogp.png"],
    creator: "@your_twitter_id",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* GA: gtag.js を非同期読み込み */}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: false }); // ルーターでPV送るためfalse
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
