import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Handle Zoom endpoint validation challenge
    if (body.event === "endpoint.url_validation") {
      const plainToken = body.payload?.plainToken || "";
      const secret = process.env.ZOOM_WEBHOOK_SECRET || "";
      
      const encryptedToken = crypto
        .createHmac("sha256", secret)
        .update(plainToken)
        .digest("hex");

      return NextResponse.json({
        plainToken,
        encryptedToken,
      }, { status: 200 });
    }

    const event = body.event;
    const meetingObject = body.payload?.object;

    if (!meetingObject) {
      return NextResponse.json({ error: "Missing meeting payload" }, { status: 400 });
    }

    const hostEmail = meetingObject.host_email || "";
    const meetingId = String(meetingObject.id || "");
    const startTimeStr = meetingObject.start_time || meetingObject.start_time_t;
    const endTimeStr = meetingObject.end_time || meetingObject.end_time_t;

    // 2. Identify the teacher (User)
    let teacher = null;

    if (hostEmail) {
      teacher = await prisma.user.findFirst({
        where: {
          email: hostEmail,
          role: "TEACHER",
          studyMode: "REMOTE",
        },
      });
    }

    // Fallback: search by ZoomLink url or Circle zoomUrl
    if (!teacher && meetingId) {
      // Find in ZoomLink
      const zoomLink = await prisma.zoomLink.findFirst({
        where: {
          url: {
            contains: meetingId,
          },
          user: {
            role: "TEACHER",
          },
        },
        include: {
          user: true,
        },
      });

      if (zoomLink?.user) {
        teacher = zoomLink.user;
      }
    }

    if (!teacher && meetingId) {
      // Find in Circle zoomUrl
      const circle = await prisma.circle.findFirst({
        where: {
          zoomUrl: {
            contains: meetingId,
          },
          teacherId: {
            not: null,
          },
          studyMode: "REMOTE",
        },
        include: {
          teacher: true,
        },
      });

      if (circle?.teacher) {
        teacher = circle.teacher;
      }
    }

    if (!teacher) {
      console.warn(`[Zoom Webhook] Teacher not identified for email: ${hostEmail}, meeting: ${meetingId}`);
      return NextResponse.json({ message: "Teacher not identified" }, { status: 200 });
    }

    // Determine the date key (YYYY-MM-DD) in Istanbul/Saudi timezone (UTC+3)
    // Offset for local Saudi time: UTC + 3 hours
    const localDate = new Date(new Date().getTime() + 3 * 60 * 60 * 1000);
    const dateKey = localDate.toISOString().split("T")[0];

    if (event === "meeting.started") {
      const startTime = startTimeStr ? new Date(startTimeStr) : new Date();

      // Create or update attendance record
      await prisma.teacherAttendance.upsert({
        where: {
          teacherId_dateKey: {
            teacherId: teacher.id,
            dateKey,
          },
        },
        create: {
          teacherId: teacher.id,
          dateKey,
          status: "PRESENT",
          checkIn: startTime,
          note: `Zoom started (ID: ${meetingId})`,
        },
        update: {
          status: "PRESENT",
          checkIn: startTime,
          note: `Zoom started (ID: ${meetingId})`,
        },
      });

      console.log(`[Zoom Webhook] Teacher check-in recorded for: ${teacher.fullName} (Date: ${dateKey})`);
    } else if (event === "meeting.ended") {
      const endTime = endTimeStr ? new Date(endTimeStr) : new Date();

      // Retrieve checkIn time
      const attendance = await prisma.teacherAttendance.findUnique({
        where: {
          teacherId_dateKey: {
            teacherId: teacher.id,
            dateKey,
          },
        },
      });

      const checkInTime = attendance?.checkIn || attendance?.createdAt || new Date();
      const diffMs = endTime.getTime() - checkInTime.getTime();
      const durationInMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

      await prisma.teacherAttendance.upsert({
        where: {
          teacherId_dateKey: {
            teacherId: teacher.id,
            dateKey,
          },
        },
        create: {
          teacherId: teacher.id,
          dateKey,
          status: "PRESENT",
          checkOut: endTime,
          duration: durationInMinutes,
          note: `Zoom ended (ID: ${meetingId})`,
        },
        update: {
          checkOut: endTime,
          duration: durationInMinutes,
          note: `Zoom ended (ID: ${meetingId})`,
        },
      });

      console.log(`[Zoom Webhook] Teacher check-out recorded for: ${teacher.fullName} (Duration: ${durationInMinutes} mins)`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Zoom Webhook Error] =>", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
