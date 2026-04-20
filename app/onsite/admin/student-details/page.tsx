import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  formatIstanbulDateEnglish,
  getIstanbulDateKey,
  getIstanbulDayRange,
} from "@/lib/school-day";

export const dynamic = "force-dynamic";

type StudentDetailsPageProps = {
  searchParams?: Promise<{ q?: string }> | { q?: string };
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default async function OnsiteAdminStudentDetailsPage({
  searchParams,
}: StudentDetailsPageProps) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  const params = await searchParams;
  const query = normalizeSearch(params?.q || "");

  if (!adminId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولا.</p>
          <Link
            href="/onsite/admin/login"
            className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });

  if (!admin) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">لا تملك صلاحية عرض بيانات الطلاب التفصيلية.</p>
          <Link
            href="/onsite/admin/login"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الدخول بحساب إدارة الحضوري
          </Link>
        </div>
      </main>
    );
  }

  const { start, end } = getIstanbulDayRange();
  const [students, todayReports] = await Promise.all([
    prisma.student.findMany({
      where: {
        studyMode: "ONSITE",
        isActive: true,
      },
      orderBy: {
        fullName: "asc",
      },
      include: {
        teacher: {
          select: {
            fullName: true,
            email: true,
          },
        },
        circle: {
          select: {
            name: true,
            track: true,
          },
        },
        reports: {
          where: {
            status: "ABSENT",
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
        student: {
          studyMode: "ONSITE",
          isActive: true,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        studentId: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const todayReportByStudent = new Map<string, (typeof todayReports)[number]>();
  for (const report of todayReports) {
    if (!todayReportByStudent.has(report.studentId)) {
      todayReportByStudent.set(report.studentId, report);
    }
  }

  const filteredStudents = query
    ? students.filter((student) => {
        const haystack = [
          student.fullName,
          student.studentCode || "",
          student.parentWhatsapp || "",
          student.parentEmail || "",
          student.teacher?.fullName || "",
          student.circle?.name || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
    : students;

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                الإدارة الحضورية
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                بيانات الطلاب التفصيلية
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-white/72">
                ابحث باسم الطالب لعرض أهم بياناته الحالية، معلمه، حلقته، حالة اليوم، وعدد أيام الغياب.
              </p>
            </div>
            <Link
              href="/onsite/admin/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>

          <form className="relative mt-6 max-w-3xl rounded-[2rem] bg-white/95 p-3 shadow-lg ring-1 ring-white/30">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                name="q"
                defaultValue={params?.q || ""}
                placeholder="اكتب اسم الطالب أو رقمه أو اسم الحلقة..."
                className="min-h-12 flex-1 rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 text-sm font-bold text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:bg-white"
              />
              <button
                type="submit"
                className="min-h-12 rounded-2xl bg-[#c39a62] px-5 text-sm font-black text-white transition hover:bg-[#b0844f]"
              >
                بحث
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">عدد الطلاب</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">
              {students.length}
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">نتائج البحث</p>
            <p className="mt-2 text-4xl font-black text-[#1f6358]">
              {filteredStudents.length}
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">مصدر البيانات التفصيلية</p>
            <p className="mt-2 text-sm font-black leading-7 text-[#9b7039]">
              هذه الصفحة جاهزة لاستقبال ملف الإكسل التفصيلي وربطه لاحقا بكل طالب.
            </p>
          </div>
        </section>

        <section className="grid gap-4">
          {filteredStudents.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/55">
              لا توجد نتائج مطابقة للبحث.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const todayReport = todayReportByStudent.get(student.id);
              const absenceDateKeys = new Set(
                student.reports.map((report) => getIstanbulDateKey(report.createdAt))
              );
              const lastAbsenceDates = Array.from(absenceDateKeys)
                .slice(0, 5)
                .map((dateKey) => {
                  const [year, month, day] = dateKey.split("-");
                  return `${Number(month)}/${Number(day)}/${year}`;
                });

              return (
                <article
                  key={student.id}
                  className="rounded-[2.2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black text-[#1c2d31]">
                          {student.fullName}
                        </h2>
                        <span className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-black text-[#9b7039] ring-1 ring-[#d9c8ad]">
                          {student.studentCode || "بدون رقم"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            todayReport?.status === "ABSENT"
                              ? "bg-amber-100 text-amber-800"
                              : todayReport?.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {todayReport?.status === "ABSENT"
                            ? "غائب اليوم"
                            : todayReport?.status === "PRESENT"
                              ? "حاضر اليوم"
                              : "لا يوجد تسجيل اليوم"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm leading-7 text-[#1c2d31]/70 md:grid-cols-2">
                        <p>الحلقة: {student.circle?.name || "غير محددة"}</p>
                        <p>المعلم: {student.teacher?.fullName || "غير محدد"}</p>
                        <p>واتساب ولي الأمر: {student.parentWhatsapp || "-"}</p>
                        <p>إيميل ولي الأمر: {student.parentEmail || "-"}</p>
                      </div>
                    </div>

                    <div className="min-w-56 rounded-[1.5rem] bg-[#fffaf2] p-4 ring-1 ring-[#d9c8ad]">
                      <p className="text-sm font-bold text-[#1c2d31]/55">
                        عدد أيام الغياب
                      </p>
                      <p className="mt-2 text-4xl font-black text-[#c39a62]">
                        {absenceDateKeys.size}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                      <p className="text-sm font-black text-[#1c2d31]">
                        آخر أيام الغياب
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lastAbsenceDates.length === 0 ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                            لا يوجد غياب مسجل
                          </span>
                        ) : (
                          lastAbsenceDates.map((date) => (
                            <span
                              key={date}
                              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200"
                            >
                              {date}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <Link
                      href="/onsite/admin/students"
                      className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
                    >
                      تعديل الحلقة وولي الأمر
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
