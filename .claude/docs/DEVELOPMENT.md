# Development Status & Roadmap - MyCryptoPilot

**Dernière mise à jour**: 2 novembre 2025 — alignée sur l’audit documentation & scripts.

Ce document dresse une vue d’ensemble de l’état fonctionnel, des travaux en cours et des prochaines étapes du projet. Toutes les références renvoient à des éléments présents dans la branche `main` au 2 novembre 2025.

---

## 📊 Synthèse actuelle

- **Plateforme livrée**: cœur trading social (profils, signaux, suivi traders), paiements crypto (Base USDC + Tron USDT), portfolio tracking (Binance & Bybit à lecture seule), intégration Discord, automation scripts.
- **Infrastructure**: 23 migrations Prisma appliquées (`prisma/migrations/`), génération client automatique (`pnpm prisma generate`), scripts de setup/dev disponibles.
- **Observations clés**:
  - Les flux critiques sont présents dans le code mais restent dépendants d’une configuration d’environnement complète (`.claude/docs/ENV-VARIABLES-MAPPING.md`).
  - Le bot Discord nécessite `DISCORD_BOT_ENABLED=true` pour démarrer en local (`scripts/start-discord-bot.ts`).
  - Les scripts de sweep vers Binance sont opérationnels (dry-run par défaut) et traquent les transactions dans `CryptoAddress`.
  - La file d’exécution automatique du copy-trading reste à implémenter (TODO dans `src/lib/trading/copy-trade.service.ts`).

---

## ✅ Piliers livrés et vérifiés dans le code

### 1. Fondations produit
- **Stack**: Next.js 15 App Router, TypeScript strict, Tailwind v4 + Shadcn, pnpm.
- **Auth & multi-compte**: Better Auth (`src/lib/auth.ts`) avec modèle 1 organization = 1 user pour compatibilité NOW.TS.
- **Base de données**: Prisma (`prisma/schema.prisma`) étendue pour traders, signaux, paiements crypto, portfolio tracking.

### 2. Trading & marketplace
- Profils traders (`src/features/trader/*`, `TraderProfile`), formulaires server actions, marketplace (`app/orgs/[orgSlug]/(trading)`), agrégation des fills (`src/lib/trading/fill-aggregation.service.ts`), copy trades (`src/lib/trading/copy-trade.service.ts`).

### 3. Paiements crypto
- Génération addresses HD (`src/lib/crypto/address-generator.ts`), watcher Base/Tron (`src/lib/crypto/payment-watcher.ts`), checkout UI (`app/(marketing)/pricing`, `app/orgs/.../checkout`).
- Script sweep (`scripts/sweep-to-binance.ts`) + docs `scripts/README-SWEEP.md` & `scripts/SWEEP_SETUP.md`.

### 4. Portfolio tracking
- Intégrations Binance & Bybit (`src/lib/exchange/binance-service.ts`, `bybit-service.ts`), calculs de performance (`TraderPerformanceSnapshot`), dashboard admin (`app/admin/_actions/get-exchanges-metrics.ts`).

### 5. Intégration Discord
- Bot client (`src/lib/discord/bot-client.ts`), commandes slash (`src/lib/discord/commands/*`), rôles automatiques (`src/lib/discord/roles.ts`), déploiement Railway (`scripts/deploy-railway.sh`).

### 6. Tooling & opérations
- Scripts CLI regroupés dans `scripts/` + `scripts/dev-tools/` (voir `scripts/README.md`).
- Commandes automatisées via `.claude/commands/*.md` (env sync, audit, set up issue, TDD).
- Workflows GitHub Actions pour lint/tests (`.github/workflows/`).

---

## ⚠️ Travaux en cours / TODO détectés

Extraction via `rg "TODO"` (2 nov 2025) + revue manuelle.

| Domaine | Fichier | Suivi |
|---------|---------|-------|
| Tiering & engagement | `src/lib/cron/tier-check-job.ts` | Envoyer notifications + distribuer récompenses lors d’un changement de tier.
| Copy-trading | `src/lib/trading/copy-trade.service.ts` | Implémenter la queue d’exécution vers les exchanges utilisateurs.
| Paywall copy-trade | `src/components/copy-trading/copy-trade-button.tsx` | Remplacer TODO par lecture réelle du plan Better Auth.
| Connexions exchange utilisateurs | `src/lib/trading/user-exchange-connection.service.ts` | Valider les API keys côté exchanges (stub pour l’instant) et ajuster permissions.
| Notifications e-mail | `src/lib/mail/send-signal-notification.ts`, `src/lib/exchange/email-notifications.ts` | Préférences utilisateurs + template hebdomadaire à livrer.
| Discord | `src/lib/discord/user-management.ts` | Gestion des salons privés par trader à brancher.

Aucun TODO restant dans `scripts/sweep-to-binance.ts` (transferts prêts). Mettre à jour `scripts/README.md` en conséquence (fait au 2 nov 2025).

---

## 🚀 Feuille de route recommandée

### Court terme (avant ouverture beta)
1. Terminer la validation des API keys utilisateur (sécurité). 
2. Implémenter notifications tier-check & email hebdo pour renforcer la rétention.
3. Brancher la queue d’exécution copy-trade et définir une stratégie d’observabilité.
4. Ajouter un tableau de bord simple pour suivre les sweeps (monitoring transactions + erreurs).

### Moyen terme
- Journal de trading et console de risque (déjà spécifiés mais non livrés).
- Politique de préférences notifications (email/Discord) alignée sur `send-signal-notification`.
- Packaging referral system (`.claude/docs/future-features/REFERRAL-SYSTEM.md`) quand priorisé.

---

## 🧪 Tests & Qualité

- **Unitaires / integration**: 21 fichiers `__tests__` (Vitest). Commandes: `pnpm test`, `pnpm test:ci`.
- **E2E (Playwright)**: 26 scénarios (`e2e/*.spec.ts` + utilitaires). Commandes: `pnpm test:e2e`, `pnpm test:e2e:ci`, script `scripts/run-e2e-tests.sh` pour pipeline.
- **Setup base de tests**: `scripts/setup-test-db.sh` + `.env.test`.
- **Couverture**: non suivie automatiquement; recommander `pnpm vitest --coverage` si besoin.
- **Diagnostics**: `scripts/dev-tools/check-test-env.sh` (postgres, prisma, playwright) et `scripts/dev-tools/test-*.ts` pour vérifications ciblées.

---

## 📚 Références rapides

- Architecture complète: `.claude/CLAUDE.md`
- Base de données & modèles: `.claude/docs/DATABASE.md`
- Payments & sweep: `.claude/docs/CRYPTO-PAYMENTS.md`
- Portfolio tracking: `.claude/docs/PORTFOLIO-TRACKING.md`
- Déploiement: `.claude/docs/DEPLOYMENT.md`
- Variables d’env: `.claude/docs/ENV-VARIABLES-MAPPING.md`

