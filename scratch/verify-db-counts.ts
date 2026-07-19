import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const total = await prisma.annualReport.count({
    where: { academicYear: '2025-2026' }
  });
  const review = await prisma.annualReport.count({
    where: { academicYear: '2025-2026', reviewStatus: 'REVIEW' }
  });
  const approved = await prisma.annualReport.count({
    where: { academicYear: '2025-2026', reviewStatus: 'APPROVED' }
  });
  const sent = await prisma.annualReport.count({
    where: { academicYear: '2025-2026', reviewStatus: 'SENT' }
  });

  console.log(`Annual Reports verification for 2025-2026:`);
  console.log(`- Total reports in database: ${total}`);
  console.log(`- Status REVIEW (needs review): ${review}`);
  console.log(`- Status APPROVED (approved): ${approved}`);
  console.log(`- Status SENT (sent to parents): ${sent}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
