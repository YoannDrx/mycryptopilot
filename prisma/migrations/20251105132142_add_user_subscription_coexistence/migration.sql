-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "payment_method" TEXT,
    "migrated_from_org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legacy_org_slugs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legacy_org_slugs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_key" ON "public"."user_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_org_slugs_org_id_key" ON "public"."legacy_org_slugs"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "legacy_org_slugs_slug_key" ON "public"."legacy_org_slugs"("slug");

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."legacy_org_slugs" ADD CONSTRAINT "legacy_org_slugs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
