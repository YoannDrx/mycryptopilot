# Scripts de Migration — Issue #77

Ce document décrit les scripts de migration pour la suppression du système Organizations (Issue #77, RFC-001).

## 📋 Vue d'ensemble

**Contexte**: MyCryptoPilot migre d'une architecture multi-tenant B2B (Organizations) héritée de NOW.TS vers une architecture B2C user-centric.

**Phase concernée**: Phase 2 — Migration Données

**Scripts disponibles**:
- `migrate-org-to-user.ts` — Migration Organization.Subscription → UserSubscription
- `rollback-migration.ts` — Rollback (annulation) de la migration

## 🔄 Script de Migration

### `scripts/migrate-org-to-user.ts`

**Objectif**: Copier les données `Organization.Subscription` vers le nouveau modèle `UserSubscription` de manière idempotente.

### Commandes

```bash
# Dry-run (aucune modification, simulation uniquement)
pnpm migrate:org-to-user:dry-run

# Migration réelle (modifie la base de données)
pnpm migrate:org-to-user

# Migration avec force (skip confirmation)
pnpm migrate:org-to-user --force
```

### Actions Effectuées

Le script exécute 4 étapes séquentielles :

#### Step 1: Audit Pré-Migration
- Compte le nombre d'Organizations
- Compte le nombre d'Users
- Compte le nombre d'Organizations avec Subscription
- Affiche un résumé

#### Step 2: Migration Subscriptions
Pour chaque Organization avec un owner :

1. **Vérification idempotence**: Skip si `UserSubscription` existe déjà pour ce user
2. **Extraction données**:
   - `plan` (free/pro/ultra) depuis `Organization.Subscription.plan`
   - `status` depuis `Organization.Subscription.status`
   - `periodStart` / `periodEnd` depuis `Organization.Subscription`
   - `paymentMethod` = `"stripe_legacy"` si subscription existe
3. **Création `UserSubscription`**:
   - Crée l'enregistrement avec `migratedFromOrgId` (audit trail)
4. **Mise à jour `User`**:
   - `User.planName` = plan
   - `User.planExpiresAt` = periodEnd
   - (Nécessaire pour le Discord bot qui lit ces champs)

**Gestion des erreurs** :
- Orgs sans owner → enregistrées dans `stats.errors`, skip
- User déjà migré → skip (idempotence)
- Toute erreur DB → enregistrée, continue avec les suivants

#### Step 3: Backup Legacy Slugs
Pour chaque Organization avec un slug :

1. **Vérification idempotence**: Skip si `LegacyOrgSlug` existe déjà
2. **Création `LegacyOrgSlug`**:
   - `orgId` (référence vers Organization)
   - `slug` (pour redirects 307)
   - `userId` (owner de l'org)

**Utilité** : Permet de conserver les URLs `/orgs/{slug}/*` dans les emails/Discord pendant Phase 7 (redirects 307).

#### Step 4: Integrity Checks
- Compte le nombre de `UserSubscription` créées
- Compte le nombre de `LegacyOrgSlug` créés
- Compte le nombre de Users sans subscription (normal si pas d'org)

### Résumé Final

Le script affiche un rapport détaillé :
- Organizations scannées
- ✅ Users migrés
- ⏭️ Users skipped (déjà migrés)
- ✅ Slugs sauvegardés
- ❌ Erreurs (avec détails)

### Sécurité & Idempotence

**Le script est idempotent** : peut être rejoué plusieurs fois sans danger.

- Vérifie l'existence avant création (`UserSubscription`, `LegacyOrgSlug`)
- Skip les enregistrements déjà migrés
- Utilise `migratedFromOrgId` comme audit trail
- En cas d'erreur partielle → rejouez le script, il reprendra là où il s'est arrêté

**Mode Dry-Run** : Recommandé pour tester avant la migration réelle.

---

## ↩️ Script de Rollback

### `scripts/rollback-migration.ts`

**Objectif**: Annuler la migration en supprimant les données créées par `migrate-org-to-user.ts`.

### Commandes

```bash
# Dry-run (aucune modification, simulation uniquement)
pnpm rollback:migration:dry-run

# Rollback réel (supprime les données migrées)
pnpm rollback:migration

# Rollback avec force (skip confirmation)
pnpm rollback:migration --force
```

### Actions Effectuées

Le script exécute 4 étapes séquentielles :

#### Step 1: Audit Pré-Rollback
- Compte le nombre de `UserSubscription` migrées (avec `migratedFromOrgId != null`)
- Compte le nombre de `LegacyOrgSlug`

#### Step 2: Suppression UserSubscriptions
Pour chaque `UserSubscription` migrée :

1. **Suppression `UserSubscription`** (WHERE `migratedFromOrgId` IS NOT NULL)
2. **Reset `User` fields**:
   - `User.planName` = NULL
   - `User.planExpiresAt` = NULL

**Note** : Les `Organization.Subscription` legacy ne sont PAS modifiées (restent intactes).

#### Step 3: Suppression LegacyOrgSlugs
Supprime tous les enregistrements `LegacyOrgSlug` créés par la migration.

#### Step 4: Integrity Checks
- Vérifie qu'il ne reste plus de `UserSubscription` migrées
- Vérifie qu'il ne reste plus de `LegacyOrgSlug`

### Résumé Final

Le script affiche un rapport détaillé :
- UserSubscriptions scannées (migrées)
- ✅ UserSubscriptions supprimées
- ✅ LegacyOrgSlugs supprimés
- ✅ Users revertés (planName = NULL)
- ❌ Erreurs (avec détails)

### Limitations du Rollback

**Ce que le rollback fait** :
- ✅ Supprime `UserSubscription` créées par migration
- ✅ Supprime `LegacyOrgSlug`
- ✅ Reset `User.planName` / `User.planExpiresAt` à NULL

**Ce que le rollback NE fait PAS** :
- ❌ Ne supprime PAS les `Organization.Subscription` legacy (elles restent intactes)
- ❌ Ne supprime PAS les `Organization` ni `Member`

**Pourquoi ?** Le rollback restaure uniquement l'état pré-migration. Les données `Organization` legacy restent présentes et peuvent être utilisées immédiatement après rollback (en désactivant `USER_ACCOUNT_MODE`).

---

## 🧪 Procédure de Test Recommandée

### Avant Migration Production

1. **Test en dry-run** (dev/staging):
   ```bash
   pnpm migrate:org-to-user:dry-run
   ```
   - Vérifier le résumé affiché
   - Vérifier qu'aucune erreur critique
   - Noter le nombre de users à migrer

2. **Migration réelle en staging** (si possible):
   ```bash
   pnpm migrate:org-to-user
   ```
   - Vérifier le résumé
   - Vérifier les données dans Prisma Studio
   - Tester l'application avec `USER_ACCOUNT_MODE=false` (legacy)
   - Tester l'application avec `USER_ACCOUNT_MODE=true` (nouveau)

3. **Test rollback en staging**:
   ```bash
   pnpm rollback:migration
   ```
   - Vérifier que les `UserSubscription` sont supprimées
   - Vérifier que l'application fonctionne en mode legacy

4. **Rejouer migration en staging**:
   ```bash
   pnpm migrate:org-to-user
   ```
   - Vérifier l'idempotence (pas de doublons)

### Migration Production

**Recommandations** :

1. **Backup DB** avant migration
2. **Maintenance mode** (optionnel) pendant migration
3. **Dry-run en prod** d'abord :
   ```bash
   pnpm migrate:org-to-user:dry-run
   ```
4. **Migration réelle** :
   ```bash
   pnpm migrate:org-to-user
   ```
5. **Vérifications post-migration** :
   - Prisma Studio : vérifier `UserSubscription` créées
   - Logs Discord bot : vérifier que les rôles sont corrects
   - Tests manuels : signup, login, checkout
6. **Garder `USER_ACCOUNT_MODE=false`** jusqu'à Phase 7 (bascule progressive)

### En Cas de Problème

**Option 1 : Rollback immédiat**
```bash
pnpm rollback:migration
```
Puis investiguer le problème avant de re-migrer.

**Option 2 : Correction manuelle**
Si seulement quelques users posent problème :
- Les corriger manuellement dans Prisma Studio
- Ou les exclure temporairement
- Puis rejouer le script (idempotence)

---

## 📊 Métriques Attendues

### Production Actuelle (estimations basées sur dry-run)

D'après le dry-run sur la DB de dev :
- **2996 Organizations** scannées
- **652 Users** total
- **103 Orgs avec Subscription** (candidates à migration)

**Estimations production** (à ajuster selon vos chiffres réels) :
- ~100-200 users avec subscription à migrer
- ~0-50 orgs sans owner (erreurs attendues, pas bloquant)
- Temps d'exécution : < 5 minutes

### Résultats Attendus Post-Migration

- `UserSubscription` : ~100-200 enregistrements créés
- `LegacyOrgSlug` : ~100-200 slugs sauvegardés
- `User.planName` : ~100-200 users mis à jour

---

## 🔒 Sécurité

### Permissions

Les scripts nécessitent un accès DB complet via Prisma :
- READ : `Organization`, `Member`, `User`, `Subscription`
- WRITE : `UserSubscription`, `LegacyOrgSlug`, `User` (update)
- DELETE (rollback seulement) : `UserSubscription`, `LegacyOrgSlug`

### Audit Trail

Chaque `UserSubscription` créée inclut :
- `migratedFromOrgId` : référence vers l'Organization source
- `createdAt` : timestamp de migration
- Permet de tracer l'origine des données

### Rollback Safety

Le rollback filtre strictement :
- `UserSubscription` WHERE `migratedFromOrgId IS NOT NULL`
- Garantit qu'on ne supprime QUE les données migrées (pas les futures subscriptions créées manuellement)

---

## 📚 Références

- **Issue GitHub** : #77 — Refactoring Suppression Organizations
- **RFC** : `.claude/docs/DEVELOPMENT.md` (RFC-001)
- **Tracking** : `.claude/docs/REFACTOR-TRACKING.md` (Phase 2)
- **Prisma Schema** : `prisma/schema.prisma` (UserSubscription, LegacyOrgSlug)
- **Feature Flags** : `src/lib/feature-flags.ts`

---

## 🚀 Prochaines Étapes (Post-Migration)

Après migration réussie (Phase 2) :

1. **Phase 3** : Feature-flagged Services
   - Créer helpers `getUserSubscription()` dual-mode ✅ (déjà fait)
   - Adapter services un par un

2. **Phase 4** : Auth & Middleware
   - Adapter Better Auth config
   - Adapter middleware session

3. **Phase 5** : UI Progressive
   - Adapter routes `/orgs/[orgSlug]` → `/dashboard`
   - Un à un, feature-flagged

4. **Phase 6** : Tests
   - Adapter tests e2e/unit

5. **Phase 7** : Bascule Production
   - Activer `USER_ACCOUNT_MODE=true`
   - Activer redirects 307

6. **Phase 8** : Nettoyage Final
   - Supprimer Organizations/Members
   - Supprimer LegacyOrgSlug
   - Supprimer feature flags
