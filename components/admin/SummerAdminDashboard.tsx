"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EducationPlanTopic } from "@/lib/summer-education-plan";

type TeacherOption = { id: string; fullName: string; email?: string | null };
type CircleOption = {
  id: string;
  name: string;
  teacherId?: string | null;
  teacher?: TeacherOption | null;
  students?: Array<{ id: string; fullName: string; summerGroup?: string | null }>;
};

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
  const [teachers, setTeachers] = useState<TeacherOption[]>(initialTeachers);
  const [educationTopics, setEducationTopics] = useState<EducationPlanTopic[]>(initialEducationTopics);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialEducationTopics[0]?.id || ""
  );

  // Excel File Import State
  const [importingExcel, setImportingExcel] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState("");

  // Modal for Viewing Full Education Topic Details
  const [viewingTopic, setViewingTopic] = useState<EducationPlanTopic | null>(null);

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

  // Teacher Form Modal State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    teacherId: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [savingTeacher, setSavingTeacher] = useState(false);

  // WhatsApp Batch Sending State
  const [sendingDaily, setSendingDaily] = useState(false);
  const [selectedCircleSendId, setSelectedCircleSendId] = useState<string>("ALL");
  const [dailyStatusMsg, setDailyStatusMsg] = useState("");

  // WhatsApp Channel Health & QR State
  const [waChannels, setWaChannels] = useState<any>(null);
  const [loadingWaStatus, setLoadingWaStatus] = useState(false);
  const [qrKey, setQrKey] = useState(0);
  const [broadcastTargetType, setBroadcastTargetType] = useState<
    "CUSTOM_PHONE" | "ALL_PARENTS" | "ALL_TEACHERS" | "CIRCLE_PARENTS" | "SELECTED_STUDENTS"
  >("CUSTOM_PHONE");
  const [targetCircleId, setTargetCircleId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatusMsg, setTestStatusMsg] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  const checkWaStatus = async () => {
    setLoadingWaStatus(true);
    try {
      const res = await fetch("/api/summer/admin/whatsapp-status");
      const data = await res.json();
      if (data.success) {
        setWaChannels(data.channels);
        if (data.recentLogs) {
          setBroadcastHistory(data.recentLogs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWaStatus(false);
    }
  };

  useEffect(() => {
    checkWaStatus();
    const timer = setInterval(() => {
      checkWaStatus();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleBroadcastSend = async () => {
    if (broadcastTargetType === "CUSTOM_PHONE" && !testPhone.trim()) {
      setTestStatusMsg("❌ يرجى إدخال رقم الهاتف المباشر");
      return;
    }
    if (!testMsg.trim()) {
      setTestStatusMsg("❌ يرجى إدخال نص الرسالة المراد إرسالها");
      return;
    }
    setSendingTest(true);
    setTestStatusMsg("جاري بث الرسائل عبر الواتساب...");
    try {
      const res = await fetch("/api/summer/admin/whatsapp-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: broadcastTargetType,
          testPhone,
          testMessage: testMsg,
          circleId: targetCircleId,
          studentIds: selectedStudentIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestStatusMsg(`✅ ${data.message}`);
        checkWaStatus();
      } else {
        setTestStatusMsg(`❌ ${data.error || "فشل الإرسال"}`);
      }
    } catch (e) {
      setTestStatusMsg("❌ حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setSendingTest(false);
    }
  };

  // Education Plan Form State
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<"KIBAR" | "SIGHAR">("SIGHAR");
  const [newTopicDetails, setNewTopicDetails] = useState("");
  const [newTopicGuidelines, setNewTopicGuidelines] = useState("");
  const [newTopicHomework, setNewTopicHomework] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const quranCount = students.filter((s) => s.summerGroup === "QURAN").length;
  const noorCount = students.filter((s) => s.summerGroup === "NOOR_AL_BAYAN").length;
  const reportsFilledToday = students.filter(
    (s) => s.summerReports && s.summerReports.length > 0 && s.summerReports[0].dateKey === todayStr
  ).length;

  const completionRate =
    students.length > 0 ? Math.round((reportsFilledToday / students.length) * 100) : 0;

  // Circle Compliance Analysis for Today
  const circleStats = circles.map((circle) => {
    const circleStudents = students.filter((s) => s.circle?.id === circle.id);
    const filledStudents = circleStudents.filter(
      (s) => s.summerReports && s.summerReports.length > 0 && s.summerReports[0].dateKey === todayStr
    );
    return {
      circle,
      totalStudents: circleStudents.length,
      filledStudents: filledStudents.length,
      isComplete: circleStudents.length > 0 && filledStudents.length === circleStudents.length,
      isPending: filledStudents.length === 0,
    };
  });

  const completedCirclesCount = circleStats.filter((c) => c.isComplete).length;
  const pendingCirclesCount = circleStats.filter((c) => c.isPending).length;

  // Filtered students by search
  const filteredStudents = students.filter(
    (s) =>
      s.fullName.includes(searchQuery) ||
      (s.studentCode && s.studentCode.includes(searchQuery))
  );

  // Trigger Excel File Import
  const handleImportExcel = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    setImportingExcel(true);
    setImportStatusMsg("جاري استيراد ملف الطلاب والحلقات وقواعد البيانات...");

    try {
      const formData = new FormData();
      if (e?.target?.files?.[0]) {
        formData.append("file", e.target.files[0]);
      }

      const res = await fetch("/api/summer/admin/import-excel", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل استيراد الملف");

      setImportStatusMsg(`✅ ${data.message}`);

      // Refresh student & circle data from backend
      const refRes = await fetch("/api/summer/admin/students");
      const refData = await refRes.json();
      if (refData.success) {
        setStudents(refData.students);
      }

      const cRes = await fetch("/api/summer/admin/circles");
      const cData = await cRes.json();
      if (cData.success) {
        setCircles(cData.circles);
      }

      const tRes = await fetch("/api/summer/admin/teachers");
      const tData = await tRes.json();
      if (tData.success) {
        setTeachers(tData.teachers);
      }
    } catch (err) {
      setImportStatusMsg(`❌ خطأ: ${err instanceof Error ? err.message : "فشل الاستيراد"}`);
    } finally {
      setImportingExcel(false);
    }
  };

  // Save Student
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

  // Delete Student
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

  // Add Circle
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

  // Add / Edit Teacher Account
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTeacher(true);

    try {
      const isEdit = Boolean(teacherForm.teacherId);
      const url = "/api/summer/admin/teachers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ حساب المعلم");

      const tRes = await fetch("/api/summer/admin/teachers");
      const tData = await tRes.json();
      if (tData.success) {
        setTeachers(tData.teachers);
      }

      setShowTeacherModal(false);
      setTeacherForm({
        teacherId: "",
        fullName: "",
        email: "",
        password: "",
      });
      alert(isEdit ? "✅ تم تعديل حساب المعلم بنجاح!" : "✅ تم إضافة حساب المعلم بنجاح!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ المعلم");
    } finally {
      setSavingTeacher(false);
    }
  };

  // Send Daily WhatsApp Batch (By Circle or All)
  const handleSendDailyWhatsApp = async (circleId: string = selectedCircleSendId) => {
    const isAll = circleId === "ALL";
    const targetName = isAll
      ? "جميع أولياء الأمور لكافة الحلقات"
      : `أولياء أمور ${circles.find((c) => c.id === circleId)?.name || "الحلقة المحنذة"}`;

    if (!confirm(`هل ترغب في إرسال تقارير اليوم إلى ${targetName} عبر الواتساب الآن؟`)) return;

    setSendingDaily(true);
    setDailyStatusMsg(`جاري إرسال التقارير لـ ${targetName}...`);

    try {
      const res = await fetch("/api/summer/admin/send-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey: todayStr, circleId: isAll ? undefined : circleId }),
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

  // Send Single Student WhatsApp Reminder
  const handleSendSingleWhatsApp = async (studentId: string) => {
    try {
      const res = await fetch("/api/summer/admin/send-daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: [], dateKey: todayStr, studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإرسال");
      alert("✅ تم إرسال التقرير/التذكير بنجاح عبر الواتساب!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ أثناء الإرسال");
    }
  };

  // Send Single Weekly Card WhatsApp
  const handleSendWeeklyCard = async (studentId: string) => {
    try {
      const topic = educationTopics.find((t) => t.id === selectedTopicId);
      const res = await fetch("/api/summer/admin/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, topicTitle: topic?.title }),
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
        guidelines: newTopicGuidelines.trim(),
        homeworkRequirement: newTopicHomework.trim(),
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
      setNewTopicGuidelines("");
      setNewTopicHomework("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ أثناء حفظ الدروس");
    } finally {
      setSavingTopic(false);
    }
  };

  const currentSelectedTopic = educationTopics.find((t) => t.id === selectedTopicId) || educationTopics[0];

  return (
    <div className="min-h-screen bg-[#f7f2ea] text-[#162e24] dir-rtl font-sans pb-12" dir="rtl">
      {/* 🕌 1. Full-Width Dark Emerald Islamic Calligraphy Header */}
      <header className="relative bg-[#0b4231] text-white shadow-xl overflow-hidden border-b-4 border-[#bd8f2d]">
        <div className="absolute top-0 right-0 h-full w-[420px] pointer-events-none opacity-25 bg-[radial-gradient(#bd8f2d_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#bd8f2d]/30">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-1.5 shadow-md ring-2 ring-[#bd8f2d]">
              <Image
                src="/images/summer_quran_logo_v2.jpg"
                alt="شعار الدورة الصيفية"
                width={56}
                height={56}
                className="h-14 w-14 rounded-xl object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#fbf6ef] font-serif leading-tight">
                الدورة الصيفية الأولى
              </h1>
              <p className="text-xs font-semibold text-emerald-200">
                منصة الإدارة المركزية والتقارير الصيفية | تحفيظ الرحمة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طالب..."
                className="w-full rounded-xl bg-[#135440] border border-[#bd8f2d]/40 px-9 py-2 text-xs text-white placeholder-emerald-200/60 outline-none focus:ring-2 focus:ring-[#bd8f2d]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-emerald-200/80">🔍</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-[#135440] px-3.5 py-2 border border-[#bd8f2d]/40 shrink-0">
              <div className="h-8 w-8 rounded-full bg-[#bd8f2d] flex items-center justify-center font-bold text-xs text-[#0b4231]">
                م
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-white font-serif">أستاذ محمد سيف الدين</span>
                <span className="block text-[10px] text-emerald-200">المدير العام</span>
              </div>
            </div>
            <Link
              href="/api/logout?redirect=/onsite/summer/admin/login"
              className="rounded-xl bg-red-900/80 border border-red-400/40 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-900 transition flex items-center gap-1 font-serif"
              title="تسجيل الخروج"
            >
              🚪 خروج
            </Link>
          </div>
        </div>

        {/* Embedded Navigation Tabs Row */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto py-2.5 text-sm font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-xl px-5 py-2 transition-all font-serif text-base ${
              activeTab === "overview"
                ? "bg-[#bd8f2d] text-[#0b4231] font-black shadow-md"
                : "text-emerald-100 hover:bg-[#135440]"
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`rounded-xl px-5 py-2 transition-all font-serif text-base ${
              activeTab === "students"
                ? "bg-[#bd8f2d] text-[#0b4231] font-black shadow-md"
                : "text-emerald-100 hover:bg-[#135440]"
            }`}
          >
            الطلاب ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("circles")}
            className={`rounded-xl px-5 py-2 transition-all font-serif text-base ${
              activeTab === "circles"
                ? "bg-[#bd8f2d] text-[#0b4231] font-black shadow-md"
                : "text-emerald-100 hover:bg-[#135440]"
            }`}
          >
            المعلمين والحلقات ({circles.length})
          </button>
          <button
            onClick={() => setActiveTab("daily_send")}
            className={`rounded-xl px-5 py-2 transition-all font-serif text-base ${
              activeTab === "daily_send"
                ? "bg-[#bd8f2d] text-[#0b4231] font-black shadow-md"
                : "text-emerald-100 hover:bg-[#135440]"
            }`}
          >
            التقارير والواتساب
          </button>
          <button
            onClick={() => setActiveTab("weekly_send")}
            className={`rounded-xl px-5 py-2 transition-all font-serif text-base ${
              activeTab === "weekly_send"
                ? "bg-[#bd8f2d] text-[#0b4231] font-black shadow-md"
                : "text-emerald-100 hover:bg-[#135440]"
            }`}
          >
            بطاقات الأداء الأسبوعية
          </button>
          <button
            onClick={() => setActiveTab("education_plan")}
            className={`rounded-xl px-5 py-2 transition-all font-serif text-base ${
              activeTab === "education_plan"
                ? "bg-[#bd8f2d] text-[#0b4231] font-black shadow-md"
                : "text-emerald-100 hover:bg-[#135440]"
            }`}
          >
            خطة دروس التربية
          </button>
        </div>
      </header>

      {/* 🏛️ 2. Main Dashboard Content Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        {/* Excel Import Status & Action Bar */}
        <div className="mb-6 rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#0b4231] font-serif">📥 استيراد بيانات الطلاب والحلقات والقرآن</h3>
            <p className="text-xs font-semibold text-gray-500">
              استيراد تلقائي لكافة الطلاب المعلمين والحسابات من ملف Excel (كلمة مرور المعلمين: <b className="text-[#bd8f2d]">12345</b>)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleImportExcel()}
              disabled={importingExcel}
              className="rounded-xl bg-[#0b4231] px-5 py-2 text-xs font-black text-white hover:bg-[#072c21] disabled:opacity-50 font-serif shadow-xs"
            >
              {importingExcel ? "جاري الاستيراد..." : "⚡ تشغيل استيراد Excel التلقائي"}
            </button>

            <label className="cursor-pointer rounded-xl border border-[#d8bf83] bg-[#f9f5ed] px-4 py-2 text-xs font-bold text-[#0b4231] hover:bg-[#d8bf83]">
              📁 رفع ملف جديد
              <input type="file" accept=".xls,.xlsx" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>
        </div>

        {importStatusMsg && (
          <div className="mb-6 rounded-xl bg-[#f9f5ed] p-3 text-xs font-bold text-[#0b4231] border border-[#d8bf83]">
            {importStatusMsg}
          </div>
        )}

        {/* Top Stat Cards Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 block">إجمالي الطلاب</span>
              <span className="text-3xl font-black text-[#0b4231] mt-1 block font-serif">{students.length} طالباً</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0b4231]/10 flex items-center justify-center text-2xl text-[#0b4231]">
              👥
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 block">طلاب القرآن الكريم</span>
              <span className="text-3xl font-black text-emerald-800 mt-1 block font-serif">{quranCount} طالباً</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl text-emerald-800">
              📖
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 block">طلاب نور البيان</span>
              <span className="text-3xl font-black text-[#bd8f2d] mt-1 block font-serif">{noorCount} طالباً</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#bd8f2d]/10 flex items-center justify-center text-2xl text-[#bd8f2d]">
              📘
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 block">إنجاز تقارير الحلقات</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-700 font-serif">{completedCirclesCount}/{circles.length}</span>
                <span className="text-xs font-bold text-[#bd8f2d]">({completionRate}%)</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl text-amber-800">
              📈
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Work Area (3 Columns - 3/4) */}
          <div className="lg:col-span-3 space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Circle Compliance Progress Tracker */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] shadow-sm overflow-hidden p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#d8bf83]/30 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <div>
                        <h3 className="text-lg font-bold text-[#0b4231] font-serif">
                          حالة إدخال تقارير الحلقات لليوم ({todayStr})
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold">
                          متابعة المعلمين والتأكد من إنجاز تقارير الحلقات
                        </p>
                      </div>
                    </div>
                    <span className="rounded-xl bg-[#0b4231] px-3 py-1 text-xs font-bold text-white font-serif">
                      مكتملة: {completedCirclesCount} | معلقة: {pendingCirclesCount}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {circleStats.map(({ circle, totalStudents, filledStudents, isComplete, isPending }) => (
                      <div
                        key={circle.id}
                        className={`rounded-xl border p-4 transition ${
                          isComplete
                            ? "bg-emerald-50/50 border-emerald-300"
                            : isPending
                            ? "bg-amber-50/50 border-amber-300"
                            : "bg-white border-[#d8bf83]/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-bold text-[#0b4231] font-serif">{circle.name}</h4>
                            <p className="text-xs font-bold text-[#bd8f2d]">
                              المعلم: {circle.teacher?.fullName || "غير محدد"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isComplete
                                ? "bg-emerald-700 text-white"
                                : isPending
                                ? "bg-amber-800 text-white"
                                : "bg-blue-700 text-white"
                            }`}
                          >
                            {isComplete
                              ? "مكتملة ✅"
                              : isPending
                              ? "لم تبدأ ❌"
                              : `جاري الإدخال (${filledStudents}/${totalStudents}) ⏳`}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs font-bold border-t border-gray-200/60 pt-2">
                          <span className="text-gray-600">
                            تم رصد {filledStudents} من {totalStudents} طالباً
                          </span>
                          <button
                            onClick={() => handleSendDailyWhatsApp(circle.id)}
                            className="rounded-lg bg-[#0b4231] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#072c21]"
                          >
                            📱 إرسال تقارير الحلقة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Students Progress Table */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-[#d8bf83]/30 bg-[#f9f5ed]">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <h3 className="text-xl font-bold text-[#0b4231] font-serif">سجل الطلاب والتقارير اليومية ({students.length})</h3>
                    </div>
                    <span className="text-xs font-bold text-[#bd8f2d] bg-[#bd8f2d]/10 px-3 py-1.5 rounded-xl border border-[#bd8f2d]/30">
                      تاريخ التقرير: {todayStr}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#f0e9dd] font-bold text-[#0b4231] font-serif text-sm">
                        <tr>
                          <th className="p-3.5">اسم الطالب</th>
                          <th className="p-3.5">الصف / الحلقة</th>
                          <th className="p-3.5">المنهج والمسار</th>
                          <th className="p-3.5">تقرير اليوم</th>
                          <th className="p-3.5">حالة الإرسال / الواتساب</th>
                          <th className="p-3.5 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8bf83]/20 font-semibold">
                        {filteredStudents.map((st) => {
                          const isNoor = st.summerGroup === "NOOR_AL_BAYAN";
                          const reportFilled = Boolean(st.summerReports && st.summerReports.length > 0);
                          const dailySent = Boolean(reportFilled && st.summerReports && st.summerReports[0]?.dailySent);

                          return (
                            <tr key={st.id} className="hover:bg-[#fcf9f2] transition">
                              <td className="p-3.5 font-bold text-[#162e24] text-sm font-serif">
                                <span className="ml-1 font-mono text-[10px] text-[#bd8f2d]">#{st.studentCode || "-"}</span>
                                {st.fullName}
                              </td>
                              <td className="p-3.5 text-gray-600 font-bold">
                                {st.circle?.name || "بدون حلقة"}
                              </td>
                              <td className="p-3.5">
                                {isNoor ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bd8f2d] px-3.5 py-1 text-xs font-black text-white shadow-2xs font-serif">
                                    📘 نور البيان
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b4231] px-3.5 py-1 text-xs font-black text-white shadow-2xs font-serif">
                                    📖 القرآن الكريم
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`rounded-full px-3 py-1 text-[11px] font-black ${
                                    reportFilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-900 border border-amber-300"
                                  }`}
                                >
                                  {reportFilled ? "تم الرصد ✅" : "بانتظار التعبئة ⏳"}
                                </span>
                              </td>
                              <td className="p-3.5">
                                {dailySent ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800 border border-emerald-300 shadow-2xs">
                                    تم الإرسال ✅
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSendSingleWhatsApp(st.id)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#0b4231] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#072c21] shadow-2xs"
                                  >
                                    💬 إرسال واتساب
                                  </button>
                                )}
                              </td>
                              <td className="p-3.5 text-center">
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
                                    className="text-gray-500 hover:text-[#0b4231]"
                                    title="تعديل"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(st.id)}
                                    className="text-red-500 hover:text-red-700"
                                    title="حذف"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === "students" && (
              <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] shadow-sm overflow-hidden p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#0b4231] font-serif">سجل جميع الطلاب ({students.length})</h3>
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
                    className="rounded-xl bg-[#0b4231] px-4 py-2 text-xs font-black text-white font-serif"
                  >
                    ➕ إضافة طالب جديد
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredStudents.map((st) => (
                    <div key={st.id} className="rounded-xl border border-[#d8bf83]/50 p-4 bg-white flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-[#162e24] font-serif">{st.fullName}</h4>
                        <span className="text-xs text-gray-500 font-bold">
                          {st.circle?.name || "بدون حلقة"} | {st.summerGroup === "NOOR_AL_BAYAN" ? "نور البيان" : "قرآن"}
                        </span>
                      </div>
                      <div className="flex gap-2">
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
                          className="text-gray-600 hover:text-[#0b4231]"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CIRCLES AND TEACHERS TAB */}
            {activeTab === "circles" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-[#0b4231] font-serif">إدارة المعلمين والحسابات والحلقات</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTeacherForm({ teacherId: "", fullName: "", email: "", password: "" });
                        setShowTeacherModal(true);
                      }}
                      className="rounded-xl bg-[#bd8f2d] px-4 py-2 text-xs font-black text-[#0b4231] font-serif hover:bg-[#d8bf83] shadow-xs"
                    >
                      ➕ إضافة معلم جديد
                    </button>
                    <button
                      onClick={() => setShowCircleModal(true)}
                      className="rounded-xl bg-[#0b4231] px-4 py-2 text-xs font-black text-white font-serif hover:bg-[#072c21] shadow-xs"
                    >
                      ➕ إضافة حلقة جديدة
                    </button>
                  </div>
                </div>

                {/* Teachers Credentials Cards */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#d8bf83]/30 pb-2">
                    <h4 className="text-base font-bold text-[#0b4231] font-serif">
                      🔑 حسابات معلمي الدورة الصيفية ({teachers.length})
                    </h4>
                    <span className="text-xs text-gray-500 font-semibold">كلمة المرور الموحدة الافتراضية: <b>12345</b></span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {teachers.map((t) => (
                      <div key={t.id} className="rounded-xl border border-[#d8bf83]/60 bg-white p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-[#0b4231] text-sm font-serif">{t.fullName}</h5>
                          <button
                            onClick={() => {
                              setTeacherForm({
                                teacherId: t.id,
                                fullName: t.fullName,
                                email: t.email || "",
                                password: "",
                              });
                              setShowTeacherModal(true);
                            }}
                            className="rounded-lg bg-[#f9f5ed] border border-[#d8bf83] px-2.5 py-1 text-xs font-bold text-[#0b4231] hover:bg-[#0b4231] hover:text-white transition"
                          >
                            ✏️ تعديل الحساب
                          </button>
                        </div>
                        <div className="text-xs space-y-1 text-gray-700 font-semibold">
                          <div>📧 اسم المستخدم: <b className="font-mono text-[#bd8f2d]">{t.email || "غير محدد"}</b></div>
                          <div>🔑 كلمة المرور: <b className="font-mono text-gray-500">مشفرة (اضغط تعديل للتغيير)</b></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Circles Reference Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {circles.map((c) => {
                    const circleStudents = (c.students && c.students.length > 0)
                      ? c.students
                      : students.filter((s) => s.circle?.id === c.id);

                    const teacherName = c.teacher?.fullName || teachers.find((t) => t.id === c.teacherId)?.fullName || "غير محدد";
                    const isNoor = c.name.includes("نور البيان");

                    return (
                      <div key={c.id} className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm space-y-3">
                        <div className="flex items-start justify-between border-b border-[#d8bf83]/30 pb-3">
                          <div>
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white mb-1 ${isNoor ? "bg-[#bd8f2d]" : "bg-[#0b4231]"}`}>
                              {isNoor ? "📘 منهج نور البيان والتمهيدي" : "📖 منهج القرآن الكريم"}
                            </span>
                            <h4 className="text-lg font-bold text-[#0b4231] font-serif">{c.name}</h4>
                          </div>
                          <span className="rounded-xl bg-[#0b4231]/10 px-3 py-1 text-xs font-black text-[#0b4231] font-serif">
                            👥 {circleStudents.length} طلاب
                          </span>
                        </div>

                        <div className="text-xs space-y-1 font-semibold text-gray-700">
                          <div className="flex items-center justify-between">
                            <span>👳‍♂️ المعلم المسؤول:</span>
                            <b className="font-bold text-[#0b4231] font-serif text-sm">{teacherName}</b>
                          </div>
                        </div>

                        {/* List of Student Names inside this circle */}
                        <div className="rounded-xl bg-[#fcf9f2] p-3 border border-[#d8bf83]/40 space-y-2">
                          <span className="block text-[11px] font-bold text-[#bd8f2d] font-serif">
                            📋 قائمة الطلاب المسجلين بالحلقة ({circleStudents.length}):
                          </span>
                          {circleStudents.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pl-1">
                              {circleStudents.map((st: { id: string; fullName: string }, idx: number) => (
                                <span
                                  key={st.id}
                                  className="rounded-lg bg-white border border-[#d8bf83]/50 px-2.5 py-1 text-[11px] font-bold text-[#162e24] shadow-2xs"
                                >
                                  {idx + 1}. {st.fullName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-bold block">لا يوجد طلاب مضافون لهذه الحلقة بعد</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAILY SEND TAB */}
            {activeTab === "daily_send" && (
              <div className="space-y-6">
                {/* 1. WhatsApp Connection Status & QR Code Box */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#d8bf83]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📡</span>
                      <div>
                        <h3 className="text-lg font-bold text-[#0b4231] font-serif">حالة اتصال قناة الواتساب والاقتران (QR Code)</h3>
                        <p className="text-xs text-gray-500 font-semibold">فحص الجاهزية وإمكانية ربط الهاتف بمسح الكود</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        checkWaStatus();
                        setQrKey((prev) => prev + 1);
                      }}
                      disabled={loadingWaStatus}
                      className="rounded-xl bg-[#f9f5ed] border border-[#d8bf83] px-3.5 py-1.5 text-xs font-bold text-[#0b4231] hover:bg-[#d8bf83]"
                    >
                      {loadingWaStatus ? "جاري الفحص..." : "🔄 إعادة الفحص وتحديث QR"}
                    </button>
                  </div>

                  {waChannels?.ONSITE_SUMMER?.ready ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4 flex items-center gap-3">
                      <span className="text-2xl">🟢</span>
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm font-serif">قناة الواتساب متصلة وجاهزة للإرسال ✅</h4>
                        <p className="text-xs font-bold text-emerald-700">البوت متصل بحساب الواتساب ومستعد لإرسال التقارير اليومية والأسبوعية.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 border border-amber-300 p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h4 className="font-bold text-amber-900 text-base font-serif">القناة غير متصلة بالواتساب (تتطلب الاقتران مسح رمز QR)</h4>
                          <p className="text-xs font-bold text-amber-800 mt-0.5">
                            يرجى فتح تطبيق الواتساب في هاتف الإدارة ➔ الأجهزة المرتبطة ➔ ربط جهاز ➔ مسح الكود أدناه:
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center bg-white p-4 rounded-xl border border-amber-200">
                        <div className="text-center space-y-2">
                          <img
                            src={`/api/summer/admin/whatsapp-status/qr?channel=ONSITE_SUMMER&k=${qrKey}`}
                            alt="WhatsApp QR Code"
                            className="w-56 h-56 border-4 border-[#0b4231] rounded-2xl shadow-md mx-auto object-contain bg-white"
                          />
                          <span className="text-[11px] font-bold text-gray-500 block">اضغط زر "إعادة الفحص وتحديث QR" في حال انتهت صلاحية الصورة</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 💬 Broadcast & Custom Messaging Center */}
                  <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#d8bf83]/30 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-[#0b4231] font-serif">📣 مركز بث الرسائل والواتساب المخصص</h4>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          إرسال رسائل مخصصة طولية ومتعددة الأسطر إلى فئات محددة أو أرقام معينة
                        </p>
                      </div>
                    </div>

                    {/* Target Recipient Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#0b4231] block mb-1.5 font-serif">
                          🎯 وجهة الإرسال (إلى من تريد الإرسال؟):
                        </label>
                        <select
                          value={broadcastTargetType}
                          onChange={(e) => setBroadcastTargetType(e.target.value as any)}
                          className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none text-[#0b4231]"
                        >
                          <option value="CUSTOM_PHONE">📱 رقم محدد فقط</option>
                          <option value="ALL_PARENTS">👥 جميع أولياء الأمور ({students.length} ولي أمر)</option>
                          <option value="ALL_TEACHERS">👳‍♂️ جميع المعلمين ({teachers.length} معلمين)</option>
                          <option value="CIRCLE_PARENTS">🏫 أولياء أمور حلقة محددة</option>
                          <option value="SELECTED_STUDENTS">🎓 أولياء أمور طلاب محددين (اختيار فردي)</option>
                        </select>
                      </div>

                      {/* Dynamic Target Inputs */}
                      {broadcastTargetType === "CUSTOM_PHONE" && (
                        <div>
                          <label className="text-xs font-bold text-[#0b4231] block mb-1.5 font-serif">
                            📱 رقم الواتساب المباشر:
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: 05349122796 أو 905349122796"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold font-mono outline-none"
                          />
                        </div>
                      )}

                      {broadcastTargetType === "CIRCLE_PARENTS" && (
                        <div>
                          <label className="text-xs font-bold text-[#0b4231] block mb-1.5 font-serif">
                            🏫 اختر الحلقة:
                          </label>
                          <select
                            value={targetCircleId}
                            onChange={(e) => setTargetCircleId(e.target.value)}
                            className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none text-[#0b4231]"
                          >
                            <option value="">-- اختر الحلقة المراد الإرسال لها --</option>
                            {circles.map((c) => (
                              <option key={c.id} value={c.id}>
                                🏫 {c.name} ({students.filter((s) => s.circle?.id === c.id).length} طلاب)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Student Selection Grid if SELECTED_STUDENTS */}
                    {broadcastTargetType === "SELECTED_STUDENTS" && (
                      <div className="rounded-xl border border-[#d8bf83]/50 bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#0b4231]">
                          <span>اختر الطلاب المراد إرسال الرسالة لأولياء أمورهم:</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedStudentIds.length === students.length) {
                                setSelectedStudentIds([]);
                              } else {
                                setSelectedStudentIds(students.map((s) => s.id));
                              }
                            }}
                            className="text-[#bd8f2d] underline hover:text-[#0b4231]"
                          >
                            {selectedStudentIds.length === students.length ? "إلغاء تحديد الكل" : "تحديد جميع الطلاب"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                          {students.map((st) => {
                            const isChecked = selectedStudentIds.includes(st.id);
                            return (
                              <label
                                key={st.id}
                                className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-bold cursor-pointer transition ${
                                  isChecked
                                    ? "bg-emerald-50 border-[#0b4231] text-[#0b4231]"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIds((prev) => [...prev, st.id]);
                                    } else {
                                      setSelectedStudentIds((prev) => prev.filter((id) => id !== st.id));
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#0b4231] focus:ring-0"
                                />
                                <span className="truncate">{st.fullName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Multiline Textarea Message Content Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#0b4231] font-serif">
                          📝 نص الرسالة (يدعم السطور المتعددة والرموز تحت بعضها البعض):
                        </label>
                        <span className="text-[11px] font-bold text-gray-400">
                          {testMsg.length} حرفاً | {testMsg.split("\n").length} سطور
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        placeholder={`اكتب نص الرسالة هنا...\nمثال:\nالسلام عليكم ورحمة الله وبركاته\nنود إعلامكم بأن...`}
                        value={testMsg}
                        onChange={(e) => setTestMsg(e.target.value)}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-3.5 text-xs font-bold leading-relaxed text-[#162e24] outline-none font-serif shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {testStatusMsg ? (
                        <div className="text-xs font-bold text-[#0b4231]">{testStatusMsg}</div>
                      ) : (
                        <div></div>
                      )}
                      <button
                        onClick={handleBroadcastSend}
                        disabled={sendingTest}
                        className="rounded-xl bg-[#0b4231] px-7 py-3 text-xs font-black text-white hover:bg-[#072c21] disabled:opacity-50 font-serif shadow-md"
                      >
                        {sendingTest ? "جاري البث والإنشاء..." : "🚀 بث الرسالة الآن عبر الواتساب"}
                      </button>
                    </div>

                    {/* Sent Messages History Table */}
                    {broadcastHistory && broadcastHistory.length > 0 && (
                      <div className="pt-4 border-t border-[#d8bf83]/40 space-y-3">
                        <h5 className="text-xs font-bold text-[#0b4231] font-serif">📜 سجل الرسائل المرسلة مؤخراً:</h5>
                        <div className="overflow-x-auto rounded-xl border border-[#d8bf83]/50 bg-white">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-[#f9f5ed] text-[#0b4231] font-serif border-b border-[#d8bf83]/40">
                              <tr>
                                <th className="p-2.5">الوقت والتاريخ</th>
                                <th className="p-2.5">الرقم المرسل إليه</th>
                                <th className="p-2.5">معاينة النص</th>
                                <th className="p-2.5">المصدر</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                              {broadcastHistory.slice(0, 10).map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                  <td className="p-2.5 text-[11px] font-mono text-gray-500">
                                    {new Date(log.createdAt).toLocaleString("ar-SA")}
                                  </td>
                                  <td className="p-2.5 font-mono text-[#0b4231]">{log.toNumber}</td>
                                  <td className="p-2.5 max-w-xs truncate text-[#162e24]" title={log.body}>
                                    {log.body}
                                  </td>
                                  <td className="p-2.5">
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] text-emerald-800 font-bold">
                                      {log.source || "SYSTEM"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Bulk Daily Reports Sending Box */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-6 shadow-sm space-y-4">
                  <h3 className="text-xl font-bold text-[#0b4231] font-serif">🚀 بث التقارير اليومية الجماعي</h3>
                  <p className="text-xs font-bold text-gray-600">
                    اختر حلقة محددة للإرسال أو قم بإرسال التقارير لجميع الحلقات بضغطة زر.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                      value={selectedCircleSendId}
                      onChange={(e) => setSelectedCircleSendId(e.target.value)}
                      className="w-full sm:w-64 rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none"
                    >
                      <option value="ALL">🌐 جميع الحلقات (إرسال كلي)</option>
                      {circles.map((c) => (
                        <option key={c.id} value={c.id}>
                          🏫 {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleSendDailyWhatsApp(selectedCircleSendId)}
                      disabled={sendingDaily}
                      className="w-full sm:w-auto rounded-xl bg-[#0b4231] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#072c21] disabled:opacity-50 font-serif"
                    >
                      {sendingDaily ? "جاري الإرسال..." : "🚀 إرسال تقارير اليوم الآن"}
                    </button>
                  </div>

                  {dailyStatusMsg && (
                    <div className="rounded-xl bg-[#f9f5ed] p-3 text-xs font-bold text-[#0b4231] border border-[#d8bf83]">
                      {dailyStatusMsg}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WEEKLY SEND TAB */}
            {activeTab === "weekly_send" && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#0b4231] font-serif">🖼️ بطاقات التقرير الأسبوعي الفاخرة</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#d8bf83]/50 bg-[#fffdf9] p-4 shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-[#162e24] font-serif">{s.fullName}</h4>
                        <span className="text-[11px] font-bold text-[#bd8f2d]">
                          {s.summerGroup === "NOOR_AL_BAYAN" ? "نور البيان" : "قرآن كريم"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/onsite/summer/admin/weekly-card/${s.id}`}
                          target="_blank"
                          className="rounded-lg border border-[#d8bf83] bg-[#f9f5ed] px-3 py-1.5 text-xs font-bold text-[#0b4231]"
                        >
                          معاينة
                        </Link>
                        <button
                          onClick={() => handleSendWeeklyCard(s.id)}
                          className="rounded-lg bg-[#0b4231] px-3 py-1.5 text-xs font-bold text-white"
                        >
                          واتساب
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDUCATION PLAN TAB */}
            {activeTab === "education_plan" && (
              <div className="space-y-6">
                {/* List of Curriculum Topics */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm">
                  <h3 className="text-xl font-bold text-[#0b4231] font-serif mb-4">
                    📚 خطة دروس التربية الإسلامية المعتمدة ({educationTopics.length} درساً)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto pl-2">
                    {educationTopics.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setViewingTopic(t)}
                        className="rounded-xl border border-[#d8bf83]/60 p-3.5 bg-[#fcf9f2] hover:border-[#0b4231] transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold rounded-full bg-[#bd8f2d] px-2 py-0.5 text-white">
                            الدرس #{t.weekNumber} | {t.category === "SIGHAR" ? "صغار" : "كبار"}
                          </span>
                          <span className="text-xs font-bold text-[#0b4231]">عرض التفاصيل 👁️</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0b4231] font-serif">{t.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{t.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Topic Form */}
                <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-[#0b4231] font-serif mb-3">إضافة درس جديد للخطة</h3>
                  <form onSubmit={handleSaveTopic} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newTopicCategory}
                        onChange={(e) => setNewTopicCategory(e.target.value as "KIBAR" | "SIGHAR")}
                        className="rounded-xl border border-[#d8bf83] p-2 text-xs font-bold bg-white"
                      >
                        <option value="SIGHAR">خطة الصغار</option>
                        <option value="KIBAR">خطة الكبار</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="عنوان الدرس..."
                        className="rounded-xl border border-[#d8bf83] p-2 text-xs font-bold bg-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={newTopicDetails}
                      onChange={(e) => setNewTopicDetails(e.target.value)}
                      placeholder="تفاصيل الدرس ومحاوره..."
                      className="w-full rounded-xl border border-[#d8bf83] p-2 text-xs font-bold bg-white"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newTopicGuidelines}
                        onChange={(e) => setNewTopicGuidelines(e.target.value)}
                        placeholder="الضوابط والمنهجية..."
                        className="rounded-xl border border-[#d8bf83] p-2 text-xs font-bold bg-white"
                      />
                      <input
                        type="text"
                        value={newTopicHomework}
                        onChange={(e) => setNewTopicHomework(e.target.value)}
                        placeholder="الواجب المطلوب..."
                        className="rounded-xl border border-[#d8bf83] p-2 text-xs font-bold bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingTopic}
                      className="rounded-xl bg-[#0b4231] px-5 py-2 text-xs font-black text-white font-serif"
                    >
                      حفظ الدرس
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* 👈 3. Side Panel Column (1/4 - Right Sidebar) */}
          <div className="space-y-5">
            {/* Widget 1: Islamic Education Plan Topic Selector */}
            <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#0b4231] p-5 text-white shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📄</span>
                <h4 className="text-base font-bold text-[#bd8f2d] font-serif">خطط التعليم الإسلامي</h4>
              </div>

              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full rounded-xl bg-[#135440] border border-[#bd8f2d]/50 p-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#bd8f2d]"
              >
                {educationTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    الدرس ({t.category === "SIGHAR" ? "صغار" : "كبار"}) - {t.title}
                  </option>
                ))}
              </select>

              {currentSelectedTopic && (
                <div className="mt-3 rounded-xl bg-[#135440]/80 p-3 border border-white/10 text-xs">
                  <span className="block font-bold text-[#bd8f2d] mb-1 font-serif">الدرس النشط الآن:</span>
                  <p className="font-semibold leading-relaxed text-emerald-100 mb-2">
                    {currentSelectedTopic.details}
                  </p>
                  <button
                    onClick={() => setViewingTopic(currentSelectedTopic)}
                    className="w-full rounded-lg bg-[#bd8f2d] py-1.5 text-center text-xs font-bold text-[#0b4231] hover:bg-[#d8bf83]"
                  >
                    عرض التفاصيل والمنهجية 📖
                  </button>
                </div>
              )}
            </div>

            {/* Widget 2: Quick Guide & Education Plans Drawer Popups */}
            <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#0b4231]">
                <span className="text-lg">🏷️</span>
                <h4 className="text-base font-bold font-serif">دليل وخطة التربية السريعة</h4>
              </div>

              <button
                onClick={() => {
                  const sigharFirst = educationTopics.find((t) => t.category === "SIGHAR") || educationTopics[0];
                  setViewingTopic(sigharFirst);
                }}
                className="w-full text-right rounded-xl bg-[#f9f5ed] p-3 border border-[#d8bf83]/50 text-[#0b4231] hover:bg-[#0b4231] hover:text-white transition block font-serif text-xs font-bold"
              >
                📘 استعراض خطة الصغار (23 درساً)
              </button>

              <button
                onClick={() => {
                  const kibarFirst = educationTopics.find((t) => t.category === "KIBAR") || educationTopics[0];
                  setViewingTopic(kibarFirst);
                }}
                className="w-full text-right rounded-xl bg-[#f9f5ed] p-3 border border-[#d8bf83]/50 text-[#0b4231] hover:bg-[#0b4231] hover:text-white transition block font-serif text-xs font-bold"
              >
                🎓 استعراض خطة الكبار (24 درساً)
              </button>
            </div>

            {/* Widget 3: Important System Notifications */}
            <div className="rounded-2xl border border-[#d8bf83]/60 bg-[#fffdf9] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-[#0b4231]">
                <span className="text-lg">🔔</span>
                <h4 className="text-base font-bold font-serif">إشعارات هامة</h4>
              </div>
              <ul className="space-y-2 text-xs font-medium text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>الخطة (أ) - حفظ القرآن الكريم</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#bd8f2d]" />
                  <span>الخطة (ب) - تلاوة ونور البيان</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>الخطة (ج) - القاعدة التمهيدية</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* 📖 EDUCATION TOPIC FULL DETAILS POPUP MODAL */}
      {viewingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-[#fffdf9] p-6 shadow-2xl dir-rtl border border-[#d8bf83] space-y-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between border-b border-[#d8bf83]/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#bd8f2d] px-3 py-0.5 text-xs font-bold text-white">
                  الدرس #{viewingTopic.weekNumber} | {viewingTopic.category === "SIGHAR" ? "خطة الصغار" : "خطة الكبار"}
                </span>
                <h3 className="text-xl font-bold text-[#0b4231] font-serif">{viewingTopic.title}</h3>
              </div>
              <button
                onClick={() => setViewingTopic(null)}
                className="text-gray-500 hover:text-red-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-[#f9f5ed] p-4 border border-[#d8bf83]/50">
                <h4 className="font-bold text-sm text-[#0b4231] font-serif mb-1">تفاصيل المحتوى والموضوع:</h4>
                <p className="text-gray-800 leading-relaxed font-semibold">{viewingTopic.details}</p>
              </div>

              {viewingTopic.guidelines && (
                <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-300/60">
                  <h4 className="font-bold text-sm text-emerald-900 font-serif mb-1">💡 الضوابط والمنهجية المطلوبة:</h4>
                  <p className="text-emerald-950 leading-relaxed font-semibold">{viewingTopic.guidelines}</p>
                </div>
              )}

              {viewingTopic.homeworkRequirement && (
                <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-300/60">
                  <h4 className="font-bold text-sm text-amber-900 font-serif mb-1">📝 الواجب المطلوب والتطبيق العملي:</h4>
                  <p className="text-amber-950 leading-relaxed font-semibold">{viewingTopic.homeworkRequirement}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#d8bf83]/40">
              <button
                onClick={() => setViewingTopic(null)}
                className="rounded-xl bg-[#0b4231] px-6 py-2 text-xs font-bold text-white hover:bg-[#072c21] font-serif"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-[#fffdf9] p-6 shadow-2xl dir-rtl border border-[#d8bf83]" dir="rtl">
            <h3 className="text-xl font-bold text-[#0b4231] mb-4 border-b border-[#d8bf83]/30 pb-3 font-serif">
              {studentForm.studentId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">اسم الطالب الرباعي</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="مثال: عبد الرحمن محمد العلي"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">نوع الطالب (مسار الدراسة)</label>
                <select
                  value={studentForm.summerGroup}
                  onChange={(e) => setStudentForm({ ...studentForm, summerGroup: e.target.value })}
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231]"
                >
                  <option value="QURAN">📖 طالب قرآن كريم</option>
                  <option value="NOOR_AL_BAYAN">📘 طالب نور البيان والتمهيدي</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">رقم الواتساب لولي الأمر</label>
                <input
                  type="text"
                  value={studentForm.parentWhatsapp}
                  onChange={(e) => setStudentForm({ ...studentForm, parentWhatsapp: e.target.value })}
                  placeholder="مثال: 905555555555"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#162e24]">الحلقة</label>
                  <select
                    value={studentForm.circleId}
                    onChange={(e) => setStudentForm({ ...studentForm, circleId: e.target.value })}
                    className="w-full rounded-xl border border-[#d8bf83] bg-white p-2.5 text-xs font-bold outline-none"
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
                  <label className="mb-1 block text-xs font-bold text-[#162e24]">المعلم</label>
                  <select
                    value={studentForm.teacherId}
                    onChange={(e) => setStudentForm({ ...studentForm, teacherId: e.target.value })}
                    className="w-full rounded-xl border border-[#d8bf83] bg-white p-2.5 text-xs font-bold outline-none"
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
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="rounded-xl bg-[#0b4231] px-6 py-2 text-xs font-black text-white hover:bg-[#072c21] font-serif"
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
          <div className="w-full max-w-md rounded-3xl bg-[#fffdf9] p-6 shadow-2xl dir-rtl border border-[#d8bf83]" dir="rtl">
            <h3 className="text-xl font-bold text-[#0b4231] mb-4 border-b border-[#d8bf83]/30 pb-3 font-serif">إضافة حلقة صيفية جديدة</h3>
            <form onSubmit={handleSaveCircle} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">اسم الحلقة</label>
                <input
                  type="text"
                  required
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder="مثال: حلقة الفجر (قرآن)"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">المعلم المسؤول</label>
                <select
                  value={circleTeacherId}
                  onChange={(e) => setCircleTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231]"
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
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingCircle}
                  className="rounded-xl bg-[#0b4231] px-6 py-2 text-xs font-black text-white hover:bg-[#072c21] font-serif"
                >
                  {savingCircle ? "جاري الحفظ..." : "إضافة الحلقة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-[#fffdf9] p-6 shadow-2xl dir-rtl border border-[#d8bf83]" dir="rtl">
            <h3 className="text-xl font-bold text-[#0b4231] mb-4 border-b border-[#d8bf83]/30 pb-3 font-serif">
              {teacherForm.teacherId ? "تعديل حساب المعلم" : "إضافة معلم صيفي جديد"}
            </h3>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">اسم المعلم الكامل</label>
                <input
                  type="text"
                  required
                  value={teacherForm.fullName}
                  onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                  placeholder="مثال: أسامة سليمان"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">اسم المستخدم / البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="مثال: osama@test.com"
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231] dir-ltr text-left"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#162e24]">
                  كلمة المرور {teacherForm.teacherId && "(اتركها فارغة إذا لم تكن تريد تغييرها)"}
                </label>
                <input
                  type="text"
                  required={!teacherForm.teacherId}
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  placeholder={teacherForm.teacherId ? "اتركها فارغة لإبقاء كلمة المرور الحالية" : "مثال: 12345"}
                  className="w-full rounded-xl border border-[#d8bf83] bg-white p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0b4231] dir-ltr text-left"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#d8bf83]/30 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingTeacher}
                  className="rounded-xl bg-[#0b4231] px-6 py-2 text-xs font-black text-white hover:bg-[#072c21] font-serif"
                >
                  {savingTeacher ? "جاري الحفظ..." : teacherForm.teacherId ? "تحديث بيانات الحساب" : "إنشاء الحساب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
