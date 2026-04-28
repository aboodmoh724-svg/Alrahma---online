import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

type StudentReport = {
  id: string;
  lessonName: string;
  lessonMemorized: boolean | null;
  lastFiveMemorized: boolean | null;
  review: string | null;
  pageFrom: number | null;
  pageTo: number | null;
  pagesCount: number | null;
  reviewMemorized: boolean | null;
  homework: string;
  nextHomework: string | null;
  note: string | null;
  status: "PRESENT" | "ABSENT";
  createdAt: Date;
  sentToParent: boolean;
};

function memorizedLabel(value: boolean | null) {
  if (value === true) return "حافظ";
  if (value === false) return "غير حافظ";
  return "غير مسجل";
}

function compactText(value: string | null | undefined, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function reportPoints(report: StudentReport) {
  if (report.status === "ABSENT") {
    return 0;
  }

  const memorizationPoints = [
    report.lessonMemorized,
    report.lastFiveMemorized,
    report.reviewMemorized,
  ].filter((value) => value === true).length;

  return 1 + memorizationPoints;
}

function reportDayName(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(date);
}

function reportDateLabel(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function timelineTone(report: StudentReport) {
  if (report.status === "ABSENT") {
    return "bg-rose-100 text-rose-700 ring-rose-200";
  }

  const points = reportPoints(report);

  if (points >= 4) {
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  }

  if (points >= 2) {
    return "bg-amber-100 text-amber-700 ring-amber-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function monthTone(pointsAverage: number) {
  if (pointsAverage >= 3.2) return "text-emerald-700 bg-emerald-100 ring-emerald-200";
  if (pointsAverage >= 2) return "text-amber-700 bg-amber-100 ring-amber-200";
  return "text-slate-700 bg-slate-100 ring-slate-200";
}

export default async function StudentHistoryPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const { studentId } = await params;

  if (!teacherId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولًا.</p>
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
    select: {
      id: true,
    },
  });

  if (!teacher) {
    notFound();
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      teacherId,
      studyMode: "REMOTE",
      isActive: true,
    },
    include: {
      reports: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const reports = student.reports as StudentReport[];
  const latestReport = reports[0] || null;
  const presentCount = reports.filter((report) => report.status === "PRESENT").length;
  const absentCount = reports.length - presentCount;
  const latestHomework =
    reports.find((report) => compactText(report.nextHomework, "") !== "")?.nextHomework || null;
  const latestReview =
    reports.find((report) => compactText(report.review, "") !== "")?.review || null;
  const last12Reports = reports.slice(0, 12);
  const averagePoints =
    reports.length > 0
      ? Math.round(
          (reports.reduce((sum, report) => sum + reportPoints(report), 0) / reports.length) * 10
        ) / 10
      : 0;

  const monthlyGroups = reports.reduce<
    Array<{
      key: string;
      label: string;
      reports: StudentReport[];
      presentCount: number;
      absentCount: number;
      averagePoints: number;
    }>
  >((groups, report) => {
    const key = monthKey(report.createdAt);
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.reports.push(report);
      return groups;
    }

    groups.push({
      key,
      label: monthLabel(report.createdAt),
      reports: [report],
      presentCount: 0,
      absentCount: 0,
      averagePoints: 0,
    });

    return groups;
  }, []);

  monthlyGroups.forEach((group) => {
    group.presentCount = group.reports.filter((report) => report.status === "PRESENT").length;
    group.absentCount = group.reports.length - group.presentCount;
    group.averagePoints =
      Math.round(
        (group.reports.reduce((sum, report) => sum + reportPoints(report), 0) /
          group.reports.length) *
          10
      ) / 10;
  });

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              سجل الطالب: {student.fullName}
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              شاشة سريعة للمعلم توضح الحضور، والسير، والواجب، وآخر وضع للطالب خلال ثوانٍ.
            </p>
          </div>

          <Link
            href="/remote/teacher/dashboard"
            className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
          >
            الرجوع للوحة المعلم
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/55">
            لا توجد تقارير سابقة لهذا الطالب في قسم الأونلاين حتى الآن.
          </div>
        ) : (
          <>
            <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] bg-[#173d42] p-5 text-white shadow-lg">
                <p className="text-sm font-black text-[#f1d39d]">نظرة خاطفة للمعلم البديل</p>
                <h2 className="mt-2 text-2xl font-black">أين وصل الطالب الآن؟</h2>

                {latestReport ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-white/10 p-4">
                      <p className="text-xs font-black text-[#f1d39d]">آخر حصة</p>
                      <p className="mt-2 text-sm font-black">
                        {reportDateLabel(latestReport.createdAt)} - {reportDayName(latestReport.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        {latestReport.status === "PRESENT" ? "حاضر" : "غائب"}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white/10 p-4">
                      <p className="text-xs font-black text-[#f1d39d]">نقاط آخر حصة</p>
                      <p className="mt-2 text-3xl font-black">{reportPoints(latestReport)}/4</p>
                      <p className="mt-1 text-xs text-white/72">
                        1 للحضور + 3 بنود للإتقان
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white/10 p-4 md:col-span-2">
                      <p className="text-xs font-black text-[#f1d39d]">آخر درس مسجل</p>
                      <p className="mt-2 text-sm leading-7 text-white">
                        {compactText(latestReport.lessonName)}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white/10 p-4 md:col-span-2">
                      <p className="text-xs font-black text-[#f1d39d]">الواجب الحالي للطالب</p>
                      <p className="mt-2 text-sm leading-7 text-white">
                        {compactText(latestHomework || latestReport.nextHomework || latestReport.homework)}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] bg-white/10 p-4 md:col-span-2">
                      <p className="text-xs font-black text-[#f1d39d]">آخر مراجعة معروفة</p>
                      <p className="mt-2 text-sm leading-7 text-white">
                        {compactText(latestReview || latestReport.review)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#9b7039]">ملخص سريع</p>
                    <h2 className="mt-1 text-xl font-black text-[#1c2d31]">مؤشرات عامة</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${monthTone(averagePoints)}`}
                  >
                    متوسط النقاط: {averagePoints}/4
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                    <p className="text-xs font-black text-[#9b7039]">إجمالي الحصص</p>
                    <p className="mt-2 text-2xl font-black text-[#1c2d31]">{reports.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#eff8f3] p-4 ring-1 ring-emerald-100">
                    <p className="text-xs font-black text-emerald-700">حضور</p>
                    <p className="mt-2 text-2xl font-black text-emerald-700">{presentCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fff1f2] p-4 ring-1 ring-rose-100">
                    <p className="text-xs font-black text-rose-700">غياب</p>
                    <p className="mt-2 text-2xl font-black text-rose-700">{absentCount}</p>
                  </div>
                  <div className="rounded-2xl bg-[#eef6fb] p-4 ring-1 ring-sky-100">
                    <p className="text-xs font-black text-sky-700">عدد الشهور المسجلة</p>
                    <p className="mt-2 text-2xl font-black text-sky-700">{monthlyGroups.length}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#1c2d31]">آخر 12 حصة</p>
                    <p className="text-xs text-[#1c2d31]/55">من اليمين للأحدث</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {last12Reports.map((report) => (
                      <div
                        key={report.id}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black ring-1 ${timelineTone(report)}`}
                        title={`${reportDateLabel(report.createdAt)} - ${report.lessonName}`}
                      >
                        {reportPoints(report)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-[#9b7039]">فهرس الشهور</p>
                  <h2 className="mt-1 text-xl font-black text-[#1c2d31]">انتقال سريع بين السجلات</h2>
                </div>
                <p className="text-xs leading-6 text-[#1c2d31]/55">
                  النقاط من 4: نقطة حضور + نقطة للدرس الجديد + نقطة لآخر خمس صفحات + نقطة للمراجعة
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {monthlyGroups.map((group) => (
                  <a
                    key={group.key}
                    href={`#month-${group.key}`}
                    className="rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#1c2d31] ring-1 ring-[#d9c8ad] transition hover:bg-white"
                  >
                    {group.label}
                  </a>
                ))}
              </div>
            </section>

            <div className="space-y-5">
              {monthlyGroups.map((group) => (
                <section
                  key={group.key}
                  id={`month-${group.key}`}
                  className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-[#9b7039]">سجل شهري</p>
                      <h2 className="mt-1 text-2xl font-black text-[#1c2d31]">{group.label}</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#eff8f3] px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                        حضور: {group.presentCount}
                      </span>
                      <span className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-100">
                        غياب: {group.absentCount}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${monthTone(group.averagePoints)}`}
                      >
                        متوسط الشهر: {group.averagePoints}/4
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 hidden overflow-x-auto xl:block">
                    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-[1.5rem] text-right">
                      <thead>
                        <tr className="bg-[#f7f0e6] text-xs font-black text-[#8a6335]">
                          <th className="px-3 py-3">التاريخ</th>
                          <th className="px-3 py-3">اليوم</th>
                          <th className="px-3 py-3">الحالة</th>
                          <th className="px-3 py-3">النقاط</th>
                          <th className="px-3 py-3">الدرس</th>
                          <th className="px-3 py-3">المراجعة</th>
                          <th className="px-3 py-3">واجب الحصة</th>
                          <th className="px-3 py-3">الواجب التالي</th>
                          <th className="px-3 py-3">نتيجة الحفظ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.reports.map((report) => (
                          <tr key={report.id} className="bg-white text-sm text-[#1c2d31] even:bg-[#fffaf4]">
                            <td className="border-t border-[#efe2cd] px-3 py-3 font-black">
                              {reportDateLabel(report.createdAt)}
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3">
                              {reportDayName(report.createdAt)}
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                                  report.status === "PRESENT"
                                    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                    : "bg-rose-100 text-rose-700 ring-rose-200"
                                }`}
                              >
                                {report.status === "PRESENT" ? "حاضر" : "غائب"}
                              </span>
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${timelineTone(report)}`}
                              >
                                {reportPoints(report)}/4
                              </span>
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3 leading-7">
                              {compactText(report.lessonName)}
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3 leading-7">
                              {compactText(report.review)}
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3 leading-7">
                              {compactText(report.homework)}
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3 leading-7">
                              {compactText(report.nextHomework)}
                            </td>
                            <td className="border-t border-[#efe2cd] px-3 py-3 text-xs leading-6">
                              <div>الدرس: {memorizedLabel(report.lessonMemorized)}</div>
                              <div>آخر 5: {memorizedLabel(report.lastFiveMemorized)}</div>
                              <div>المراجعة: {memorizedLabel(report.reviewMemorized)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 space-y-3 xl:hidden">
                    {group.reports.map((report) => (
                      <article key={report.id} className="rounded-[1.5rem] bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#1c2d31]">
                              {reportDateLabel(report.createdAt)} - {reportDayName(report.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-[#1c2d31]/55">
                              {compactText(report.lessonName)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                                report.status === "PRESENT"
                                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                  : "bg-rose-100 text-rose-700 ring-rose-200"
                              }`}
                            >
                              {report.status === "PRESENT" ? "حاضر" : "غائب"}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${timelineTone(report)}`}
                            >
                              {reportPoints(report)}/4
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 text-sm leading-7 text-[#1c2d31]/75">
                          <p>
                            <span className="font-black text-[#1c2d31]">المراجعة: </span>
                            {compactText(report.review)}
                          </p>
                          <p>
                            <span className="font-black text-[#1c2d31]">واجب الحصة: </span>
                            {compactText(report.homework)}
                          </p>
                          <p>
                            <span className="font-black text-[#1c2d31]">الواجب التالي: </span>
                            {compactText(report.nextHomework)}
                          </p>
                          <p>
                            <span className="font-black text-[#1c2d31]">الدرس: </span>
                            {memorizedLabel(report.lessonMemorized)}
                            {" - "}
                            <span className="font-black text-[#1c2d31]">آخر 5: </span>
                            {memorizedLabel(report.lastFiveMemorized)}
                            {" - "}
                            <span className="font-black text-[#1c2d31]">المراجعة: </span>
                            {memorizedLabel(report.reviewMemorized)}
                          </p>
                          {report.note ? (
                            <p>
                              <span className="font-black text-[#1c2d31]">ملاحظة: </span>
                              {report.note}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
