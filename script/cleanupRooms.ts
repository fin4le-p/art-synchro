// scripts/cleanupRooms.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24); // 24時間前

  const result = await prisma.room.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  console.log(`🧹 古いルームを ${result.count} 件削除しました`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => prisma.$disconnect());
