ALTER TABLE `users`
  ADD COLUMN `employment_status` VARCHAR(100) NULL AFTER `status`;

ALTER TABLE `users`
  ADD COLUMN `birth_place` VARCHAR(100) NULL AFTER `employment_status`;

ALTER TABLE `users`
  ADD COLUMN `birth_date` DATE NULL AFTER `birth_place`;

ALTER TABLE `users`
  ADD COLUMN `bank_account_number` VARCHAR(50) NULL AFTER `birth_date`;

ALTER TABLE `users`
  ADD COLUMN `nik` VARCHAR(30) NULL AFTER `bank_account_number`;
