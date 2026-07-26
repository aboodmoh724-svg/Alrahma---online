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
      className="min-h-screen bg-[#062c21] flex items-center justify-center p-4 relative overflow-hidden dir-rtl select-none"
      dir="rtl"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, rgba(189,143,45,0.22), transparent 45%), linear-gradient(180deg, #07382a 0%, #041f17 100%)",
      }}
    >
      {/* Background Geometric Islamic Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#bd8f2d_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

      <div className="w-full max-w-md rounded-3xl border-2 border-[#bd8f2d]/50 bg-[#094233]/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative z-10 text-white">
        
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="inline-block rounded-2xl bg-white p-2 shadow-lg ring-4 ring-[#bd8f2d]/50 mb-3">
            <Image
              src="/images/summer_quran_logo_v2.jpg"
              alt="شعار الدورة الصيفية"
              width={80}
              height={80}
              className="h-20 w-20 rounded-xl object-contain"
              priority
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fbf6ef] font-ruqaa leading-tight mt-1">
            دخول معلم الدورة الصيفية
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[#e2c17c] font-serif mt-1">
            تحفيظ الرحمة للقرآن الكريم ونور البيان
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-900/80 p-3.5 text-xs sm:text-sm font-bold text-red-100 border border-red-500/50 text-center shadow-inner">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-emerald-100 font-serif">
              البريد الإلكتروني / اسم المستخدم
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. osama@test.com"
              className="w-full rounded-2xl border border-[#bd8f2d]/50 bg-[#0d5945] px-4 py-3.5 text-sm font-bold text-white placeholder-emerald-200/50 outline-none focus:ring-2 focus:ring-[#bd8f2d] transition shadow-inner"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-bold text-emerald-100 font-serif">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#bd8f2d]/50 bg-[#0d5945] px-4 py-3.5 text-sm font-bold text-white placeholder-emerald-200/50 outline-none focus:ring-2 focus:ring-[#bd8f2d] transition shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-2xl bg-gradient-to-r from-[#bd8f2d] via-[#d8a838] to-[#bd8f2d] py-4 text-base sm:text-lg font-bold text-[#062c21] shadow-xl hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 font-serif"
          >
            {loading ? "⏳ جاري تسجيل الدخول..." : "🔑 دخول إلى لوحة المعلم"}
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-emerald-200/60 font-serif border-t border-[#bd8f2d]/20 pt-4">
          إدارة منصة تحفيظ الرحمة لتعليم القرآن الكريم
        </div>
      </div>
    </main>
  );
}
