/*
  Warnings:

  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReviewPage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReviewPageAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TagsOnReviews` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_pageId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewPage" DROP CONSTRAINT "ReviewPage_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewPageAnalytics" DROP CONSTRAINT "ReviewPageAnalytics_pageId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "TagsOnReviews" DROP CONSTRAINT "TagsOnReviews_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "TagsOnReviews" DROP CONSTRAINT "TagsOnReviews_tagId_fkey";

-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "email" TEXT;

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "ReviewPage";

-- DropTable
DROP TABLE "ReviewPageAnalytics";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "TagsOnReviews";

-- DropEnum
DROP TYPE "ReviewStatus";
