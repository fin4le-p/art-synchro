"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Gtag = {
  (command: "js", date: Date): void;
  (command: "config", targetId: string, config?: Record<string, unknown>): void;
  (command: "event", action: string, params?: Record<string, unknown>): void;
  (command: "set", params: Record<string, unknown>): void;
  (command: "consent", mode: "default" | "update", params: Record<string, unknown>): void;
};

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId || typeof window === "undefined") return;

    let timeoutId: number | undefined;

    const sendPageView = () => {
      if (typeof window.gtag !== "function") {
        // gtag がまだ生えてない場合はちょっと待ってリトライ
        timeoutId = window.setTimeout(sendPageView, 200);
        return;
      }

      const url =
        pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

      window.gtag("event", "page_view", {
        page_location: window.location.origin + url,
        page_path: pathname,
        page_title: document.title,
      });
    };

    sendPageView();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}