import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الدورة الصيفية - منصة وتطبيق تحفيظ الرحمة",
  description: "لوحات التحكم وإدارة الدورة الصيفية لتحفيظ القرآن الكريم ونور البيان",
};

export default function SummerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6eee7] text-[#18322a] font-sans antialiased">
      {/* Import Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body, input, button, select, textarea {
          font-family: 'Cairo', 'IBM Plex Sans Arabic', system-ui, sans-serif;
        }
        .quran-font {
          font-family: 'Amiri', serif;
        }
      `}</style>

      {children}
    </div>
  );
}
