const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const XLSX = require("xlsx");
const path = require("path");
require("dotenv").config();

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Read Excel to get full list of students
    const filePath = path.join(__dirname, "../docs/بيانات الطلاب والدرجات.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // 2. Get all active summer students from DB
    const dbStudents = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
      select: { id: true, fullName: true, studentCode: true, parentWhatsapp: true },
    });

    // 3. Match Excel names to DB students
    const allStudents = [];
    for (const row of excelRows) {
      const nameInExcel = String(row["اسم الطالب"] || "").trim();
      if (!nameInExcel) continue;

      let matched = dbStudents.find(
        (s) => s.fullName.trim() === nameInExcel || s.fullName.includes(nameInExcel) || nameInExcel.includes(s.fullName)
      );
      if (!matched) {
        const parts = nameInExcel.split(" ");
        if (parts.length >= 2) {
          matched = dbStudents.find(
            (s) => s.fullName.includes(parts[0]) && s.fullName.includes(parts[parts.length - 1])
          );
        }
      }
      if (matched) {
        allStudents.push(matched);
      }
    }

    console.log(`Total students from Excel matched in DB: ${allStudents.length}`);

    // 4. Check which students already got messages (yesterday Aug 3 and today Aug 4)
    const alreadySent = await prisma.whatsAppOutgoingMessage.findMany({
      where: {
        source: "SUMMER_PROGRESS_REPORT",
        createdAt: { gte: new Date("2026-08-03T00:00:00Z") },
      },
      select: { studentId: true, toNumber: true, createdAt: true },
    });

    const sentStudentIds = new Set(alreadySent.map((m) => m.studentId).filter(Boolean));

    console.log(`Already sent to ${sentStudentIds.size} students`);
    console.log("Sent student IDs:", [...sentStudentIds]);

    // 5. Find remaining students
    const remaining = allStudents.filter((s) => !sentStudentIds.has(s.id));

    console.log(`\nRemaining students to send: ${remaining.length}`);
    console.log("---");
    remaining.forEach((s, i) => {
      console.log(`${i + 1}. ${s.fullName} (code: ${s.studentCode}, phone: ${s.parentWhatsapp})`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
