/**
 * Script de validation pré-migration
 * Vérifie que le système est prêt pour la migration Organizations → User
 *
 * Refs: Issue #77 - Refactoring Suppression Organizations
 *
 * Usage: tsx scripts/pre-migration-validation.ts
 */

/* eslint-disable no-console */

import { prisma } from "@/lib/prisma";
import chalk from "chalk";
import { execSync } from "child_process";

type ValidationResult = {
  check: string;
  passed: boolean;
  details: string;
  critical: boolean;
};

async function validatePreMigration(): Promise<void> {
  console.log(
    chalk.bold("\n🔍 Validation Pré-Migration : Suppression Organizations\n"),
  );
  console.log(chalk.gray("   Issue #77 - feature/remove-organizations\n"));

  const results: ValidationResult[] = [];

  // ============================================
  // Check 1: Tous les users ont une organization
  // ============================================
  console.log(chalk.gray("⏳ Check 1/7: Users sans Organization..."));

  const usersWithoutOrg = await prisma.user.count({
    where: {
      members: { none: {} },
    },
  });

  results.push({
    check: "Users sans Organization",
    passed: usersWithoutOrg === 0,
    details: `${usersWithoutOrg} users sans org (devrait être 0)`,
    critical: true,
  });

  // ============================================
  // Check 2: Tous les members sont "owner"
  // ============================================
  console.log(chalk.gray("⏳ Check 2/7: Members non-owner..."));

  const nonOwnerMembers = await prisma.member.count({
    where: { role: { not: "owner" } },
  });

  results.push({
    check: "Members non-owner",
    passed: nonOwnerMembers === 0,
    details: `${nonOwnerMembers} members non-owner (devrait être 0 pour MCP)`,
    critical: false, // Warning only (pas bloquant mais à noter)
  });

  // ============================================
  // Check 3: Tous les users ont planName
  // ============================================
  console.log(chalk.gray("⏳ Check 3/7: Users sans planName..."));

  const usersWithoutPlan = await prisma.user.count({
    where: {
      OR: [{ planName: null }, { planName: "" }],
    },
  });

  results.push({
    check: "Users sans planName",
    passed: usersWithoutPlan === 0,
    details: `${usersWithoutPlan} users sans plan (devrait être 0)`,
    critical: true,
  });

  // ============================================
  // Check 4: Organizations avec subscriptions
  // ============================================
  console.log(chalk.gray("⏳ Check 4/7: Organizations subscriptions..."));

  const orgsWithActiveSub = await prisma.organization.count({
    where: {
      subscription: {
        status: { in: ["active", "trialing"] },
      },
    },
  });

  const totalOrgs = await prisma.organization.count();

  results.push({
    check: "Organizations avec subscriptions",
    passed: true, // Info seulement
    details: `${orgsWithActiveSub}/${totalOrgs} orgs ont une subscription active`,
    critical: false,
  });

  // ============================================
  // Check 5: Slugs uniques
  // ============================================
  console.log(chalk.gray("⏳ Check 5/7: Slugs uniques..."));

  const duplicateSlugs = await prisma.$queryRaw<
    { slug: string; count: bigint }[]
  >`
    SELECT slug, COUNT(*) as count
    FROM "Organization"
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
  `;

  results.push({
    check: "Slugs uniques",
    passed: duplicateSlugs.length === 0,
    details:
      duplicateSlugs.length === 0
        ? "Tous les slugs sont uniques"
        : `${duplicateSlugs.length} slugs dupliqués`,
    critical: true,
  });

  // ============================================
  // Check 6: 1 Organization = 1 User (conformité MCP)
  // ============================================
  console.log(chalk.gray("⏳ Check 6/7: Conformité 1 Org = 1 User..."));

  // Query pour trouver orgs avec multiple members
  const orgsWithMultipleMembersData = await prisma.organization.findMany({
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  const orgsWithMultipleMembers = orgsWithMultipleMembersData.filter(
    (org) => org._count.members > 1,
  ).length;

  results.push({
    check: "Conformité 1 Org = 1 User",
    passed: orgsWithMultipleMembers === 0,
    details:
      orgsWithMultipleMembers === 0
        ? "Toutes les orgs ont 1 seul member (conforme MCP)"
        : `${orgsWithMultipleMembers} orgs avec multiple members (non conforme)`,
    critical: false, // Warning (migration peut continuer mais à vérifier)
  });

  // ============================================
  // Check 7: Tests baseline passent
  // ============================================
  console.log(chalk.gray("⏳ Check 7/7: Tests baseline (TS + Lint)...\n"));

  let testsPassed = false;

  try {
    execSync("pnpm ts", { stdio: "pipe" });
    execSync("pnpm lint", { stdio: "pipe" });
    testsPassed = true;
  } catch {
    testsPassed = false;
  }

  results.push({
    check: "Tests baseline (TS + Lint)",
    passed: testsPassed,
    details: testsPassed
      ? "TypeScript + Lint OK"
      : "Tests échouent (corriger avant migration)",
    critical: true,
  });

  // ============================================
  // Afficher résultats
  // ============================================
  console.log(chalk.bold("\n📊 Résultats Validation\n"));

  let criticalFailures = 0;
  let warnings = 0;

  for (const result of results) {
    const icon = result.passed ? "✅" : result.critical ? "❌" : "⚠️";
    const color = result.passed
      ? chalk.green
      : result.critical
        ? chalk.red
        : chalk.yellow;

    console.log(`${icon} ${color(result.check)}`);
    console.log(`   ${result.details}\n`);

    if (!result.passed) {
      if (result.critical) criticalFailures++;
      else warnings++;
    }
  }

  // ============================================
  // Verdict final
  // ============================================
  console.log(chalk.bold("━".repeat(60)));

  if (criticalFailures > 0) {
    console.log(
      chalk.red.bold(
        `\n❌ VALIDATION ÉCHOUÉE : ${criticalFailures} problème(s) critique(s)\n`,
      ),
    );
    console.log(
      chalk.yellow(
        "⚠️  Résoudre ces problèmes avant de continuer la migration.\n",
      ),
    );
    console.log(chalk.gray("Actions recommandées :"));
    console.log(
      chalk.gray(
        "   1. Fixer les erreurs TypeScript/Lint (pnpm ts && pnpm lint)",
      ),
    );
    console.log(
      chalk.gray("   2. Vérifier users sans org (hook Better Auth ?)"),
    );
    console.log(
      chalk.gray('   3. Vérifier users sans planName (défaut "free" ?)'),
    );
    console.log(
      chalk.gray("   4. Vérifier slugs dupliqués (migration legacy ?)\n"),
    );
    process.exit(1);
  } else if (warnings > 0) {
    console.log(
      chalk.yellow.bold(`\n⚠️  VALIDATION OK avec ${warnings} warning(s)\n`),
    );
    console.log(
      chalk.gray(
        "   Les warnings ne bloquent pas la migration mais doivent être notés.\n",
      ),
    );
  } else {
    console.log(
      chalk.green.bold("\n✅ VALIDATION RÉUSSIE : Prêt pour la migration !\n"),
    );
  }

  // ============================================
  // Stats finales
  // ============================================
  const stats = {
    totalUsers: await prisma.user.count(),
    totalOrgs: await prisma.organization.count(),
    activeSubs: orgsWithActiveSub,
    totalMembers: await prisma.member.count(),
    totalInvitations: await prisma.invitation.count(),
  };

  console.log(chalk.bold("📈 Statistiques Base de Données\n"));
  console.log(`   Users              : ${stats.totalUsers}`);
  console.log(`   Organizations      : ${stats.totalOrgs}`);
  console.log(`   Members            : ${stats.totalMembers}`);
  console.log(`   Invitations        : ${stats.totalInvitations}`);
  console.log(`   Subscriptions actives : ${stats.activeSubs}\n`);

  // ============================================
  // Prochaine étape
  // ============================================
  if (criticalFailures === 0) {
    console.log(chalk.bold("🚀 Prochaine Étape\n"));
    console.log(chalk.gray("   Phase 1 : Structures User-Centric (3-4 jours)"));
    console.log(chalk.gray("   1. Créer src/lib/feature-flags.ts"));
    console.log(chalk.gray("   2. Ajouter UserSubscription model (Prisma)"));
    console.log(chalk.gray("   3. Créer helper getUserSubscription()"));
    console.log(chalk.gray("   4. Tests unitaires dual-mode\n"));
  }
}

// ============================================
// Main execution
// ============================================
void validatePreMigration()
  .catch((error) => {
    console.error(chalk.red("\n❌ Erreur validation:\n"), error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
