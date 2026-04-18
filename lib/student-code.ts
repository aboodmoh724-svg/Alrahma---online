import { prisma } from "@/lib/prisma";

export async function generateStudentCode() {
  const studentsCount = await prisma.student.count();

  for (let offset = 1; offset < 2000; offset += 1) {
    const code = `ST-${1000 + studentsCount + offset}`;
    const existingStudent = await prisma.student.findUnique({
      where: { studentCode: code },
      select: { id: true },
    });

    if (!existingStudent) {
      return code;
    }
  }

  return `ST-${Date.now()}`;
}

export async function ensureStudentCode(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, studentCode: true },
  });

  if (!student) return null;
  if (student.studentCode) return student.studentCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await generateStudentCode();
    try {
      const updated = await prisma.student.update({
        where: { id: student.id },
        data: { studentCode: code },
        select: { studentCode: true },
      });
      return updated.studentCode;
    } catch {
      // rare unique collision; retry
    }
  }

  return null;
}

