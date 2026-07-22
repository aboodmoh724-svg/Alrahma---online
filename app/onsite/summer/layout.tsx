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
    <div className="min-h-screen bg-[#f3f6f9] text-[#1b2e3c] font-sans antialiased">
      {/* Import Google Fonts with Ornate Arabic & Calligraphy Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;600;700;800;900&family=El+Messiri:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Reem+Kufi:wght@500;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        body, input, button, select, textarea {
          font-family: 'Cairo', 'IBM Plex Sans Arabic', system-ui, sans-serif;
        }
        h1, h2, h3, .font-serif, .header-title {
          font-family: 'El Messiri', 'Amiri', serif !important;
        }
        .quran-font, .quran-title {
          font-family: 'Amiri', serif !important;
        }
        .kufi-font {
          font-family: 'Reem Kufi', sans-serif !important;
        }
        .ruqaa-font {
          font-family: 'Aref Ruqaa', serif !important;
        }
      `}</style>

      {children}
    </div>
  );
}
