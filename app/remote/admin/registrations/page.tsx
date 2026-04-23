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
  }, []);

  const updateRequest = async (requestId: string, action: "ACCEPT" | "REJECT") => {
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
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "تعذر تحديث طلب التسجيل");
      return;
    }

    await fetchData();
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">طلبات التسجيل</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              راجع طلبات التسجيل، ثم اختر حلقة أو معلما لقبول الطالب وتحويله إلى طالب رسمي.
            </p>
          </div>
          <Link href="/remote/admin/dashboard" className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]">
            الرجوع للوحة الإدارة
          </Link>
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
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${
                        request.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : request.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                      }`}>
                        {request.status === "PENDING" ? "قيد المراجعة" : request.status === "ACCEPTED" ? "مقبول" : "مرفوض"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                      ولي الأمر: {request.parentWhatsapp} - البريد: {request.parentEmail || "-"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#1c2d31]/50">
                    {new Date(request.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">الصف/العمر</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.grade || "-"} / {request.birthDate ? new Date(request.birthDate).toLocaleDateString("ar-EG") : "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">الجنسية/بلد الإقامة</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.nationality || "-"} / {request.country || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">حياة الوالدين</p>
                    <p className="mt-1 text-[#1c2d31]/60">
                      الأب: {request.fatherAlive === null ? "-" : request.fatherAlive ? "نعم" : "لا"} - الأم: {request.motherAlive === null ? "-" : request.motherAlive ? "نعم" : "لا"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">السكن</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.livingWith || "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
                    <p className="font-black text-[#1c2d31]">تعليم الأب/الأم</p>
                    <p className="mt-1 text-[#1c2d31]/60">{request.fatherEducation || "-"} / {request.motherEducation || "-"}</p>
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

                {request.idImageUrl ? (
                  <div className="mt-4 rounded-2xl bg-[#fffaf2] p-4">
                    <p className="mb-3 text-sm font-black text-[#1c2d31]">صورة الإقامة أو هوية الطالب</p>
                    <a
                      href={request.idImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                    >
                      فتح ملف الهوية
                    </a>
                  </div>
                ) : null}

                {request.audioUrl ? (
                  <div className="mt-4 rounded-2xl bg-[#fffaf2] p-4">
                    <p className="mb-3 text-sm font-black text-[#1c2d31]">تسجيل آية الكرسي</p>
                    <audio controls src={request.audioUrl} className="w-full" />
                    <a
                      href={request.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                    >
                      فتح التسجيل
                    </a>
                  </div>
                ) : null}

                {request.status === "PENDING" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_0.8fr_auto_auto] md:items-end">
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
                          <option key={circle.id} value={circle.id}>{circle.name} {circle.track ? `- ${circle.track}` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">أو اختر معلمًا</label>
                      <select value={selectedTeacher[request.id] || ""} onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [request.id]: e.target.value }))} className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm">
                        <option value="">اختر معلم</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
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
                    <button type="button" onClick={() => updateRequest(request.id, "ACCEPT")} className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white">
                      قبول
                    </button>
                    <button type="button" onClick={() => updateRequest(request.id, "REJECT")} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700">
                      رفض
                    </button>
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
