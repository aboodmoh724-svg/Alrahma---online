import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";

const BLANK_STUDENTS = [
  "أحمد الحاج حسين",
  "عمر مصطفى الحاج حسين",
  "كرم محمد ابوندى",
  "كريم محمد ابوندى",
  "محمد أمين الأحمد",
  "محمد مصطفى الحاج حسين"
];

async function main() {
  console.log(`Starting cleanup of blank annual reports for:`, BLANK_STUDENTS);

  const deleteResult = await prisma.annualReport.deleteMany({
    where: {
      studentName: {
        in: BLANK_STUDENTS
      }
    }
  });

  console.log(`Successfully deleted ${deleteResult.count} blank annual reports from the database.`);
}

main().then(() => prisma.$disconnect()).catch(console.error);
