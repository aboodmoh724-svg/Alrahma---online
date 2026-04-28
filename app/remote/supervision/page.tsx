import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RemoteSupervisionEntryPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/remote/supervision/login");
  }

  const supervisor = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      canAccessSupervision: true,
      isActive: true,
    },
    select: { id: true },
  });

  if (!supervisor) {
    redirect("/remote/supervision/login");
  }

  redirect("/remote/supervision/dashboard");
}
