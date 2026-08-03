const XLSX = require("xlsx");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
require("dotenv").config();

async function run() {
  const filePath = path.join(__dirname, "../docs/بيانات الطلاب والدرجات.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const dbStudents = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
      select: { id: true, fullName: true, studentCode: true, parentWhatsapp: true },
    });

    let updatedCount = 0;

    for (const row of excelRows) {
      const nameInExcel = String(row["اسم الطالب"] || "").trim();
      const phoneInExcel = String(row["رقم التواصل"] || "").trim();

      if (!nameInExcel || !phoneInExcel) continue;

      let cleanPhone = phoneInExcel.replace(/\D/g, "");
      if (cleanPhone.startsWith("0")) cleanPhone = "90" + cleanPhone.slice(1);
      else if (cleanPhone.length === 10 && cleanPhone.startsWith("5")) cleanPhone = "90" + cleanPhone;

      let matchedDbStudent = dbStudents.find(
        (s) => s.fullName.trim() === nameInExcel || s.fullName.includes(nameInExcel) || nameInExcel.includes(s.fullName)
      );

      if (!matchedDbStudent) {
        const parts = nameInExcel.split(" ");
        if (parts.length >= 2) {
          const first = parts[0];
          const last = parts[parts.length - 1];
          matchedDbStudent = dbStudents.find(
            (s) => s.fullName.includes(first) && s.fullName.includes(last)
          );
        }
      }

      if (matchedDbStudent) {
        await prisma.student.update({
          where: { id: matchedDbStudent.id },
          data: { parentWhatsapp: cleanPhone },
        });
        updatedCount++;
        console.log(`Synced ${matchedDbStudent.fullName} (${matchedDbStudent.studentCode}) => Phone: ${cleanPhone}`);
      }
    }

    console.log(`\nSuccessfully updated parentWhatsapp for ${updatedCount} students in database.`);
  } catch (err) {
    console.error("Error syncing phones:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
