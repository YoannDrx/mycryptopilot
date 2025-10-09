import type { Guild } from "discord.js";
import { discordBot } from "./bot-client";
import { DISCORD_CONFIG } from "./config";
import { logger } from "../logger";
import type { MyCryptoPilotPlanName } from "../crypto/mycryptopilot-plans";

/**
 * Configuration de la hiérarchie des rôles Discord
 *
 * Chaque rôle supérieur hérite des permissions du rôle inférieur
 * Hierarchy: Ultra > Pro > Free
 */
const ROLE_HIERARCHY = {
  FREE: 0,
  PRO: 1,
  ULTRA: 2,
} as const;

/**
 * Permissions par défaut pour chaque rôle
 * Les rôles supérieurs héritent des permissions inférieures
 */
const ROLE_PERMISSIONS = {
  FREE: {
    ViewChannel: true, // Voir les channels publics
    SendMessages: true, // Envoyer des messages
    ReadMessageHistory: true, // Lire l'historique
  },
  PRO: {
    // Hérite de FREE + permissions supplémentaires
    UseExternalEmojis: true,
    AttachFiles: true,
    EmbedLinks: true,
    AddReactions: true,
  },
  ULTRA: {
    // Hérite de PRO + FREE + permissions supplémentaires
    MentionEveryone: false, // Peut mentionner @everyone (désactivé par défaut pour éviter spam)
    ManageMessages: false, // Peut gérer ses propres messages
    CreatePrivateThreads: true, // Peut créer des threads privés
  },
} as const;

/**
 * Récupérer ou créer les rôles Discord pour les plans MyCryptoPilot
 * Avec configuration de la hiérarchie et permissions
 */
export async function ensureRolesExist(guild: Guild): Promise<void> {
  logger.info("Ensuring Discord roles exist with hierarchy...");

  // Créer les rôles dans l'ordre de hiérarchie (du plus bas au plus haut)
  const rolesInOrder: Array<keyof typeof DISCORD_CONFIG.roles> = [
    "FREE",
    "PRO",
    "ULTRA",
  ];

  for (const planKey of rolesInOrder) {
    const roleName = DISCORD_CONFIG.roles[planKey];
    const existingRole = guild.roles.cache.find((r) => r.name === roleName);

    if (!existingRole) {
      logger.info(`Creating role: ${roleName}`);

      // Calculer la position du rôle (plus élevé = plus de pouvoir)
      const position = ROLE_HIERARCHY[planKey];

      await guild.roles.create({
        name: roleName,
        color: DISCORD_CONFIG.roleColors[planKey],
        reason: "MyCryptoPilot subscription role with hierarchy",
        position: position + 1, // +1 pour éviter conflits avec @everyone
        hoist: true, // Afficher séparément dans la liste des membres
        mentionable: false, // Pas mentionnable par défaut (éviter spam)
      });

      logger.info(`✅ Role created: ${roleName} (hierarchy level: ${position})`);
    } else {
      // Mettre à jour la position si nécessaire
      const expectedPosition = ROLE_HIERARCHY[planKey] + 1;
      if (existingRole.position !== expectedPosition) {
        await existingRole.setPosition(expectedPosition);
        logger.info(`Updated position for role: ${roleName}`);
      }

      logger.info(`✅ Role already exists: ${roleName}`);
    }
  }

  logger.info("✅ Role hierarchy configured successfully");
}

/**
 * Assigner un rôle Discord à un utilisateur selon son plan
 *
 * @param discordUserId - Discord User ID
 * @param planName - Plan MyCryptoPilot ("free", "pro", "ultra")
 * @returns true si le rôle a été assigné avec succès
 */
export async function assignRoleToUser(
  discordUserId: string,
  planName: MyCryptoPilotPlanName,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.error("Discord bot not initialized");
    return false;
  }

  try {
    // Récupérer la guilde (serveur Discord)
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return false;
    }

    // S'assurer que les rôles existent
    await ensureRolesExist(guild);

    // Récupérer le membre Discord
    const member = await guild.members.fetch(discordUserId);

    if (!member) {
      logger.error(`Discord member not found: ${discordUserId}`);
      return false;
    }

    // Mapper le plan vers le nom du rôle
    const planKeyMap: Record<MyCryptoPilotPlanName, keyof typeof DISCORD_CONFIG.roles> = {
      free: "FREE",
      pro: "PRO",
      ultra: "ULTRA",
    };

    const roleKey = planKeyMap[planName];
    const roleName = DISCORD_CONFIG.roles[roleKey];

    // Trouver le rôle Discord
    const role = guild.roles.cache.find((r) => r.name === roleName);

    if (!role) {
      logger.error(`Role not found: ${roleName}`);
      return false;
    }

    // Retirer tous les autres rôles MyCryptoPilot
    const allMyCryptoPilotRoles = Object.values(DISCORD_CONFIG.roles);
    for (const otherRoleName of allMyCryptoPilotRoles) {
      const otherRole = guild.roles.cache.find((r) => r.name === otherRoleName);
      if (otherRole && member.roles.cache.has(otherRole.id)) {
        await member.roles.remove(otherRole);
        logger.info(`Removed role ${otherRoleName} from ${member.user.tag}`);
      }
    }

    // Assigner le nouveau rôle
    await member.roles.add(role);
    logger.info(`✅ Assigned role ${roleName} to ${member.user.tag}`);

    return true;
  } catch (error) {
    logger.error(`Error assigning role to ${discordUserId}:`, error);
    return false;
  }
}

/**
 * Retirer tous les rôles MyCryptoPilot d'un utilisateur
 *
 * @param discordUserId - Discord User ID
 * @returns true si les rôles ont été retirés avec succès
 */
export async function removeAllRolesFromUser(
  discordUserId: string,
): Promise<boolean> {
  const client = discordBot.getClient();

  if (!client) {
    logger.error("Discord bot not initialized");
    return false;
  }

  try {
    const guild = client.guilds.cache.first();

    if (!guild) {
      logger.error("No guild found for Discord bot");
      return false;
    }

    const member = await guild.members.fetch(discordUserId);

    if (!member) {
      logger.error(`Discord member not found: ${discordUserId}`);
      return false;
    }

    // Retirer tous les rôles MyCryptoPilot
    const allMyCryptoPilotRoles = Object.values(DISCORD_CONFIG.roles);
    for (const roleName of allMyCryptoPilotRoles) {
      const role = guild.roles.cache.find((r) => r.name === roleName);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        logger.info(`Removed role ${roleName} from ${member.user.tag}`);
      }
    }

    logger.info(`✅ Removed all MyCryptoPilot roles from ${member.user.tag}`);

    return true;
  } catch (error) {
    logger.error(`Error removing roles from ${discordUserId}:`, error);
    return false;
  }
}
