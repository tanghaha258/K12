/*
  Warnings:

  - Added the required column `updatedAt` to the `moral_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `moral_rules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `moral_events` ADD COLUMN `cancelReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledBy` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `moral_rules` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `moral_events_category_idx` ON `moral_events`(`category`);

-- CreateIndex
CREATE INDEX `moral_events_status_idx` ON `moral_events`(`status`);

-- CreateIndex
CREATE INDEX `moral_events_ruleId_idx` ON `moral_events`(`ruleId`);

-- CreateIndex
CREATE INDEX `moral_rules_category_idx` ON `moral_rules`(`category`);

-- CreateIndex
CREATE INDEX `moral_rules_gradeId_idx` ON `moral_rules`(`gradeId`);

-- CreateIndex
CREATE INDEX `moral_rules_isActive_idx` ON `moral_rules`(`isActive`);

-- AddForeignKey
ALTER TABLE `moral_events` ADD CONSTRAINT `moral_events_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `moral_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moral_rules` ADD CONSTRAINT `moral_rules_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `grades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
