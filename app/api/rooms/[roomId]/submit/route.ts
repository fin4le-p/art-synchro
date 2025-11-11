import { NextRequest, NextResponse } from "next/server";
import { submitAnswer } from "@/app/lib/gameState";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { roomId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const playerId = String(body.playerId || "");
  const answer = String(body.answer ?? "");

  try {
    const updated = submitAnswer(roomId, playerId, answer);
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e?.message ?? "error";
    if (msg === "room_or_round_not_found") {
      return new NextResponse("room/round not found", { status: 404 });
    }
    if (msg === "player_not_found") {
      return new NextResponse("player not found", { status: 404 });
    }
    console.error("submit error:", e);
    return new NextResponse("error", { status: 400 });
  }
}
