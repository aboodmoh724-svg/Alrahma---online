import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const students = await prisma.student.findMany({
    where: {
      studyMode: 'ONSITE',
      isActive: true,
      fullName: {
        contains: 'عبيد'
      }
    },
    select: {
      id: true,
      fullName: true,
      circle: { select: { name: true } }
    }
  });

  console.log('Students containing عبيد:');
  students.forEach(s => console.log(`- ID: ${s.id} | Name: "${s.fullName}" | Circle: "${s.circle?.name}"`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
