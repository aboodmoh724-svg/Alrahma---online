import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

function memorizedLabel(value: boolean | null) {
  if (value === true) return "حافظ";
  if (value === false) return "غير حافظ";
  return "غير مسجل";
}

export default async function StudentHistoryPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const { studentId } = await params;

  if (!teacherId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولًا.</p>
          <Link
            href="/remote/teacher/login"
            className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!teacher) {
    notFound();
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      teacherId,
      studyMode: "REMOTE",
      isActive: true,
    },
    include: {
      reports: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              سجل الطالب: {student.fullName}
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              يعرض مسار الطالب داخل الأونلاين فقط، مع بيان الحفظ والواجب والمراجعة بشكل سهل للمعلم الأساسي أو البديل.
            </p>
          </div>

          <Link
            href="/remote/teacher/dashboard"
            className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
          >
            الرجوع للوحة المعلم
          </Link>
        </div>

        {student.reports.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/55">
            لا توجد تقارير سابقة لهذا الطالب في قسم الأونلاين حتى الآن.
          </div>
        ) : (
          <div className="space-y-3">
            {student.reports.map((report, index) => (
              <div
                key={report.id}
                className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
              >
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-[#1c2d31]">
                      {index === 0 ? "آخر تقرير" : `تقرير سابق #${index + 1}`}
                    </p>
                    <p className="mt-1 font-black text-[#1c2d31]">
                      {new Date(report.createdAt).toLocaleDateString("ar-EG")} - {report.lessonName}
                    </p>
                    <p className="mt-1 text-sm text-[#1c2d31]/60">
                      {report.status === "PRESENT" ? "سمع / حاضر" : "لم يسمع / غائب"}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-black text-[#9b7039] ring-1 ring-[#d9c8ad]">
                    {report.sentToParent ? "أرسل لولي الأمر" : "لم يرسل لولي الأمر"}
                  </span>
                </div>

                <div className="grid gap-3 text-sm text-[#1c2d31]/75 md:grid-cols-2 xl:grid-cols-3">
                  <p>
                    <span className="font-black text-[#1c2d31]">حفظ الدرس: </span>
                    {memorizedLabel(report.lessonMemorized)}
                  </p>

                  <p>
                    <span className="font-black text-[#1c2d31]">آخر خمس صفحات: </span>
                    {memorizedLabel(report.lastFiveMemorized)}
                  </p>

                  <p>
                    <span className="font-black text-[#1c2d31]">حفظ المراجعة: </span>
                    {memorizedLabel(report.reviewMemorized)}
                  </p>

                  <p>
                    <span className="font-black text-[#1c2d31]">الصفحات: </span>
                    {report.pageFrom && report.pageTo
                      ? `من ${report.pageFrom} إلى ${report.pageTo}`
                      : "غير محددة"}
                    {report.pagesCount ? ` - ${report.pagesCount} صفحات` : ""}
                  </p>

                  <p>
                    <span className="font-black text-[#1c2d31]">المراجعة: </span>
                    {report.review || "-"}
                  </p>

                  <p>
                    <span className="font-black text-[#1c2d31]">واجب اليوم: </span>
                    {report.homework}
                  </p>

                  <p className="xl:col-span-2">
                    <span className="font-black text-[#1c2d31]">واجب اليوم التالي: </span>
                    {report.nextHomework || "-"}
                  </p>

                  {report.note ? (
                    <p className="md:col-span-2 xl:col-span-3">
                      <span className="font-black text-[#1c2d31]">ملاحظة: </span>
                      {report.note}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
