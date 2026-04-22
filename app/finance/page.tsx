import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";

const defaultCurrency = "USD";
const financeTabs = [
  { key: "summary", label: "الملخص المالي" },
  { key: "students", label: "مدفوعات الطلاب" },
  { key: "teachers", label: "مكافآت المعلمين" },
  { key: "expenses", label: "مصروفات المنصة" },
  { key: "reports", label: "التقارير المالية" },
] as const;

type FinanceTab = (typeof financeTabs)[number]["key"];

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function parseAmount(value: FormDataEntryValue | null) {
  const amount = Number(String(value || "").replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return new Date();

  const date = new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeMonthKey(value: unknown) {
  const monthKey = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : getCurrentMonthKey();
}

function normalizeFinanceTab(value: unknown): FinanceTab {
  const tab = String(value || "").trim();
  return financeTabs.some((item) => item.key === tab) ? (tab as FinanceTab) : "summary";
}

function getMonthRange(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return getMonthRange(getCurrentMonthKey());
  }

  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
  };
}

function getMonthDateKeys(monthKey: string) {
  const { start, end } = getMonthRange(monthKey);
  const todayKey = new Date().toISOString().slice(0, 10);
  const dateKeys: string[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    if (dateKey > todayKey) break;
    dateKeys.push(dateKey);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dateKeys;
}

function formatMoney(amount: number, currency = defaultCurrency) {
  return `${amount.toFixed(2)} ${currency}`;
}

function getTeacherAttendanceLabel(status: string | null, hasReport: boolean) {
  if (status === "PRESENT") return "حاضر مؤكد";
  if (status === "ABSENT") return "غائب";
  if (status === "EXCUSED") return "عذر";
  if (hasReport) return "مقترح حاضر";
  return "لم يثبت";
}

function getTeacherAttendanceClass(status: string | null, hasReport: boolean) {
  if (status === "PRESENT") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "ABSENT") return "bg-red-50 text-red-800 ring-red-200";
  if (status === "EXCUSED") return "bg-sky-50 text-sky-800 ring-sky-200";
  if (hasReport) return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-stone-50 text-stone-600 ring-stone-200";
}

function getPaymentStatus(required: number, paid: number) {
  if (required <= 0 && paid <= 0) return "لم تحدد الرسوم";
  if (paid <= 0) return "لم يدفع";
  if (paid + 0.001 >= required) return "مدفوع بالكامل";
  return "دفع جزئي";
}

async function requireFinanceAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      canAccessFinance: true,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      studyMode: true,
      canAccessFinance: true,
    },
  });
}

async function logFinanceAction(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.financeAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId || null,
      summary: input.summary,
      details: input.details || undefined,
    },
  });
}

async function saveStudentFinanceAccount(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const studentId = String(formData.get("studentId") || "");
  const totalAmount = parseAmount(formData.get("totalAmount"));
  const discountAmount = parseAmount(formData.get("discountAmount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!studentId) return;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { fullName: true },
  });

  const account = await prisma.studentFinanceAccount.upsert({
    where: { studentId },
    create: {
      studentId,
      totalAmount,
      discountAmount,
      currency,
      notes,
    },
    update: {
      totalAmount,
      discountAmount,
      currency,
      notes,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "UPSERT_STUDENT_FINANCE_ACCOUNT",
    entity: "StudentFinanceAccount",
    entityId: account.id,
    summary: `تحديث رسوم الطالب: ${student?.fullName || studentId}`,
    details: { studentId, totalAmount, discountAmount, currency, notes },
  });

  revalidatePath("/finance");
}

async function addStudentPayment(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const studentId = String(formData.get("studentId") || "");
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const method = String(formData.get("method") || "").trim() || null;
  const paidAt = parseDate(formData.get("paidAt"));
  const note = String(formData.get("note") || "").trim() || null;

  if (!studentId || amount <= 0) return;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { fullName: true },
  });

  const payment = await prisma.studentPayment.create({
    data: {
      studentId,
      amount,
      currency,
      method,
      paidAt,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "CREATE_STUDENT_PAYMENT",
    entity: "StudentPayment",
    entityId: payment.id,
    summary: `إضافة دفعة طالب: ${student?.fullName || studentId} - ${amount.toFixed(2)} ${currency}`,
    details: { studentId, amount, currency, method, paidAt: paidAt.toISOString(), note },
  });

  revalidatePath("/finance");
}

async function updateStudentPayment(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const paymentId = String(formData.get("paymentId") || "");
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const method = String(formData.get("method") || "").trim() || null;
  const paidAt = parseDate(formData.get("paidAt"));
  const note = String(formData.get("note") || "").trim() || null;

  if (!paymentId || amount <= 0) return;

  const existing = await prisma.studentPayment.findUnique({
    where: { id: paymentId },
    include: { student: { select: { fullName: true, studyMode: true } } },
  });

  if (!existing || existing.student.studyMode !== "REMOTE") return;

  const payment = await prisma.studentPayment.update({
    where: { id: paymentId },
    data: {
      amount,
      currency,
      method,
      paidAt,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "UPDATE_STUDENT_PAYMENT",
    entity: "StudentPayment",
    entityId: payment.id,
    summary: `تعديل دفعة طالب: ${existing.student.fullName} - ${amount.toFixed(2)} ${currency}`,
    details: {
      before: {
        amount: toNumber(existing.amount),
        currency: existing.currency,
        method: existing.method,
        paidAt: existing.paidAt.toISOString(),
        note: existing.note,
      },
      after: { amount, currency, method, paidAt: paidAt.toISOString(), note },
    },
  });

  revalidatePath("/finance");
}

async function deleteStudentPayment(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const paymentId = String(formData.get("paymentId") || "");
  if (!paymentId) return;

  const existing = await prisma.studentPayment.findUnique({
    where: { id: paymentId },
    include: { student: { select: { fullName: true, studyMode: true } } },
  });

  if (!existing || existing.student.studyMode !== "REMOTE") return;

  await prisma.studentPayment.delete({
    where: { id: paymentId },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "DELETE_STUDENT_PAYMENT",
    entity: "StudentPayment",
    entityId: paymentId,
    summary: `حذف دفعة طالب: ${existing.student.fullName} - ${toNumber(existing.amount).toFixed(2)} ${existing.currency}`,
    details: {
      studentId: existing.studentId,
      amount: toNumber(existing.amount),
      currency: existing.currency,
      method: existing.method,
      paidAt: existing.paidAt.toISOString(),
      note: existing.note,
    },
  });

  revalidatePath("/finance");
}

async function addPlatformExpense(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim() || "عام";
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const expenseDate = parseDate(formData.get("expenseDate"));
  const paymentMethod = String(formData.get("paymentMethod") || "").trim() || null;
  const receiptUrl = String(formData.get("receiptUrl") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!title || amount <= 0) return;

  const expense = await prisma.platformExpense.create({
    data: {
      title,
      category,
      amount,
      currency,
      expenseDate,
      paymentMethod,
      receiptUrl,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "CREATE_PLATFORM_EXPENSE",
    entity: "PlatformExpense",
    entityId: expense.id,
    summary: `إضافة مصروف: ${title} - ${amount.toFixed(2)} ${currency}`,
    details: {
      title,
      category,
      amount,
      currency,
      expenseDate: expenseDate.toISOString(),
      paymentMethod,
      receiptUrl,
      note,
    },
  });

  revalidatePath("/finance");
}

async function updatePlatformExpense(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const expenseId = String(formData.get("expenseId") || "");
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim() || "عام";
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const expenseDate = parseDate(formData.get("expenseDate"));
  const paymentMethod = String(formData.get("paymentMethod") || "").trim() || null;
  const receiptUrl = String(formData.get("receiptUrl") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!expenseId || !title || amount <= 0) return;

  const existing = await prisma.platformExpense.findUnique({
    where: { id: expenseId },
  });

  if (!existing) return;

  const expense = await prisma.platformExpense.update({
    where: { id: expenseId },
    data: {
      title,
      category,
      amount,
      currency,
      expenseDate,
      paymentMethod,
      receiptUrl,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "UPDATE_PLATFORM_EXPENSE",
    entity: "PlatformExpense",
    entityId: expense.id,
    summary: `تعديل مصروف: ${title} - ${amount.toFixed(2)} ${currency}`,
    details: {
      before: {
        title: existing.title,
        category: existing.category,
        amount: toNumber(existing.amount),
        currency: existing.currency,
        expenseDate: existing.expenseDate.toISOString(),
        paymentMethod: existing.paymentMethod,
        receiptUrl: existing.receiptUrl,
        note: existing.note,
      },
      after: {
        title,
        category,
        amount,
        currency,
        expenseDate: expenseDate.toISOString(),
        paymentMethod,
        receiptUrl,
        note,
      },
    },
  });

  revalidatePath("/finance");
}

async function deletePlatformExpense(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const expenseId = String(formData.get("expenseId") || "");
  if (!expenseId) return;

  const existing = await prisma.platformExpense.findUnique({
    where: { id: expenseId },
  });

  if (!existing) return;

  await prisma.platformExpense.delete({
    where: { id: expenseId },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "DELETE_PLATFORM_EXPENSE",
    entity: "PlatformExpense",
    entityId: expenseId,
    summary: `حذف مصروف: ${existing.title} - ${toNumber(existing.amount).toFixed(2)} ${existing.currency}`,
    details: {
      title: existing.title,
      category: existing.category,
      amount: toNumber(existing.amount),
      currency: existing.currency,
      expenseDate: existing.expenseDate.toISOString(),
      paymentMethod: existing.paymentMethod,
      receiptUrl: existing.receiptUrl,
      note: existing.note,
    },
  });

  revalidatePath("/finance");
}

async function saveTeacherCompensationRule(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const teacherId = String(formData.get("teacherId") || "");
  const monthlyAmount = parseAmount(formData.get("monthlyAmount"));
  const expectedMonthlyHours = parseAmount(formData.get("expectedMonthlyHours"));
  const expectedMonthlyWorkDays = parseAmount(formData.get("expectedMonthlyWorkDays")) || 20;
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!teacherId) return;

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { fullName: true },
  });

  const rule = await prisma.teacherCompensationRule.upsert({
    where: { teacherId },
    create: {
      teacherId,
      monthlyAmount,
      expectedMonthlyHours,
      expectedMonthlyWorkDays,
      currency,
      notes,
    },
    update: {
      monthlyAmount,
      expectedMonthlyHours,
      expectedMonthlyWorkDays,
      currency,
      notes,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "UPSERT_TEACHER_COMPENSATION_RULE",
    entity: "TeacherCompensationRule",
    entityId: rule.id,
    summary: `تحديث إعداد مكافأة المعلم: ${teacher?.fullName || teacherId}`,
    details: {
      teacherId,
      monthlyAmount,
      expectedMonthlyHours,
      expectedMonthlyWorkDays,
      currency,
      notes,
    },
  });

  revalidatePath("/finance");
}

async function addTeacherPayout(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const teacherId = String(formData.get("teacherId") || "");
  const periodMonth = String(formData.get("periodMonth") || getCurrentMonthKey()).trim();
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const paidAt = parseDate(formData.get("paidAt"));
  const method = String(formData.get("method") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!teacherId || amount <= 0) return;

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { fullName: true },
  });

  const payout = await prisma.teacherPayout.create({
    data: {
      teacherId,
      periodMonth,
      amount,
      currency,
      paidAt,
      method,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "CREATE_TEACHER_PAYOUT",
    entity: "TeacherPayout",
    entityId: payout.id,
    summary: `دفع مكافأة معلم: ${teacher?.fullName || teacherId} - ${amount.toFixed(2)} ${currency}`,
    details: { teacherId, periodMonth, amount, currency, paidAt: paidAt.toISOString(), method, note },
  });

  revalidatePath("/finance");
}

async function updateTeacherPayout(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const payoutId = String(formData.get("payoutId") || "");
  const periodMonth = normalizeMonthKey(formData.get("periodMonth"));
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const paidAt = parseDate(formData.get("paidAt"));
  const method = String(formData.get("method") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!payoutId || amount <= 0) return;

  const existing = await prisma.teacherPayout.findUnique({
    where: { id: payoutId },
    include: { teacher: { select: { fullName: true, studyMode: true } } },
  });

  if (!existing || existing.teacher.studyMode !== "REMOTE") return;

  const payout = await prisma.teacherPayout.update({
    where: { id: payoutId },
    data: {
      periodMonth,
      amount,
      currency,
      paidAt,
      method,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "UPDATE_TEACHER_PAYOUT",
    entity: "TeacherPayout",
    entityId: payout.id,
    summary: `تعديل دفعة معلم: ${existing.teacher.fullName} - ${amount.toFixed(2)} ${currency}`,
    details: {
      before: {
        periodMonth: existing.periodMonth,
        amount: toNumber(existing.amount),
        currency: existing.currency,
        paidAt: existing.paidAt.toISOString(),
        method: existing.method,
        note: existing.note,
      },
      after: { periodMonth, amount, currency, paidAt: paidAt.toISOString(), method, note },
    },
  });

  revalidatePath("/finance");
}

async function deleteTeacherPayout(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const payoutId = String(formData.get("payoutId") || "");
  if (!payoutId) return;

  const existing = await prisma.teacherPayout.findUnique({
    where: { id: payoutId },
    include: { teacher: { select: { fullName: true, studyMode: true } } },
  });

  if (!existing || existing.teacher.studyMode !== "REMOTE") return;

  await prisma.teacherPayout.delete({
    where: { id: payoutId },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "DELETE_TEACHER_PAYOUT",
    entity: "TeacherPayout",
    entityId: payoutId,
    summary: `حذف دفعة معلم: ${existing.teacher.fullName} - ${toNumber(existing.amount).toFixed(2)} ${existing.currency}`,
    details: {
      teacherId: existing.teacherId,
      periodMonth: existing.periodMonth,
      amount: toNumber(existing.amount),
      currency: existing.currency,
      paidAt: existing.paidAt.toISOString(),
      method: existing.method,
      note: existing.note,
    },
  });

  revalidatePath("/finance");
}

async function updateTeacherAttendance(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const teacherId = String(formData.get("teacherId") || "");
  const dateKey = String(formData.get("dateKey") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim() || null;

  if (!teacherId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;

  const isValidStatus = status === "PRESENT" || status === "ABSENT" || status === "EXCUSED";

  if (!isValidStatus) {
    const deleted = await prisma.teacherAttendance.deleteMany({
      where: { teacherId, dateKey },
    });
    if (deleted.count > 0) {
      await logFinanceAction({
        actorId: admin.id,
        action: "DELETE_TEACHER_ATTENDANCE",
        entity: "TeacherAttendance",
        entityId: `${teacherId}:${dateKey}`,
        summary: `إلغاء اعتماد حضور معلم ليوم ${dateKey}`,
        details: { teacherId, dateKey },
      });
    }
    revalidatePath("/finance");
    return;
  }

  const attendance = await prisma.teacherAttendance.upsert({
    where: {
      teacherId_dateKey: {
        teacherId,
        dateKey,
      },
    },
    create: {
      teacherId,
      dateKey,
      status,
      note,
    },
    update: {
      status,
      note,
    },
  });

  await logFinanceAction({
    actorId: admin.id,
    action: "UPSERT_TEACHER_ATTENDANCE",
    entity: "TeacherAttendance",
    entityId: attendance.id,
    summary: `اعتماد حضور معلم: ${dateKey} - ${status}`,
    details: { teacherId, dateKey, status, note },
  });

  revalidatePath("/finance");
}

async function approveSuggestedTeacherAttendances(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const teacherId = String(formData.get("teacherId") || "");
  const monthKey = normalizeMonthKey(formData.get("month"));
  const monthRange = getMonthRange(monthKey);

  if (!teacherId) return;

  const [reports, existingAttendances] = await Promise.all([
    prisma.report.findMany({
      where: {
        teacherId,
        createdAt: {
          gte: monthRange.start,
          lt: monthRange.end,
        },
        student: {
          studyMode: "REMOTE",
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.teacherAttendance.findMany({
      where: {
        teacherId,
        dateKey: {
          gte: `${monthKey}-01`,
          lte: `${monthKey}-31`,
        },
      },
      select: {
        dateKey: true,
      },
    }),
  ]);

  const existingDateKeys = new Set(existingAttendances.map((attendance) => attendance.dateKey));
  const suggestedDateKeys = Array.from(
    new Set(reports.map((report) => report.createdAt.toISOString().slice(0, 10)))
  ).filter((dateKey) => !existingDateKeys.has(dateKey));

  if (suggestedDateKeys.length > 0) {
    await prisma.teacherAttendance.createMany({
      data: suggestedDateKeys.map((dateKey) => ({
        teacherId,
        dateKey,
        status: "PRESENT",
        note: "اعتماد تلقائي من التقارير",
      })),
      skipDuplicates: true,
    });

    await logFinanceAction({
      actorId: admin.id,
      action: "APPROVE_SUGGESTED_TEACHER_ATTENDANCES",
      entity: "TeacherAttendance",
      entityId: teacherId,
      summary: `اعتماد ${suggestedDateKeys.length} أيام مقترحة للمعلم`,
      details: { teacherId, monthKey, dateKeys: suggestedDateKeys },
    });
  }

  revalidatePath("/finance");
}

type FinancePageProps = {
  searchParams?: Promise<{ month?: string; tab?: string }> | { month?: string; tab?: string };
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const admin = await requireFinanceAdmin();

  if (!admin) {
    return (
      <main className="min-h-screen bg-[#f6efe3] p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-white p-6 text-[#173d42] shadow-sm">
          <p className="text-lg font-black">هذه الصفحة مخصصة لإدارة التعليم عن بعد فقط.</p>
          <p className="mt-2 text-sm text-[#173d42]/70">سجل الدخول من لوحة إدارة الأونلاين ثم عد إلى صفحة الحسابات المالية.</p>
          <Link href="/remote/admin/login" className="mt-5 inline-flex rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white">
            تسجيل دخول إدارة الأونلاين
          </Link>
        </div>
      </main>
    );
  }

  const resolvedSearchParams = await searchParams;
  const currentMonth = normalizeMonthKey(resolvedSearchParams?.month);
  const activeTab = normalizeFinanceTab(resolvedSearchParams?.tab);
  const monthRange = getMonthRange(currentMonth);
  const monthDateKeys = getMonthDateKeys(currentMonth);

  const [students, expenses, teachers, financeAuditLogs] = await Promise.all([
    prisma.student.findMany({
      where: { isActive: true, studyMode: "REMOTE" },
      orderBy: [{ studyMode: "asc" }, { fullName: "asc" }],
      include: {
        teacher: { select: { fullName: true } },
        circle: { select: { name: true, track: true } },
        financeAccount: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    }),
    prisma.platformExpense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: {
        role: "TEACHER",
        studyMode: "REMOTE",
        isActive: true,
      },
      orderBy: { fullName: "asc" },
      include: {
        circles: {
          where: { studyMode: "REMOTE" },
          select: { name: true, track: true },
        },
        compensationRule: true,
        teacherPayouts: {
          where: { periodMonth: currentMonth },
          orderBy: { paidAt: "desc" },
        },
        teacherAttendances: {
          where: {
            dateKey: {
              gte: monthDateKeys[0] || `${currentMonth}-01`,
              lte: monthDateKeys[monthDateKeys.length - 1] || `${currentMonth}-31`,
            },
          },
          orderBy: { dateKey: "asc" },
        },
        reports: {
          where: {
            createdAt: {
              gte: monthRange.start,
              lt: monthRange.end,
            },
            student: {
              studyMode: "REMOTE",
            },
          },
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.financeAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        actor: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const studentRows = students.map((student) => {
    const total = toNumber(student.financeAccount?.totalAmount);
    const discount = toNumber(student.financeAccount?.discountAmount);
    const required = Math.max(total - discount, 0);
    const paid = student.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const remaining = Math.max(required - paid, 0);
    const currency = student.financeAccount?.currency || student.payments[0]?.currency || defaultCurrency;

    return {
      student,
      total,
      discount,
      required,
      paid,
      remaining,
      currency,
      status: getPaymentStatus(required, paid),
    };
  });

  const expectedIncome = studentRows.reduce((sum, row) => sum + row.required, 0);
  const receivedIncome = studentRows.reduce((sum, row) => sum + row.paid, 0);
  const remainingIncome = studentRows.reduce((sum, row) => sum + row.remaining, 0);
  const studentPayments = students
    .flatMap((student) =>
      student.payments.map((payment) => ({
        payment,
        studentName: student.fullName,
      }))
    )
    .sort((a, b) => b.payment.paidAt.getTime() - a.payment.paidAt.getTime());
  const teacherRows = teachers.map((teacher) => {
    const monthlyAmount = toNumber(teacher.compensationRule?.monthlyAmount);
    const expectedMonthlyHours = toNumber(teacher.compensationRule?.expectedMonthlyHours);
    const expectedMonthlyWorkDays = toNumber(teacher.compensationRule?.expectedMonthlyWorkDays) || 20;
    const paid = teacher.teacherPayouts.reduce((sum, payout) => sum + toNumber(payout.amount), 0);
    const reportDateSet = new Set(teacher.reports.map((report) => report.createdAt.toISOString().slice(0, 10)));
    const attendanceByDate = new Map(
      teacher.teacherAttendances.map((attendance) => [attendance.dateKey, attendance])
    );
    const presentDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "PRESENT").length;
    const excusedDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "EXCUSED").length;
    const absentDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "ABSENT").length;
    const suggestedDays = monthDateKeys.filter((dateKey) => reportDateSet.has(dateKey) && !attendanceByDate.has(dateKey)).length;
    const payableDays = presentDays + excusedDays;
    const presentReports = teacher.reports.filter((report) => report.status === "PRESENT").length;
    const absentReports = teacher.reports.filter((report) => report.status === "ABSENT").length;
    const hourlyRate = expectedMonthlyHours > 0 ? monthlyAmount / expectedMonthlyHours : 0;
    const workRatio = expectedMonthlyWorkDays > 0 ? Math.min(payableDays / expectedMonthlyWorkDays, 1) : 0;
    const estimatedDue = monthlyAmount * workRatio;
    const estimatedHours = expectedMonthlyHours * workRatio;
    const remaining = Math.max(estimatedDue - paid, 0);
    const currency = teacher.compensationRule?.currency || teacher.teacherPayouts[0]?.currency || defaultCurrency;

    return {
      teacher,
      monthlyAmount,
      expectedMonthlyHours,
      expectedMonthlyWorkDays,
      hourlyRate,
      estimatedHours,
      presentDays,
      excusedDays,
      absentDays,
      suggestedDays,
      payableDays,
      workRatio,
      presentReports,
      absentReports,
      paid,
      remaining,
      estimatedDue,
      currency,
      attendanceByDate,
      reportDateSet,
    };
  });

  const platformExpensesTotal = expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const teacherPayoutRows = teachers
    .flatMap((teacher) =>
      teacher.teacherPayouts.map((payout) => ({
        payout,
        teacherName: teacher.fullName,
      }))
    )
    .sort((a, b) => b.payout.paidAt.getTime() - a.payout.paidAt.getTime());
  const teacherPayoutsTotal = teacherRows.reduce((sum, row) => sum + row.paid, 0);
  const teacherEstimatedDueTotal = teacherRows.reduce((sum, row) => sum + row.estimatedDue, 0);
  const teacherRemainingTotal = teacherRows.reduce((sum, row) => sum + row.remaining, 0);
  const totalExpenses = platformExpensesTotal + teacherPayoutsTotal;
  const currentBalance = receivedIncome - totalExpenses;
  const projectedBalance = expectedIncome - totalExpenses;
  const balanceAfterTeacherDues = currentBalance - teacherRemainingTotal;
  const today = new Date().toISOString().slice(0, 10);

  const cards = [
    { label: "الدخل المتوقع من الطلاب", value: expectedIncome, hint: "بعد الخصومات والمنح" },
    { label: "الدخل الفعلي", value: receivedIncome, hint: "المبالغ المسجلة كمدفوعة" },
    { label: "المتبقي على الطلاب", value: remainingIncome, hint: "رسوم لم يتم تحصيلها بعد" },
    { label: "المصروفات المسجلة", value: totalExpenses, hint: "مصروفات المنصة ومكافآت المعلمين المدفوعة" },
    { label: "الرصيد الحالي", value: currentBalance, hint: "الدخل الفعلي ناقص المصروفات" },
    { label: "الرصيد المتوقع", value: projectedBalance, hint: "إذا تم تحصيل كل المتبقي" },
    { label: "مستحقات المعلمين", value: teacherEstimatedDueTotal, hint: "تقدير هذا الشهر حسب أيام العمل" },
    { label: "متبقي مكافآت المعلمين", value: teacherRemainingTotal, hint: "مستحقات لم يتم دفعها بعد" },
    { label: "الرصيد بعد المستحقات", value: balanceAfterTeacherDues, hint: "الرصيد الحالي بعد احتساب المتبقي للمعلمين" },
  ];

  return (
    <main className="min-h-screen bg-[#f6efe3] px-4 py-6 text-[#173d42]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#102f34] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-16 top-6 h-52 w-52 rounded-full bg-[#c39a62]/25" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                الحسابات المالية
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                دخل المنصة، المصروفات، والرصيد في مكان واحد.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
                هذه الصفحة هي المرحلة الأولى من النظام المالي: نربط الطالب برسومه ودفعاته، ونسجل مصروفات المنصة، ثم نحسب الفائض أو العجز تلقائياً.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action="/finance" className="flex items-center gap-2 rounded-full bg-white/12 px-3 py-2">
                <label htmlFor="finance-month" className="text-xs font-black text-white/75">
                  الشهر
                </label>
                <input
                  id="finance-month"
                  name="month"
                  type="month"
                  defaultValue={currentMonth}
                  className="rounded-full border-0 bg-white px-3 py-1 text-sm font-black text-[#173d42]"
                />
                <input type="hidden" name="tab" value={activeTab} />
                <button className="rounded-full bg-[#c39a62] px-3 py-1 text-xs font-black text-white">
                  عرض
                </button>
              </form>
              <Link href="/remote/admin/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42]">
                لوحة الأونلاين
              </Link>
            </div>
          </div>
        </section>

        <nav className="flex gap-2 overflow-x-auto rounded-[2rem] border border-[#d9c8ad] bg-white p-2 shadow-sm">
          {financeTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/finance?month=${currentMonth}&tab=${tab.key}`}
              className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-black transition ${
                activeTab === tab.key
                  ? "bg-[#173d42] text-white"
                  : "bg-[#fffaf2] text-[#173d42] hover:bg-[#f1d39d]/45"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {activeTab === "summary" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.label} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#173d42]/55">{card.label}</p>
              <p className={`mt-3 text-3xl font-black ${card.value < 0 ? "text-red-700" : "text-[#173d42]"}`}>
                {formatMoney(card.value)}
              </p>
              <p className="mt-2 text-xs leading-6 text-[#173d42]/55">{card.hint}</p>
            </article>
          ))}
        </section>
        ) : null}

        {activeTab === "students" || activeTab === "expenses" ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {activeTab === "students" ? (
          <>
          <form action={saveStudentFinanceAccount} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تحديد رسوم الطالب</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">ضع رسوم الفصل أو الخصم أو المنحة لكل طالب.</p>
            <select name="studentId" required className="mt-5 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold">
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} - أونلاين
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input name="totalAmount" type="number" step="0.01" min="0" placeholder="الرسوم" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="discountAmount" type="number" step="0.01" min="0" placeholder="خصم/منحة" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <textarea name="notes" placeholder="ملاحظات مالية" className="mt-3 min-h-24 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white">
              حفظ رسوم الطالب
            </button>
          </form>

          <form action={addStudentPayment} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تسجيل دفعة طالب</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">كل دفعة تسجل هنا تزيد دخل المنصة الفعلي.</p>
            <select name="studentId" required className="mt-5 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold">
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} - أونلاين
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input name="amount" type="number" step="0.01" min="0" required placeholder="المبلغ" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="paidAt" type="date" defaultValue={today} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <input name="method" placeholder="طريقة الدفع: نقدي، حوالة..." className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <textarea name="note" placeholder="ملاحظة الدفعة" className="mt-3 min-h-20 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white">
              إضافة الدفعة
            </button>
          </form>
          </>
          ) : null}

          {activeTab === "expenses" ? (
          <form action={addPlatformExpense} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تسجيل مصروف</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">مثل Zoom، الإعلام، الأنشطة، أو أي مصروف إداري.</p>
            <input name="title" required placeholder="عنوان المصروف" className="mt-5 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="category" placeholder="التصنيف" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="amount" type="number" step="0.01" min="0" required placeholder="المبلغ" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="expenseDate" type="date" defaultValue={today} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <input name="paymentMethod" placeholder="طريقة الدفع" className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <input name="receiptUrl" placeholder="رابط إيصال إن وجد" className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <textarea name="note" placeholder="ملاحظة المصروف" className="mt-3 min-h-20 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#c39a62] px-5 py-3 text-sm font-black text-white">
              إضافة المصروف
            </button>
          </form>
          ) : null}
        </section>
        ) : null}

        {activeTab === "teachers" ? (
        <>
        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1.6fr]">
          <form action={saveTeacherCompensationRule} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">إعداد مكافأة المعلم</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">
              ضع المبلغ الشهري والساعات وأيام العمل المتوقعة، وسيحسب النظام المستحق حسب الأيام التي ظهر فيها عمل فعلي.
            </p>
            <select name="teacherId" required className="mt-5 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold">
              <option value="">اختر المعلم</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="monthlyAmount" type="number" step="0.01" min="0" placeholder="المبلغ الشهري" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="expectedMonthlyHours" type="number" step="0.01" min="0" placeholder="الساعات الشهرية" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="expectedMonthlyWorkDays" type="number" step="0.01" min="0" defaultValue={20} placeholder="أيام العمل الشهرية" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <textarea name="notes" placeholder="مثال: المسار الرباعي، 60 ساعة شهرياً، 20 يوم عمل" className="mt-3 min-h-20 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white">
              حفظ إعداد المكافأة
            </button>
          </form>

          <form action={addTeacherPayout} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تسجيل دفع مكافأة</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">
              عند تسجيل الدفعة تدخل مباشرة ضمن مصروفات المنصة.
            </p>
            <select name="teacherId" required className="mt-5 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold">
              <option value="">اختر المعلم</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="periodMonth" type="month" defaultValue={currentMonth} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="amount" type="number" step="0.01" min="0" required placeholder="المبلغ المدفوع" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="paidAt" type="date" defaultValue={today} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <input name="method" placeholder="طريقة الدفع" className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <textarea name="note" placeholder="ملاحظة الدفع" className="mt-3 min-h-20 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#8a6335] px-5 py-3 text-sm font-black text-white">
              تسجيل دفع المكافأة
            </button>
          </form>

          <div className="overflow-hidden rounded-[2rem] border border-[#d9c8ad] bg-white shadow-sm">
            <div className="border-b border-[#eadcc6] p-5">
              <h2 className="text-xl font-black">مكافآت معلمي الأونلاين لهذا الشهر</h2>
              <p className="mt-1 text-sm text-[#173d42]/60">
                الشهر الحالي: {currentMonth}. المستحق يحسب بنسبة أيام العمل الفعلية إلى أيام العمل المتوقعة.
              </p>
            </div>
            <div className="max-h-[430px] overflow-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="sticky top-0 bg-[#fffaf2] text-[#173d42]/65">
                  <tr>
                    <th className="p-4">المعلم</th>
                    <th className="p-4">الحلقات</th>
                    <th className="p-4">أيام العمل</th>
                    <th className="p-4">نسبة العمل</th>
                    <th className="p-4">تقارير/غياب</th>
                    <th className="p-4">المكافأة</th>
                    <th className="p-4">المستحق</th>
                    <th className="p-4">قيمة الساعة</th>
                    <th className="p-4">ساعات مقدرة</th>
                    <th className="p-4">المدفوع</th>
                    <th className="p-4">المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRows.map((row) => (
                    <tr key={row.teacher.id} className="border-t border-[#f0e3cf]">
                      <td className="p-4 font-black">{row.teacher.fullName}</td>
                      <td className="p-4">
                        {row.teacher.circles.length > 0
                          ? row.teacher.circles.map((circle) => circle.name).join("، ")
                          : "-"}
                      </td>
                      <td className="p-4">{row.payableDays} / {row.expectedMonthlyWorkDays}</td>
                      <td className="p-4">{Math.round(row.workRatio * 100)}%</td>
                      <td className="p-4">
                        {row.presentReports} / {row.absentReports}
                        {row.suggestedDays > 0 ? (
                          <span className="mr-2 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-800">
                            {row.suggestedDays} مقترح
                          </span>
                        ) : null}
                      </td>
                      <td className="p-4">{formatMoney(row.monthlyAmount, row.currency)}</td>
                      <td className="p-4">{formatMoney(row.estimatedDue, row.currency)}</td>
                      <td className="p-4">{formatMoney(row.hourlyRate, row.currency)}</td>
                      <td className="p-4">{row.estimatedHours.toFixed(1)}</td>
                      <td className="p-4 text-[#1f6358]">{formatMoney(row.paid, row.currency)}</td>
                      <td className="p-4 text-[#8a6335]">{formatMoney(row.remaining, row.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">حضور المعلمين المعتمد للحسابات</h2>
              <p className="mt-2 text-sm leading-7 text-[#173d42]/60">
                إذا وجد تقرير في يوم معيّن يظهر اليوم كمقترح حضور، لكن الحساب المالي يعتمد فقط على الحالات التي تحفظها الإدارة هنا.
              </p>
            </div>
            <p className="rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#8a6335]">
              الشهر: {currentMonth}
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {teacherRows.map((row) => (
              <article key={row.teacher.id} className="rounded-[1.5rem] border border-[#eadcc6] bg-[#fffaf2]/50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-black">{row.teacher.fullName}</h3>
                    <p className="mt-1 text-xs leading-6 text-[#173d42]/60">
                      الحلقات: {row.teacher.circles.length > 0 ? row.teacher.circles.map((circle) => circle.name).join("، ") : "-"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={approveSuggestedTeacherAttendances}>
                        <input type="hidden" name="teacherId" value={row.teacher.id} />
                        <input type="hidden" name="month" value={currentMonth} />
                        <button
                          disabled={row.suggestedDays === 0}
                          className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          اعتماد كل المقترحات
                        </button>
                      </form>
                      <form action={addTeacherPayout}>
                        <input type="hidden" name="teacherId" value={row.teacher.id} />
                        <input type="hidden" name="periodMonth" value={currentMonth} />
                        <input type="hidden" name="amount" value={row.remaining.toFixed(2)} />
                        <input type="hidden" name="currency" value={row.currency} />
                        <input type="hidden" name="paidAt" value={today} />
                        <input type="hidden" name="method" value="تسجيل سريع" />
                        <input type="hidden" name="note" value={`دفع سريع لمتبقي مكافأة ${currentMonth}`} />
                        <button
                          disabled={row.remaining <= 0}
                          className="rounded-full bg-[#1f6358] px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          دفع المتبقي
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs md:min-w-64">
                    <p className="rounded-2xl bg-white p-3 font-black text-emerald-800">حاضر: {row.presentDays}</p>
                    <p className="rounded-2xl bg-white p-3 font-black text-sky-800">عذر: {row.excusedDays}</p>
                    <p className="rounded-2xl bg-white p-3 font-black text-red-800">غائب: {row.absentDays}</p>
                    <p className="rounded-2xl bg-white p-3 font-black text-amber-800">مقترح: {row.suggestedDays}</p>
                  </div>
                </div>

                <div className="mt-4 max-h-80 overflow-auto rounded-2xl border border-[#eadcc6] bg-white">
                  <table className="w-full min-w-[620px] text-right text-xs">
                    <thead className="sticky top-0 bg-[#173d42] text-white">
                      <tr>
                        <th className="p-3">اليوم</th>
                        <th className="p-3">الحالة الحالية</th>
                        <th className="p-3">تأكيد الإدارة</th>
                        <th className="p-3">حفظ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthDateKeys.map((dateKey) => {
                        const attendance = row.attendanceByDate.get(dateKey);
                        const status = attendance?.status || null;
                        const hasReport = row.reportDateSet.has(dateKey);

                        return (
                          <tr key={`${row.teacher.id}-${dateKey}`} className="border-t border-[#f0e3cf]">
                            <td className="p-3 font-black">{dateKey}</td>
                            <td className="p-3">
                              <span className={`inline-flex rounded-full px-3 py-1 font-black ring-1 ${getTeacherAttendanceClass(status, hasReport)}`}>
                                {getTeacherAttendanceLabel(status, hasReport)}
                              </span>
                            </td>
                            <td className="p-3">
                              <form id={`attendance-${row.teacher.id}-${dateKey}`} action={updateTeacherAttendance} className="flex flex-col gap-2">
                                <input type="hidden" name="teacherId" value={row.teacher.id} />
                                <input type="hidden" name="dateKey" value={dateKey} />
                                <select
                                  name="status"
                                  defaultValue={status || (hasReport ? "PRESENT" : "")}
                                  className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-xs font-bold"
                                >
                                  <option value="">بدون تأكيد</option>
                                  <option value="PRESENT">حاضر</option>
                                  <option value="ABSENT">غائب</option>
                                  <option value="EXCUSED">عذر</option>
                                </select>
                                <input
                                  name="note"
                                  defaultValue={attendance?.note || ""}
                                  placeholder="ملاحظة اختيارية"
                                  className="rounded-xl border border-[#eadcc6] px-3 py-2 text-xs"
                                />
                              </form>
                            </td>
                            <td className="p-3">
                              <button
                                form={`attendance-${row.teacher.id}-${dateKey}`}
                                className="rounded-xl bg-[#173d42] px-3 py-2 text-xs font-black text-white"
                              >
                                حفظ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">دفعات مكافآت المعلمين</h2>
              <p className="mt-2 text-sm leading-7 text-[#173d42]/60">
                تعديل أو حذف دفعات هذا الشهر مع تأكيد، وكل عملية تظهر في سجل العمليات المالية.
              </p>
            </div>
            <p className="rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#8a6335]">
              {teacherPayoutRows.length} دفعة
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {teacherPayoutRows.length === 0 ? (
              <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#173d42]/60 lg:col-span-2">
                لا توجد دفعات معلمين مسجلة لهذا الشهر.
              </p>
            ) : (
              teacherPayoutRows.map(({ payout, teacherName }) => (
                <article key={payout.id} className="rounded-2xl border border-[#eadcc6] p-4">
                  <p className="font-black">{teacherName}</p>
                  <form action={updateTeacherPayout} className="mt-3 grid gap-2">
                    <input type="hidden" name="payoutId" value={payout.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        name="periodMonth"
                        type="month"
                        defaultValue={payout.periodMonth}
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={toNumber(payout.amount).toFixed(2)}
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <input
                        name="currency"
                        defaultValue={payout.currency}
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <input
                        name="paidAt"
                        type="date"
                        defaultValue={formatDateInput(payout.paidAt)}
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                    </div>
                    <input
                      name="method"
                      defaultValue={payout.method || ""}
                      placeholder="طريقة الدفع"
                      className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                    />
                    <textarea
                      name="note"
                      defaultValue={payout.note || ""}
                      placeholder="ملاحظة"
                      className="min-h-16 rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                    />
                    <ConfirmSubmitButton
                      confirmMessage="هل تريد حفظ تعديل دفعة المعلم؟"
                      className="rounded-xl bg-[#173d42] px-4 py-2 text-xs font-black text-white"
                    >
                      حفظ التعديل
                    </ConfirmSubmitButton>
                  </form>
                  <form action={deleteTeacherPayout} className="mt-2">
                    <input type="hidden" name="payoutId" value={payout.id} />
                    <ConfirmSubmitButton
                      confirmMessage="هل أنت متأكد من حذف دفعة المعلم؟ لا يمكن التراجع عن الحذف."
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
                    >
                      حذف الدفعة
                    </ConfirmSubmitButton>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>
        </>
        ) : null}

        {activeTab === "students" || activeTab === "expenses" ? (
        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          {activeTab === "students" ? (
          <>
          <div className="overflow-hidden rounded-[2rem] border border-[#d9c8ad] bg-white shadow-sm">
            <div className="border-b border-[#eadcc6] p-5">
              <h2 className="text-xl font-black">حالة مدفوعات الطلاب</h2>
              <p className="mt-1 text-sm text-[#173d42]/60">الرسوم، المدفوع، والمتبقي لكل طالب.</p>
            </div>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="sticky top-0 bg-[#fffaf2] text-[#173d42]/65">
                  <tr>
                    <th className="p-4">الطالب</th>
                    <th className="p-4">القسم</th>
                    <th className="p-4">الحلقة</th>
                    <th className="p-4">المطلوب</th>
                    <th className="p-4">المدفوع</th>
                    <th className="p-4">المتبقي</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((row) => (
                    <tr key={row.student.id} className="border-t border-[#f0e3cf]">
                      <td className="p-4 font-black">{row.student.fullName}</td>
                      <td className="p-4">أونلاين</td>
                      <td className="p-4">{row.student.circle?.name || "-"}</td>
                      <td className="p-4">{formatMoney(row.required, row.currency)}</td>
                      <td className="p-4 text-[#1f6358]">{formatMoney(row.paid, row.currency)}</td>
                      <td className="p-4 text-[#8a6335]">{formatMoney(row.remaining, row.currency)}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-[#f1d39d]/45 px-3 py-1 text-xs font-black">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">آخر دفعات الطلاب</h2>
            <p className="mt-1 text-sm leading-6 text-[#173d42]/60">
              يمكن تعديل الدفعة أو حذفها بعد رسالة تأكيد، وكل عملية تحفظ في سجل العمليات.
            </p>
            <div className="mt-4 max-h-[620px] space-y-3 overflow-auto">
              {studentPayments.length === 0 ? (
                <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#173d42]/60">لا توجد دفعات مسجلة بعد.</p>
              ) : (
                studentPayments.map(({ payment, studentName }) => (
                  <article key={payment.id} className="rounded-2xl border border-[#eadcc6] p-4">
                    <p className="font-black">{studentName}</p>
                    <form action={updateStudentPayment} className="mt-3 grid gap-2">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={toNumber(payment.amount).toFixed(2)}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                        <input
                          name="currency"
                          defaultValue={payment.currency}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                        <input
                          name="paidAt"
                          type="date"
                          defaultValue={formatDateInput(payment.paidAt)}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                        <input
                          name="method"
                          defaultValue={payment.method || ""}
                          placeholder="طريقة الدفع"
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                      </div>
                      <textarea
                        name="note"
                        defaultValue={payment.note || ""}
                        placeholder="ملاحظة"
                        className="min-h-16 rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        <ConfirmSubmitButton
                          confirmMessage="هل تريد حفظ تعديل هذه الدفعة؟"
                          className="rounded-xl bg-[#173d42] px-4 py-2 text-xs font-black text-white"
                        >
                          حفظ التعديل
                        </ConfirmSubmitButton>
                      </div>
                    </form>
                    <form action={deleteStudentPayment} className="mt-2">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <ConfirmSubmitButton
                        confirmMessage="هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن الحذف."
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
                      >
                        حذف الدفعة
                      </ConfirmSubmitButton>
                    </form>
                  </article>
                ))
              )}
            </div>
          </div>
          </>
          ) : null}

          {activeTab === "expenses" ? (
          <div className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">آخر المصروفات</h2>
            <div className="mt-4 space-y-3">
              {expenses.length === 0 ? (
                <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#173d42]/60">لا توجد مصروفات مسجلة بعد.</p>
              ) : (
                expenses.map((expense) => (
                  <article key={expense.id} className="rounded-2xl border border-[#eadcc6] p-4">
                    <form action={updatePlatformExpense} className="grid gap-2">
                      <input type="hidden" name="expenseId" value={expense.id} />
                      <input
                        name="title"
                        defaultValue={expense.title}
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs font-black"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          name="category"
                          defaultValue={expense.category}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                        <input
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={toNumber(expense.amount).toFixed(2)}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                        <input
                          name="currency"
                          defaultValue={expense.currency}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                        <input
                          name="expenseDate"
                          type="date"
                          defaultValue={formatDateInput(expense.expenseDate)}
                          className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                        />
                      </div>
                      <input
                        name="paymentMethod"
                        defaultValue={expense.paymentMethod || ""}
                        placeholder="طريقة الدفع"
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <input
                        name="receiptUrl"
                        defaultValue={expense.receiptUrl || ""}
                        placeholder="رابط الإيصال"
                        className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <textarea
                        name="note"
                        defaultValue={expense.note || ""}
                        placeholder="ملاحظة"
                        className="min-h-16 rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs"
                      />
                      <ConfirmSubmitButton
                        confirmMessage="هل تريد حفظ تعديل هذا المصروف؟"
                        className="rounded-xl bg-[#173d42] px-4 py-2 text-xs font-black text-white"
                      >
                        حفظ التعديل
                      </ConfirmSubmitButton>
                    </form>
                    <form action={deletePlatformExpense} className="mt-2">
                      <input type="hidden" name="expenseId" value={expense.id} />
                      <ConfirmSubmitButton
                        confirmMessage="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن الحذف."
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
                      >
                        حذف المصروف
                      </ConfirmSubmitButton>
                    </form>
                  </article>
                ))
              )}
            </div>
          </div>
          ) : null}
        </section>
        ) : null}

        {activeTab === "reports" ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-[#d9c8ad] bg-white p-6 shadow-sm lg:col-span-2">
            <p className="text-sm font-black text-[#9b7039]">تقرير الشهر</p>
            <h2 className="mt-2 text-3xl font-black">ملخص مالي جاهز للمراجعة</h2>
            <p className="mt-3 text-sm leading-7 text-[#173d42]/65">
              هذا القسم يجمع أهم أرقام شهر {currentMonth}. في الخطوة القادمة نستطيع إضافة تصدير Excel أو PDF من هنا.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`/api/finance/export/monthly?month=${currentMonth}`}
                className="rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1f6358]"
              >
                تصدير تقرير الشهر Excel
              </a>
              <span className="rounded-2xl bg-[#fffaf2] px-5 py-3 text-xs font-black leading-6 text-[#8a6335]">
                التصدير متاح فقط لمن لديه صلاحية الحسابات المالية.
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <p className="rounded-2xl bg-[#fffaf2] p-4 font-black">الدخل الفعلي: {formatMoney(receivedIncome)}</p>
              <p className="rounded-2xl bg-[#fffaf2] p-4 font-black">المتبقي على الطلاب: {formatMoney(remainingIncome)}</p>
              <p className="rounded-2xl bg-[#fffaf2] p-4 font-black">مصروفات مدفوعة: {formatMoney(totalExpenses)}</p>
              <p className="rounded-2xl bg-[#fffaf2] p-4 font-black">متبقي المعلمين: {formatMoney(teacherRemainingTotal)}</p>
              <p className="rounded-2xl bg-[#173d42] p-4 font-black text-white">الرصيد الحالي: {formatMoney(currentBalance)}</p>
              <p className="rounded-2xl bg-[#8a6335] p-4 font-black text-white">بعد المستحقات: {formatMoney(balanceAfterTeacherDues)}</p>
            </div>
          </article>
          <article className="rounded-[2rem] border border-[#d9c8ad] bg-[#173d42] p-6 text-white shadow-sm">
            <p className="text-sm font-black text-[#f1d39d]">صلاحيات</p>
            <h3 className="mt-2 text-2xl font-black">حماية الحسابات المالية</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              دخول هذه الصفحة والتصدير مرتبط الآن بصلاحية مالية خاصة داخل حساب الإداري، وليس بمجرد كونه إداري أونلاين.
            </p>
          </article>

          <article className="rounded-[2rem] border border-[#d9c8ad] bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black text-[#9b7039]">سجل العمليات</p>
                <h2 className="mt-2 text-2xl font-black">آخر العمليات المالية</h2>
              </div>
              <p className="rounded-full bg-[#fffaf2] px-4 py-2 text-xs font-black text-[#8a6335]">
                آخر {financeAuditLogs.length} عملية
              </p>
            </div>
            <div className="mt-5 max-h-[520px] overflow-auto rounded-2xl border border-[#eadcc6]">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="sticky top-0 bg-[#173d42] text-white">
                  <tr>
                    <th className="p-4">الوقت</th>
                    <th className="p-4">المستخدم</th>
                    <th className="p-4">العملية</th>
                    <th className="p-4">النوع</th>
                    <th className="p-4">الوصف</th>
                  </tr>
                </thead>
                <tbody>
                  {financeAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-5 text-center text-[#173d42]/60">
                        لا توجد عمليات مالية مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    financeAuditLogs.map((log) => (
                      <tr key={log.id} className="border-t border-[#f0e3cf]">
                        <td className="p-4 font-bold">{log.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                        <td className="p-4">{log.actor?.fullName || log.actor?.email || "غير معروف"}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-black text-[#8a6335]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4">{log.entity}</td>
                        <td className="p-4 font-bold">{log.summary}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
        ) : null}
      </div>
    </main>
  );
}
