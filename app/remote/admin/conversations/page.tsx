import Link from "next/link";
import { cookies } from "next/headers";
import EducationChatClient from "@/components/education-chat/EducationChatClient";
import { prisma } from "@/lib/prisma";

export default async function RemoteAdminConversationsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولا.</p>
          <Link
            href="/remote/admin/login"
            className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: { id: true },
  });

  if (!admin) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">لا تملك صلاحية الدخول إلى مراقبة المحادثات.</p>
          <Link
            href="/remote/admin/login"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الدخول بحساب الإدارة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <EducationChatClient
      mode="ADMIN"
      title="مراقبة مراسلات التعليم"
      subtitle="متابعة المحادثات التعليمية بين أولياء الأمور والمعلمين والإشراف."
      backHref="/remote/admin/dashboard"
    />
  );
}
