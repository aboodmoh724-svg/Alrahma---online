"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  studyMode: "REMOTE" | "ONSITE";
  zoomUrl: string | null;
  teacher: Teacher | null;
  _count: {
    students: number;
  };
};

export default function RemoteAdminCirclesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    track: "",
    studyMode: "REMOTE",
    zoomUrl: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, circlesRes] = await Promise.all([
        fetch("/api/teachers", { cache: "no-store" }),
        fetch("/api/circles", { cache: "no-store" }),
      ]);

      const teachersData = await teachersRes.json();
      const circlesData = await circlesRes.json();

      setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
      setCircles(Array.isArray(circlesData.circles) ? circlesData.circles : []);
    } catch (error) {
      console.error("FETCH CIRCLES PAGE DATA ERROR =>", error);
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const res = await fetch("/api/circles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
        track: "",
        studyMode: "REMOTE",
        zoomUrl: "",
      });
      await fetchData();
    } catch (error) {
      console.error("CREATE CIRCLE SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إضافة الحلقة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeacherChange = async (circleId: string, teacherId: string) => {
    const res = await fetch("/api/circles", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ circleId, teacherId }),
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ circleId, track }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "تعذر تغيير مسار الحلقة");
      return;
    }

    await fetchData();
  };

  const trackLabel = (track: string | null) => {
    if (track === "HIJAA") return "مسار الهجاء";
    if (track === "RUBAI") return "المسار الرباعي";
    if (track === "FARDI") return "المسار الفردي";
    if (track === "TILAWA") return "مسار التلاوة";
    return "لم يحدد";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الحلقات</h1>
            <p className="mt-1 text-sm text-gray-600">
              إضافة الحلقات، تعيين المعلمين، وإدارة روابط الدروس
            </p>
          </div>

          <Link
            href="/remote/admin/dashboard"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            الرجوع للداشبورد
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                إضافة حلقة جديدة
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    اسم الحلقة
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="مثال: حلقة الفجر"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    المعلم
                  </label>
                  <select
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">اختر المعلم</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    مسار الحلقة
                  </label>
                  <select
                    name="track"
                    value={formData.track}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">اختر المسار</option>
                    <option value="HIJAA">مسار الهجاء</option>
                    <option value="RUBAI">المسار الرباعي</option>
                    <option value="FARDI">المسار الفردي</option>
                    <option value="TILAWA">مسار التلاوة</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    نوع الدراسة
                  </label>
                  <select
                    name="studyMode"
                    value={formData.studyMode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="REMOTE">عن بعد</option>
                    <option value="ONSITE">حضوري</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    رابط الحلقة
                  </label>
                  <input
                    type="url"
                    name="zoomUrl"
                    value={formData.zoomUrl}
                    onChange={handleChange}
                    placeholder="https://zoom.us/..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "جاري الإضافة..." : "إضافة الحلقة"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  قائمة الحلقات
                </h2>
                <span className="text-sm text-gray-500">
                  {circles.length} حلقة
                </span>
              </div>

              {loading ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  جاري التحميل...
                </div>
              ) : circles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  لا توجد حلقات حتى الآن
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full overflow-hidden rounded-xl">
                    <thead>
                      <tr className="bg-gray-100 text-right text-sm text-gray-600">
                        <th className="px-4 py-3 font-medium">الحلقة</th>
                        <th className="px-4 py-3 font-medium">المسار</th>
                        <th className="px-4 py-3 font-medium">المعلم</th>
                        <th className="px-4 py-3 font-medium">نوع الدراسة</th>
                        <th className="px-4 py-3 font-medium">الطلاب</th>
                        <th className="px-4 py-3 font-medium">الرابط</th>
                      </tr>
                    </thead>
                    <tbody>
                      {circles.map((circle) => (
                        <tr
                          key={circle.id}
                          className="border-b border-gray-100 text-sm"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {circle.name}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <select
                              value={circle.track || ""}
                              onChange={(event) =>
                                handleTrackChange(circle.id, event.target.value)
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            >
                              <option value="">{trackLabel(null)}</option>
                              <option value="HIJAA">مسار الهجاء</option>
                              <option value="RUBAI">المسار الرباعي</option>
                              <option value="FARDI">المسار الفردي</option>
                              <option value="TILAWA">مسار التلاوة</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <select
                              value={circle.teacher?.id || ""}
                              onChange={(event) =>
                                handleTeacherChange(circle.id, event.target.value)
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            >
                              <option value="">بدون معلم</option>
                              {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.fullName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {circle.studyMode === "REMOTE" ? "عن بعد" : "حضوري"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {circle._count.students}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {circle.zoomUrl ? (
                              <a
                                href={circle.zoomUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                فتح الرابط
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
