import Link from "next/link";
import { cookies } from "next/headers";
import BroadcastsPageClient from "@/components/admin/BroadcastsPageClient";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

export default async function OnsiteAdminBroadcastsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولًا.</p>
          <Link
            href="/onsite/admin/login"
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
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });

  if (!admin) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">لا تملك صلاحية الدخول إلى الرسائل الجماعية للحضوري.</p>
          <Link
            href="/onsite/admin/login"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الدخول بحساب الإدارة
          </Link>
        </div>
      </main>
    );
  }

  const [students, teachers] = await Promise.all([
    prisma.student.findMany({
      where: {
        studyMode: "ONSITE",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
      },
      orderBy: {
        fullName: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: "TEACHER",
        studyMode: "ONSITE",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        whatsapp: true,
      },
      orderBy: {
        fullName: "asc",
      },
    }),
  ]);

  const parentOptions = students
    .map((student) => {
      const phone = normalizeWhatsAppNumber(student.parentWhatsapp || "");
      return phone
        ? {
            id: student.id,
            name: student.fullName,
            phone,
          }
        : null;
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  const teacherOptions = teachers
    .map((teacher) => {
      const phone = normalizeWhatsAppNumber(teacher.whatsapp || "");
      return phone
        ? {
            id: teacher.id,
            name: teacher.fullName,
            phone,
          }
        : null;
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  return (
    <BroadcastsPageClient
      scope="ONSITE"
      sectionTitle="الحضوري"
      dashboardHref="/onsite/admin/dashboard"
      parentOptions={parentOptions}
      teacherOptions={teacherOptions}
    />
  );
}
