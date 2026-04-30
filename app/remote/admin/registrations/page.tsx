"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  teacher: Teacher | null;
};

type RegistrationRequest = {
  id: string;
  studentName: string;
  previousStudent: boolean;
  birthDate: string | null;
  grade: string | null;
  gender: string | null;
  nationality: string | null;
  country: string | null;
  fatherAlive: boolean | null;
  motherAlive: boolean | null;
  livingWith: string | null;
  fatherEducation: string | null;
  motherEducation: string | null;
  idImageUrl: string | null;
  idImageFileName: string | null;
  preferredPeriod: string | null;
  parentWhatsapp: string;
  parentEmail: string | null;
  previousStudy: string | null;
  memorizedAmount: string | null;
  readingLevel: string | null;
  tajweedLevel: string | null;
  hasLearningIssues: boolean;
  learningIssuesNote: string | null;
  hasDevice: boolean;
  requestedTracks: string | null;
  readGuidelines: boolean;
  audioUrl: string | null;
  audioFileName: string | null;
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdStudentId: string | null;
  forwardedToSupervisionAt: string | null;
  supervisionStatus: "PENDING" | "UNDER_REVIEW" | "PLACED" | "ON_HOLD";
  supervisionNote: string | null;
  createdAt: string;
};

const trackTuition: Record<string, number> = {
  HIJAA: 250,
  TILAWA: 250,
  RUBAI: 250,
  FARDI: 600,
};

function getExpectedTuition(requestedTracks?: string | null, circleTrack?: string | null) {
  const tracks = [
    ...(circleTrack ? [circleTrack] : []),
    ...String(requestedTracks || "")
      .split(",")
      .map((track) => track.trim())
      .filter(Boolean),
  ];

  if (tracks.includes("FARDI")) return 600;
  const firstPricedTrack = tracks.find((track) => trackTuition[track]);

  return firstPricedTrack ? trackTuition[firstPricedTrack] : 250;
}

export default function RemoteAdminRegistrationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCircle, setSelectedCircle] = useState<Record<string, string>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [financeAmount, setFinanceAmount] = useState<Record<string, string>>({});
  const [updatingFileId, setUpdatingFileId] = useState("");
  const [deletingRequestId, setDeletingRequestId] = useState("");
  const [sendingAcceptanceId, setSendingAcceptanceId] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [audioFiles, setAudioFiles] = useState<Record<string, File | null>>({});
  const [idImageFiles, setIdImageFiles] = useState<Record<string, File | null>>({});
  const [scheduleDetailsByRequestId, setScheduleDetailsByRequestId] = useState<Record<string, string>>({});
  const [forwardingId, setForwardingId] = useState("");
  const [supervisionNotesByRequestId, setSupervisionNotesByRequestId] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, teachersRes, circlesRes] = await Promise.all([
        fetch("/api/registration-requests", { cache: "no-store" }),
        fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/circles?studyMode=REMOTE", { cache: "no-store" }),
      ]);
      const [requestsData, teachersData, circlesData] = await Promise.all([
        requestsRes.json(),
        teachersRes.json(),
        circlesRes.json(),
      ]);

      setRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
      setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
      setCircles(Array.isArray(circlesData.circles) ? circlesData.circles : []);
    } catch (error) {
      console.error("FETCH REGISTRATION REQUESTS PAGE ERROR =>", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetch("/api/registration-requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "MARK_SEEN",
      }),
    }).catch((error) => {
      console.error("MARK REGISTRATION REQUESTS AS SEEN ERROR =>", error);
    });
  }, []);

  const updateRequest = async (
    requestId: string,
    action: "ACCEPT" | "REJECT" | "ACCEPT_AND_FORWARD_TO_SUPERVISION"
  ) => {
    const response = await fetch("/api/registration-requests", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId,
        action,
        circleId: selectedCircle[requestId] || "",
        teacherId: selectedTeacher[requestId] || "",
        financeAmount: financeAmount[requestId] || "",
        financeCurrency: "USD",
        supervisionNote: supervisionNotesByRequestId[requestId] || "",
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "تعذر تحديث طلب التسجيل");
      return;
    }

    await fetchData();
  };

  const updateFiles = async (requestId: string) => {
    const audio = audioFiles[requestId];
    const idImage = idImageFiles[requestId];

    if (!audio && !idImage) {
      alert("اختر ملفا جديدا للصوت أو الهوية أولا");
      return;
    }

    try {
      setUpdatingFileId(requestId);
      const formData = new FormData();

      if (audio) {
        formData.append("audio", audio);
      }

      if (idImage) {
        formData.append("idImage", idImage);
      }

      const response = await fetch(`/api/registration-requests/${requestId}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث الملفات");
        return;
      }

      setAudioFiles((prev) => ({ ...prev, [requestId]: null }));
      setIdImageFiles((prev) => ({ ...prev, [requestId]: null }));
      await fetchData();
    } catch (error) {
      console.error("UPDATE REGISTRATION FILES ERROR =>", error);
      alert("حدث خطأ أثناء تحديث الملفات");
    } finally {
      setUpdatingFileId("");
    }
  };

  const deleteRequest = async (requestId: string) => {
    const shouldDelete = window.confirm("هل تريد حذف طلب التسجيل نهائيا؟");

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingRequestId(requestId);
      const response = await fetch(`/api/registration-requests/${requestId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر حذف طلب التسجيل");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("DELETE REGISTRATION REQUEST ERROR =>", error);
      alert("حدث خطأ أثناء حذف طلب التسجيل");
    } finally {
      setDeletingRequestId("");
    }
  };

  const deleteAllRequests = async () => {
    const shouldDelete = window.confirm(
      "هل تريد مسح جميع طلبات التسجيل السابقة نهائيا؟ سيبقى الطلاب المقبولون في النظام لكن سيتم حذف سجل الطلبات."
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setBulkDeleting(true);
      const response = await fetch("/api/registration-requests", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر مسح طلبات التسجيل");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("DELETE ALL REGISTRATION REQUESTS ERROR =>", error);
      alert("حدث خطأ أثناء مسح طلبات التسجيل");
    } finally {
      setBulkDeleting(false);
    }
  };

  const sendAcceptanceMessage = async (requestId: string) => {
    try {
      setSendingAcceptanceId(requestId);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action: "SEND_ACCEPTANCE_MESSAGE",
          scheduleDetails: scheduleDetailsByRequestId[requestId] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال رسالة القبول");
        return;
      }

      alert("تم إرسال رسالة القبول لولي الأمر بنجاح");
    } catch (error) {
      console.error("SEND ACCEPTANCE MESSAGE ERROR =>", error);
      alert("حدث خطأ أثناء إرسال رسالة القبول");
    } finally {
      setSendingAcceptanceId("");
    }
  };

  const forwardToSupervision = async (requestId: string) => {
    try {
      setForwardingId(requestId);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action: "FORWARD_TO_SUPERVISION",
          supervisionNote: supervisionNotesByRequestId[requestId] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحويل الطلب إلى الإشراف");
        return;
      }

      alert("تم تحويل الطلب إلى الإشراف بنجاح");
      await fetchData();
    } catch (error) {
      console.error("FORWARD TO SUPERVISION ERROR =>", error);
      alert("حدث خطأ أثناء تحويل الطلب إلى الإشراف");
    } finally {
      setForwardingId("");
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">طلبات التسجيل</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              راجع الطلبات، وعدل ملفات الطلب عند الحاجة، ثم اقبل الطالب أو ارفضه أو احذف الطلب.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={deleteAllRequests}
              disabled={bulkDeleting || requests.length === 0}
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-center text-sm font-black text-red-700 disabled:opacity-60"
            >
              {bulkDeleting ? "جاري مسح الطلبات..." : "مسح جميع الطلبات السابقة"}
            </button>
            <Link
              href="/remote/admin/dashboard"
              className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل الطلبات...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد طلبات تسجيل حتى الآن.
          </div>
        ) : (
          <section className="grid gap-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-[#1c2d31]">{request.studentName}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          request.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : request.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {request.status === "PENDING"
                          ? "قيد المراجعة"
                          : request.status === "ACCEPTED"
                            ? "مقبول"
                            : "مرفوض"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                      ولي الأمر: {request.parentWhatsapp} - البريد: {request.parentEmail || "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <p className="self-center text-sm font-bold text-[#1c2d31]/50">
                      {new Date(request.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteRequest(request.id)}
                      disabled={deletingRequestId === request.id}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:opacity-60"
                    >
                      {deletingRequestId === request.id ? "جاري الحذف..." : "حذف الطلب"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">الصف/العمر</p>
                    <p className="mt-1 text-[#1c2d31]/60">
                      {request.grade || "-"} /{" "}
                      {request.birthDate ? new Date(request.birthDate).toLocaleDateString("ar-EG") : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">الجنسية/بلد الإقامة</p>
                    <p className="mt-1 text-[#1c2d31]/60">
                      {request.nationality || "-"} / {request.country || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">حياة الوالدين</p>
                    <p className="mt-1 text-[#1c2d31]/60">
                      الأب: {request.fatherAlive === null ? "-" : request.fatherAlive ? "نعم" : "لا"} - الأم:{" "}
                      {request.motherAlive === null ? "-" : request.motherAlive ? "نعم" : "لا"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">السكن</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.livingWith || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">تعليم الأب/الأم</p>
                    <p className="mt-1 text-[#1c2d31]/60">
                      {request.fatherEducation || "-"} / {request.motherEducation || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">الفترة</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.preferredPeriod || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">المسارات المطلوبة</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.requestedTracks || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#173d42] p-3 text-sm text-white">
                    <p className="font-black">الرسوم المتوقعة</p>
                    <p className="mt-1 text-white/75">
                      {getExpectedTuition(
                        request.requestedTracks,
                        circles.find((circle) => circle.id === selectedCircle[request.id])?.track
                      )}{" "}
                      USD
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">التجهيزات</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.hasDevice ? "متوفرة" : "غير مؤكدة"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">قراءة التعليمات</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.readGuidelines ? "تم التأكيد" : "لم يؤكد"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">مستوى القراءة</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.readingLevel || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">مستوى التجويد</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.tajweedLevel || "-"}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm leading-7 text-[#1c2d31]/65">
                    <span className="font-black text-[#1c2d31]">الدراسة السابقة:</span> {request.previousStudy || "-"}
                    <br />
                    <span className="font-black text-[#1c2d31]">الحفظ السابق:</span> {request.memorizedAmount || "-"}
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm leading-7 text-[#1c2d31]/65">
                    <span className="font-black text-[#1c2d31]">ملاحظات:</span> {request.learningIssuesNote || request.notes || "-"}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-[#fffaf2] p-4">
                    <p className="mb-3 text-sm font-black text-[#1c2d31]">ملف الهوية أو الإقامة</p>
                    {request.idImageUrl ? (
                      <a
                        href={request.idImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                      >
                        فتح ملف الهوية الحالي
                      </a>
                    ) : (
                      <p className="text-sm text-[#1c2d31]/55">لا يوجد ملف مرفوع حاليا.</p>
                    )}
                    <div className="mt-4 rounded-2xl border border-dashed border-[#d9c8ad] bg-white p-4">
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">استبدال ملف الهوية</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) =>
                          setIdImageFiles((prev) => ({
                            ...prev,
                            [request.id]: event.target.files?.[0] || null,
                          }))
                        }
                        className="w-full text-sm"
                      />
                      <p className="mt-2 text-xs leading-6 text-[#1c2d31]/55">الحجم المسموح الآن حتى 2MB.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#fffaf2] p-4">
                    <p className="mb-3 text-sm font-black text-[#1c2d31]">تسجيل آية الكرسي</p>
                    {request.audioUrl ? (
                      <>
                        <audio controls src={request.audioUrl} className="min-h-14 w-full" />
                        <a
                          href={request.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                        >
                          فتح التسجيل الحالي
                        </a>
                      </>
                    ) : (
                      <p className="text-sm text-[#1c2d31]/55">لا يوجد تسجيل مرفوع حاليا.</p>
                    )}
                    <div className="mt-4 rounded-2xl border border-dashed border-[#d9c8ad] bg-white p-4">
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">استبدال التسجيل الصوتي</label>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        onChange={(event) =>
                          setAudioFiles((prev) => ({
                            ...prev,
                            [request.id]: event.target.files?.[0] || null,
                          }))
                        }
                        className="w-full text-sm"
                      />
                      <p className="mt-2 text-xs leading-6 text-[#1c2d31]/55">الحجم المسموح الآن حتى 5MB.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFiles(request.id)}
                      disabled={updatingFileId === request.id}
                      className="mt-4 rounded-xl bg-[#8a6335] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {updatingFileId === request.id ? "جاري تحديث الملفات..." : "حفظ تعديل الملفات"}
                    </button>
                  </div>
                </div>

                {request.status === "PENDING" ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.8fr_auto_auto] md:items-end">
                      <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">الحلقة</label>
                      <select
                        value={selectedCircle[request.id] || ""}
                        onChange={(e) => {
                          const circleId = e.target.value;
                          const circleTrack = circles.find((circle) => circle.id === circleId)?.track;

                          setSelectedCircle((prev) => ({ ...prev, [request.id]: circleId }));
                          setFinanceAmount((prev) => ({
                            ...prev,
                            [request.id]: String(getExpectedTuition(request.requestedTracks, circleTrack)),
                          }));
                        }}
                        className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm"
                      >
                        <option value="">اختر حلقة</option>
                        {circles.map((circle) => (
                          <option key={circle.id} value={circle.id}>
                            {circle.name} {circle.track ? `- ${circle.track}` : ""}
                          </option>
                        ))}
                      </select>
                      </div>
                      <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">أو اختر معلما</label>
                      <select
                        value={selectedTeacher[request.id] || ""}
                        onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [request.id]: e.target.value }))}
                        className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm"
                      >
                        <option value="">اختر معلم</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName}
                          </option>
                        ))}
                      </select>
                      </div>
                      <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">المبلغ المطلوب</label>
                      <div className="flex overflow-hidden rounded-2xl border border-[#d9c8ad] bg-white">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            financeAmount[request.id] ??
                            String(
                              getExpectedTuition(
                                request.requestedTracks,
                                circles.find((circle) => circle.id === selectedCircle[request.id])?.track
                              )
                            )
                          }
                          onChange={(event) =>
                            setFinanceAmount((prev) => ({ ...prev, [request.id]: event.target.value }))
                          }
                          className="w-full px-4 py-3 text-sm outline-none"
                        />
                        <span className="bg-[#fffaf2] px-3 py-3 text-sm font-black text-[#8a6335]">USD</span>
                      </div>
                      <p className="mt-1 text-xs text-[#1c2d31]/55">يمكن تعديله قبل القبول.</p>
                      </div>
                      <button
                      type="button"
                      onClick={() => updateRequest(request.id, "ACCEPT")}
                      className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white"
                      >
                        قبول مباشر
                      </button>
                      <button
                      type="button"
                      onClick={() => updateRequest(request.id, "REJECT")}
                      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700"
                      >
                        رفض
                      </button>
                    </div>
                    <div className="grid gap-3 rounded-[1.5rem] border border-[#d9c8ad] bg-[#fffaf2] p-4 md:grid-cols-[1fr_auto] md:items-end">
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          ملاحظة للإشراف عند التحويل
                        </label>
                        <textarea
                          value={supervisionNotesByRequestId[request.id] || ""}
                          onChange={(event) =>
                            setSupervisionNotesByRequestId((prev) => ({
                              ...prev,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="مثال: تم التحقق من الدفع، يرجى اختبار الطالب وتسكينه في الحلقة المناسبة."
                          className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                        />
                        <p className="mt-1 text-xs leading-6 text-[#1c2d31]/55">
                          هذا الخيار يقبل الطلب إداريًا ويرسله للإشراف مع نسخة من بيانات التسجيل، ثم يختار المشرف الحلقة والمعلم.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateRequest(request.id, "ACCEPT_AND_FORWARD_TO_SUPERVISION")}
                        className="rounded-2xl bg-[#8a6335] px-5 py-3 text-sm font-black text-white"
                      >
                        قبول وتحويل للإشراف
                      </button>
                    </div>
                  </div>
                ) : null}

                {request.status === "ACCEPTED" && request.createdStudentId ? (
                  <div className="mt-4 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="flex-1">
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          تفاصيل موعد الحلقة للرسالة
                        </label>
                        <textarea
                          value={scheduleDetailsByRequestId[request.id] || ""}
                          onChange={(event) =>
                            setScheduleDetailsByRequestId((prev) => ({
                              ...prev,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="مثال: الأحد والثلاثاء والخميس - الساعة 7:30 مساء بتوقيت مكة"
                          className="w-full rounded-2xl border border-[#b8d7cb] bg-white px-4 py-3 text-sm outline-none"
                        />
                        <p className="mt-2 text-xs leading-6 text-[#1c2d31]/55">
                          هذه الرسالة يدوية. أرسلها بعد الدفع واكتمال الترتيب النهائي للحلقة.
                        </p>
                        {request.forwardedToSupervisionAt ? (
                          <p className="mt-2 text-xs font-black text-[#1f6358]">
                            تم تحويل الطلب إلى الإشراف
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => sendAcceptanceMessage(request.id)}
                          disabled={sendingAcceptanceId === request.id}
                          className="w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                        >
                          {sendingAcceptanceId === request.id ? "جاري إرسال الرسالة..." : "إرسال رسالة القبول"}
                        </button>

                        <textarea
                          value={supervisionNotesByRequestId[request.id] || request.supervisionNote || ""}
                          onChange={(event) =>
                            setSupervisionNotesByRequestId((prev) => ({
                              ...prev,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="ملاحظة مختصرة للإشراف: مستوى الطالب، ملاحظات الاختبار، أو ما يلزم متابعته"
                          className="w-full rounded-2xl border border-[#b8d7cb] bg-white px-4 py-3 text-sm outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => forwardToSupervision(request.id)}
                          disabled={forwardingId === request.id || Boolean(request.forwardedToSupervisionAt)}
                          className="w-full rounded-2xl border border-[#1f6358] bg-white px-5 py-3 text-sm font-black text-[#1f6358] disabled:opacity-60"
                        >
                          {request.forwardedToSupervisionAt
                            ? "تم التحويل إلى الإشراف"
                            : forwardingId === request.id
                              ? "جارٍ التحويل..."
                              : "تحويل إلى الإشراف"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {request.status === "ACCEPTED" && !request.createdStudentId ? (
                  <div className="mt-4 rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-4">
                    <p className="text-sm font-black text-[#8a6335]">تم قبول الطلب وتحويله للإشراف</p>
                    <p className="mt-2 text-sm leading-7 text-[#1c2d31]/65">
                      ينتظر الطالب الآن اختيار الحلقة والمعلم من لوحة الإشراف. بعد التسكين سيظهر الطالب في النظام ويمكن إرسال رسالة القبول النهائية لولي الأمر.
                    </p>
                    {request.supervisionNote ? (
                      <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-white p-4 text-xs leading-6 text-[#1c2d31]/70">
                        {request.supervisionNote}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
