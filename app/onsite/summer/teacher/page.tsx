import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

type SummerReportToday = {
  id: string;
  status: string;
  studentId: string;
  quranNew?: string | null;
  noorLearned?: string | null;
};

export default async function OnsiteSummerTeacherDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/onsite/summer/teacher/login");
  }

  const teacher = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, fullName: true },
  });

  if (!teacher) {
    redirect("/onsite/summer/teacher/login");
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

  return (
    <main
      className="min-h-screen bg-[#f6eee7] text-[#18322a] p-4 sm:p-6"
      dir="rtl"
      style={{
        background:
          "radial-gradient(circle at 12% 12%, rgba(189,143,45,0.14), transparent 26%), linear-gradient(135deg, #fbf6ef 0%, #f6eee7 48%, #eef6ef 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-3xl border border-[#d8bf83]/50 bg-[#fffaf4] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/summer_quran_logo_v2.jpg"
              alt="شعار الدورة الصيفية"
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl object-contain border border-[#d8bf83]/60 shadow-sm"
            />
            <div>
              <p className="text-xs font-black text-[#bd8f2d]">لوحة المعلم الصيفي</p>
              <h1 className="text-xl font-black text-[#0f5a35] sm:text-2xl">
                أستاذ/ـة: {teacher.fullName}
              </h1>
              <p className="text-xs font-bold text-[#18322a]/60">
                تاريخ اليوم: <span className="font-mono text-[#0f5a35]">{todayStr}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-[#0f5a35]/10 px-4 py-2 text-sm font-black text-[#0f5a35]">
              إنجاز اليوم: {filledCount} من {students.length}
            </span>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="rounded-2xl border border-[#d8bf83]/40 bg-[#fffaf4] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm font-black">
            <span className="text-[#0f5a35]">نسبة اكتمال تقارير الحلقة اليوم</span>
            <span className="text-[#bd8f2d]">
              {students.length > 0
                ? Math.round((filledCount / students.length) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0f5a35] transition-all duration-500"
              style={{
                width: `${
                  students.length > 0
                    ? (filledCount / students.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-[#0f5a35] px-1">
            قائمة طلاب الحلقة ({students.length} طالباً)
          </h2>

          {students.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8bf83] bg-white p-8 text-center text-sm font-bold text-[#18322a]/60">
              لا يوجد طلاب مسجلين في حلقتك حتى الآن.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {students.map((student) => {
                const reportToday = student.summerReports[0] as SummerReportToday | undefined;
                const isDone = Boolean(reportToday);
                const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

                return (
                  <div
                    key={student.id}
                    className={`flex flex-col justify-between rounded-3xl border p-4 transition shadow-sm ${
                      isDone
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-[#d8bf83]/60 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                              isNoor
                                ? "bg-blue-100 text-blue-800"
                                : "bg-[#0f5a35]/15 text-[#0f5a35]"
                            }`}
                          >
                            {isNoor ? "نور البيان" : "قرآن كريم"}
                          </span>
                          {student.studentCode === "7500" && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                              تجريبي
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1.5 text-lg font-black text-[#18322a]">
                          {student.fullName}
                        </h3>
                        {student.circle?.name && (
                          <p className="text-xs font-bold text-[#bd8f2d]">
                            {student.circle.name}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {isDone
                          ? reportToday?.status === "ABSENT"
                            ? "غائب ❌"
                            : "تم التعبئة ✅"
                          : "بانتظار التعبئة ⏳"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#d8bf83]/25 pt-3">
                      <span className="text-xs font-bold text-[#18322a]/60">
                        {isDone
                          ? isNoor
                            ? `الدرس: ${reportToday?.noorLearned || "حاضر"}`
                            : `الحفظ: ${reportToday?.quranNew || "حاضر"}`
                          : "لم يتم حفظ تقرير اليوم"}
                      </span>

                      <Link
                        href={`/onsite/summer/teacher/reports/${student.id}`}
                        className={`rounded-xl px-4 py-2 text-xs font-black transition shadow-sm ${
                          isDone
                            ? "bg-white text-[#0f5a35] border border-[#0f5a35] hover:bg-emerald-50"
                            : "bg-[#0f5a35] text-white hover:bg-[#0a3f2a]"
                        }`}
                      >
                        {isDone ? "تعديل التقرير" : "تعبئة التقرير 📝"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
