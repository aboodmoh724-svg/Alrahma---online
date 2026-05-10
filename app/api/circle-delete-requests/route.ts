import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETTING_KEY = "remote-circle-delete-requests";

type CircleDeleteRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type CircleDeleteRequestItem = {
  id: string;
  circleId: string;
  circleName: string;
  teacherName: string | null;
  requestedById: string;
  requestedByName: string;
  reason: string | null;
  status: CircleDeleteRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  adminNote?: string | null;
};

function parseItems(value: unknown): CircleDeleteRequestItem[] {
  if (!Array.isArray(value)) return [];

  const items = value.map((item): CircleDeleteRequestItem | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const status =
        record.status === "APPROVED" || record.status === "REJECTED"
          ? record.status
          : "PENDING";

      return {
        id: String(record.id || ""),
        circleId: String(record.circleId || ""),
        circleName: String(record.circleName || ""),
        teacherName:
          typeof record.teacherName === "string" ? record.teacherName : null,
        requestedById: String(record.requestedById || ""),
        requestedByName: String(record.requestedByName || ""),
        reason: typeof record.reason === "string" ? record.reason : null,
        status,
        createdAt: String(record.createdAt || new Date().toISOString()),
        reviewedAt:
          typeof record.reviewedAt === "string" ? record.reviewedAt : null,
        reviewedById:
          typeof record.reviewedById === "string" ? record.reviewedById : null,
        reviewedByName:
          typeof record.reviewedByName === "string"
            ? record.reviewedByName
            : null,
        adminNote:
          typeof record.adminNote === "string" ? record.adminNote : null,
      } satisfies CircleDeleteRequestItem;
    });

  return items.filter(
    (item): item is CircleDeleteRequestItem =>
      Boolean(item?.id && item.circleId && item.circleName)
  );
}

async function getStoredItems() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: SETTING_KEY },
    select: { value: true },
  });

  return parseItems(setting?.value);
}

async function saveItems(items: CircleDeleteRequestItem[]) {
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: items },
    update: { value: items },
  });
}

async function getCurrentRemoteUser() {
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
      canAccessFinance: true,
      canAccessSupervision: true,
    },
  });
}

export async function GET() {
  try {
    const user = await getCurrentRemoteUser();

    if (!user || (!user.canAccessFinance && !user.canAccessSupervision)) {
      return NextResponse.json({ error: "غير مصرح لك بعرض طلبات حذف الحلقات" }, { status: 403 });
    }

    const requests = await getStoredItems();
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("GET CIRCLE DELETE REQUESTS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب طلبات حذف الحلقات" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentRemoteUser();

    if (!user?.canAccessSupervision) {
      return NextResponse.json({ error: "غير مصرح لك بطلب حذف حلقة" }, { status: 403 });
    }

    const body = await req.json();
    const circleId = String(body.circleId || "").trim();
    const reason = String(body.reason || "").trim();

    if (!circleId) {
      return NextResponse.json({ error: "الحلقة مطلوبة" }, { status: 400 });
    }

    const circle = await prisma.circle.findFirst({
      where: { id: circleId, studyMode: "REMOTE" },
      select: {
        id: true,
        name: true,
        teacher: { select: { fullName: true } },
        _count: { select: { students: true } },
      },
    });

    if (!circle) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });
    }

    if (circle._count.students > 0) {
      return NextResponse.json(
        { error: "لا يمكن طلب حذف حلقة بها طلاب. انقل الطلاب أولًا." },
        { status: 400 }
      );
    }

    const requests = await getStoredItems();
    const existing = requests.find(
      (item) => item.circleId === circle.id && item.status === "PENDING"
    );

    if (existing) {
      return NextResponse.json(
        { error: "يوجد طلب حذف معلق لهذه الحلقة بالفعل" },
        { status: 409 }
      );
    }

    const requestItem: CircleDeleteRequestItem = {
      id: crypto.randomUUID(),
      circleId: circle.id,
      circleName: circle.name,
      teacherName: circle.teacher?.fullName || null,
      requestedById: user.id,
      requestedByName: user.fullName,
      reason: reason || null,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    await saveItems([requestItem, ...requests]);

    return NextResponse.json({ success: true, request: requestItem });
  } catch (error) {
    console.error("CREATE CIRCLE DELETE REQUEST ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال طلب حذف الحلقة" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentRemoteUser();

    if (!user?.canAccessFinance) {
      return NextResponse.json({ error: "غير مصرح لك باعتماد حذف الحلقات" }, { status: 403 });
    }

    const body = await req.json();
    const requestId = String(body.requestId || "").trim();
    const action = String(body.action || "").trim();
    const adminNote = String(body.adminNote || "").trim();

    if (!requestId || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json({ error: "بيانات الاعتماد غير مكتملة" }, { status: 400 });
    }

    const requests = await getStoredItems();
    const index = requests.findIndex((item) => item.id === requestId);

    if (index === -1) {
      return NextResponse.json({ error: "طلب حذف الحلقة غير موجود" }, { status: 404 });
    }

    const requestItem = requests[index];

    if (requestItem.status !== "PENDING") {
      return NextResponse.json({ error: "تمت معالجة هذا الطلب من قبل" }, { status: 400 });
    }

    if (action === "APPROVE") {
      const circle = await prisma.circle.findFirst({
        where: { id: requestItem.circleId, studyMode: "REMOTE" },
        select: {
          id: true,
          _count: { select: { students: true } },
        },
      });

      if (!circle) {
        requests[index] = {
          ...requestItem,
          status: "APPROVED",
          reviewedAt: new Date().toISOString(),
          reviewedById: user.id,
          reviewedByName: user.fullName,
          adminNote: adminNote || "الحلقة غير موجودة عند الاعتماد.",
        };
        await saveItems(requests);
        return NextResponse.json({ success: true, request: requests[index] });
      }

      if (circle._count.students > 0) {
        return NextResponse.json(
          { error: "لا يمكن اعتماد الحذف لأن الحلقة أصبح بها طلاب" },
          { status: 400 }
        );
      }

      await prisma.circle.delete({ where: { id: circle.id } });
    }

    requests[index] = {
      ...requestItem,
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedAt: new Date().toISOString(),
      reviewedById: user.id,
      reviewedByName: user.fullName,
      adminNote: adminNote || null,
    };
    await saveItems(requests);

    return NextResponse.json({ success: true, request: requests[index] });
  } catch (error) {
    console.error("REVIEW CIRCLE DELETE REQUEST ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة طلب حذف الحلقة" },
      { status: 500 }
    );
  }
}
