import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const teacher = await prisma.user.findFirst({
    where: {
      fullName: { contains: 'أنس محمود' },
      role: 'TEACHER',
      studyMode: 'ONSITE'
    }
  });

  if (!teacher) {
    console.log('Teacher أنس محمود not found');
    return;
  }

  const students = await prisma.student.findMany({
    where: {
      teacherId: teacher.id,
      studyMode: 'ONSITE',
      isActive: true
    },
    select: {
      id: true,
      fullName: true,
      circle: { select: { name: true } }
    }
  });

  console.log(`Students taught by أنس محمود:`);
  students.forEach(s => console.log(`- ID: ${s.id} | Name: "${s.fullName}" | Circle: "${s.circle?.name}"`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
