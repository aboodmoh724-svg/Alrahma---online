import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const reports = await prisma.annualReport.findMany({
    where: {
      studentKey: { in: ['annual-2025-2026-0039', 'annual-2025-2026-0040'] }
    },
    select: {
      id: true,
      studentName: true,
      studentKey: true,
    }
  });

  reports.forEach(r => {
    console.log(`Student: "${r.studentName}" | Key: ${r.studentKey} | Link: https://alrahmakuran.site/onsite/admin/annual-reports/${r.id}/card`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
