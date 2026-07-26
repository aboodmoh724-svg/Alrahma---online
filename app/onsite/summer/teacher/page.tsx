import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

type SummerReportToday = {
  id: string;
  status: string;
  studentId: string;
  quranNew?: string | null;
  noorLearned?: string | null;
};

import LogoutButton from "@/components/LogoutButton";

export default async function OnsiteSummerTeacherDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/onsite/summer/teacher/login");
  }

  const teacher = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, fullName: true, role: true },
  });

  if (!teacher) {
    redirect("/onsite/summer/teacher/login");
  }

  // Admin Guard: Redirect admin users to admin dashboard
  if (teacher.role === "ADMIN") {
    redirect("/onsite/summer/admin");
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch teacher's assigned students
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      studyMode: "ONSITE_SUMMER",
      OR: [
        { teacherId: teacher.id },
        { studentCode: "7500" },
      ],
    },
    include: {
      circle: { select: { name: true } },
      summerReports: {
        where: { dateKey: todayStr },
        select: { id: true, status: true, quranNew: true, noorLearned: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const filledCount = students.filter((s) => s.summerReports.length > 0).length;
  const absentCount = students.filter((s) => s.summerReports.length > 0 && (s.summerReports[0] as SummerReportToday).status === "ABSENT").length;
  const presentCount = filledCount - absentCount;

  const quotes = [
    "«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ» — رواه البخاري",
    "«مَنْ قَرَأَ حَرْفاً مِنْ كِتابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ» — رواه الترمذي",
    "«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» — رواه مسلم",
    "«إنَّ اللَّهَ يَرْفَعُ بِهذا الكِتابِ أقْواماً ويَضَعُ بِهِ آخَرِينَ» — رواه مسلم",
    "«الماهِرُ بالقُرآنِ مع السَّفَرَةِ الكِرامِ البَرَرَةِ» — متفق عليه",
    "«يُقالُ لِصاحِبِ القُرآنِ: اقرأ وارتقِ ورتِّل» — رواه أبو داود",
    "«تعلَّموا القرآنَ وعلِّموهُ الناسَ» — رواه الترمذي",
  ];
  const dayIndex = new Date().getDay();
  const quoteParts = quotes[dayIndex].split(" — ");
  const quoteText = quoteParts[0];
  const quoteAttribution = quoteParts[1] ? `— ${quoteParts[1]}` : "";

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a2e23] dir-rtl font-sans pb-12" dir="rtl">
      {/* 1. Header Bar */}
      <header className="bg-[#0c5c5e] text-white">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#d4a853]">لوحة المعلم</h1>
          <LogoutButton redirectUrl="/onsite/summer" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-8 space-y-6">
        {/* 2. Welcome Section */}
        <div>
          <h2 className="text-[#0c5c5e] font-extrabold text-2xl">
            مرحباً أستاذ {teacher.fullName} 🌙
          </h2>
        </div>

        {/* 3. Motivational Islamic Quote */}
        <div className="bg-white rounded-2xl border border-[#d4a853]/30 p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="font-ruqaa text-[#0c5c5e] text-xl mb-2 leading-relaxed">
            {quoteText}
          </p>
          <p className="text-[#d4a853] text-sm">
            {quoteAttribution}
          </p>
        </div>

        {/* 4. Quick Stats Row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl border border-[#d4a853]/15 p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-xs text-[#6b7280] mb-1">حاضر</p>
            <p className="font-bold text-lg text-[#10b981]">{presentCount} ✅</p>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl border border-[#d4a853]/15 p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-xs text-[#6b7280] mb-1">غائب</p>
            <p className="font-bold text-lg text-[#ef4444]">{absentCount} ❌</p>
          </div>
          <div className="flex-1 min-w-[100px] bg-white rounded-2xl border border-[#d4a853]/15 p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="text-xs text-[#6b7280] mb-1">تقارير مُرصدة</p>
            <p className="font-bold text-lg text-[#0c5c5e]">{filledCount}/{students.length} 📝</p>
          </div>
        </div>

        {/* 5. Student List */}
        <div className="space-y-4 pt-2">
          {students.map((student) => {
            const reportToday = student.summerReports[0] as SummerReportToday | undefined;
            const isDone = Boolean(reportToday);
            const firstLetter = student.fullName.charAt(0);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-[#d4a853]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-[#0c5c5e] text-white flex items-center justify-center font-bold text-xl">
                    {firstLetter}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1a2e23]">{student.fullName}</h3>
                    {student.circle?.name && (
                      <p className="text-sm text-[#6b7280] mt-0.5">{student.circle.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center gap-3 self-end sm:self-auto">
                  {isDone && (
                    <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-full whitespace-nowrap">
                      ✅ تم الرصد
                    </span>
                  )}
                  <Link
                    href={`/onsite/summer/teacher/reports/${student.id}`}
                    className="bg-[#0c5c5e] hover:bg-[#0a4a4b] text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors whitespace-nowrap"
                  >
                    {isDone ? "تعديل التقرير" : "📝 رصد التقرير"}
                  </Link>
                </div>
              </div>
            );
          })}
          {students.length === 0 && (
            <div className="text-center py-8 text-[#6b7280]">
              لا يوجد طلاب مسجلين
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
