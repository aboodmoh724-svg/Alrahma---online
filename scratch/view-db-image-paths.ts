import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";

async function main() {
  const reports = await prisma.annualReport.findMany({
    take: 10,
    select: {
      studentName: true,
      reportImagePath: true,
      reportImageFilename: true,
      reviewStatus: true,
      reviewNotes: true
    }
  });

  console.log('Sample reports:');
  reports.forEach(r => {
    console.log(`- ${r.studentName} | Status: ${r.reviewStatus} | ImagePath: ${r.reportImagePath} | Filename: ${r.reportImageFilename} | Notes: ${r.reviewNotes}`);
  });
}

main().then(() => prisma.$disconnect()).catch(console.error);
