CREATE TABLE "ParentPortalCode" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentPortalCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EducationConversation" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT,
  "parentPhone" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'TEACHER',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EducationConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EducationMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "senderUserId" TEXT,
  "senderPhone" TEXT,
  "body" TEXT,
  "attachmentUrl" TEXT,
  "attachmentName" TEXT,
  "attachmentType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readByParentAt" TIMESTAMP(3),
  "readByTeacherAt" TIMESTAMP(3),
  "readByAdminAt" TIMESTAMP(3),
  CONSTRAINT "EducationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ParentPortalCode_phone_createdAt_idx" ON "ParentPortalCode"("phone", "createdAt");
CREATE INDEX "EducationConversation_studentId_updatedAt_idx" ON "EducationConversation"("studentId", "updatedAt");
CREATE INDEX "EducationConversation_teacherId_updatedAt_idx" ON "EducationConversation"("teacherId", "updatedAt");
CREATE INDEX "EducationConversation_parentPhone_updatedAt_idx" ON "EducationConversation"("parentPhone", "updatedAt");
CREATE UNIQUE INDEX "EducationConversation_studentId_teacherId_type_key" ON "EducationConversation"("studentId", "teacherId", "type");
CREATE INDEX "EducationMessage_conversationId_createdAt_idx" ON "EducationMessage"("conversationId", "createdAt");
CREATE INDEX "EducationMessage_senderUserId_idx" ON "EducationMessage"("senderUserId");

ALTER TABLE "EducationConversation" ADD CONSTRAINT "EducationConversation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EducationConversation" ADD CONSTRAINT "EducationConversation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EducationMessage" ADD CONSTRAINT "EducationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "EducationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EducationMessage" ADD CONSTRAINT "EducationMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
