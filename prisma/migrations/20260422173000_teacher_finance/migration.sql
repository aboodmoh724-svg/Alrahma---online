-- CreateTable
CREATE TABLE "TeacherCompensationRule" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expectedMonthlyHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherCompensationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherPayout" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherCompensationRule_teacherId_key" ON "TeacherCompensationRule"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherPayout_teacherId_periodMonth_idx" ON "TeacherPayout"("teacherId", "periodMonth");

-- CreateIndex
CREATE INDEX "TeacherPayout_paidAt_idx" ON "TeacherPayout"("paidAt");

-- AddForeignKey
ALTER TABLE "TeacherCompensationRule" ADD CONSTRAINT "TeacherCompensationRule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherPayout" ADD CONSTRAINT "TeacherPayout_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
