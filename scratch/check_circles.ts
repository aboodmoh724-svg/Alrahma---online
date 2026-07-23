import "dotenv/config";
import { prisma } from "../lib/prisma";

async function run() {
  const circles = await prisma.circle.findMany({
    include: {
      teacher: true,
      _count: { select: { students: true } }
    }
  });
  console.log("=== ALL CIRCLES ===");
  circles.forEach(c => {
    console.log(`ID: ${c.id} | Name: ${c.name} | StudyMode: ${c.studyMode} | Teacher: ${c.teacher?.fullName || "None"} | Student Count: ${c._count.students}`);
  });

  const students = await prisma.student.findMany({
    where: { fullName: { contains: "أسامة" } },
    include: {
      circle: true
    }
  });
  console.log("=== STUDENTS WITH 'أسامة' IN NAME ===");
  students.forEach(s => {
    console.log(`Name: ${s.fullName} | StudyMode: ${s.studyMode} | Circle: ${s.circle?.name || "None"} (StudyMode: ${s.circle?.studyMode})`);
  });
}

run();
