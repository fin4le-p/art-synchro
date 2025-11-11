"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  PointerEvent,
} from "react";
import { useRouter } from "next/navigation";

const { use } = React;

type Player = {
  id: string;
  name: string;
  isLeader: boolean;
  submitted: boolean;
  lastSeenAt: number;
  joinFromRound: number; // ★ 追加
};

type Round = {
  index: number;
  question: string;
  status: "waiting" | "answering" | "revealed";
  startedAt: number;
  result?: "success" | "fail";
  answers: Record<string, string>; // dataURL
};

type Room = {
  id: string;
  passcode?: string;
  answerSeconds: number;
  players: Player[];
  round: Round | null;
  successCount: number;
  failCount: number;
};

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

type Point = { x: number; y: number };
type Stroke = {
  color: string;
  width: number;
  points: Point[];
};

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter();
  const { roomId } = use(params);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");

  const [soundSuccess] = useState(
    () => (typeof Audio !== "undefined" ? new Audio("/success.mp3") : null)
  );
  const [soundFail] = useState(
    () => (typeof Audio !== "undefined" ? new Audio("/fail.mp3") : null)
  );

  // キャンバス
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<Point | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(4);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // localStorage から初期値
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedName = window.localStorage.getItem("eg_name");
    if (storedName) setName(storedName);
    const storedPlayerId = window.localStorage.getItem(`eg_player_${roomId}`);
    if (storedPlayerId) setPlayerId(storedPlayerId);
  }, [roomId]);

  // beforeunload で /leave を叩く
  useEffect(() => {
    if (!playerId) return;

    const handler = () => {
      fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
        keepalive: true,
      });
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [roomId, playerId]);

  // キャンバス初期化
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseWidth = 1200;
    const baseHeight = 800;
    canvas.width = baseWidth;
    canvas.height = baseHeight;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokesRef.current = [];
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      const [first, ...rest] = stroke.points;
      ctx.moveTo(first.x, first.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokesRef.current = [];
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  }, []);

  const getCanvasPos = (e: PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!room?.round || room.round.status !== "answering") return;

    const me = playerId
      ? room.players.find((p) => p.id === playerId)
      : undefined;
    if (!me) return;

    const canAnswerThisRound = me.joinFromRound <= room.round.index;
    if (!canAnswerThisRound || me.submitted) return;

    const pos = getCanvasPos(e);
    if (!pos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    lastPointRef.current = pos;

    const stroke: Stroke = {
      color: brushColor,
      width: brushWidth,
      points: [pos],
    };
    currentStrokeRef.current = stroke;
    strokesRef.current.push(stroke);

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasPos(e);
    if (!pos) return;

    const last = lastPointRef.current;
    if (!last) {
      lastPointRef.current = pos;
      return;
    }

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    stroke.points.push(pos);

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPointRef.current = pos;
  };

  const stopDrawing = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    setIsDrawing(false);
    lastPointRef.current = null;
    currentStrokeRef.current = null;
  };

  const undoLast = () => {
    if (!room?.round || room.round.status !== "answering") return;
    const me = playerId
      ? room.players.find((p) => p.id === playerId)
      : undefined;
    if (!me) return;

    const canAnswerThisRound = me.joinFromRound <= room.round.index;
    if (!canAnswerThisRound || me.submitted) return;

    strokesRef.current.pop();
    redrawAll();
  };

  // ラウンド切り替え時にキャンバス初期化
  useEffect(() => {
    initCanvas();
  }, [initCanvas, room?.round?.index]);

  // 状態取得（heartbeat 付き）
  const fetchState = useCallback(async () => {
    if (!roomId) return;

    const qs = playerId ? `?playerId=${playerId}` : "";
    const res = await fetch(`/api/rooms/${roomId}/state${qs}`);
    if (!res.ok) {
      setRoom(null);
      setLoading(false);
      return;
    }
    const data: Room = await res.json();
    setRoom((prev) => {
      if (prev?.round?.result !== data.round?.result && data.round?.result) {
        if (data.round.result === "success") soundSuccess?.play?.();
        if (data.round.result === "fail") soundFail?.play?.();
      }
      return data;
    });
    setLoading(false);
  }, [roomId, playerId, soundSuccess, soundFail]);

  // ポーリング
  useEffect(() => {
    if (!roomId) return;
    fetchState();
    const t = setInterval(fetchState, 1000);
    return () => clearInterval(t);
  }, [roomId, fetchState]);

  const onJoin = async () => {
    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, passcode, isLeader: true }),
    });
    if (!res.ok) {
      alert("参加に失敗しました");
      return;
    }
    const data = await res.json();
    setPlayerId(data.playerId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`eg_player_${roomId}`, data.playerId);
      window.localStorage.setItem("eg_name", name);
    }
    fetchState();
  };

  const onStartNext = async () => {
    if (!room || !playerId) return;
    const me = room.players.find((p) => p.id === playerId);
    if (!me?.isLeader) {
      alert("次の問題を開始できるのはリーダーだけです");
      return;
    }

    const res = await fetch(`/api/rooms/${roomId}/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customQuestion: customQuestion || undefined,
      }),
    });

    if (!res.ok) {
      if (res.status === 409) {
        alert("このルームの問題はすべて出題し終えました。");
        return;
      }
      alert("次の問題の開始に失敗しました");
      return;
    }

    setCustomQuestion("");
    clearCanvas();
    fetchState();
  };

  const onSubmit = async () => {
    if (!playerId) {
      alert("プレイヤー情報がありません");
      return;
    }
    if (!room?.round || room.round.status !== "answering") {
      alert("回答受付中ではありません");
      return;
    }

    const me = room.players.find((p) => p.id === playerId);
    if (!me) return;
    const canAnswerThisRound = me.joinFromRound <= room.round.index;
    if (!canAnswerThisRound || me.submitted) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      alert("キャンバスが初期化されていません");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");

    const res = await fetch(`/api/rooms/${roomId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, answer: dataUrl }),
    });
    if (!res.ok) {
      alert("提出に失敗しました");
      return;
    }
    fetchState();
  };

  const onJudge = async (result: "success" | "fail") => {
    if (!room || !playerId) return;
    const me = room.players.find((p) => p.id === playerId);
    if (!me?.isLeader) {
      alert("判定できるのはリーダーだけです");
      return;
    }

    const res = await fetch(`/api/rooms/${roomId}/judge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    });
    if (!res.ok) {
      alert("判定に失敗しました");
      return;
    }
    fetchState();
  };

  // ローディング中
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div>読み込み中...</div>
      </main>
    );
  }

  // ルームが存在しない
  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="p-4 rounded bg-slate-800">
          <p className="text-sm mb-2">
            このルームは存在しないか、終了しました。
          </p>
          <button
            className="mt-2 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
            onClick={() => router.push("/")}
          >
            トップに戻る
          </button>
        </div>
      </main>
    );
  }

  const round = room.round;
  const me = playerId ? room.players.find((p) => p.id === playerId) : undefined;

  // 参加前 or まだ players に反映されていない
  if (!playerId || !me) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="p-6 rounded-xl bg-slate-800 w-full max-w-md space-y-4">
          <h1 className="text-xl font-bold mb-2">ルームに参加</h1>
          <p className="text-sm text-slate-300 break-all">
            ルームID: {roomId}
          </p>

          <div className="space-y-2">
            <label className="block text-sm">名前</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-700"
              placeholder="ななし"
            />
          </div>

          {room.passcode && (
            <div className="space-y-2">
              <label className="block text-sm">パスコード</label>
              <input
                value={passcode}
                type="password"
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-700"
                placeholder="配信者から聞いたコード"
              />
            </div>
          )}

          <button
            onClick={onJoin}
            className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-semibold"
          >
            参加する
          </button>
        </div>
      </main>
    );
  }

  const isLeader = !!me.isLeader;
  const isSubmitted = !!me.submitted;
  const canAnswerThisRound =
    !!round && me.joinFromRound <= round.index; // ★ ここで参加可否を判定

  // 残り時間
  let remainSec = 0;
  if (round && round.status === "answering") {
    const elapsed = (Date.now() - round.startedAt) / 1000;
    remainSec = Math.max(0, Math.ceil(room.answerSeconds - elapsed));
  }

  const bgColor =
    round?.result === "success"
      ? "bg-emerald-900/70"
      : round?.result === "fail"
      ? "bg-rose-900/70"
      : "bg-slate-900";

  const brushColors = ["#000000", "#e11d48", "#22c55e", "#3b82f6", "#f97316"];
  const brushWidths = [2, 4, 8];

  return (
    <main className={`min-h-screen text-white ${bgColor}`}>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* ヘッダ */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">絵心伝心</h1>
            <p className="text-xs text-slate-300 break-all">
              ルームID: <span className="font-mono">非表示</span>
            </p>
            <p className="text-xs text-slate-300">
              あなた: {me.name}
              {isLeader && (
                <span className="ml-1 text-amber-400">(リーダー)</span>
              )}
            </p>
          </div>
          <div className="text-right text-xs">
            <div>成功: {room.successCount}</div>
            <div>失敗: {room.failCount}</div>
          </div>
        </header>

        {/* 問題／状態 */}
        <section className="p-3 rounded-lg bg-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">第 {round?.index ?? 0} 問</span>
            {round?.status === "answering" && (
              <span className="text-lg font-mono">
                残り <span className="font-bold">{remainSec}</span> 秒
              </span>
            )}
            {round?.status === "revealed" && (
              <span className="text-sm">回答開示中</span>
            )}
            {!round && (
              <span className="text-sm">まだ問題が開始されていません</span>
            )}
          </div>
          <div className="mt-1 text-lg font-semibold">
            {round?.question ?? "リーダーが問題を開始すると表示されます"}
          </div>
        </section>

        {/* メイン */}
        <section className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3">
          {/* 左：自分のキャンバス or 観戦表示 */}
          <div className="p-3 rounded-lg bg-slate-800 flex flex-col gap-2">
            <h2 className="text-sm font-semibold mb-1">
              あなたの回答（お絵描き）
            </h2>

            {!round && (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-300 gap-2">
                {isLeader ? (
                  <div className="w-full max-w-md space-y-2">
                    <p>まだ問題が始まっていません。</p>
                    <label className="block text-xs text-slate-300">
                      最初のお題を手入力（空ならランダム）
                    </label>
                    <input
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-700 text-sm"
                      placeholder="例）日本を代表する曲といえば？"
                    />
                    <button
                      onClick={onStartNext}
                      className="w-full mt-2 px-3 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
                    >
                      第1問を開始する
                    </button>
                  </div>
                ) : (
                  <p>
                    リーダーが問題を開始すると表示されます。しばらくお待ちください。
                  </p>
                )}
              </div>
            )}

            {round && round.status === "answering" && (
              <>
                {!canAnswerThisRound ? (
                  // ★ 途中参加観戦モード
                  <div className="flex-1 flex items-center justify-center text-sm text-slate-300 text-center px-4">
                    <p>
                      この問題は途中から参加したため、次の問題から回答できます。
                      <br />
                      みんなの様子を見て待っていてください。
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-full max-w-4xl mx-auto border border-slate-600 rounded bg-slate-900">
                      <div className="relative w-full pt-[66.6667%] rounded overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full touch-none bg-white"
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={stopDrawing}
                          onPointerLeave={stopDrawing}
                          onPointerCancel={stopDrawing}
                        />
                      </div>
                    </div>

                    {/* ツールバー */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-300">色</span>
                        <div className="flex gap-1">
                          {brushColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => setBrushColor(color)}
                              className={`w-6 h-6 rounded-full border border-slate-600 ${
                                brushColor === color ? "ring-2 ring-white" : ""
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-300">太さ</span>
                        <div className="flex gap-1">
                          {brushWidths.map((w) => (
                            <button
                              key={w}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => setBrushWidth(w)}
                              className={`px-2 py-1 rounded border border-slate-600 ${
                                brushWidth === w
                                  ? "bg-slate-700"
                                  : "bg-slate-900"
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={undoLast}
                          disabled={
                            isSubmitted || strokesRef.current.length === 0
                          }
                          className={`px-3 py-1 rounded text-[11px] font-semibold ${
                            isSubmitted || strokesRef.current.length === 0
                              ? "bg-slate-600 cursor-not-allowed"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          一つ戻す
                        </button>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          disabled={isSubmitted}
                          className={`px-3 py-1 rounded text-[11px] font-semibold ${
                            isSubmitted
                              ? "bg-slate-600 cursor-not-allowed"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          全消し
                        </button>
                        <button
                          onClick={onSubmit}
                          disabled={isSubmitted}
                          className={`px-4 py-1.5 rounded text-[11px] font-semibold ${
                            isSubmitted
                              ? "bg-slate-600 cursor-not-allowed"
                              : "bg-emerald-500 hover:bg-emerald-600"
                          }`}
                        >
                          {isSubmitted ? "提出済み" : "提出する"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {round && round.status === "revealed" && (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-200 gap-2">
                <p>回答が開示されています。結果を待ちましょう。</p>
                {round.result && (
                  <p className="text-lg font-bold">
                    {round.result === "success"
                      ? "✨ 成功！！ ✨"
                      : "❌ 失敗… ❌"}
                  </p>
                )}
              </div>
            )}

            {/* リーダー用判定/次の問題 */}
            {isLeader && (
              <div className="mt-3 border-t border-slate-700 pt-2 space-y-2">
                {round && round.status === "answering" && (
                  <p className="text-xs text-slate-300">
                    全員が提出するか、制限時間になると自動で開示されます。
                  </p>
                )}

                {round && round.status === "revealed" && !round.result && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onJudge("success")}
                      className="flex-1 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold"
                    >
                      全員一致！成功にする
                    </button>
                    <button
                      onClick={() => onJudge("fail")}
                      className="flex-1 py-2 rounded bg-rose-500 hover:bg-rose-600 text-xs font-semibold"
                    >
                      残念…失敗にする
                    </button>
                  </div>
                )}

                {round && round.status === "revealed" && round.result && (
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-300">
                      次のお題を手入力（空ならランダム）
                    </label>
                    <input
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-600 text-xs"
                      placeholder="例）みんなで行きたい国は？"
                    />
                    <button
                      onClick={onStartNext}
                      className="w-full py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-sm font-semibold"
                    >
                      次の問題へ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右：プレイヤー一覧＋みんなのボード */}
          <div className="p-3 rounded-lg bg-slate-800 flex flex-col gap-2">
            <h2 className="text-sm font-semibold mb-1">プレイヤー</h2>
            <ul className="space-y-1 text-sm">
              {room.players.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>
                    {p.name}
                    {p.isLeader && (
                      <span className="ml-1 text-amber-400 text-xs">(L)</span>
                    )}
                  </span>
                  <span
                    className={`text-xs ${
                      p.submitted ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {p.submitted ? "提出済み" : "未提出"}
                  </span>
                </li>
              ))}
            </ul>

            {round && round.status === "revealed" && (
              <div className="mt-3 border-t border-slate-700 pt-2">
                <h3 className="text-xs font-semibold mb-1">みんなのボード</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[80vh] pr-1">
                  {room.players.map((p) => {
                    const ans = round.answers[p.id] ?? "";
                    const isImage = ans.startsWith("data:image");
                    return (
                      <div
                        key={p.id}
                        className="border border-slate-700 rounded bg-slate-900/70 overflow-hidden flex flex-col hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => isImage && setPreviewSrc(ans)}
                      >
                        <div className="px-2 py-1 text-xs font-semibold flex items-center justify-between">
                          <span className="truncate">{p.name}</span>
                          {p.isLeader && (
                            <span className="ml-1 text-amber-400 text-[10px]">
                              (L)
                            </span>
                          )}
                        </div>
                        <div className="relative w-full pt-[66.6667%] bg-slate-950">
                          {ans ? (
                            isImage ? (
                              <img
                                src={ans}
                                alt={`${p.name} の回答`}
                                className="absolute inset-0 w-full h-full object-contain"
                              />
                            ) : (
                              <p className="absolute inset-0 p-2 text-[11px] whitespace-pre-wrap break-words text-slate-200 overflow-auto">
                                {ans}
                              </p>
                            )
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center p-2 text-[11px] text-slate-500">
                              （回答なし）
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="text-xs text-slate-400 text-center mt-4">
          URLを共有して友達を招待しよう！
        </footer>
      </div>

      {/* 拡大プレビュー */}
      {previewSrc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setPreviewSrc(null)}
        >
          <img
            src={previewSrc}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-lg"
            alt="プレビュー"
          />
        </div>
      )}
    </main>
  );
}
