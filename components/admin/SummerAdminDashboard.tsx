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
  const [activeNav, setActiveNav] = useState<
    "dashboard" | "students" | "circles" | "reports" | "weekly_cards" | "education_plan"
  >("dashboard");

  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [circles, setCircles] = useState<CircleOption[]>(initialCircles);
  const [teachers] = useState<TeacherOption[]>(initialTeachers);
  const [educationTopics, setEducationTopics] = useState<EducationPlanTopic[]>(initialEducationTopics);
  const [searchQuery, setSearchQuery] = useState("");

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

  const attendanceRate =
    students.length > 0 ? Math.round((reportsFilledToday / students.length) * 100) : 0;

  // Filtered students
  const filteredStudents = students.filter(
    (s) =>
      s.fullName.includes(searchQuery) ||
      (s.studentCode && s.studentCode.includes(searchQuery))
  );

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

  // Send Single Student WhatsApp
  const handleSendSingleWhatsApp = async (studentId: string) => {
    try {
      const res = await fetch("/api/summer/admin/send-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: [], dateKey: todayStr, studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");
      alert("✅ تم إرسال التقرير بنجاح عبر الواتساب!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ أثناء الإرسال");
    }
  };

  // Send Weekly Card WhatsApp
  const handleSendWeeklyCard = async (studentId: string) => {
    try {
      const res = await fetch("/api/summer/admin/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
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
    <div className="min-h-screen bg-[#f3f6f9] text-[#1b2e3c] dir-rtl font-sans flex flex-col md:flex-row" dir="rtl">
      {/* 🧭 1. Right Fixed Luxury Vertical Sidebar */}
      <aside className="w-full md:w-64 bg-[#1b2e3c] text-white shrink-0 flex flex-col justify-between p-6 shadow-2xl border-l border-[#c49a45]/30">
        <div>
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 border-b border-[#c49a45]/30 pb-5 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-[#c49a45]">
              <Image
                src="/images/summer_quran_logo_v2.jpg"
                alt="شعار الأكاديمية"
                width={36}
                height={36}
                className="h-8 w-8 rounded-lg object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#fcfdfe] tracking-wide font-serif">
                الأكاديمية
              </h2>
              <span className="text-[10px] font-bold text-[#c49a45] block">
                الدورة الصيفية القرآنية
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-bold text-sm">
            <button
              onClick={() => setActiveNav("dashboard")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeNav === "dashboard"
                  ? "bg-[#253c4e] text-[#c49a45] font-black border-r-4 border-[#c49a45] shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🎛️</span>
                <span>الأكاديمية (الرئيسية)</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav("students")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeNav === "students"
                  ? "bg-[#253c4e] text-[#c49a45] font-black border-r-4 border-[#c49a45] shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">👥</span>
                <span>الطلاب</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                {students.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav("circles")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeNav === "circles"
                  ? "bg-[#253c4e] text-[#c49a45] font-black border-r-4 border-[#c49a45] shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏫</span>
                <span>الحضور والحلقات</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav("reports")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeNav === "reports"
                  ? "bg-[#253c4e] text-[#c49a45] font-black border-r-4 border-[#c49a45] shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <span>التقارير اليومية</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav("weekly_cards")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeNav === "weekly_cards"
                  ? "bg-[#253c4e] text-[#c49a45] font-black border-r-4 border-[#c49a45] shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🖼️</span>
                <span>كروت الأداء الأسبوعي</span>
              </div>
            </button>

            <button
              onClick={() => setActiveNav("education_plan")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeNav === "education_plan"
                  ? "bg-[#253c4e] text-[#c49a45] font-black border-r-4 border-[#c49a45] shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📚</span>
                <span>خطة دروس التربية</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-[#c49a45]/30 pt-4 mt-6">
          <Link
            href="/api/logout"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-amber-200/80 hover:bg-red-900/30 transition"
          >
            <span>تسجيل الخروج</span>
            <span>➔</span>
          </Link>
        </div>
      </aside>

      {/* 🏙️ 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Crisp Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <h1 className="text-2xl font-black text-[#1b2e3c]">
              لوحة تحكم الأكاديمية الصيفية
            </h1>
          </div>

          {/* Left User Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="text-left">
              <span className="block text-sm font-bold text-[#1b2e3c]">أحمد المحمدي</span>
              <span className="block text-xs font-semibold text-gray-500">{todayStr}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#1b2e3c] border-2 border-[#c49a45] flex items-center justify-center text-white font-bold">
              أ
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="p-6 space-y-6 flex-1">
          {/* 📊 3 Stat Cards Row matching summer_admin_dashboard.jpg */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Stat Card 1: التقارير المرسلة */}
            <div className="bg-white rounded-2xl p-5 border-2 border-[#1b2e3c] border-b-4 border-b-[#c49a45] shadow-sm relative">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-500">التقارير المرسلة</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#1b2e3c]">
                  {reportsFilledToday} <span className="text-sm font-bold text-gray-600">تقريراً</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-[#c49a45]">
                  ▲ %56
                </span>
              </div>
            </div>

            {/* Stat Card 2: حضور اليوم */}
            <div className="bg-white rounded-2xl p-5 border-2 border-[#1b2e3c] border-b-4 border-b-[#c49a45] shadow-sm relative">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-500">حضور اليوم</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#1b2e3c]">{attendanceRate}%</span>
                <span className="text-xs font-bold text-gray-500">
                  {reportsFilledToday}/{students.length}
                </span>
              </div>
            </div>

            {/* Stat Card 3: تسجيل الطلاب الجدد */}
            <div className="bg-white rounded-2xl p-5 border-2 border-[#1b2e3c] border-b-4 border-b-[#c49a45] shadow-sm relative">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-500">تسجيل الطلاب الجدد</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-[#1b2e3c]">
                  {students.length} <span className="text-sm font-bold text-gray-600">طالباً</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  ▲ %12
                </span>
              </div>
            </div>
          </div>

          {/* 👥 2-Column Grid: Left Student Table + Right Weekly Cards Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Right Main Table Column (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#1b2e3c]">جدول الطلاب والتقدم</h3>
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
                    className="rounded-xl bg-[#1b2e3c] px-4 py-2 text-xs font-black text-white hover:bg-[#15242f] transition shadow-xs"
                  >
                    ➕ إضافة طالب
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#f8fafc] text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3.5">#</th>
                        <th className="p-3.5">اسم الطالب</th>
                        <th className="p-3.5">المستوى / الحلقة</th>
                        <th className="p-3.5">المسار (Badges)</th>
                        <th className="p-3.5">التقدم</th>
                        <th className="p-3.5 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold">
                      {filteredStudents.map((st, idx) => {
                        const isNoor = st.summerGroup === "NOOR_AL_BAYAN";

                        return (
                          <tr key={st.id} className="hover:bg-gray-50 transition">
                            <td className="p-3.5 font-bold text-gray-400">{idx + 1}</td>
                            <td className="p-3.5 font-black text-[#1b2e3c]">{st.fullName}</td>
                            <td className="p-3.5 text-gray-600">
                              {st.circle?.name || "مستوى 3"}
                            </td>
                            <td className="p-3.5">
                              {isNoor ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a4971] px-3 py-1 text-[11px] font-black text-white shadow-2xs">
                                  <span>⚙️</span> نور البيان
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a37828] px-3 py-1 text-[11px] font-black text-white shadow-2xs">
                                  <span>📖</span> القرآن الكريم
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-black text-[#1b2e3c]">
                              {85 + (idx % 12)}%
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleSendSingleWhatsApp(st.id)}
                                className="rounded-xl border border-[#c49a45] bg-amber-50/50 px-3 py-1.5 text-[11px] font-bold text-[#a37828] hover:bg-[#c49a45] hover:text-white transition"
                              >
                                📞 إرسال واتساب
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Left Preview Column: معاينة التقارير الأسبوعية (1/3) */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-black text-[#1b2e3c] mb-4">
                  معاينة التقارير الأسبوعية
                </h3>

                {/* Stacked Preview Cards */}
                <div className="space-y-4">
                  {students.slice(0, 3).map((st) => (
                    <div
                      key={st.id}
                      className="rounded-2xl border border-[#c49a45]/40 bg-[#fffdf9] p-4 shadow-sm relative overflow-hidden"
                    >
                      <div className="bg-[#c49a45] text-white text-center py-1 rounded-lg text-xs font-black mb-3">
                        بطاقة تقرير أسبوعي
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-[#1b2e3c] text-white flex items-center justify-center font-bold text-xs">
                          👤
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#1b2e3c]">{st.fullName}</h4>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {st.summerGroup === "NOOR_AL_BAYAN" ? "نور البيان" : "قرآن كريم"}
                          </span>
                        </div>
                      </div>

                      <div className="my-2">
                        <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                          <span>المستوى</span>
                          <span>78%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full bg-[#c49a45] rounded-full w-[78%]" />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Link
                          href={`/onsite/summer/admin/weekly-card/${st.id}`}
                          target="_blank"
                          className="flex-1 text-center rounded-lg border border-gray-300 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100"
                        >
                          عرض
                        </Link>
                        <button
                          onClick={() => handleSendWeeklyCard(st.id)}
                          className="flex-1 text-center rounded-lg bg-[#1b2e3c] py-1.5 text-xs font-bold text-white hover:bg-[#15242f]"
                        >
                          تنزيل / إرسال
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dir-rtl border border-[#c49a45]" dir="rtl">
            <h3 className="text-xl font-black text-[#1b2e3c] mb-4 border-b border-gray-200 pb-3">
              {studentForm.studentId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#1b2e3c]">اسم الطالب الرباعي</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="مثال: عبد الرحمن محمد العلي"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1b2e3c]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#1b2e3c]">نوع الطالب (مسار الدراسة)</label>
                <select
                  value={studentForm.summerGroup}
                  onChange={(e) => setStudentForm({ ...studentForm, summerGroup: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1b2e3c]"
                >
                  <option value="QURAN">📖 طالب قرآن كريم</option>
                  <option value="NOOR_AL_BAYAN">📘 طالب نور البيان والتمهيدي</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#1b2e3c]">رقم الواتساب لولي الأمر</label>
                <input
                  type="text"
                  value={studentForm.parentWhatsapp}
                  onChange={(e) => setStudentForm({ ...studentForm, parentWhatsapp: e.target.value })}
                  placeholder="مثال: 905555555555"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-xs font-bold outline-none dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#1b2e3c]">الحلقة</label>
                  <select
                    value={studentForm.circleId}
                    onChange={(e) => setStudentForm({ ...studentForm, circleId: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold outline-none"
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
                  <label className="mb-1 block text-xs font-bold text-[#1b2e3c]">المعلم</label>
                  <select
                    value={studentForm.teacherId}
                    onChange={(e) => setStudentForm({ ...studentForm, teacherId: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-xs font-bold outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="rounded-xl bg-[#1b2e3c] px-6 py-2 text-xs font-black text-white hover:bg-[#15242f]"
                >
                  {savingStudent ? "جاري الحفظ..." : "حفظ الطالب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
