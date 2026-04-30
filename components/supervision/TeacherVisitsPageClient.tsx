"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TEACHER_VISIT_EVALUATION_OPTIONS,
  TEACHER_VISIT_GENERAL_ITEMS,
  TEACHER_VISIT_MAIN_ITEMS,
  TEACHER_VISIT_PERIOD_OPTIONS,
  TEACHER_VISIT_TRACK_OPTIONS,
} from "@/lib/teacher-visit-reports";

type TeacherOption = {
  id: string;
  fullName: string;
};

type VisitReport = {
  id: string;
  visitNumber: number;
  dayLabel: string;
  trackLabel: string;
  periodLabel: string;
  pdfPath: string | null;
  sentToTeacherAt: string | Date | null;
  visitDate: string | Date;
  visitType: "FIELD" | "SECRET";
  overallEvaluation: string | null;
  teacher: {
    id: string;
    fullName: string;
  };
  supervisor: {
    id: string;
    fullName: string;
  };
};

type Props = {
  supervisorName: string;
  teachers: TeacherOption[];
  initialReports: VisitReport[];
};

type FormState = {
  teacherId: string;
  visitDate: string;
  visitType: string;
  trackLabel: string;
  periodLabel: string;
  overallEvaluation: string;
  finalRecommendation: string;
  generalNotes: string;
  positiveNotesEnabled: boolean;
  positiveNotes: string;
  mainItems: Array<{ label: string; note: string }>;
  generalItems: Array<{ label: string; evaluation: string }>;
};

const VISIT_TYPE_OPTIONS = [
  { value: "FIELD", label: "ميدانية" },
  { value: "SECRET", label: "سرية" },
] as const;

function englishDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function arabicDay(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export default function TeacherVisitsPageClient({
  supervisorName,
  teachers,
  initialReports,
}: Props) {
  const [reports, setReports] = useState(initialReports);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    teacherId: "",
    visitDate: "",
    visitType: "FIELD",
    trackLabel: TEACHER_VISIT_TRACK_OPTIONS[0],
    periodLabel: TEACHER_VISIT_PERIOD_OPTIONS[0],
    overallEvaluation: TEACHER_VISIT_EVALUATION_OPTIONS[1],
    finalRecommendation: "",
    generalNotes: "",
    positiveNotesEnabled: false,
    positiveNotes: "",
    mainItems: TEACHER_VISIT_MAIN_ITEMS.map((label) => ({ label, note: "" })),
    generalItems: TEACHER_VISIT_GENERAL_ITEMS.map((label) => ({
      label,
      evaluation: "جيد",
    })),
  });

  const computedDayLabel = useMemo(
    () => (formData.visitDate ? arabicDay(formData.visitDate) : "يظهر بعد اختيار التاريخ"),
    [formData.visitDate]
  );

  const handleMainItemChange = (index: number, note: string) => {
    setFormData((prev) => ({
      ...prev,
      mainItems: prev.mainItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, note } : item
      ),
    }));
  };

  const handleGeneralItemChange = (index: number, evaluation: string) => {
    setFormData((prev) => ({
      ...prev,
      generalItems: prev.generalItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, evaluation } : item
      ),
    }));
  };

  const fetchReports = async () => {
    const response = await fetch("/api/teacher-visit-reports", { cache: "no-store" });
    const data = await response.json();
    setReports(Array.isArray(data.reports) ? data.reports : []);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/teacher-visit-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر حفظ تقرير الزيارة");
        return;
      }

      alert("تم حفظ الزيارة وتوليد التقرير وإرسال الرابط للمعلم.");
      setFormData({
        teacherId: "",
        visitDate: "",
        visitType: "FIELD",
        trackLabel: TEACHER_VISIT_TRACK_OPTIONS[0],
        periodLabel: TEACHER_VISIT_PERIOD_OPTIONS[0],
        overallEvaluation: TEACHER_VISIT_EVALUATION_OPTIONS[1],
        finalRecommendation: "",
        generalNotes: "",
        positiveNotesEnabled: false,
        positiveNotes: "",
        mainItems: TEACHER_VISIT_MAIN_ITEMS.map((label) => ({ label, note: "" })),
        generalItems: TEACHER_VISIT_GENERAL_ITEMS.map((label) => ({
          label,
          evaluation: "جيد",
        })),
      });
      await fetchReports();
    } catch (error) {
      console.error("CREATE TEACHER VISIT REPORT PAGE ERROR =>", error);
      alert("حدث خطأ أثناء حفظ تقرير الزيارة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">زيارات المعلمين</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              نموذج سريع للمشرف مع PDF مرتب ورابط جاهز يُرسل للمعلم بعد الحفظ.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <section>
            <h2 className="text-2xl font-black text-[#173d42]">بيانات الزيارة</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <p className="text-sm font-bold text-[#8a6335]">اسم المشرف</p>
                <p className="mt-2 text-base font-black text-[#173d42]">{supervisorName}</p>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <p className="text-sm font-bold text-[#8a6335]">رقم الزيارة</p>
                <p className="mt-2 text-base font-black text-[#173d42]">يتولد تلقائيًا بعد الحفظ</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]">اسم المعلم</label>
                <select
                  value={formData.teacherId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, teacherId: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                  required
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]">التاريخ</label>
                <input
                  type="date"
                  value={formData.visitDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, visitDate: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                  required
                />
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <p className="text-sm font-bold text-[#8a6335]">اليوم</p>
                <p className="mt-2 text-base font-black text-[#173d42]">{computedDayLabel}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]">نوع الزيارة</label>
                <select
                  value={formData.visitType}
                  onChange={(event) => setFormData((prev) => ({ ...prev, visitType: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                >
                  {VISIT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]">القسم / المسار</label>
                <select
                  value={formData.trackLabel}
                  onChange={(event) => setFormData((prev) => ({ ...prev, trackLabel: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                >
                  {TEACHER_VISIT_TRACK_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]">الفترة</label>
                <select
                  value={formData.periodLabel}
                  onChange={(event) => setFormData((prev) => ({ ...prev, periodLabel: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                >
                  {TEACHER_VISIT_PERIOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]">التقييم العام</label>
                <select
                  value={formData.overallEvaluation}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, overallEvaluation: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                >
                  {TEACHER_VISIT_EVALUATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#173d42]">البنود الأساسية</h2>
            <div className="mt-4 space-y-4">
              {formData.mainItems.map((item, index) => (
                <div key={item.label} className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                  <p className="text-base font-black text-[#173d42]">{item.label}</p>
                  <textarea
                    value={item.note}
                    onChange={(event) => handleMainItemChange(index, event.target.value)}
                    placeholder="ملاحظات المشرف"
                    className="mt-3 min-h-24 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#173d42]">البنود العامة</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {formData.generalItems.map((item, index) => (
                <div key={item.label} className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                  <p className="text-sm font-black text-[#173d42]">{item.label}</p>
                  <select
                    value={item.evaluation}
                    onChange={(event) => handleGeneralItemChange(index, event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                  >
                    {TEACHER_VISIT_EVALUATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6] md:col-span-2">
              <label className="flex items-center gap-3 text-sm font-black text-[#173d42]">
                <input
                  type="checkbox"
                  checked={formData.positiveNotesEnabled}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      positiveNotesEnabled: event.target.checked,
                      positiveNotes: event.target.checked ? prev.positiveNotes : "",
                    }))
                  }
                  className="h-5 w-5"
                />
                إظهار قسم نقاط إيجابية لدى المعلم في التقرير
              </label>
              {formData.positiveNotesEnabled ? (
                <textarea
                  value={formData.positiveNotes}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, positiveNotes: event.target.value }))
                  }
                  placeholder="اكتب النقاط الإيجابية التي ظهرت أثناء الزيارة..."
                  className="mt-3 min-h-28 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 outline-none"
                />
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#1c2d31]">التوصية النهائية</label>
              <textarea
                value={formData.finalRecommendation}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, finalRecommendation: event.target.value }))
                }
                placeholder="التوصية أو الإجراء المقترح"
                className="min-h-28 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#1c2d31]">ملاحظات عامة</label>
              <textarea
                value={formData.generalNotes}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, generalNotes: event.target.value }))
                }
                placeholder="أي ملاحظات إضافية"
                className="min-h-28 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-[#173d42] px-6 py-4 text-sm font-black text-white disabled:opacity-60"
          >
            {submitting ? "جارٍ حفظ الزيارة وتوليد التقرير..." : "حفظ الزيارة وإرسال التقرير"}
          </button>
        </form>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#173d42]">آخر زيارات المعلمين</h2>
            <span className="text-sm font-bold text-[#8a6335]">{reports.length} تقرير</span>
          </div>

          <div className="mt-4 space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                    زيارة رقم {report.visitNumber}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f6358] ring-1 ring-[#d9c8ad]">
                    {report.teacher.fullName}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#1c2d31]/72">
                  {englishDate(report.visitDate)} - {report.dayLabel} -{" "}
                  {report.visitType === "SECRET" ? "سرية" : "ميدانية"} - {report.trackLabel} -{" "}
                  {report.periodLabel}
                </p>
                <p className="mt-2 text-sm font-bold text-[#8a6335]">
                  التقييم العام: {report.overallEvaluation || "-"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.pdfPath ? (
                    <a
                      href={report.pdfPath}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-[#1f6358] px-4 py-2 text-sm font-black text-white"
                    >
                      فتح PDF
                    </a>
                  ) : null}
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] ring-1 ring-[#d9c8ad]">
                    {report.sentToTeacherAt ? "أُرسل للمعلم" : "لم يُرسل بعد"}
                  </span>
                </div>
              </div>
            ))}
            {reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                لا توجد زيارات مسجلة بعد.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
