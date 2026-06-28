"use client";

export default function PrintCardButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-[#bd8f2d] px-6 py-2.5 text-sm font-black text-white transition hover:bg-[#a67c25] shadow-sm cursor-pointer"
    >
      🖨️ طباعة التقرير / حفظ كـ PDF بجودة عالية
    </button>
  );
}
