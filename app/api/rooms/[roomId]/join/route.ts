import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/app/lib/gameState";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { roomId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const name = String(body.name || "ななし");
  const passcode = body.passcode ? String(body.passcode) : undefined;
  const wantLeader = !!body.isLeader;

  try {
    const { player } = joinRoom(roomId, { name, passcode, wantLeader });
    return NextResponse.json({
      playerId: player.id,
      isLeader: player.isLeader,
    });
  } catch (e: any) {
    const msg = e?.message ?? "error";

    if (msg === "room_not_found") {
      return new NextResponse("not found", { status: 404 });
    }
    if (msg === "invalid_passcode") {
      return new NextResponse("invalid passcode", { status: 403 });
    }

    console.error("join error:", e);
    return new NextResponse("error", { status: 400 });
  }
}
