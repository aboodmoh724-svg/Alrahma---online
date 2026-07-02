import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const reports = await prisma.annualReport.findMany({
    where: {
      reviewNotes: 'AI_GENERATED'
    },
    select: {
      studentName: true,
      reportImagePath: true,
      reportImageFilename: true,
    }
  });

  console.log(`Checking physical image files for ${reports.length} AI generated reports...`);

  let missingCount = 0;

  for (const r of reports) {
    if (!r.reportImagePath) {
      console.log(`- ❌ ${r.studentName}: No reportImagePath in DB`);
      missingCount++;
      continue;
    }

    // On VPS, the path resolves to root/alrahma-reports-app/uploads/annual-reports/2025-2026/annual-2025-2026-xxxx.png
    // The relative storage path is e.g. "annual-reports/2025-2026/annual-2025-2026-0001.png"
    // Let's resolve it relative to the uploads folder
    const uploadsDir = path.join(__dirname, '../uploads');
    const fullPath = path.join(uploadsDir, r.reportImagePath);

    const exists = fs.existsSync(fullPath);
    if (!exists) {
      console.log(`- ❌ ${r.studentName}: Image file NOT found at: ${r.reportImagePath}`);
      missingCount++;
    } else {
      console.log(`-  ${r.studentName}: Image file exists (${fs.statSync(fullPath).size} bytes)`);
    }
  }

  console.log(`\nVerification complete. Missing images: ${missingCount} / ${reports.length}`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
