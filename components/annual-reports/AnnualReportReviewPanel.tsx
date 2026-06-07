"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ReviewReport = {
  id: string;
  studentName: string;
  teacherName: string;
  finalRating: string;
  memorizedDuringYear: string;
  learnedDuringYear: string;
  studentStrengths: string;
  behaviorNotes: string;
  studentNeeds: string;
  parentMessage: string;
  imageUrl: string | null;
  reviewStatus: "REVIEW" | "APPROVED" | "SENT";
  hasParentPhone: boolean;
  sendError: string | null;
};

type AnnualReportReviewPanelProps = {
  reports: ReviewReport[];
  currentIndex: number;
  baseHref: string;
};

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "تعذر تنفيذ العملية");
  }

  return data;
}

function statusLabel(status: ReviewReport["reviewStatus"]) {
  if (status === "SENT") return "تم الإرسال";
  if (status === "APPROVED") return "معتمد";
  return "مراجعة";
}

function statusTone(status: ReviewReport["reviewStatus"]) {
  if (status === "SENT") return "bg-emerald-100 text-emerald-800";
  if (status === "APPROVED") return "bg-[#f2d18a]/35 text-[#8a661f]";
  return "bg-amber-50 text-amber-800";
}

export default function AnnualReportReviewPanel({
  reports,
  currentIndex,
  baseHref,
}: AnnualReportReviewPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "send" | null>(null);
  const safeIndex = Math.max(0, Math.min(currentIndex, reports.length - 1));
  const report = reports[safeIndex];
  const previousHref = `${baseHref}&review=${Math.max(0, safeIndex - 1)}`;
  const nextHref = `${baseHref}&review=${Math.min(reports.length - 1, safeIndex + 1)}`;
  const remainingReview = useMemo(
    () => reports.filter((item) => item.reviewStatus === "REVIEW").length,
    [reports]
  );

  if (!report) return null;

  const goNext = () => {
    router.push(nextHref);
    router.refresh();
  };

  const approveAndNext = async () => {
    if (busy || report.reviewStatus !== "REVIEW") return;

    try {
      setBusy("approve");
      await requestJson(`/api/onsite/annual-reports/${report.id}/approve`, {
        method: "PATCH",
      });
      goNext();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر اعتماد التقرير");
    } finally {
      setBusy(null);
    }
  };

  const sendCurrent = async () => {
    if (busy || report.reviewStatus !== "APPROVED") return;

    if (!report.imageUrl) {
      alert("لا توجد صورة مرفوعة لهذا التقرير");
      return;
    }

    if (!report.hasParentPhone) {
      alert("لا يوجد رقم واتساب صالح لولي الأمر");
      return;
    }

    const confirmed = window.confirm(
      "سيتم إرسال هذا التقرير لولي الأمر مرة واحدة فقط. هل تريد المتابعة؟"
    );
    if (!confirmed) return;

    try {
      setBusy("send");
      await requestJson(`/api/onsite/annual-reports/${report.id}/send`, {
        method: "POST",
      });
      goNext();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر إرسال التقرير");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-[2.25rem] bg-[#0a3f2a] p-4 text-white shadow-lg md:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-[#f2d18a]">مراجعة سريعة</p>
          <h3 className="mt-1 text-2xl font-black">
            {safeIndex + 1} من {reports.length} - {report.studentName}
          </h3>
          <p className="mt-1 text-sm leading-7 text-white/70">
            المتبقي في المراجعة: {remainingReview} تقرير
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={previousHref}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
              safeIndex === 0
                ? "pointer-events-none bg-white/10 text-white/40"
                : "bg-white text-[#0a3f2a] hover:bg-[#fffaf4]"
            }`}
          >
            السابق
          </Link>
          <Link
            href={nextHref}
            className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
              safeIndex === reports.length - 1
                ? "pointer-events-none bg-white/10 text-white/40"
                : "bg-white text-[#0a3f2a] hover:bg-[#fffaf4]"
            }`}
          >
            التالي
          </Link>
          <Link
            href={baseHref}
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
          >
            إنهاء المراجعة
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <div className="overflow-hidden rounded-[1.75rem] bg-white p-3 ring-1 ring-white/20">
          {report.imageUrl ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-[#1c2d31]/55">
                افتح الصورة في تبويب مستقل إذا احتجت إلى التكبير.
              </span>
              <a
                href={report.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#0a3f2a] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0f5a35]"
              >
                فتح الصورة للتكبير
              </a>
            </div>
          ) : null}
          {report.imageUrl ? (
            <a href={report.imageUrl} target="_blank" rel="noreferrer">
              <img
                src={report.imageUrl}
                alt={`التقرير السنوي للطالب ${report.studentName}`}
                className="mx-auto max-h-[76vh] w-auto max-w-full object-contain"
              />
            </a>
          ) : (
            <div className="flex h-[540px] items-center justify-center rounded-[1.4rem] bg-[#f6eee7] p-6 text-center text-sm font-black text-[#1c2d31]/45">
              لا توجد صورة مرفوعة لهذا التقرير
            </div>
          )}
        </div>

        <aside className="space-y-3 rounded-[1.75rem] bg-white p-4 text-[#1c2d31]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="text-2xl font-black">{report.studentName}</h4>
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
            {[
              ["ما حفظه الطالب", report.memorizedDuringYear],
              ["ما تعلمه", report.learnedDuringYear],
              ["بماذا يتميز", report.studentStrengths],
              ["ملاحظات السلوك", report.behaviorNotes],
              ["الخطوة القادمة", report.studentNeeds],
              ["رسالة الأهل", report.parentMessage],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-[#fffaf4] p-3 ring-1 ring-[#eadcc4]"
              >
                <p className="font-black text-[#0a3f2a]">{label}</p>
                <p className="mt-1 max-h-32 overflow-auto leading-7 text-[#1c2d31]/70">
                  {value || "-"}
                </p>
              </div>
            ))}
          </div>

          {report.sendError ? (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-100">
              {report.sendError}
            </p>
          ) : null}

          {report.reviewStatus === "REVIEW" ? (
            <button
              type="button"
              onClick={approveAndNext}
              disabled={Boolean(busy)}
              className="w-full rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "approve" ? "جاري الاعتماد..." : "اعتماد وانتقال للتالي"}
            </button>
          ) : null}

          {report.reviewStatus === "APPROVED" ? (
            <button
              type="button"
              onClick={sendCurrent}
              disabled={Boolean(busy)}
              className="w-full rounded-2xl bg-[#bd8f2d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#a77d24] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "send" ? "جاري الإرسال..." : "إرسال وانتقال للتالي"}
            </button>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
