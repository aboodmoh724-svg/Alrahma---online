ALTER TABLE "TrackResource"
ADD COLUMN IF NOT EXISTS "teacherId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackResource_teacherId_fkey'
  ) THEN
    ALTER TABLE "TrackResource"
    ADD CONSTRAINT "TrackResource_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TrackResource_teacherId_idx" ON "TrackResource"("teacherId");
