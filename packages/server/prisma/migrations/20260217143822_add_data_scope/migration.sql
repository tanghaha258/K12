/*
  Warnings:

  - You are about to drop the column `targetId` on the `data_scopes` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `data_scopes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,scopeType,scopeId]` on the table `data_scopes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scopeId` to the `data_scopes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scopeType` to the `data_scopes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `data_scopes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `data_scopes_userId_type_targetId_key` ON `data_scopes`;

-- AlterTable
ALTER TABLE `data_scopes` DROP COLUMN `targetId`,
    DROP COLUMN `type`,
    ADD COLUMN `scopeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `scopeType` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `data_scopes_userId_idx` ON `data_scopes`(`userId`);

-- CreateIndex
CREATE INDEX `data_scopes_scopeType_idx` ON `data_scopes`(`scopeType`);

-- CreateIndex
CREATE UNIQUE INDEX `data_scopes_userId_scopeType_scopeId_key` ON `data_scopes`(`userId`, `scopeType`, `scopeId`);

-- AddForeignKey
ALTER TABLE `data_scopes` ADD CONSTRAINT `data_scopes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
