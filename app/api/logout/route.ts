import { NextResponse } from "next/server";

const userCookieName = "alrahma_user_id";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    redirectTo: "/",
  });

  response.cookies.set(userCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
