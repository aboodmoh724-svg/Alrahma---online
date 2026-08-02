import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الدورة الصيفية - منصة تحفيظ الرحمة",
  description: "لوحات التحكم وإدارة الدورة الصيفية لتحفيظ القرآن الكريم ونور البيان",
};

export default function SummerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1F2937] antialiased relative" dir="rtl">
      {/* Google Fonts: Tajawal (body) + El Messiri (headings) */}
      <link
        href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@500;600;700&family=Tajawal:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body, input, button, select, textarea {
          font-family: 'Tajawal', system-ui, sans-serif;
        }
        h1, h2, h3, .font-heading {
          font-family: 'El Messiri', 'Tajawal', sans-serif;
        }
      `}</style>

      {/* Subtle Islamic geometric background pattern at 3% opacity */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L35 15L45 15L37 22L40 32L30 26L20 32L23 22L15 15L25 15Z' fill='none' stroke='%230C5C5E' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
