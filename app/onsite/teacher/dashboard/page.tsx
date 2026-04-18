import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/auth/LogoutButton";
import QuickAttendanceButtons from "@/components/reports/QuickAttendanceButtons";
import { prisma } from "@/lib/prisma";
import { getIstanbulDayRange } from "@/lib/school-day";
import { createSignedStorageUrl } from "@/lib/supabase-storage";

type TodayReport = {
  id: string;
  lessonName: string;
  pageFrom: number | null;
  pageTo: number | null;
  pagesCount: number | null;
  status: "PRESENT" | "ABSENT";
  sentToParent: boolean;
  parentSentAt?: Date | null;
  parentSentError?: string | null;
};

type StudentWithTodayReports = {
  id: string;
  fullName: string;
  parentWhatsapp: string | null;
  parentEmail: string | null;
  reports: TodayReport[];
};

type CircleWithStudents = {
  id: string;
  name: string;
  track: string | null;
  studyMode: "REMOTE" | "ONSITE";
  zoomUrl: string | null;
  students: StudentWithTodayReports[];
};

type TeacherDashboardProps = {
  searchParams?: Promise<{
    circleId?: string;
  }>;
};

function trackLabel(track: string | null) {
  if (track === "HIJAA") return "مسار الهجاء";
  if (track === "RUBAI") return "المسار الرباعي";
  if (track === "FARDI") return "المسار الفردي";
  if (track === "TILAWA") return "مسار التلاوة";
  return "لم يحدد";
}

export default async function OnsiteTeacherDashboardPage({
  searchParams,
}: TeacherDashboardProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const params = await searchParams;
  const selectedCircleId = params?.circleId || "";
  const { start, end } = getIstanbulDayRange();

  if (!teacherId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولا.</p>
          <Link
            href="/onsite/teacher/login"
            className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      zoomLinks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          url: true,
        },
      },
      circles: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          students: {
            where: {
              isActive: true,
              studyMode: "ONSITE",
            },
            orderBy: {
              fullName: "asc",
            },
            include: {
              reports: {
                where: {
                  createdAt: {
                    gte: start,
                    lt: end,
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
                select: {
                  id: true,
                  lessonName: true,
                  pageFrom: true,
                  pageTo: true,
                  pagesCount: true,
                  status: true,
                  sentToParent: true,
                  parentSentAt: true,
                  parentSentError: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">لا يمكن عرض لوحة المعلم لهذا الحساب.</p>
          <Link
            href="/onsite/teacher/login"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الدخول بحساب معلم
          </Link>
        </div>
      </main>
    );
  }

  const circles = teacher.circles.filter((circle) => circle.studyMode === "ONSITE") as CircleWithStudents[];
  const activeCircle =
    circles.find((circle) => circle.id === selectedCircleId) || circles[0] || null;
  const fallbackStudents = activeCircle
    ? []
    : ((await prisma.student.findMany({
        where: {
          teacherId: teacher.id,
          isActive: true,
          studyMode: "ONSITE",
        },
        orderBy: {
          fullName: "asc",
        },
        include: {
          reports: {
            where: {
              createdAt: {
                gte: start,
                lt: end,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              lessonName: true,
              pageFrom: true,
              pageTo: true,
              pagesCount: true,
              status: true,
              sentToParent: true,
              parentSentAt: true,
              parentSentError: true,
            },
          },
        },
      })) as StudentWithTodayReports[]);
  const students = activeCircle ? activeCircle.students : fallbackStudents;
  const studentsCount = students.length;
  const completedTodayCount = students.filter(
    (student) => student.reports.length > 0
  ).length;
  const latestCircleLink =
    activeCircle?.zoomUrl || teacher.zoomLinks[0]?.url || null;
  const storedTrackResources = await prisma.trackResource.findMany({
    where: activeCircle?.track
      ? {
          OR: [{ track: activeCircle.track }, { track: null }],
        }
      : { track: null },
    orderBy: {
      createdAt: "desc",
    },
  });
  const trackResources = await Promise.all(
    storedTrackResources.map(async (resource) => ({
      ...resource,
      fileUrl: await createSignedStorageUrl(resource.fileUrl),
    }))
  ).then((resources) =>
    resources.filter(
      (resource): resource is typeof resource & { fileUrl: string } =>
        Boolean(resource.fileUrl)
    )
  );
  const addReportHref = activeCircle
    ? `/onsite/teacher/reports/new?circleId=${activeCircle.id}`
    : "/onsite/teacher/reports/new";

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[2rem] bg-[#173d42] p-5 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#f1d39d]">لوحة المعلم</p>
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2] disabled:opacity-60" />
            </div>
            <h2 className="mt-2 text-2xl font-black">{teacher.fullName}</h2>
            <p className="mt-2 text-sm leading-7 text-white/70">
              اختر الحلقة التي تريد العمل عليها ثم أضف تقارير طلابها.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d9c8ad]">
            <h3 className="mb-3 text-sm font-black text-[#1c2d31]">عرض حلقاتي</h3>
            <div className="space-y-2">
              {circles.length === 0 ? (
                <div className="rounded-2xl bg-[#f7f0e6] p-3 text-sm text-[#1c2d31]/60">
                  لم يتم تعيين حلقات لك حتى الآن.
                </div>
              ) : (
                circles.map((circle) => {
                  const isActive = activeCircle?.id === circle.id;

                  return (
                    <Link
                      key={circle.id}
                      href={`/onsite/teacher/dashboard?circleId=${circle.id}`}
                      className={`block rounded-2xl p-3 text-sm transition ${
                        isActive
                          ? "bg-[#1f6358] text-white"
                          : "bg-[#fffaf2] text-[#1c2d31] hover:bg-white"
                      }`}
                    >
                      <span className="block font-black">{circle.name}</span>
                      <span
                        className={
                          isActive ? "text-white/70" : "text-[#1c2d31]/55"
                        }
                      >
                        {trackLabel(circle.track)} - {circle.students.length} طالب
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d9c8ad]">
            <h3 className="mb-3 text-sm font-black text-[#1c2d31]">القائمة</h3>
            <div className="space-y-2 text-sm font-bold">
              <a
                href="#teacher-data"
                className="block rounded-2xl bg-[#fffaf2] px-4 py-3 text-[#1c2d31] hover:bg-white"
              >
                بيانات المعلم
              </a>
              <a
                href="#students-details"
                className="block rounded-2xl bg-[#fffaf2] px-4 py-3 text-[#1c2d31] hover:bg-white"
              >
                بيانات الطلاب التفصيلية
              </a>
              <a
                href="#important-files"
                className="block rounded-2xl bg-[#fffaf2] px-4 py-3 text-[#1c2d31] hover:bg-white"
              >
                ملفات مهمة
              </a>
              <a
                href="#track-files"
                className="block rounded-2xl bg-[#fffaf2] px-4 py-3 text-[#1c2d31] hover:bg-white"
              >
                ملفات المسارات
              </a>
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
            <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
            <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
            <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
              <div>
                <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                  أهلا وسهلا بك الأستاذ {teacher.fullName}
                </p>
                <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                  وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ
                  <br />
                  وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-white/72">
                  {activeCircle
                    ? `أنت تعمل الآن داخل ${activeCircle.name}.`
                    : "هذه لوحة عامة لأن المعلم لم تسند له حلقة محددة بعد."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={addReportHref}
                  className="rounded-[1.5rem] bg-[#c39a62] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#b0844f]"
                >
                  إضافة تقرير
                </Link>
                {latestCircleLink ? (
                  <a
                    href={latestCircleLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1.5rem] bg-white px-5 py-4 text-center text-sm font-black text-[#173d42] transition hover:bg-[#f7f0e6]"
                  >
                    فتح رابط الحلقة
                  </a>
                ) : (
                  <div className="rounded-[1.5rem] bg-white/10 px-5 py-4 text-center text-sm font-black text-white/70">
                    لا يوجد رابط للحلقة
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="teacher-data" className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">عدد الطلاب</p>
              <p className="mt-2 text-4xl font-black text-[#173d42]">
                {studentsCount}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">تقارير اليوم</p>
              <p className="mt-2 text-4xl font-black text-[#1f6358]">
                {completedTodayCount} / {studentsCount}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">اسم الحلقة</p>
              <p className="mt-2 text-xl font-black text-[#c39a62]">
                {activeCircle?.name || "لم تحدد بعد"}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">مسار الحلقة</p>
              <p className="mt-2 text-xl font-black text-[#173d42]">
                {trackLabel(activeCircle?.track || null)}
              </p>
              <p className="mt-2 text-sm font-bold text-[#1c2d31]/55">
                النوع: حضوري
              </p>
            </div>
          </section>

          <section
            id="students-details"
            className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
          >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1c2d31]">
                  طلاب الحلقة
                </h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/58">
                  تظهر هنا تقارير اليوم للطلاب داخل الحلقة المختارة فقط.
                </p>
              </div>
              <span className="rounded-full bg-[#1f6358]/10 px-4 py-2 text-sm font-black text-[#1f6358]">
                {studentsCount} طالب
              </span>
            </div>

            {students.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/55">
                لا يوجد طلاب في هذه الحلقة حتى الآن
              </div>
            ) : (
              <div className="grid gap-3">
                {students.map((student) => {
                  const todayReport = student.reports[0];
                  const isAbsent = todayReport?.status === "ABSENT";
                  const studentReportHref = activeCircle
                    ? `/onsite/teacher/reports/new?circleId=${activeCircle.id}&studentId=${student.id}`
                    : `/onsite/teacher/reports/new?studentId=${student.id}`;

                  return (
                    <div
                      key={student.id}
                      className="grid gap-4 rounded-[1.8rem] border border-[#d9c8ad]/75 bg-[#fffaf2] p-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-[#1c2d31]">
                            {student.fullName}
                          </p>
                          {todayReport ? (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                isAbsent
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isAbsent ? "غائب اليوم" : "تم حفظ تقرير اليوم"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                              لم يبدأ بعد
                            </span>
                          )}
                        </div>

                        {todayReport ? (
                          <div className="mt-2 space-y-1 text-sm leading-7 text-[#1c2d31]/60">
                            <p>{todayReport.lessonName}</p>
                            {!isAbsent ? (
                              <p>
                                الصفحات:{" "}
                                {todayReport.pageFrom && todayReport.pageTo
                                  ? `من ${todayReport.pageFrom} إلى ${todayReport.pageTo}`
                                  : "غير محددة"}
                                {todayReport.pagesCount
                                  ? ` - عدد الصفحات: ${todayReport.pagesCount}`
                                  : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-[#1c2d31]/55">
                            أضف التقرير أو احفظ الغياب عند بداية المتابعة.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 md:min-w-48">
                        {todayReport ? (
                          todayReport.sentToParent ? (
                            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                              تم إرسال واتساب{todayReport.parentSentAt ? ` - ${new Date(todayReport.parentSentAt).toLocaleTimeString("ar-EG")}` : ""}
                            </div>
                          ) : student.parentWhatsapp ? (
                            <div className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-800 ring-1 ring-amber-200">
                              لم يتم الإرسال بعد{todayReport.parentSentError ? ` - ${todayReport.parentSentError}` : ""}
                            </div>
                          ) : (
                            <div className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-black text-red-700 ring-1 ring-red-200">
                              لا يوجد رقم واتساب لولي الأمر
                            </div>
                          )
                        ) : null}

                        {!todayReport ? (
                          <QuickAttendanceButtons studentId={student.id} />
                        ) : null}

                        <Link
                          href={studentReportHref}
                          className="rounded-xl bg-[#1f6358] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#173d42]"
                        >
                          {todayReport ? "إضافة تقرير آخر" : "إضافة تقرير"}
                        </Link>
                        <Link
                          href={`/onsite/teacher/students/${student.id}/history`}
                          className="rounded-xl border border-[#d9c8ad] px-4 py-3 text-center text-sm font-black text-[#1c2d31] transition hover:bg-white"
                        >
                          سجل الطالب
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section id="important-files" className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <h2 className="text-xl font-black text-[#1c2d31]">ملفات مهمة</h2>
              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/58">
                سنضيف هنا ملفات آلية سير الحلقة والملفات التشغيلية التي يحتاجها المعلم.
              </p>
            </div>
            <div
              id="track-files"
              className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
            >
              <h2 className="text-xl font-black text-[#1c2d31]">ملفات المسارات</h2>
              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/58">
                المسار الحالي: {trackLabel(activeCircle?.track || null)}.
              </p>
              <div className="mt-4 space-y-2">
                {trackResources.length === 0 ? (
                  <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">
                    لا توجد ملفات لهذا المسار حتى الآن.
                  </p>
                ) : (
                  trackResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31] transition hover:bg-white"
                    >
                      {resource.title}
                    </a>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
