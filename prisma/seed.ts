// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const questions = [
    "日本を代表する曲といえば？",
    "みんなが思う『最強の武器』は？",
    "理想の休日の過ごし方といえば？",
    "コンビニでつい買っちゃうものは？",
    "青春を感じる瞬間といえば？",
    "これが世界一美味しい食べ物！と思うものは？",
    "人生で一度は行ってみたい場所は？",
    "朝起きて最初にすることは？",
    "無人島に1つだけ持っていくなら？",
    "あなたが最強だと思うキャラは？",
  ];

  for (const text of questions) {
    await prisma.question.upsert({
      where: { text },
      update: {},
      create: { text },
    });
  }

  console.log(`✅ ${questions.length} 件の問題を登録しました`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
