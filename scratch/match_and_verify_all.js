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
      select: {
        id: true,
        fullName: true,
        studentCode: true,
        parentWhatsapp: true,
        teacher: { select: { fullName: true } },
        circle: { select: { name: true } },
      },
    });

    console.log(`Found ${excelRows.length} rows in Excel and ${dbStudents.length} active summer students in DB.\n`);

    const matchedList = [];
    const unmatchedExcelRows = [];

    for (const row of excelRows) {
      const nameInExcel = String(row["اسم الطالب"] || "").trim();
      const phoneInExcel = String(row["رقم التواصل"] || "").trim();
      const finalGrade = row["النتيجة النهائية "];

      if (!nameInExcel) continue;

      // Normalize phone number (Turkish numbers default)
      let cleanPhone = phoneInExcel.replace(/\D/g, "");
      if (cleanPhone.startsWith("0")) cleanPhone = "90" + cleanPhone.slice(1);
      else if (cleanPhone.length === 10 && cleanPhone.startsWith("5")) cleanPhone = "90" + cleanPhone;

      // Find in DB
      let matchedDbStudent = dbStudents.find(
        (s) => s.fullName.trim() === nameInExcel || s.fullName.includes(nameInExcel) || nameInExcel.includes(s.fullName)
      );

      // Special partial name matching if exact fails
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
        matchedList.push({
          excelName: nameInExcel,
          dbId: matchedDbStudent.id,
          studentCode: matchedDbStudent.studentCode,
          dbName: matchedDbStudent.fullName,
          excelPhone: phoneInExcel,
          cleanPhone,
          dbPhone: matchedDbStudent.parentWhatsapp,
          finalGrade,
          url: `https://alrahmakuran.site/onsite/summer/parent-report/${matchedDbStudent.studentCode || matchedDbStudent.id}`,
        });
      } else {
        unmatchedExcelRows.push({
          excelName: nameInExcel,
          phone: phoneInExcel,
          finalGrade,
        });
      }
    }

    console.log("=================== MATCHED STUDENTS (" + matchedList.length + ") ===================");
    console.table(
      matchedList.map((m, i) => ({
        "#": i + 1,
        "اسم الطالب (إكسل)": m.excelName,
        "الكود": m.studentCode,
        "الهاتف": m.cleanPhone,
        "الدرجة": m.finalGrade,
        "الرابط": m.url,
      }))
    );

    if (unmatchedExcelRows.length > 0) {
      console.log("\n=================== UNMATCHED ROWS (" + unmatchedExcelRows.length + ") ===================");
      console.table(unmatchedExcelRows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
