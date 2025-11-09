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
- Variables d'env: `.claude/docs/ENV-VARIABLES-MAPPING.md`

---

## 🏗️ Architecture Evolution

### RFC-001 : Suppression du Système Organizations (2025)

**Date début** : 5 janvier 2025
**Statut** : 🟡 En cours - Phase 0 (Design & Validation)
**Issue** : [#77](https://github.com/YoannDrx/mycryptopilot/issues/77)
**Branche** : `feature/remove-organizations`

#### Contexte

MyCryptoPilot utilise actuellement une architecture multi-tenant B2B héritée du boilerplate NOW.TS, où chaque utilisateur possède une "Organization" (1 org = 1 user).

**Problèmes identifiés** :
- ❌ **Complexité inutile** : Système Member/Invitation/Organization pour une app B2C single-user
- ❌ **Double système plans** : `User.planName` + `Organization.Subscription` (confusion, maintenance)
- ❌ **Routing complexe** : `/orgs/[orgSlug]/...` (75+ fichiers, URLs lourdes)
- ❌ **Performance** : JOINs inutiles `Member → Organization → Subscription`
- ❌ **Confusion conceptuelle** : "Organization" = compte utilisateur (sémantiquement incorrect)

**Chiffres clés** :
- **Fichiers affectés** : 150+
- **Tables DB à supprimer** : 4 (Organization, Member, Invitation, Subscription)
- **Lignes de code** : ~3500 à refactorer
- **Estimation totale** : 26-35 jours (5-7 semaines)

**Audit complet disponible** : Voir issue #77 (rapport 41k+ chars)

---

#### Décisions Architecturales

##### 1. Structure URLs Finale

**DÉCISION VALIDÉE** : Routes directes sous `/` (sans préfixe `/orgs/[slug]`)

| Ancienne Route | Nouvelle Route | Rationale |
|----------------|----------------|-----------|
| `/orgs/[slug]/dashboard` | `/dashboard` | URLs simples, SEO-friendly |
| `/orgs/[slug]/traders` | `/traders` | Correspond au modèle B2C |
| `/orgs/[slug]/signals` | `/signals` | Pas de confusion "quel slug ?" |
| `/orgs/[slug]/account` | `/account` | Navigation intuitive |
| `/orgs/[slug]/pricing` | `/pricing` | URLs stables (pas de slug variable) |

**Bénéfices** :
- ✅ Meilleur SEO (URLs stables)
- ✅ UX simplifiée (pas de "sélecteur d'organisation")
- ✅ Cohérence avec modèle B2C

---

##### 2. Schéma Database UserSubscription

**DÉCISION VALIDÉE** : Nouveau modèle direct `User → UserSubscription`

```prisma
model UserSubscription {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Plan info
  plan              String    // "free" | "pro" | "ultra"
  status            String    // "active" | "trialing" | "expired"
  periodStart       DateTime?
  periodEnd         DateTime?
  paymentMethod     String?   // "crypto" | "stripe_legacy"

  // Audit trail (pour traçabilité migration)
  migratedFromOrgId String?   @map("migrated_from_org_id")

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("user_subscriptions")
}
```

**Rationale** :
- ✅ Relation directe (pas de `Member` intermédiaire)
- ✅ Audit trail (`migratedFromOrgId` pour debug post-migration)
- ✅ Support multi-payment methods (crypto + legacy Stripe si besoin)
- ✅ Schéma évolutif (ajout de champs facile)

**Tables supprimées** :
- ❌ `Organization` (remplacé par concept "User Account")
- ❌ `Member` (plus besoin, 1 user = 1 account)
- ❌ `Invitation` (système multi-org désactivé)
- ❌ `Subscription` (remplacé par `UserSubscription`)

---

##### 3. Feature Flags Strategy

**DÉCISION VALIDÉE** : Migration progressive en "dual-mode"

```typescript
// src/lib/feature-flags.ts (NOUVEAU fichier)
export const FEATURES = {
  USER_ACCOUNT_MODE: process.env.NEXT_PUBLIC_USER_ACCOUNT_MODE === 'true',
  LEGACY_ORG_REDIRECTS: process.env.NEXT_PUBLIC_LEGACY_REDIRECTS !== 'false',
} as const;
```

**États de migration** :
1. **Phases 1-6** : `USER_ACCOUNT_MODE=false` (legacy), nouveau code coexiste
2. **Phase 7** : `USER_ACCOUNT_MODE=true` (nouveau mode activé), redirections 307 actives
3. **Phase 8** : Feature flags supprimés (nouveau mode permanent)

**Rationale** :
- ✅ **Zéro downtime** : Bascule sans interruption service
- ✅ **Réversible** : Rollback possible jusqu'à Phase 8
- ✅ **Tests exhaustifs** : Validation dual-mode avant prod
- ✅ **Migration progressive** : Activer flag par environnement (staging → prod)

---

##### 4. Migration Données Strategy

**DÉCISION VALIDÉE** : Script idempotent avec audit trail complet

**Étapes migration** :
1. **Copy** : `Organization.Subscription` → `UserSubscription` (tous users)
2. **Backup** : `Organization.slug` → `LegacyOrgSlug` (pour redirections 307)
3. **Sync** : `User.planName/planExpiresAt` (pour Discord bot)
4. **Validate** : Integrity checks (aucun user sans subscription)
5. **Report** : Rapport détaillé (succès/erreurs/instructions rollback)

**Fichier** : `scripts/migrate-org-to-user.ts` (idempotent, rejouable sans danger)
**Rollback** : `scripts/rollback-migration.ts` (supprime UserSubscription)

**Rationale** :
- ✅ **Idempotent** : Rejouable sans casser les données
- ✅ **Audit complet** : Traçabilité totale (qui, quand, quoi)
- ✅ **Rollback safe** : Restauration état initial possible
- ✅ **Validation automatique** : Integrity checks intégrés

---

##### 5. Ordre Migration Routes

**DÉCISION VALIDÉE** : Progressive, route par route (pas de "big bang")

**Ordre choisi** (du moins au plus complexe) :
1. `/pricing` (page statique, zéro logique métier)
2. `/traders` (marketplace, queries simples)
3. `/dashboard` (user dashboard, lecture subscription)
4. `/dashboard/trader` (trader dashboard, création signaux)
5. `/signals/*` (signaux + création, logique follow)
6. `/account/*` (settings, exchanges, become-trader, checkout)

**Rationale** :
- ✅ **Validation incrémentale** : Tester chaque route avant la suivante
- ✅ **Blast radius limité** : Problème isolé à 1 route, pas toute l'app
- ✅ **Rollback facile** : Revenir en arrière route par route si besoin
- ✅ **Confiance progressive** : Montée en complexité graduellement

---

#### Plan de Migration (8 Phases)

**Durée totale** : 26-35 jours (5-7 semaines)
**Réversibilité** : ✅ Oui jusqu'à Phase 8 (feature flags + rollback scripts)

| Phase | Durée | Description | Risque | Réversible |
|-------|-------|-------------|--------|------------|
| 0. Design & RFC | 2-3j | Validation architecture (CE DOCUMENT) | 🟢 Nul | N/A |
| 1. Structures | 3-4j | Ajouter UserSubscription + feature flags | 🟢 Faible | ✅ Oui |
| 2. Migration données | 2-3j | Script migration + rollback | 🟡 Moyen | ✅ Oui (script) |
| 3. Services | 4-5j | Adapter subscription manager, follow, Discord | 🟡 Moyen | ✅ Oui (flag) |
| 4. Auth | 3-4j | Better Auth + middleware dual-mode | 🟡 Moyen | ✅ Oui (flag) |
| 5. UI progressive | 5-6j | Migrer routes une par une | 🟡 Moyen | ✅ Oui (coexistence) |
| 6. Tests | 3-4j | Validation exhaustive dual-mode | 🟢 Faible | ✅ Oui |
| 7. Bascule prod | 1-2j | Activer flag ON progressivement | 🟡 Moyen | ✅ Oui (flag OFF) |
| 8. Nettoyage | 3-4j | Supprimer tables + code legacy | 🔴 Élevé | ❌ Non (irréversible) |

**Tracking détaillé** : Voir `.claude/docs/REFACTOR-TRACKING.md`

---

#### Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Régression auth** | Moyen | 🔴 Critique | Feature flags + tests exhaustifs Phase 6 |
| **Perte données** | Faible | 🔴 Critique | Migration idempotente + rollback + audit trail |
| **Casse redirections** | Moyen | 🟡 Moyen | LegacyOrgSlug table + middleware 307 |
| **Discord bot offline** | Faible | 🟡 Moyen | Tests intégrés Phase 3 + monitoring |
| **Performance dégradée** | Faible | 🟢 Faible | Benchmarks avant/après Phase 6 |

---

#### Bénéfices Attendus

**Performance** :
- ✅ **-30% queries DB** : Plus de JOINs `Member → Organization → Subscription`
- ✅ **-20% temps chargement** : Routing simplifié + middleware allégé
- ✅ **Latence réduite** : Accès direct `User.planName` (utilisé par Discord bot)

**Maintenabilité** :
- ✅ **Architecture claire** : Pure B2C, zéro confusion conceptuelle
- ✅ **Code simplifié** : -3500 lignes de complexité inutile
- ✅ **Moins de bugs** : Un seul système de plans (vs double actuel)

**UX** :
- ✅ **URLs propres** : `/dashboard` au lieu de `/orgs/xxx/dashboard`
- ✅ **Navigation intuitive** : Pas de "sélecteur d'organisation" inutile
- ✅ **SEO amélioré** : URLs stables, pas de slug variable

**Évolutivité** :
- ✅ **Base saine** : Foundation solide pour features futures
- ✅ **Onboarding simplifié** : Moins d'étapes signup (pas de création org)

---

#### Validation & Approbation

**Checklist décisions** :
- [x] Structure URLs validée (`/dashboard`, `/traders`, etc.)
- [x] Schéma UserSubscription approuvé (avec `migratedFromOrgId`)
- [x] Feature flags strategy OK (dual-mode)
- [x] Migration données strategy OK (idempotent + rollback)
- [x] Ordre migration routes OK (pricing → traders → dashboard → signals → account)
- [x] Risques identifiés et mitigations définies
- [ ] **Approbation finale pour Phase 1** (en attente)

**Date validation Phase 0** : 5 janvier 2025
**Approuvé par** : Yoann Andrieux

---

#### Références

- **Issue GitHub** : [#77 - Refactoring Suppression Organizations](https://github.com/YoannDrx/mycryptopilot/issues/77)
- **Tracking détaillé** : `.claude/docs/REFACTOR-TRACKING.md`
- **Script validation** : `scripts/pre-migration-validation.ts`
- **Analyse originale** : `.claude/docs/archive/archi.md` (options initiales)

**Prochaine étape** : Phase 1 - Structures User-Centric (3-4 jours)

---

