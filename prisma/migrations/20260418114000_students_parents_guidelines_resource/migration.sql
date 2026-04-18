INSERT INTO "TrackResource" ("id", "title", "description", "track", "fileUrl", "fileName", "updatedAt")
VALUES
  ('track-resource-students-parents-guidelines', 'التعليمات والتوجيهات الخاصة بالطلاب وأولياء الأمور', 'ملف عام يوضح التعليمات المهمة للطلاب وأولياء الأمور.', NULL, '/uploads/track-resources/students-parents-guidelines.pdf', 'students-parents-guidelines.pdf', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
