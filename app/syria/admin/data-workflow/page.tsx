import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[#eadcc4]">
      <div
        className="h-full rounded-full bg-[#0f5a35]"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

async function requireSyriaAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE_SYRIA",
      isActive: true,
    },
    select: { id: true },
  });
}

export default async function SyriaDataWorkflowPage() {
  const admin = await requireSyriaAdmin();
  if (!admin) redirect("/syria/admin/login");

  const [
    temporaryTotal,
    temporaryWithPhone,
    temporaryMissingPhone,
    activeStudentsWithPhone,
    registrationRequestsWithPhone,
    registrationRequestsLinked,
    pendingRegistrationRequests,
    missingTemporaryStudents,
  ] = await Promise.all([
    prisma.student.count({
      where: { studyMode: "ONSITE_SYRIA", isActive: true, isTemporary: true },
    }),
    prisma.student.count({
      where: {
        studyMode: "ONSITE_SYRIA",
        isActive: true,
        isTemporary: true,
        parentWhatsapp: { not: null },
      },
    }),
    prisma.student.count({
      where: {
        studyMode: "ONSITE_SYRIA",
        isActive: true,
        isTemporary: true,
        parentWhatsapp: null,
      },
    }),
    prisma.student.count({
      where: {
        studyMode: "ONSITE_SYRIA",
        isActive: true,
        parentWhatsapp: { not: null },
      },
    }),
    prisma.registrationRequest.count({
      where: {
        studyMode: "ONSITE_SYRIA",
        parentWhatsapp: { not: "" },
      },
    }),
    prisma.registrationRequest.count({
      where: {
        studyMode: "ONSITE_SYRIA",
        createdStudentId: { not: null },
      },
    }),
    prisma.registrationRequest.count({
      where: {
        studyMode: "ONSITE_SYRIA",
        createdStudentId: null,
      },
    }),
    prisma.student.findMany({
      where: {
        studyMode: "ONSITE_SYRIA",
        isActive: true,
        isTemporary: true,
        parentWhatsapp: null,
      },
      select: {
        id: true,
        fullName: true,
        teacher: { select: { fullName: true } },
        circle: { select: { name: true } },
      },
      orderBy: [{ teacher: { fullName: "asc" } }, { fullName: "asc" }],
    }),
  ]);

  const phoneCollectionProgress = percent(temporaryWithPhone, temporaryTotal);
  const workflowSteps = [
    {
      title: "1. جمع أرقام الطلاب المؤقتين",
      status: temporaryMissingPhone === 0 ? "مكتملة" : "قيد العمل",
      body: "نحصر الطلاب الذين أضيفوا مؤقتا، ونعرف من حصلنا له على رقم ولي الأمر ومن بقي بلا رقم.",
    },
    {
      title: "2. إرسال استمارة تحديث البيانات",
      status: "قادمة",
      body: "بعد اكتمال الأرقام، نرسل لكل ولي أمر رابط استمارة خاصة لتحديث البيانات الدقيقة.",
    },
    {
      title: "3. قراءة رسائل التأكيد",
      status: "قادمة",
      body: "نقرأ رد ولي الأمر في واتساب بعد تعبئة الاستمارة، ونربط الرسالة بحالة الطالب.",
    },
    {
      title: "4. اعتماد البيانات وإرسال التأكيد",
      status: "قادمة",
      body: "بعد مراجعة البيانات، نرسل رسالة تفيد بأن البيانات وصلت وتم اعتمادها.",
    },
    {
      title: "5. بناء قاعدة بيانات دقيقة",
      status: "قادمة",
      body: "نثبت البيانات النظيفة في سجل الطالب: الاسم، العمر، الصف، المدرسة، ولي الأمر، الحلقة، والمعلم.",
    },
  ];

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-[#0a3f2a] p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-[#f2d18a]">إدارة سوريا</p>
              <h1 className="mt-2 text-4xl font-black">سير عمل ضبط بيانات الطلاب</h1>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-white/75">
                هذه الصفحة مرجعنا حتى لا تضيع الخطوات: نبدأ بجمع الأرقام، ثم ننتقل لإرسال
                استمارة تحديث البيانات، ثم مراجعة التأكيدات واعتماد السجل النهائي.
              </p>
            </div>
            <Link
              href="/syria/admin/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#0a3f2a]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["الطلاب المؤقتون", temporaryTotal],
            ["تم إدخال رقم ولي الأمر", temporaryWithPhone],
            ["باقون بلا رقم", temporaryMissingPhone],
            ["طلبات التسجيل برقم واتساب", registrationRequestsWithPhone],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <p className="text-sm font-black text-[#8a661f]">{label}</p>
              <p className="mt-3 text-4xl font-black text-[#1c2d31]">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">المرحلة الأولى: جمع الأرقام</h2>
              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                اكتمل {phoneCollectionProgress}% من جمع أرقام الطلاب المؤقتين.
              </p>
            </div>
            <div className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-black text-[#1c2d31]">
              {temporaryWithPhone} من {temporaryTotal}
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={phoneCollectionProgress} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <h2 className="text-2xl font-black text-[#1c2d31]">المراحل أمامنا</h2>
            <div className="mt-4 space-y-3">
              {workflowSteps.map((step) => (
                <div key={step.title} className="rounded-2xl bg-[#fffaf4] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-[#1c2d31]">{step.title}</h3>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#0f5a35] ring-1 ring-[#d8bf83]">
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]/65">{step.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1c2d31]">طلاب مؤقتون بلا رقم</h2>
                <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                  هؤلاء يحتاج المعلم أو الإدارة إدخال رقم ولي الأمر لهم قبل الانتقال للمرحلة الثانية.
                </p>
              </div>
              <Link
                href="/syria/admin/students"
                className="rounded-2xl bg-[#0f5a35] px-4 py-2 text-center text-sm font-black text-white"
              >
                فتح الطلاب
              </Link>
            </div>

            <div className="mt-5 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
              {missingTemporaryStudents.map((student) => (
                <div key={student.id} className="rounded-2xl bg-[#fffaf4] p-4">
                  <p className="font-black text-[#1c2d31]">{student.fullName}</p>
                  <p className="mt-1 text-sm text-[#1c2d31]/60">
                    المعلم: {student.teacher.fullName} - الحلقة: {student.circle?.name || "بلا حلقة"}
                  </p>
                </div>
              ))}
              {missingTemporaryStudents.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 p-5 text-center font-black text-emerald-800">
                  ممتاز، لا يوجد طالب مؤقت بلا رقم ولي أمر.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-[#fffaf4] p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-black text-[#8a661f]">طلاب لديهم رقم الآن</p>
            <p className="mt-3 text-3xl font-black text-[#1c2d31]">{activeStudentsWithPhone}</p>
          </div>
          <div className="rounded-[2rem] bg-[#fffaf4] p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-black text-[#8a661f]">طلبات تحولت لطالب</p>
            <p className="mt-3 text-3xl font-black text-[#1c2d31]">{registrationRequestsLinked}</p>
          </div>
          <div className="rounded-[2rem] bg-[#fffaf4] p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-black text-[#8a661f]">طلبات لم تتحول بعد</p>
            <p className="mt-3 text-3xl font-black text-[#1c2d31]">{pendingRegistrationRequests}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
