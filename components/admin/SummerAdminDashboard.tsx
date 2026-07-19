"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getIstanbulDateKey } from "@/lib/school-day";

type UserBasic = {
  id: string;
  fullName: string;
};

type CircleBasic = {
  id: string;
  name: string;
  teacher: UserBasic | null;
};

type SummerReportBasic = {
  id: string;
  studentId: string;
  dateKey: string;
  status: "PRESENT" | "ABSENT";
  dailySent: boolean;
  dailySentAt: string | null;
  dailySentError: string | null;
  quranNew?: string | null;
  quranRevision?: string | null;
  quranTaqeen?: string | null;
  noorLearned?: string | null;
  noorHomework?: boolean | null;
  noorHomeworkGrade?: number | null;
  noorParticipation?: number | null;
  behaviorGrade?: number | null;
  behaviorNotes?: string | null;
};

type StudentBasic = {
  id: string;
  fullName: string;
  parentWhatsapp: string | null;
  summerGroup: string | null;
  circleId: string | null;
  teacherId: string | null;
  circle: { id: string; name: string } | null;
  teacher: { id: string; fullName: string } | null;
  summerReports: SummerReportBasic[];
};

type SummerAdminDashboardProps = {
  initialCircles: CircleBasic[];
  initialTeachers: UserBasic[];
  initialStudents: StudentBasic[];
};

export default function SummerAdminDashboard({
  initialCircles,
  initialTeachers,
  initialStudents,
}: SummerAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "students" | "circles">("daily");
  const [circles, setCircles] = useState<CircleBasic[]>(initialCircles);
  const [teachers] = useState<UserBasic[]>(initialTeachers);
  const [students, setStudents] = useState<StudentBasic[]>(initialStudents);
  
  // Date states
  const [selectedDate, setSelectedDate] = useState(() => getIstanbulDateKey(new Date()));
  const [reports, setReports] = useState<Record<string, SummerReportBasic>>({});
  const [reportsLoading, setReportsLoading] = useState(false);

  // Student management states
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStudent, setEditingStudent] = useState<StudentBasic | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    parentWhatsapp: "",
    summerGroup: "QURAN",
    circleId: "",
    teacherId: "",
  });

  // Circle management states
  const [showAddCircle, setShowAddCircle] = useState(false);
  const [circleForm, setCircleForm] = useState({
    name: "",
    teacherId: "",
  });

  // Action status indicators
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch reports for the selected date
  useEffect(() => {
    async function fetchReports() {
      setReportsLoading(true);
      try {
        const response = await fetch(`/api/summer/admin/reports?date=${selectedDate}`);
        const data = await response.json();
        if (data.success) {
          const reportsMap: Record<string, SummerReportBasic> = {};
          data.reports.forEach((report: SummerReportBasic) => {
            reportsMap[report.studentId as unknown as string] = report;
          });
          setReports(reportsMap);
        }
      } catch (err) {
        console.error("FAILED TO FETCH REPORTS:", err);
      } finally {
        setReportsLoading(false);
      }
    }
    fetchReports();
  }, [selectedDate]);

  // Handle Add Student
  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setActionMessage(null);
    try {
      const response = await fetch("/api/summer/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });
      const data = await response.json();
      if (data.success) {
        setStudents((prev) => [data.student, ...prev]);
        setShowAddStudent(false);
        setStudentForm({
          fullName: "",
          parentWhatsapp: "",
          summerGroup: "QURAN",
          circleId: "",
          teacherId: "",
        });
        setActionMessage({ text: "تم إضافة الطالب بنجاح", type: "success" });
      } else {
        setActionMessage({ text: data.message || "فشل إضافة الطالب", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: "حدث خطأ غير متوقع", type: "error" });
    }
  }

  // Handle Edit Student
  async function handleEditStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setActionMessage(null);
    try {
      const response = await fetch(`/api/summer/admin/students?id=${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editingStudent.fullName,
          parentWhatsapp: editingStudent.parentWhatsapp,
          summerGroup: editingStudent.summerGroup,
          circleId: editingStudent.circleId,
          teacherId: editingStudent.teacherId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? data.student : s))
        );
        setEditingStudent(null);
        setActionMessage({ text: "تم تحديث بيانات الطالب بنجاح", type: "success" });
      } else {
        setActionMessage({ text: data.message || "فشل تحديث البيانات", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: "حدث خطأ غير متوقع", type: "error" });
    }
  }

  // Handle Delete Student
  async function handleDeleteStudent(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟")) return;
    setActionMessage(null);
    try {
      const response = await fetch(`/api/summer/admin/students?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setActionMessage({ text: "تم حذف الطالب بنجاح", type: "success" });
      } else {
        setActionMessage({ text: data.message || "فشل حذف الطالب", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: "حدث خطأ غير متوقع", type: "error" });
    }
  }

  // Handle Add Circle
  async function handleAddCircle(e: React.FormEvent) {
    e.preventDefault();
    setActionMessage(null);
    try {
      const response = await fetch("/api/summer/admin/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(circleForm),
      });
      const data = await response.json();
      if (data.success) {
        setCircles((prev) => [data.circle, ...prev]);
        setShowAddCircle(false);
        setCircleForm({ name: "", teacherId: "" });
        setActionMessage({ text: "تم إضافة الحلقة بنجاح", type: "success" });
      } else {
        setActionMessage({ text: data.message || "فشل إضافة الحلقة", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: "حدث خطأ غير متوقع", type: "error" });
    }
  }

  // Handle Send Daily WhatsApp Report
  async function handleSendDaily(target: { studentId?: string; circleId?: string; all?: boolean }) {
    setActionMessage(null);
    setSendingId(target.studentId || target.circleId || "all");
    try {
      const response = await fetch("/api/summer/admin/send-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: selectedDate,
          studentId: target.studentId,
          circleId: target.circleId,
          all: target.all,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Refetch reports to show updated sent status
        const reportsRes = await fetch(`/api/summer/admin/reports?date=${selectedDate}`);
        const reportsData = await reportsRes.json();
        if (reportsData.success) {
          const reportsMap: Record<string, SummerReportBasic> = {};
          reportsData.reports.forEach((report: SummerReportBasic) => {
            reportsMap[report.studentId as unknown as string] = report;
          });
          setReports(reportsMap);
        }
        setActionMessage({ text: `تم الإرسال بنجاح. المرسلة: ${data.sentCount}`, type: "success" });
      } else {
        setActionMessage({ text: data.message || "فشل إرسال التقارير اليومية", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: "حدث خطأ أثناء محاولة الإرسال", type: "error" });
    } finally {
      setSendingId(null);
    }
  }

  // Handle Send Weekly WhatsApp Cards
  async function handleSendWeekly(target: { studentId?: string; circleId?: string; all?: boolean }) {
    setActionMessage(null);
    setSendingId(target.studentId || target.circleId || "all_weekly");
    try {
      const response = await fetch("/api/summer/admin/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: target.studentId,
          circleId: target.circleId,
          all: target.all,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage({ text: `تم إرسال الكروت الأسبوعية بنجاح. المرسلة: ${data.sentCount}`, type: "success" });
      } else {
        setActionMessage({ text: data.message || "فشل إرسال الكروت الأسبوعية", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: "حدث خطأ أثناء محاولة إرسال الكروت الأسبوعية", type: "error" });
    } finally {
      setSendingId(null);
    }
  }

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action status message */}
      {actionMessage && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-black shadow-sm ${
            actionMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {actionMessage.type === "success" ? "✅" : "⚠️"} {actionMessage.text}
        </div>
      )}

      {/* Main Admin Tab Buttons */}
      <nav className="flex flex-wrap gap-2 p-1.5 rounded-[2rem] bg-white/50 border border-[#d8bf83]/15 backdrop-blur w-fit">
        <button
          onClick={() => { setActiveTab("daily"); setActionMessage(null); }}
          className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
            activeTab === "daily"
              ? "bg-[#0f5a35] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🗓️ التقارير اليومية والإرسال
        </button>
        <button
          onClick={() => { setActiveTab("weekly"); setActionMessage(null); }}
          className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
            activeTab === "weekly"
              ? "bg-[#0f5a35] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          📊 التقرير الأسبوعي (كروت الأحد)
        </button>
        <button
          onClick={() => { setActiveTab("students"); setActionMessage(null); }}
          className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
            activeTab === "students"
              ? "bg-[#0f5a35] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          👥 إدارة الطلاب
        </button>
        <button
          onClick={() => { setActiveTab("circles"); setActionMessage(null); }}
          className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${
            activeTab === "circles"
              ? "bg-[#0f5a35] text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🏫 إدارة الحلقات
        </button>
      </nav>

      {/* Tab 1: Daily Reports Monitor */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="rounded-3xl border border-[#d8bf83]/20 bg-white/60 p-5 shadow-sm backdrop-blur flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-slate-500">اختر تاريخ اليوم:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-[#d8bf83]/40 bg-[#fffdfa] px-4 py-2 text-sm text-[#1c2d31] outline-none"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSendDaily({ all: true })}
                disabled={sendingId === "all"}
                className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#0a3f2a] disabled:opacity-50"
              >
                {sendingId === "all" ? "⏳ جاري إرسال الكل..." : "🚀 إرسال جميع تقارير اليوم لجميع الحلقات"}
              </button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white/60 border border-[#d8bf83]/20 rounded-3xl">
              <span className="text-xl inline-block animate-spin mr-2">🔄</span>
              <p className="font-bold">جاري تحميل تقارير اليوم المحدد...</p>
            </div>
          ) : circles.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white/60 border border-[#d8bf83]/20 rounded-3xl">
              <p className="font-bold">لا يوجد حلقات مضافة بالدورة الصيفية حالياً.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {circles.map((circle) => {
                const circleStudents = students.filter((s) => s.circleId === circle.id);
                const circleReportedCount = circleStudents.filter((s) => !!reports[s.id]).length;

                return (
                  <div
                    key={circle.id}
                    className="overflow-hidden rounded-3xl border border-[#d8bf83]/20 bg-white/70 shadow-sm backdrop-blur"
                  >
                    <div className="border-b border-[#d8bf83]/10 bg-[#fffaf0]/60 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-[#0a3f2a]">{circle.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          المعلم: {circle.teacher?.fullName || "غير معين"} | رصد التقارير: {circleReportedCount} من {circleStudents.length}
                        </p>
                      </div>
                      {circleStudents.length > 0 && (
                        <button
                          onClick={() => handleSendDaily({ circleId: circle.id })}
                          disabled={sendingId === circle.id}
                          className="rounded-xl border border-[#0f5a35] bg-white text-[#0f5a35] px-4 py-2.5 text-xs font-black transition hover:bg-[#0f5a35]/5 disabled:opacity-50"
                        >
                          {sendingId === circle.id ? "⏳ جاري إرسال التقرير..." : "🚀 إرسال تقارير الحلقة كاملة"}
                        </button>
                      )}
                    </div>

                    {circleStudents.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        لا يوجد طلاب في هذه الحلقة حالياً.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-[#d8bf83]/10 bg-slate-50/50 text-xs font-bold text-slate-500">
                              <th className="px-6 py-3">الطالب</th>
                              <th className="px-6 py-3">مسار</th>
                              <th className="px-6 py-3">تقرير اليوم</th>
                              <th className="px-6 py-3">حضور/غياب</th>
                              <th className="px-6 py-3">الإرسال بالواتساب</th>
                              <th className="px-6 py-3 text-left">إجراء فردي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#d8bf83]/10 text-sm">
                            {circleStudents.map((student) => {
                              const report = reports[student.id];
                              const isFilled = !!report;

                              return (
                                <tr key={student.id} className="transition hover:bg-slate-50/40">
                                  <td className="px-6 py-3.5 font-bold text-slate-800">{student.fullName}</td>
                                  <td className="px-6 py-3.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${student.summerGroup === "QURAN" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-blue-50 text-blue-800 border border-blue-200"}`}>
                                      {student.summerGroup === "QURAN" ? "قرآن" : "نور بيان"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-xs text-slate-600">
                                    {isFilled ? (
                                      report.status === "PRESENT" ? (
                                        student.summerGroup === "QURAN" ? (
                                          <span>جديد: {report.quranNew?.substring(0,20)}... | مراجعة: {report.quranRevision?.substring(0,20)}...</span>
                                        ) : (
                                          <span>تعلم: {report.noorLearned?.substring(0,25)}...</span>
                                        )
                                      ) : (
                                        "غائب"
                                      )
                                    ) : (
                                      <span className="text-amber-600 font-bold">معلق (لم يرصد بعد)</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    {isFilled ? (
                                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-black ${report.status === "PRESENT" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                        {report.status === "PRESENT" ? "حضور" : "غياب"}
                                      </span>
                                    ) : "-"}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    {isFilled ? (
                                      report?.dailySent ? (
                                        <span className="text-green-700 text-xs font-bold block">
                                          ✅ تم الإرسال {report?.dailySentAt && `(${new Date(report.dailySentAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })})`}
                                        </span>
                                      ) : (
                                        <span className="text-amber-600 text-xs font-bold block">⏳ بانتظار الإرسال</span>
                                      )
                                    ) : "-"}
                                  </td>
                                  <td className="px-6 py-3.5 text-left">
                                    <button
                                      onClick={() => handleSendDaily({ studentId: student.id })}
                                      disabled={!isFilled || sendingId === student.id}
                                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        !isFilled
                                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                          : report?.dailySent
                                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                          : "bg-[#bd8f2d] text-white hover:bg-[#a67c25]"
                                      }`}
                                    >
                                      {sendingId === student.id
                                        ? "⏳ إرسال..."
                                        : report?.dailySent
                                        ? "🔄 إعادة إرسال"
                                        : "🚀 إرسال الآن"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Weekly Reports Monitor */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#d8bf83]/20 bg-white/60 p-5 shadow-sm backdrop-blur flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-black text-[#0a3f2a]">التقارير الأسبوعية (كروت التلخيص)</h3>
              <p className="text-xs text-slate-500 mt-1">يتم توليد وإرسال البطاقات التلخيصية للأهالي بنهاية دوام الأحد من كل أسبوع.</p>
            </div>
            
            <button
              onClick={() => handleSendWeekly({ all: true })}
              disabled={sendingId === "all_weekly"}
              className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#0a3f2a] disabled:opacity-50"
            >
              {sendingId === "all_weekly" ? "⏳ جاري الإرسال الجماعي..." : "✉️ إرسال جميع الكروت الأسبوعية لكافة الطلاب"}
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#d8bf83]/20 bg-white/70 shadow-sm backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#d8bf83]/10 bg-[#fffaf0]/60 text-xs font-black text-slate-500">
                    <th className="px-6 py-4">اسم الطالب</th>
                    <th className="px-6 py-4">الحلقة</th>
                    <th className="px-6 py-4">مسار الطالب</th>
                    <th className="px-6 py-4">رقم ولي الأمر</th>
                    <th className="px-6 py-4 text-center">عرض البطاقة</th>
                    <th className="px-6 py-4 text-left">إجراء الإرسال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8bf83]/10 text-sm">
                  {students.map((student) => (
                    <tr key={student.id} className="transition hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-800">{student.fullName}</td>
                      <td className="px-6 py-4 text-slate-600">{student.circle?.name || "بدون حلقة"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-xl text-xs font-black ${student.summerGroup === "QURAN" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>
                          {student.summerGroup === "QURAN" ? "📖 قرآن" : "✨ نور بيان"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{student.parentWhatsapp || "لا يوجد"}</td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/onsite/summer/admin/weekly-card/${student.id}`}
                          target="_blank"
                          className="inline-flex rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition"
                        >
                          👁️ معاينة البطاقة
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSendWeekly({ studentId: student.id })}
                          disabled={sendingId === student.id}
                          className="rounded-xl bg-[#bd8f2d] hover:bg-[#a67c25] px-4 py-2 text-xs font-black text-white shadow-sm transition disabled:opacity-50"
                        >
                          {sendingId === student.id ? "⏳ جاري الإرسال..." : "✉️ إرسال الكارت"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Student Management */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#d8bf83]/20 bg-white/60 p-5 shadow-sm backdrop-blur flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="🔍 ابحث عن اسم الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl border border-[#d8bf83]/40 bg-[#fffdfa] px-4 py-2.5 text-sm text-[#1c2d31] outline-none max-w-sm w-full"
            />
            
            <button
              onClick={() => { setShowAddStudent(true); setEditingStudent(null); }}
              className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#0a3f2a]"
            >
              ➕ إضافة طالب جديد بالدورة
            </button>
          </div>

          {/* Add / Edit Form Modal (inline) */}
          {(showAddStudent || editingStudent) && (
            <div className="rounded-3xl border border-[#bd8f2d]/30 bg-[#fffcf5] p-6 shadow-md">
              <h3 className="text-[#0a3f2a] font-black text-base border-b border-[#d8bf83]/20 pb-3 mb-4">
                {editingStudent ? `✏️ تعديل بيانات الطالب: ${editingStudent.fullName}` : "➕ إضافة طالب جديد بالدورة الصيفية"}
              </h3>
              
              <form onSubmit={editingStudent ? handleEditStudent : handleAddStudent} className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 items-end">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">اسم الطالب الثلاثي</label>
                  <input
                    type="text"
                    value={editingStudent ? editingStudent.fullName : studentForm.fullName}
                    onChange={(e) => {
                      if (editingStudent) {
                        setEditingStudent({ ...editingStudent, fullName: e.target.value });
                      } else {
                        setStudentForm({ ...studentForm, fullName: e.target.value });
                      }
                    }}
                    placeholder="مثال: يوسف أحمد سليم"
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">رقم واتساب ولي الأمر (مع المفتاح الدولي)</label>
                  <input
                    type="text"
                    value={editingStudent ? (editingStudent.parentWhatsapp || "") : studentForm.parentWhatsapp}
                    onChange={(e) => {
                      if (editingStudent) {
                        setEditingStudent({ ...editingStudent, parentWhatsapp: e.target.value });
                      } else {
                        setStudentForm({ ...studentForm, parentWhatsapp: e.target.value });
                      }
                    }}
                    placeholder="مثال: 905330000000"
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">المسار الدراسي بالدورة</label>
                  <select
                    value={editingStudent ? (editingStudent.summerGroup || "QURAN") : studentForm.summerGroup}
                    onChange={(e) => {
                      if (editingStudent) {
                        setEditingStudent({ ...editingStudent, summerGroup: e.target.value });
                      } else {
                        setStudentForm({ ...studentForm, summerGroup: e.target.value });
                      }
                    }}
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                  >
                    <option value="QURAN">📖 قرآن كريم</option>
                    <option value="NOOR_AL_BAYAN">✨ نور البيان</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">الحلقة الصيفية</label>
                  <select
                    value={editingStudent ? (editingStudent.circleId || "") : studentForm.circleId}
                    onChange={(e) => {
                      if (editingStudent) {
                        setEditingStudent({ ...editingStudent, circleId: e.target.value || null });
                      } else {
                        setStudentForm({ ...studentForm, circleId: e.target.value });
                      }
                    }}
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                    required
                  >
                    <option value="">-- اختر الحلقة --</option>
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">المعلم المتابع</label>
                  <select
                    value={editingStudent ? (editingStudent.teacherId || "") : studentForm.teacherId}
                    onChange={(e) => {
                      if (editingStudent) {
                        setEditingStudent({ ...editingStudent, teacherId: e.target.value });
                      } else {
                        setStudentForm({ ...studentForm, teacherId: e.target.value });
                      }
                    }}
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                    required
                  >
                    <option value="">-- اختر المعلم --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-2xl bg-[#0f5a35] text-white px-5 py-2.5 text-sm font-bold shadow hover:bg-[#0a3f2a] flex-1"
                  >
                    حفظ البيانات
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddStudent(false); setEditingStudent(null); }}
                    className="rounded-2xl bg-slate-200 text-slate-700 px-4 py-2.5 text-sm font-bold hover:bg-slate-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Students list table */}
          <div className="overflow-hidden rounded-3xl border border-[#d8bf83]/20 bg-white/70 shadow-sm backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#d8bf83]/10 bg-[#fffaf0]/60 text-xs font-black text-slate-500">
                    <th className="px-6 py-4">اسم الطالب</th>
                    <th className="px-6 py-4">المجموعة</th>
                    <th className="px-6 py-4">الحلقة الحالية</th>
                    <th className="px-6 py-4">المعلم</th>
                    <th className="px-6 py-4">واتساب ولي الأمر</th>
                    <th className="px-6 py-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8bf83]/10 text-sm">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        لم يتم العثور على أي طلاب مطابقين للبحث.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="transition hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{student.fullName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs ${student.summerGroup === "QURAN" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-blue-50 text-blue-800 border border-blue-100"}`}>
                            {student.summerGroup === "QURAN" ? "📖 قرآن" : "✨ نور بيان"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{student.circle?.name || "بدون حلقة"}</td>
                        <td className="px-6 py-4 text-slate-600">{student.teacher?.fullName || "غير معين"}</td>
                        <td className="px-6 py-4 font-mono text-slate-600">{student.parentWhatsapp}</td>
                        <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                          <button
                            onClick={() => { setEditingStudent(student); setShowAddStudent(false); }}
                            className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold transition"
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-xs font-bold transition"
                          >
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Circle Management */}
      {activeTab === "circles" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#d8bf83]/20 bg-white/60 p-5 shadow-sm backdrop-blur flex justify-between items-center">
            <h3 className="text-base font-black text-[#0a3f2a]">إدارة الحلقات بالدورة الصيفية</h3>
            <button
              onClick={() => setShowAddCircle(true)}
              className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#0a3f2a]"
            >
              ➕ إنشاء حلقة صيفية جديدة
            </button>
          </div>

          {/* Add Circle Form Inline */}
          {showAddCircle && (
            <div className="rounded-3xl border border-[#bd8f2d]/30 bg-[#fffcf5] p-6 shadow-md max-w-xl">
              <h3 className="text-[#0a3f2a] font-black text-base border-b border-[#d8bf83]/20 pb-3 mb-4">
                ➕ إنشاء حلقة جديدة بالدورة
              </h3>
              
              <form onSubmit={handleAddCircle} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">اسم الحلقة</label>
                  <input
                    type="text"
                    value={circleForm.name}
                    onChange={(e) => setCircleForm({ ...circleForm, name: e.target.value })}
                    placeholder="مثال: حلقة عثمان بن عفان"
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-600">المعلم المسؤول</label>
                  <select
                    value={circleForm.teacherId}
                    onChange={(e) => setCircleForm({ ...circleForm, teacherId: e.target.value })}
                    className="w-full rounded-2xl border border-[#d8bf83]/40 bg-white px-4 py-2.5 text-sm text-[#1c2d31] outline-none"
                    required
                  >
                    <option value="">-- اختر المعلم --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-2xl bg-[#0f5a35] text-white px-5 py-2.5 text-sm font-bold shadow hover:bg-[#0a3f2a] flex-1"
                  >
                    حفظ الحلقة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCircle(false)}
                    className="rounded-2xl bg-slate-200 text-slate-700 px-4 py-2.5 text-sm font-bold hover:bg-slate-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Circles list */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {circles.map((circle) => {
              const circleStudentsCount = students.filter((s) => s.circleId === circle.id).length;

              return (
                <div
                  key={circle.id}
                  className="rounded-3xl border border-[#d8bf83]/20 bg-white/70 p-6 shadow-sm backdrop-blur flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-flex rounded-full bg-[#0f5a35]/10 px-3 py-1 text-xs font-bold text-[#0f5a35]">
                      الدورة الصيفية
                    </span>
                    <h4 className="mt-3 text-xl font-black text-[#0a3f2a]">{circle.name}</h4>
                    <p className="mt-2 text-sm text-slate-500">المعلم: {circle.teacher?.fullName || "غير معين"}</p>
                    <p className="mt-4 text-xs font-bold text-slate-400">عدد الطلاب المسجلين بالحلقة: {circleStudentsCount} طالب</p>
                  </div>
                  
                  <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
                    يمكن نقل وتعديل طلاب هذه الحلقة عبر تبويب "إدارة الطلاب".
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
