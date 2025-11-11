import { NextRequest, NextResponse } from "next/server";
import { getRoom, revealIfNeeded, touchPlayer } from "@/app/lib/gameState";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const { roomId } = await context.params;
  const playerId = req.nextUrl.searchParams.get("playerId") || undefined;

  if (playerId) {
    // ★ 生存報告
    touchPlayer(roomId, playerId);
  }

  const room = getRoom(roomId);
  if (!room) return new NextResponse("not found", { status: 404 });

  const updated = revealIfNeeded(room.id);
  return NextResponse.json(updated);
}
