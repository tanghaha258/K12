/*
  Warnings:

  - You are about to drop the column `isStat` on the `exam_subjects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `exam_subjects` DROP COLUMN `isStat`,
    ADD COLUMN `excellentLine` DOUBLE NULL,
    ADD COLUMN `includeInRank` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `includeInTotal` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lowLine` DOUBLE NULL,
    ADD COLUMN `passLine` DOUBLE NULL;

-- AlterTable
ALTER TABLE `exams` ADD COLUMN `endTime` DATETIME(3) NULL,
    ADD COLUMN `startTime` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `subject_grades` ADD COLUMN `maxScore` DOUBLE NULL;

-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `maxScore` DOUBLE NOT NULL DEFAULT 100;
