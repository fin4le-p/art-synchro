// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/app/lib/gameState";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const answerSeconds = Number(body.answerSeconds ?? 60);
  const passcode = body.passcode ? String(body.passcode) : undefined;

  const room = createRoom(answerSeconds, passcode);
  return NextResponse.json({ id: room.id });
}
