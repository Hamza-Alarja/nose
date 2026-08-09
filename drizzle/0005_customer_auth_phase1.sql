ALTER TABLE `users`
  ADD COLUMN `password_hash` varchar(255) NULL,
  ADD COLUMN `first_name` varchar(120) NULL,
  ADD COLUMN `last_name` varchar(120) NULL,
  ADD COLUMN `phone` varchar(32) NULL,
  ADD COLUMN `is_active` boolean NOT NULL DEFAULT true,
  ADD COLUMN `last_login_at` timestamp NULL;
