import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      circles: {
        include: {
          students: true
        }
      }
    }
  });

  console.log("=== ALL TEACHERS ===");
  teachers.forEach(t => {
    console.log(`Teacher ID: ${t.id}`);
    console.log(`Name: ${t.fullName}`);
    console.log(`Email: ${t.email}`);
    console.log(`StudyMode: ${t.studyMode}`);
    console.log(`IsActive: ${t.isActive}`);
    console.log(`Circles Count: ${t.circles.length}`);
    t.circles.forEach(c => {
      console.log(`  - Circle Name: ${c.name} (ID: ${c.id})`);
      console.log(`    Students Count: ${c.students.length}`);
      c.students.forEach(s => {
        console.log(`      * Student: ${s.fullName} (ID: ${s.id})`);
      });
    });
    console.log("------------------------");
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
