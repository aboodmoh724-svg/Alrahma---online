import type { Metadata } from "next";
import EducationChatClient from "@/components/education-chat/EducationChatClient";
import { getAppBaseUrl } from "@/lib/app-url";

const appBaseUrl = getAppBaseUrl();
const pageUrl = `${appBaseUrl}/parent/daily-messages`;
const previewImage = `${appBaseUrl}/parent-daily-messages-preview.png`;

export const metadata: Metadata = {
  title: "المراسلات اليومية مع المعلم | منصة الرحمة",
  description: "رابط خاص للتواصل اليومي بين ولي الأمر والمعلم بخصوص متابعة الطالب التعليمية.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    title: "المراسلات اليومية مع المعلم",
    description: "رابط خاص لمحادثات ولي الأمر مع المعلم والإشراف داخل منصة الرحمة.",
    siteName: "منصة الرحمة",
    locale: "ar_AR",
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: "المراسلات اليومية مع المعلم - منصة الرحمة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "المراسلات اليومية مع المعلم",
    description: "رابط خاص لمحادثات ولي الأمر مع المعلم والإشراف داخل منصة الرحمة.",
    images: [previewImage],
  },
};

export default function ParentDailyMessagesPage() {
  return (
    <EducationChatClient
      mode="PARENT"
      title="مراسلات التعليم"
      subtitle="تواصل محدود ومتابع مع المعلم أو الإشراف بخصوص العملية التعليمية."
    />
  );
}
