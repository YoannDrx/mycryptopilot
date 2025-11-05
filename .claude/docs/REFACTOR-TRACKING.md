# 📊 Tracking : Refactoring Suppression Organizations

**Issue** : [#77](https://github.com/YoannDrx/mycryptopilot/issues/77)
**Branche** : `feature/remove-organizations`
**Date début** : 5 janvier 2025
**Statut global** : 🟡 En cours - Phase 0

---

## 🎯 Progress Global

| Phase | Statut | Début | Fin | Durée | Commits |
|-------|--------|-------|-----|-------|---------|
| 0. Design & RFC | 🟡 En cours | 2025-01-05 | - | - | 1d46176 |
| 1. Structures | ⚪ À faire | - | - | - | - |
| 2. Migration données | ⚪ À faire | - | - | - | - |
| 3. Services | ⚪ À faire | - | - | - | - |
| 4. Auth | ⚪ À faire | - | - | - | - |
| 5. UI progressive | ⚪ À faire | - | - | - | - |
| 6. Tests | ⚪ À faire | - | - | - | - |
| 7. Bascule prod | ⚪ À faire | - | - | - | - |
| 8. Nettoyage | ⚪ À faire | - | - | - | - |

**Légende** : ⚪ À faire | 🟡 En cours | ✅ Terminé | ❌ Bloqué

---

## Phase 0 : Design & RFC (Détail)

**Date début** : 2025-01-05
**Date fin prévue** : 2025-01-07 (estimation 2-3j)

### Checklist Tâches

- [x] Créer branche `feature/remove-organizations`
- [x] Commit initial vide + push
- [x] Vérifier tests baseline (TS, Lint, Build)
- [x] Créer RFC dans `.claude/docs/DEVELOPMENT.md`
- [x] Créer REFACTOR-TRACKING.md (ce fichier)
- [ ] Créer script `scripts/pre-migration-validation.ts`
- [ ] Documenter feature flags dans `.env.example`
- [ ] Obtenir approbation finale utilisateur

### Décisions Validées

- [x] **Structure URLs** : `/dashboard`, `/traders`, `/signals`, `/account`, `/pricing`
- [x] **Schéma UserSubscription** : Avec `migratedFromOrgId` (audit trail)
- [x] **Feature flags** : `USER_ACCOUNT_MODE` + `LEGACY_ORG_REDIRECTS`
- [x] **Migration progressive** : Route par route (pricing → traders → dashboard → signals → account)
- [x] **Scripts idempotents** : Migration + rollback

### Questions Ouvertes

1. **Worktree isolé ?**
   - Avantage : Pas de pollution workspace main
   - Inconvénient : Setup supplémentaire
   - **Décision** : ❌ Non, branche directe suffit (dev only, pas de prod data)

2. **Tests en parallèle ?**
   - Écrire tests Phase 1 ou attendre Phase 6 ?
   - **Décision** : ✅ Tests unitaires dès Phase 1 (TDD approach)

3. **Communication utilisateurs ?**
   - Email/Discord announcement changement URLs ?
   - **Décision** : ✅ Oui, en Phase 7 (avant bascule prod)

### Risques Identifiés Phase 0

- **Aucun** (phase design seulement, pas de code)

### Livrables Phase 0

- [x] Branche `feature/remove-organizations` créée
- [x] RFC complet dans `.claude/docs/DEVELOPMENT.md`
- [x] Tracking file (ce fichier)
- [ ] Script validation pré-migration
- [ ] Validation architecture complète
- [ ] Approbation obtenue

---

## Phase 1 : Structures User-Centric (Preview)

**Date début prévue** : 2025-01-08
**Durée estimée** : 3-4 jours

### Fichiers à Créer

- [ ] `src/lib/feature-flags.ts` (feature flags export)
- [ ] `src/lib/subscription/get-user-subscription.ts` (helper dual-mode)
- [ ] `__tests__/feature-flags.test.ts` (tests feature flags)
- [ ] `__tests__/get-user-subscription.test.ts` (tests helper dual-mode)

### Fichiers à Modifier

- [ ] `prisma/schema/schema.prisma` : Ajouter `UserSubscription` model
- [ ] `prisma/schema/schema.prisma` : Ajouter `LegacyOrgSlug` model
- [ ] `prisma/schema/better-auth.prisma` : Relation `User ↔ UserSubscription`
- [ ] `.env.local` : Ajouter `NEXT_PUBLIC_USER_ACCOUNT_MODE=false`
- [ ] `.env.local` : Ajouter `NEXT_PUBLIC_LEGACY_REDIRECTS=true`
- [ ] `.env.example` : Documenter feature flags

### Migrations DB

- [ ] Migration : `add_user_subscription_coexistence`
  - Table `UserSubscription` (avec `migratedFromOrgId`)
  - Relation `User.userSubscription`
- [ ] Migration : `add_legacy_org_slug`
  - Table `LegacyOrgSlug` (pour redirections)
- [ ] Vérifier : `npx prisma migrate status`
- [ ] Régénérer client : `npx prisma generate`

### Tests Phase 1

- [ ] Test : Feature flags correctement chargés
- [ ] Test : `getUserSubscription(userId)` avec flag OFF (legacy mode)
- [ ] Test : `getUserSubscription(userId)` avec flag ON (nouveau mode)
- [ ] Test : Helper retourne `{ plan, status, periodEnd }`
- [ ] Test : Helper gère cas user sans subscription (fallback "free")

### Checkpoint Phase 1

**Validation complète avant Phase 2** :

- [ ] Tables `UserSubscription` + `LegacyOrgSlug` créées (DB)
- [ ] Feature flags fonctionnels (`.env` + import)
- [ ] Helper `getUserSubscription()` fonctionne (dual mode)
- [ ] Tests unitaires 100% OK (flag ON/OFF)
- [ ] Build OK : `pnpm build`
- [ ] TypeScript OK : `pnpm ts`
- [ ] Lint OK : `pnpm lint`
- [ ] Aucune régression : Toutes les pages existantes fonctionnent

---

## Phase 2 : Migration Données (Preview)

**Date début prévue** : 2025-01-13
**Durée estimée** : 2-3 jours

### Scripts à Créer

- [ ] `scripts/migrate-org-to-user.ts` (principal)
  - Copy Organization.Subscription → UserSubscription
  - Copy Organization.slug → LegacyOrgSlug
  - Update User.planName/planExpiresAt
  - Integrity checks
  - Rapport détaillé
- [ ] `scripts/rollback-migration.ts` (sécurité)
  - Supprime UserSubscription (si `migratedFromOrgId` not null)
  - Restaure état initial
  - Log actions

### Validation Données

**Avant migration** :
- [ ] Backup DB complet effectué (`pg_dump`)
- [ ] Dry-run migration OK (log preview sans write)
- [ ] Tous users ont une Organization
- [ ] Tous members sont "owner" (check conformité MCP)

**Après migration** :
- [ ] Migration réelle exécutée (`tsx scripts/migrate-org-to-user.ts`)
- [ ] Integrity checks passent (0 users sans subscription)
- [ ] Rapport migration généré (stats, errors)
- [ ] Vérification manuelle DB (`npx prisma studio`)

**Rollback test** :
- [ ] Rollback script testé (`tsx scripts/rollback-migration.ts`)
- [ ] UserSubscription supprimées (uniquement migrées)
- [ ] État initial restauré

### Checkpoint Phase 2

- [ ] UserSubscription table remplie (tous users)
- [ ] LegacyOrgSlug table remplie (tous slugs)
- [ ] Aucun user sans subscription (integrity OK)
- [ ] Rollback script validé
- [ ] Audit trail complet (migratedFromOrgId présent)

---

## Phase 3 : Services Feature-Flagged (Preview)

**Date début prévue** : 2025-01-16
**Durée estimée** : 4-5 jours

### Fichiers à Adapter (Dual Mode)

- [ ] `src/lib/subscription/subscription-manager.ts`
  - Fonction `activateSubscription()` dual-mode
  - Si flag ON : Write `UserSubscription` uniquement
  - Si flag OFF : Write `Organization.Subscription` (legacy)
  - Toujours update `User.planName` (Discord bot)

- [ ] `src/features/follow/follow.action.ts`
  - Remplacer `getUserPlan()` par `getUserSubscription()`
  - Supprimer query Member → Organization → Subscription

- [ ] `src/lib/discord/commands/pricing.ts`
  - URLs flag-aware (`/pricing` vs `/orgs/xxx/pricing`)

- [ ] `src/lib/discord/signals-free.ts`
  - Utiliser `getUserSubscription()` pour limits plans

- [ ] `src/lib/mail/send-signal-notification.ts`
  - URLs signaux flag-aware

- [ ] `src/lib/exchange/email-notifications.ts`
  - URLs exchanges flag-aware

- [ ] `src/lib/cron/active-invitees-job.ts`
  - Adapter queries Organization → User

### Tests Phase 3

- [ ] Tests subscription manager (flag ON/OFF)
- [ ] Tests follow actions (limites plans)
- [ ] Tests e2e : Checkout crypto → Subscription activée
- [ ] Tests Discord : Commands + roles attribution
- [ ] Smoke test : Tous services fonctionnent dual-mode

### Checkpoint Phase 3

- [ ] Services fonctionnent avec **flag OFF** (legacy)
- [ ] Services fonctionnent avec **flag ON** (nouveau)
- [ ] Aucune régression métier
- [ ] Discord bot OK (roles, notifications)
- [ ] Email notifications OK (URLs correctes)

---

## Phase 4 : Auth & Middleware (Preview)

**Date début prévue** : 2025-01-22
**Durée estimée** : 3-4 jours

### Fichiers à Adapter

- [ ] `src/lib/auth.ts`
  - Hook `user.create.after` dual-mode
  - Plugin `organization()` conditionnel (si flag OFF)

- [ ] `middleware.ts`
  - Redirections 307 : `/orgs/{slug}/*` → nouvelles routes
  - Auth validation simplifiée (si flag ON)

### Checkpoint Phase 4

- [ ] Auth fonctionne dual-mode
- [ ] Signup crée UserSubscription (si flag ON)
- [ ] Redirections 307 testées
- [ ] Middleware simplifié

---

## Phase 5-8 : À Détailler

*Détails à compléter au fur et à mesure de l'avancement*

---

## Notes de Développement

### Commandes Utiles

```bash
# Vérifier état
git status
pnpm ts && pnpm lint && pnpm test:ci

# Prisma
npx prisma migrate status
npx prisma studio
npx prisma migrate dev --name <name>

# Tests spécifiques
pnpm test __tests__/get-user-subscription.test.ts
pnpm test:e2e e2e/signup.spec.ts

# Build check
pnpm build

# Feature flags (local)
export NEXT_PUBLIC_USER_ACCOUNT_MODE=true
pnpm dev
```

### Contacts Décisions

- Architecture : Yoann Andrieux
- Validation finale : Yoann Andrieux

### Historique Décisions Importantes

| Date | Décision | Rationale |
|------|----------|-----------|
| 2025-01-05 | Feature flags dual-mode | Sécurité migration progressive, réversibilité |
| 2025-01-05 | UserSubscription avec audit trail | Traçabilité post-migration |
| 2025-01-05 | Migration route par route | Blast radius limité, tests incrémentaux |
| 2025-01-05 | Pas de worktree isolé | Dev only, branche directe suffit |

### Problèmes Rencontrés

*Aucun pour l'instant (Phase 0)*

---

## Métriques

### Phase 0
- **Durée réelle** : En cours (démarré 2025-01-05)
- **Commits** : 1 (initial)
- **LOC ajoutées** : ~400 (documentation)
- **LOC supprimées** : 0

### Objectifs Globaux

**Cible finale** :
- **Tables supprimées** : 4 (Organization, Member, Invitation, Subscription)
- **Fichiers refactorés** : 150+
- **LOC supprimées** : ~3500
- **Performance** : -30% queries DB, -20% load time
- **URLs** : 75+ routes simplifiées

---

**Dernière mise à jour** : 2025-01-05 (Phase 0 en cours)
