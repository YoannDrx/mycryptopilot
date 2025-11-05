/**
 * Script de migration Organizations → UserSubscription
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 * RFC: .claude/docs/DEVELOPMENT.md (RFC-001)
 *
 * Ce script copie les données Organization.Subscription vers UserSubscription
 * de manière idempotente (peut être rejoué sans danger).
 *
 * Usage:
 *   # Dry-run (ne modifie rien)
 *   pnpm migrate:org-to-user --dry-run
 *
 *   # Migration réelle
 *   pnpm migrate:org-to-user
 *
 *   # Avec force (skip confirmations)
 *   pnpm migrate:org-to-user --force
 */

/* eslint-disable no-console */

import { prisma } from "@/lib/prisma";
import chalk from "chalk";
import readline from "readline";

// ============================================================================
// TYPES
// ============================================================================

type MigrationStats = {
  totalOrgs: number;
  totalUsers: number;
  orgsWithSub: number;
  usersMigrated: number;
  usersSkipped: number;
  slugsCreated: number;
  errors: { orgId: string; error: string }[];
};

type MigrationOptions = {
  dryRun: boolean;
  force: boolean;
};

// ============================================================================
// HELPERS
// ============================================================================

function parseArgs(): MigrationOptions {
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
// MIGRATION LOGIC
// ============================================================================

async function migrateOrganizationsToUser(
  options: MigrationOptions,
): Promise<void> {
  console.log(chalk.bold("\n🔄 Migration Organizations → UserSubscription\n"));
  console.log(chalk.gray(`   Issue #77 - feature/remove-organizations`));
  console.log(
    chalk.gray(
      `   Mode: ${options.dryRun ? "DRY-RUN (aucune modification)" : "MIGRATION RÉELLE"}\n`,
    ),
  );

  // ============================================
  // Step 0: Confirmation (si pas --force)
  // ============================================
  if (!options.dryRun && !options.force) {
    console.log(
      chalk.yellow(
        "⚠️  ATTENTION : Cette opération va modifier la base de données.\n",
      ),
    );
    console.log(chalk.gray("Actions qui seront effectuées :"));
    console.log(
      chalk.gray("  1. Copie Organization.Subscription → UserSubscription"),
    );
    console.log(chalk.gray("  2. Copie Organization.slug → LegacyOrgSlug"));
    console.log(chalk.gray("  3. Mise à jour User.planName/planExpiresAt\n"));

    const confirmed = await askConfirmation(
      chalk.yellow("Continuer ? (y/N): "),
    );

    if (!confirmed) {
      console.log(chalk.red("\n❌ Migration annulée par l'utilisateur.\n"));
      process.exit(0);
    }

    console.log();
  }

  const stats: MigrationStats = {
    totalOrgs: 0,
    totalUsers: 0,
    orgsWithSub: 0,
    usersMigrated: 0,
    usersSkipped: 0,
    slugsCreated: 0,
    errors: [],
  };

  // ============================================
  // Step 1: Audit pré-migration
  // ============================================
  console.log(chalk.bold("📊 Step 1/4: Audit pré-migration\n"));

  stats.totalOrgs = await prisma.organization.count();
  stats.totalUsers = await prisma.user.count();
  stats.orgsWithSub = await prisma.organization.count({
    where: {
      subscription: { isNot: null },
    },
  });

  console.log(`   Total Organizations  : ${stats.totalOrgs}`);
  console.log(`   Total Users          : ${stats.totalUsers}`);
  console.log(`   Orgs avec Subscription : ${stats.orgsWithSub}\n`);

  if (stats.totalOrgs === 0) {
    console.log(
      chalk.yellow(
        "⚠️  Aucune organization trouvée. Migration non nécessaire.\n",
      ),
    );
    return;
  }

  // ============================================
  // Step 2: Migrer subscriptions
  // ============================================
  console.log(chalk.bold("🔄 Step 2/4: Migration subscriptions\n"));

  const orgs = await prisma.organization.findMany({
    include: {
      subscription: true,
      members: {
        where: { role: "owner" },
      },
    },
  });

  for (const org of orgs) {
    const owner = org.members[0];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- owner can be undefined if org has no owner member
    if (!owner) {
      stats.errors.push({
        orgId: org.id,
        error: "No owner member found",
      });
      console.log(chalk.red(`   ❌ Org ${org.id}: No owner`));
      continue;
    }

    try {
      // Vérifier si déjà migré
      // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
      const existingSub = await prisma.userSubscription.findUnique({
        where: { userId: owner.userId },
      });

      if (existingSub) {
        stats.usersSkipped++;
        console.log(
          chalk.gray(`   ⏭️  User ${owner.userId}: Already migrated (skip)`),
        );
        continue;
      }

      // Préparer données subscription
      const plan = org.subscription?.plan ?? "free";
      const status = org.subscription?.status ?? "active";
      const periodStart = org.subscription?.periodStart;
      const periodEnd = org.subscription?.periodEnd;
      const paymentMethod = org.subscription ? "stripe_legacy" : null;

      if (!options.dryRun) {
        // Créer UserSubscription
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
        await prisma.userSubscription.create({
          data: {
            userId: owner.userId,
            plan,
            status,
            periodStart,
            periodEnd,
            paymentMethod,
            migratedFromOrgId: org.id, // Audit trail
          },
        });

        // Mettre à jour User.planName/planExpiresAt (pour Discord bot)
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
        await prisma.user.update({
          where: { id: owner.userId },
          data: {
            planName: plan,
            planExpiresAt: periodEnd,
          },
        });
      }

      stats.usersMigrated++;
      console.log(
        chalk.green(`   ✅ User ${owner.userId}: Migrated (plan: ${plan})`),
      );
    } catch (error) {
      stats.errors.push({
        orgId: org.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.log(
        chalk.red(
          `   ❌ Org ${org.id}: ${error instanceof Error ? error.message : "Error"}`,
        ),
      );
    }
  }

  console.log();

  // ============================================
  // Step 3: Créer LegacyOrgSlugs
  // ============================================
  console.log(chalk.bold("🔄 Step 3/4: Backup legacy slugs\n"));

  for (const org of orgs) {
    if (!org.slug) {
      console.log(chalk.gray(`   ⏭️  Org ${org.id}: No slug (skip)`));
      continue;
    }

    const owner = org.members[0];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- owner can be undefined if org has no owner member
    if (!owner) continue;

    try {
      // Vérifier si déjà créé
      // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
      const existingSlug = await prisma.legacyOrgSlug.findUnique({
        where: { orgId: org.id },
      });

      if (existingSlug) {
        console.log(
          chalk.gray(`   ⏭️  Slug "${org.slug}": Already backed up (skip)`),
        );
        continue;
      }

      if (!options.dryRun) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for data consistency
        await prisma.legacyOrgSlug.create({
          data: {
            orgId: org.id,
            slug: org.slug,
            userId: owner.userId,
          },
        });
      }

      stats.slugsCreated++;
      console.log(chalk.green(`   ✅ Slug "${org.slug}": Backed up`));
    } catch (error) {
      console.log(
        chalk.red(
          `   ❌ Slug "${org.slug}": ${error instanceof Error ? error.message : "Error"}`,
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
    const usersWithoutSub = await prisma.user.count({
      where: { userSubscription: null },
    });

    const userSubsCount = await prisma.userSubscription.count();
    const legacySlugsCount = await prisma.legacyOrgSlug.count();

    console.log(`   Users sans subscription : ${usersWithoutSub}`);
    console.log(`   UserSubscriptions créées : ${userSubsCount}`);
    console.log(`   LegacyOrgSlugs créés     : ${legacySlugsCount}\n`);

    if (usersWithoutSub > 0) {
      console.log(
        chalk.yellow(
          `⚠️  ${usersWithoutSub} users n'ont pas de subscription (normal si pas d'org).`,
        ),
      );
    }
  } else {
    console.log(chalk.gray("   (Skipped en mode dry-run)\n"));
  }

  // ============================================
  // Résumé final
  // ============================================
  console.log(chalk.bold("━".repeat(60)));
  console.log(chalk.bold("\n📊 Résumé Migration\n"));

  console.log(`   Organizations scannées : ${stats.totalOrgs}`);
  console.log(
    chalk.green(`   ✅ Users migrés        : ${stats.usersMigrated}`),
  );
  console.log(chalk.gray(`   ⏭️  Users skipped       : ${stats.usersSkipped}`));
  console.log(chalk.green(`   ✅ Slugs sauvegardés   : ${stats.slugsCreated}`));
  console.log(
    chalk.red(`   ❌ Erreurs             : ${stats.errors.length}\n`),
  );

  if (stats.errors.length > 0) {
    console.log(chalk.bold("⚠️  Erreurs détaillées :\n"));
    for (const error of stats.errors) {
      console.log(chalk.red(`   - Org ${error.orgId}: ${error.error}`));
    }
    console.log();
  }

  if (options.dryRun) {
    console.log(
      chalk.yellow.bold("🔍 DRY-RUN MODE : Aucune modification effectuée.\n"),
    );
    console.log(chalk.gray("Pour exécuter la migration réelle :"));
    console.log(chalk.gray("   pnpm migrate:org-to-user\n"));
  } else {
    console.log(chalk.green.bold("✅ MIGRATION RÉUSSIE !\n"));
    console.log(chalk.gray("Prochaines étapes :"));
    console.log(chalk.gray("   1. Vérifier les données dans Prisma Studio"));
    console.log(chalk.gray("   2. Activer le feature flag (Phase 3+)"));
    console.log(chalk.gray("   3. Tester avec USER_ACCOUNT_MODE=true\n"));
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================== ==============================

const options = parseArgs();

void migrateOrganizationsToUser(options)
  .catch((error) => {
    console.error(chalk.red("\n❌ Erreur fatale migration:\n"), error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
