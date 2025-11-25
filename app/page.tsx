"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [answerSeconds, setAnswerSeconds] = useState(60);
  const [passcode, setPasscode] = useState("");

  const handleCreateRoom = async () => {
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answerSeconds,
        passcode: passcode || undefined,
      }),
    });

    if (!res.ok) {
      alert("ルーム作成に失敗しました");
      return;
    }

    const data = await res.json(); // { id: "..." } が返ってくる想定
    if (!data.id) {
      console.error("room id が返ってきていません", data);
      alert("ルームID取得に失敗しました");
      return;
    }

    router.push(`/room/${data.id}`);
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      {/* 背景の装飾 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0)_0,_rgba(15,23,42,1)_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl py-10">
        {/* ヘッダー */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/70 shadow-md shadow-cyan-500/20 text-xs font-semibold tracking-[0.18em] uppercase">
              ES
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-wide">
                絵心伝心
              </h1>
              <p className="text-xs text-slate-400">
                マルチプレイお絵かき伝言ゲーム
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
            かんたん3ステップで、すぐに遊べます
          </span>
        </header>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
          {/* 左側：ヒーロー＆説明 */}
          <section className="space-y-6">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
                みんなで同じお題を絵だけで伝え合う
              </p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
                絵だけで伝わる？
                <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                  以心伝心お絵かきルーム
                </span>
                を作ろう
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed">
                配信・VC・オフ会にぴったりな、
                「お題 → 絵 → さらに絵…」で伝わっていくパーティーゲーム。
                <br className="hidden md:block" />
                ルームを作ってURLを共有するだけで、すぐに遊び始められます。
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="text-[11px] font-semibold text-slate-400">
                  STEP 1
                </div>
                <div className="mt-1 font-medium">
                  ルームを作成
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  制限時間とパスコードを決めて、
                  あなただけのルームを作ります。
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="text-[11px] font-semibold text-slate-400">
                  STEP 2
                </div>
                <div className="mt-1 font-medium">
                  URLをみんなに共有
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  配信の概要欄やDiscordに、
                  ルームURLを貼るだけで参加OK。
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="text-[11px] font-semibold text-slate-400">
                  STEP 3
                </div>
                <div className="mt-1 font-medium">
                  制限時間内にお絵かき
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  つながった絵を最後にまとめて見返して、
                  大盛りあがり間違いなし。
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              PC・スマホ両方から参加できます。
              ボイスチャットと組み合わせると、さらに盛り上がります。
              <br />
            </p>
          </section>

          {/* 右側：ルーム設定カード（元の機能そのまま） */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur-xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">
                  ルームを作成
                </h3>
                <p className="text-xs text-slate-400">
                  必要な項目だけ設定して、すぐにスタートできます。
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-400/30">
                ホスト専用
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span>制限時間（秒）</span>
                  <span className="text-[11px] text-slate-400">
                    1ターンあたりの持ち時間
                  </span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={answerSeconds}
                  onChange={(e) =>
                    setAnswerSeconds(Number(e.target.value || 60))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 focus:border-emerald-400 focus:ring-2 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span>パスコード（任意）</span>
                  <span className="text-[11px] text-slate-400">
                    配信や公開ルームでの荒らし防止に
                  </span>
                </label>
                <input
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-cyan-400/40 focus:border-cyan-400 focus:ring-2 transition"
                  placeholder="例）1234 / fam-only など"
                />
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:brightness-105 hover:shadow-xl active:translate-y-[1px]"
            >
              ルームを作成して遊び始める
            </button>

            <p className="text-[11px] leading-relaxed text-slate-500">
              ルーム作成後、表示されるURLを参加者に共有してください。
              パスコードを設定した場合は、参加者にも伝えてください。
            </p>
          </section>
        </div>
        <section className="relative z-10 w-full max-w-6xl mx-auto mt-20 mb-32 space-y-6">

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-6 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.6)]">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
              絵心伝心（art-synchro）とは？
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed text-sm md:text-base">
              絵心伝心は、オンラインで友だちや配信視聴者と一緒に楽しめる
              「お題 → 絵 → 絵…」の伝言ゲームです。インストール不要で、
              ブラウザだけあれば誰でも参加可能。PC・スマホの両方に対応しており、
              URL を共有するだけですぐに遊べます。
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-6 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.6)] space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold text-cyan-300">
              主な特徴
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm md:text-base">
              <li>インストール不要で、誰でもすぐに参加できる</li>
              <li>PC・スマホどちらからでもプレイ可能</li>
              <li>ルームURLを貼るだけで参加OK、配信者＆リスナーにも最適</li>
              <li>制限時間やパスコードを自由に設定できる</li>
              <li>最後に全員の絵をまとめて再生し、大盛りあがり</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-6 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.6)] space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold text-cyan-300">
              遊び方（3ステップ）
            </h3>
            <ol className="list-decimal pl-5 space-y-3 text-slate-300 text-sm md:text-base">
              <li>上のフォームからルームを作成します。</li>
              <li>生成されたURLを、友達や配信視聴者に共有します。</li>
              <li>制限時間内に絵を描き、最後に全員の絵をまとめて再生します。</li>
            </ol>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-6 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.6)] space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold text-cyan-300">
              利用シーン
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
              配信企画、友だち同士の通話、オンライン飲み会、サークル活動、
              オフ会のアイスブレイクなど、初対面でも盛り上がるゲームとしても人気です。
              手軽に遊べるため、長時間の配信の“つなぎ”としても使いやすい形式です。
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 px-6 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.6)] space-y-6">
            <h3 className="text-xl md:text-2xl font-semibold text-cyan-300">
              よくある質問（FAQ）
            </h3>

            <div className="space-y-4 text-sm md:text-base">
              <div>
                <p className="font-medium text-slate-200">Q. スマホでも描けますか？</p>
                <p className="text-slate-400">はい、スマホ・タブレットどちらでも遊べます。</p>
              </div>

              <div>
                <p className="font-medium text-slate-200">Q. 配信で使っても大丈夫？</p>
                <p className="text-slate-400">はい、特別な許可は不要です。</p>
              </div>

              <div>
                <p className="font-medium text-slate-200">Q. 何人まで参加できますか？</p>
                <p className="text-slate-400">12人まで参加可能です。</p>
              </div>
            </div>
          </div>

        </section>
      </div>
      <footer className="absolute bottom-3 left-4 text-[11px] text-slate-500/70 select-none">
        <a
          href="https://github.com/fin4le-p/art-synchro"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >github</a>
        <p>art-synchro v1.0.2</p>
        <p>配信等での利用にあたって、特別な許可は不要です。
          なお、本サービスの利用により発生したいかなるトラブルや損害についても、当方は一切の責任を負いません。</p>
      </footer>
    </main>
  );
}
