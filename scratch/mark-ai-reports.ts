import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const updated = await prisma.annualReport.updateMany({
    where: {
      studentKey: {
        gte: 'annual-2025-2026-0039',
        lte: 'annual-2025-2026-0101'
      },
      academicYear: '2025-2026'
    },
    data: {
      reviewNotes: 'AI_GENERATED'
    }
  });

  console.log(`Successfully marked ${updated.count} reports with 'AI_GENERATED' in reviewNotes!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
