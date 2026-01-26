-- CreateTable
CREATE TABLE "public"."auto_copy_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trader_profile_id" TEXT NOT NULL,
    "copy_ratio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "max_amount_per_trade" DECIMAL(20,8),
    "exchange_connection_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "total_copies_made" INTEGER NOT NULL DEFAULT 0,
    "last_copied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_copy_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auto_copy_preferences_user_id_is_enabled_idx" ON "public"."auto_copy_preferences"("user_id", "is_enabled");

-- CreateIndex
CREATE INDEX "auto_copy_preferences_trader_profile_id_is_enabled_idx" ON "public"."auto_copy_preferences"("trader_profile_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "auto_copy_preferences_user_id_trader_profile_id_key" ON "public"."auto_copy_preferences"("user_id", "trader_profile_id");

-- AddForeignKey
ALTER TABLE "public"."auto_copy_preferences" ADD CONSTRAINT "auto_copy_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auto_copy_preferences" ADD CONSTRAINT "auto_copy_preferences_trader_profile_id_fkey" FOREIGN KEY ("trader_profile_id") REFERENCES "public"."trader_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
