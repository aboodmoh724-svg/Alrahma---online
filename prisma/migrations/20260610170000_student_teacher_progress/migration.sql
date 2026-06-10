CREATE TABLE "StudentTeacherProgress" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "circleId" TEXT,
  "startSurah" TEXT NOT NULL,
  "startAyah" INTEGER,
  "startPage" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StudentTeacherProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentTeacherProgress_studentId_teacherId_key"
  ON "StudentTeacherProgress"("studentId", "teacherId");

CREATE INDEX "StudentTeacherProgress_teacherId_updatedAt_idx"
  ON "StudentTeacherProgress"("teacherId", "updatedAt");

CREATE INDEX "StudentTeacherProgress_circleId_idx"
  ON "StudentTeacherProgress"("circleId");

ALTER TABLE "StudentTeacherProgress"
  ADD CONSTRAINT "StudentTeacherProgress_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentTeacherProgress"
  ADD CONSTRAINT "StudentTeacherProgress_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentTeacherProgress"
  ADD CONSTRAINT "StudentTeacherProgress_circleId_fkey"
  FOREIGN KEY ("circleId") REFERENCES "Circle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
