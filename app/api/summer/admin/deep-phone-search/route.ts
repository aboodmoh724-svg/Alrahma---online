import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Function to normalize Arabic names for deep fuzzy matching
function normalizeArabic(str: string): string {
  if (!str) return "";
  return str
    .replace(/[أإآء]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, "") // remove tashkeel
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Function to generate key tokens from a name (e.g., "عبدالرحمن" -> "عبد الرحمن", first & last name)
function getNameTokens(name: string): string[] {
  const norm = normalizeArabic(name);
  const words = norm.split(" ").filter((w) => w.length > 1);
  return words;
}

export async function GET() {
  try {
    const summerStudents = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
      include: {
        circle: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
      orderBy: { fullName: "asc" },
    });

    // Fetch ALL potential phone providers:
    // 1. Students in ONSITE (Afyon), SYRIA, REMOTE
    const allOtherStudents = await prisma.student.findMany({
      where: {
        studyMode: { not: "ONSITE_SUMMER" },
        parentWhatsapp: { not: null },
        AND: [{ parentWhatsapp: { not: "" } }],
      },
      select: {
        fullName: true,
        parentWhatsapp: true,
        studyMode: true,
      },
    });

    // 2. Registration Requests with phones
    const regRequests = await prisma.registrationRequest.findMany({
      where: { parentWhatsapp: { not: "" } },
      select: { studentName: true, parentWhatsapp: true, studyMode: true },
    });

    const deepMatched: any[] = [];
    const stillMissing: any[] = [];

    for (const st of summerStudents) {
      const normSummer = normalizeArabic(st.fullName);
      const summerWords = getNameTokens(st.fullName);

      let foundPhone: string | null = st.parentWhatsapp || null;
      let matchedSource: string | null = null;
      let matchedName: string | null = null;

      if (!foundPhone) {
        // Search in allOtherStudents
        for (const os of allOtherStudents) {
          const normOs = normalizeArabic(os.fullName);
          const osWords = getNameTokens(os.fullName);

          // Check 1: Exact normalized string match
          if (normOs === normSummer) {
            foundPhone = os.parentWhatsapp;
            matchedSource = `طالب في قسم ${os.studyMode}`;
            matchedName = os.fullName;
            break;
          }

          // Check 2: All words in summer student exist in the Afyon student name!
          // e.g. "مصطفى فضيله" in "مصطفى محمد فضيلة" -> words "مصطفي", "فضيله" both exist in os
          const allWordsInOs = summerWords.every((sw) => normOs.includes(sw));
          if (allWordsInOs && summerWords.length >= 2) {
            foundPhone = os.parentWhatsapp;
            matchedSource = `طالب في قسم ${os.studyMode} (مطابقة الأجزاء)`;
            matchedName = os.fullName;
            break;
          }

          // Check 3: First word and Last word match
          if (summerWords.length >= 2 && osWords.length >= 2) {
            const sFirst = summerWords[0];
            const sLast = summerWords[summerWords.length - 1];
            const oFirst = osWords[0];
            const oLast = osWords[osWords.length - 1];

            if (sFirst === oFirst && sLast === oLast) {
              foundPhone = os.parentWhatsapp;
              matchedSource = `طالب في قسم ${os.studyMode} (الاسم الأول والأخير)`;
              matchedName = os.fullName;
              break;
            }
          }
        }
      }

      // If still not found, search in registration requests
      if (!foundPhone) {
        for (const reg of regRequests) {
          if (!reg.studentName || !reg.parentWhatsapp) continue;
          const normReg = normalizeArabic(reg.studentName);

          if (normReg === normSummer || (summerWords.length >= 2 && summerWords.every((sw) => normReg.includes(sw)))) {
            foundPhone = reg.parentWhatsapp;
            matchedSource = `طلب تسجيل (${reg.studyMode || "عام"})`;
            matchedName = reg.studentName;
            break;
          }
        }
      }

      if (foundPhone && foundPhone !== st.parentWhatsapp) {
        // Update in database!
        await prisma.student.update({
          where: { id: st.id },
          data: { parentWhatsapp: foundPhone },
        });

        deepMatched.push({
          studentName: st.fullName,
          circle: st.circle?.name,
          phone: foundPhone,
          matchedName,
          source: matchedSource,
        });
      } else if (!foundPhone && (!st.parentWhatsapp || st.parentWhatsapp.trim() === "")) {
        stillMissing.push({
          fullName: st.fullName,
          circleName: st.circle?.name || "بدون حلقة",
          teacherName: st.teacher?.fullName || "غير محدد",
        });
      }
    }

    return NextResponse.json({
      success: true,
      newlyMatchedCount: deepMatched.length,
      newlyMatched: deepMatched,
      totalStillMissing: stillMissing.length,
      stillMissing,
    });
  } catch (error) {
    console.error("DEEP SEARCH ERROR =>", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
