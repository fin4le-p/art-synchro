import { NextRequest, NextResponse } from "next/server";
import { leaveRoom } from "@/app/lib/gameState";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { roomId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const playerId = String(body.playerId || "");

  if (!playerId) {
    return new NextResponse("no playerId", { status: 400 });
  }

  leaveRoom(roomId, playerId);
  return new NextResponse(null, { status: 204 });
}
