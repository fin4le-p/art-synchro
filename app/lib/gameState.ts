// app/lib/gameState.ts
import { prisma } from "@/app/lib/prisma";

export type Player = {
  id: string;
  name: string;
  isLeader: boolean;
  submitted: boolean;
  lastSeenAt: number;
  // ★ 何問目から参加対象になるか
  joinFromRound: number;
};

export type RoundStatus = "waiting" | "answering" | "revealed";

export type Round = {
  index: number;
  question: string;
  status: RoundStatus;
  startedAt: number; // unix ms
  result?: "success" | "fail";
  answers: Record<string, string>; // playerId -> dataURL
};

export type Room = {
  id: string;
  passcode?: string;
  answerSeconds: number;
  players: Player[];
  round: Round | null;
  successCount: number;
  failCount: number;
  usedQuestions: string[]; // このルームで既に出題した問題
};

const rooms = new Map<string, Room>();

// ★ 一定時間 heartbeat が来なかったら離脱扱い
const PLAYER_TIMEOUT_MS = 15_000; // 15 秒（必要なら調整）

function randomId(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

// このルームでまだ出していない問題を DB から1件取得
async function getRandomQuestionForRoom(room: Room): Promise<string> {
  const used = room.usedQuestions;

  const availableCount = await prisma.question.count({
    where: used.length ? { text: { notIn: used } } : {},
  });
  if (availableCount === 0) throw new Error("no_more_questions");

  const skip = Math.floor(Math.random() * availableCount);
  const q = await prisma.question.findFirst({
    where: used.length ? { text: { notIn: used } } : {},
    skip,
  });

  if (!q) throw new Error("question_not_found");
  return q.text;
}

// ルーム作成
export function createRoom(answerSeconds: number, passcode?: string): Room {
  const id = randomId(8);
  const room: Room = {
    id,
    passcode: passcode || undefined,
    answerSeconds,
    players: [],
    round: null,
    successCount: 0,
    failCount: 0,
    usedQuestions: [],
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

// ★ 古いプレイヤー掃除
function cleanupRoom(room: Room) {
  const now = Date.now();
  room.players = room.players.filter(
    (p) => now - p.lastSeenAt < PLAYER_TIMEOUT_MS
  );
}

// heartbeat
export function touchPlayer(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const p = room.players.find((x) => x.id === playerId);
  if (!p) return;
  p.lastSeenAt = Date.now();
}

// 明示的退出
export function leaveRoom(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.players = room.players.filter((p) => p.id !== playerId);

  // 誰もいない＋ラウンドなしならルームごと消してもよい
  if (room.players.length === 0 && !room.round) {
    rooms.delete(roomId);
  }
}

// 参加（途中参加は「次の問題から」）
export function joinRoom(
  roomId: string,
  options: { name: string; passcode?: string; wantLeader: boolean }
): { room: Room; player: Player } {
  const room = rooms.get(roomId);
  if (!room) throw new Error("room_not_found");

  if (room.passcode && room.passcode !== options.passcode) {
    throw new Error("invalid_passcode");
  }

  const currentIndex = room.round?.index ?? 0;
  // 第1問がまだ始まってない → 1問目から参加
  // それ以外 → 次のラウンドから参加
  const joinFromRound = currentIndex === 0 ? 1 : currentIndex + 1;

  const isLeader = room.players.length === 0 && options.wantLeader;

  const player: Player = {
    id: randomId(12),
    name: options.name || "ななし",
    isLeader,
    submitted: false,
    lastSeenAt: Date.now(),
    joinFromRound,
  };

  room.players.push(player);
  return { room, player };
}

// ラウンド開始
export async function startNextRound(
  roomId: string,
  customQuestion?: string
): Promise<Room> {
  const room = rooms.get(roomId);
  if (!room) throw new Error("room_not_found");

  const nextIndex = (room.round?.index ?? 0) + 1;

  let question: string;
  if (customQuestion && customQuestion.trim() !== "") {
    question = customQuestion.trim();
  } else {
    question = await getRandomQuestionForRoom(room);
  }

  const round: Round = {
    index: nextIndex,
    question,
    status: "answering",
    startedAt: Date.now(),
    answers: {},
  };
  room.round = round;

  // ★ 今のラウンドに参加する人だけ submitted=false
  room.players = room.players.map((p) => {
    const canAnswer = p.joinFromRound <= nextIndex;
    return {
      ...p,
      submitted: canAnswer ? false : true,
    };
  });

  room.usedQuestions.push(question);
  return room;
}

// 回答登録
export function submitAnswer(
  roomId: string,
  playerId: string,
  answer: string
): Room {
  const room = rooms.get(roomId);
  if (!room || !room.round) throw new Error("room_or_round_not_found");

  const player = room.players.find((p) => p.id === playerId);
  if (!player) throw new Error("player_not_found");

  // まだ参加資格がないラウンドだったら無視
  if (player.joinFromRound > room.round.index) {
    return room;
  }

  player.submitted = true;
  room.round.answers[playerId] = answer ?? "";
  return room;
}

// 自動開示
export function revealIfNeeded(roomId: string): Room {
  const room = rooms.get(roomId);
  if (!room) throw new Error("room_not_found");

  // ★ ポーリングのたびに古いプレイヤーを掃除
  cleanupRoom(room);

  if (!room.round) return room;

  const round = room.round;
  if (round.status === "revealed") return room;

  const now = Date.now();

  // ★ 今のラウンドに参加するプレイヤーのみ対象
  const eligible = room.players.filter((p) => p.joinFromRound <= round.index);

  const allSubmitted =
    eligible.length > 0 && eligible.every((p) => p.submitted);

  const timeout = now - round.startedAt >= room.answerSeconds * 1000;

  if (allSubmitted || timeout) {
    round.status = "revealed";
  }

  return room;
}

// 成功 / 失敗判定
export function judgeRound(roomId: string, result: "success" | "fail"): Room {
  const room = rooms.get(roomId);
  if (!room || !room.round) throw new Error("room_or_round_not_found");

  room.round.result = result;
  if (result === "success") room.successCount++;
  else room.failCount++;

  return room;
}
