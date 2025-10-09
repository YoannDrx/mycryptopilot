import { z } from "zod";

/**
 * Schema pour lier un Discord ID à un utilisateur
 */
export const LinkDiscordSchema = z.object({
  discordId: z.string().min(1, "Discord ID is required"),
});

/**
 * Schema pour délier un Discord ID d'un utilisateur
 */
export const UnlinkDiscordSchema = z.object({});
