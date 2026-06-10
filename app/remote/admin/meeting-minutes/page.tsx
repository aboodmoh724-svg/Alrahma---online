import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import MeetingMinuteActions from "@/components/meeting-minutes/MeetingMinuteActions";
import MeetingMinuteWhatsappSender from "@/components/meeting-minutes/MeetingMinuteWhatsappSender";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";

type PageProps = {
  searchParams?: Promise<{
    minuteId?: string;
    notice?: string;
  }>;
};

function parseLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function jsonList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date: Date | null | undefined) {
  if (!date) return "غير محدد";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function buildWhatsAppText(input: {
  title: string;
  meetingType: string;
  location: string;
  meetingDate: Date | null;
  hijriDate: string;
  startTime: string;
  endTime: string;
  participants: string[];
  agendaItems: string[];
  decisions: string[];
  notes: string[];
  preparedBy: string;
  reviewedBy: string;
}) {
  const section = (title: string, items: string[]) =>
    items.length
      ? `\n${title}\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n`
      : "";

  return [
    "السلام عليكم ورحمة الله وبركاته",
    "",
    "محضر اجتماع - قسم التعليم عن بعد",
    "",
    `العنوان: ${input.title}`,
    `النوع: ${input.meetingType || "غير محدد"}`,
    `المكان: ${input.location || "غير محدد"}`,
    `التاريخ: ${formatDisplayDate(input.meetingDate)}${input.hijriDate ? ` - ${input.hijriDate}` : ""}`,
    `الوقت: ${input.startTime || "-"} إلى ${input.endTime || "-"}`,
    section("المشاركون:", input.participants),
    section("محاور الاجتماع:", input.agendaItems),
    section("القرارات والتوصيات:", input.decisions),
    section("ملاحظات:", input.notes),
    `معد المحضر: ${input.preparedBy || "-"}`,
    `مدقق المحضر: ${input.reviewedBy || "-"}`,
    "",
    "منصة الرحمة لتعليم القرآن الكريم",
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function noticeText(notice?: string) {
  if (notice === "text-sent") return "تم إرسال نص المحضر عبر الواتساب.";
  if (notice === "pdf-sent") return "تم إرسال PDF المحضر عبر الواتساب.";
  if (notice === "recipient-added") return "تم حفظ المستلم الجديد.";
  if (notice === "recipient-deleted") return "تم حذف المستلم من القائمة.";
  if (notice === "no-recipient") return "اختر مستلمًا واحدًا على الأقل قبل الإرسال.";
  if (notice === "whatsapp-missing") return "إعداد الواتساب غير متصل حاليًا.";
  if (notice === "send-error") return "حدث خطأ أثناء الإرسال. حاول مرة أخرى.";
  return "";
}

async function getCurrentRemoteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

function redirectWithNotice(minuteId: string, notice: string): never {
  const params = new URLSearchParams();
  if (minuteId) params.set("minuteId", minuteId);
  params.set("notice", notice);
  redirect(`/remote/admin/meeting-minutes?${params.toString()}`);
}

async function saveMeetingMinute(formData: FormData) {
  "use server";

  const admin = await getCurrentRemoteAdmin();
  if (!admin) return;

  const minuteId = String(formData.get("minuteId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const meetingType = String(formData.get("meetingType") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const meetingDate = parseOptionalDate(formData.get("meetingDate"));
  const hijriDate = String(formData.get("hijriDate") || "").trim();
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const preparedAt = parseOptionalDate(formData.get("preparedAt"));
  const preparedBy = String(formData.get("preparedBy") || "").trim();
  const reviewedBy = String(formData.get("reviewedBy") || "").trim();
  const participants = parseLines(formData.get("participants"));
  const agendaItems = parseLines(formData.get("agendaItems"));
  const decisions = parseLines(formData.get("decisions"));
  const notes = parseLines(formData.get("notes"));

  if (!title) return;

  const whatsappText = buildWhatsAppText({
    title,
    meetingType,
    location,
    meetingDate,
    hijriDate,
    startTime,
    endTime,
    participants,
    agendaItems,
    decisions,
    notes,
    preparedBy,
    reviewedBy,
  });

  const data = {
    studyMode: "REMOTE" as const,
    title,
    meetingType: meetingType || null,
    location: location || null,
    meetingDate,
    hijriDate: hijriDate || null,
    startTime: startTime || null,
    endTime: endTime || null,
    preparedAt,
    preparedBy: preparedBy || null,
    reviewedBy: reviewedBy || null,
    participants: participants as Prisma.InputJsonValue,
    agendaItems: agendaItems as Prisma.InputJsonValue,
    decisions: decisions as Prisma.InputJsonValue,
    notes: notes as Prisma.InputJsonValue,
    whatsappText,
    htmlPath: null,
    pdfPath: null,
    pdfGeneratedAt: null,
    createdById: admin.id,
  };

  let targetMinuteId = minuteId;

  if (minuteId) {
    await prisma.meetingMinute.updateMany({
      where: {
        id: minuteId,
        studyMode: "REMOTE",
      },
      data,
    });
  } else {
    const created = await prisma.meetingMinute.create({
      data,
      select: { id: true },
    });
    targetMinuteId = created.id;
  }

  revalidatePath("/remote/admin/meeting-minutes");
  redirect(`/remote/admin/meeting-minutes?minuteId=${targetMinuteId}`);
}

async function deleteMeetingMinute(formData: FormData) {
  "use server";

  const admin = await getCurrentRemoteAdmin();
  if (!admin) return;

  const minuteId = String(formData.get("minuteId") || "").trim();
  if (!minuteId) return;

  await prisma.meetingMinute.deleteMany({
    where: {
      id: minuteId,
      studyMode: "REMOTE",
    },
  });

  revalidatePath("/remote/admin/meeting-minutes");
  redirect("/remote/admin/meeting-minutes");
}

async function addMeetingMinuteRecipient(formData: FormData) {
  "use server";

  const admin = await getCurrentRemoteAdmin();
  if (!admin) return;

  const minuteId = String(formData.get("minuteId") || "").trim();
  const name = String(formData.get("recipientName") || "").trim();
  const rawPhone = String(formData.get("recipientPhone") || "").trim();
  const phone = normalizeWhatsAppNumber(rawPhone, "90");

  if (!phone) redirectWithNotice(minuteId, "send-error");

  await prisma.meetingMinuteRecipient.upsert({
    where: {
      studyMode_phone: {
        studyMode: "REMOTE",
        phone,
      },
    },
    create: {
      studyMode: "REMOTE",
      name: name || null,
      phone,
      isActive: true,
    },
    update: {
      name: name || undefined,
      isActive: true,
    },
  });

  revalidatePath("/remote/admin/meeting-minutes");
  redirectWithNotice(minuteId, "recipient-added");
}

async function deleteMeetingMinuteRecipient(formData: FormData) {
  "use server";

  const admin = await getCurrentRemoteAdmin();
  if (!admin) return;

  const minuteId = String(formData.get("minuteId") || "").trim();
  const recipientId = String(formData.get("recipientId") || "").trim();
  if (!recipientId) return;

  await prisma.meetingMinuteRecipient.deleteMany({
    where: {
      id: recipientId,
      studyMode: "REMOTE",
    },
  });

  revalidatePath("/remote/admin/meeting-minutes");
  redirectWithNotice(minuteId, "recipient-deleted");
}

export default async function RemoteMeetingMinutesPage({ searchParams }: PageProps) {
  const admin = await getCurrentRemoteAdmin();
  if (!admin) redirect("/remote/admin/login");

  const params = await searchParams;
  const selectedMinuteId = params?.minuteId || "";
  const notice = noticeText(params?.notice);

  const [minutes, recipients] = await Promise.all([
    prisma.meetingMinute.findMany({
      where: {
        studyMode: "REMOTE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
    prisma.meetingMinuteRecipient.findMany({
      where: {
        studyMode: "REMOTE",
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const selectedMinute = minutes.find((minute) => minute.id === selectedMinuteId) || minutes[0] || null;
  const editMinute = selectedMinuteId ? minutes.find((minute) => minute.id === selectedMinuteId) || null : null;

  const formDefaults = {
    id: editMinute?.id || "",
    title: editMinute?.title || "",
    meetingType: editMinute?.meetingType || "فصلي",
    location: editMinute?.location || "عن طريق الزوم",
    meetingDate: formatDateInput(editMinute?.meetingDate),
    hijriDate: editMinute?.hijriDate || "",
    startTime: editMinute?.startTime || "",
    endTime: editMinute?.endTime || "",
    preparedAt: formatDateInput(editMinute?.preparedAt),
    preparedBy: editMinute?.preparedBy || admin.fullName,
    reviewedBy: editMinute?.reviewedBy || "",
    participants: jsonList(editMinute?.participants).join("\n"),
    agendaItems: jsonList(editMinute?.agendaItems).join("\n"),
    decisions: jsonList(editMinute?.decisions).join("\n"),
    notes: jsonList(editMinute?.notes).join("\n"),
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .print-area { display: block !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
          .print-document {
            width: 100% !important;
            min-height: 281mm !important;
            box-shadow: none !important;
            border-radius: 18px !important;
            color: #1c2d31 !important;
          }
          .print-document * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="no-print relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                محاضر الاجتماعات
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                محضر رسمي جاهز للإرسال.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
                أنشئ المحضر، راجعه كصفحة PDF، ثم أرسله للمستلمين المحفوظين نصًا أو ملفًا عبر الواتساب.
              </p>
            </div>
            <Link
              href="/remote/admin/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </section>

        {notice ? (
          <div className="no-print rounded-[1.5rem] bg-white/90 px-5 py-4 text-sm font-black text-[#0a3f2a] shadow-sm ring-1 ring-[#d8bf83]">
            {notice}
          </div>
        ) : null}

        <div className="print-area grid gap-6 xl:grid-cols-[25rem_1fr]">
          <aside className="no-print space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#1c2d31]">
                    {editMinute ? "تعديل محضر" : "محضر جديد"}
                  </h2>
                  <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                    اكتب كل عنصر في سطر مستقل داخل القوائم.
                  </p>
                </div>
                {editMinute ? (
                  <Link
                    href="/remote/admin/meeting-minutes"
                    className="rounded-xl bg-[#fffaf4] px-3 py-2 text-xs font-black text-[#0a3f2a] ring-1 ring-[#d8bf83]"
                  >
                    جديد
                  </Link>
                ) : null}
              </div>

              <form action={saveMeetingMinute} className="space-y-4">
                <input type="hidden" name="minuteId" value={formDefaults.id} />
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">عنوان الاجتماع</span>
                  <input
                    name="title"
                    defaultValue={formDefaults.title}
                    required
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    placeholder="مثال: اجتماع كادر التعليم عن بعد"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">نوع الاجتماع</span>
                    <select
                      name="meetingType"
                      defaultValue={formDefaults.meetingType}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    >
                      <option value="دوري">دوري</option>
                      <option value="فصلي">فصلي</option>
                      <option value="سنوي">سنوي</option>
                      <option value="طارئ">طارئ</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">مكان الاجتماع</span>
                    <input
                      name="location"
                      defaultValue={formDefaults.location}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">التاريخ الميلادي</span>
                    <input
                      type="date"
                      name="meetingDate"
                      defaultValue={formDefaults.meetingDate}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">التاريخ الهجري</span>
                    <input
                      name="hijriDate"
                      defaultValue={formDefaults.hijriDate}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                      placeholder="مثال: 21 صفر 1445هـ"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">وقت البداية</span>
                    <input
                      type="time"
                      name="startTime"
                      defaultValue={formDefaults.startTime}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">وقت الانتهاء</span>
                    <input
                      type="time"
                      name="endTime"
                      defaultValue={formDefaults.endTime}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                </div>

                {[
                  ["participants", "المشاركون", formDefaults.participants],
                  ["agendaItems", "محاور الاجتماع", formDefaults.agendaItems],
                  ["decisions", "القرارات والتوصيات", formDefaults.decisions],
                  ["notes", "ملاحظات", formDefaults.notes],
                ].map(([name, label, value]) => (
                  <label key={name} className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">{label}</span>
                    <textarea
                      name={name}
                      defaultValue={value}
                      rows={name === "decisions" ? 4 : 3}
                      className="resize-y rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">معد المحضر</span>
                    <input
                      name="preparedBy"
                      defaultValue={formDefaults.preparedBy}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-[#1c2d31]">مدقق المحضر</span>
                    <input
                      name="reviewedBy"
                      defaultValue={formDefaults.reviewedBy}
                      className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">تاريخ إعداد المحضر</span>
                  <input
                    type="date"
                    name="preparedAt"
                    defaultValue={formDefaults.preparedAt}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a]"
                >
                  {editMinute ? "حفظ التعديل" : "حفظ المحضر"}
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#1c2d31]">المحاضر المحفوظة</h2>
                  <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">آخر 50 محضر.</p>
                </div>
                <span className="rounded-full bg-[#edf6ee] px-4 py-2 text-sm font-black text-[#0f5a35]">
                  {minutes.length}
                </span>
              </div>

              {minutes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
                  لا توجد محاضر محفوظة حتى الآن.
                </div>
              ) : (
                <div className="grid gap-3">
                  {minutes.map((minute) => (
                    <Link
                      key={minute.id}
                      href={`/remote/admin/meeting-minutes?minuteId=${minute.id}`}
                      className={`rounded-[1.4rem] p-4 ring-1 transition ${
                        selectedMinute?.id === minute.id
                          ? "bg-[#0a3f2a] text-white ring-[#0a3f2a]"
                          : "bg-[#fffaf4] text-[#1c2d31] ring-[#eadcc4] hover:bg-white"
                      }`}
                    >
                      <h3 className="font-black leading-7">{minute.title}</h3>
                      <p className="mt-2 text-xs font-bold opacity-70">
                        {minute.meetingType || "غير محدد"} - {formatDisplayDate(minute.meetingDate)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <section className="space-y-6">
            {selectedMinute ? (
              <>
                <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d8bf83]">
                  <div>
                    <h3 className="text-lg font-black text-[#1c2d31]">معاينة المحضر</h3>
                    <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                      التصميم مهيأ ليكون صفحة واحدة عند المحتوى المعتدل.
                    </p>
                  </div>
                  <MeetingMinuteActions />
                </div>

                <article className="print-document overflow-hidden bg-white p-6 shadow-sm ring-1 ring-black">
                  <table className="w-full border-collapse border-2 border-black text-center text-[#1c2d31]">
                    <tbody>
                      <tr>
                        <td className="w-[16%] border-2 border-black bg-[#76923c] px-3 py-4 text-2xl font-black text-white" rowSpan={2}>
                          محضر اجتماع
                        </td>
                        <td className="border-2 border-black bg-[#d9d9d9] px-3 py-2 text-lg font-black">
                          عنوان الاجتماع
                        </td>
                        <td className="w-[28%] border-2 border-black bg-[#d9d9d9] px-3 py-2 text-lg font-black">
                          نوع الاجتماع
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black px-4 py-4 text-xl font-black leading-8">
                          {selectedMinute.title}
                        </td>
                        <td className="border-2 border-black px-3 py-2">
                          <div className="grid grid-cols-4 gap-1 text-sm font-black">
                            {["دوري", "فصلي", "سنوي", "طارئ"].map((type) => (
                              <span
                                key={type}
                                className={`border border-black px-2 py-2 ${
                                  selectedMinute.meetingType === type
                                    ? "bg-[#76923c] text-white"
                                    : "bg-white text-[#1c2d31]"
                                }`}
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black">
                          مكان الاجتماع
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-lg font-black">
                          {selectedMinute.location || "-"}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-base font-black leading-8">
                          <span className="ml-2 text-[#76923c]">تاريخ الاجتماع:</span>
                          {formatDisplayDate(selectedMinute.meetingDate)}
                          {selectedMinute.hijriDate ? ` - ${selectedMinute.hijriDate}` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black">
                          المشاركون
                        </td>
                        <td className="border-2 border-black px-0 py-0" colSpan={2}>
                          <table className="w-full border-collapse">
                            <tbody>
                              {(jsonList(selectedMinute.participants).length
                                ? jsonList(selectedMinute.participants)
                                : ["لم يحدد"]
                              ).map((name, index) => (
                                <tr key={`${name}-${index}`}>
                                  <td className="w-14 border-l border-black bg-[#d9d9d9] px-3 py-2 font-black">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2 text-base font-bold leading-7">{name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black">
                          محاور الاجتماع
                        </td>
                        <td className="border-2 border-black px-0 py-0" colSpan={2}>
                          <table className="w-full border-collapse">
                            <tbody>
                              {(jsonList(selectedMinute.agendaItems).length
                                ? jsonList(selectedMinute.agendaItems)
                                : ["لا يوجد"]
                              ).map((item, index) => (
                                <tr key={`${item}-${index}`} className={index % 2 === 0 ? "bg-[#ebf6f9]" : "bg-white"}>
                                  <td className="w-14 border-l border-black bg-[#d9d9d9] px-3 py-2 font-black">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-2 text-base font-bold leading-8">{item}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black leading-8">
                          قرارات وتوصيات الاجتماع
                        </td>
                        <td className="border-2 border-black px-0 py-0" colSpan={2}>
                          <table className="w-full border-collapse">
                            <tbody>
                              {(jsonList(selectedMinute.decisions).length
                                ? jsonList(selectedMinute.decisions)
                                : ["لا يوجد"]
                              ).map((item, index) => (
                                <tr key={`${item}-${index}`} className={index % 2 === 0 ? "bg-[#ebf6f9]" : "bg-white"}>
                                  <td className="w-14 border-l border-black bg-[#d9d9d9] px-3 py-2 font-black">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-2 text-base font-bold leading-8">{item}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black">
                          ملاحظات
                        </td>
                        <td className="border-2 border-black px-0 py-0" colSpan={2}>
                          <table className="w-full border-collapse">
                            <tbody>
                              {(jsonList(selectedMinute.notes).length
                                ? jsonList(selectedMinute.notes)
                                : ["لا يوجد"]
                              ).map((item, index) => (
                                <tr key={`${item}-${index}`}>
                                  <td className="w-14 border-l border-black bg-[#d9d9d9] px-3 py-2 font-black">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-2 text-base font-bold leading-8">{item}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black">
                          وقت انتهاء الاجتماع
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-lg font-black">
                          {selectedMinute.endTime || "-"}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-lg font-black">
                          <span className="text-[#76923c]">وقت البداية: </span>
                          {selectedMinute.startTime || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#f2f2f2] px-3 py-3 text-lg font-black">
                          معد المحضر
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-lg font-black">
                          {selectedMinute.preparedBy || "-"}
                        </td>
                        <td className="border-2 border-black px-3 py-3 text-lg font-black">
                          <span className="text-[#76923c]">تاريخ الإعداد: </span>
                          {formatDisplayDate(selectedMinute.preparedAt)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-2 border-black bg-[#76923c] px-3 py-4 text-lg font-black text-white">
                          إدارة منصة الرحمة
                        </td>
                        <td className="border-2 border-black px-3 py-4 text-lg font-black">
                          قسم التعليم عن بعد
                        </td>
                        <td className="border-2 border-black px-3 py-4 text-lg font-black">
                          <span className="text-[#76923c]">مدقق المحضر: </span>
                          {selectedMinute.reviewedBy || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </article>

                <section className="no-print grid gap-4 lg:grid-cols-[1fr_18rem]">
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-[#1c2d31]">إرسال عبر الواتساب</h3>
                        <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                          اختر المستلمين ثم أرسل المحضر كنص أو PDF.
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-2 text-xs font-black ${isWhatsAppConfigured("REMOTE") ? "bg-[#edf6ee] text-[#0f5a35]" : "bg-red-50 text-red-700"}`}>
                        {isWhatsAppConfigured("REMOTE") ? "الواتساب متصل" : "الواتساب غير متصل"}
                      </span>
                    </div>

                    <form className="mt-5 grid gap-3 rounded-2xl bg-[#fffaf4] p-4 ring-1 ring-[#eadcc4] sm:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="minuteId" value={selectedMinute.id} />
                      <input
                        name="recipientName"
                        placeholder="اسم المستلم"
                        className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                      <input
                        name="recipientPhone"
                        placeholder="رقم الواتساب"
                        className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                      <button
                        formAction={addMeetingMinuteRecipient}
                        className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white"
                      >
                        حفظ المستلم
                      </button>
                    </form>

                    <div className="mt-5">
                      <MeetingMinuteWhatsappSender
                        minuteId={selectedMinute.id}
                        recipients={recipients.map((recipient) => ({
                          id: recipient.id,
                          name: recipient.name,
                          phone: recipient.phone,
                        }))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/remote/admin/meeting-minutes?minuteId=${selectedMinute.id}`}
                      className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-center text-sm font-black text-white"
                    >
                      تعديل هذا المحضر
                    </Link>
                    {selectedMinute.pdfPath ? (
                      <a
                        href={selectedMinute.pdfPath}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#0f5a35] ring-1 ring-[#d8bf83]"
                      >
                        فتح آخر PDF
                      </a>
                    ) : null}
                    <form action={deleteMeetingMinute}>
                      <input type="hidden" name="minuteId" value={selectedMinute.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700 ring-1 ring-red-200"
                      >
                        حذف المحضر
                      </button>
                    </form>

                    {recipients.length ? (
                      <div className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d8bf83]">
                        <h4 className="font-black text-[#1c2d31]">إدارة المستلمين</h4>
                        <div className="mt-3 grid gap-2">
                          {recipients.map((recipient) => (
                            <form key={recipient.id} action={deleteMeetingMinuteRecipient} className="flex items-center justify-between gap-2 rounded-xl bg-[#fffaf4] px-3 py-2">
                              <input type="hidden" name="minuteId" value={selectedMinute.id} />
                              <input type="hidden" name="recipientId" value={recipient.id} />
                              <span className="min-w-0 text-xs font-bold text-[#1c2d31]">
                                <span className="block truncate">{recipient.name || recipient.phone}</span>
                              </span>
                              <button className="rounded-lg bg-red-50 px-3 py-1 text-xs font-black text-red-700">حذف</button>
                            </form>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
