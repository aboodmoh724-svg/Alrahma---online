-- CreateEnum
CREATE TYPE "AnnualReportReviewStatus" AS ENUM ('REVIEW', 'APPROVED', 'SENT');

-- CreateTable
CREATE TABLE "AnnualReport" (
    "id" TEXT NOT NULL,
    "studentKey" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "teacherName" TEXT,
    "halaqaType" TEXT,
    "firstEvaluation" TEXT,
    "secondEvaluation" TEXT,
    "finalRating" TEXT,
    "memorizedDuringYear" TEXT,
    "learnedDuringYear" TEXT,
    "studentStrengths" TEXT,
    "behaviorNotes" TEXT,
    "studentNeeds" TEXT,
    "parentMessage" TEXT,
    "reportImagePath" TEXT,
    "reportImageFilename" TEXT,
    "sourceRowNumber" INTEGER,
    "dataStatus" TEXT NOT NULL DEFAULT 'needs_review',
    "reviewStatus" "AnnualReportReviewStatus" NOT NULL DEFAULT 'REVIEW',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sendError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "circleId" TEXT,
    "reviewedBy" TEXT,
    "sentBy" TEXT,

    CONSTRAINT "AnnualReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnualReport_academicYear_studentKey_key" ON "AnnualReport"("academicYear", "studentKey");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualReport_academicYear_studentId_key" ON "AnnualReport"("academicYear", "studentId");

-- CreateIndex
CREATE INDEX "AnnualReport_academicYear_reviewStatus_idx" ON "AnnualReport"("academicYear", "reviewStatus");

-- CreateIndex
CREATE INDEX "AnnualReport_teacherId_academicYear_idx" ON "AnnualReport"("teacherId", "academicYear");

-- CreateIndex
CREATE INDEX "AnnualReport_circleId_academicYear_idx" ON "AnnualReport"("circleId", "academicYear");

-- CreateIndex
CREATE INDEX "AnnualReport_studentName_idx" ON "AnnualReport"("studentName");

-- AddForeignKey
ALTER TABLE "AnnualReport" ADD CONSTRAINT "AnnualReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReport" ADD CONSTRAINT "AnnualReport_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReport" ADD CONSTRAINT "AnnualReport_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReport" ADD CONSTRAINT "AnnualReport_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualReport" ADD CONSTRAINT "AnnualReport_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
