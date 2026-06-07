import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  annualReportCreateData,
  annualReportFilename,
  annualReportString,
  annualReportUpdateData,
  normalizeAnnualReportName,
  type AnnualReportImportRecord,
} from "@/lib/annual-reports";
import { uploadToLocalStorage } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

async function getCurrentOnsiteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });
}

function parseRecords(raw: string): AnnualReportImportRecord[] {
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("ملف البيانات يجب أن يكون JSON Array");
  }

  return parsed.filter(
    (item): item is AnnualReportImportRecord =>
      Boolean(item && typeof item === "object")
  );
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentOnsiteAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "لا تملك صلاحية استيراد التقارير السنوية" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const dataFile = formData.get("dataFile");

    if (!(dataFile instanceof File)) {
      return NextResponse.json(
        { error: "ملف بيانات JSON مطلوب" },
        { status: 400 }
      );
    }

    const records = parseRecords(await dataFile.text());
    const imageFiles = formData
      .getAll("images")
      .filter((file): file is File => file instanceof File);
    const imagesByName = new Map(
      imageFiles.map((file) => [annualReportFilename(file.name, file.name), file])
    );

    const students = await prisma.student.findMany({
      where: {
        studyMode: "ONSITE",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        teacherId: true,
        circleId: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const matchedStudents = new Set<string>();
    const results: Array<{
      studentKey: string;
      studentName: string;
      mode: "created" | "updated";
      matchedStudent: boolean;
      imageUploaded: boolean;
    }> = [];

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const studentName = annualReportString(record.student_name);
      const teacherName = annualReportString(record.teacher_name);
      const normalizedStudentName = normalizeAnnualReportName(studentName);
      const normalizedTeacherName = normalizeAnnualReportName(teacherName);

      const matchingStudents = students.filter(
        (student) =>
          normalizeAnnualReportName(student.fullName) === normalizedStudentName &&
          !matchedStudents.has(student.id)
      );
      const student =
        matchingStudents.find(
          (item) =>
            normalizeAnnualReportName(item.teacher.fullName) ===
            normalizedTeacherName
        ) ||
        matchingStudents[0] ||
        null;

      if (student) {
        matchedStudents.add(student.id);
      }

      const studentKey =
        annualReportString(record.student_key) ||
        `annual-2025-2026-${String(index + 1).padStart(4, "0")}`;
      const academicYear =
        annualReportString(record.academic_year) || "2025-2026";
      const imageFilename = annualReportFilename(
        record.report_image_filename,
        studentKey
      );
      const image = imagesByName.get(imageFilename);
      const imagePath = image
        ? await uploadToLocalStorage(
            image,
            `annual-reports/${academicYear}`,
            imageFilename
          )
        : null;

      const createData = annualReportCreateData({
        record,
        index,
        imagePath,
        student,
      });
      const existing = await prisma.annualReport.findUnique({
        where: {
          academicYear_studentKey: {
            academicYear,
            studentKey,
          },
        },
        select: { id: true },
      });

      const report = existing
        ? await prisma.annualReport.update({
            where: { id: existing.id },
            data: annualReportUpdateData(createData),
            select: {
              studentKey: true,
              studentName: true,
            },
          })
        : await prisma.annualReport.create({
            data: createData,
            select: {
              studentKey: true,
              studentName: true,
            },
          });

      results.push({
        studentKey: report.studentKey,
        studentName: report.studentName,
        mode: existing ? "updated" : "created",
        matchedStudent: Boolean(student),
        imageUploaded: Boolean(imagePath),
      });
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      matchedStudents: results.filter((item) => item.matchedStudent).length,
      uploadedImages: results.filter((item) => item.imageUploaded).length,
      results,
    });
  } catch (error) {
    console.error("IMPORT ONSITE ANNUAL REPORTS ERROR =>", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء استيراد التقارير السنوية",
      },
      { status: 500 }
    );
  }
}
