CREATE TYPE "SupervisionStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PLACED', 'ON_HOLD');

ALTER TABLE "RegistrationRequest"
ADD COLUMN "forwardedToSupervisionAt" TIMESTAMP(3),
ADD COLUMN "supervisionNote" TEXT,
ADD COLUMN "supervisionStatus" "SupervisionStatus" NOT NULL DEFAULT 'PENDING';

WITH ordered_remote AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS seq
  FROM "Student"
  WHERE "studyMode" = 'REMOTE'
),
ordered_onsite AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS seq
  FROM "Student"
  WHERE "studyMode" = 'ONSITE'
)
UPDATE "Student" AS s
SET "studentCode" = (1000 + r.seq)::text
FROM ordered_remote r
WHERE s."id" = r."id";

WITH ordered_onsite AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS seq
  FROM "Student"
  WHERE "studyMode" = 'ONSITE'
)
UPDATE "Student" AS s
SET "studentCode" = (5000 + o.seq)::text
FROM ordered_onsite o
WHERE s."id" = o."id";
