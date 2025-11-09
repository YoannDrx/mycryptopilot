/**
 * Script de rollback Organizations → UserSubscription
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 * RFC: .claude/docs/DEVELOPMENT.md (RFC-001)
 *
 * Ce script annule la migration en supprimant les données UserSubscription/LegacyOrgSlug
 * créées par migrate-org-to-user.ts de manière idempotente.
 *
 * Usage:
 *   # Dry-run (ne modifie rien)
 *   pnpm rollback:migration --dry-run
 *
 *   # Rollback réel
 *   pnpm rollback:migration
 *
 *   # Avec force (skip confirmations)
 *   pnpm rollback:migration --force
 */

/* eslint-disable no-console */

import { prisma } from "@/lib/prisma";
import chalk from "chalk";
import readline from "readline";

// ============================================================================
// TYPES
// ============================================================================

type RollbackStats = {
  totalUserSubs: number;
  totalLegacySlugs: number;
  userSubsDeleted: number;
  slugsDeleted: number;
  usersReverted: number;
  errors: { id: string; error: string }[];
};

type RollbackOptions = {
  dryRun: boolean;
  force: boolean;
};

// ============================================================================
// HELPERS
// ============================================================================

function parseArgs(): RollbackOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
  };
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

// ============================================================================
// ROLLBACK LOGIC
// ============================================================================

async function rollbackMigration(options: RollbackOptions): Promise<void> {
  console.log(chalk.bold("\n🔄 Rollback Migration UserSubscription\n"));
  console.log(chalk.gray(`   Issue #77 - feature/remove-organizations`));
  console.log(
    chalk.gray(
      `   Mode: ${options.dryRun ? "DRY-RUN (aucune modification)" : "ROLLBACK RÉEL"}\n`,
    ),
  );

  // ============================================
  // Step 0: Confirmation (si pas --force)
  // ============================================
  if (!options.dryRun && !options.force) {
    console.log(
      chalk.yellow(
        "⚠️  ATTENTION : Cette opération va supprimer les données migrées.\\n",
      ),
    );
    console.log(chalk.gray("Actions qui seront effectuées :"));
    console.log(chalk.gray("  1. Suppression UserSubscription migrées"));
    console.log(chalk.gray("  2. Suppression LegacyOrgSlug"));
    console.log(
      chalk.gray("  3. Reset User.planName/planExpiresAt (vers NULL)\\n"),
    );

    const confirmed = await askConfirmation(
      chalk.yellow("Continuer ? (y/N): "),
    );

    if (!confirmed) {
      console.log(chalk.red("\n❌ Rollback annulé par l'utilisateur.\n"));
      process.exit(0);
    }

    console.log();
  }

  const stats: RollbackStats = {
    totalUserSubs: 0,
    totalLegacySlugs: 0,
    userSubsDeleted: 0,
    slugsDeleted: 0,
    usersReverted: 0,
    errors: [],
  };

  // ============================================
  // Step 1: Audit pré-rollback
  // ============================================
  console.log(chalk.bold("📊 Step 1/4: Audit pré-rollback\n"));

  stats.totalUserSubs = await prisma.userSubscription.count({
    where: { migratedFromOrgId: { not: null } },
  });
  stats.totalLegacySlugs = await prisma.legacyOrgSlug.count();

  console.log(
    `   UserSubscription migrées : ${stats.totalUserSubs} (avec migratedFromOrgId)`,
  );
  console.log(`   LegacyOrgSlugs          : ${stats.totalLegacySlugs}\n`);

  if (stats.totalUserSubs === 0 && stats.totalLegacySlugs === 0) {
    console.log(
      chalk.yellow(
        "⚠️  Aucune donnée migrée trouvée. Rollback non nécessaire.\n",
      ),
    );
    return;
  }

  // ============================================
  // Step 2: Supprimer UserSubscriptions
  // ============================================
  console.log(chalk.bold("🔄 Step 2/4: Suppression UserSubscriptions\n"));

  const userSubs = await prisma.userSubscription.findMany({
    where: { migratedFromOrgId: { not: null } },
  });

  for (const userSub of userSubs) {
    try {
      if (!options.dryRun) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
        await prisma.userSubscription.delete({
          where: { id: userSub.id },
        });

        // Reset User.planName/planExpiresAt
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
        await prisma.user.update({
          where: { id: userSub.userId },
          data: {
            planName: null,
            planExpiresAt: null,
          },
        });
      }

      stats.userSubsDeleted++;
      stats.usersReverted++;
      console.log(
        chalk.green(
          `   ✅ UserSubscription ${userSub.id}: Deleted (user: ${userSub.userId})`,
        ),
      );
    } catch (error) {
      stats.errors.push({
        id: userSub.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log(
        chalk.red(
          `   ❌ UserSubscription ${userSub.id}: ${error instanceof Error ? error.message : "Error"}`,
        ),
      );
    }
  }

  console.log();

  // ============================================
  // Step 3: Supprimer LegacyOrgSlugs
  // ============================================
  console.log(chalk.bold("🔄 Step 3/4: Suppression LegacyOrgSlugs\n"));

  const legacySlugs = await prisma.legacyOrgSlug.findMany();

  for (const slug of legacySlugs) {
    try {
      if (!options.dryRun) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
        await prisma.legacyOrgSlug.delete({
          where: { id: slug.id },
        });
      }

      stats.slugsDeleted++;
      console.log(chalk.green(`   ✅ LegacyOrgSlug "${slug.slug}": Deleted`));
    } catch (error) {
      stats.errors.push({
        id: slug.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log(
        chalk.red(
          `   ❌ LegacyOrgSlug "${slug.slug}": ${error instanceof Error ? error.message : "Error"}`,
        ),
      );
    }
  }

  console.log();

  // ============================================
  // Step 4: Integrity checks
  // ============================================
  console.log(chalk.bold("🔍 Step 4/4: Integrity checks\n"));

  if (!options.dryRun) {
    const remainingUserSubs = await prisma.userSubscription.count({
      where: { migratedFromOrgId: { not: null } },
    });
    const remainingSlugs = await prisma.legacyOrgSlug.count();

    console.log(
      `   UserSubscriptions restantes (migrées) : ${remainingUserSubs}`,
    );
    console.log(
      `   LegacyOrgSlugs restants              : ${remainingSlugs}\n`,
    );

    if (remainingUserSubs > 0 || remainingSlugs > 0) {
      console.log(
        chalk.yellow(
          `⚠️  ${remainingUserSubs + remainingSlugs} enregistrements non supprimés (voir erreurs).`,
        ),
      );
    } else {
      console.log(chalk.green("✅ Toutes les données migrées supprimées."));
    }
  } else {
    console.log(chalk.gray("   (Skipped en mode dry-run)\n"));
  }

  // ============================================
  // Résumé final
  // ============================================
  console.log(chalk.bold("━".repeat(60)));
  console.log(chalk.bold("\n📊 Résumé Rollback\n"));

  console.log(
    `   UserSubscriptions scannées : ${stats.totalUserSubs} (migrées)`,
  );
  console.log(
    chalk.green(
      `   ✅ UserSubscriptions supprimées : ${stats.userSubsDeleted}`,
    ),
  );
  console.log(
    chalk.green(`   ✅ LegacyOrgSlugs supprimés     : ${stats.slugsDeleted}`),
  );
  console.log(
    chalk.green(
      `   ✅ Users revertés (planName NULL) : ${stats.usersReverted}`,
    ),
  );
  console.log(
    chalk.red(`   ❌ Erreurs                       : ${stats.errors.length}\n`),
  );

  if (stats.errors.length > 0) {
    console.log(chalk.bold("⚠️  Erreurs détaillées :\n"));
    for (const error of stats.errors) {
      console.log(chalk.red(`   - ID ${error.id}: ${error.error}`));
    }
    console.log();
  }

  if (options.dryRun) {
    console.log(
      chalk.yellow.bold("🔍 DRY-RUN MODE : Aucune modification effectuée.\n"),
    );
    console.log(chalk.gray("Pour exécuter le rollback réel :"));
    console.log(chalk.gray("   pnpm rollback:migration\n"));
  } else {
    console.log(chalk.green.bold("✅ ROLLBACK RÉUSSI !\n"));
    console.log(chalk.gray("État actuel :"));
    console.log(
      chalk.gray(
        "   - UserSubscription migrées supprimées (Organization.Subscription reste intacte)",
      ),
    );
    console.log(chalk.gray("   - LegacyOrgSlugs supprimés"));
    console.log(
      chalk.gray("   - Users revertés (planName/planExpiresAt = NULL)\n"),
    );
    console.log(
      chalk.yellow(
        "⚠️  Note: Les Organization.Subscription legacy restent intactes (pas modifiées par rollback).\n",
      ),
    );
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const options = parseArgs();

void rollbackMigration(options)
  .catch((error) => {
    console.error(chalk.red("\n❌ Erreur fatale rollback:\n"), error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
