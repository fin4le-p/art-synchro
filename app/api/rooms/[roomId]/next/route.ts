import { NextRequest, NextResponse } from "next/server";
import { startNextRound } from "@/app/lib/gameState";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { roomId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const customQuestion: string | undefined = body.customQuestion || undefined;

  try {
    const updated = await startNextRound(roomId, customQuestion);
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e?.message ?? "error";
    if (msg === "room_not_found") {
      return new NextResponse("not found", { status: 404 });
    }
    if (msg === "no_more_questions") {
      return new NextResponse("no_more_questions", { status: 409 });
    }
    console.error("next error:", e);
    return new NextResponse("error", { status: 400 });
  }
}
