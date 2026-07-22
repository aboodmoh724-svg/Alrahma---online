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

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, topicTitle } = body;

    if (!studentId) {
      return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { circle: { select: { name: true } } },
    });

    if (!student || student.studyMode !== "ONSITE_SUMMER") {
      return NextResponse.json({ error: "الطالب غير موجود في الدورة الصيفية" }, { status: 404 });
    }

    const phone = student.parentWhatsapp
      ? normalizeWhatsAppNumber(student.parentWhatsapp, "90")
      : null;

    if (!phone) {
      return NextResponse.json({ error: "لا يوجد رقم واتساب مسجل لولي الأمر" }, { status: 400 });
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

    await sendWhatsAppText({
      to: phone,
      body: messageText,
      channel: "ONSITE_SUMMER",
      source: "SUMMER_WEEKLY_REPORT",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SEND SUMMER WEEKLY REPORT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال التقرير الأسبوعي" }, { status: 500 });
  }
}
