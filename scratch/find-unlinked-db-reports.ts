import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const dbReports = await prisma.annualReport.findMany({
    where: { academicYear: '2025-2026' },
    include: {
      student: {
        select: {
          fullName: true,
          isActive: true,
          studyMode: true,
        }
      }
    }
  });

  console.log(`Total DB reports: ${dbReports.length}`);
  dbReports.forEach((r, idx) => {
    console.log(`[${idx + 1}] Report Name: "${r.studentName}" | Student DB Match: ${r.student ? `"${r.student.fullName}" (Active: ${r.student.isActive}, Mode: ${r.student.studyMode})` : 'NULL'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
