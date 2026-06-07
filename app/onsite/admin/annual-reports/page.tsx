import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AnnualReportActions from "@/components/annual-reports/AnnualReportActions";
import AnnualReportReviewPanel from "@/components/annual-reports/AnnualReportReviewPanel";
import { AnnualReportsBulkSendButton } from "@/components/annual-reports/AnnualReportsBulkSendButton";
import AnnualReportsImportForm from "@/components/annual-reports/AnnualReportsImportForm";
import { publicStorageUrl } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

type PageProps = {
  searchParams?: Promise<{
    circleId?: string;
    review?: string;
    year?: string;
  }>;
};

function statusLabel(status: "REVIEW" | "APPROVED" | "SENT") {
  if (status === "SENT") return "تم الإرسال";
  if (status === "APPROVED") return "معتمد";
  return "مراجعة";
}

function statusTone(status: "REVIEW" | "APPROVED" | "SENT") {
  if (status === "SENT") return "bg-emerald-100 text-emerald-800";
  if (status === "APPROVED") return "bg-[#f2d18a]/35 text-[#8a661f]";
  return "bg-amber-50 text-amber-800";
}

async function getCurrentOnsiteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: {
      id: true,
    },
  });
}

export default async function OnsiteAnnualReportsPage({
  searchParams,
}: PageProps) {
  const admin = await getCurrentOnsiteAdmin();

  if (!admin) {
    redirect("/onsite/admin/login");
  }

  const params = await searchParams;
  const academicYear = params?.year || "2025-2026";
  const selectedCircleId = params?.circleId || "";
  const reviewIndex = Number.isFinite(Number(params?.review))
    ? Number(params?.review)
    : null;

  const [circles, unlinkedReports] = await Promise.all([
    prisma.circle.findMany({
      where: {
        studyMode: "ONSITE",
      },
      orderBy: {
        name: "asc",
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        students: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
        annualReports: {
          where: {
            academicYear,
          },
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                parentWhatsapp: true,
              },
            },
          },
          orderBy: {
            studentName: "asc",
          },
        },
      },
    }),
    prisma.annualReport.findMany({
      where: {
        academicYear,
        circleId: null,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            parentWhatsapp: true,
          },
        },
      },
      orderBy: {
        studentName: "asc",
      },
    }),
  ]);

  const allReports = [
    ...circles.flatMap((circle) => circle.annualReports),
    ...unlinkedReports,
  ];
  const selectedCircle =
    circles.find((circle) => circle.id === selectedCircleId) || null;
  const visibleReports = selectedCircle
    ? selectedCircle.annualReports
    : selectedCircleId === "unlinked"
      ? unlinkedReports
      : [];
  const reviewCount = allReports.filter(
    (report) => report.reviewStatus === "REVIEW"
  ).length;
  const approvedCount = allReports.filter(
    (report) => report.reviewStatus === "APPROVED"
  ).length;
  const sentCount = allReports.filter(
    (report) => report.reviewStatus === "SENT"
  ).length;
  const selectedBaseHref = `/onsite/admin/annual-reports?year=${academicYear}&circleId=${selectedCircleId}`;
  const reviewPanelReports = visibleReports.map((report) => {
    const imageUrl = publicStorageUrl(report.reportImagePath);
    const parentPhone = normalizeWhatsAppNumber(
      report.student?.parentWhatsapp || "",
      "90"
    );

    return {
      id: report.id,
      studentName: report.student?.fullName || report.studentName,
      teacherName: report.teacherName || "",
      finalRating: report.finalRating || "",
      memorizedDuringYear: report.memorizedDuringYear || "",
      learnedDuringYear: report.learnedDuringYear || "",
      studentStrengths: report.studentStrengths || "",
      behaviorNotes: report.behaviorNotes || "",
      studentNeeds: report.studentNeeds || "",
      parentMessage: report.parentMessage || "",
      imageUrl,
      reviewStatus: report.reviewStatus,
      hasParentPhone: Boolean(parentPhone),
      sendError: report.sendError,
    };
  });

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/onsite/admin/education-supervision"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4]"
            >
              الرجوع للإشراف التعليمي
            </Link>
            <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
              التقارير السنوية
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
            مراجعة تقارير الطلاب السنوية قبل إرسالها.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
            افتح الحلقة، راجع صورة التقرير لكل طالب، ثم اعتمد التقرير وأرسله
            لولي الأمر عبر واتساب. التقرير لا يرسل إلا مرة واحدة.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm text-white/60">العام</p>
              <p className="mt-2 text-2xl font-black text-[#f2d18a]">
                {academicYear}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm text-white/60">مراجعة</p>
              <p className="mt-2 text-2xl font-black">{reviewCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm text-white/60">معتمد</p>
              <p className="mt-2 text-2xl font-black">{approvedCount}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-sm text-white/60">تم الإرسال</p>
              <p className="mt-2 text-2xl font-black">{sentCount}</p>
            </div>
          </div>
        </section>

        <AnnualReportsImportForm />

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">
                الحلقات
              </h2>
              <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                اختر حلقة لمراجعة تقارير طلابها السنوية.
              </p>
            </div>
            <AnnualReportsBulkSendButton
              label="إرسال جميع التقارير المعتمدة"
              disabled={approvedCount === 0}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {circles.map((circle) => {
              const reportsCount = circle.annualReports.length;
              const circleReview = circle.annualReports.filter(
                (report) => report.reviewStatus === "REVIEW"
              ).length;
              const circleApproved = circle.annualReports.filter(
                (report) => report.reviewStatus === "APPROVED"
              ).length;
              const circleSent = circle.annualReports.filter(
                (report) => report.reviewStatus === "SENT"
              ).length;

              return (
                <Link
                  key={circle.id}
                  href={`/onsite/admin/annual-reports?year=${academicYear}&circleId=${circle.id}`}
                  className={`rounded-[1.8rem] p-5 shadow-sm ring-1 ring-[#d8bf83] transition hover:-translate-y-0.5 ${
                    selectedCircle?.id === circle.id
                      ? "bg-[#0a3f2a] text-white"
                      : "bg-[#fffaf4] text-[#1c2d31]"
                  }`}
                >
                  <h3 className="text-xl font-black">{circle.name}</h3>
                  <p className="mt-2 text-sm leading-7 opacity-70">
                    المعلم: {circle.teacher?.fullName || "لم يحدد"}
                  </p>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-black">
                    <div className="rounded-2xl bg-white/80 p-2 text-[#1c2d31]">
                      <span className="block text-lg">{reportsCount}</span>
                      تقرير
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-2 text-amber-800">
                      <span className="block text-lg">{circleReview}</span>
                      مراجعة
                    </div>
                    <div className="rounded-2xl bg-[#f2d18a]/35 p-2 text-[#8a661f]">
                      <span className="block text-lg">{circleApproved}</span>
                      معتمد
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-800">
                      <span className="block text-lg">{circleSent}</span>
                      مرسل
                    </div>
                  </div>
                </Link>
              );
            })}

            {unlinkedReports.length > 0 ? (
              <Link
                href={`/onsite/admin/annual-reports?year=${academicYear}&circleId=unlinked`}
                className={`rounded-[1.8rem] p-5 shadow-sm ring-1 ring-[#d8bf83] transition hover:-translate-y-0.5 ${
                  selectedCircleId === "unlinked"
                    ? "bg-[#0a3f2a] text-white"
                    : "bg-[#fffaf4] text-[#1c2d31]"
                }`}
              >
                <h3 className="text-xl font-black">تقارير تحتاج ربطًا</h3>
                <p className="mt-2 text-sm leading-7 opacity-70">
                  طلاب لم يتم ربطهم بحلقة داخل المنصة.
                </p>
                <span className="mt-4 inline-flex rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">
                  {unlinkedReports.length} تقرير
                </span>
              </Link>
            ) : null}
          </div>
        </section>

        {selectedCircle || selectedCircleId === "unlinked" ? (
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1c2d31]">
                  {selectedCircle?.name || "تقارير تحتاج ربطًا"}
                </h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                  راجع الصور ثم اعتمد التقرير قبل الإرسال.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleReports.length > 0 ? (
                  <Link
                    href={`${selectedBaseHref}&review=0`}
                    className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a]"
                  >
                    بدء المراجعة السريعة
                  </Link>
                ) : null}
                {selectedCircle ? (
                  <AnnualReportsBulkSendButton
                    circleId={selectedCircle.id}
                    label="إرسال تقارير هذه الحلقة"
                    disabled={
                      selectedCircle.annualReports.filter(
                        (report) => report.reviewStatus === "APPROVED"
                      ).length === 0
                    }
                  />
                ) : null}
              </div>
            </div>

            {visibleReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8bf83] p-8 text-center text-sm text-[#1c2d31]/55">
                لا توجد تقارير سنوية لهذه الحلقة حتى الآن.
              </div>
            ) : (
              <div className="space-y-5">
                {reviewIndex !== null ? (
                  <AnnualReportReviewPanel
                    reports={reviewPanelReports}
                    currentIndex={reviewIndex}
                    baseHref={selectedBaseHref}
                  />
                ) : null}

                <div className="grid gap-5 lg:grid-cols-2">
                  {visibleReports.map((report) => {
                    const imageUrl = publicStorageUrl(report.reportImagePath);
                    const parentPhone = normalizeWhatsAppNumber(
                      report.student?.parentWhatsapp || "",
                      "90"
                    );

                    return (
                      <article
                        key={report.id}
                        className="grid gap-4 rounded-[2rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4] xl:grid-cols-[260px_1fr]"
                      >
                        <div className="overflow-hidden rounded-[1.4rem] bg-white ring-1 ring-[#e7d7b4]">
                          {imageUrl ? (
                            <>
                            <a href={imageUrl} target="_blank" rel="noreferrer">
                              <img
                                src={imageUrl}
                                alt={`التقرير السنوي للطالب ${report.studentName}`}
                                className="h-80 w-full object-contain"
                              />
                            </a>
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mx-2 mb-2 block rounded-xl bg-[#0a3f2a] px-3 py-2 text-center text-xs font-black text-white transition hover:bg-[#0f5a35]"
                            >
                              فتح الصورة للتكبير
                            </a>
                            </>
                          ) : (
                            <div className="flex h-96 items-center justify-center p-6 text-center text-sm font-black text-[#1c2d31]/45">
                              لا توجد صورة مرفوعة
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-col gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="text-xl font-black text-[#1c2d31]">
                                {report.student?.fullName || report.studentName}
                              </h3>
                              <p className="mt-1 text-sm font-bold text-[#1c2d31]/55">
                                {report.teacherName || "لم يحدد المعلم"} -{" "}
                                {report.finalRating || "لا يوجد تقدير"}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(
                                report.reviewStatus
                              )}`}
                            >
                              {statusLabel(report.reviewStatus)}
                            </span>
                          </div>

                          <div className="grid gap-2 text-sm">
                            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadcc4]">
                              <p className="font-black text-[#0a3f2a]">
                                ما حفظه الطالب
                              </p>
                              <p className="mt-1 leading-7 text-[#1c2d31]/70">
                                {report.memorizedDuringYear || "-"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadcc4]">
                              <p className="font-black text-[#0a3f2a]">
                                رسالة الأهل
                              </p>
                              <p className="mt-1 line-clamp-3 leading-7 text-[#1c2d31]/70">
                                {report.parentMessage || "-"}
                              </p>
                            </div>
                          </div>

                          {report.sendError ? (
                            <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-100">
                              {report.sendError}
                            </p>
                          ) : null}

                          <AnnualReportActions
                            reportId={report.id}
                            reviewStatus={report.reviewStatus}
                            hasImage={Boolean(imageUrl)}
                            hasParentPhone={Boolean(parentPhone)}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
