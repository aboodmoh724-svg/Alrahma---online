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
  resourceScope: "TEACHER" | "REGISTRATION";
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
  const [teacherResources, setTeacherResources] = useState<TrackResource[]>([]);
  const [registrationResource, setRegistrationResource] = useState<TrackResource | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingTeacherFile, setSubmittingTeacherFile] = useState(false);
  const [submittingRegistrationFile, setSubmittingRegistrationFile] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [registrationTitle, setRegistrationTitle] = useState("التعليمات والتوجيهات للطلاب وأولياء الأمور");
  const [registrationDescription, setRegistrationDescription] = useState("");
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teacherResourcesResponse, registrationResourceResponse, teachersResponse] = await Promise.all([
        fetch("/api/track-resources", { cache: "no-store" }),
        fetch("/api/track-resources?scope=REGISTRATION", { cache: "no-store" }),
        fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
      ]);
      const [teacherResourcesData, registrationResourceData, teachersData] = await Promise.all([
        teacherResourcesResponse.json(),
        registrationResourceResponse.json(),
        teachersResponse.json(),
      ]);

      setTeacherResources(Array.isArray(teacherResourcesData.resources) ? teacherResourcesData.resources : []);
      setRegistrationResource(
        Array.isArray(registrationResourceData.resources) && registrationResourceData.resources.length > 0
          ? registrationResourceData.resources[0]
          : null
      );
      setTeachers(
        Array.isArray(teachersData.teachers)
          ? teachersData.teachers.filter((teacher: { isActive?: boolean }) => teacher.isActive !== false)
          : []
      );
    } catch (error) {
      console.error("FETCH TEACHER RESOURCES PAGE ERROR =>", error);
      setTeacherResources([]);
      setRegistrationResource(null);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTeacherSubmit = async (event: React.FormEvent) => {
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
      setSubmittingTeacherFile(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("track", track);
      formData.append("teacherId", teacherId);
      formData.append("scope", "TEACHER");
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
      setSubmittingTeacherFile(false);
    }
  };

  const handleRegistrationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!registrationFile) {
      alert("اختر ملف التعليمات الجديد أولا");
      return;
    }

    try {
      setSubmittingRegistrationFile(true);
      const formData = new FormData();
      formData.append("title", registrationTitle);
      formData.append("description", registrationDescription);
      formData.append("scope", "REGISTRATION");
      formData.append("file", registrationFile);

      const response = await fetch("/api/track-resources", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث ملف التعليمات");
        return;
      }

      setRegistrationFile(null);
      await fetchData();
    } catch (error) {
      console.error("UPLOAD REGISTRATION RESOURCE ERROR =>", error);
      alert("حدث خطأ أثناء تحديث ملف التعليمات");
    } finally {
      setSubmittingRegistrationFile(false);
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
      console.error("DELETE TRACK RESOURCE ERROR =>", error);
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
            <h1 className="text-4xl font-black text-[#1c2d31]">إدارة الملفات</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              من هنا يمكنك تغيير ملف التعليمات الخاص بفورم التسجيل، ورفع ملفات مخصصة لكل معلم عن بعد.
            </p>
          </div>
          <Link href="/remote/admin/dashboard" className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]">
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-[#1c2d31]">ملف التعليمات لفورم التسجيل</h2>
                <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                  هذا الملف يظهر داخل فورم تسجيل الطالب. رفع ملف جديد هنا سيستبدل الملف الحالي مباشرة.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">عنوان الملف</label>
                <input value={registrationTitle} onChange={(e) => setRegistrationTitle(e.target.value)} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">وصف مختصر</label>
                <textarea value={registrationDescription} onChange={(e) => setRegistrationDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">الملف الجديد</label>
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)} className="w-full rounded-2xl border border-dashed border-[#d9c8ad] bg-[#fffaf2] px-4 py-5 text-sm" required />
              </div>
              <button disabled={submittingRegistrationFile} className="rounded-2xl bg-[#8a6335] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                {submittingRegistrationFile ? "جاري التحديث..." : "تحديث ملف التعليمات"}
              </button>
            </form>

            <div className="rounded-2xl bg-[#fffaf2] p-4">
              <h3 className="text-lg font-black text-[#1c2d31]">الملف الحالي</h3>
              {loading ? (
                <p className="mt-3 text-sm text-[#1c2d31]/60">جاري التحميل...</p>
              ) : registrationResource ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="font-black text-[#1c2d31]">{registrationResource.title}</p>
                    {registrationResource.description ? (
                      <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">{registrationResource.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={registrationResource.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#173d42] px-4 py-3 text-sm font-black text-white">
                      فتح الملف الحالي
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(registrationResource.id)}
                      disabled={deletingId === registrationResource.id}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60"
                    >
                      {deletingId === registrationResource.id ? "جاري الحذف..." : "حذف الملف"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#1c2d31]/60">لا يوجد ملف تعليمات مرفوع حاليا.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={handleTeacherSubmit} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">رفع ملف لمعلم</h2>
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
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">وصف مختصر</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" />
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
              </div>
              <button disabled={submittingTeacherFile} className="w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                {submittingTeacherFile ? "جاري الرفع..." : "رفع الملف للمعلم"}
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">ملفات المعلمين الحالية</h2>
            {loading ? (
              <p className="text-sm text-[#1c2d31]/60">جاري التحميل...</p>
            ) : teacherResources.length === 0 ? (
              <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">لا توجد ملفات معلمين مرفوعة بعد.</p>
            ) : (
              <div className="grid gap-3">
                {teacherResources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-[#d9c8ad]/70 bg-[#fffaf2] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-[#1c2d31]">{resource.title}</p>
                        <p className="mt-1 text-sm text-[#1c2d31]/60">المعلم: {resource.teacher?.fullName || "غير محدد"}</p>
                        <p className="mt-1 text-sm text-[#1c2d31]/60">المسار: {trackLabel(resource.track)}</p>
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
