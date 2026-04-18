import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentHistoryPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const { studentId } = await params;

  if (!teacherId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          الرجاء تسجيل الدخول أولًا.
        </div>
      </div>
    );
  }

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      teacherId,
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              سجل الطالب: {student.fullName}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              ملخص مختصر لآخر التقارير والواجبات السابقة
            </p>
          </div>

          <Link
            href="/remote/teacher/dashboard"
            className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-white"
          >
            الرجوع للوحة المعلم
          </Link>
        </div>

        {student.reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            لا توجد تقارير سابقة لهذا الطالب حتى الآن
          </div>
        ) : (
          <div className="space-y-3">
            {student.reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
              >
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(report.createdAt).toLocaleDateString("ar-EG")} -{" "}
                      {report.lessonName}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {report.status === "PRESENT" ? "سمع / حاضر" : "لم يسمع / غائب"}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {report.sentToParent ? "أرسل لولي الأمر" : "لم يرسل لولي الأمر"}
                  </span>
                </div>

                <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                  <p>
                    <span className="font-medium text-gray-900">الصفحات: </span>
                    {report.pageFrom && report.pageTo
                      ? `من ${report.pageFrom} إلى ${report.pageTo}`
                      : "غير محددة"}
                    {report.pagesCount ? ` - ${report.pagesCount} صفحات` : ""}
                  </p>

                  <p>
                    <span className="font-medium text-gray-900">المراجعة: </span>
                    {report.review || "-"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-900">واجب اليوم: </span>
                    {report.homework}
                  </p>

                  <p>
                    <span className="font-medium text-gray-900">واجب الغد: </span>
                    {report.nextHomework || "-"}
                  </p>

                  {report.note ? (
                    <p className="md:col-span-2">
                      <span className="font-medium text-gray-900">ملاحظة: </span>
                      {report.note}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
