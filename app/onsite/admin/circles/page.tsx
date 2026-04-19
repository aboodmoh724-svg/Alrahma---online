"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  studyMode?: "REMOTE" | "ONSITE";
  isActive?: boolean;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  studyMode: "REMOTE" | "ONSITE";
  zoomUrl: string | null;
  teacher: Teacher | null;
  _count: { students: number };
};

export default function OnsiteAdminCirclesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCircleId, setEditingCircleId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    zoomUrl: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    track: "ONSITE_ALL",
    studyMode: "ONSITE",
    zoomUrl: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, circlesRes] = await Promise.all([
        fetch("/api/teachers?studyMode=ONSITE", { cache: "no-store" }),
        fetch("/api/circles?studyMode=ONSITE", { cache: "no-store" }),
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
        teachersList.filter((t) => t.studyMode === "ONSITE" && t.isActive !== false)
      );
      setCircles(circlesList.filter((c) => c.studyMode === "ONSITE"));
    } catch (error) {
      console.error("FETCH ONSITE CIRCLES PAGE DATA ERROR =>", error);
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
        body: JSON.stringify({ ...formData, studyMode: "ONSITE" }),
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
        track: "ONSITE_ALL",
        studyMode: "ONSITE",
        zoomUrl: "",
      });
      await fetchData();
    } catch (error) {
      console.error("CREATE ONSITE CIRCLE SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إضافة الحلقة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeacherChange = async (circleId: string, teacherId: string) => {
    const res = await fetch("/api/circles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId, teacherId, studyMode: "ONSITE" }),
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
      body: JSON.stringify({ circleId, track, studyMode: "ONSITE" }),
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
          studyMode: "ONSITE",
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
      console.error("UPDATE ONSITE CIRCLE ERROR =>", error);
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
      body: JSON.stringify({ circleId: circle.id, studyMode: "ONSITE" }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "تعذر حذف الحلقة");
      return;
    }

    await fetchData();
  };

  const trackLabel = (track: string | null) => {
    if (track === "ONSITE_ALL") return "حضوري للكل";
    if (track === "HIJAA") return "مسار الهجاء";
    if (track === "RUBAI") return "المسار الرباعي";
    if (track === "FARDI") return "المسار الفردي";
    if (track === "TILAWA") return "مسار التلاوة";
    return "لم يحدد";
  };

  const teacherOptions = useMemo(() => teachers, [teachers]);

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              إدارة الحلقات (حضوري)
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              إنشاء الحلقات، تعيين المعلم، وربط الطلاب عبر نقلهم للحلقة.
            </p>
          </div>
          <Link
            href="/onsite/admin/dashboard"
            className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] lg:col-span-1">
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
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
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
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
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
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                >
                  <option value="ONSITE_ALL">حضوري للكل</option>
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
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "جاري الإضافة..." : "إضافة الحلقة"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1c2d31]">قائمة الحلقات</h2>
              <span className="text-sm font-bold text-[#1c2d31]/60">
                {circles.length} حلقة
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                جاري التحميل...
              </div>
            ) : circles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                لا توجد حلقات حضورية حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-2xl">
                  <thead>
                    <tr className="bg-[#fffaf2] text-right text-sm text-[#1c2d31]/70">
                      <th className="px-4 py-3 font-black">الحلقة</th>
                      <th className="px-4 py-3 font-black">المسار</th>
                      <th className="px-4 py-3 font-black">المعلم</th>
                      <th className="px-4 py-3 font-black">الطلاب</th>
                      <th className="px-4 py-3 font-black">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circles.map((circle) => (
                      <tr
                        key={circle.id}
                        className="border-b border-[#d9c8ad]/30 text-sm"
                      >
                        <td className="px-4 py-3 font-black text-[#1c2d31]">
                          {editingCircleId === circle.id ? (
                            <input
                              value={editData.name}
                              onChange={(event) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  name: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                            />
                          ) : (
                            circle.name
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          <select
                            value={circle.track || ""}
                            onChange={(event) =>
                              handleTrackChange(circle.id, event.target.value)
                            }
                            className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                          >
                            <option value="ONSITE_ALL">حضوري للكل</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          <select
                            value={circle.teacher?.id || ""}
                            onChange={(event) =>
                              handleTeacherChange(circle.id, event.target.value)
                            }
                            className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                          >
                            <option value="">بدون معلم</option>
                            {teacherOptions.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          {circle._count.students}
                        </td>
                        <td className="px-4 py-3">
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
                                className="w-48 rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                              />
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleUpdateCircle(circle.id)}
                                className="rounded-xl bg-[#1f6358] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setEditingCircleId(null)}
                                className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs font-black text-[#1c2d31] disabled:opacity-60"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
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
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

