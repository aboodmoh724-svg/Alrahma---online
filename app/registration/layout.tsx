import type { Metadata } from "next";
import { appUrl } from "@/lib/app-url";

const registrationUrl = appUrl("/registration");
const shareImage = appUrl("/images/brand-preview-logo.jpeg");

export const metadata: Metadata = {
  title: "تسجيل الطلاب | منصة الرحمة",
  description:
    "رابط تسجيل الطلاب في منصة الرحمة لتعليم وتحفيظ القرآن الكريم، مع رفع البيانات المطلوبة ومراجعة التعليمات قبل إرسال الطلب.",
  alternates: {
    canonical: registrationUrl,
  },
  openGraph: {
    type: "website",
    url: registrationUrl,
    title: "منصة الرحمة - تسجيل الطلاب",
    description:
      "رابط مخصص لأولياء الأمور لتقديم طلب تسجيل طالب جديد في حلقات منصة الرحمة.",
    siteName: "منصة الرحمة",
    locale: "ar_AR",
    images: [
      {
        url: shareImage,
        width: 512,
        height: 512,
        alt: "تسجيل الطلاب في منصة الرحمة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة الرحمة - تسجيل الطلاب",
    description:
      "رابط مخصص لأولياء الأمور لتقديم طلب تسجيل طالب جديد في حلقات منصة الرحمة.",
    images: [shareImage],
  },
};

export default function RegistrationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
