# Testing Playbook - MyCryptoPilot

**Dernière mise à jour**: 2 novembre 2025.

Cette fiche regroupe tous les moyens de validation disponibles (unitaires, e2e, scripts de diagnostic) et les parcours manuels critiques pour la bêta.

---

## 🧪 Couverture automatisée

| Type | Local | CI | Détails |
|------|-------|----|---------|
| Unitaires / intégration (Vitest) | `pnpm test` | `pnpm test:ci` | 21 fichiers dans `__tests__/`. Cible : logique métier (trading, crypto, auth). |
| E2E (Playwright) | `pnpm test:e2e`, `pnpm test:e2e -- --headed` | `pnpm test:e2e:ci` via `scripts/run-e2e-tests.sh` | 26 scénarios couvrant signup, dashboard, marketplace, checkout crypto, administration de base. |
| Lint + types | `pnpm lint`, `pnpm ts` | `pnpm lint:ci`, `pnpm test:ci` | Évite régressions typescript/eslint. |

### Pré-requis communs
- Base de données `mycryptopilot_test` accessible (Postgres). Utiliser `scripts/setup-test-db.sh` (crée DB + migrations + seed minimal).
- Variables fichier `.env.test` complètes (voir `.claude/docs/ENV-VARIABLES-MAPPING.md`).
- Pour Playwright headed, installer les navigateurs : `npx playwright install`.

### Scripts utilitaires
- `scripts/run-e2e-tests.sh`: orchestre reset DB → build → tests (utilisé en CI).
- `scripts/dev-tools/check-test-env.sh`: vérifie Postgres, Prisma CLI, Playwright, versions Node/pnpm.
- `scripts/dev-tools/test-*`: diagnostics ciblés (checkout crypto, génération d’adresses, RPC, DB).

---

## ✅ Parcours manuels à vérifier avant release

1. **Onboarding & marketplace**
   - Landing → Signup → Création auto d’organisation.
   - Dashboard utilisateur (cartes, quick actions).
   - Marketplace traders (filtres, tri, pagination).

2. **Publication signal trader**
   - Basculer en mode trader (`userRole`).
   - Créer un signal (payload complet) et vérifier :
     - Apparition dans feed.
     - Notification Discord (bot + webhook).
     - Historique signal trader.

3. **Follow / unfollow**
   - Limites plan Free vs Pro/Ultra (utiliser scripts upgrade `scripts/upgrade-to-*.ts`).
   - Vérifier rôles Discord associés (synchro via `subscription-manager`).

4. **Paiements crypto**
   - Checkout testnet (Base + Tron) → watcher.
   - Activation plan + email confirmation.
   - Sweep dry-run (`npx tsx scripts/sweep-to-binance.ts`).

5. **Portfolio tracking**
   - Connecter comptes Binance/Bybit testnet.
   - Lancer `sync-service` (watch cron logs) → vérifier `TraderPerformanceSnapshot`.
   - Dashboard trader (stats, tableaux de trades).

6. **Admin**
   - Panel admin (`app/admin`) → refresh actions (exchanges, subscriptions).
   - Vérifier `get-*-metrics.ts` renvoient les données attendues.

---

## 🔄 Données & Nettoyage

- **Reset complet local** :
  ```bash
  pnpm prisma migrate reset
  pnpm prisma db seed
  ```
- **Nettoyage ciblé** : `scripts/dev-tools/test-cleanup.ts` (supprime données de tests). Toujours dry-run par défaut ; ajouter un prompt avant suppression réelle.
- **Backfill historique** : `scripts/backfill-trader-trade-quantities.ts` (à exécuter une fois pour migrer les anciens trades).

---

## 🛡️ Bonnes pratiques QA

- Lancer `pnpm lint && pnpm ts` avant toute PR.
- Pour les features UI importantes, filmer un court Loom/GIF et lier dans la PR.
- Enregistrer les seeds ou fixtures utilisés durant les tests manuels (favoriser `prisma/seed.ts`).
- Documenter les scénarios Playwright manquants directement dans la PR pour enrichissement futur.
- Utiliser `pnpm test:e2e -- --project=chromium --grep "pattern"` pour cibler un scénario.

---

## 📚 Liens utiles

- `.claude/docs/DEVELOPMENT.md` — roadmap & priorités.
- `.claude/docs/CRYPTO-PAYMENTS.md` — détails checkout/sweep.
- `.claude/docs/PORTFOLIO-TRACKING.md` — Bybit/Binance + agrégation.
- `.claude/docs/TRADING-SYSTEM.md` — domaine trading.
- `.claude/docs/ENV-VARIABLES-MAPPING.md` — configuration complète env.

