"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";
import AdminStudentModal from "./AdminStudentModal";
import AdminTransferStudentModal from "./AdminTransferStudentModal";
import AdminPrintableReportModal from "./AdminPrintableReportModal";

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

  // Data States
  const [students, setStudents] = useState<any[]>(initialStudents || []);
  const [circles, setCircles] = useState<any[]>(initialCircles || []);
  const [teachers, setTeachers] = useState<any[]>(initialTeachers || []);
  const [educationTopics] = useState<any[]>(initialEducationTopics || []);

  // Filter States for Students Hub
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<"ALL" | "QURAN" | "NOOR_AL_BAYAN">("ALL");
  const [filterCircleId, setFilterCircleId] = useState<string>("ALL");

  // Modal States
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<any | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [studentToPrint, setStudentToPrint] = useState<{ id: string; name: string } | null>(null);

  // Edit/Past-Days Requests State
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // WhatsApp Status State
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // WhatsApp Bulk Sending State
  const [sendingDaily, setSendingDaily] = useState(false);
  const [dailyProgress, setDailyProgress] = useState<number>(0);
  const [dailyStatusMessage, setDailyStatusMessage] = useState<string | null>(null);

  // Fetch Teacher Requests (for past days edit approvals)
  const fetchEditRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/summer/admin/edit-requests");
      const data = await res.json();
      if (res.ok) {
        setEditRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching edit requests:", err);
    } finally {
      setLoadingRequests(false);
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

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (s.studentCode && s.studentCode.includes(searchQuery));
    const matchesGroup = filterGroup === "ALL" || s.summerGroup === filterGroup;
    const matchesCircle = filterCircleId === "ALL" || s.circleId === filterCircleId;
    return matchesSearch && matchesGroup && matchesCircle;
  });

  // Calculate Smart Early Warning Alerts
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingRequests = editRequests.filter((r) => r.status === "NEW");

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#18322a] font-sans dir-rtl flex" dir="rtl">
      {/* 🏛️ 1. Modern RTL Executive Command Sidebar */}
      <aside className="w-72 bg-[#0c5c5e] text-white flex flex-col justify-between shrink-0 shadow-2xl border-l-4 border-[#bd8f2d] min-h-screen sticky top-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#bd8f2d]/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-1.5 ring-2 ring-[#bd8f2d] shadow-md">
                <Image
                  src="/images/summer_quran_logo_v2.jpg"
                  alt="شعار الإدارة"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold font-ruqaa text-[#bd8f2d] tracking-wide">
                  تحفيظ الرحمة
                </h1>
                <p className="text-[11px] font-semibold text-cyan-200">
                  اللوحة الإدارية التنفيذية
                </p>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center justify-between rounded-xl bg-[#117073] px-3 py-1.5 text-[11px] font-bold text-cyan-100 border border-[#bd8f2d]/30">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                المنظومة متصلة
              </span>
              <span className="font-mono text-[#bd8f2d]">{todayStr}</span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-4 space-y-1.5 text-xs font-bold font-serif">
            <button
              onClick={() => setActiveSection("operations")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "operations"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏠</span>
                <span>غرفة القيادة والعمليات</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10px] font-mono animate-bounce">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection("students")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "students"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">👥</span>
                <span>مركز الطلاب والنقل والتوزيع</span>
              </div>
              <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-[10px] font-mono">
                {students.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection("teachers")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "teachers"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🎓</span>
                <span>إدارة المعلمين والحلقات</span>
              </div>
              <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-[10px] font-mono">
                {teachers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection("whatsapp")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "whatsapp"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3 text-right leading-snug">
                <span className="text-lg shrink-0">📱</span>
                <span>إرسال الرسائل عبر الواتساب والتقرير الأسبوعي</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("reports")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "reports"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📊</span>
                <span>مركز التقارير والإحصائيات</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("alerts")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "alerts"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🚨</span>
                <span>التنبيهات والإنذارات المبكرة</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("curriculum")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "curriculum"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📚</span>
                <span>المنهج والتربية الإيمانية</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection("finance")}
              className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all ${
                activeSection === "finance"
                  ? "bg-[#bd8f2d] text-[#0c5c5e] font-black shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💳</span>
                <span>قسم الحسابات والتقارير المالية</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#bd8f2d]/30">
          <LogoutButton redirectUrl="/onsite/summer/admin" />
        </div>
      </aside>

      {/* 🏛️ 2. Main Executive Content Workspace */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Top Executive Header Bar */}
        <header className="rounded-3xl border-2 border-[#bd8f2d]/60 bg-white p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-[#0c5c5e]/10 px-3 py-0.5 text-xs font-bold text-[#0c5c5e] font-serif mb-1">
              ✨ بوابة الإشراف الإداري العام
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#0c5c5e]">
              إدارة الدورة الصيفية لتعليم القرآن الكريم
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setStudentToEdit(null);
                setIsStudentModalOpen(true);
              }}
              className="rounded-2xl bg-[#0c5c5e] hover:bg-[#084547] text-white px-4 py-2.5 text-xs font-bold transition shadow-sm font-serif flex items-center gap-2"
            >
              <span>➕</span>
              <span>إضافة طالب جديد</span>
            </button>
          </div>
        </header>

        {/* SECTION 1: OPERATIONS COMMAND HUB */}
        {activeSection === "operations" && (
          <div className="space-y-6">
            {/* Bento Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-gradient-to-br from-white to-[#fcfaf5] p-5 shadow-sm space-y-2">
                <span className="text-xs font-bold text-gray-500 font-serif">👥 إجمالي الطلاب النشطين</span>
                <div className="text-3xl font-bold font-mono text-[#0c5c5e]">{students.length}</div>
                <p className="text-[11px] text-gray-500 font-bold">مسجلون بالدورة الصيفية</p>
              </div>

              <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-gradient-to-br from-white to-[#fcfaf5] p-5 shadow-sm space-y-2">
                <span className="text-xs font-bold text-gray-500 font-serif">🕌 الحلقات الدراسية</span>
                <div className="text-3xl font-bold font-mono text-[#bd8f2d]">{circles.length}</div>
                <p className="text-[11px] text-gray-500 font-bold">حلقة قرآن ونور بيان</p>
              </div>

              <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-gradient-to-br from-white to-[#fcfaf5] p-5 shadow-sm space-y-2">
                <span className="text-xs font-bold text-gray-500 font-serif">🎓 الكادر التعليمي</span>
                <div className="text-3xl font-bold font-mono text-[#0c5c5e]">{teachers.length}</div>
                <p className="text-[11px] text-gray-500 font-bold">معلماً ومربياً فاضلاً</p>
              </div>

              <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-gradient-to-br from-white to-[#fcfaf5] p-5 shadow-sm space-y-2">
                <span className="text-xs font-bold text-gray-500 font-serif">📩 الطلبات المعلقة</span>
                <div className="text-3xl font-bold font-mono text-rose-600">{pendingRequests.length}</div>
                <p className="text-[11px] text-rose-700 font-bold">تعبئة/تعديل أيام سابقة</p>
              </div>
            </div>

            {/* Past-Days Teacher Edit Request Approval Center */}
            {pendingRequests.length > 0 && (
              <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                      className="rounded-2xl border border-amber-300 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-amber-900 font-bold font-serif">
                          <span>طلب من الأستاذ: <b>{req.teacher?.fullName}</b></span>
                          {req.student?.fullName && <span>| الطالب: <b>{req.student.fullName}</b></span>}
                        </div>
                        <p className="text-gray-700 font-bold">{req.subject}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReviewRequest(req.id, "APPROVED")}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition font-serif shadow-2xs"
                        >
                          ✅ موافقة واعتماد التقرير
                        </button>
                        <button
                          onClick={() => handleReviewRequest(req.id, "REJECTED")}
                          className="rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 text-xs font-bold transition"
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
            {/* Search & Action Bar */}
            <div className="rounded-3xl border border-[#bd8f2d]/50 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث باسم الطالب أو الكود..."
                  className="rounded-xl border border-gray-300 bg-[#faf8f4] px-4 py-2 text-xs font-bold outline-none w-full sm:w-64 focus:ring-2 focus:ring-[#0c5c5e]"
                />

                <select
                  value={filterGroup}
                  onChange={(e: any) => setFilterGroup(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-[#faf8f4] px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="ALL">جميع المسارات</option>
                  <option value="QURAN">📖 قرآن كريم</option>
                  <option value="NOOR_AL_BAYAN">📘 نور البيان</option>
                </select>

                <select
                  value={filterCircleId}
                  onChange={(e) => setFilterCircleId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-[#faf8f4] px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="ALL">جميع الحلقات</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      حلقة: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setStudentToEdit(null);
                  setIsStudentModalOpen(true);
                }}
                className="rounded-xl bg-[#0c5c5e] text-white px-4 py-2 text-xs font-bold hover:bg-[#084547] transition shadow-2xs font-serif shrink-0"
              >
                ➕ إضافة طالب جديد
              </button>
            </div>

            {/* Students Data Table */}
            <div className="rounded-3xl border border-[#bd8f2d]/50 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0c5c5e] text-white font-serif text-xs">
                    <th className="p-3.5 border-b">اسم الطالب</th>
                    <th className="p-3.5 border-b">المسار</th>
                    <th className="p-3.5 border-b">الحلقة</th>
                    <th className="p-3.5 border-b">المعلم المسؤول</th>
                    <th className="p-3.5 border-b">آخر تقرير</th>
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
                        className={`border-b border-gray-100 transition ${
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
                        <td className="p-3.5 font-mono text-gray-600">
                          {st.summerReports[0]?.dateKey || "لا يوجد"}
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
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                قائمة المعلمين والحلقات المسندة ({teachers.length} معلماً)
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {teachers.map((t) => {
                const assignedCircles = circles.filter((c) => c.teacher?.id === t.id);
                const teacherStudents = students.filter((s) => s.teacherId === t.id);

                return (
                  <div
                    key={t.id}
                    className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-white p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-[#0c5c5e] text-white flex items-center justify-center font-bold text-sm font-serif">
                          أ
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#0c5c5e] font-serif">
                            أستاذ: {t.fullName}
                          </h4>
                          <p className="text-xs font-semibold text-gray-500">{t.email || "معلم صيفي"}</p>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold font-mono">
                        {teacherStudents.length} طالباً
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-3 text-xs font-bold text-gray-600">
                      <span>الحلقات المسندة: </span>
                      {assignedCircles.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {assignedCircles.map((c) => (
                            <span key={c.id} className="rounded-lg bg-[#faf8f4] border border-[#bd8f2d]/40 px-2.5 py-0.5 text-[#0c5c5e]">
                              حلقة: {c.name} ({c.students?.length || 0} طلاب)
                            </span>
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
            <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                    📱 إرسال الرسائل عبر الواتساب والتقرير الأسبوعي
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    التحكم في بث التقارير اليومية وبطاقات الأداء الأسبوعية لأولياء الأمور
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      whatsappConnected
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-rose-100 text-rose-900 border border-rose-300"
                    }`}
                  >
                    {whatsappConnected ? "الواتساب متصل ✅" : "الواتساب غير متصل ❌"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: EXECUTIVE REPORTS & ANALYTICS */}
        {activeSection === "reports" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                📊 مركز التقارير والإحصائيات المجملة والتفصيلية
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 space-y-2">
                  <span className="font-bold text-emerald-950 font-serif">📊 التقارير المجملة (الإحصائية):</span>
                  <p className="text-xs font-semibold text-emerald-900">
                    ملخصات أعداد الآيات المحفوظة والمتسمعة اليوم والأسبوع بناءً على إدخالات المعلمين.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 space-y-2">
                  <span className="font-bold text-amber-950 font-serif">📜 التقارير التفصيلية والطباعة:</span>
                  <p className="text-xs font-semibold text-amber-900">
                    استعراض السجل الكامل لأي طالب وطباعته فوراً بضغطة زر واحدة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: SMART EARLY WARNING ALERTS */}
        {activeSection === "alerts" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-rose-300 bg-rose-50/60 p-6 shadow-sm space-y-3">
              <h3 className="text-xl font-bold text-rose-950 font-serif flex items-center gap-2">
                <span>🚨</span>
                <span>شريط التنبيهات والإنذارات المبكرة</span>
              </h3>
              <p className="text-xs text-rose-900 font-bold">
                تنبيهات فورية وحلقات المتابعة للطلاب الذين يتطلب وضعهم تدخل الإدارة
              </p>
            </div>
          </div>
        )}

        {/* SECTION 7: CURRICULUM */}
        {activeSection === "curriculum" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
                📚 المنهج والتربية الإيمانية
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                خطة الدروس التربوية والإيمانية الأسبوعية
              </p>
            </div>
          </div>
        )}

        {/* SECTION 8: FINANCE & ACCOUNTS */}
        {activeSection === "finance" && (
          <div className="space-y-5">
            <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-xl font-bold text-[#0c5c5e] font-serif flex items-center gap-2">
                <span>💳</span>
                <span>قسم الحسابات والتقارير المالية</span>
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                مساحة مخصصة للتقارير والحسابات المالية المستقبلية الدورة الصيفية
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

      <AdminPrintableReportModal
        isOpen={isPrintModalOpen}
        studentId={studentToPrint?.id || null}
        studentName={studentToPrint?.name}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
