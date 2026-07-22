"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OnsiteSummerTeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, expectedMode: "ONSITE_SUMMER" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطأ في بيانات الدخول");
      }

      router.push("/onsite/summer/teacher");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#f6eee7] flex items-center justify-center p-4"
      dir="rtl"
      style={{
        background:
          "radial-gradient(circle at 12% 12%, rgba(189,143,45,0.14), transparent 26%), linear-gradient(135deg, #fbf6ef 0%, #f6eee7 48%, #eef6ef 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#d8bf83]/60 bg-[#fffaf4] p-8 shadow-xl">
        <div className="text-center mb-6">
          <Image
            src="/images/summer_quran_logo_v2.jpg"
            alt="شعار الدورة الصيفية"
            width={90}
            height={90}
            className="mx-auto h-24 w-24 rounded-2xl object-contain shadow-sm border border-[#d8bf83]"
          />
          <h1 className="mt-3 text-2xl font-black text-[#0f5a35]">
            دخول معلم الدورة الصيفية
          </h1>
          <p className="mt-1 text-sm font-bold text-[#bd8f2d]">
            تحفيظ الرحمة للقرآن الكريم ونور البيان
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-3.5 text-sm font-bold text-red-700 border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-[#18322a]">
              البريد الإلكتروني / اسم المستخدم
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@alrahma.com"
              className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-[#18322a]">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#0f5a35] py-4 text-base font-black text-white shadow-md transition hover:bg-[#0a3f2a] disabled:opacity-50"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول إلى لوحة المعلم"}
          </button>
        </form>
      </div>
    </main>
  );
}
