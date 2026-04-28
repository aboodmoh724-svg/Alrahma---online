# Alrahma Reports Operations

الرابط الرسمي:

- `https://alrahmakuran.site`

أوامر مهمة على السيرفر:

- فحص شامل:
  - `/root/alrahma-healthcheck.sh`
- استرجاع آخر نسخة احتياطية:
  - `/root/alrahma-restore-latest.sh`
- نسخ احتياطي يدوي:
  - `/root/backup-alrahma.sh`
- إعادة تشغيل التطبيق:
  - `pm2 restart alrahma-reports-app --update-env`
- إعادة تشغيل واتساب الأونلاين:
  - `pm2 restart alrahma-whatsapp`
- إعادة تشغيل واتساب الحضوري:
  - `pm2 restart alrahma-whatsapp-onsite`
- عرض الخدمات:
  - `pm2 list`
- متابعة سجل التطبيق:
  - `pm2 logs alrahma-reports-app --lines 100`

مسارات مهمة:

- التطبيق:
  - `/root/alrahma-reports-app`
- الملفات المرفوعة:
  - `/root/alrahma-reports-app/uploads`
- النسخ الاحتياطية:
  - `/root/backups/alrahma-reports`
- سجل النسخ الاحتياطي:
  - `/root/backups/alrahma-reports/backup.log`

جدولة النسخ الاحتياطية:

- يوميًا الساعة `2:30` صباحًا عبر `cron`

خطوات النشر بعد أي تعديل جديد:

1. على الجهاز المحلي:
   - `git push origin main`
2. على السيرفر:
   - `cd /root/alrahma-reports-app && git pull origin main`
   - `cd /root/alrahma-reports-app && npm run build`
   - `pm2 restart alrahma-reports-app --update-env`
3. تحقق سريع:
   - `/root/alrahma-healthcheck.sh`
