import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
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

  console.log(`Found ${reports.length} reports with missing images.`);
  
  const outPath = path.join(__dirname, 'pending-images.json');
  fs.writeFileSync(outPath, JSON.stringify(reports, null, 2));
  console.log(`Saved pending reports list to ${outPath}`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
