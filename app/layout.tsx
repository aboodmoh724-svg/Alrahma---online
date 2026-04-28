import type { Metadata, Viewport } from "next";
import { getAppBaseUrl } from "@/lib/app-url";
import "./globals.css";

const appBaseUrl = getAppBaseUrl();
const metadataBase = new URL(appBaseUrl);
const shareImage = `${appBaseUrl}/logo.png`;

export const metadata: Metadata = {
  title: "منصة الرحمة",
  description: "منصة إدارة تقارير تحفيظ القرآن الكريم",
  metadataBase,
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    type: "website",
    url: appBaseUrl,
    title: "منصة الرحمة",
    description: "منصة إدارة تقارير تحفيظ القرآن الكريم",
    siteName: "منصة الرحمة",
    locale: "ar_AR",
    images: [
      {
        url: shareImage,
        width: 512,
        height: 512,
        alt: "شعار منصة الرحمة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة الرحمة",
    description: "منصة إدارة تقارير تحفيظ القرآن الكريم",
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f0e6",
  colorScheme: "light",
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
