import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";
import { smartDelay, canSendMore, incrementDailySendCount, addMessageVariation } from "@/lib/smart-sender";
import { loadExamGrades } from "@/lib/summer-evaluation";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

// GET: Pre-send inspection
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const gradeData = loadExamGrades();
    const evaluatedStudentIds = new Set(gradeData.students.map((s) => s.studentId));

    const students = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true, id: { in: Array.from(evaluatedStudentIds) } },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        circle: { select: { name: true } },
      },
    });

    let readyCount = 0;
    let missingPhoneCount = 0;
    const readyStudents: string[] = [];
    const missingPhoneStudents: string[] = [];

    for (const s of students) {
      const phone = s.parentWhatsapp ? normalizeWhatsAppNumber(s.parentWhatsapp, "90") : null;
      if (phone) {
        readyCount++;
        readyStudents.push(s.fullName);
      } else {
        missingPhoneCount++;
        missingPhoneStudents.push(s.fullName);
      }
    }

    return NextResponse.json({
      totalEvaluated: gradeData.students.length,
      matchedInDb: students.length,
      readyCount,
      missingPhoneCount,
      readyStudents,
      missingPhoneStudents,
    });
  } catch (error) {
    console.error("GET /api/summer/admin/send-progress-reports error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الجلب" }, { status: 500 });
  }
}

// POST: Bulk send progress reports to parents via WhatsApp
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetStudentId = body.studentId as string | undefined;

    const gradeData = loadExamGrades();
    const studentMap = new Map(gradeData.students.map((s) => [s.studentId, s]));

    const students = await prisma.student.findMany({
      where: {
        studyMode: "ONSITE_SUMMER",
        isActive: true,
        id: targetStudentId ? targetStudentId : { in: Array.from(studentMap.keys()) },
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        circle: { select: { name: true } },
      },
    });

    let sent = 0;
    let skippedNoPhone = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const student of students) {
      const evalData = studentMap.get(student.id);
      if (!evalData) continue;

      const phone = student.parentWhatsapp
        ? normalizeWhatsAppNumber(student.parentWhatsapp, "90")
        : null;

      if (!phone) {
        skippedNoPhone++;
        continue;
      }

      // Check daily quota
      if (!(await canSendMore("ONSITE_SUMMER"))) {
        errors.push("تم الوصول للحد الأقصى للإرسال اليومي");
        break;
      }

      const reportUrl = `${appUrl}/onsite/summer/parent-report/${student.id}`;

      let msg = `السلام عليكم ورحمة الله وبركاته 🌿\n\n`;
      msg += `يسر إدارة *تحفيظ الرحمة للقرآن الكريم* أن تشارككم تقرير إنجاز ابنكم في الدورة الصيفية 2026 - الفترة الأولى.\n\n`;
      msg += `📖 الطالب: *${student.fullName}*\n`;
      msg += `الحلقة: ${student.circle?.name || "—"}\n`;
      msg += `النتيجة النهائية: *${evalData.finalScore}%*\n\n`;
      msg += `نسأل الله أن يبارك فيه وأن يجعله من أهل القرآن وخاصته.\n\n`;
      msg += `يمكنكم مشاهدة التقرير التفاعلي من هنا:\n`;
      msg += `${reportUrl}\n\n`;
      msg += `مع تحيات إدارة تحفيظ الرحمة`;

      msg = addMessageVariation(msg);

      const success = await sendWhatsAppText({ to: phone, body: msg, channel: "ONSITE_SUMMER" });

      if (success) {
        sent++;
        await incrementDailySendCount("ONSITE_SUMMER");

        await prisma.whatsAppOutgoingMessage.create({
          data: {
            channel: "ONSITE_SUMMER",
            toNumber: phone,
            body: msg,
            source: "SUMMER_PROGRESS_REPORT",
            category: "GENERAL",
            studentId: student.id,
          },
        });
      } else {
        failed++;
        errors.push(`فشل الإرسال إلى ${student.fullName}`);
      }

      await smartDelay(sent);
    }

    return NextResponse.json({
      success: true,
      sent,
      skippedNoPhone,
      failed,
      errors,
    });
  } catch (error) {
    console.error("POST /api/summer/admin/send-progress-reports error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الإرسال" }, { status: 500 });
  }
}
