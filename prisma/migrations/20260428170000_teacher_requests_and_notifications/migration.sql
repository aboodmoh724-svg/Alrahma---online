CREATE TYPE "TeacherRequestType" AS ENUM ('TEST_REQUEST', 'STRUGGLING_STUDENT', 'SPECIAL_CASE', 'GENERAL');

CREATE TYPE "TeacherRequestStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

CREATE TYPE "TeacherRequestPriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "UserNotificationType" AS ENUM ('GENERAL', 'REQUEST_UPDATED', 'STUDENT_ASSIGNED', 'STUDENT_MOVED');

CREATE TABLE "TeacherRequest" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" "TeacherRequestType" NOT NULL,
    "priority" "TeacherRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "TeacherRequestStatus" NOT NULL DEFAULT 'NEW',
    "subject" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserNotificationType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherRequest_teacherId_status_idx" ON "TeacherRequest"("teacherId", "status");
CREATE INDEX "TeacherRequest_status_createdAt_idx" ON "TeacherRequest"("status", "createdAt");
CREATE INDEX "TeacherRequest_studentId_idx" ON "TeacherRequest"("studentId");
CREATE INDEX "UserNotification_userId_isRead_createdAt_idx" ON "UserNotification"("userId", "isRead", "createdAt");

ALTER TABLE "TeacherRequest" ADD CONSTRAINT "TeacherRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherRequest" ADD CONSTRAINT "TeacherRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeacherRequest" ADD CONSTRAINT "TeacherRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
