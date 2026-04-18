import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const existingCodes = await prisma.student.findMany({
    where: { studentCode: { not: null } },
    select: { studentCode: true },
  });

  let maxNumber = 1000;
  for (const row of existingCodes) {
    const code = row.studentCode;
    if (!code) continue;
    const m = /^ST-(\d+)$/.exec(code);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > maxNumber) maxNumber = n;
  }

  const students = await prisma.student.findMany({
    where: { studentCode: null },
    select: { id: true, fullName: true, studyMode: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Students missing code: ${students.length}`);
  console.log(`Starting from ST-${maxNumber + 1}`);

  let updated = 0;
  for (const s of students) {
    maxNumber += 1;
    const code = `ST-${maxNumber}`;

    await prisma.student.update({
      where: { id: s.id },
      data: { studentCode: code },
      select: { id: true },
    });
    updated += 1;
    if (updated % 25 === 0) {
      console.log(`Updated ${updated}/${students.length}`);
    }
  }

  console.log(`Done. Updated ${updated} students.`);
}

main()
  .catch((error) => {
    console.error("BACKFILL STUDENT CODES ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

