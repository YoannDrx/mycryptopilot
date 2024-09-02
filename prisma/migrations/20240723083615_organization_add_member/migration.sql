/*
  Warnings:

  - Added the required column `email` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationMembershipRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "role" "OrganizationMembershipRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "email" TEXT NOT NULL;
