CREATE TABLE IF NOT EXISTS "Circle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studyMode" "StudyMode" NOT NULL,
    "zoomUrl" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "circleId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Circle_teacherId_fkey'
  ) THEN
    ALTER TABLE "Circle"
      ADD CONSTRAINT "Circle_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Student_circleId_fkey'
  ) THEN
    ALTER TABLE "Student"
      ADD CONSTRAINT "Student_circleId_fkey"
      FOREIGN KEY ("circleId") REFERENCES "Circle"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
