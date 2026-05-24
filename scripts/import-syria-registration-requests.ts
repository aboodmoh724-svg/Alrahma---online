import fs from "fs";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import { normalizePhoneDigits } from "../lib/phone-number";

function cell(row: Record<string, unknown>, candidates: string[]) {
  for (const key of Object.keys(row)) {
    const normalized = key.trim().replace(/\s+/g, " ");
    if (candidates.some((candidate) => normalized === candidate || normalized.includes(candidate))) {
      return String(row[key] || "").trim();
    }
  }
  return "";
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("Usage: tsx scripts/import-syria-registration-requests.ts path/to/responses.csv");
  }

  const workbook = XLSX.readFile(filePath, { codepage: 65001 });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const studentName = cell(row, ["الاسم الثلاثي", "اسم الطالب", "الاسم"]);
    const parentWhatsapp = normalizePhoneDigits(
      cell(row, ["رقم هاتف ولي الأمر", "ولي الأمر", "واتساب"])
    );

    if (!studentName || !parentWhatsapp) {
      skipped += 1;
      continue;
    }

    const exists = await prisma.registrationRequest.findFirst({
      where: {
        studyMode: "ONSITE_SYRIA",
        studentName,
        parentWhatsapp,
      },
      select: { id: true },
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    const age = cell(row, ["العمر رقما", "العمر"]);
    const grade = cell(row, ["الصف الدراسي", "الصف"]);
    const schoolName = cell(row, ["اسم المدرسة", "المدرسة"]);
    const previousStudent = cell(row, ["هل سبق لك الالتحاق", "سبق"]);
    const memorizedAmount = cell(row, ["إلى أي جزء وصلت", "حفظك"]);
    const tajweedLevel = cell(row, ["مستوى تجويدك", "التجويد"]);
    const goals = cell(row, ["الأهداف", "تحقيقها"]);
    const notes = cell(row, ["ملاحظات"]);

    await prisma.registrationRequest.create({
      data: {
        studyMode: "ONSITE_SYRIA",
        studentName,
        parentWhatsapp,
        previousStudent: previousStudent.includes("نعم"),
        grade: [grade, age ? `العمر: ${age}` : "", schoolName ? `المدرسة: ${schoolName}` : ""]
          .filter(Boolean)
          .join(" - ") || null,
        gender: "ذكور",
        previousStudy: previousStudent || null,
        memorizedAmount: memorizedAmount || null,
        tajweedLevel: tajweedLevel || null,
        hasLearningIssues: false,
        hasDevice: true,
        readGuidelines: true,
        notes: [goals ? `الأهداف: ${goals}` : "", notes].filter(Boolean).join("\n") || null,
      },
    });
    created += 1;
  }

  console.log(JSON.stringify({ total: rows.length, created, skipped }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
