"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
};

type TrackResource = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  fileUrl: string;
  fileName: string;
  teacherId: string | null;
  teacher: Teacher | null;
};

const tracks = [
  { value: "", label: "بدون مسار محدد" },
  { value: "HIJAA", label: "مسار الهجاء" },
  { value: "RUBAI", label: "المسار الرباعي" },
  { value: "FARDI", label: "المسار الفردي" },
  { value: "TILAWA", label: "مسار التلاوة" },
];

function trackLabel(track: string | null) {
  return tracks.find((item) => item.value === (track || ""))?.label || "بدون مسار محدد";
}

export default function RemoteAdminResourcesPage() {
  const [resources, setResources] = useState<TrackResource[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resourcesResponse, teachersResponse] = await Promise.all([
        fetch("/api/track-resources", { cache: "no-store" }),
        fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
      ]);
      const [resourcesData, teachersData] = await Promise.all([
        resourcesResponse.json(),
        teachersResponse.json(),
      ]);

      setResources(Array.isArray(resourcesData.resources) ? resourcesData.resources : []);
      setTeachers(
        Array.isArray(teachersData.teachers)
          ? teachersData.teachers.filter((teacher: { isActive?: boolean }) => teacher.isActive !== false)
          : []
      );
    } catch (error) {
      console.error("FETCH TEACHER RESOURCES PAGE ERROR =>", error);
      setResources([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!teacherId) {
      alert("اختر المعلم أولا");
      return;
    }

    if (!file) {
      alert("اختر ملفا أولا");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("track", track);
      formData.append("teacherId", teacherId);
      formData.append("file", file);

      const response = await fetch("/api/track-resources", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر رفع الملف");
        return;
      }

      setTitle("");
      setDescription("");
      setTrack("");
      setTeacherId("");
      setFile(null);
      await fetchData();
    } catch (error) {
      console.error("UPLOAD TEACHER RESOURCE ERROR =>", error);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    const shouldDelete = window.confirm("هل تريد حذف هذا الملف؟");

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(resourceId);
      const response = await fetch("/api/track-resources", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resourceId }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر حذف الملف");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("DELETE TEACHER RESOURCE ERROR =>", error);
      alert("حدث خطأ أثناء حذف الملف");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">ملفات المعلمين</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              ارفع ملفا مخصصا لمعلم معين، وسيظهر لهذا المعلم فقط في لوحة المعلم عن بعد.
            </p>
          </div>
          <Link href="/remote/admin/dashboard" className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]">
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">رفع ملف جديد</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">المعلم</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" required>
                  <option value="">اختر المعلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">عنوان الملف</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: خطة المسار لهذا الأسبوع" className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">وصف مختصر</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ملاحظات سريعة عن الملف" rows={3} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">المسار</label>
                <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3">
                  {tracks.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">الملف</label>
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-2xl border border-dashed border-[#d9c8ad] bg-[#fffaf2] px-4 py-5 text-sm" required />
                <p className="mt-2 text-xs leading-6 text-[#1c2d31]/55">
                  الصيغة المسموحة PDF فقط، والحجم لا يتجاوز 25MB.
                </p>
              </div>

              <button disabled={submitting} className="w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                {submitting ? "جاري الرفع..." : "رفع الملف"}
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">الملفات الحالية</h2>
            {loading ? (
              <p className="text-sm text-[#1c2d31]/60">جاري التحميل...</p>
            ) : resources.length === 0 ? (
              <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">لا توجد ملفات مرفوعة بعد.</p>
            ) : (
              <div className="grid gap-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-[#d9c8ad]/70 bg-[#fffaf2] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-[#1c2d31]">{resource.title}</p>
                        <p className="mt-1 text-sm text-[#1c2d31]/60">
                          المعلم: {resource.teacher?.fullName || "غير محدد"}
                        </p>
                        <p className="mt-1 text-sm text-[#1c2d31]/60">
                          المسار: {trackLabel(resource.track)}
                        </p>
                        {resource.description ? (
                          <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">{resource.description}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#173d42] px-4 py-3 text-center text-sm font-black text-white">
                          فتح الملف
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(resource.id)}
                          disabled={deletingId === resource.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-700 disabled:opacity-60"
                        >
                          {deletingId === resource.id ? "جاري الحذف..." : "حذف"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
