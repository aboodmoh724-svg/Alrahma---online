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
      className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4 relative overflow-hidden dir-rtl select-none"
      dir="rtl"
    >
      {/* Background Subtle Decorative Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#d4a853_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="w-full max-w-md rounded-2xl border border-[#d4a853]/30 bg-white p-6 sm:p-8 shadow-xl relative z-10">
        
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="inline-block rounded-2xl bg-white p-2 shadow-sm border border-[#d4a853]/20 mb-3">
            <Image
              src="/images/summer_quran_logo_v2.jpg"
              alt="شعار الدورة الصيفية"
              width={80}
              height={80}
              className="h-20 w-20 rounded-xl object-contain"
              priority
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0c5c5e] font-ruqaa leading-tight mt-1">
            دخول معلم الدورة الصيفية
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[#d4a853] font-serif mt-1">
            تحفيظ الرحمة للقرآن الكريم ونور البيان
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-3.5 text-xs sm:text-sm font-bold text-red-700 border border-red-200 text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-[#1a2e23] font-serif">
              البريد الإلكتروني / اسم المستخدم
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. osama@test.com"
              className="w-full rounded-xl border border-[#d4a853]/30 bg-[#faf8f4] px-4 py-3.5 text-sm font-bold text-[#1a2e23] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0c5c5e] transition"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-[#1a2e23] font-serif">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#d4a853]/30 bg-[#faf8f4] px-4 py-3.5 text-sm font-bold text-[#1a2e23] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0c5c5e] transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-[#0c5c5e] hover:bg-[#0a4d4f] py-4 text-base sm:text-lg font-bold text-white shadow-md transition disabled:opacity-50 font-serif"
          >
            {loading ? "⏳ جاري تسجيل الدخول..." : "🔑 دخول إلى لوحة المعلم"}
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-[#6b7280] font-serif border-t border-[#d4a853]/20 pt-4">
          إدارة منصة تحفيظ الرحمة لتعليم القرآن الكريم
        </div>
      </div>
    </main>
  );
}
