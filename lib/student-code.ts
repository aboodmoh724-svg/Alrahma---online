import { prisma } from "@/lib/prisma";

const STUDENT_CODE_BASE_BY_MODE = {
  REMOTE: 1000,
  ONSITE: 5000,
} as const;

type StudyMode = keyof typeof STUDENT_CODE_BASE_BY_MODE;

async function getNextStudentCodeNumber(studyMode: StudyMode) {
  const [row] = await prisma.$queryRaw<Array<{ max_code: number | null }>>`
    SELECT MAX(CAST("studentCode" AS INTEGER)) AS max_code
    FROM "Student"
    WHERE "studyMode" = ${studyMode}
      AND "studentCode" ~ '^[0-9]+$'
  `;

  const base = STUDENT_CODE_BASE_BY_MODE[studyMode];
  return Math.max(row?.max_code ?? base, base) + 1;
}

export async function generateStudentCode(studyMode: StudyMode = "REMOTE") {
  const base = STUDENT_CODE_BASE_BY_MODE[studyMode];
  const nextNumber = await getNextStudentCodeNumber(studyMode);

  for (let offset = 0; offset < 2000; offset += 1) {
    const code = String(nextNumber + offset);
    const existingStudent = await prisma.student.findUnique({
      where: { studentCode: code },
      select: { id: true },
    });

    if (!existingStudent) {
      return code;
    }
  }

  return String(base + Date.now());
}

export async function ensureStudentCode(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, studentCode: true, studyMode: true },
  });

  if (!student) return null;
  if (student.studentCode) return student.studentCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await generateStudentCode(student.studyMode);
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

