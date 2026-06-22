-- AlterTable
ALTER TABLE "Report" ADD COLUMN "quranMarks" JSONB;

-- AlterTable
ALTER TABLE "TeacherAttendance" ADD COLUMN "checkIn" TIMESTAMP(3);
ALTER TABLE "TeacherAttendance" ADD COLUMN "checkOut" TIMESTAMP(3);
ALTER TABLE "TeacherAttendance" ADD COLUMN "duration" INTEGER;
