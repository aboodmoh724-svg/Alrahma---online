import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import { cookies } from "next/headers";
import LogoutButton from "@/components/auth/LogoutButton";
import ParentReportCheckbox from "@/components/reports/ParentReportCheckbox";
import PlatformWhatsAppSupport from "@/components/support/PlatformWhatsAppSupport";
import InstantEntryRequestButtons from "@/components/teacher/InstantEntryRequestButtons";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl } from "@/lib/supabase-storage";

type TodayReport = {
  id: string;
  lessonName: string;
  pageFrom: number | null;
  pageTo: number | null;
  pagesCount: number | null;
  status: "PRESENT" | "ABSENT";
  sentToParent: boolean;
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

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function trackLabel(track: string | null) {
  if (track === "HIJAA") return "مسار الهجاء";
  if (track === "RUBAI") return "المسار الرباعي";
  if (track === "FARDI") return "المسار الفردي";
  if (track === "TILAWA") return "مسار التلاوة";
  return "لم يحدد";
}

export default async function RemoteTeacherDashboardPage({
  searchParams,
}: TeacherDashboardProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const params = await searchParams;
  const selectedCircleId = params?.circleId || "";
  const { start, end } = getTodayRange();

  if (!teacherId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولا.</p>
          <Link
            href="/remote/teacher/login"
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
      studyMode: "REMOTE",
      isActive: true,
    },
    include: {
      students: {
        where: {
          isActive: true,
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
            },
          },
        },
      },
      zoomLinks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      circles: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          students: {
            where: {
              isActive: true,
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
            href="/remote/teacher/login"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الدخول بحساب معلم
          </Link>
        </div>
      </main>
    );
  }

  const circles = teacher.circles as CircleWithStudents[];
  const fallbackStudents = teacher.students as StudentWithTodayReports[];
  const activeCircle =
    circles.find((circle) => circle.id === selectedCircleId) || circles[0] || null;
  const students = activeCircle ? activeCircle.students : fallbackStudents;
  const studentsCount = students.length;
  const completedTodayCount = students.filter(
    (student) => student.reports.length > 0
  ).length;
  const latestZoomLink =
    activeCircle?.zoomUrl || teacher.zoomLinks[0]?.url || null;
  const storedTrackResources = await prisma.trackResource.findMany({
    where: {
      teacherId: teacher.id,
    },
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
    resources.filter((resource): resource is typeof resource & { fileUrl: string } =>
      Boolean(resource.fileUrl)
    )
  );
  const [unreadNotificationsCount, recentNotifications, openRequestsCount] =
    await Promise.all([
      prisma.userNotification.count({
        where: {
          userId: teacher.id,
          isRead: false,
        },
      }),
      prisma.userNotification.findMany({
        where: {
          userId: teacher.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 4,
      }),
      prisma.teacherRequest.count({
        where: {
          teacherId: teacher.id,
          status: {
            in: ["NEW", "IN_REVIEW"],
          },
        },
      }),
    ]);
  const addReportHref = activeCircle
    ? `/remote/teacher/reports/new?circleId=${activeCircle.id}`
    : "/remote/teacher/reports/new";

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[2rem] bg-[#0a3f2a] p-5 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#f2d18a]">لوحة المعلم</p>
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4] disabled:opacity-60" />
            </div>
            <h2 className="mt-2 text-2xl font-black">{teacher.fullName}</h2>
            <p className="mt-2 text-sm leading-7 text-white/70">
              اختر الحلقة التي تريد العمل عليها ثم أضف تقارير طلابها.
            </p>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d8bf83]">
            <h3 className="mb-3 text-sm font-black text-[#1c2d31]">عرض حلقاتي</h3>
            <div className="space-y-2">
              {circles.length === 0 ? (
                <div className="rounded-2xl bg-[#f6eee7] p-3 text-sm text-[#1c2d31]/60">
                  لم يتم تعيين حلقات لك حتى الآن.
                </div>
              ) : (
                circles.map((circle) => {
                  const isActive = activeCircle?.id === circle.id;

                  return (
                    <Link
                      key={circle.id}
                      href={`/remote/teacher/dashboard?circleId=${circle.id}`}
                      className={`block rounded-2xl p-3 text-sm transition ${
                        isActive
                          ? "bg-[#0f5a35] text-white"
                          : "bg-[#fffaf4] text-[#1c2d31] hover:bg-white"
                      }`}
                    >
                      <span className="block font-black">{circle.name}</span>
                      <span className={isActive ? "text-white/70" : "text-[#1c2d31]/55"}>
                        {trackLabel(circle.track)} - {circle.students.length} طالب
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d8bf83]">
            <h3 className="mb-3 text-sm font-black text-[#1c2d31]">القائمة</h3>
            <div className="space-y-2 text-sm font-bold">
              <a href="#teacher-data" className="block rounded-2xl bg-[#fffaf4] px-4 py-3 text-[#1c2d31] hover:bg-white">
                بيانات المعلم
              </a>
              <a href="#students-details" className="block rounded-2xl bg-[#fffaf4] px-4 py-3 text-[#1c2d31] hover:bg-white">
                بيانات الطلاب التفصيلية
              </a>
              <a href="#teacher-files" className="block rounded-2xl bg-[#fffaf4] px-4 py-3 text-[#1c2d31] hover:bg-white">
                ملفاتي
              </a>
              <Link
                href="/remote/teacher/requests"
                className="flex items-center justify-between rounded-2xl bg-[#fffaf4] px-4 py-3 text-[#1c2d31] hover:bg-white"
              >
                <span>طلبات المعلم والإشعارات</span>
                {unreadNotificationsCount > 0 ? (
                  <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">
                    {unreadNotificationsCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/remote/teacher/messages"
                className="flex items-center justify-between rounded-2xl bg-[#0a3f2a] px-4 py-3 text-white hover:bg-[#0f5a35]"
              >
                <span>مراسلات أولياء الأمور</span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-black">جديد</span>
              </Link>
            </div>
          </section>

          <PlatformWhatsAppSupport compact />
        </aside>

        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
            <BrandHeroMedia src="/images/rahma-scene-mosque.jpg" opacity="opacity-50" />
            <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
            <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
            <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
              <div>
                <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
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
                  className="rounded-[1.5rem] bg-[#bd8f2d] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#a97d25]"
                >
                  إضافة تقرير
                </Link>
                {latestZoomLink ? (
                  <a
                    href={latestZoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[1.5rem] bg-white px-5 py-4 text-center text-sm font-black text-[#0a3f2a] transition hover:bg-[#f6eee7]"
                  >
                    فتح درس الزوم
                  </a>
                ) : (
                  <div className="rounded-[1.5rem] bg-white/10 px-5 py-4 text-center text-sm font-black text-white/70">
                    لا يوجد رابط زوم
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="teacher-data" className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-bold text-[#1c2d31]/55">عدد الطلاب</p>
              <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{studentsCount}</p>
            </div>

            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-bold text-[#1c2d31]/55">تقارير اليوم</p>
              <p className="mt-2 text-4xl font-black text-[#0f5a35]">
                {completedTodayCount} / {studentsCount}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-bold text-[#1c2d31]/55">اسم الحلقة</p>
              <p className="mt-2 text-xl font-black text-[#bd8f2d]">
                {activeCircle?.name || "لم تحدد بعد"}
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-bold text-[#1c2d31]/55">مسار الحلقة</p>
              <p className="mt-2 text-xl font-black text-[#0a3f2a]">
                {trackLabel(activeCircle?.track || null)}
              </p>
              <p className="mt-2 text-sm font-bold text-[#1c2d31]/55">
                النوع: عن بعد
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#1c2d31]">متابعة اليوم</h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/58">
                  التنبيهات والطلبات الطارئة في مكان واحد دون تشتيت لوحة الطلاب.
                </p>
              </div>
              <Link
                href="/remote/teacher/requests"
                className="inline-flex items-center justify-center rounded-2xl bg-[#0a3f2a] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0f5a35]"
              >
                الطلبات المفتوحة: {openRequestsCount}
              </Link>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
              <details className="group rounded-[1.4rem] border border-[#e7d7b4] bg-[#fffaf4] p-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-[#1c2d31]">تنبيهات المعلم</h3>
                    <p className="mt-1 text-sm text-[#1c2d31]/55">
                      آخر المستجدات والردود المختصرة.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#0a3f2a] px-4 py-2 text-sm font-black text-white">
                    {unreadNotificationsCount > 0
                      ? `${unreadNotificationsCount} جديد`
                      : "فتح"}
                  </span>
                </summary>

                <div className="mt-4 max-h-72 space-y-3 overflow-auto pl-1">
                  {recentNotifications.length === 0 ? (
                    <div className="rounded-2xl bg-white p-4 text-sm text-[#1c2d31]/60">
                      لا توجد إشعارات حتى الآن.
                    </div>
                  ) : (
                    recentNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={`/remote/teacher/requests?notificationId=${notification.id}`}
                        className={`block rounded-2xl p-4 ring-1 transition hover:ring-[#0f5a35] ${
                          notification.isRead
                            ? "bg-white ring-[#e7d7b4]"
                            : "bg-[#fff3df] ring-[#bd8f2d]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-black text-[#0a3f2a]">{notification.title}</p>
                          <span className="text-xs font-bold text-[#1c2d31]/55">
                            {new Date(notification.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/68">
                          {notification.body}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </details>

              <InstantEntryRequestButtons
                circleName={activeCircle?.name || null}
                circleUrl={latestZoomLink}
              />
            </div>
          </section>

          <section id="students-details" className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1c2d31]">طلاب الحلقة</h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/58">
                  تظهر هنا تقارير اليوم للطلاب داخل الحلقة المختارة فقط.
                </p>
              </div>
              <span className="rounded-full bg-[#0f5a35]/10 px-4 py-2 text-sm font-black text-[#0f5a35]">
                {studentsCount} طالب
              </span>
            </div>

            {students.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[#d8bf83] p-8 text-center text-sm text-[#1c2d31]/55">
                لا يوجد طلاب في هذه الحلقة حتى الآن
              </div>
            ) : (
              <div className="grid gap-3">
                {students.map((student) => {
                  const todayReport = student.reports[0];
                  const isAbsent = todayReport?.status === "ABSENT";
                  const studentReportHref = activeCircle
                    ? `/remote/teacher/reports/new?circleId=${activeCircle.id}&studentId=${student.id}`
                    : `/remote/teacher/reports/new?studentId=${student.id}`;

                  return (
                    <div
                      key={student.id}
                      className="grid gap-4 rounded-[1.8rem] border border-[#d8bf83]/75 bg-[#fffaf4] p-4 md:grid-cols-[1fr_auto] md:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-[#1c2d31]">{student.fullName}</p>
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
                          <ParentReportCheckbox
                            reportId={todayReport.id}
                            initialChecked={todayReport.sentToParent}
                            parentWhatsapp={student.parentWhatsapp}
                          />
                        ) : null}

                        <Link
                          href={studentReportHref}
                          className="rounded-xl bg-[#0f5a35] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#0a3f2a]"
                        >
                          {todayReport ? "إضافة تقرير آخر" : "إضافة تقرير"}
                        </Link>
                        <Link
                          href={`/remote/teacher/students/${student.id}/history`}
                          className="rounded-xl border border-[#d8bf83] px-4 py-3 text-center text-sm font-black text-[#1c2d31] transition hover:bg-white"
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

          <section id="teacher-files" className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <h2 className="text-xl font-black text-[#1c2d31]">ملفات المعلم</h2>
              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/58">
                تظهر هنا فقط الملفات التي رفعتها الإدارة لهذا المعلم.
              </p>
              <div className="mt-4 space-y-2">
                {trackResources.length === 0 ? (
                  <p className="rounded-2xl bg-[#fffaf4] p-4 text-sm text-[#1c2d31]/60">
                    لا توجد ملفات مخصصة لك حتى الآن.
                  </p>
                ) : (
                  trackResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="rounded-2xl bg-[#fffaf4] p-4"
                    >
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm font-black text-[#1c2d31] transition hover:text-[#0f5a35]"
                      >
                        {resource.title}
                      </a>
                      {resource.description ? (
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                          {resource.description}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
          </section>
        </div>
      </div>
    </main>
  );
}
