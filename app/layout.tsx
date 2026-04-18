import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة الرحمة",
  description: "منصة إدارة تقارير تحفيظ القرآن الكريم",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
