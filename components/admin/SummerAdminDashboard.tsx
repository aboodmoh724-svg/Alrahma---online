"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EducationPlanTopic } from "@/lib/summer-education-plan";

type TeacherOption = { id: string; fullName: string };
type CircleOption = { id: string; name: string; teacher?: TeacherOption | null };

type StudentData = {
  id: string;
  fullName: string;
  studentCode: string | null;
  parentWhatsapp: string | null;
  summerGroup: string | null;
  circle?: CircleOption | null;
  teacher?: TeacherOption | null;
  summerReports?: Array<{
    id: string;
    dateKey: string;
    status: string;
    dailySent: boolean;
  }>;
};

type SummerAdminDashboardProps = {
  initialStudents: StudentData[];
  initialCircles: CircleOption[];
  initialTeachers: TeacherOption[];
  initialEducationTopics: EducationPlanTopic[];
};

export default function SummerAdminDashboard({
  initialStudents,
  initialCircles,
  initialTeachers,
  initialEducationTopics,
}: SummerAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "circles" | "daily_send" | "weekly_send" | "education_plan"
  >("overview");

  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [circles, setCircles] = useState<CircleOption[]>(initialCircles);
  const [teachers] = useState<TeacherOption[]>(initialTeachers);
  const [educationTopics, setEducationTopics] = useState<EducationPlanTopic[]>(initialEducationTopics);

  // Student Form Modal State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentId: "",
    fullName: "",
    parentWhatsapp: "",
    summerGroup: "QURAN",
    circleId: "",
    teacherId: teachers[0]?.id || "",
  });
  const [savingStudent, setSavingStudent] = useState(false);

  // Circle Form Modal State
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [circleTeacherId, setCircleTeacherId] = useState(teachers[0]?.id || "");
  const [savingCircle, setSavingCircle] = useState(false);

  // WhatsApp Batch Sending State
  const [sendingDaily, setSendingDaily] = useState(false);
  const [dailyStatusMsg, setDailyStatusMsg] = useState("");

  // Education Plan Form State
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<"KIBAR" | "SIGHAR">("SIGHAR");
  const [newTopicDetails, setNewTopicDetails] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const quranCount = students.filter((s) => s.summerGroup === "QURAN").length;
  const noorCount = students.filter((s) => s.summerGroup === "NOOR_AL_BAYAN").length;
  const reportsFilledToday = students.filter(
    (s) => s.summerReports && s.summerReports.length > 0 && s.summerReports[0].dateKey === todayStr
  ).length;

  // Add / Edit Student Handler
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudent(true);

    try {
      const isEdit = Boolean(studentForm.studentId);
      const url = "/api/summer/admin/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ الطالب");

      // Refresh list
      const refRes = await fetch("/api/summer/admin/students");
      const refData = await refRes.json();
      if (refData.success) {
        setStudents(refData.students);
      }

      setShowStudentModal(false);
      setStudentForm({
        studentId: "",
        fullName: "",
        parentWhatsapp: "",
        summerGroup: "QURAN",
        circleId: "",
        teacherId: teachers[0]?.id || "",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الطالب");
    } finally {
      setSavingStudent(false);
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async (id: string) => {
    if (!confirm("هل أنت تأكد من إغلاق سجل هذا الطالب؟")) return;

    try {
      const res = await fetch(`/api/summer/admin/students?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("فشل الحذف");

      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء الحذف");
    }
  };

  // Add Circle Handler
  const handleSaveCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCircle(true);

    try {
      const res = await fetch("/api/summer/admin/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: circleName, teacherId: circleTeacherId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إضافة الحلقة");

      setCircles((prev) => [data.circle, ...prev]);
      setShowCircleModal(false);
      setCircleName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الحلقة");
    } finally {
      setSavingCircle(false);
    }
  };

  // Send Daily WhatsApp Batch
  const handleSendDailyWhatsApp = async () => {
    if (!confirm("هل ترغب في إرسال تقارير اليوم لجميع أولياء الأمور عبر الواتساب الآن؟")) return;

    setSendingDaily(true);
    setDailyStatusMsg("جاري الإرسال عبر الواتساب...");

    try {
      const res = await fetch("/api/summer/admin/send-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: todayStr }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");

      setDailyStatusMsg(
        `✅ تم الإرسال بنجاح! تم إرسال: ${data.sentCount} تقريراً (فشل: ${data.failCount})`
      );
    } catch (err) {
      setDailyStatusMsg(`❌ خطأ: ${err instanceof Error ? err.message : "فشل الإرسال"}`);
    } finally {
      setSendingDaily(false);
    }
  };

  // Send Single Weekly Card WhatsApp
  const handleSendWeeklyCard = async (studentId: string, topicTitle?: string) => {
    try {
      const res = await fetch("/api/summer/admin/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, topicTitle }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");

      alert("✅ تم إرسال بطاقة التقرير الأسبوعي عبر الواتساب بنجاح!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ في الإرسال");
    }
  };

  // Save New Education Topic
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    setSavingTopic(true);
    try {
      const newTopic: EducationPlanTopic = {
        id: `t_${Date.now()}`,
        category: newTopicCategory,
        weekNumber: educationTopics.length + 1,
        title: newTopicTitle.trim(),
        details: newTopicDetails.trim(),
      };

      const updated = [...educationTopics, newTopic];
      const res = await fetch("/api/summer/admin/education-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: updated }),
      });

      if (!res.ok) throw new Error("فشل حفظ خطة التربية");

      setEducationTopics(updated);
      setNewTopicTitle("");
      setNewTopicDetails("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ أثناء حفظ الدروس");
    } finally {
      setSavingTopic(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-[#18322a]" dir="rtl">
      {/* Top Banner with Luxury Gold Gradient Accent */}
      <header className="relative overflow-hidden rounded-3xl border-2 border-[#d8bf83] bg-gradient-to-br from-[#0f5a35] via-[#126b3f] to-[#0a3f2a] p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 h-full w-full opacity-10 pointer-events-none bg-[radial-gradient(#bd8f2d_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 rounded-2xl bg-white p-2 shadow-lg ring-4 ring-[#bd8f2d]/40">
              <Image
                src="/images/summer_quran_logo_v2.jpg"
                alt="شعار الدورة الصيفية"
                width={80}
                height={80}
                className="h-20 w-20 rounded-xl object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#bd8f2d]/25 border border-[#bd8f2d]/40 px-3.5 py-1 text-xs font-bold text-[#fbf6ef]">
                <span>🌟</span> إدارة الدورة الصيفية القرآنية ونور البيان
              </div>
              <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl tracking-tight font-serif">
                منصة إدارة الدورة الصيفية المركزية
              </h1>
              <p className="mt-1 text-xs font-bold text-emerald-100">
                تاريخ اليوم: <span className="font-mono text-[#f6eee7]">{todayStr}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/api/logout"
              className="rounded-2xl border border-red-300/40 bg-red-600/80 px-4 py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md backdrop-blur-sm transition"
            >
              🚪 تسجيل الخروج
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-2 overflow-x-auto rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-2 shadow-md">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 shrink-0 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
            activeTab === "overview"
              ? "bg-[#0f5a35] text-white shadow-lg ring-2 ring-[#bd8f2d]"
              : "text-[#18322a]/80 hover:bg-[#f6eee7]"
          }`}
        >
          📊 الملخص والإحصائيات
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 shrink-0 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
            activeTab === "students"
              ? "bg-[#0f5a35] text-white shadow-lg ring-2 ring-[#bd8f2d]"
              : "text-[#18322a]/80 hover:bg-[#f6eee7]"
          }`}
        >
          👥 إدارة الطلاب ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("circles")}
          className={`flex items-center gap-2 shrink-0 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
            activeTab === "circles"
              ? "bg-[#0f5a35] text-white shadow-lg ring-2 ring-[#bd8f2d]"
              : "text-[#18322a]/80 hover:bg-[#f6eee7]"
          }`}
        >
          🏫 الحلقات والمعلمون ({circles.length})
        </button>
        <button
          onClick={() => setActiveTab("daily_send")}
          className={`flex items-center gap-2 shrink-0 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
            activeTab === "daily_send"
              ? "bg-[#0f5a35] text-white shadow-lg ring-2 ring-[#bd8f2d]"
              : "text-[#18322a]/80 hover:bg-[#f6eee7]"
          }`}
        >
          📱 التقارير والواتساب اليومي
        </button>
        <button
          onClick={() => setActiveTab("weekly_send")}
          className={`flex items-center gap-2 shrink-0 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
            activeTab === "weekly_send"
              ? "bg-[#0f5a35] text-white shadow-lg ring-2 ring-[#bd8f2d]"
              : "text-[#18322a]/80 hover:bg-[#f6eee7]"
          }`}
        >
          🖼️ بطاقات الأداء الأسبوعية
        </button>
        <button
          onClick={() => setActiveTab("education_plan")}
          className={`flex items-center gap-2 shrink-0 rounded-2xl px-5 py-3 text-sm font-black transition-all ${
            activeTab === "education_plan"
              ? "bg-[#0f5a35] text-white shadow-lg ring-2 ring-[#bd8f2d]"
              : "text-[#18322a]/80 hover:bg-[#f6eee7]"
          }`}
        >
          📚 خطة دروس التربية
        </button>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border-t-4 border-t-[#0f5a35] border border-[#d8bf83]/50 bg-[#fffaf4] p-6 shadow-md">
              <span className="text-xs font-bold text-[#18322a]/60">إجمالي الطلاب المسجلين</span>
              <p className="mt-2 text-3xl font-black text-[#0f5a35]">{students.length}</p>
            </div>
            <div className="rounded-3xl border-t-4 border-t-[#bd8f2d] border border-[#d8bf83]/50 bg-[#fffaf4] p-6 shadow-md">
              <span className="text-xs font-bold text-[#18322a]/60">طلاب مسار القرآن الكريم</span>
              <p className="mt-2 text-3xl font-black text-[#bd8f2d]">{quranCount}</p>
            </div>
            <div className="rounded-3xl border-t-4 border-t-blue-600 border border-[#d8bf83]/50 bg-[#fffaf4] p-6 shadow-md">
              <span className="text-xs font-bold text-[#18322a]/60">طلاب نور البيان والتمهيدي</span>
              <p className="mt-2 text-3xl font-black text-blue-700">{noorCount}</p>
            </div>
            <div className="rounded-3xl border-t-4 border-t-emerald-600 border border-[#d8bf83]/50 bg-[#fffaf4] p-6 shadow-md">
              <span className="text-xs font-bold text-[#18322a]/60">تقارير اليوم المكتملة</span>
              <p className="mt-2 text-3xl font-black text-emerald-800">{reportsFilledToday}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-6 shadow-md">
            <h3 className="text-xl font-black text-[#0f5a35]">توجيهات العمل اليومي للدورة الصيفية</h3>
            <p className="mt-2 text-sm font-bold leading-relaxed text-[#18322a]/80">
              مرحباً بكم في اللوحة التنفيذية للدورة الصيفية. يمكنك إضافة الطلاب وتصنيفهم حسب مسارهم (قرآن / نور بيان)، متابعة رصد المعلمين للتقارير، وإرسال التقارير الفردية والأسبوعية لأولياء الأمور عبر الواتساب بنقرة واحدة.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS MANAGEMENT */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0f5a35]">سجل طلاب الدورة الصيفية</h2>
              <p className="text-xs font-bold text-[#bd8f2d]">إضافة وتحديث بيانات طلاب القرآن الكريم ونور البيان</p>
            </div>
            <button
              onClick={() => {
                setStudentForm({
                  studentId: "",
                  fullName: "",
                  parentWhatsapp: "",
                  summerGroup: "QURAN",
                  circleId: circles[0]?.id || "",
                  teacherId: teachers[0]?.id || "",
                });
                setShowStudentModal(true);
              }}
              className="rounded-2xl bg-[#0f5a35] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[#0a3f2a] transition"
            >
              ➕ إضافة طالب جديد
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] shadow-md">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#f6eee7] font-black text-[#0f5a35] border-b border-[#d8bf83]/40">
                <tr>
                  <th className="p-4">الكود والاسم</th>
                  <th className="p-4">نوع الطالب (المسار)</th>
                  <th className="p-4">الحلقة والمعلم</th>
                  <th className="p-4">رقم الواتساب</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8bf83]/30 font-bold">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-white transition">
                    <td className="p-4">
                      <span className="ml-2 font-mono text-xs text-[#bd8f2d]">#{st.studentCode || "-"}</span>
                      <span className="text-base text-[#18322a]">{st.fullName}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-black ${
                          st.summerGroup === "NOOR_AL_BAYAN"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-[#0f5a35]/15 text-[#0f5a35] border border-[#0f5a35]/20"
                        }`}
                      >
                        {st.summerGroup === "NOOR_AL_BAYAN" ? "📘 طالب نور البيان" : "📖 طالب قرآن كريم"}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <div>حلقة: <b className="text-[#0f5a35]">{st.circle?.name || "غير محددة"}</b></div>
                      <div className="text-gray-500">معلم: {st.teacher?.fullName || "-"}</div>
                    </td>
                    <td className="p-4 font-mono text-xs dir-ltr">{st.parentWhatsapp || "-"}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setStudentForm({
                              studentId: st.id,
                              fullName: st.fullName,
                              parentWhatsapp: st.parentWhatsapp || "",
                              summerGroup: st.summerGroup || "QURAN",
                              circleId: st.circle?.id || "",
                              teacherId: st.teacher?.id || teachers[0]?.id || "",
                            });
                            setShowStudentModal(true);
                          }}
                          className="rounded-xl border border-[#d8bf83] px-3.5 py-1.5 text-xs font-black text-[#0f5a35] hover:bg-[#f6eee7]"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id)}
                          className="rounded-xl border border-red-200 px-3.5 py-1.5 text-xs font-black text-red-600 hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CIRCLES */}
      {activeTab === "circles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0f5a35]">حلقات الدورة الصيفية والمعلمون</h2>
            <button
              onClick={() => setShowCircleModal(true)}
              className="rounded-2xl bg-[#0f5a35] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[#0a3f2a]"
            >
              ➕ إضافة حلقة جديدة
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {circles.map((c) => (
              <div key={c.id} className="rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-6 shadow-md">
                <h3 className="text-xl font-black text-[#0f5a35]">{c.name}</h3>
                <p className="mt-2 text-xs font-bold text-[#bd8f2d]">
                  المعلم المسؤول: {c.teacher?.fullName || "غير محدد"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY WHATSAPP SEND */}
      {activeTab === "daily_send" && (
        <div className="space-y-4 rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-8 shadow-md">
          <h2 className="text-xl font-black text-[#0f5a35]">📱 مركز إرسال التقارير اليومية عبر الواتساب</h2>
          <p className="text-sm font-bold text-[#18322a]/80">
            يمكنك بث وتوزيع كافة التقارير اليومية لأولياء الأمور بنقرة واحدة.
          </p>

          <div className="mt-6">
            <button
              onClick={handleSendDailyWhatsApp}
              disabled={sendingDaily}
              className="rounded-2xl bg-[#0f5a35] px-8 py-4 text-base font-black text-white shadow-xl transition hover:bg-[#0a3f2a] disabled:opacity-50"
            >
              {sendingDaily ? "جاري الإرسال عبر الواتساب..." : "🚀 إرسال تقارير اليوم لكل أولياء الأمور الآن"}
            </button>

            {dailyStatusMsg && (
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-[#0f5a35] border border-[#d8bf83]">
                {dailyStatusMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: WEEKLY CARDS SEND */}
      {activeTab === "weekly_send" && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0f5a35]">🖼️ بطاقات التقارير الأسبوعية (تصميم أفايون الفاخر)</h2>
          <p className="text-sm font-bold text-[#bd8f2d]">
            بطاقة أداء أسبوعية مصممة بنمط الشهادات القرآنية الفاخرة لكل طالب
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-5 shadow-md">
                <div>
                  <h4 className="text-lg font-black text-[#18322a]">{s.fullName}</h4>
                  <p className="text-xs font-bold text-[#bd8f2d]">
                    {s.summerGroup === "NOOR_AL_BAYAN" ? "📘 نور البيان" : "📖 قرآن كريم"} | حلقة: {s.circle?.name || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/onsite/summer/admin/weekly-card/${s.id}`}
                    target="_blank"
                    className="rounded-xl border border-[#d8bf83] bg-white px-3.5 py-2 text-xs font-black text-[#0f5a35] hover:bg-[#f6eee7]"
                  >
                    🔍 معاينة البطاقة
                  </Link>
                  <button
                    onClick={() => handleSendWeeklyCard(s.id)}
                    className="rounded-xl bg-[#0f5a35] px-3.5 py-2 text-xs font-black text-white hover:bg-[#0a3f2a]"
                  >
                    📲 إرسال للواتساب
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: EDUCATION PLAN */}
      {activeTab === "education_plan" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-6 shadow-md">
            <h3 className="text-xl font-black text-[#0f5a35]">إضافة درس جديد لخطة التربية الأسبوعية</h3>
            <form onSubmit={handleSaveTopic} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold">الفئة المستهدفة</label>
                  <select
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value as "KIBAR" | "SIGHAR")}
                    className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none"
                  >
                    <option value="SIGHAR">خطة الصغار</option>
                    <option value="KIBAR">خطة الكبار</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">عنوان الدرس</label>
                  <input
                    type="text"
                    required
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="مثال: التوحيد والآداب الإسلامية"
                    className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold">تفاصيل ومحاور الدرس</label>
                <textarea
                  rows={2}
                  value={newTopicDetails}
                  onChange={(e) => setNewTopicDetails(e.target.value)}
                  placeholder="محاور ومخرجات الدرس الوعظي أو التربوي..."
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingTopic}
                className="rounded-xl bg-[#0f5a35] px-6 py-3 text-sm font-black text-white hover:bg-[#0a3f2a]"
              >
                {savingTopic ? "جاري الحفظ..." : "➕ حفظ الدرس في الخطة"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-6 shadow-md">
            <h3 className="text-xl font-black text-[#0f5a35] mb-4">قائمة دروس خطة التربية المعتمَدة</h3>
            <div className="space-y-3">
              {educationTopics.map((t) => (
                <div key={t.id} className="rounded-2xl border border-[#d8bf83]/40 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      t.category === "SIGHAR" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                    }`}>
                      {t.category === "SIGHAR" ? "خطة الصغار" : "خطة الكبار"}
                    </span>
                    <span className="text-xs font-bold text-gray-500">الأسبوع #{t.weekNumber}</span>
                  </div>
                  <h4 className="mt-2 text-base font-black text-[#18322a]">{t.title}</h4>
                  <p className="mt-1 text-xs text-gray-600">{t.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-[#fffaf4] p-6 shadow-2xl dir-rtl border border-[#d8bf83]" dir="rtl">
            <h3 className="text-xl font-black text-[#0f5a35] mb-4 border-b border-[#d8bf83]/30 pb-3">
              {studentForm.studentId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold">اسم الطالب الرباعي</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="مثال: عبد الرحمن محمد العلي"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">نوع الطالب (مسار الدراسة)</label>
                <select
                  value={studentForm.summerGroup}
                  onChange={(e) => setStudentForm({ ...studentForm, summerGroup: e.target.value })}
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                >
                  <option value="QURAN">📖 طالب قرآن كريم</option>
                  <option value="NOOR_AL_BAYAN">📘 طالب نور البيان والتمهيدي</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">رقم الواتساب لولي الأمر</label>
                <input
                  type="text"
                  value={studentForm.parentWhatsapp}
                  onChange={(e) => setStudentForm({ ...studentForm, parentWhatsapp: e.target.value })}
                  placeholder="مثال: 905555555555"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold">الحلقة</label>
                  <select
                    value={studentForm.circleId}
                    onChange={(e) => setStudentForm({ ...studentForm, circleId: e.target.value })}
                    className="w-full rounded-xl border border-[#d8bf83] bg-white p-2.5 text-sm font-bold outline-none"
                  >
                    <option value="">بدون حلقة</option>
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold">المعلم</label>
                  <select
                    value={studentForm.teacherId}
                    onChange={(e) => setStudentForm({ ...studentForm, teacherId: e.target.value })}
                    className="w-full rounded-xl border border-[#d8bf83] bg-white p-2.5 text-sm font-bold outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#d8bf83]/30 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="rounded-xl bg-[#0f5a35] px-6 py-2 text-sm font-black text-white hover:bg-[#0a3f2a]"
                >
                  {savingStudent ? "جاري الحفظ..." : "حفظ الطالب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CIRCLE MODAL */}
      {showCircleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-[#fffaf4] p-6 shadow-2xl dir-rtl border border-[#d8bf83]" dir="rtl">
            <h3 className="text-xl font-black text-[#0f5a35] mb-4 border-b border-[#d8bf83]/30 pb-3">إضافة حلقة صيفية جديدة</h3>
            <form onSubmit={handleSaveCircle} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold">اسم الحلقة</label>
                <input
                  type="text"
                  required
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="مثال: حلقة الفجر (قرآن)"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">المعلم المسؤول</label>
                <select
                  value={circleTeacherId}
                  onChange={(e) => setCircleTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#d8bf83]/30 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCircleModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingCircle}
                  className="rounded-xl bg-[#0f5a35] px-6 py-2 text-sm font-black text-white hover:bg-[#0a3f2a]"
                >
                  {savingCircle ? "جاري الحفظ..." : "إضافة الحلقة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
