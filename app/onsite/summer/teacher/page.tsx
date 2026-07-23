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
  const completionPercentage =
    students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f7f2ea] text-[#162e24] dir-rtl font-sans pb-12" dir="rtl">
      {/* 🕌 1. Full-Width Dark Emerald Islamic Calligraphy Header for Teacher */}
      <header className="relative bg-[#0b4231] text-white shadow-xl overflow-hidden border-b-4 border-[#bd8f2d]">
        {/* Geometric Islamic Mandala Accent SVG */}
        <div className="absolute top-0 right-0 h-full w-[420px] pointer-events-none opacity-25 bg-[radial-gradient(#bd8f2d_1.5px,transparent_1.5px)] [background-size:14px_14px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 pb-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-1.5 shadow-md ring-2 ring-[#bd8f2d]">
              <Image
                src="/images/summer_quran_logo_v2.jpg"
                alt="شعار الدورة الصيفية"
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl object-contain"
              />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bd8f2d]/25 border border-[#bd8f2d]/40 px-3 py-0.5 text-xs font-bold text-emerald-100">
                🌟 بوابة المعلم الصيفي
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fbf6ef] font-serif leading-tight mt-1">
                الدورة الصيفية الأولى
              </h1>
              <p className="text-xs font-semibold text-emerald-200">
                لوحة متابعة رصد التقارير اليومية | تحفيظ الرحمة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#135440] px-4 py-2 border border-[#bd8f2d]/40 shrink-0">
              <div className="h-8 w-8 rounded-full bg-[#bd8f2d] flex items-center justify-center font-bold text-xs text-[#0b4231]">
                أ
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-white font-serif">
                  أستاذ: {teacher.fullName}
                </span>
                <span className="block text-[10px] text-emerald-200">
                  تاريخ اليوم: {todayStr}
                </span>
              </div>
            </div>

            <LogoutButton redirectUrl="/onsite/summer/teacher/login" />
          </div>
        </div>
      </header>

      {/* 🏛️ 2. Main Workspace Content Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Top Progress & Completion Summary Banner */}
        <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0b4231] font-serif">
              نسبة إنجاز تقارير الحلقة اليوم
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              تم رصد <b className="text-[#0b4231] font-serif text-sm">{filledCount}</b> من إجمالي{" "}
              <b className="text-[#bd8f2d] font-serif text-sm">{students.length}</b> طالباً بحلقتك
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-600">التقدم الفعلي</span>
              <span className="text-[#0b4231] font-serif text-base">{completionPercentage}%</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-gray-200 overflow-hidden border border-gray-300/40">
              <div
                className="h-full rounded-full bg-[#0b4231] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 📋 Students List Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#0b4231] font-serif">
              قائمة طلابك في الحلقة ({students.length} طالباً)
            </h3>
          </div>

          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8bf83] bg-[#fffdf9] p-10 text-center text-sm font-bold text-gray-500">
              لا يوجد طلاب مسجلين في حلقتك حتى الآن.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {students.map((student) => {
                const reportToday = student.summerReports[0] as SummerReportToday | undefined;
                const isDone = Boolean(reportToday);
                const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

                return (
                  <div
                    key={student.id}
                    className={`flex flex-col justify-between rounded-2xl border p-5 transition shadow-sm ${
                      isDone
                        ? "border-emerald-400/60 bg-emerald-50/40"
                        : "border-[#d8bf83]/60 bg-[#fffdf9]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {isNoor ? (
                            <span className="rounded-full bg-[#bd8f2d] px-3 py-0.5 text-xs font-black text-white font-serif shadow-2xs">
                              📘 طالب نور البيان
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#0b4231] px-3 py-0.5 text-xs font-black text-white font-serif shadow-2xs">
                              📖 طالب قرآن كريم
                            </span>
                          )}

                          {student.studentCode === "7500" && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                              تجريبي
                            </span>
                          )}
                        </div>

                        <h4 className="mt-2 text-xl font-bold text-[#162e24] font-serif">
                          {student.fullName}
                        </h4>

                        {student.circle?.name && (
                          <p className="text-xs font-bold text-[#bd8f2d] mt-0.5">
                            حلقة: {student.circle.name}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black font-serif ${
                          isDone
                            ? "bg-emerald-700 text-white shadow-2xs"
                            : "bg-amber-100 text-amber-900 border border-amber-300/60"
                        }`}
                      >
                        {isDone
                          ? reportToday?.status === "ABSENT"
                            ? "غائب ❌"
                            : "تم الرصد ✅"
                          : "بانتظار التعبئة ⏳"}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#d8bf83]/30 pt-3">
                      <span className="text-xs font-semibold text-gray-600">
                        {isDone
                          ? isNoor
                            ? `الدرس: ${reportToday?.noorLearned || "حاضر"}`
                            : `الحفظ: ${reportToday?.quranNew || "حاضر"}`
                          : "لم يتم حفظ تقرير اليوم"}
                      </span>

                      <Link
                        href={`/onsite/summer/teacher/reports/${student.id}`}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-2xs font-serif ${
                          isDone
                            ? "bg-white text-[#0b4231] border border-[#0b4231] hover:bg-emerald-50"
                            : "bg-[#0b4231] text-white hover:bg-[#072c21]"
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
      </main>
    </div>
  );
}
