"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ReportItem = {
  id: string;
  lessonName: string;
  lessonMemorized: boolean | null;
  lastFiveMemorized: boolean | null;
  reviewMemorized: boolean | null;
  pagesCount: number | null;
  reviewPagesCount: number | null;
  status: "PRESENT" | "ABSENT";
  sentToParent: boolean;
  createdAt: string;
  student: {
    id: string;
    studentCode: string | null;
    fullName: string;
    studyMode: "REMOTE" | "ONSITE";
    circle: {
      id: string;
      name: string;
      track: string | null;
      studyMode?: "REMOTE" | "ONSITE";
    } | null;
    teacher: {
      id: string;
      fullName: string;
      email: string;
      studyMode?: "REMOTE" | "ONSITE";
    };
  };
};

type StudentSummary = {
  id: string;
  studentCode: string;
  fullName: string;
  teacherName: string;
  circleName: string;
  reports: ReportItem[];
  presentCount: number;
  absentCount: number;
  memorizedCount: number;
  notMemorizedCount: number;
  pagesTotal: number;
  sentToParentCount: number;
};

type NotifyType = "ABSENCE_REPEAT" | "STRUGGLE_REPEAT" | "CUSTOM";

function getStudentLevel(summary: StudentSummary) {
  const totalChecked = summary.memorizedCount + summary.notMemorizedCount;

  if (summary.reports.length === 0) {
    return "لا توجد تقارير";
  }

  if (totalChecked === 0) {
    return "بحاجة بيانات أكثر";
  }

  const successRate = summary.memorizedCount / totalChecked;

  if (successRate >= 0.8 && summary.absentCount <= 1) {
    return "مستوى حافظ ومطمئن";
  }

  if (successRate >= 0.55) {
    return "مستوى متوسط يحتاج متابعة";
  }

  return "بحاجة متابعة قوية";
}

function buildSummaries(reports: ReportItem[]) {
  const summaries = new Map<string, StudentSummary>();

  for (const report of reports) {
    const studentId = report.student.id;
    const current = summaries.get(studentId) || {
      id: studentId,
      studentCode: report.student.studentCode || "-",
      fullName: report.student.fullName,
      teacherName: report.student.teacher?.fullName || "-",
      circleName: report.student.circle?.name || "غير محددة",
      reports: [],
      presentCount: 0,
      absentCount: 0,
      memorizedCount: 0,
      notMemorizedCount: 0,
      pagesTotal: 0,
      sentToParentCount: 0,
    };

    current.reports.push(report);

    if (report.status === "ABSENT") {
      current.absentCount += 1;
    } else {
      current.presentCount += 1;
    }

    const memorizedValues = [
      report.lessonMemorized,
      report.lastFiveMemorized,
      report.reviewMemorized,
    ];

    for (const value of memorizedValues) {
      if (value === true) {
        current.memorizedCount += 1;
      }

      if (value === false) {
        current.notMemorizedCount += 1;
      }
    }

    current.pagesTotal += report.pagesCount || 0;
    current.pagesTotal += report.reviewPagesCount || 0;

    if (report.sentToParent) {
      current.sentToParentCount += 1;
    }

    summaries.set(studentId, current);
  }

  return Array.from(summaries.values()).sort(
    (a, b) => b.reports.length - a.reports.length
  );
}

function isRemoteReport(report: ReportItem) {
  const studentMode = report.student.studyMode;
  const teacherMode = report.student.teacher?.studyMode;
  const circleMode = report.student.circle?.studyMode;

  if (studentMode !== "REMOTE") {
    return false;
  }

  if (teacherMode && teacherMode !== "REMOTE") {
    return false;
  }

  if (circleMode && circleMode !== "REMOTE") {
    return false;
  }

  return true;
}

export default function RemoteAdminReportsPage() {
  const pathname = usePathname();
  const dashboardHref = pathname.startsWith("/remote/supervision/")
    ? "/remote/supervision/dashboard"
    : "/remote/admin/dashboard";
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendingType, setSendingType] = useState<NotifyType | null>(null);
  const [notifyFeedback, setNotifyFeedback] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportsUrl = new URL("/api/admin-reports", window.location.origin);
      reportsUrl.searchParams.set("studyMode", "REMOTE");

      const res = await fetch(reportsUrl.toString(), { cache: "no-store" });
      const data = await res.json();
      setReports(
        Array.isArray(data.reports)
          ? data.reports.filter((report: ReportItem) => isRemoteReport(report))
          : []
      );
    } catch (error) {
      console.error("FETCH ADMIN REPORTS ERROR =>", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summaries = useMemo(() => buildSummaries(reports), [reports]);
  const filteredSummaries = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return summaries;
    }

    return summaries.filter((summary) => {
      return (
        summary.fullName.toLowerCase().includes(term) ||
        summary.studentCode.toLowerCase().includes(term)
      );
    });
  }, [search, summaries]);

  const selectedSummary = filteredSummaries[0] || null;

  useEffect(() => {
    setNotifyFeedback(null);
    setCustomMessage("");
  }, [selectedSummary?.id]);

  const sendParentMessage = async (type: NotifyType) => {
    if (!selectedSummary) {
      return;
    }

    if (type === "CUSTOM" && !customMessage.trim()) {
      setNotifyFeedback({
        tone: "error",
        text: "الرجاء كتابة الرسالة الخاصة أولًا.",
      });
      return;
    }

    try {
      setSendingType(type);
      setNotifyFeedback(null);

      const response = await fetch(
        `/api/admin/students/${selectedSummary.id}/notify-parent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            message: customMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر إرسال الرسالة إلى ولي الأمر");
      }

      setNotifyFeedback({
        tone: "success",
        text:
          type === "ABSENCE_REPEAT"
            ? "تم إرسال رسالة الغياب المتكرر بنجاح."
            : type === "STRUGGLE_REPEAT"
              ? "تم إرسال رسالة التعثر المتكرر بنجاح."
              : "تم إرسال الرسالة الخاصة بنجاح.",
      });

      if (type === "CUSTOM") {
        setCustomMessage("");
      }
    } catch (error) {
      setNotifyFeedback({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إرسال الرسالة إلى ولي الأمر",
      });
    } finally {
      setSendingType(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">قسم التقارير</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              ابحث باسم الطالب أو رقم الطالب لعرض ملخص مستواه، ثم أرسل لولي الأمر رسالة
              غياب متكرر أو تعثر متكرر أو رسالة خاصة مباشرة من نفس الصفحة.
            </p>
          </div>
          <Link
            href={dashboardHref}
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
            البحث عن طالب
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="اكتب اسم الطالب أو رقمه مثل 1001"
            className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-4 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10"
          />
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/70 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل ملخصات الطلاب...
          </div>
        ) : summaries.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/70 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد تقارير حتى الآن.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black text-[#1c2d31]">الطلاب</h2>
                <span className="text-sm font-bold text-[#1c2d31]/55">
                  {filteredSummaries.length}
                </span>
              </div>

              <div className="max-h-[640px] space-y-2 overflow-y-auto pl-1">
                {filteredSummaries.length === 0 ? (
                  <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">
                    لا يوجد طالب مطابق للبحث.
                  </p>
                ) : (
                  filteredSummaries.map((summary) => (
                    <button
                      key={summary.id}
                      type="button"
                      onClick={() => setSearch(summary.studentCode)}
                      className={`w-full rounded-2xl p-4 text-right transition ${
                        selectedSummary?.id === summary.id
                          ? "bg-[#1f6358] text-white"
                          : "bg-[#fffaf2] text-[#1c2d31] hover:bg-white"
                      }`}
                    >
                      <span className="block font-black">{summary.fullName}</span>
                      <span className="mt-1 block text-sm opacity-70">
                        رقم الطالب: {summary.studentCode}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            {selectedSummary ? (
              <section className="space-y-5">
                <div className="rounded-[2rem] bg-[#173d42] p-6 text-white shadow-lg">
                  <p className="text-sm font-bold text-[#f1d39d]">
                    {selectedSummary.studentCode}
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    {selectedSummary.fullName}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    المعلم: {selectedSummary.teacherName} - الحلقة: {selectedSummary.circleName}
                  </p>
                  <div className="mt-5 inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                    {getStudentLevel(selectedSummary)}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                    <p className="text-sm font-bold text-[#1c2d31]/55">أيام حافظ</p>
                    <p className="mt-2 text-4xl font-black text-[#1f6358]">
                      {selectedSummary.memorizedCount}
                    </p>
                  </div>
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                    <p className="text-sm font-bold text-[#1c2d31]/55">أيام غير حافظ</p>
                    <p className="mt-2 text-4xl font-black text-[#c39a62]">
                      {selectedSummary.notMemorizedCount}
                    </p>
                  </div>
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                    <p className="text-sm font-bold text-[#1c2d31]/55">أيام غياب</p>
                    <p className="mt-2 text-4xl font-black text-[#173d42]">
                      {selectedSummary.absentCount}
                    </p>
                  </div>
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                    <p className="text-sm font-bold text-[#1c2d31]/55">أيام حضور</p>
                    <p className="mt-2 text-4xl font-black text-[#1f6358]">
                      {selectedSummary.presentCount}
                    </p>
                  </div>
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                    <p className="text-sm font-bold text-[#1c2d31]/55">إجمالي الصفحات</p>
                    <p className="mt-2 text-4xl font-black text-[#173d42]">
                      {selectedSummary.pagesTotal}
                    </p>
                  </div>
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                    <p className="text-sm font-bold text-[#1c2d31]/55">عدد التقارير</p>
                    <p className="mt-2 text-4xl font-black text-[#c39a62]">
                      {selectedSummary.reports.length}
                    </p>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#1c2d31]">
                        التواصل مع ولي الأمر
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                        أرسل رسالة جاهزة عند تكرر الغياب أو التعثر، أو اكتب رسالة خاصة لهذا
                        الطالب فقط.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-800">
                        غياب مسجل: {selectedSummary.absentCount}
                      </span>
                      <span className="rounded-full bg-[#eef7f5] px-3 py-2 text-[#1f6358]">
                        تعثر مسجل: {selectedSummary.notMemorizedCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => sendParentMessage("ABSENCE_REPEAT")}
                      disabled={sendingType !== null || selectedSummary.absentCount <= 1}
                      className="rounded-2xl bg-[#173d42] px-4 py-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {sendingType === "ABSENCE_REPEAT"
                        ? "جارٍ إرسال رسالة الغياب..."
                        : "إرسال قالب الغياب المتكرر"}
                    </button>
                    <button
                      type="button"
                      onClick={() => sendParentMessage("STRUGGLE_REPEAT")}
                      disabled={sendingType !== null || selectedSummary.notMemorizedCount <= 1}
                      className="rounded-2xl bg-[#1f6358] px-4 py-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {sendingType === "STRUGGLE_REPEAT"
                        ? "جارٍ إرسال رسالة التعثر..."
                        : "إرسال قالب التعثر المتكرر"}
                    </button>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-[#d9c8ad] bg-[#fffaf2] p-4">
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                      رسالة خاصة لولي الأمر
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(event) => setCustomMessage(event.target.value)}
                      rows={5}
                      placeholder="اكتب هنا رسالة خاصة لهذا الطالب، وسيتم إضافة ختم الإدارة تلقائيًا في النهاية."
                      className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10"
                    />
                    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-xs leading-6 text-[#1c2d31]/55">
                        ستضاف الجملة التالية تلقائيًا في نهاية الرسالة: إدارة منصة الرحمة
                        لتعليم القرآن الكريم
                      </p>
                      <button
                        type="button"
                        onClick={() => sendParentMessage("CUSTOM")}
                        disabled={sendingType !== null || !customMessage.trim()}
                        className="rounded-2xl bg-[#c39a62] px-5 py-3 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {sendingType === "CUSTOM"
                          ? "جارٍ إرسال الرسالة..."
                          : "إرسال الرسالة الخاصة"}
                      </button>
                    </div>
                  </div>

                  {notifyFeedback ? (
                    <div
                      className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
                        notifyFeedback.tone === "success"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {notifyFeedback.text}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                  <h3 className="mb-4 text-xl font-black text-[#1c2d31]">
                    آخر التقارير المختصرة
                  </h3>
                  <div className="space-y-3">
                    {selectedSummary.reports.slice(0, 8).map((report) => (
                      <div
                        key={report.id}
                        className="rounded-2xl border border-[#d9c8ad]/70 bg-[#fffaf2] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-black text-[#1c2d31]">
                            {new Date(report.createdAt).toLocaleDateString("ar-EG")}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              report.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {report.status === "PRESENT" ? "حاضر" : "غائب"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/62">
                          {report.lessonName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
