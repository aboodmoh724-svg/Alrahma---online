const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

function normalizeArabicName(value) {
  return String(value || "")
    .trim()
    .replace(/[\u0625\u0623\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064a")
    .replace(/\u0629/g, "\u0647")
    .replace(/[\u064b-\u0652\u0640]/g, "")
    .replace(/[\u200f\u200e]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function firstValue(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return null;
}

function fixCsvEncoding(value) {
  return Buffer.from(String(value || ""), "latin1").toString("utf8");
}

function normalizeGatheringArea(value) {
  const text = String(value || "").trim();
  const lower = text.toLowerCase();

  if (!text) return null;
  if (lower.includes("mecidiye") || text.includes("مجيد") || text.includes("لمجيد")) {
    return "Mecidiye";
  }
  if (
    lower.includes("cumhuriyet") ||
    text.includes("جمهور") ||
    text.includes("امبريولو") ||
    text.includes("انبريولو")
  ) {
    return "Cumhuriyet";
  }
  if (lower.includes("fatih") || text.includes("فاتح")) {
    return "Fatih";
  }
  if (lower.includes("sahipata") || lower.includes("sahip ata") || text.includes("صاحبات") || text.includes("ساهي")) {
    return "Sahipata";
  }

  return text;
}

function standardizeOldRecord(record) {
  const gatheringArea = normalizeGatheringArea(record["منقطة التجمع"]);
  return {
    source: "excel-2024-2025",
    sourceStudentNo: firstValue(record["م"]),
    matchedName: firstValue(record["اسم الطالب الثلاثي"]) || "",
    idImageUrl: firstValue(record["الرجاء إرفاق ( كملك، أو إقامة، أو هوية ) الطالب"]),
    birthDate: firstValue(record["تاريخ الميلاد"]),
    birthPlace: firstValue(record["مكان الميلاد"]),
    nationality: firstValue(record["الجنسية"]),
    generalLevel: firstValue(record["مستوى الطالب العام"]),
    livingWith: firstValue(record["مع من يسكن الطالب"]),
    grade: firstValue(record["الصف الدراسي"]),
    schoolName: firstValue(record["اسم المدرسة"]),
    fatherPhone: firstValue(record["جوال ولي الأمر(الأب)"]),
    motherPhone: firstValue(record["جوال ولي الأمر(الأم)"]),
    guardianPhone: firstValue(record["جوال ولي الأمر(الأب)"], record["جوال ولي الأمر(الأم)"]),
    fatherAlive: firstValue(record["هل الأب على قيد الحياة"]),
    motherAlive: firstValue(record["هل الأم على قيد الحياة"]),
    fatherEducation: firstValue(record["مستوى تعليم الأب"]),
    motherEducation: firstValue(record["مستوى تعليم الأم"]),
    hasIncome: firstValue(record["هل يوجد مصدر دخل لرب الأسرة"]),
    monthlyIncome: firstValue(record["دخل الأسرة الشهري"]),
    homeLocation: firstValue(record["نرجو إضافة موقع البيت (عن طريق إضافة ربط GBS)"]),
    gatheringArea,
    notes: firstValue(record["ملاحظات تودون ذكرها (إن وجدت)"]),
    rawData: record,
  };
}

function standardizeNewRecord(record) {
  const gatheringArea = normalizeGatheringArea(record["اسم الحي الذي يسكن فيه الطالب"]);
  return {
    source: "registration-2025-2026",
    sourceStudentNo: null,
    matchedName: firstValue(record["اسم الطالب الثلاثي"]) || "",
    idImageUrl: firstValue(record["الرجاء إرفاق ( كملك، أو إقامة ، أو هوية ) الطالب"]),
    birthDate: firstValue(record["تاريخ الميلاد"]),
    birthPlace: firstValue(record["مكان الميلاد"]),
    nationality: firstValue(record["الجنسية"]),
    generalLevel: firstValue(record["مستوى الطالب العام"]),
    livingWith: firstValue(record["مع من يسكن الطالب"]),
    grade: firstValue(record["الصف الدراسي"]),
    schoolName: firstValue(record["اسم المدرسة"]),
    fatherPhone: firstValue(record["جوال ولي الأمر(الأب)"]),
    motherPhone: firstValue(record["جوال ولي الأمر(الأم)"]),
    guardianPhone: firstValue(
      record["جوال ولي الأمر للتواصل"],
      record["جوال ولي الأمر(الأب)"],
      record["جوال ولي الأمر(الأم)"]
    ),
    fatherAlive: firstValue(record["هل الأب على قيد الحياة"]),
    motherAlive: firstValue(record["هل الأم على قيد الحياة"]),
    fatherEducation: firstValue(record["مستوى تعليم الأب"]),
    motherEducation: firstValue(record["مستوى تعليم الأم"]),
    hasIncome: firstValue(record["هل يوجد مصدر دخل لرب الأسرة"]),
    monthlyIncome: firstValue(record["دخل الأسرة الشهري"]),
    homeLocation: firstValue(record["نرجو إضافة موقع البيت (عن طريق إضافة ربط GBS)"]),
    gatheringArea,
    notes: firstValue(record["ملاحظات تودون ذكرها (إن وجدت)"]),
    rawData: record,
  };
}

function readOldRecords(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headers = rows[13].map((header) => String(header || "").trim());

  return rows
    .slice(14)
    .filter((row) => String(row[1] || "").trim())
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return standardizeOldRecord(record);
    });
}

function readNewRecords(filePath) {
  const workbook = XLSX.readFile(filePath, { type: "file", raw: false });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headers = rows[0].map(fixCsvEncoding);

  return rows
    .slice(1)
    .map((row) => row.map(fixCsvEncoding))
    .filter((row) => String(row[5] || "").trim())
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return standardizeNewRecord(record);
    });
}

function indexByName(records) {
  const map = new Map();
  for (const record of records) {
    const normalized = normalizeArabicName(record.matchedName);
    if (!normalized) continue;
    if (!map.has(normalized)) map.set(normalized, []);
    map.get(normalized).push(record);
  }
  return map;
}

function pickRecord(map, name) {
  const records = map.get(normalizeArabicName(name));
  return records?.[0] || null;
}

const approvedMatches = [
  { student: "أحمد طرقجي", source: "old", record: "احمد محمد طرقجي" },
  { student: "أواب وسام", source: "old", record: "أواب وسام أحمد" },
  { student: "بلال هاشم", source: "old", record: "بلال هاشم لاحمد" },
  { student: "حذيفة حنن", source: "old", record: "حذيفة نادر حنن" },
  { student: "حسن العريني", source: "old", record: "حسن عصام حسن العريني" },
  { student: "عبدالله عصام العريني", source: "old", record: "عبدالله عصام حسن العريني" },
  { student: "عبيدة نبيل", source: "old", record: "عبيدة نبيل توفيق" },
  { student: "عمر تشتش", source: "old", record: "عمر احمد تشتش" },
  { student: "عمر محمد الأبضال", source: "old", record: "عمر محمد ابضال" },
  { student: "قصي أحمد فضيلة", source: "old", record: "قصي أحمد مضيله" },
  { student: "محمد الباراوي", source: "old", record: "محمد فهد رسلان الباراوي" },
  { student: "محمد نور برغود", source: "old", record: "محمد نور محمود برغود" },
  { student: "محمود حمامو", source: "old", record: "محمود سليمان حمامو" },
  { student: "يمان صالح", source: "old", record: "يمان صالح حمد عبود" },
  { student: "خالد ايدن", source: "new", record: "خالد حسن أيدن" },
  { student: "محمد الإبراهيم", source: "new", record: "خالد محمد الابراهيم" },
];

async function main() {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const oldPath =
    process.argv[2] || path.join(process.cwd(), "student-details-source.xlsx");
  const newPath =
    process.argv[3] ||
    path.join(process.cwd(), "student-details-new-registration.csv");

  const oldRecords = readOldRecords(oldPath);
  const newRecords = readNewRecords(newPath);
  const oldByName = indexByName(oldRecords);
  const newByName = indexByName(newRecords);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const students = await prisma.student.findMany({
      where: { studyMode: "ONSITE", isActive: true },
      select: { id: true, fullName: true, parentWhatsapp: true },
      orderBy: { fullName: "asc" },
    });

    const matches = new Map();

    for (const student of students) {
      const directOld = pickRecord(oldByName, student.fullName);
      if (directOld) {
        matches.set(student.id, { student, detail: directOld, matchType: "direct-old" });
      }
    }

    for (const student of students) {
      if (matches.has(student.id)) continue;
      const directNew = pickRecord(newByName, student.fullName);
      if (directNew) {
        matches.set(student.id, { student, detail: directNew, matchType: "direct-new" });
      }
    }

    for (const approved of approvedMatches) {
      const student = students.find(
        (item) => normalizeArabicName(item.fullName) === normalizeArabicName(approved.student)
      );
      if (!student) continue;

      const detail =
        approved.source === "old"
          ? pickRecord(oldByName, approved.record)
          : pickRecord(newByName, approved.record);
      if (!detail) {
        console.warn(`لم أجد السجل الموافق عليه: ${approved.student} => ${approved.record}`);
        continue;
      }

      matches.set(student.id, {
        student,
        detail,
        matchType: `approved-${approved.source}`,
      });
    }

    let imported = 0;
    for (const { student, detail, matchType } of matches.values()) {
      const payload = {
        ...detail,
        rawData: {
          matchType,
          ...detail.rawData,
        },
      };

      await prisma.studentDetail.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          ...payload,
        },
        update: payload,
      });
      imported += 1;
    }

    console.log(`تم استيراد/تحديث بيانات ${imported} طالب.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
