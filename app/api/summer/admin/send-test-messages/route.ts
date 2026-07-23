import { NextResponse } from "next/server";
import { sendWhatsAppText, normalizeWhatsAppNumber } from "@/lib/whatsapp";

export async function GET() {
  const targetPhone = normalizeWhatsAppNumber("905525397886", "90");
  if (!targetPhone) {
    return NextResponse.json({ error: "رقم غير صحيح" }, { status: 400 });
  }

  const dateStr = new Date().toISOString().split("T")[0];

  // 1. Quran Daily Message Template
  const quranMsg =
    `السلام عليكم ورحمة الله وبركاته 🌹\n\n` +
    `📋 *تقرير الطالب اليومي* 🌟\n\n` +
    `👤 *اسم الطالب:* عبد الرحمن أسامة\n` +
    `🏫 *الحلقة:* حلقة القرآن - 1\n` +
    `👳‍♂️ *المعلم:* أستاذ أسامة سليمان\n` +
    `📅 *التاريخ:* ${dateStr}\n\n` +
    `----------------------------------------\n` +
    `📖 *الحفظ الجديد:*\nسورة النبأ من آية 1 إلى 20\n\n` +
    `🔄 *المراجعة:*\nسورة المرسلات كاملة\n\n` +
    `🗣️ *التلقين:*\nسورة النبأ من آية 21 إلى 40\n\n` +
    `----------------------------------------\n` +
    `⭐ *السلوك والانضباط:* 5 من 5\n` +
    `📝 *ملاحظات المعلم:* ممتاز جداً ومشارك بفاعلية مع الحلقة\n\n` +
    `جزاكم الله خيراً على حسن المتابعة.\n` +
    `إدارة الدورة الصيفية الأولى - تحفيظ الرحمة`;

  // 2. Noor Al-Bayan Daily Message Template
  const noorMsg =
    `السلام عليكم ورحمة الله وبركاته 🌹\n\n` +
    `📋 *تقرير الطالب اليومي* 🌟\n\n` +
    `👤 *اسم الطالب:* أحمد محمد حميد\n` +
    `🏫 *الحلقة:* حلقة نور البيان - 1\n` +
    `👳‍♂️ *المعلم:* أستاذ أحمد القط\n` +
    `📅 *التاريخ:* ${dateStr}\n\n` +
    `----------------------------------------\n` +
    `📚 *ماذا تعلم اليوم:*\nحروف الفتح وتجميع كلمات من 3 حروف\n\n` +
    `📝 *الواجب اليومي:* تم التسليم ✅ (الدرجة: 5/5)\n` +
    `🖐️ *المشاركة والتفاعل:* 5 من 5\n\n` +
    `----------------------------------------\n` +
    `⭐ *السلوك والانضباط:* 5 من 5\n` +
    `📝 *ملاحظات المعلم:* قراءة متميزة وتفاعل ممتاز في الدرس\n\n` +
    `جزاكم الله خيراً على حسن المتابعة.\n` +
    `إدارة الدورة الصيفية الأولى - تحفيظ الرحمة`;

  // 3. Absence Message Template
  const absenceMsg =
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نفيدكم بأن ابنكم الكريم / *عبد الرحمن أسامة*\n` +
    `قد غاب عن الدورة الصيفية اليوم بتاريخ ${dateStr}.\n\n` +
    `نرجو الحرص على انتظام الحضور لما له من أثر على مستوى الطالب.\n` +
    `نشكر لكم حسن التعاون.\n\n` +
    `إدارة الدورة الصيفية الأولى - تحفيظ الرحمة`;

  const results = [];

  try {
    // Send Message 1: Quran
    const r1 = await sendWhatsAppText({
      to: targetPhone,
      body: quranMsg,
      channel: "ONSITE_SUMMER",
      source: "TEST_SUITE_QURAN",
    });
    results.push({ type: "QURAN", status: "SUCCESS", r1 });

    // Small pause between messages
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Send Message 2: Noor Al-Bayan
    const r2 = await sendWhatsAppText({
      to: targetPhone,
      body: noorMsg,
      channel: "ONSITE_SUMMER",
      source: "TEST_SUITE_NOOR",
    });
    results.push({ type: "NOOR_AL_BAYAN", status: "SUCCESS", r2 });

    // Small pause between messages
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Send Message 3: Absence
    const r3 = await sendWhatsAppText({
      to: targetPhone,
      body: absenceMsg,
      channel: "ONSITE_SUMMER",
      source: "TEST_SUITE_ABSENCE",
    });
    results.push({ type: "ABSENCE", status: "SUCCESS", r3 });

    return NextResponse.json({
      success: true,
      targetPhone,
      sentCount: results.length,
      results,
    });
  } catch (error) {
    console.error("TEST MESSAGES SEND ERROR =>", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
