import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("=== STARTING CIRCLE RE-ORGANIZATION AND PARENT PHONE MATCHING ===");

    // 1. Fetch all summer teachers and circles
    const summerTeachers = await prisma.user.findMany({
      where: { role: "TEACHER", studyMode: "ONSITE_SUMMER", isActive: true },
    });

    const teacherMap = new Map();
    summerTeachers.forEach((t) => {
      teacherMap.set(t.fullName.trim(), t);
    });

    // Define target circle names for each teacher
    const circleConfig: Array<{ teacherSearch: string; circleName: string; isRemote?: boolean }> = [
      { teacherSearch: "أسامة سليمان", circleName: "حلقة القرآن - 1" },
      { teacherSearch: "أحمد راعي جوخة", circleName: "حلقة القرآن - 2" },
      { teacherSearch: "ريان", circleName: "حلقة القرآن - 3" },
      { teacherSearch: "أحمد القط", circleName: "حلقة نور البيان - 1" },
      { teacherSearch: "عبدالله اليحيى", circleName: "حلقة نور البيان - 2" },
      { teacherSearch: "محسن", circleName: "حلقة نور البيان - 3" },
      { teacherSearch: "العمري", circleName: "حلقة القرآن (عن بعد)", isRemote: true },
    ];

    const updatedCirclesInfo = [];

    for (const cfg of circleConfig) {
      // Find teacher
      const teacher = summerTeachers.find((t) => t.fullName.includes(cfg.teacherSearch));
      if (!teacher) continue;

      // Find existing circle for this teacher or create new one
      let circle = await prisma.circle.findFirst({
        where: { teacherId: teacher.id, studyMode: "ONSITE_SUMMER" },
      });

      if (circle) {
        circle = await prisma.circle.update({
          where: { id: circle.id },
          data: { name: cfg.circleName },
        });
      } else {
        circle = await prisma.circle.create({
          data: {
            name: cfg.circleName,
            teacherId: teacher.id,
            studyMode: "ONSITE_SUMMER",
          },
        });
      }

      // Link all students of this teacher to this specific circle
      const updatedStudents = await prisma.student.updateMany({
        where: { teacherId: teacher.id, studyMode: "ONSITE_SUMMER" },
        data: { circleId: circle.id },
      });

      updatedCirclesInfo.push({
        circleName: cfg.circleName,
        teacherName: teacher.fullName,
        studentsCount: updatedStudents.count,
      });
    }

    // 2. MATCH AND COPY PARENT WHATSAPP NUMBERS FROM AFYON / OTHER DEPARTMENTS
    const summerStudents = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
    });

    const otherStudents = await prisma.student.findMany({
      where: {
        studyMode: { not: "ONSITE_SUMMER" },
        parentWhatsapp: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        studyMode: true,
      },
    });

    let matchedPhonesCount = 0;
    const matchedDetails = [];

    for (const st of summerStudents) {
      const cleanSummerName = st.fullName.trim().replace(/\s+/g, " ");

      // Find match in other departments
      const match = otherStudents.find((os) => {
        const cleanOtherName = os.fullName.trim().replace(/\s+/g, " ");
        if (cleanOtherName === cleanSummerName) return true;
        // Compare first 3 words
        const sWords = cleanSummerName.split(" ");
        const oWords = cleanOtherName.split(" ");
        if (sWords.length >= 2 && oWords.length >= 2) {
          if (sWords[0] === oWords[0] && sWords[1] === oWords[1]) {
            if (sWords.length === 2 || oWords.length === 2 || sWords[2] === oWords[2]) {
              return true;
            }
          }
        }
        return false;
      });

      if (match && match.parentWhatsapp) {
        await prisma.student.update({
          where: { id: st.id },
          data: { parentWhatsapp: match.parentWhatsapp },
        });
        matchedPhonesCount++;
        matchedDetails.push({
          studentName: st.fullName,
          matchedWith: match.fullName,
          whatsapp: match.parentWhatsapp,
          fromMode: match.studyMode,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم تنظيم الحلقات وربط الطلاب بالمعلمين وتحديث أرقام الواتساب لأولياء الأمور بنجاح!`,
      circles: updatedCirclesInfo,
      matchedPhonesCount,
      matchedDetails,
      totalSummerStudents: summerStudents.length,
    });
  } catch (error) {
    console.error("ORGANIZE ERROR =>", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "حدث خطأ أثناء التنظيم" },
      { status: 500 }
    );
  }
}
