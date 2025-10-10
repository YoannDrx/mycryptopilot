import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { logger } from "../logger";
import { DISCORD_CONFIG } from "./config";
import { registerCommands } from "./commands/register-commands";

/**
 * Discord Bot Client (Singleton)
 *
 * Gère la connexion au bot Discord et l'enregistrement des commandes
 */
class DiscordBot {
  private static instance: DiscordBot | null = null;
  private client: Client | null = null;
  private isInitialized = false;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Récupérer l'instance unique du bot
   */
  static getInstance(): DiscordBot {
    DiscordBot.instance ??= new DiscordBot();
    return DiscordBot.instance;
  }

  /**
   * Vérifier si le bot est activé
   */
  isEnabled(): boolean {
    return DISCORD_CONFIG.isEnabled();
  }

  /**
   * Initialiser le bot Discord
   */
  async initialize(): Promise<Client | null> {
    // Si déjà initialisé, retourner le client existant
    if (this.isInitialized && this.client) {
      return this.client;
    }

    // Si le bot n'est pas activé, ne rien faire
    if (!this.isEnabled()) {
      logger.info("Discord bot is disabled. Skipping initialization.");
      return null;
    }

    try {
      // Créer le client Discord avec les intents nécessaires
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
        ],
      });

      // Événement: Bot prêt
      this.client.once("clientReady", (client) => {
        logger.info(`Discord bot logged in as ${client.user.tag}`);
      });

      // Événement: Interaction (commandes slash)
      this.client.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        // Importer dynamiquement les commandes
        const { handleCommand } = await import("./commands/handler");
        await handleCommand(interaction);
      });

      // Événement: Erreur
      this.client.on("error", (error) => {
        logger.error("Discord bot error:", error);
      });

      // Connexion au bot
      // Read directly from process.env to get live values (important for standalone script)
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) {
        throw new Error("DISCORD_BOT_TOKEN not found in environment");
      }
      await this.client.login(token);

      // Enregistrer les commandes slash
      await this.registerSlashCommands();

      this.isInitialized = true;

      logger.info("Discord bot initialized successfully");

      return this.client;
    } catch (error) {
      logger.error("Failed to initialize Discord bot:", error);
      return null;
    }
  }

  /**
   * Récupérer le client Discord
   */
  getClient(): Client | null {
    return this.client;
  }

  /**
   * Arrêter le bot
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isInitialized = false;
      logger.info("Discord bot shut down successfully");
    }
  }

  /**
   * Enregistrer les commandes slash sur Discord
   */
  private async registerSlashCommands(): Promise<void> {
    // Read directly from process.env to get live values (important for standalone script)
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!token || !guildId) {
      logger.warn(
        "Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID. Skipping command registration.",
      );
      return;
    }

    try {
      const rest = new REST({ version: "10" }).setToken(token);

      const commands = registerCommands();

      logger.info(`Registering ${commands.length} slash commands...`);

      // Enregistrer les commandes pour la guilde (développement)
      // En production, utiliser Routes.applicationCommands(clientId) pour global
      await rest.put(
        Routes.applicationGuildCommands(this.client?.user?.id ?? "", guildId),
        { body: commands },
      );

      logger.info("Discord slash commands registered successfully");
    } catch (error) {
      logger.error("Failed to register slash commands:", error);
    }
  }
}

// Exporter l'instance unique
export const discordBot = DiscordBot.getInstance();
