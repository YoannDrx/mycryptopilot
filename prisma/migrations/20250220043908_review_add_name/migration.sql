/*
  Warnings:

  - Added the required column `name` to the `ReviewPage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReviewPage" ADD COLUMN     "name" TEXT NOT NULL;
