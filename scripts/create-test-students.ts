import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const teacher = await prisma.user.findUnique({
    where: { email: "teacher@test.com" },
  });

  if (!teacher) {
    console.log("Teacher not found");
    return;
  }

  const students = [
    { fullName: "أحمد محمد" },
    { fullName: "عبدالله خالد" },
    { fullName: "يوسف علي" },
  ];

  for (const s of students) {
    const existingStudent = await prisma.student.findFirst({
      where: {
        fullName: s.fullName,
        teacherId: teacher.id,
      },
    });

    if (existingStudent) {
      console.log(`Student already exists: ${s.fullName}`);
      continue;
    }

    await prisma.student.create({
      data: {
        fullName: s.fullName,
        teacherId: teacher.id,
        isActive: true,
        studyMode: "REMOTE",
      },
    });

    console.log(`Student created: ${s.fullName}`);
  }

  console.log("Students created successfully");
}

main()
  .catch((error) => {
    console.error("CREATE STUDENTS ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });