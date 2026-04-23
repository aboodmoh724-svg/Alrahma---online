DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'TrackResourceScope'
  ) THEN
    CREATE TYPE "TrackResourceScope" AS ENUM ('TEACHER', 'REGISTRATION');
  END IF;
END $$;

ALTER TABLE "TrackResource"
ADD COLUMN IF NOT EXISTS "resourceScope" "TrackResourceScope" NOT NULL DEFAULT 'TEACHER';

UPDATE "TrackResource"
SET "resourceScope" = 'REGISTRATION'
WHERE "id" = 'track-resource-students-parents-guidelines'
   OR "fileName" = 'students-parents-guidelines.pdf'
   OR "title" = 'التعليمات والتوجيهات الخاصة بالطلاب وأولياء الأمور';
