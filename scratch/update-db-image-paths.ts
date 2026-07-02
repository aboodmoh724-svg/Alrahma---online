import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";

async function main() {
  console.log('Updating database reportImagePaths for reports with missing images...');

  const reports = await prisma.annualReport.findMany({
    where: {
      reportImagePath: null
    },
    select: {
      id: true,
      studentName: true,
      reportImageFilename: true,
    }
  });

  console.log(`Found ${reports.length} reports to update.`);

  let updatedCount = 0;

  for (const r of reports) {
    const filename = r.reportImageFilename || `${r.id}.png`;
    const imagePath = `annual-reports/2025-2026/${filename}`;

    await prisma.annualReport.update({
      where: { id: r.id },
      data: {
        reportImagePath: imagePath
      }
    });

    console.log(`- Updated ${r.studentName} => ${imagePath}`);
    updatedCount++;
  }

  console.log(`\nSuccessfully updated database paths for ${updatedCount} reports.`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
