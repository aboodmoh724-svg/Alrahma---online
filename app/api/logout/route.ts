import { NextResponse } from "next/server";

const cookiesToClear = [
  "alrahma_user_id",
  "alrahma_user_role",
  "alrahma_user_mode",
  "alrahma_admin_user_id",
  "alrahma_teacher_user_id",
];

export async function POST() {
  const response = NextResponse.json({
    success: true,
    redirectTo: "/onsite/summer/teacher/login",
  });

  for (const cookieName of cookiesToClear) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const redirectUrl = searchParams.get("redirect") || "/onsite/summer/teacher/login";

  const response = NextResponse.redirect(new URL(redirectUrl, req.url));

  for (const cookieName of cookiesToClear) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
