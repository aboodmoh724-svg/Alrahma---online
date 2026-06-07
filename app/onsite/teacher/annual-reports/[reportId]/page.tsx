import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { publicStorageUrl } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

export default async function OnsiteTeacherAnnualReportPage({
  params,
}: PageProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const { reportId } = await params;

  if (!teacherId) {
    redirect("/onsite/teacher/login");
  }

  const report = await prisma.annualReport.findFirst({
    where: {
      id: reportId,
      teacherId,
      academicYear: "2025-2026",
    },
    include: {
      student: {
        select: {
          fullName: true,
        },
      },
      circle: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!report) {
    return (
      <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">لا يمكن عرض هذا التقرير لهذا الحساب.</p>
          <Link
            href="/onsite/teacher/dashboard"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            العودة للوحة المعلم
          </Link>
        </div>
      </main>
    );
  }

  const imageUrl = publicStorageUrl(report.reportImagePath);
  const studentName = report.student?.fullName || report.studentName;

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-[#0a3f2a] p-5 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-[#f2d18a]">
                التقرير السنوي
              </p>
              <h1 className="mt-1 text-3xl font-black">{studentName}</h1>
              <p className="mt-2 text-sm font-bold text-white/70">
                {report.circle?.name || "حلقة غير محددة"} -{" "}
                {report.finalRating || "لا يوجد تقدير"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/onsite/teacher/dashboard"
                className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4]"
              >
                العودة للوحة المعلم
              </Link>
              {imageUrl ? (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#f2d18a] px-4 py-3 text-sm font-black text-[#1c2d31] transition hover:bg-[#f7dfa4]"
                >
                  فتح الصورة للتكبير
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/88 p-3 shadow-sm ring-1 ring-[#d8bf83] md:p-5">
          {imageUrl ? (
            <a href={imageUrl} target="_blank" rel="noreferrer">
              <img
                src={imageUrl}
                alt={`التقرير السنوي للطالب ${studentName}`}
                className="mx-auto h-auto max-h-none w-full max-w-[900px] rounded-[1.25rem] object-contain"
              />
            </a>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] bg-[#fffaf4] p-8 text-center text-sm font-black text-[#1c2d31]/45">
              صورة التقرير قيد التجهيز.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
