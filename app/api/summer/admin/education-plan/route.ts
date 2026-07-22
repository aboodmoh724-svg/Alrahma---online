import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSummerEducationTopics, saveSummerEducationTopics, type EducationPlanTopic } from "@/lib/summer-education-plan";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const topics = await getSummerEducationTopics();
    return NextResponse.json({ success: true, topics });
  } catch (error) {
    console.error("GET EDUCATION TOPICS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب دروس خطة التربية" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { topics } = body;

    if (!Array.isArray(topics)) {
      return NextResponse.json({ error: "البيانات الحالية غير صحيحة" }, { status: 400 });
    }

    await saveSummerEducationTopics(topics as EducationPlanTopic[]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SAVE EDUCATION TOPICS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ دروس خطة التربية" }, { status: 500 });
  }
}
