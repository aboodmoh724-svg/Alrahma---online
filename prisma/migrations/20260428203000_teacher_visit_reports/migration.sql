CREATE TYPE "public"."TeacherVisitType" AS ENUM ('FIELD', 'SECRET');

CREATE TABLE "public"."TeacherVisitReport" (
    "id" TEXT NOT NULL,
    "visitNumber" SERIAL NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "taskId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "visitType" "public"."TeacherVisitType" NOT NULL,
    "trackLabel" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "overallEvaluation" TEXT,
    "finalRecommendation" TEXT,
    "generalNotes" TEXT,
    "mainItems" JSONB NOT NULL,
    "generalItems" JSONB NOT NULL,
    "pdfPath" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "sentToTeacherAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherVisitReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherVisitReport_visitNumber_key" ON "public"."TeacherVisitReport"("visitNumber");
CREATE INDEX "TeacherVisitReport_teacherId_visitDate_idx" ON "public"."TeacherVisitReport"("teacherId", "visitDate");
CREATE INDEX "TeacherVisitReport_supervisorId_createdAt_idx" ON "public"."TeacherVisitReport"("supervisorId", "createdAt");
CREATE INDEX "TeacherVisitReport_taskId_idx" ON "public"."TeacherVisitReport"("taskId");

ALTER TABLE "public"."TeacherVisitReport" ADD CONSTRAINT "TeacherVisitReport_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TeacherVisitReport" ADD CONSTRAINT "TeacherVisitReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TeacherVisitReport" ADD CONSTRAINT "TeacherVisitReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."SupervisionTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
