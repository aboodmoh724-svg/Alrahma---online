"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TrackResource = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  fileUrl: string;
  fileName: string;
};

const tracks = [
  { value: "", label: "عام" },
  { value: "HIJAA", label: "مسار الهجاء" },
  { value: "RUBAI", label: "المسار الرباعي" },
  { value: "FARDI", label: "المسار الفردي" },
  { value: "TILAWA", label: "مسار التلاوة" },
];

function trackLabel(track: string | null) {
  return tracks.find((item) => item.value === (track || ""))?.label || "عام";
}

export default function RemoteAdminResourcesPage() {
  const [resources, setResources] = useState<TrackResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/track-resources", { cache: "no-store" });
      const data = await response.json();
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (error) {
      console.error("FETCH TRACK RESOURCES ERROR =>", error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      setFile(null);
      await fetchResources();
    } catch (error) {
      console.error("UPLOAD TRACK RESOURCE ERROR =>", error);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">ملفات المسارات</h1>
          </div>
          <Link href="/remote/admin/dashboard" className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]">
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="mb-4 text-xl font-black text-[#1c2d31]">رفع ملف جديد</h2>
            <div className="space-y-4">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الملف" className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" required />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر" rows={3} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-right" />
              <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full rounded-2xl border border-[#d9c8ad] px-4 py-3">
                {tracks.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <div>
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-2xl border border-dashed border-[#d9c8ad] bg-[#fffaf2] px-4 py-5 text-sm" />
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
              <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">لا توجد ملفات بعد.</p>
            ) : (
              <div className="grid gap-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-[#d9c8ad]/70 bg-[#fffaf2] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-[#1c2d31]">{resource.title}</p>
                        <p className="mt-1 text-sm text-[#1c2d31]/60">{trackLabel(resource.track)}</p>
                        {resource.description ? (
                          <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">{resource.description}</p>
                        ) : null}
                      </div>
                      <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#173d42] px-4 py-3 text-center text-sm font-black text-white">
                        فتح الملف
                      </a>
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
