import { NextRequest, NextResponse } from "next/server";
import { judgeRound } from "@/app/lib/gameState";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { roomId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const raw = body.result;
  const result =
    raw === "success" ? "success" : raw === "fail" ? "fail" : null;

  if (!result) {
    return new NextResponse("invalid result", { status: 400 });
  }

  try {
    const updated = judgeRound(roomId, result);
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e?.message ?? "error";
    if (msg === "room_or_round_not_found") {
      return new NextResponse("room/round not found", { status: 404 });
    }
    console.error("judge error:", e);
    return new NextResponse("error", { status: 400 });
  }
}
