import { discordBot } from "@/lib/discord/bot-client";
import { route } from "@/lib/zod-route";

/**
 * POST /api/discord/init
 *
 * Initialise le bot Discord (appelé au démarrage de l'application)
 */
export const POST = route.handler(async () => {
  // Vérifier si le bot est activé
  if (!discordBot.isEnabled()) {
    return {
      success: false,
      message: "Discord bot is disabled",
    };
  }

  try {
    // Initialiser le bot
    const client = await discordBot.initialize();

    if (!client) {
      return {
        success: false,
        message: "Failed to initialize Discord bot",
      };
    }

    return {
      success: true,
      message: "Discord bot initialized successfully",
      botUsername: client.user?.username,
      botId: client.user?.id,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

/**
 * GET /api/discord/init
 *
 * Vérifie l'état du bot Discord
 */
export const GET = route.handler(async () => {
  const client = discordBot.getClient();
  const isEnabled = discordBot.isEnabled();

  return {
    isEnabled,
    isInitialized: !!client,
    isReady: client?.isReady() ?? false,
    botUsername: client?.user?.username ?? null,
    botId: client?.user?.id ?? null,
  };
});
