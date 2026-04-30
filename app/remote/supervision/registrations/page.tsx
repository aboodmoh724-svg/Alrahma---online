"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  periodLabel: string | null;
  startsAt: string | null;
  endsAt: string | null;
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
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdStudentId: string | null;
  forwardedToSupervisionAt: string | null;
  supervisionStatus: "PENDING" | "UNDER_REVIEW" | "PLACED" | "ON_HOLD";
  supervisionNote: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "PLACED", label: "تم التسكين" },
  { value: "ON_HOLD", label: "معلق" },
] as const;

const STATUS_LABELS: Record<RegistrationRequest["supervisionStatus"], string> = {
  PENDING: "بانتظار الإشراف",
  UNDER_REVIEW: "قيد المراجعة",
  PLACED: "تم التسكين",
  ON_HOLD: "معلق",
};

const TRACK_TUITION: Record<string, number> = {
  HIJAA: 250,
  TILAWA: 250,
  RUBAI: 250,
  FARDI: 600,
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function yesNo(value: boolean | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value ? "نعم" : "لا";
}

function getExpectedTuition(requestedTracks?: string | null, circleTrack?: string | null) {
  const tracks = [
    ...(circleTrack ? [circleTrack] : []),
    ...String(requestedTracks || "")
      .split(",")
      .map((track) => track.trim())
      .filter(Boolean),
  ];

  if (tracks.includes("FARDI")) return 600;
  const firstPricedTrack = tracks.find((track) => TRACK_TUITION[track]);

  return firstPricedTrack ? TRACK_TUITION[firstPricedTrack] : 250;
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
      <p className="font-black text-[#1c2d31]">{label}</p>
      <p className="mt-1 leading-6 text-[#1c2d31]/65">{value || "-"}</p>
    </div>
  );
}

export default function RemoteSupervisionRegistrationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, RegistrationRequest["supervisionStatus"]>>({});
  const [selectedCircle, setSelectedCircle] = useState<Record<string, string>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [financeAmount, setFinanceAmount] = useState<Record<string, string>>({});

  const forwardedRequests = useMemo(
    () => requests.filter((request) => request.status === "ACCEPTED" && request.forwardedToSupervisionAt),
    [requests]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsResponse, teachersResponse, circlesResponse] = await Promise.all([
        fetch("/api/registration-requests", { cache: "no-store" }),
        fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/circles?studyMode=REMOTE", { cache: "no-store" }),
      ]);
      const [requestsData, teachersData, circlesData] = await Promise.all([
        requestsResponse.json(),
        teachersResponse.json(),
        circlesResponse.json(),
      ]);
      const list = Array.isArray(requestsData.requests) ? (requestsData.requests as RegistrationRequest[]) : [];

      setRequests(list);
      setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
      setCircles(Array.isArray(circlesData.circles) ? circlesData.circles : []);
      setNotes(Object.fromEntries(list.map((request) => [request.id, request.supervisionNote || ""])));
      setStatuses(
        Object.fromEntries(
          list.map((request) => [request.id, request.supervisionStatus || "PENDING"])
        ) as Record<string, RegistrationRequest["supervisionStatus"]>
      );
    } catch (error) {
      console.error("FETCH SUPERVISION REGISTRATIONS ERROR =>", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveStatus = async (requestId: string) => {
    try {
      setSavingId(requestId);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "UPDATE_SUPERVISION_STATUS",
          supervisionStatus: statuses[requestId],
          supervisionNote: notes[requestId] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث حالة الإشراف");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("UPDATE SUPERVISION REGISTRATION STATUS ERROR =>", error);
      alert("حدث خطأ أثناء تحديث حالة الإشراف");
    } finally {
      setSavingId(null);
    }
  };

  const placeRequest = async (request: RegistrationRequest) => {
    try {
      setPlacingId(request.id);
      const circle = circles.find((item) => item.id === selectedCircle[request.id]);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "PLACE_BY_SUPERVISION",
          circleId: selectedCircle[request.id] || "",
          teacherId: selectedTeacher[request.id] || "",
          financeAmount:
            financeAmount[request.id] || String(getExpectedTuition(request.requestedTracks, circle?.track)),
          financeCurrency: "USD",
          supervisionNote: notes[request.id] || request.supervisionNote || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تسكين الطالب");
        return;
      }

      alert("تم تسكين الطالب وإنشاؤه في النظام بنجاح");
      await fetchData();
    } catch (error) {
      console.error("PLACE SUPERVISION REGISTRATION ERROR =>", error);
      alert("حدث خطأ أثناء تسكين الطالب");
    } finally {
      setPlacingId(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">طلبات التسجيل المحولة</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              راجع بيانات الطالب كما سجلها ولي الأمر، ثم اختر الحلقة أو المعلم المناسب لتسكينه.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل الحالات المحولة...
          </div>
        ) : forwardedRequests.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد طلبات محولة للإشراف حتى الآن.
          </div>
        ) : (
          <div className="space-y-4">
            {forwardedRequests.map((request) => {
              const selectedCircleData = circles.find((circle) => circle.id === selectedCircle[request.id]);

              return (
                <div key={request.id} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                      {STATUS_LABELS[request.supervisionStatus]}
                    </span>
                    <span className="rounded-full bg-[#f0e2c8] px-3 py-1 text-xs font-black text-[#8a6335]">
                      {request.requestedTracks || "لم يحدد المسار"}
                    </span>
                    <span className="text-xs font-bold text-[#1c2d31]/55">
                      {request.forwardedToSupervisionAt
                        ? `حوّل للإشراف: ${formatDate(request.forwardedToSupervisionAt)}`
                        : ""}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-black text-[#1c2d31]">{request.studentName}</h2>
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                          ولي الأمر: {request.parentWhatsapp} - البريد: {request.parentEmail || "-"}
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <InfoItem label="الميلاد/الصف" value={`${request.birthDate ? new Date(request.birthDate).toLocaleDateString("ar-EG") : "-"} / ${request.grade || "-"}`} />
                        <InfoItem label="الجنسية/الإقامة" value={`${request.nationality || "-"} / ${request.country || "-"}`} />
                        <InfoItem label="يسكن مع" value={request.livingWith} />
                        <InfoItem label="الفترة المفضلة" value={request.preferredPeriod} />
                        <InfoItem label="الدراسة السابقة" value={request.previousStudy} />
                        <InfoItem label="المحفوظ السابق" value={request.memorizedAmount} />
                        <InfoItem label="مستوى القراءة" value={request.readingLevel} />
                        <InfoItem label="مستوى التجويد" value={request.tajweedLevel} />
                        <InfoItem label="حياة الوالدين" value={`الأب: ${yesNo(request.fatherAlive)} - الأم: ${yesNo(request.motherAlive)}`} />
                        <InfoItem label="تعليم الوالدين" value={`${request.fatherEducation || "-"} / ${request.motherEducation || "-"}`} />
                        <InfoItem label="مشكلات تعلم" value={request.hasLearningIssues ? request.learningIssuesNote || "نعم" : "لا"} />
                        <InfoItem label="توفر الجهاز" value={request.hasDevice ? "متوفر" : "غير مؤكد"} />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/70">
                          <p className="font-black text-[#1c2d31]">ملاحظات التسجيل</p>
                          <p className="mt-1">{request.notes || "-"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/70">
                          <p className="font-black text-[#1c2d31]">نسخة التحويل من الإدارة</p>
                          <pre className="mt-1 whitespace-pre-wrap font-sans text-xs leading-6">
                            {request.supervisionNote || "-"}
                          </pre>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {request.audioUrl ? (
                          <a
                            href={request.audioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                          >
                            فتح التسجيل الصوتي
                          </a>
                        ) : null}
                        {request.idImageUrl ? (
                          <a
                            href={request.idImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-[#173d42] bg-white px-4 py-2 text-sm font-black text-[#173d42]"
                          >
                            فتح ملف الهوية
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[1.6rem] bg-[#fffaf2] p-4 ring-1 ring-[#e7dcc8]">
                      <select
                        value={statuses[request.id] || request.supervisionStatus}
                        onChange={(event) =>
                          setStatuses((prev) => ({
                            ...prev,
                            [request.id]: event.target.value as RegistrationRequest["supervisionStatus"],
                          }))
                        }
                        className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-bold text-[#1c2d31] outline-none"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <textarea
                        value={notes[request.id] || ""}
                        onChange={(event) =>
                          setNotes((prev) => ({
                            ...prev,
                            [request.id]: event.target.value,
                          }))
                        }
                        placeholder="ملاحظة الإشراف أو نتيجة الاختبار أو سبب التأجيل"
                        className="min-h-28 w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                      />

                      {!request.createdStudentId ? (
                        <div className="space-y-3 rounded-2xl border border-[#d9c8ad] bg-white p-3">
                          <select
                            value={selectedCircle[request.id] || ""}
                            onChange={(event) => {
                              const circleId = event.target.value;
                              const circleTrack = circles.find((circle) => circle.id === circleId)?.track;

                              setSelectedCircle((prev) => ({ ...prev, [request.id]: circleId }));
                              setFinanceAmount((prev) => ({
                                ...prev,
                                [request.id]: String(getExpectedTuition(request.requestedTracks, circleTrack)),
                              }));
                            }}
                            className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                          >
                            <option value="">اختر الحلقة المناسبة</option>
                            {circles.map((circle) => (
                              <option key={circle.id} value={circle.id}>
                                {circle.name}
                                {circle.teacher?.fullName ? ` - ${circle.teacher.fullName}` : ""}
                                {circle.startsAt && circle.endsAt ? ` (${circle.startsAt} - ${circle.endsAt})` : ""}
                              </option>
                            ))}
                          </select>

                          <select
                            value={selectedTeacher[request.id] || ""}
                            onChange={(event) =>
                              setSelectedTeacher((prev) => ({ ...prev, [request.id]: event.target.value }))
                            }
                            className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                          >
                            <option value="">أو اختر معلمًا مباشرة</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>

                          <div className="flex overflow-hidden rounded-xl border border-[#d9c8ad] bg-white">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                financeAmount[request.id] ??
                                String(getExpectedTuition(request.requestedTracks, selectedCircleData?.track))
                              }
                              onChange={(event) =>
                                setFinanceAmount((prev) => ({ ...prev, [request.id]: event.target.value }))
                              }
                              className="w-full px-4 py-3 text-sm outline-none"
                            />
                            <span className="bg-[#fffaf2] px-3 py-3 text-sm font-black text-[#8a6335]">USD</span>
                          </div>

                          <button
                            type="button"
                            disabled={placingId === request.id}
                            onClick={() => placeRequest(request)}
                            className="w-full rounded-xl bg-[#8a6335] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                          >
                            {placingId === request.id ? "جارٍ التسكين..." : "تسكين الطالب وإنشاؤه"}
                          </button>
                        </div>
                      ) : (
                        <Link
                          href="/remote/supervision/students"
                          className="block rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-center text-sm font-black text-[#1c2d31]"
                        >
                          فتح إدارة الطلاب
                        </Link>
                      )}

                      <button
                        type="button"
                        disabled={savingId === request.id}
                        onClick={() => saveStatus(request.id)}
                        className="w-full rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                      >
                        {savingId === request.id ? "جارٍ الحفظ..." : "حفظ حالة الإشراف"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
