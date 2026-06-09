"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  studyMode?: "REMOTE" | "ONSITE_SYRIA";
  isActive?: boolean;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  studyMode: "REMOTE" | "ONSITE_SYRIA";
  zoomUrl: string | null;
  teacher: Teacher | null;
  students?: CircleStudent[];
  _count: { students: number };
};

type CircleStudent = {
  id: string;
  studentCode: string | null;
  fullName: string;
  parentWhatsapp: string | null;
};

const syriaTrackOptions = [
  { value: "ONSITE_QURAN", label: "حلقات القرآن الكريم" },
  { value: "ONSITE_NOUR_AL_BAYAN", label: "حلقات نور البيان" },
  { value: "ONSITE_ALL", label: "حضوري" },
];

function trackLabel(track: string | null) {
  return syriaTrackOptions.find((option) => option.value === track)?.label || "غير محدد";
}

function formatPhone(value: string | null) {
  if (!value) return "لا يوجد رقم";
  if (value.startsWith("963") && value.length === 12) {
    const local = value.slice(3);
    return `+963 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return value;
}

export default function OnsiteAdminCirclesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCircleId, setEditingCircleId] = useState<string | null>(null);
  const [expandedCircleId, setExpandedCircleId] = useState<string | null>(null);
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    zoomUrl: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    track: "ONSITE_QURAN",
    studyMode: "ONSITE_SYRIA",
    zoomUrl: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, circlesRes] = await Promise.all([
        fetch("/api/teachers?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
        fetch("/api/circles?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
      ]);

      const teachersData = await teachersRes.json();
      const circlesData = await circlesRes.json();

      const teachersList = Array.isArray(teachersData.teachers)
        ? (teachersData.teachers as Teacher[])
        : [];
      const circlesList = Array.isArray(circlesData.circles)
        ? (circlesData.circles as Circle[])
        : [];

      setTeachers(
        teachersList.filter((t) => t.studyMode === "ONSITE_SYRIA" && t.isActive !== false)
      );
      setCircles(circlesList.filter((c) => c.studyMode === "ONSITE_SYRIA"));
      setExpandedCircleId((current) => current || circlesList[0]?.id || null);
    } catch (error) {
      console.error("FETCH ONSITE_SYRIA CIRCLES PAGE DATA ERROR =>", error);
      setTeachers([]);
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const res = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, studyMode: "ONSITE_SYRIA" }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة الحلقة");
        return;
      }

      alert("تمت إضافة الحلقة بنجاح");
      setFormData({
        name: "",
        teacherId: "",
        track: "ONSITE_QURAN",
        studyMode: "ONSITE_SYRIA",
        zoomUrl: "",
      });
      await fetchData();
    } catch (error) {
      console.error("CREATE ONSITE_SYRIA CIRCLE SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إضافة الحلقة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeacherChange = async (circleId: string, teacherId: string) => {
    const res = await fetch("/api/circles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId, teacherId, studyMode: "ONSITE_SYRIA" }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "تعذر تغيير معلم الحلقة");
      return;
    }

    await fetchData();
  };

  const handleTrackChange = async (circleId: string, track: string) => {
    const res = await fetch("/api/circles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId, track, studyMode: "ONSITE_SYRIA" }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "تعذر تغيير مسار الحلقة");
      return;
    }

    await fetchData();
  };

  const startEdit = (circle: Circle) => {
    setEditingCircleId(circle.id);
    setEditData({
      name: circle.name,
      zoomUrl: circle.zoomUrl || "",
    });
  };

  const handleUpdateCircle = async (circleId: string) => {
    try {
      setSubmitting(true);

      const res = await fetch("/api/circles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circleId,
          name: editData.name,
          zoomUrl: editData.zoomUrl,
          studyMode: "ONSITE_SYRIA",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "تعذر تحديث بيانات الحلقة");
        return;
      }

      setEditingCircleId(null);
      await fetchData();
    } catch (error) {
      console.error("UPDATE ONSITE_SYRIA CIRCLE ERROR =>", error);
      alert("حدث خطأ أثناء تحديث بيانات الحلقة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCircle = async (circle: Circle) => {
    const confirmed = window.confirm(
      `هل تريد حذف الحلقة ${circle.name}؟ لا يمكن حذف الحلقة إذا كان فيها طلاب.`
    );

    if (!confirmed) return;

    const res = await fetch("/api/circles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId: circle.id, studyMode: "ONSITE_SYRIA" }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "تعذر حذف الحلقة");
      return;
    }

    await fetchData();
  };

  const handleMoveStudent = async (studentId: string, circleId: string) => {
    if (!circleId) return;

    try {
      setMovingStudentId(studentId);
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circleId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر نقل الطالب");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("MOVE ONSITE_SYRIA STUDENT FROM CIRCLE PAGE ERROR =>", error);
      alert("حدث خطأ أثناء نقل الطالب");
    } finally {
      setMovingStudentId(null);
    }
  };

  const handleDeleteStudent = async (student: CircleStudent) => {
    const confirmed = window.confirm(
      `هل تريد حذف الطالب ${student.fullName}؟\n\nسيتم إخفاؤه من قوائم الحضوري ويمكن استرجاعه لاحقا عند الحاجة.`
    );

    if (!confirmed) return;

    try {
      setDeletingStudentId(student.id);
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر حذف الطالب");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("DELETE ONSITE_SYRIA STUDENT FROM CIRCLE PAGE ERROR =>", error);
      alert("حدث خطأ أثناء حذف الطالب");
    } finally {
      setDeletingStudentId(null);
    }
  };

  const teacherOptions = useMemo(() => teachers, [teachers]);
  const totalStudents = useMemo(
    () => circles.reduce((sum, circle) => sum + (circle.students?.length || circle._count.students || 0), 0),
    [circles]
  );

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              إدارة الحلقات والطلاب (حضوري)
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              عرض الحلقات ومعلميها وطلابها، مع نقل الطالب أو تعديل الحلقة من مكان واحد.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/syria/admin/students"
              className="rounded-2xl bg-[#fffaf4] px-5 py-3 text-center text-sm font-black text-[#0a3f2a] ring-1 ring-[#d8bf83] transition hover:bg-white"
            >
              إدارة الطلاب التفصيلية
            </Link>
            <Link
              href="/syria/admin/teachers"
              className="rounded-2xl bg-[#fffaf4] px-5 py-3 text-center text-sm font-black text-[#0a3f2a] ring-1 ring-[#d8bf83] transition hover:bg-white"
            >
              إضافة معلم
            </Link>
            <Link
              href="/syria/admin/dashboard"
              className="rounded-2xl bg-[#0a3f2a] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#0f5a35]"
            >
              لوحة الإدارة
            </Link>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.5rem] bg-[#0a3f2a] p-5 text-white shadow-sm">
            <p className="text-sm font-bold text-white/65">الحلقات</p>
            <p className="mt-2 text-4xl font-black">{circles.length}</p>
          </div>
          <div className="rounded-[1.5rem] bg-[#fffaf4] p-5 text-[#1c2d31] shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الطلاب داخل الحلقات</p>
            <p className="mt-2 text-4xl font-black text-[#0f5a35]">{totalStudents}</p>
          </div>
          <div className="rounded-[1.5rem] bg-white/88 p-5 text-[#1c2d31] shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المعلمون المتاحون</p>
            <p className="mt-2 text-4xl font-black text-[#bd8f2d]">{teacherOptions.length}</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83] lg:col-span-1">
            <h2 className="mb-4 text-lg font-black text-[#1c2d31]">
              إضافة حلقة جديدة
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  اسم الحلقة
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: حلقة الفجر"
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  المعلم
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                >
                  <option value="">بدون معلم</option>
                  {teacherOptions.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  مسار الحلقة
                </label>
                <select
                  name="track"
                  value={formData.track}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                >
                  {syriaTrackOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  رابط الحلقة (اختياري)
                </label>
                <input
                  type="url"
                  name="zoomUrl"
                  value={formData.zoomUrl}
                  onChange={handleChange}
                  placeholder="رابط داخلي أو زوم إن وجد"
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#0f5a35] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "جاري الإضافة..." : "إضافة الحلقة"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83] lg:col-span-2">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1c2d31]">الحلقات والطلاب</h2>
                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                  افتح الحلقة لعرض الطلاب ونقلهم أو حذفهم من نفس الشاشة.
                </p>
              </div>
              <span className="rounded-full bg-[#0f5a35]/10 px-4 py-2 text-sm font-black text-[#0f5a35]">
                {circles.length} حلقة
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
                جاري التحميل...
              </div>
            ) : circles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
                لا توجد حلقات حضورية حتى الآن
              </div>
            ) : (
              <div className="space-y-4">
                {circles.map((circle) => {
                  const isExpanded = expandedCircleId === circle.id;
                  const students = circle.students || [];

                  return (
                    <article
                      key={circle.id}
                      className="overflow-hidden rounded-[1.8rem] border border-[#d8bf83] bg-[#fffdf8] shadow-sm"
                    >
                      <div className="grid gap-4 p-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr_auto] xl:items-center">
                        <div className="min-w-0">
                          {editingCircleId === circle.id ? (
                            <input
                              value={editData.name}
                              onChange={(event) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  name: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-[#d8bf83] bg-white px-3 py-2 outline-none focus:border-[#0f5a35]"
                            />
                          ) : (
                            <>
                              <h3 className="truncate text-xl font-black text-[#1c2d31]">
                                {circle.name}
                              </h3>
                              <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                                {students.length || circle._count.students} طالب - {trackLabel(circle.track)}
                              </p>
                            </>
                          )}
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-black text-[#1c2d31]/55">المسار</p>
                          <select
                            value={circle.track || ""}
                            onChange={(event) =>
                              handleTrackChange(circle.id, event.target.value)
                            }
                            className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 outline-none focus:border-[#0f5a35]"
                          >
                            {syriaTrackOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-black text-[#1c2d31]/55">المعلم</p>
                          <select
                            value={circle.teacher?.id || ""}
                            onChange={(event) =>
                              handleTeacherChange(circle.id, event.target.value)
                            }
                            className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 outline-none focus:border-[#0f5a35]"
                          >
                            <option value="">بدون معلم</option>
                            {teacherOptions.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <button
                            type="button"
                            onClick={() => setExpandedCircleId(isExpanded ? null : circle.id)}
                            className="rounded-xl bg-[#0f5a35] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0a3f2a]"
                          >
                            {isExpanded ? "إخفاء الطلاب" : "عرض الطلاب"}
                          </button>

                          {editingCircleId === circle.id ? (
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="url"
                                value={editData.zoomUrl}
                                onChange={(event) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    zoomUrl: event.target.value,
                                  }))
                                }
                                placeholder="رابط الحلقة"
                                className="w-48 rounded-xl border border-[#d8bf83] bg-white px-3 py-2 outline-none focus:border-[#0f5a35]"
                              />
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleUpdateCircle(circle.id)}
                                className="rounded-xl bg-[#0f5a35] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setEditingCircleId(null)}
                                className="rounded-xl border border-[#d8bf83] px-3 py-2 text-xs font-black text-[#1c2d31] disabled:opacity-60"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(circle)}
                                className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                disabled={submitting || circle._count.students > 0}
                                onClick={() => handleDeleteCircle(circle)}
                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
                                title={circle._count.students > 0 ? "انقل الطلاب أولا قبل حذف الحلقة" : "حذف الحلقة"}
                              >
                                حذف الحلقة
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="border-t border-[#d8bf83]/55 bg-white/70 p-4">
                          {students.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#d8bf83] p-5 text-center text-sm font-bold text-[#1c2d31]/55">
                              لا يوجد طلاب في هذه الحلقة.
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              {students.map((student) => (
                                <div
                                  key={student.id}
                                  className="grid gap-3 rounded-2xl bg-[#fffaf4] p-3 ring-1 ring-[#eadcc4] md:grid-cols-[1fr_11rem_12rem_auto] md:items-center"
                                >
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-lg bg-[#edf6ee] px-2 py-1 font-mono text-xs font-black text-[#0f5a35]">
                                        {student.studentCode || "-"}
                                      </span>
                                      <p className="truncate font-black text-[#1c2d31]">
                                        {student.fullName}
                                      </p>
                                    </div>
                                    <p className="mt-1 font-mono text-xs font-bold text-[#1c2d31]/55" dir="ltr">
                                      {formatPhone(student.parentWhatsapp)}
                                    </p>
                                  </div>

                                  <span className="rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-[#1c2d31]/70 ring-1 ring-[#eadcc4]">
                                    {circle.name}
                                  </span>

                                  <select
                                    value={circle.id}
                                    disabled={movingStudentId === student.id}
                                    onChange={(event) =>
                                      handleMoveStudent(student.id, event.target.value)
                                    }
                                    className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#0f5a35]"
                                  >
                                    {circles.map((targetCircle) => (
                                      <option key={targetCircle.id} value={targetCircle.id}>
                                        {targetCircle.name}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    disabled={deletingStudentId === student.id}
                                    onClick={() => handleDeleteStudent(student)}
                                    className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {deletingStudentId === student.id ? "جار الحذف..." : "حذف الطالب"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

