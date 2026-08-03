const { prisma } = require("../lib/prisma");
const { evaluateStudent, getCourseMeta, loadExamGrades } = require("../lib/summer-evaluation");

async function checkMusa() {
  console.log("--- Checking Musa Roustom ---");
  const grades = loadExamGrades();
  const musaGrade = grades.students.find(s => s.studentName.includes("موسى"));
  console.log("Exam Grade Record for Musa:", musaGrade);

  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { studentCode: "7508" },
        { fullName: { contains: "موسى" } },
      ],
      studyMode: "ONSITE_SUMMER",
    },
    select: {
      id: true, studentCode: true, fullName: true, isActive: true,
      summerGroup: true, teacher: { select: { fullName: true } }, circle: { select: { name: true } },
      summerReports: { select: { dateKey: true, status: true, behaviorGrade: true } },
    },
  });

  console.log("DB Record for Musa:", student);
}

checkMusa();
