import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhoneDigits } from "@/lib/phone-number";
import { generateStudentCode } from "@/lib/student-code";

function normalizeEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  return email || null;
}

function normalizeString(value: unknown) {
  const s = String(value || "").trim();
  return s || null;
}

function buildNotes(parts: {
  notes: string | null;
  goals: string | null;
  memorizedAmount: string | null;
}) {
  return [
    parts.notes,
    parts.goals ? `الأهداف: ${parts.goals}` : "",
    parts.memorizedAmount ? `المحفوظ: ${parts.memorizedAmount}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولا" }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "ADMIN",
        studyMode: "ONSITE_SYRIA",
        isActive: true,
      },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "لا تملك صلاحية استيراد الطلاب" }, { status: 403 });
    }

    const body = await req.json();
    const fullName = normalizeString(body.fullName);
    const parentWhatsapp = normalizePhoneDigits(body.parentWhatsapp) || null;
    const parentEmail = normalizeEmail(body.parentEmail);
    const teacherEmail = normalizeEmail(body.teacherEmail);
    const fallbackTeacherId = normalizeString(body.fallbackTeacherId);
    const circleName = normalizeString(body.circleName);
    const age = normalizeString(body.age);
    const grade = normalizeString(body.grade);
    const schoolName = normalizeString(body.schoolName);
    const previousStudent = normalizeString(body.previousStudent);
    const memorizedAmount = normalizeString(body.memorizedAmount);
    const tajweedLevel = normalizeString(body.tajweedLevel);
    const goals = normalizeString(body.goals);
    const notes = normalizeString(body.notes);

    if (!fullName) {
      return NextResponse.json({ error: "اسم الطالب مطلوب" }, { status: 400 });
    }

    let teacherId: string | null = null;

    if (teacherEmail) {
      const teacher = await prisma.user.findFirst({
        where: {
          email: teacherEmail,
          role: "TEACHER",
          studyMode: "ONSITE_SYRIA",
          isActive: true,
        },
        select: { id: true },
      });
      teacherId = teacher?.id || null;
    }

    if (!teacherId && fallbackTeacherId) {
      const fallbackTeacher = await prisma.user.findFirst({
        where: {
          id: fallbackTeacherId,
          role: "TEACHER",
          studyMode: "ONSITE_SYRIA",
          isActive: true,
        },
        select: { id: true },
      });
      teacherId = fallbackTeacher?.id || null;
    }

    if (!teacherId) {
      return NextResponse.json(
        {
          error:
            "تعذر تحديد معلم للطالب. أضف teacherEmail في الملف أو اختر معلما افتراضيا من الصفحة.",
        },
        { status: 400 }
      );
    }

    let circleId: string | null = null;

    if (circleName) {
      const circle = await prisma.circle.findFirst({
        where: {
          name: circleName,
          studyMode: "ONSITE_SYRIA",
        },
        select: { id: true, teacherId: true },
      });

      if (circle) {
        circleId = circle.id;
        if (circle.teacherId) {
          teacherId = circle.teacherId;
        }
      }
    }

    const existing = await prisma.student.findFirst({
      where: {
        fullName,
        teacherId,
        studyMode: "ONSITE_SYRIA",
      },
      select: { id: true },
    });

    const student = existing
      ? await prisma.student.update({
          where: { id: existing.id },
          data: {
            parentWhatsapp,
            parentEmail,
            circleId,
            isActive: true,
          },
          select: { id: true },
        })
      : await prisma.student.create({
          data: {
            studentCode: await generateStudentCode("ONSITE_SYRIA"),
            fullName,
            parentWhatsapp,
            parentEmail,
            teacherId,
            circleId,
            studyMode: "ONSITE_SYRIA",
            isActive: true,
          },
          select: { id: true },
        });

    await prisma.studentDetail.upsert({
      where: { studentId: student.id },
      create: {
        studentId: student.id,
        source: "SYRIA_GOOGLE_FORM",
        matchedName: fullName,
        grade,
        schoolName,
        guardianPhone: parentWhatsapp,
        generalLevel: tajweedLevel,
        notes: buildNotes({ notes, goals, memorizedAmount }),
        rawData: {
          age,
          grade,
          schoolName,
          previousStudent,
          memorizedAmount,
          tajweedLevel,
          goals,
          notes,
        },
      },
      update: {
        matchedName: fullName,
        grade,
        schoolName,
        guardianPhone: parentWhatsapp,
        generalLevel: tajweedLevel,
        notes: buildNotes({ notes, goals, memorizedAmount }),
        rawData: {
          age,
          grade,
          schoolName,
          previousStudent,
          memorizedAmount,
          tajweedLevel,
          goals,
          notes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      studentId: student.id,
      mode: existing ? "updated" : "created",
    });
  } catch (error) {
    console.error("ONSITE_SYRIA IMPORT STUDENTS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء استيراد الطلاب" }, { status: 500 });
  }
}
