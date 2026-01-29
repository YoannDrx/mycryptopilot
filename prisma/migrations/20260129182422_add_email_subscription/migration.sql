-- CreateTable
CREATE TABLE "public"."email_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mobile_app_waitlist',
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_subscriptions_email_key" ON "public"."email_subscriptions"("email");

-- CreateIndex
CREATE INDEX "email_subscriptions_source_idx" ON "public"."email_subscriptions"("source");

-- CreateIndex
CREATE INDEX "email_subscriptions_subscribedAt_idx" ON "public"."email_subscriptions"("subscribedAt");
