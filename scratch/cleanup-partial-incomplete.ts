import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";

const PARTIAL_STUDENTS = [
  "سيف حمادي",
  "عبدالكريم حاج علي",
  "عمر محمود الحميدي"
];

async function main() {
  console.log(`Starting cleanup of partial incomplete annual reports for:`, PARTIAL_STUDENTS);

  const deleteResult = await prisma.annualReport.deleteMany({
    where: {
      studentName: {
        in: PARTIAL_STUDENTS
      }
    }
  });

  console.log(`Successfully deleted ${deleteResult.count} partial incomplete annual reports from the database.`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
