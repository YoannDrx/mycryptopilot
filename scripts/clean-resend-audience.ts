#!/usr/bin/env tsx
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/**
 * Script pour nettoyer l'audience Resend en supprimant les contacts de test
 *
 * Usage: npx tsx scripts/clean-resend-audience.ts
 *
 * Ce script va:
 * 1. Lister tous les contacts dans l'audience Resend
 * 2. Filtrer les contacts avec emails "playwright-test-*"
 * 3. Supprimer ces contacts de l'audience
 * 4. Afficher un résumé des suppressions
 */

import { resend } from "@/lib/mail/resend";
import { env } from "@/lib/env";

async function cleanResendAudience() {
  console.log("🧹 Nettoyage de l'audience Resend...\n");

  if (!env.RESEND_AUDIENCE_ID) {
    console.error("❌ RESEND_AUDIENCE_ID n'est pas défini dans .env");
    process.exit(1);
  }

  try {
    // 1. Lister tous les contacts
    console.log("📋 Récupération de la liste des contacts...");
    const { data: contacts, error: listError } = await resend.contacts.list({
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (listError) {
      console.error(
        "❌ Erreur lors de la récupération des contacts:",
        listError,
      );
      process.exit(1);
    }

    if (contacts.data.length === 0) {
      console.log("✅ Aucun contact trouvé dans l'audience");
      return;
    }

    console.log(`   Nombre total de contacts: ${contacts.data.length}\n`);

    // 2. Filtrer les contacts de test (playwright-test-*)
    const testContacts = contacts.data.filter((contact) =>
      contact.email.startsWith("playwright-test-"),
    );

    if (testContacts.length === 0) {
      console.log("✅ Aucun contact de test à supprimer");
      return;
    }

    console.log(`🎯 Contacts de test trouvés: ${testContacts.length}`);
    console.log("   Emails à supprimer:");
    testContacts.forEach((contact) => {
      console.log(`   - ${contact.email}`);
    });
    console.log();

    // 3. Supprimer les contacts de test
    console.log("🗑️  Suppression des contacts de test...\n");
    let deletedCount = 0;
    let failedCount = 0;

    for (const contact of testContacts) {
      try {
        const { error: deleteError } = await resend.contacts.remove({
          audienceId: env.RESEND_AUDIENCE_ID,
          id: contact.id,
        });

        if (deleteError) {
          console.error(
            `   ❌ Échec: ${contact.email} - ${deleteError.message}`,
          );
          failedCount++;
        } else {
          console.log(`   ✅ Supprimé: ${contact.email}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`   ❌ Exception: ${contact.email} -`, err);
        failedCount++;
      }

      // Petite pause pour éviter de spam l'API Resend
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 4. Résumé
    console.log(`\n${"=".repeat(50)}`);
    console.log("📊 RÉSUMÉ");
    console.log("=".repeat(50));
    console.log(`Total contacts dans l'audience: ${contacts.data.length}`);
    console.log(`Contacts de test trouvés: ${testContacts.length}`);
    console.log(`Contacts supprimés avec succès: ${deletedCount}`);
    console.log(`Échecs de suppression: ${failedCount}`);
    console.log("=".repeat(50));

    if (failedCount > 0) {
      console.log("\n⚠️  Certains contacts n'ont pas pu être supprimés");
      process.exit(1);
    } else {
      console.log("\n🎉 Nettoyage terminé avec succès!");
    }
  } catch (error) {
    console.error("\n❌ Erreur inattendue:", error);
    process.exit(1);
  }
}

// Exécuter le script
cleanResendAudience().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
