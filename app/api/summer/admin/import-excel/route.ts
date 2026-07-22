import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import * as XLSX from "xlsx";
import * as fs from "fs";

function makeTeacherEmail(teacherName: string) {
  const clean = teacherName.trim();
  if (clean.includes("أسامة سليمان")) return "osama@test.com";
  if (clean.includes("راعي جوخة")) return "ahmad_raei@test.com";
  if (clean.includes("ريان")) return "rayan@test.com";
  if (clean.includes("أحمد القط")) return "ahmad_alqatt@test.com";
  if (clean.includes("عبدالله اليحيى")) return "abdullah@test.com";
  if (clean.includes("محسن")) return "mohsen@test.com";
  if (clean.includes("العمري")) return "abdulrahman@test.com";

  const firstWord = clean.split(/[\s\/_]+/)[0];
  return `${firstWord.toLowerCase()}@test.com`;
}

export async function POST(request: Request) {
  try {
    let fileBuffer: Buffer | null = null;

    // Check if file uploaded via FormData
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    }

    // Fallback to local PC path if no file uploaded
    if (!fileBuffer) {
      const filePath = "C:\\Users\\amohm\\Downloads\\بيانات الطلاب والحلقات.xls";
      if (fs.existsSync(filePath)) {
        fileBuffer = fs.readFileSync(filePath);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, error: "الرجاء رفع ملف البيانات بصيغة Excel" },
        { status: 400 }
      );
    }

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const dataRows = rows.slice(1).filter((r) => r && r[0] && r[1] && r[2]);

    const passwordHash = hashPassword("12345");

    const teacherMap = new Map();
    const circleMap = new Map();
    let codeCounter = 7001;

    const importedStudents = [];

    for (const row of dataRows) {
      const studentName = String(row[0]).trim();
      const circleName = String(row[1]).trim();
      const teacherName = String(row[2]).trim();

      // 1. Upsert Teacher
      let teacher = teacherMap.get(teacherName);
      if (!teacher) {
        const email = makeTeacherEmail(teacherName);

        teacher = await prisma.user.upsert({
          where: { email },
          create: {
            fullName: teacherName,
            email,
            password: passwordHash,
            role: "TEACHER",
            studyMode: "ONSITE_SUMMER",
            isActive: true,
          },
          update: {
            fullName: teacherName,
            password: passwordHash,
            role: "TEACHER",
            studyMode: "ONSITE_SUMMER",
            isActive: true,
          },
        });

        teacherMap.set(teacherName, teacher);
      }

      // 2. Find or Create Circle
      const circleKey = `${circleName}_${teacher.id}`;
      let circle = circleMap.get(circleKey);
      if (!circle) {
        circle = await prisma.circle.findFirst({
          where: { name: circleName, teacherId: teacher.id, studyMode: "ONSITE_SUMMER" },
        });

        if (!circle) {
          circle = await prisma.circle.create({
            data: {
              name: circleName,
              teacherId: teacher.id,
              studyMode: "ONSITE_SUMMER",
            },
          });
        }
        circleMap.set(circleKey, circle);
      }

      // 3. Determine Group
      const summerGroup = circleName.includes("نور البيان") ? "NOOR_AL_BAYAN" : "QURAN";

      // 4. Upsert Student
      const studentCode = String(codeCounter++);
      const existingStudent = await prisma.student.findFirst({
        where: { fullName: studentName, studyMode: "ONSITE_SUMMER" },
      });

      if (!existingStudent) {
        const newSt = await prisma.student.create({
          data: {
            fullName: studentName,
            studentCode,
            studyMode: "ONSITE_SUMMER",
            summerGroup,
            circleId: circle.id,
            teacherId: teacher.id,
            isActive: true,
          },
        });
        importedStudents.push(newSt);
      } else {
        const updatedSt = await prisma.student.update({
          where: { id: existingStudent.id },
          data: {
            summerGroup,
            circleId: circle.id,
            teacherId: teacher.id,
            isActive: true,
          },
        });
        importedStudents.push(updatedSt);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${dataRows.length} طالباً و ${teacherMap.size} معلمين وحساباتهم بنجاح!`,
      teachersCount: teacherMap.size,
      circlesCount: circleMap.size,
      studentsCount: importedStudents.length,
    });
  } catch (error) {
    console.error("IMPORT ERROR =>", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "فشل الاستيراد" },
      { status: 500 }
    );
  }
}
