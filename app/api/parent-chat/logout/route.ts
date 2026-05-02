import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PARENT_CHAT_COOKIE } from "@/lib/education-chat";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(PARENT_CHAT_COOKIE);

  return NextResponse.json({ success: true });
}
