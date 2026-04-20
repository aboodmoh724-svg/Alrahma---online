"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminStudentSearchBoxProps = {
  targetPath: string;
};

export function AdminStudentSearchBox({ targetPath }: AdminStudentSearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      router.push(targetPath);
      return;
    }

    router.push(`${targetPath}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={submitSearch}
      className="relative mt-6 rounded-[2rem] bg-white/95 p-3 shadow-lg ring-1 ring-white/30 md:max-w-2xl"
    >
      <label className="sr-only" htmlFor="admin-student-search">
        بحث باسم الطالب
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="admin-student-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث باسم الطالب من هنا..."
          className="min-h-12 flex-1 rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 text-sm font-bold text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:bg-white"
        />
        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-[#c39a62] px-5 text-sm font-black text-white transition hover:bg-[#b0844f]"
        >
          بحث وتعديل البيانات
        </button>
      </div>
      <p className="mt-2 px-2 text-xs font-bold text-[#1c2d31]/60">
        سيأخذك البحث إلى صفحة الطلاب مع ظهور نتائج الطالب مباشرة.
      </p>
    </form>
  );
}
