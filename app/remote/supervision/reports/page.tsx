"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReportItem = {
  id: string;
  lessonName: string;
  lessonSurah: string | null;
  pageFrom: number | null;
  pageTo: number | null;
  review: string | null;
  reviewSurah: string | null;
  reviewFrom: number | null;
  reviewTo: number | null;
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

type TeacherRequest = {
  id: string;
  type: "TEST_REQUEST" | "STRUGGLING_STUDENT" | "SPECIAL_CASE" | "GENERAL";
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  student: {
    id: string;
  } | null;
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
  struggleRequestsCount: number;
  openRequestsCount: number;
};

function isRemoteReport(report: ReportItem) {
  return (
    report.student.studyMode === "REMOTE" &&
    (!report.student.teacher?.studyMode || report.student.teacher.studyMode === "REMOTE") &&
    (!report.student.circle?.studyMode || report.student.circle.studyMode === "REMOTE")
  );
}

function buildSummaries(reports: ReportItem[], requests: TeacherRequest[]) {
  const summaries = new Map<string, StudentSummary>();
  const requestsByStudent = new Map<string, TeacherRequest[]>();

  for (const request of requests) {
    if (!request.student?.id) continue;
    requestsByStudent.set(request.student.id, [...(requestsByStudent.get(request.student.id) || []), request]);
  }

  for (const report of reports) {
    const studentId = report.student.id;
    const studentRequests = requestsByStudent.get(studentId) || [];
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
      struggleRequestsCount: studentRequests.filter((request) => request.type === "STRUGGLING_STUDENT").length,
      openRequestsCount: studentRequests.filter((request) => ["NEW", "IN_REVIEW"].includes(request.status)).length,
    };

    current.reports.push(report);

    if (report.status === "ABSENT") {
      current.absentCount += 1;
    } else {
      current.presentCount += 1;
    }

    for (const value of [report.lessonMemorized, report.lastFiveMemorized, report.reviewMemorized]) {
      if (value === true) current.memorizedCount += 1;
      if (value === false) current.notMemorizedCount += 1;
    }

    current.pagesTotal += report.pagesCount || 0;
    current.pagesTotal += report.reviewPagesCount || 0;
    if (report.sentToParent) current.sentToParentCount += 1;

    summaries.set(studentId, current);
  }

  return Array.from(summaries.values()).sort((a, b) => b.reports.length - a.reports.length);
}

function studentLevel(summary: StudentSummary) {
  const checked = summary.memorizedCount + summary.notMemorizedCount;
  if (summary.reports.length === 0) return "لا توجد تقارير";
  if (summary.absentCount >= 3) return "غياب يحتاج متابعة";
  if (checked > 0 && summary.notMemorizedCount / checked >= 0.45) return "تعثر يحتاج متابعة";
  return "مستقر";
}

function englishDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function memorizedLabel(value: boolean | null) {
  if (value === true) return "حافظ";
  if (value === false) return "غير حافظ";
  return "لم يحدد";
}

function rangeLabel(from: number | null, to: number | null) {
  if (from && to) return `${from} - ${to}`;
  if (from) return String(from);
  if (to) return String(to);
  return "-";
}

export default function RemoteSupervisionReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reportsRes, requestsRes] = await Promise.all([
          fetch("/api/admin-reports?studyMode=REMOTE", { cache: "no-store" }),
          fetch("/api/teacher-requests", { cache: "no-store" }),
        ]);
        const [reportsData, requestsData] = await Promise.all([reportsRes.json(), requestsRes.json()]);

        setReports(
          Array.isArray(reportsData.reports)
            ? reportsData.reports.filter((report: ReportItem) => isRemoteReport(report))
            : []
        );
        setRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
      } catch (error) {
        console.error("FETCH SUPERVISION REPORTS ERROR =>", error);
        setReports([]);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const summaries = useMemo(() => buildSummaries(reports, requests), [reports, requests]);
  const selectedSummary =
    summaries.find((summary) => summary.id === selectedStudentId) || summaries[0] || null;
  const filteredSummaries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return summaries;

    return summaries.filter((summary) =>
      [summary.fullName, summary.studentCode, summary.teacherName, summary.circleName]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, summaries]);

  const stats = {
    students: summaries.length,
    reports: reports.length,
    present: summaries.reduce((sum, item) => sum + item.presentCount, 0),
    absent: summaries.reduce((sum, item) => sum + item.absentCount, 0),
    pages: summaries.reduce((sum, item) => sum + item.pagesTotal, 0),
    struggling: summaries.filter((item) => studentLevel(item).includes("تعثر")).length,
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">تقارير الطلاب</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              إحصائيات عامة ثم متابعة تفصيلية لكل طالب: الحضور، التسميع، الصفحات، المعلم، الحلقة، وطلبات المتابعة.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["الطلاب", stats.students, "text-[#173d42]"],
            ["التقارير", stats.reports, "text-[#1f6358]"],
            ["الحضور", stats.present, "text-[#1f6358]"],
            ["الغياب", stats.absent, "text-[#c39a62]"],
            ["الصفحات", stats.pages, "text-[#173d42]"],
            ["تعثر ظاهر", stats.struggling, "text-[#8a6335]"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">{label}</p>
              <p className={`mt-2 text-4xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="relative">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الطالب أو رقمه أو معلمه أو حلقته"
              className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-4 pl-12 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#173d42] text-sm font-black text-white"
                aria-label="مسح البحث"
              >
                ×
              </button>
            ) : null}
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل التقارير...
          </div>
        ) : summaries.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد تقارير حتى الآن.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            <section className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-black text-[#1c2d31]">الطلاب</h2>
                <span className="text-sm font-bold text-[#1c2d31]/55">{filteredSummaries.length}</span>
              </div>
              <div className="max-h-[720px] space-y-2 overflow-y-auto pl-1">
                {filteredSummaries.map((summary) => (
                  <button
                    key={summary.id}
                    type="button"
                    onClick={() => setSelectedStudentId(summary.id)}
                    className={`w-full rounded-2xl p-4 text-right transition ${
                      selectedSummary?.id === summary.id
                        ? "bg-[#173d42] text-white"
                        : "bg-[#fffaf2] text-[#1c2d31] ring-1 ring-[#eadcc6] hover:bg-white"
                    }`}
                  >
                    <p className="font-black">{summary.fullName}</p>
                    <p className="mt-1 text-sm opacity-70">
                      {summary.studentCode} - {summary.circleName}
                    </p>
                    <p className="mt-2 text-xs font-black opacity-80">{studentLevel(summary)}</p>
                  </button>
                ))}
              </div>
            </section>

            {selectedSummary ? (
              <section className="space-y-5">
                <div className="rounded-[2rem] bg-[#173d42] p-6 text-white shadow-lg">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#f1d39d]">{selectedSummary.studentCode}</p>
                      <h2 className="mt-2 text-3xl font-black">{selectedSummary.fullName}</h2>
                      <p className="mt-3 text-sm leading-7 text-white/72">
                        المعلم: {selectedSummary.teacherName} - الحلقة: {selectedSummary.circleName}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                      {studentLevel(selectedSummary)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ["أيام الحضور", selectedSummary.presentCount, "text-[#1f6358]"],
                    ["أيام الغياب", selectedSummary.absentCount, "text-[#c39a62]"],
                    ["مرات التسميع", selectedSummary.memorizedCount, "text-[#1f6358]"],
                    ["لم يسمع", selectedSummary.notMemorizedCount, "text-[#8a6335]"],
                    ["إجمالي الصفحات", selectedSummary.pagesTotal, "text-[#173d42]"],
                    ["عدد التقارير", selectedSummary.reports.length, "text-[#173d42]"],
                    ["رسائل ولي الأمر", selectedSummary.sentToParentCount, "text-[#1f6358]"],
                    ["طلبات التعثر", selectedSummary.struggleRequestsCount, "text-[#8a6335]"],
                    ["طلبات مفتوحة", selectedSummary.openRequestsCount, "text-[#c39a62]"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                      <p className="text-sm font-bold text-[#1c2d31]/55">{label}</p>
                      <p className={`mt-2 text-4xl font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                  <h3 className="text-xl font-black text-[#1c2d31]">آخر التقارير</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {selectedSummary.reports.slice(0, 10).map((report) => (
                      <div key={report.id} className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-[#1c2d31]">
                            {englishDate(report.createdAt)}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              report.status === "PRESENT"
                                ? "bg-[#dff1eb] text-[#1f6358]"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {report.status === "PRESENT" ? "حاضر" : "غائب"}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm leading-7 text-[#1c2d31]/72">
                          <p>
                            <span className="font-black text-[#1c2d31]">الدرس الجديد: </span>
                            {report.lessonName || report.lessonSurah || "-"} - الصفحات {rangeLabel(report.pageFrom, report.pageTo)}
                          </p>
                          <p>
                            <span className="font-black text-[#1c2d31]">المراجعة: </span>
                            {report.review || report.reviewSurah || "-"} - الصفحات {rangeLabel(report.reviewFrom, report.reviewTo)}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                          <span className="rounded-full bg-white px-3 py-1 text-[#1f6358] ring-1 ring-[#d9c8ad]">
                            الدرس: {memorizedLabel(report.lessonMemorized)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-[#173d42] ring-1 ring-[#d9c8ad]">
                            آخر خمس: {memorizedLabel(report.lastFiveMemorized)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-[#173d42] ring-1 ring-[#d9c8ad]">
                            المراجعة: {memorizedLabel(report.reviewMemorized)}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-[#8a6335] ring-1 ring-[#d9c8ad]">
                            أرسل للولي: {report.sentToParent ? "نعم" : "لا"}
                          </span>
                        </div>
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
