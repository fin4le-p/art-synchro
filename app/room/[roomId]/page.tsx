// app/room/[roomId]/page.tsx
import type { Metadata } from "next";
import RoomClient from "./RoomClient";

type PageProps = {
  params: Promise<{ roomId: string }>;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RoomPage({ params }: PageProps) {
  const { roomId } = await params; 
  return <RoomClient roomId={roomId} />;
}
