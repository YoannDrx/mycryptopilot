-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ReviewPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "text" TEXT,
    "videoId" TEXT,
    "videoUrl" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorImage" TEXT,
    "pageId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnReviews" (
    "reviewId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagsOnReviews_pkey" PRIMARY KEY ("reviewId","tagId")
);

-- CreateTable
CREATE TABLE "ReviewPageAnalytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "pageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewPageAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPage_slug_key" ON "ReviewPage"("slug");

-- CreateIndex
CREATE INDEX "ReviewPage_organizationId_idx" ON "ReviewPage"("organizationId");

-- CreateIndex
CREATE INDEX "ReviewPage_slug_idx" ON "ReviewPage"("slug");

-- CreateIndex
CREATE INDEX "Review_organizationId_idx" ON "Review"("organizationId");

-- CreateIndex
CREATE INDEX "Review_pageId_idx" ON "Review"("pageId");

-- CreateIndex
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_organizationId_label_key" ON "Tag"("organizationId", "label");

-- CreateIndex
CREATE INDEX "TagsOnReviews_reviewId_idx" ON "TagsOnReviews"("reviewId");

-- CreateIndex
CREATE INDEX "TagsOnReviews_tagId_idx" ON "TagsOnReviews"("tagId");

-- CreateIndex
CREATE INDEX "ReviewPageAnalytics_pageId_idx" ON "ReviewPageAnalytics"("pageId");

-- CreateIndex
CREATE INDEX "ReviewPageAnalytics_date_idx" ON "ReviewPageAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPageAnalytics_pageId_date_key" ON "ReviewPageAnalytics"("pageId", "date");

-- AddForeignKey
ALTER TABLE "ReviewPage" ADD CONSTRAINT "ReviewPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ReviewPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnReviews" ADD CONSTRAINT "TagsOnReviews_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnReviews" ADD CONSTRAINT "TagsOnReviews_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPageAnalytics" ADD CONSTRAINT "ReviewPageAnalytics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ReviewPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
