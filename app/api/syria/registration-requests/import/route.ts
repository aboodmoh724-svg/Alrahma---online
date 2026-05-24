import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { normalizePhoneDigits } from "@/lib/phone-number";
import { prisma } from "@/lib/prisma";

function normalize(value: unknown) {
  return String(value || "").trim();
}

function cell(row: Record<string, unknown>, candidates: string[]) {
  for (const key of Object.keys(row)) {
    const normalizedKey = key.trim().replace(/\s+/g, " ");
    if (candidates.some((candidate) => normalizedKey === candidate || normalizedKey.includes(candidate))) {
      return normalize(row[key]);
    }
  }
  return "";
}

async function getCurrentSyriaAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE_SYRIA",
      isActive: true,
    },
    select: { id: true },
  });
}

export async function POST(req: Request) {
  try {
    const admin = await getCurrentSyriaAdmin();

    if (!admin) {
      return NextResponse.json({ error: "لا تملك صلاحية استيراد طلبات سوريا" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "ارفع ملف CSV أو Excel أولا" }, { status: 400 });
    }

    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;

    if (!sheet) {
      return NextResponse.json({ error: "الملف لا يحتوي على بيانات" }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    let created = 0;
    let skipped = 0;
    const skippedRows: { row: number; reason: string }[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const studentName = cell(row, ["الاسم الثلاثي", "اسم الطالب", "الاسم"]);
      const parentWhatsapp = normalizePhoneDigits(cell(row, ["رقم هاتف ولي الأمر", "ولي الأمر", "واتساب"]));

      if (!studentName || !parentWhatsapp) {
        skipped += 1;
        skippedRows.push({ row: index + 2, reason: "الاسم أو رقم ولي الأمر غير موجود" });
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
        skippedRows.push({ row: index + 2, reason: "طلب مكرر بنفس الاسم والرقم" });
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

    return NextResponse.json({
      success: true,
      total: rows.length,
      created,
      skipped,
      skippedRows: skippedRows.slice(0, 20),
    });
  } catch (error) {
    console.error("IMPORT SYRIA REGISTRATION REQUESTS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء استيراد طلبات التسجيل" }, { status: 500 });
  }
}
