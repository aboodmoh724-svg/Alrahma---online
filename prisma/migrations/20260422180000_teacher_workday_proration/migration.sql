-- AlterTable
ALTER TABLE "TeacherCompensationRule"
ADD COLUMN "expectedMonthlyWorkDays" DECIMAL(10,2) NOT NULL DEFAULT 20;
