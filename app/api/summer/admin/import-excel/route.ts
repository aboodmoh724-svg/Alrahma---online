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

function formatCircleName(circleName: string, teacherName: string): string {
  const cleanTeacher = teacherName.trim();
  if (cleanTeacher.includes("أسامة سليمان")) return "حلقة القرآن - 1";
  if (cleanTeacher.includes("راعي جوخة")) return "حلقة القرآن - 2";
  if (cleanTeacher.includes("ريان")) return "حلقة القرآن - 3";
  if (cleanTeacher.includes("أحمد القط")) return "حلقة نور البيان - 1";
  if (cleanTeacher.includes("عبدالله اليحيى")) return "حلقة نور البيان - 2";
  if (cleanTeacher.includes("محسن")) return "حلقة نور البيان - 3";
  if (cleanTeacher.includes("العمري")) return "حلقة القرآن (عن بعد)";
  return circleName;
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

    // Fetch existing students in other modes (Afyon, Remote, Syria) with phone numbers
    const otherStudents = await prisma.student.findMany({
      where: {
        studyMode: { not: "ONSITE_SUMMER" },
        parentWhatsapp: { not: null },
      },
      select: {
        fullName: true,
        parentWhatsapp: true,
      },
    });

    // Find highest numerical studentCode in database
    const allStudents = await prisma.student.findMany({ select: { studentCode: true } });
    let maxCode = 7100;
    allStudents.forEach((st) => {
      const num = parseInt(st.studentCode || "", 10);
      if (!isNaN(num) && num > maxCode && num < 9000) {
        maxCode = num;
      }
    });

    let codeCounter = maxCode + 1;
    const importedStudents = [];
    let matchedPhonesCount = 0;

    for (const row of dataRows) {
      const studentName = String(row[0]).trim();
      const rawCircleName = String(row[1]).trim();
      const teacherName = String(row[2]).trim();

      const circleName = formatCircleName(rawCircleName, teacherName);

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
          where: { teacherId: teacher.id, studyMode: "ONSITE_SUMMER" },
        });

        if (!circle) {
          circle = await prisma.circle.create({
            data: {
              name: circleName,
              teacherId: teacher.id,
              studyMode: "ONSITE_SUMMER",
            },
          });
        } else {
          // Update circle name if needed
          circle = await prisma.circle.update({
            where: { id: circle.id },
            data: { name: circleName },
          });
        }
        circleMap.set(circleKey, circle);
      }

      // 3. Determine Group
      const summerGroup = rawCircleName.includes("نور البيان") ? "NOOR_AL_BAYAN" : "QURAN";

      // 4. Try matching parentWhatsapp from Afyon/Other students
      let parentWhatsapp: string | null = null;
      const cleanStudentName = studentName.replace(/\s+/g, " ");
      const match = otherStudents.find((os) => {
        const cleanOtherName = os.fullName.trim().replace(/\s+/g, " ");
        if (cleanOtherName === cleanStudentName) return true;
        const sWords = cleanStudentName.split(" ");
        const oWords = cleanOtherName.split(" ");
        if (sWords.length >= 2 && oWords.length >= 2 && sWords[0] === oWords[0] && sWords[1] === oWords[1]) {
          return true;
        }
        return false;
      });

      if (match && match.parentWhatsapp) {
        parentWhatsapp = match.parentWhatsapp;
        matchedPhonesCount++;
      }

      // 5. Upsert Student
      const existingStudent = await prisma.student.findFirst({
        where: { fullName: studentName, studyMode: "ONSITE_SUMMER" },
      });

      if (!existingStudent) {
        const studentCode = String(codeCounter++);
        const newSt = await prisma.student.create({
          data: {
            fullName: studentName,
            studentCode,
            studyMode: "ONSITE_SUMMER",
            summerGroup,
            circleId: circle.id,
            teacherId: teacher.id,
            parentWhatsapp,
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
            ...(parentWhatsapp ? { parentWhatsapp } : {}),
            isActive: true,
          },
        });
        importedStudents.push(updatedSt);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم استيراد وتنظيم ${importedStudents.length} طالباً و ${teacherMap.size} معلمين وحلقاتهم وتحديث أرقام الهاتف بنجاح!`,
      teachersCount: teacherMap.size,
      circlesCount: circleMap.size,
      studentsCount: importedStudents.length,
      matchedPhonesCount,
    });
  } catch (error) {
    console.error("IMPORT ERROR =>", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "فشل الاستيراد" },
      { status: 500 }
    );
  }
}
