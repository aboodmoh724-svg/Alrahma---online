import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const reportsWithImages = await prisma.annualReport.findMany({
    where: {
      academicYear: '2025-2026',
      reportImagePath: { not: null }
    },
    select: {
      studentName: true,
      reportImagePath: true
    },
    take: 5
  });

  console.log('Sample of existing report image paths:');
  reportsWithImages.forEach(r => {
    console.log(`- Student: "${r.studentName}" | Path: "${r.reportImagePath}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
