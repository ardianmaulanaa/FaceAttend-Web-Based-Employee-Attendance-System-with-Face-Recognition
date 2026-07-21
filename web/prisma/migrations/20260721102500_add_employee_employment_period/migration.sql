ALTER TABLE `users`
  ADD COLUMN `employment_start_date` DATE NULL AFTER `employment_status`;

ALTER TABLE `users`
  ADD COLUMN `employment_end_date` DATE NULL AFTER `employment_start_date`;
