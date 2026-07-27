"use client";

import { useState, useEffect } from "react";
import LogoutButton from "@/components/LogoutButton";
import AdminStudentModal from "./AdminStudentModal";
import AdminTransferStudentModal from "./AdminTransferStudentModal";
import AdminPrintableReportModal from "./AdminPrintableReportModal";
import AdminTeacherModal from "./AdminTeacherModal";
import AdminCircleModal from "./AdminCircleModal";

type SummerAdminDashboardProps = {
  initialStudents: any[];
  initialCircles: any[];
  initialTeachers: any[];
  initialEducationTopics: any[];
};

export default function SummerAdminDashboard({
  initialStudents,
  initialCircles,
  initialTeachers,
  initialEducationTopics,
}: SummerAdminDashboardProps) {
  // Navigation Section State
  const [activeSection, setActiveSection] = useState<
    "operations" | "students" | "teachers" | "whatsapp" | "reports" | "alerts" | "curriculum" | "finance"
  >("operations");

  // Mobile Menu Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data States
  const [students, setStudents] = useState<any[]>(initialStudents || []);
  const [circles, setCircles] = useState<any[]>(initialCircles || []);
  const [teachers, setTeachers] = useState<any[]>(initialTeachers || []);
  const [educationTopics] = useState<any[]>(initialEducationTopics || []);

  // Filter States for Students Hub
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<"ALL" | "QURAN" | "NOOR_AL_BAYAN">("ALL");
  const [filterCircleId, setFilterCircleId] = useState<string>("ALL");

  // Reports
  const [reportSearchQuery, setReportSearchQuery] = useState("");

  // Student Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<any | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [studentToPrint, setStudentToPrint] = useState<{ id: string; name: string } | null>(null);

  // Teacher Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<any | null>(null);

  // Circle Modal
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);
  const [circleToEdit, setCircleToEdit] = useState<any | null>(null);

  // Edit/Past-Days Requests State
  const [editRequests, setEditRequests] = useState<any[]>([]);

  // WhatsApp Status State
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [sendingDaily, setSendingDaily] = useState(false);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [whatsappResult, setWhatsappResult] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Fetch Edit Requests and WhatsApp Status
  const fetchEditRequests = async () => {
    try {
      const res = await fetch("/api/summer/admin/edit-requests");
      const data = await res.json();
      if (res.ok) {
        setEditRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching edit requests:", err);
    }
  };

  const checkWhatsappStatus = async () => {
    try {
      const res = await fetch("/api/summer/admin/whatsapp-status");
      const data = await res.json();
      if (res.ok) {
        setWhatsappConnected(data.connected);
      }
    } catch (err) {
      console.error("Error checking whatsapp status:", err);
    }
  };

  const fetchQrCode = async () => {
    try {
      const res = await fetch("/api/summer/admin/whatsapp-status/qr");
      const data = await res.json();
      if (res.ok && data.qrCode) {
        setQrCodeUrl(data.qrCode);
        setShowQrModal(true);
      }
    } catch (err) {
      console.error("Error fetching QR code:", err);
    }
  };

  useEffect(() => {
    fetchEditRequests();
    checkWhatsappStatus();
  }, []);

  const handleReviewRequest = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/summer/admin/edit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (res.ok) {
        fetchEditRequests();
      }
    } catch (err) {
      console.error("Error reviewing request:", err);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, name: string) => {
    if (!confirm(`هل أنت تأكد من إيقاف/حذف حساب المعلم: ${name}؟`)) return;
    try {
      const res = await fetch(`/api/summer/admin/teachers?id=${teacherId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error deleting teacher:", err);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الطالب: ${name}؟ سيتم حذف كافة سجلاته.`)) return;
    try {
      const res = await fetch(`/api/summer/admin/students?id=${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("فشل حذف الطالب");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleDeleteCircle = async (circleId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحلقة: ${name}؟`)) return;
    try {
      const res = await fetch(`/api/summer/admin/circles?id=${circleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("فشل حذف الحلقة");
      }
    } catch (err) {
      console.error("Error deleting circle:", err);
    }
  };

  const handleSendDaily = async () => {
    if (!confirm("هل أنت متأكد من إرسال التقارير اليومية لجميع أولياء الأمور؟")) return;
    setSendingDaily(true);
    setWhatsappResult(null);
    try {
      const res = await fetch('/api/summer/admin/send-daily', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setWhatsappResult({ message: `تم الإرسال بنجاح. ${data.message || ''}`, type: 'success' });
      } else {
        setWhatsappResult({ message: `حدث خطأ: ${data.error || 'فشل الإرسال'}`, type: 'error' });
      }
    } catch (err) {
      setWhatsappResult({ message: 'حدث خطأ غير متوقع أثناء الإرسال', type: 'error' });
    } finally {
      setSendingDaily(false);
    }
  };

  const handleSendWeekly = async () => {
    if (!confirm("هل أنت متأكد من إرسال البطاقات الأسبوعية لجميع أولياء الأمور؟")) return;
    setSendingWeekly(true);
    setWhatsappResult(null);
    try {
      const res = await fetch('/api/summer/admin/send-weekly', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setWhatsappResult({ message: `تم الإرسال بنجاح. ${data.message || ''}`, type: 'success' });
      } else {
        setWhatsappResult({ message: `حدث خطأ: ${data.error || 'فشل الإرسال'}`, type: 'error' });
      }
    } catch (err) {
      setWhatsappResult({ message: 'حدث خطأ غير متوقع أثناء الإرسال', type: 'error' });
    } finally {
      setSendingWeekly(false);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (s.studentCode && s.studentCode.includes(searchQuery));
    const matchesGroup = filterGroup === "ALL" || s.summerGroup === filterGroup;
    const matchesCircle = filterCircleId === "ALL" || s.circleId === filterCircleId;
    return matchesSearch && matchesGroup && matchesCircle;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const pendingRequests = editRequests.filter((r) => r.status === "NEW");

  // Calculate Real Statistics
  const studentsWithReports = students.filter((s) => s.summerReports && s.summerReports.length > 0);
  const studentsWithoutReports = students.filter((s) => !s.summerReports || s.summerReports.length === 0);

  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#18322a] font-sans dir-rtl flex flex-col lg:flex-row" dir="rtl">
      {/* 📱 Mobile Top Navigation Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0c5c5e] text-white px-4 py-3 border-b-2 border-[#bd8f2d] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-amber-300">
            <img src="/images/alrahma_tahfeez_logo.png" alt="شعار تحفيظ الرحمة" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold font-ruqaa text-[#bd8f2d]">تحفيظ الرحمة</h1>
            <p className="text-[10px] text-cyan-100 font-bold">إدارة الدورة الصيفية للقرآن الكريم</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-xl bg-[#bd8f2d] px-3 py-1.5 text-xs font-bold text-[#0c5c5e] shadow-xs flex items-center gap-1.5 font-serif"
        >
          <span>{isMobileMenuOpen ? "✕ إغلاق" : "☰ القائمة الإدارية"}</span>
          {pendingRequests.length > 0 && (
            <span className="rounded-full bg-rose-600 text-white h-5 w-5 flex items-center justify-center text-[10px] font-mono">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🏛️ 1. Modern RTL Executive Command Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 lg:w-80 bg-gradient-to-b from-[#0a4b4d] via-[#0c5c5e] to-[#083e40] text-white flex flex-col justify-between shrink-0 shadow-2xl border-l-4 border-[#bd8f2d] min-h-screen lg:sticky lg:top-0 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#bd8f2d]/40 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border-2 border-[#bd8f2d]">
                <img src="/images/alrahma_tahfeez_logo.png" alt="شعار تحفيظ الرحمة" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-ruqaa text-[#bd8f2d] tracking-wide drop-shadow-xs">
                  تحفيظ الرحمة
                </h1>
                <p className="text-xs font-bold text-[#fbf6ef]">
                  إدارة الدورة الصيفية للقرآن الكريم
                </p>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="flex items-center justify-between rounded-2xl bg-[#084143] px-3.5 py-2 text-xs font-bold text-[#fbf6ef] border border-[#bd8f2d]/40 shadow-2xs">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                المنظومة نشطة
              </span>
              <span className="font-mono text-[#bd8f2d] font-black">{todayStr}</span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-4 space-y-2 text-sm font-bold font-serif">
            <button
              onClick={() => {
                setActiveSection("operations");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "operations"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏠</span>
                <span>غرفة القيادة والعمليات</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-xs font-mono animate-bounce">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveSection("students");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "students"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">👥</span>
                <span>مركز الطلاب والنقل والتوزيع</span>
              </div>
              <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-xs font-mono">
                {students.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("teachers");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "teachers"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎓</span>
                <span>إدارة المعلمين والحلقات</span>
              </div>
              <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-xs font-mono">
                {teachers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection("whatsapp");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "whatsapp"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3 text-right leading-snug">
                <span className="text-xl shrink-0">📱</span>
                <span>إرسال الرسائل عبر الواتساب والتقرير الأسبوعي</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSection("reports");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "reports"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <span>مركز التقارير والإحصائيات</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSection("alerts");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "alerts"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🚨</span>
                <span>التنبيهات والإنذارات المبكرة</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSection("curriculum");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "curriculum"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📚</span>
                <span>المنهج والتربية الإيمانية</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSection("finance");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "finance"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md scale-[1.02]"
                  : "text-[#fbf6ef] hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💳</span>
                <span>قسم الحسابات والتقارير المالية</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Logout Footer */}
        <div className="p-4 border-t border-[#bd8f2d]/40">
          <LogoutButton redirectUrl="/onsite/summer/admin" />
        </div>
      </aside>

      {/* 🏛️ 2. Main Executive Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto w-full">
        {/* Clean Executive Header Bar */}
        <header className="rounded-3xl border-2 border-[#bd8f2d] bg-gradient-to-r from-[#fbf7f0] via-white to-[#fbf7f0] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-[#0c5c5e]/10 px-3.5 py-1 text-xs font-bold text-[#0c5c5e] font-serif mb-1">
              ✨ بوابة الإشراف الإداري العام
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0c5c5e]">
              إدارة الدورة الصيفية لتعليم القرآن الكريم
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-2xl bg-[#0c5c5e]/10 text-[#0c5c5e] px-3.5 py-1.5 text-xs font-bold font-serif">
              الموافق: {todayStr}
            </span>
          </div>
        </header>

        {/* SECTION 1: OPERATIONS COMMAND HUB */}
        {activeSection === "operations" && (
          <div className="space-y-6">
            {/* Rich Colored Bento Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl border-2 border-[#bd8f2d] bg-gradient-to-br from-[#0c5c5e] to-[#117073] text-white p-5 shadow-md space-y-2">
                <span className="text-xs font-bold text-cyan-100 font-serif">👥 إجمالي الطلاب النشطين</span>
                <div className="text-3xl font-bold font-mono text-[#bd8f2d]">{students.length}</div>
                <p className="text-[11px] text-cyan-100 font-bold">مسجلون بالدورة الصيفية</p>
              </div>

              <div className="rounded-3xl border-2 border-white bg-gradient-to-br from-[#bd8f2d] to-[#d4aa48] text-[#0c5c5e] p-5 shadow-md space-y-2">
                <span className="text-xs font-bold text-[#0c5c5e]/80 font-serif">🕌 الحلقات الدراسية</span>
                <div className="text-3xl font-bold font-mono text-[#0c5c5e]">{circles.length}</div>
                <p className="text-[11px] text-[#0c5c5e]/90 font-bold">حلقة قرآن ونور بيان</p>
              </div>

              <div className="rounded-3xl border-2 border-[#bd8f2d] bg-gradient-to-br from-[#164e4e] to-[#0c5c5e] text-white p-5 shadow-md space-y-2">
                <span className="text-xs font-bold text-cyan-100 font-serif">🎓 الكادر التعليمي</span>
                <div className="text-3xl font-bold font-mono text-[#bd8f2d]">{teachers.length}</div>
                <p className="text-[11px] text-cyan-100 font-bold">معلماً ومربياً فاضلاً</p>
              </div>

              <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-rose-800 to-rose-950 text-white p-5 shadow-md space-y-2">
                <span className="text-xs font-bold text-amber-200 font-serif">📩 الطلبات المعلقة</span>
                <div className="text-3xl font-bold font-mono text-amber-300">{pendingRequests.length}</div>
                <p className="text-[11px] text-rose-200 font-bold">تعبئة/تعديل أيام سابقة</p>
              </div>
            </div>

            {/* Operations Summary Progress Card */}
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#0c5c5e] font-serif flex items-center gap-2">
                <span>📈</span>
                <span>ملخص نسبة الرصد والإنجاز الإداري اليومي</span>
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-1">
                  <span className="text-xs font-bold text-emerald-900 font-serif">الطلاب المرصود لهم تقارير:</span>
                  <div className="text-2xl font-bold font-mono text-emerald-800">{studentsWithReports.length} طالب</div>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 space-y-1">
                  <span className="text-xs font-bold text-amber-900 font-serif">بانتظار رصد المعلمين الأول:</span>
                  <div className="text-2xl font-bold font-mono text-amber-800">{studentsWithoutReports.length} طالب</div>
                </div>
              </div>
            </div>

            {/* Past-Days Teacher Edit Request Approval Center */}
            {pendingRequests.length > 0 && (
              <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-100/90 p-5 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">📩</span>
                    <div>
                      <h3 className="text-lg font-bold text-amber-950 font-serif">
                        طلبات تعبئة وتعديل الأيام السابقة المعلقة ({pendingRequests.length} طلبات)
                      </h3>
                      <p className="text-xs text-amber-900 font-bold">
                        قام المعلمون برصد تقارير لأيام سابقة وتتطلب اعتماد الإدارة
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-amber-300 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-amber-900 font-bold font-serif">
                          <span>طلب من الأستاذ: <b>{req.teacher?.fullName}</b></span>
                          {req.student?.fullName && <span>| الطالب: <b>{req.student.fullName}</b></span>}
                        </div>
                        <p className="text-gray-700 font-bold">{req.subject}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleReviewRequest(req.id, "APPROVED")}
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition font-serif shadow-2xs"
                        >
                          ✅ موافقة واعتماد التقرير
                        </button>
                        <button
                          onClick={() => handleReviewRequest(req.id, "REJECTED")}
                          className="w-full sm:w-auto rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 text-xs font-bold transition"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: STUDENTS & TRANSFER HUB */}
        {activeSection === "students" && (
          <div className="space-y-5">
            {/* Scoped Button Bar inside Students Hub */}
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث باسم الطالب أو الكود..."
                  className="rounded-xl border border-[#bd8f2d]/50 bg-white px-4 py-2.5 text-xs font-bold outline-none w-full sm:w-64 focus:ring-2 focus:ring-[#0c5c5e]"
                />

                <select
                  value={filterGroup}
                  onChange={(e: any) => setFilterGroup(e.target.value)}
                  className="rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold outline-none w-full sm:w-auto"
                >
                  <option value="ALL">جميع المسارات</option>
                  <option value="QURAN">📖 قرآن كريم</option>
                  <option value="NOOR_AL_BAYAN">📘 نور البيان</option>
                </select>

                <select
                  value={filterCircleId}
                  onChange={(e) => setFilterCircleId(e.target.value)}
                  className="rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2.5 text-xs font-bold outline-none w-full sm:w-auto"
                >
                  <option value="ALL">جميع الحلقات</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      حلقة: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scoped Add Student Button */}
              <button
                onClick={() => {
                  setStudentToEdit(null);
                  setIsStudentModalOpen(true);
                }}
                className="w-full sm:w-auto rounded-xl bg-[#0c5c5e] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#084547] transition shadow-2xs font-serif shrink-0 flex items-center justify-center gap-2"
              >
                <span>➕</span>
                <span>إضافة طالب جديد</span>
              </button>
            </div>

            {/* Students Data Table with Horizontal Scroll for Mobile */}
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] shadow-sm overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs min-w-[650px]">
                <thead>
                  <tr className="bg-[#0c5c5e] text-white font-serif text-xs">
                    <th className="p-3.5 border-b">اسم الطالب</th>
                    <th className="p-3.5 border-b">المسار</th>
                    <th className="p-3.5 border-b">الحلقة</th>
                    <th className="p-3.5 border-b">المعلم المسؤول</th>
                    <th className="p-3.5 border-b">آخر تقرير مرصود</th>
                    <th className="p-3.5 border-b text-center">الإجراءات والصلاحيات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">
                        لا يوجد طلاب يطابقون خيارات البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr
                        key={st.id}
                        className={`border-b border-gray-200/80 transition ${
                          idx % 2 === 0 ? "bg-white" : "bg-[#fcfaf5]"
                        }`}
                      >
                        <td className="p-3.5 font-bold text-[#162e24] font-serif text-sm">
                          {st.fullName}
                          {st.studentCode === "7500" && (
                            <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                              تجريبي
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold">
                          {st.summerGroup === "NOOR_AL_BAYAN" ? (
                            <span className="rounded-full bg-sky-100 text-sky-900 px-2.5 py-0.5 text-[11px]">
                              📘 نور البيان
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[11px]">
                              📖 قرآن كريم
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-[#bd8f2d]">
                          {st.circle?.name || "بدون حلقة"}
                        </td>
                        <td className="p-3.5 font-bold text-gray-700">
                          {st.teacher?.fullName || "غير محدد"}
                        </td>
                        <td className="p-3.5 font-mono text-gray-600 font-bold">
                          {st.summerReports[0]?.dateKey ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {st.summerReports[0].dateKey}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              لم يرصد بعد
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setStudentToTransfer({
                                  id: st.id,
                                  fullName: st.fullName,
                                  circleName: st.circle?.name,
                                  teacherName: st.teacher?.fullName,
                                  circleId: st.circleId,
                                  teacherId: st.teacherId,
                                });
                                setIsTransferModalOpen(true);
                              }}
                              className="rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 px-2.5 py-1 text-[11px] font-bold transition font-serif shadow-2xs"
                              title="نقل وتوزيع الطالب إلى حلقة/معلم آخر"
                            >
                              🔁 نقل وتوزيع
                            </button>

                            <button
                              onClick={() => {
                                setStudentToPrint({ id: st.id, name: st.fullName });
                                setIsPrintModalOpen(true);
                              }}
                              className="rounded-xl border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 px-2 py-1 text-[11px] font-bold transition"
                              title="طباعة التقرير الشامل للطالب"
                            >
                              🖨️ التقرير
                            </button>

                            <button
                              onClick={() => {
                                setStudentToEdit(st);
                                setIsStudentModalOpen(true);
                              }}
                              className="rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 px-2 py-1 text-[11px] font-bold transition"
                            >
                              ✏️ تعديل
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(st.id, st.fullName)}
                              className="rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 px-2 py-1 text-[11px] font-bold transition"
                              title="حذف الطالب"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: TEACHERS & CIRCLES COMMAND */}
        {activeSection === "teachers" && (
          <div className="space-y-5">
            {/* Scoped Button Bar inside Teachers Hub */}
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                إدارة الكادر التعليمي والحلقات ({teachers.length} معلماً)
              </h3>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setTeacherToEdit(null);
                    setIsTeacherModalOpen(true);
                  }}
                  className="w-full sm:w-auto rounded-xl bg-[#0c5c5e] text-white px-4 py-2 text-xs font-bold hover:bg-[#084547] transition shadow-sm font-serif flex items-center justify-center gap-1.5"
                >
                  <span>➕</span>
                  <span>إضافة معلم جديد</span>
                </button>

                <button
                  onClick={() => {
                    setCircleToEdit(null);
                    setIsCircleModalOpen(true);
                  }}
                  className="w-full sm:w-auto rounded-xl border-2 border-[#bd8f2d] bg-white text-[#0c5c5e] px-4 py-2 text-xs font-bold hover:bg-[#bd8f2d]/20 transition shadow-sm font-serif flex items-center justify-center gap-1.5"
                >
                  <span>🕌</span>
                  <span>إنشاء حلقة جديدة</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {teachers.map((t) => {
                const assignedCircles = circles.filter((c) => c.teacher?.id === t.id);
                const teacherStudents = students.filter((s) => s.teacherId === t.id);

                return (
                  <div
                    key={t.id}
                    className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-[#0c5c5e] text-white flex items-center justify-center font-bold text-base font-serif">
                          أ
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#0c5c5e] font-serif">
                            أستاذ: {t.fullName}
                          </h4>
                          <p className="text-xs font-semibold text-gray-600">{t.email || "معلم صيفي"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold font-mono">
                          {teacherStudents.length} طالباً
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200/80 pt-3 text-xs font-bold text-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>الحلقات المسندة:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setTeacherToEdit(t);
                              setIsTeacherModalOpen(true);
                            }}
                            className="rounded-lg bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.fullName)}
                            className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>

                      {assignedCircles.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {assignedCircles.map((c) => (
                            <div key={c.id} className="flex items-center gap-1 rounded-lg bg-white border border-[#bd8f2d]/50 px-2 py-1">
                              <span className="text-[#0c5c5e]">
                                حلقة: {c.name} ({c.students?.length || 0} طلاب)
                              </span>
                              <div className="flex items-center gap-1 border-r border-gray-200 pr-1 mr-1">
                                <button
                                  onClick={() => {
                                    setCircleToEdit(c);
                                    setIsCircleModalOpen(true);
                                  }}
                                  className="text-[10px] text-gray-500 hover:text-[#0c5c5e]"
                                  title="تعديل الحلقة"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteCircle(c.id, c.name)}
                                  className="text-[10px] text-gray-500 hover:text-rose-600"
                                  title="حذف الحلقة"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-normal">لا توجد حلقة محددة</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: WHATSAPP & WEEKLY CARDS */}
        {activeSection === "whatsapp" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                    📱 إرسال الرسائل عبر الواتساب والتقرير الأسبوعي
                  </h3>
                  <p className="text-xs text-gray-600 font-bold mt-1">
                    التحكم في بث التقارير اليومية وبطاقات الأداء الأسبوعية لأولياء الأمور
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchQrCode}
                    className={`rounded-2xl px-4 py-2.5 text-xs font-bold font-serif transition shadow-sm ${
                      whatsappConnected
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-rose-600 text-white hover:bg-rose-700 animate-pulse"
                    }`}
                  >
                    {whatsappConnected ? "الواتساب متصل ✅ (إعادة الفحص)" : "🔴 الواتساب غير متصل (اضغط لمسح الـ QR Code)"}
                  </button>
                </div>
              </div>

              {/* QR Modal inside section */}
              {showQrModal && qrCodeUrl && (
                <div className="rounded-2xl border-2 border-emerald-400 bg-white p-6 text-center space-y-3">
                  <h4 className="font-bold text-[#0c5c5e] font-serif">اقرأ رمز الـ QR عبر تطبيق الواتساب لربط الجوال:</h4>
                  <div className="inline-block p-3 bg-white rounded-2xl border-2 border-[#bd8f2d]">
                    <img src={qrCodeUrl} alt="QR Code" className="h-64 w-64 object-contain" />
                  </div>
                  <div>
                    <button
                      onClick={() => setShowQrModal(false)}
                      className="rounded-xl bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700"
                    >
                      إغلاق نافذة الـ QR
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp Broadcast Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={handleSendDaily}
                  disabled={!whatsappConnected || sendingDaily}
                  className="rounded-2xl bg-[#0c5c5e] text-white p-4 font-bold font-serif hover:bg-[#084143] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>📩</span>
                  <span>{sendingDaily ? "جاري الإرسال..." : "إرسال التقارير اليومية لأولياء الأمور"}</span>
                </button>
                
                <button
                  onClick={handleSendWeekly}
                  disabled={!whatsappConnected || sendingWeekly}
                  className="rounded-2xl border-2 border-[#bd8f2d] bg-white text-[#0c5c5e] p-4 font-bold font-serif hover:bg-[#fbf7f0] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>📊</span>
                  <span>{sendingWeekly ? "جاري الإرسال..." : "إرسال البطاقات الأسبوعية"}</span>
                </button>
              </div>

              {whatsappResult && (
                <div className={`mt-4 p-4 rounded-xl text-sm font-bold ${whatsappResult.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                  {whatsappResult.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: EXECUTIVE REPORTS & ANALYTICS */}
        {activeSection === "reports" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                  📊 مركز التقارير والإحصائيات الحية
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-emerald-300 bg-white p-4 space-y-1">
                  <span className="text-xs font-bold text-gray-500 font-serif">الطلاب المرصود لهم تقارير:</span>
                  <div className="text-2xl font-bold font-mono text-emerald-700">{studentsWithReports.length} طالب</div>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-white p-4 space-y-1">
                  <span className="text-xs font-bold text-gray-500 font-serif">الطلاب بانتظار الرصد الأول:</span>
                  <div className="text-2xl font-bold font-mono text-amber-700">{studentsWithoutReports.length} طالب</div>
                </div>

                <div className="rounded-2xl border border-sky-300 bg-white p-4 space-y-1">
                  <span className="text-xs font-bold text-gray-500 font-serif">عدد الحلقات المفعلة:</span>
                  <div className="text-2xl font-bold font-mono text-sky-700">{circles.length} حلقة</div>
                </div>
              </div>

              {/* Student Progress Selector List with working Report trigger */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-[#0c5c5e] font-serif">
                  📋 اختيار طالب لمعاينة وطباعة سجله التراكمي كاملاً:
                </h4>

                <input
                  type="text"
                  placeholder="ابحث عن طالب..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-[#bd8f2d]/50 bg-white px-3.5 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0c5c5e] mb-2"
                />

                <div className="max-h-80 overflow-y-auto rounded-2xl border border-[#bd8f2d]/40 bg-white p-2 space-y-1 text-xs font-bold">
                  {students
                    .filter((st) => st.fullName.includes(reportSearchQuery) || (st.studentCode && st.studentCode.includes(reportSearchQuery)))
                    .map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        setStudentToPrint({ id: st.id, name: st.fullName });
                        setIsPrintModalOpen(true);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#faf6ef] cursor-pointer transition border-b border-gray-100"
                    >
                      <span className="text-[#0c5c5e] font-serif">{st.fullName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[11px]">{st.circle?.name || "بدون حلقة"}</span>
                        <span className="rounded-lg bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px]">🖨️ معاينة وطباعة التقرير</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: SMART EARLY WARNING ALERTS */}
        {activeSection === "alerts" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-rose-400 bg-rose-50 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-xl font-bold text-rose-950 font-serif">
                    شريط التنبيهات والإنذارات المبكرة الحية
                  </h3>
                  <p className="text-xs text-rose-900 font-bold">
                    الطلاب الذين يحتاجون متابعة خاصة بناءً على السجلات مرصودة
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-300 bg-white p-4 space-y-2">
                  <span className="font-bold text-rose-950 text-sm font-serif">🔴 تنبيه الطلاب بدون تقارير مرصودة:</span>
                  <div className="text-xs text-gray-700 space-y-1">
                    {studentsWithoutReports.slice(0, 8).map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-rose-50 p-2 rounded-lg">
                        <span>{s.fullName}</span>
                        <span className="text-rose-700 font-mono">بانتظار التقرير الأول</span>
                      </div>
                    ))}
                    {studentsWithoutReports.length === 0 && <p className="text-emerald-700 font-bold">جميع الطلاب مرصود لهم تقارير ✅</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-white p-4 space-y-2">
                  <span className="font-bold text-amber-950 text-sm font-serif">⚠️ تنبيه متابعة الأداء والتسجيل:</span>
                  <p className="text-xs text-gray-600">
                    يمكن للإداري فحص أي طالب مباشرة وطباعة تقريره التراكمي لمتابعة مستواه مع المعلم.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: CURRICULUM */}
        {activeSection === "curriculum" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                📚 المنهج والتربية الإيمانية الأسبوعية
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {educationTopics.map((top: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border border-[#bd8f2d]/50 bg-white p-4 space-y-1">
                    <span className="inline-block rounded-full bg-[#0c5c5e]/10 px-2.5 py-0.5 text-xs font-bold text-[#0c5c5e]">
                      الأسبوع {top.week || idx + 1}
                    </span>
                    <h4 className="font-bold text-[#0c5c5e] text-sm font-serif">{top.title || top.topic}</h4>
                    <p className="text-xs text-gray-600 font-bold">{top.description || "درس تربوي وإيماني مخصص للدورة الصيفية"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: FINANCE & ACCOUNTS */}
        {activeSection === "finance" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d] bg-[#fbf7f0] p-6 shadow-sm space-y-3">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif flex items-center gap-2">
                <span>💳</span>
                <span>قسم الحسابات والتقارير المالية</span>
              </h3>
              <p className="text-xs text-gray-600 font-bold">
                مساحة مخصصة ومستعدة لإدارة الحسابات والرسوم المالية والاشتراكات للدورة الصيفية
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Admin Action Modals */}
      <AdminStudentModal
        isOpen={isStudentModalOpen}
        studentToEdit={studentToEdit}
        circles={circles}
        teachers={teachers}
        onClose={() => setIsStudentModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <AdminTransferStudentModal
        isOpen={isTransferModalOpen}
        student={studentToTransfer}
        circles={circles}
        teachers={teachers}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <AdminTeacherModal
        isOpen={isTeacherModalOpen}
        teacherToEdit={teacherToEdit}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <AdminCircleModal
        isOpen={isCircleModalOpen}
        circleToEdit={circleToEdit}
        teachers={teachers}
        onClose={() => setIsCircleModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <AdminPrintableReportModal
        isOpen={isPrintModalOpen}
        studentId={studentToPrint?.id || null}
        studentName={studentToPrint?.name}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
