import {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../logger";
import { DISCORD_CONFIG } from "./config";
import { registerCommands } from "./commands/register-commands";
import { ensureRolesExist } from "./roles";

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
          GatewayIntentBits.MessageContent, // Pour modération + teasers (FIX ChatGPT #3)
        ],
      });

      // Événement: Bot prêt (FIX ChatGPT #1: "clientReady" → "ready")
      this.client.once("ready", (client) => {
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

      // Événement: Bot rejoint/réinvité sur serveur (FIX ChatGPT #4)
      this.client.on("guildCreate", async (guild) => {
        logger.info(`Bot joined guild: ${guild.name} (${guild.id})`);

        // Créer les rôles automatiquement
        await ensureRolesExist(guild);

        // Republier les slash commands automatiquement
        await this.registerSlashCommandsForGuild(guild.id);

        // Vérifier les permissions
        await this.checkBotPermissions();
      });

      // Connexion au bot
      // Read directly from process.env to get live values (important for standalone script)
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) {
        throw new Error("DISCORD_BOT_TOKEN not found in environment");
      }
      await this.client.login(token);

      // Enregistrer les commandes slash (FIX ChatGPT #6)
      const guildId = process.env.DISCORD_GUILD_ID;
      if (guildId) {
        await this.registerSlashCommandsForGuild(guildId);
      }

      // Vérifier les permissions du bot
      await this.checkBotPermissions();

      // Créer les rôles automatiquement (Free Member, Pro Trader, Ultra Trader)
      const guild = this.client.guilds.cache.first();
      if (guild) {
        logger.info("Creating Discord roles automatically...");
        await ensureRolesExist(guild);
        logger.info("✅ Discord roles created successfully");
      } else {
        logger.warn("No guild found, skipping role creation");
      }

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
   * Vérifier que le bot a toutes les permissions requises
   */
  private async checkBotPermissions(): Promise<void> {
    if (!this.client) {
      logger.warn("Client not initialized, skipping permissions check");
      return;
    }

    try {
      const guild = this.client.guilds.cache.first();

      if (!guild) {
        logger.warn("No guild found, skipping permissions check");
        return;
      }

      const botMember = await guild.members.fetchMe();

      // Permissions requises pour le MVP Discord complet
      const requiredPermissions = [
        {
          flag: PermissionFlagsBits.ManageRoles,
          name: "Manage Roles",
          description: "Assigner rôles Free/Pro/Ultra automatiquement",
          critical: true,
        },
        {
          flag: PermissionFlagsBits.ManageChannels,
          name: "Manage Channels",
          description:
            "Créer channels privés pour chaque trader (#trader-{name})",
          critical: true,
        },
        {
          flag: PermissionFlagsBits.CreateInstantInvite,
          name: "Create Instant Invite",
          description:
            "Générer invites Discord automatiques pour nouveaux users",
          critical: true,
        },
        {
          flag: PermissionFlagsBits.SendMessages,
          name: "Send Messages",
          description: "Envoyer signaux dans channels",
          critical: true,
        },
        {
          flag: PermissionFlagsBits.ModerateMembers,
          name: "Moderate Members",
          description: "Timeout/kick users si abus (modération)",
          critical: false,
        },
        {
          flag: PermissionFlagsBits.ViewAuditLog,
          name: "View Audit Log",
          description: "Tracking actions pour monitoring",
          critical: false,
        },
        {
          flag: PermissionFlagsBits.ManageMessages,
          name: "Manage Messages",
          description: "Épingler/supprimer messages importants",
          critical: false,
        },
      ];

      logger.info("🔍 Checking bot permissions...");

      let hasCriticalMissing = false;
      const missingPermissions: string[] = [];

      for (const perm of requiredPermissions) {
        const hasPermission = botMember.permissions.has(perm.flag);

        if (hasPermission) {
          logger.info(`  ✅ ${perm.name} - ${perm.description}`);
        } else if (perm.critical) {
          logger.error(
            `  ❌ MISSING (CRITICAL): ${perm.name} - ${perm.description}`,
          );
          hasCriticalMissing = true;
          missingPermissions.push(perm.name);
        } else {
          logger.warn(
            `  ⚠️ MISSING (optional): ${perm.name} - ${perm.description}`,
          );
          missingPermissions.push(perm.name);
        }
      }

      if (hasCriticalMissing) {
        logger.error(
          "\n❌ CRITICAL PERMISSIONS MISSING!\n" +
            "The bot is missing critical permissions. Some features will NOT work:\n" +
            `Missing: ${missingPermissions.join(", ")}\n\n` +
            "🔧 How to fix:\n" +
            "1. Go to Discord Developer Portal: https://discord.com/developers/applications\n" +
            "2. Select your application\n" +
            "3. Go to 'Bot' tab\n" +
            "4. Enable required permissions under 'Bot Permissions'\n" +
            "5. Go to 'OAuth2' > 'URL Generator'\n" +
            "6. Select scopes: 'bot', 'applications.commands'\n" +
            "7. Select permissions: Manage Roles, Manage Channels, Create Instant Invite, Send Messages\n" +
            "8. Copy the generated URL and re-invite the bot to your server\n" +
            "9. Restart the bot\n",
        );
      } else if (missingPermissions.length > 0) {
        logger.warn(
          `⚠️ Some optional permissions are missing: ${missingPermissions.join(", ")}\n` +
            "The bot will work but some features may be limited.",
        );
      } else {
        logger.info("✅ All permissions verified successfully!");
      }
    } catch (error) {
      logger.error("Error checking bot permissions:", error);
    }
  }

  /**
   * Enregistrer les commandes slash sur Discord pour une guilde spécifique
   * (FIX ChatGPT #2 & #5: Refactor pour accepter guildId + utiliser applicationId)
   */
  private async registerSlashCommandsForGuild(guildId: string): Promise<void> {
    // Read directly from process.env to get live values (important for standalone script)
    const token = process.env.DISCORD_BOT_TOKEN;
    const applicationId =
      this.client?.application?.id ?? process.env.DISCORD_CLIENT_ID;

    if (!token || !applicationId || !guildId) {
      logger.warn(
        "Missing DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID or guildId. Skipping command registration.",
      );
      return;
    }

    try {
      const rest = new REST({ version: "10" }).setToken(token);

      const commands = registerCommands();

      logger.info(
        `Registering ${commands.length} slash commands on guild ${guildId}...`,
      );

      // Enregistrer les commandes pour la guilde (développement)
      // En production, utiliser Routes.applicationCommands(clientId) pour global
      // FIX: Utiliser applicationId au lieu de this.client?.user?.id
      await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
        body: commands,
      });

      logger.info("✅ Discord slash commands registered successfully");
    } catch (error) {
      logger.error("Failed to register slash commands:", error);
    }
  }
}

// Exporter l'instance unique
export const discordBot = DiscordBot.getInstance();
