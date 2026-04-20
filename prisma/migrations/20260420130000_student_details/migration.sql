CREATE TABLE "StudentDetail" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceStudentNo" TEXT,
    "matchedName" TEXT NOT NULL,
    "idImageUrl" TEXT,
    "birthDate" TEXT,
    "birthPlace" TEXT,
    "nationality" TEXT,
    "generalLevel" TEXT,
    "livingWith" TEXT,
    "grade" TEXT,
    "schoolName" TEXT,
    "fatherPhone" TEXT,
    "motherPhone" TEXT,
    "guardianPhone" TEXT,
    "fatherAlive" TEXT,
    "motherAlive" TEXT,
    "fatherEducation" TEXT,
    "motherEducation" TEXT,
    "hasIncome" TEXT,
    "monthlyIncome" TEXT,
    "homeLocation" TEXT,
    "gatheringArea" TEXT,
    "notes" TEXT,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDetail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentDetail_studentId_key" ON "StudentDetail"("studentId");

ALTER TABLE "StudentDetail" ADD CONSTRAINT "StudentDetail_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
