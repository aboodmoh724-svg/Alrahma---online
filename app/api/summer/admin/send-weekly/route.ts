import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

// GET: Pre-send inspection — returns counts for ready, missing phone, etc.
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const students = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
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
      const phone = s.parentWhatsapp
        ? normalizeWhatsAppNumber(s.parentWhatsapp, "90")
        : null;
      if (phone) {
        readyCount++;
        readyStudents.push(s.fullName);
      } else {
        missingPhoneCount++;
        missingPhoneStudents.push(s.fullName);
      }
    }

    return NextResponse.json({
      totalStudents: students.length,
      readyCount,
      missingPhoneCount,
      readyStudents,
      missingPhoneStudents,
    });
  } catch (error) {
    console.error("WEEKLY INSPECT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// POST: Send weekly cards — supports both single student and bulk sending
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, studentIds, topicTitle } = body;

    // Determine target student IDs
    let targetIds: string[] = [];

    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      // Bulk send mode
      targetIds = studentIds;
    } else if (studentId) {
      // Single send mode (legacy compatibility)
      targetIds = [studentId];
    } else {
      return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        id: { in: targetIds },
        studyMode: "ONSITE_SUMMER",
        isActive: true,
      },
      include: { circle: { select: { name: true } } },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: "لم يُعثر على طلاب في الدورة الصيفية" }, { status: 404 });
    }

    let sentCount = 0;
    let failCount = 0;
    const failedStudents: { name: string; reason: string }[] = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      const phone = student.parentWhatsapp
        ? normalizeWhatsAppNumber(student.parentWhatsapp, "90")
        : null;

      if (!phone) {
        failCount++;
        failedStudents.push({ name: student.fullName, reason: "لا يوجد رقم واتساب" });
        continue;
      }

      const cardUrl = appUrl(`/onsite/summer/admin/weekly-card/${student.id}`);
      const educationTopicStr = topicTitle ? `\n📚 *درس التربية لهذا الأسبوع:* ${topicTitle}\n` : "";

      const messageText =
        `السلام عليكم ورحمة الله وبركاته 🌹\n\n` +
        `نرفق لكم *بطاقة التقرير الأسبوعي* للطالب/ـة: *${student.fullName}*\n` +
        `الحلقة: ${student.circle?.name || "-"}\n` +
        educationTopicStr +
        `\nيمكنكم الاطلاع على بطاقة التقرير الأسبوعي التفاعلية عبر الرابط التالي:\n` +
        `${cardUrl}\n\n` +
        `نشكر لكم حسن تعاونكم ومتابعتكم القيمة.\n\n` +
        `إدارة الدورة الصيفية - تحفيظ الرحمة`;

      try {
        await sendWhatsAppText({
          to: phone,
          body: messageText,
          channel: "ONSITE_SUMMER",
          source: "SUMMER_WEEKLY_REPORT",
        });

        // Log outgoing message
        await prisma.whatsAppOutgoingMessage.create({
          data: {
            channel: "ONSITE_SUMMER",
            toNumber: phone,
            body: messageText,
            source: "SUMMER_WEEKLY_REPORT",
            category: "GENERAL",
            studentId: student.id,
          },
        });

        sentCount++;
      } catch (err) {
        failCount++;
        failedStudents.push({
          name: student.fullName,
          reason: err instanceof Error ? err.message : "فشل الإرسال",
        });
      }

      // Add 2-second delay between messages to avoid WhatsApp rate limiting/ban
      if (i < students.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failCount,
      totalProcessed: students.length,
      failedStudents,
      message: `تم إرسال ${sentCount} بطاقة أسبوعية بنجاح ✅ (فشل: ${failCount})`,
    });
  } catch (error) {
    console.error("SEND SUMMER WEEKLY REPORT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال التقارير الأسبوعية" }, { status: 500 });
  }
}
