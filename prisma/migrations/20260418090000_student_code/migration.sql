ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "studentCode" TEXT;

WITH numbered_students AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY "createdAt", id) + 1000 AS generated_number
  FROM "Student"
  WHERE "studentCode" IS NULL
)
UPDATE "Student" AS student
SET "studentCode" = 'ST-' || numbered_students.generated_number
FROM numbered_students
WHERE student.id = numbered_students.id;

CREATE UNIQUE INDEX IF NOT EXISTS "Student_studentCode_key" ON "Student"("studentCode");
