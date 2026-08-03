const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function checkMusa() {
  console.log("--- Checking Musa Roustom ---");
  const gradesFile = path.join(__dirname, "../data/summer-exam-grades.json");
  const gradesData = JSON.parse(fs.readFileSync(gradesFile, "utf8"));
  const musaGrade = gradesData.students.find((s) => s.studentName.includes("موسى"));
  console.log("Exam Grade Record for Musa:", musaGrade);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { studentCode: "7508" },
          { fullName: { contains: "موسى" } },
        ],
        studyMode: "ONSITE_SUMMER",
      },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        isActive: true,
        studyMode: true,
        summerGroup: true,
        parentWhatsapp: true,
        teacher: { select: { fullName: true } },
        circle: { select: { name: true } },
      },
    });

    console.log("DB Record for Musa:", student);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkMusa();
