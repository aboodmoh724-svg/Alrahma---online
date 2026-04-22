import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const defaultCurrency = "USD";

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeMonthKey(value: unknown) {
  const monthKey = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : getCurrentMonthKey();
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

function safeSheetName(name: string) {
  return name.slice(0, 31);
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

export async function GET(request: NextRequest) {
  const admin = await requireFinanceAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const monthKey = normalizeMonthKey(request.nextUrl.searchParams.get("month"));
  const monthRange = getMonthRange(monthKey);
  const monthDateKeys = getMonthDateKeys(monthKey);
  const monthStartKey = monthDateKeys[0] || `${monthKey}-01`;
  const monthEndKey = monthDateKeys[monthDateKeys.length - 1] || `${monthKey}-31`;

  const [students, expenses, teachers, auditLogs] = await Promise.all([
    prisma.student.findMany({
      where: { isActive: true, studyMode: "REMOTE" },
      orderBy: { fullName: "asc" },
      include: {
        teacher: { select: { fullName: true } },
        circle: { select: { name: true, track: true } },
        financeAccount: true,
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    }),
    prisma.platformExpense.findMany({
      where: {
        expenseDate: {
          gte: monthRange.start,
          lt: monthRange.end,
        },
      },
      orderBy: { expenseDate: "desc" },
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
          where: { periodMonth: monthKey },
          orderBy: { paidAt: "desc" },
        },
        teacherAttendances: {
          where: {
            dateKey: {
              gte: monthStartKey,
              lte: monthEndKey,
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
      where: {
        createdAt: {
          gte: monthRange.start,
          lt: monthRange.end,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { fullName: true, email: true } },
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
      "اسم الطالب": student.fullName,
      "الحلقة": student.circle?.name || "",
      "المسار": student.circle?.track || "",
      "المعلم": student.teacher.fullName,
      "الرسوم": total,
      "الخصم": discount,
      "المطلوب": required,
      "المدفوع": paid,
      "المتبقي": remaining,
      "العملة": currency,
      "ملاحظات مالية": student.financeAccount?.notes || "",
    };
  });

  const studentPaymentRows = students.flatMap((student) =>
    student.payments
      .filter((payment) => payment.paidAt >= monthRange.start && payment.paidAt < monthRange.end)
      .map((payment) => ({
        "اسم الطالب": student.fullName,
        "التاريخ": payment.paidAt.toISOString().slice(0, 10),
        "المبلغ": toNumber(payment.amount),
        "العملة": payment.currency,
        "طريقة الدفع": payment.method || "",
        "ملاحظة": payment.note || "",
      }))
  );

  const expenseRows = expenses.map((expense) => ({
    "العنوان": expense.title,
    "التصنيف": expense.category,
    "التاريخ": expense.expenseDate.toISOString().slice(0, 10),
    "المبلغ": toNumber(expense.amount),
    "العملة": expense.currency,
    "طريقة الدفع": expense.paymentMethod || "",
    "رابط الإيصال": expense.receiptUrl || "",
    "ملاحظة": expense.note || "",
  }));

  const teacherRows = teachers.map((teacher) => {
    const monthlyAmount = toNumber(teacher.compensationRule?.monthlyAmount);
    const expectedMonthlyHours = toNumber(teacher.compensationRule?.expectedMonthlyHours);
    const expectedMonthlyWorkDays = toNumber(teacher.compensationRule?.expectedMonthlyWorkDays) || 20;
    const paid = teacher.teacherPayouts.reduce((sum, payout) => sum + toNumber(payout.amount), 0);
    const reportDateSet = new Set(teacher.reports.map((report) => report.createdAt.toISOString().slice(0, 10)));
    const attendanceByDate = new Map(teacher.teacherAttendances.map((attendance) => [attendance.dateKey, attendance]));
    const presentDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "PRESENT").length;
    const excusedDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "EXCUSED").length;
    const absentDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "ABSENT").length;
    const suggestedDays = monthDateKeys.filter((dateKey) => reportDateSet.has(dateKey) && !attendanceByDate.has(dateKey)).length;
    const payableDays = presentDays + excusedDays;
    const workRatio = expectedMonthlyWorkDays > 0 ? Math.min(payableDays / expectedMonthlyWorkDays, 1) : 0;
    const estimatedDue = monthlyAmount * workRatio;
    const remaining = Math.max(estimatedDue - paid, 0);
    const currency = teacher.compensationRule?.currency || teacher.teacherPayouts[0]?.currency || defaultCurrency;

    return {
      "اسم المعلم": teacher.fullName,
      "الحلقات": teacher.circles.map((circle) => circle.name).join(", "),
      "المكافأة الشهرية": monthlyAmount,
      "أيام العمل المتوقعة": expectedMonthlyWorkDays,
      "أيام الحضور": presentDays,
      "أيام العذر": excusedDays,
      "أيام الغياب": absentDays,
      "أيام مقترحة غير معتمدة": suggestedDays,
      "أيام قابلة للدفع": payableDays,
      "نسبة العمل": `${Math.round(workRatio * 100)}%`,
      "المستحق": estimatedDue,
      "المدفوع": paid,
      "المتبقي": remaining,
      "العملة": currency,
      "ملاحظات": teacher.compensationRule?.notes || "",
    };
  });

  const teacherPayoutRows = teachers.flatMap((teacher) =>
    teacher.teacherPayouts.map((payout) => ({
      "اسم المعلم": teacher.fullName,
      "الشهر": payout.periodMonth,
      "التاريخ": payout.paidAt.toISOString().slice(0, 10),
      "المبلغ": toNumber(payout.amount),
      "العملة": payout.currency,
      "طريقة الدفع": payout.method || "",
      "ملاحظة": payout.note || "",
    }))
  );

  const expectedIncome = studentRows.reduce((sum, row) => sum + Number(row["المطلوب"]), 0);
  const receivedIncome = studentRows.reduce((sum, row) => sum + Number(row["المدفوع"]), 0);
  const remainingIncome = studentRows.reduce((sum, row) => sum + Number(row["المتبقي"]), 0);
  const platformExpensesTotal = expenseRows.reduce((sum, row) => sum + Number(row["المبلغ"]), 0);
  const teacherPayoutsTotal = teacherPayoutRows.reduce((sum, row) => sum + Number(row["المبلغ"]), 0);
  const teacherDueTotal = teacherRows.reduce((sum, row) => sum + Number(row["المستحق"]), 0);
  const teacherRemainingTotal = teacherRows.reduce((sum, row) => sum + Number(row["المتبقي"]), 0);
  const totalExpenses = platformExpensesTotal + teacherPayoutsTotal;
  const currentBalance = receivedIncome - totalExpenses;

  const summaryRows = [
    { "البند": "الشهر", "القيمة": monthKey },
    { "البند": "تاريخ التصدير", "القيمة": new Date().toISOString().slice(0, 19).replace("T", " ") },
    { "البند": "صدر بواسطة", "القيمة": admin.fullName || admin.email },
    { "البند": "عدد الطلاب", "القيمة": students.length },
    { "البند": "عدد المعلمين", "القيمة": teachers.length },
    { "البند": "الدخل المتوقع من الطلاب", "القيمة": expectedIncome },
    { "البند": "الدخل الفعلي", "القيمة": receivedIncome },
    { "البند": "المتبقي على الطلاب", "القيمة": remainingIncome },
    { "البند": "مصروفات المنصة", "القيمة": platformExpensesTotal },
    { "البند": "مكافآت معلمين مدفوعة", "القيمة": teacherPayoutsTotal },
    { "البند": "إجمالي المصروفات المدفوعة", "القيمة": totalExpenses },
    { "البند": "مستحقات المعلمين", "القيمة": teacherDueTotal },
    { "البند": "متبقي مكافآت المعلمين", "القيمة": teacherRemainingTotal },
    { "البند": "الرصيد الحالي", "القيمة": currentBalance },
    { "البند": "الرصيد بعد مستحقات المعلمين", "القيمة": currentBalance - teacherRemainingTotal },
  ];

  const auditRows = auditLogs.map((log) => ({
    "الوقت": log.createdAt.toISOString().slice(0, 19).replace("T", " "),
    "المستخدم": log.actor?.fullName || log.actor?.email || "غير معروف",
    "العملية": log.action,
    "النوع": log.entity,
    "الوصف": log.summary,
  }));

  const workbook = XLSX.utils.book_new();
  const sheets = [
    ["الملخص", summaryRows],
    ["الطلاب", studentRows],
    ["دفعات الطلاب", studentPaymentRows],
    ["المصروفات", expenseRows],
    ["المعلمون", teacherRows],
    ["دفعات المعلمين", teacherPayoutRows],
    ["سجل العمليات", auditRows],
  ] as const;

  for (const [name, rows] of sheets) {
    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "ملاحظة": "لا توجد بيانات" }]);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(name));
  }

  await logFinanceAction({
    actorId: admin.id,
    action: "EXPORT_MONTHLY_FINANCE_REPORT",
    entity: "FinanceExport",
    entityId: monthKey,
    summary: `تصدير تقرير مالي لشهر ${monthKey}`,
    details: {
      monthKey,
      students: students.length,
      teachers: teachers.length,
      expenses: expenses.length,
      studentPayments: studentPaymentRows.length,
      teacherPayouts: teacherPayoutRows.length,
    },
  });

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const body = new Uint8Array(buffer);
  const fileName = `alrahma-finance-${monthKey}.xlsx`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
