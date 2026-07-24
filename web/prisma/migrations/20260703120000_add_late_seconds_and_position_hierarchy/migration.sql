-- Add detail keterlambatan pada attendance
ALTER TABLE `Attendance`
  ADD COLUMN `late_seconds` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `is_late` BOOLEAN NOT NULL DEFAULT false;

-- Relasi bertingkat jabatan -> divisi
ALTER TABLE `Position`
  ADD COLUMN `department_id` CHAR(36) NULL;

ALTER TABLE `Position`
  ADD CONSTRAINT `Position_department_id_fkey`
  FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX `Position_name_key` ON `Position`;
CREATE UNIQUE INDEX `Position_name_department_id_key`
  ON `Position`(`name`, `department_id`);
