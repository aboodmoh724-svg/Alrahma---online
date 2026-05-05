ALTER TABLE "TeacherRequest" ADD COLUMN "target" TEXT NOT NULL DEFAULT 'SUPERVISION';
CREATE INDEX "TeacherRequest_teacherId_target_createdAt_idx" ON "TeacherRequest"("teacherId", "target", "createdAt");
