CREATE TYPE "SupervisionTaskSource" AS ENUM ('AUTOMATIC', 'TEACHER', 'ADMIN');
CREATE TYPE "SupervisionTaskCategory" AS ENUM ('MEMORIZATION_STREAK', 'ABSENCE_STREAK', 'TEACHER_REQUEST', 'TEACHER_VISIT', 'GENERAL_SUPERVISION');
CREATE TYPE "SupervisionTaskStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING', 'DONE');
CREATE TYPE "StudentFollowUpActionType" AS ENUM ('SUPERVISION_NOTE', 'PARENT_CONTACT', 'TEACHER_CONTACT', 'CLASS_VISIT', 'TEACHER_VISIT', 'GENERAL_ACTION');

ALTER TABLE "User" ADD COLUMN "canAccessSupervision" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User"
SET "canAccessSupervision" = true
WHERE "role" = 'ADMIN' AND "studyMode" = 'REMOTE' AND "isActive" = true;

CREATE TABLE "SupervisionTask" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "createdById" TEXT,
    "source" "SupervisionTaskSource" NOT NULL DEFAULT 'AUTOMATIC',
    "category" "SupervisionTaskCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "SupervisionTaskStatus" NOT NULL DEFAULT 'NEW',
    "triggerKey" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    CONSTRAINT "SupervisionTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentFollowUpAction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "supervisionTaskId" TEXT,
    "actorId" TEXT,
    "actionType" "StudentFollowUpActionType" NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "contactedParent" BOOLEAN NOT NULL DEFAULT false,
    "contactedTeacher" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentFollowUpAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupervisionTask_status_source_createdAt_idx" ON "SupervisionTask"("status", "source", "createdAt");
CREATE INDEX "SupervisionTask_studentId_status_idx" ON "SupervisionTask"("studentId", "status");
CREATE UNIQUE INDEX "SupervisionTask_triggerKey_key" ON "SupervisionTask"("triggerKey");
CREATE INDEX "StudentFollowUpAction_studentId_createdAt_idx" ON "StudentFollowUpAction"("studentId", "createdAt");
CREATE INDEX "StudentFollowUpAction_supervisionTaskId_idx" ON "StudentFollowUpAction"("supervisionTaskId");

ALTER TABLE "SupervisionTask" ADD CONSTRAINT "SupervisionTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupervisionTask" ADD CONSTRAINT "SupervisionTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentFollowUpAction" ADD CONSTRAINT "StudentFollowUpAction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentFollowUpAction" ADD CONSTRAINT "StudentFollowUpAction_supervisionTaskId_fkey" FOREIGN KEY ("supervisionTaskId") REFERENCES "SupervisionTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentFollowUpAction" ADD CONSTRAINT "StudentFollowUpAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
