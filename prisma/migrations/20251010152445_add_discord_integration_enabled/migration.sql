-- Add discordIntegrationEnabled column to user table
-- This field tracks if the user wants Discord bot integration (notifications + commands)
-- Separate from Discord OAuth login (account table)

ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "discordIntegrationEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Comment:
-- true = User wants Discord bot integration (receive notifications, use bot commands)
-- false = User explicitly unlinked Discord integration (no notifications)
-- Note: This is independent of Discord OAuth login (account table with providerId='discord')
