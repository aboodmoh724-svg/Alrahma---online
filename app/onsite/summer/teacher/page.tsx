import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/auth/LogoutButton";
import { prisma } from "@/lib/prisma";
import { getIstanbulDateKey } from "@/lib/school-day";

type SummerReportToday = {
  id: string;
  status: "PRESENT" | "ABSENT";
  quranNew: string | null;
  quranRevision: string | null;
  quranTaqeen: string | null;
  noorLearned: string | null;
  noorHomework: boolean | null;
  noorHomeworkGrade: number | null;
  noorParticipation: number | null;
  behaviorGrade: number | null;
  behaviorNotes: string | null;
};

type StudentWithTodayReport = {
  id: string;
  fullName: string;
  summerGroup: string | null;
  parentWhatsapp: string | null;
  summerReports: SummerReportToday[];
};

type CircleWithStudents = {
  id: string;
  name: string;
  track: string | null;
  students: StudentWithTodayReport[];
};

type TeacherDashboardProps = {
  searchParams?: Promise<{
    circleId?: string;
  }>;
};

export default async function OnsiteSummerTeacherDashboardPage({
  searchParams,
}: TeacherDashboardProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const params = await searchParams;
  const selectedCircleId = params?.circleId || "";
  const todayKey = getIstanbulDateKey(new Date());

  if (!teacherId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6 text-amber-800 backdrop-blur shadow-lg">
          <p className="font-black text-lg">الرجاء تسجيل الدخول أولاً للوصول إلى لوحة المعلم.</p>
          <Link
            href="/onsite/summer/teacher/login"
            className="mt-4 inline-flex rounded-2xl bg-amber-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-800 shadow"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  // Fetch teacher and their summer circles
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      circles: {
        where: {
          studyMode: "ONSITE_SUMMER",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          students: {
            where: {
              isActive: true,
              studyMode: "ONSITE_SUMMER",
            },
            orderBy: {
              fullName: "asc",
            },
            include: {
              summerReports: {
                where: {
                  dateKey: todayKey,
                },
                select: {
                  id: true,
                  status: true,
                  quranNew: true,
                  quranRevision: true,
                  quranTaqeen: true,
                  noorLearned: true,
                  noorHomework: true,
                  noorHomeworkGrade: true,
                  noorParticipation: true,
                  behaviorGrade: true,
                  behaviorNotes: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    const isAdmin = await prisma.user.findFirst({
      where: { id: teacherId, role: "ADMIN", isActive: true },
      select: { id: true },
    });

    if (isAdmin) {
      return (
        <main className="rahma-shell min-h-screen p-6" dir="rtl">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-blue-200 bg-blue-50/80 p-6 text-blue-800 backdrop-blur shadow-lg">
            <p className="font-black text-lg">⚠️ أنت مسجل الدخول حالياً بحساب مدير (Admin).</p>
            <p className="mt-2 text-sm">للوصول إلى لوحة المعلم الصيفية، يرجى تسجيل الخروج أولاً ثم تسجيل الدخول باستخدام حساب المعلم.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LogoutButton className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 shadow cursor-pointer" />
              <Link
                href="/onsite/summer/admin"
                className="rounded-2xl bg-white border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50 shadow"
              >
                الذهاب للوحة إدارة الصيفية
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50/80 p-6 text-red-700 backdrop-blur shadow-lg">
          <p className="font-black text-lg">لا يمكن العثور على حساب المعلم أو الحساب غير نشط.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/onsite/summer/teacher/login"
              className="inline-flex rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 shadow"
            >
              تسجيل الدخول كمعلم
            </Link>
            <LogoutButton className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 shadow cursor-pointer" />
          </div>
        </div>
      </main>
    );
  }

  const circles = teacher.circles as unknown as CircleWithStudents[];
  const activeCircle =
    circles.find((circle) => circle.id === selectedCircleId) || circles[0] || null;

  const students = activeCircle ? activeCircle.students : [];
  const studentsCount = students.length;
  const completedTodayCount = students.filter(
    (student) => student.summerReports.length > 0
  ).length;

  return (
    <main className="rahma-shell min-h-screen bg-gradient-to-br from-[#faf6ed] via-[#fff] to-[#f4eee0] p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Section */}
        <header className="relative overflow-hidden rounded-[2.5rem] bg-[#0f766e] p-6 text-white shadow-xl sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(189,143,45,0.15),transparent_45%)]" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-[#9cc4c0] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                الدورة الصيفية لقرآن أفيون
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">مرحباً، أ. {teacher.fullName}</h1>
              <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-xl">
                مساحتك المخصصة لمتابعة حلقات الدورة الصيفية ورصد التقارير اليومية لطلاب القرآن ونور البيان بيسر وسهولة.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-white border border-white/10 backdrop-blur transition hover:bg-white/16"
              >
                الرئيسية
              </Link>
              <LogoutButton className="rounded-2xl bg-red-600/90 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 shadow-md" />
            </div>
          </div>
        </header>

        {/* Statistics Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
            <p className="text-xs font-bold text-slate-500">حلقاتك النشطة</p>
            <p className="mt-2 text-3xl font-black text-[#0f766e]">{circles.length}</p>
          </div>
          <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
            <p className="text-xs font-bold text-slate-500">إجمالي طلاب الحلقة الحالية</p>
            <p className="mt-2 text-3xl font-black text-[#0f766e]">{studentsCount} طلاب</p>
          </div>
          <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
            <p className="text-xs font-bold text-slate-500">تقارير مكتملة اليوم</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0f766e]">{completedTodayCount}</span>
              <span className="text-sm text-slate-400">من {studentsCount}</span>
              {studentsCount > 0 && completedTodayCount === studentsCount && (
                <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-700 border border-green-200">مكتمل 🎉</span>
              )}
            </div>
          </div>
        </div>

        {/* Circles Tabs */}
        {circles.length > 0 && (
          <nav className="flex flex-wrap gap-2 p-1.5 rounded-3xl bg-white/50 border border-[#9cc4c0]/10 backdrop-blur w-fit">
            {circles.map((c) => (
              <Link
                key={c.id}
                href={`/onsite/summer/teacher?circleId=${c.id}`}
                className={`rounded-2xl px-5 py-3 text-sm font-black transition-all duration-300 ${
                  activeCircle?.id === c.id
                    ? "bg-[#0d9488] text-white shadow-md shadow-[#0d9488]/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Students Table Section */}
        {activeCircle ? (
          <div className="overflow-hidden rounded-3xl border border-[#9cc4c0]/20 bg-white/70 shadow-sm backdrop-blur">
            <div className="border-b border-[#9cc4c0]/10 bg-gradient-to-r from-[#0f766e]/5 to-[#bd8f2d]/5 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#0f766e]">{activeCircle.name}</h2>
                <p className="text-xs text-slate-500 mt-1">كشف أسماء الطلاب المسجلين بالدورة ورصد حالتهم اليومية ({todayKey})</p>
              </div>
            </div>

            {studentsCount === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <span className="text-4xl block mb-3">👥</span>
                <p className="font-bold">لا يوجد طلاب نشطين مضافين لهذه الحلقة حتى الآن.</p>
                <p className="text-xs text-slate-400 mt-1">الرجاء مراجعة الإدارة لإضافة طلاب لحلقتك.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-[#9cc4c0]/10 bg-[#fffaf0]/60 text-xs font-black text-slate-500">
                      <th className="px-6 py-4">اسم الطالب</th>
                      <th className="px-6 py-4">مسار الطالب</th>
                      <th className="px-6 py-4">تقرير اليوم</th>
                      <th className="px-6 py-4">الحالة</th>
                      <th className="px-6 py-4 text-left">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#9cc4c0]/10 text-sm">
                    {students.map((student) => {
                      const report = student.summerReports[0];
                      const isFilled = !!report;

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4 font-black text-slate-800">
                            {student.fullName}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-black border ${
                                student.summerGroup === "QURAN"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              {student.summerGroup === "QURAN" ? "📖 قرآن كريم" : "✨ نور البيان"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isFilled ? (
                              <span className="inline-flex items-center rounded-xl bg-green-50 px-2.5 py-1 text-xs font-black text-green-700 border border-green-200">
                                تم الرصد بنجاح
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 border border-amber-200">
                                معلق - لم يرصد
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isFilled ? (
                              <span
                                className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-black ${
                                  report.status === "PRESENT"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {report.status === "PRESENT" ? "حضور" : "غائب"}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-left">
                            <Link
                              href={`/onsite/summer/teacher/reports/${student.id}`}
                              className={`inline-flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-black transition shadow-sm ${
                                isFilled
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  : "bg-[#bd8f2d] text-white hover:bg-[#a67c25] hover:shadow-[#bd8f2d]/20"
                              }`}
                            >
                              {isFilled ? "✏️ تعديل التقرير" : "➕ إدخال التقرير"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-8 text-center text-slate-500 backdrop-blur shadow-sm">
            <span className="text-4xl block mb-2">🏫</span>
            <p className="font-bold">لا توجد حلقات مسجلة للدورة الصيفية على هذا الحساب حالياً.</p>
          </div>
        )}
      </div>
    </main>
  );
}

