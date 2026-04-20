-- T343 — per-user notifications preference (Profile "Thông báo đẩy" toggle)
ALTER TABLE "users" ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
