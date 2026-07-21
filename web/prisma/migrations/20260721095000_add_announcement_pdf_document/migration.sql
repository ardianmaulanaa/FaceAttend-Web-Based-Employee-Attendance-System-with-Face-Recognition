-- AlterTable
ALTER TABLE `Announcement`
    ADD COLUMN `document_url` TEXT NULL,
    ADD COLUMN `document_public_id` VARCHAR(255) NULL,
    ADD COLUMN `document_name` VARCHAR(255) NULL,
    ADD COLUMN `document_mime` VARCHAR(100) NULL,
    ADD COLUMN `document_size` INTEGER NULL;
