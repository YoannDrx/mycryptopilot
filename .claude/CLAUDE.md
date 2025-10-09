# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Dernière mise à jour**: 9 octobre 2025 (via /project-audit)

---

## 📋 Table des Matières

1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture](#architecture)
3. [État actuel du développement](#état-actuel-du-développement)
4. [Conventions de code](#conventions-de-code)
5. [Commandes de développement](#commandes-de-développement)
6. [Structure du projet](#structure-du-projet)
7. [Fonctionnalités clés](#fonctionnalités-clés)
8. [Base de données](#base-de-données)
9. [Système de paiement crypto](#système-de-paiement-crypto)
10. [Tests](#tests)
11. [Fichiers importants](#fichiers-importants)
12. [Notes de développement](#notes-de-développement)
13. [Workflow de modification](#workflow-de-modification)
14. [Prochaines étapes MVP](#prochaines-étapes-mvp)

---

## Vue d'ensemble du projet

**MyCryptoPilot** est une plateforme de trading crypto "risk-first" permettant aux utilisateurs de suivre des traders vérifiés et recevoir des signaux de trading en temps réel.

### Concept

- **Pour les Users (Followers)**: Suivre des traders professionnels, recevoir leurs signaux de trading, gérer un journal de trading, utiliser la console de risque
- **Pour les Traders**: Publier des signaux de trading, obtenir des followers, se faire vérifier, gagner des revenus
- **Paiement**: Crypto uniquement (USDC sur Base, USDT sur Tron) avec support pro-rata

### Objectifs

1. Permettre aux traders professionnels de monétiser leur expertise
2. Donner accès à des signaux de qualité aux traders débutants
3. Offrir des outils de gestion du risque (console de risque, journal)
4. Créer une marketplace de traders vérifiés avec transparence

### Architecture Spécifique MyCryptoPilot

- **1 Organization = 1 User**: Simplifié par rapport au template NOW.TS multi-tenant B2B
- **Crypto Payments**: Remplacement de Stripe (legacy) par système de paiement crypto (Base/Tron)
- **Trading Cards**: Format JSON structuré pour les signaux de trading
- **Plans**: Free (5 signaux/jour), Pro (50 signaux/jour), Ultra (illimité)

---

## Architecture

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with organization support
- **Email**: React Email with Resend
- **Payments**: Crypto payments (USDC/USDT) - Stripe legacy conservé mais non utilisé
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Package Manager**: pnpm

### Architecture Simplifiée (vs NOW.TS)

NOW.TS = multi-tenant B2B SaaS, MyCryptoPilot = B2C single-tenant:
- 1 Organization = 1 User (pas de vraie multi-tenant)
- Organisation sert de "compte" pour compatibility avec Better Auth
- Stripe legacy conservé mais non utilisé (crypto payments à la place)
- Invitations et membres désactivés dans UI (pas utiles pour B2C)

### MyCryptoPilot Plans

| Plan | Prix/mois | Signaux/jour | Traders | Screener | Features |
|------|-----------|--------------|---------|----------|----------|
| Free | $0 | 5 | 1 | 5min | Teasers floutés |
| Pro | $49 | 50 | 5 | 1min | Console risque, Journal |
| Ultra | $99 | ∞ | ∞ | 5sec | Alertes custom, Filtres avancés |

---

## État actuel du développement

### ✅ Base de Données: Opérationnelle

**STATUT**: ✅ **MIGRATIONS APPLIQUÉES ET DB FONCTIONNELLE**

**CORRECTION** (audit 9 oct 2025 - 18h30):
- ✅ **4 migrations** dans `prisma/schema/migrations/` (structure atypique mais valide)
- ✅ Migration MyCryptoPilot `20251003143237_add_mycryptopilot_models` appliquée
- ✅ Client Prisma généré dans `src/generated/prisma`
- ✅ DB Neon synchronisée avec schéma
- ✅ Tous les modèles accessibles (TraderProfile, Signal, Follow, etc.)

**Migrations appliquées** :
```
20250806031537_initail_migration
20250813011134_org_move_to_stirpe_to_org_level
20250813021925_admin_add_admin_control_of_better_auth
20251003143237_add_mycryptopilot_models ✅
```

**Vérification** :
```bash
npx prisma migrate status
# Database schema is up to date! ✅
```

**Modèles disponibles** :
- User (Better Auth + extensions MyCryptoPilot)
- TraderProfile
- Signal
- Follow
- CryptoAddress
- CryptoPayment
- Subscription
- Organization

---

### ✅ Infrastructure & Configuration

- ✅ Next.js 15 + App Router configuré avec Turbopack
- ✅ Prisma schemas complets (TraderProfile, Signal, Follow, CryptoPayment)
- ✅ Migrations Prisma appliquées (4 migrations, DB opérationnelle)
- ✅ Client Prisma généré et fonctionnel
- ✅ Better Auth avec extensions User (userRole, relations)
- ✅ Site config MyCryptoPilot (branding, couleurs, crypto networks)
- ✅ Plans tarifaires définis (Free $0, Pro $49, Ultra $99)
- ✅ TailwindCSS v4 + Shadcn/UI configurés
- ✅ 10 fichiers de tests (Vitest)

---

### ✅ UI/UX Créées

**Pages complètes avec TODOs**:

1. **Dashboard User** (`app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx`)
   - ✅ UI complète: hero stats, active signals card, followed traders list
   - ⚠️ 3 TODOs (lignes 31-33): fetch signals + traders réels

2. **Dashboard Trader** (`app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx`)
   - ✅ UI complète: stats grid, analytics charts, recent signals table
   - ⚠️ 5 TODOs (lignes 29-33): fetch trader data + signals réels

3. **Marketplace Traders** (`app/orgs/[orgSlug]/(navigation)/traders/page.tsx`)
   - ✅ UI complète: search bar, filters sidebar, traders grid
   - ⚠️ 3 TODOs (lignes 38-40): search/filters/pagination fonctionnels

4. **Pricing Page** (`app/orgs/[orgSlug]/(navigation)/pricing/page.tsx`)
   - ✅ Fonctionnelle avec PricingCards component
   - ⚠️ Lien vers crypto payment UI (non créée)

5. **Navigation**
   - ✅ Sidebar avec liens MyCryptoPilot
   - ✅ Landing page hero adaptée
   - ⚠️ Landing sections (reviews, features) encore template "Threader"

**Total: 11 TODOs dans le code applicatif** (hors node_modules):
- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` - 3 TODOs (lignes 31-33)
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` - 5 TODOs (lignes 29-33)
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` - 3 TODOs (lignes 30-32)

---

### ⚠️ Systèmes Partiels

**Crypto Payment System** - Structure créée avec placeholders (4 TODOs):

1. `src/lib/crypto/address-generator.ts` (2 TODOs):
   - Ligne 137: `deriveAddressFromIndex` - HD wallet à implémenter
   - Ligne 184: `generatePaymentAddress` - Implémentation placeholder

2. `src/lib/crypto/payment-watcher.ts` (2 TODOs):
   - Ligne 81: `watchPayment` - RPC calls à implémenter
   - Ligne 120: `watchPaymentWithTimeout` - Polling réel à implémenter

**État**: Structure complète mais non fonctionnelle (pas de vraie dérivation HD, pas de RPC calls).

---

### ⚠️ Core Features (Partiellement Implémentées)

**DÉCOUVERTE** (audit 9 oct 2025): Beaucoup plus avancé que documenté !

1. **✅ Profils Traders** - COMPLET ET TESTABLE
   - ✅ Actions Server: `createTraderProfileAction`, `updateTraderProfileAction`, `toggleTraderRoleAction`
   - ✅ Validation Zod pour TraderProfile (3 schemas)
   - ✅ Queries: 6 fonctions dans `trader-queries.ts`
   - ✅ Page profil trader public (`/traders/[traderId]/page.tsx`)
   - ✅ Tests unitaires (12 tests passants)
   - ✅ **DB fonctionnelle** : Peut être testé end-to-end
   - ⚠️ Formulaire création profil à vérifier

2. **✅ Système Signaux** - COMPLET (90%)
   - ✅ Action Server: `createSignalAction` avec hash SHA256
   - ✅ Validation Zod pour Signal (TradingCard structure)
   - ✅ Formulaire création signal (`/dashboard/trader/signals/new/page.tsx`)
   - ✅ Format TradingCard documenté (`TRADING_CARDS.md`)
   - ✅ Hash blockchain pour immutabilité ✅
   - ✅ **DB fonctionnelle** : Peut être testé end-to-end
   - ❌ Composant `TradingCard` React (affichage visuel)
   - ❌ Feed signaux avec filtres
   - ❌ Pagination + infinite scroll

3. **✅ Follow/Unfollow System** - COMPLET avec 2 TODOs
   - ✅ Actions Server: `followTraderAction`, `unfollowTraderAction`
   - ✅ Vérification limites plans (Free: 1, Pro: 5, Ultra: ∞)
   - ✅ Queries: 5 fonctions dans `follow-queries.ts`
   - ✅ Bouton follow dans `/traders/[traderId]/follow-button.tsx`
   - ✅ **DB fonctionnelle** : Peut être testé end-to-end
   - ⚠️ **2 TODOs**: Récupération plan user (lignes 19 et 28 de `follow.action.ts`)
     - Actuellement hardcodé à "free" pour tous les users
     - Nécessite implémentation de `user.planName` en DB

4. **Connexion Dashboards** (P1 - 2-3 jours)
   - ❌ Remplacer 11 TODOs par vrais fetches Prisma
   - ❌ User dashboard: fetch active signals + followed traders
   - ❌ Trader dashboard: fetch stats + signals + followers
   - ❌ Marketplace: search/filters/pagination

5. **UI Paiement Crypto** (P1 - 1-2 jours)
   - ❌ Page checkout crypto (`/checkout/[plan]`)
   - ❌ Affichage adresses générées (Base/Tron)
   - ❌ QR codes pour paiement mobile
   - ❌ Timer countdown + status watcher
   - ❌ Redirection post-paiement

---

### 📊 Progression Globale du Projet

**Phase 1: Setup & Infrastructure** ✅ (100%)
- Projet initialisé, dépendances installées
- NOW.TS template intégré et adapté

**Phase 2: Database & Auth** ✅ (100%)
- Schémas Prisma complets ✅
- ✅ Migrations appliquées (4 migrations, DB opérationnelle)
- Client Prisma généré ✅
- Better Auth configuré avec extensions ✅

**Phase 2.5: UI/UX Pages** ✅ (90%)
- Dashboards créés (user + trader) ✅
- Marketplace créée ✅
- Pricing page fonctionnelle ✅
- ⚠️ 11 TODOs à remplacer par data fetch

**Phase 3: Core Features** ✅ (85%)
- **DÉCOUVERTE MAJEURE**: Beaucoup plus avancé que pensé !
- Profils traders: **100% code done** ✅ (bloqué migrations)
- Système signaux: **90% done** ✅ (manque feed/composant)
- Follow/unfollow: **95% done** ✅ (2 TODOs plan user)

**Phase 4: Crypto Payments** ⚠️ (30%)
- Structure créée (files, types, plans) ✅
- Documentation complète (XPUB guide) ✅
- ⚠️ Placeholders (pas de HD wallet, pas de RPC)

**Phase 5: Advanced Features** ❌ (0%)
- Journal de trading (0%)
- Console de risque (0%)
- Alertes custom (0%)

**TOTAL PROJET**: ~75% ✅ (infrastructure OK, DB opérationnelle, core features 85% testables)

---

## Commandes de développement

### Core Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application
- `pnpm start` - Start production server
- `pnpm ts` - Run TypeScript type checking
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm lint:ci` - Run ESLint without auto-fix for CI
- `pnpm clean` - Run lint, type check, and format code
- `pnpm format` - Format code with Prettier

### Testing Commands

- `pnpm test:ci` - Run unit tests in CI mode
- `pnpm test:e2e:ci` - Run e2e tests in CI mode (headless)

### Database Commands

- `pnpm prisma:seed` - Seed the database
- `pnpm better-auth:migrate` - Generate better-auth Prisma schema

### Development Tools

- `pnpm email` - Email development server
- `pnpm stripe-webhooks` - Listen for Stripe webhooks (legacy)
- `pnpm knip` - Run knip for unused code detection

---

## Structure du projet

```
mycryptopilot/
├── app/                              # Next.js App Router
│   ├── orgs/[orgSlug]/
│   │   ├── (navigation)/
│   │   │   ├── dashboard/           # User dashboard ✅ (3 TODOs)
│   │   │   │   └── trader/          # Trader dashboard ✅ (5 TODOs)
│   │   │   ├── traders/             # Marketplace ✅ (3 TODOs)
│   │   │   └── pricing/             # Pricing page ✅
│   │   └── settings/                # Settings pages
│   └── api/                         # API routes (use zod-route.ts)
├── src/
│   ├── components/
│   │   ├── ui/                      # Shadcn/UI components
│   │   └── nowts/                   # Custom components
│   ├── features/                    # Feature-specific logic
│   │   ├── auth/
│   │   ├── dialog-manager/          # Global dialog system
│   │   └── form/                    # Form patterns
│   ├── lib/
│   │   ├── auth/                    # Better Auth config
│   │   ├── crypto/                  # Crypto payments ⚠️ (4 TODOs)
│   │   │   ├── address-generator.ts # HD wallet (placeholders)
│   │   │   ├── payment-watcher.ts   # RPC monitoring (placeholders)
│   │   │   └── mycryptopilot-plans.ts # Plans config ✅
│   │   ├── actions/                 # Server actions utils
│   │   ├── zod-route.ts            # API route patterns (ALWAYS USE)
│   │   └── up-fetch.ts             # Fetch wrapper (NEVER use fetch)
│   ├── hooks/                       # Custom React hooks
│   └── site-config.ts              # Site configuration ✅
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma           # Main DB schema ✅
│   │   └── better-auth.prisma      # Auth schema + extensions ✅
│   ├── migrations/                  # ⚠️ EMPTY - NON APPLIQUÉES
│   └── seed.ts                      # Database seed
├── emails/                          # React Email templates
├── e2e/                            # Playwright tests
└── __tests__/                      # Unit tests (Vitest)
```

---

## Fonctionnalités clés

### Features Héritées de NOW.TS

- **Multi-tenant Organizations**: Full organization management (simplifié 1:1 pour MyCryptoPilot)
- **Authentication**: Email/password, magic links, OAuth (GitHub, Google, Discord)
- **Billing**: Stripe subscriptions (legacy, non utilisé)
- **Dialog System**: Global dialog manager for modals and confirmations
- **Forms**: React Hook Form with Zod validation and server actions
- **Email System**: Transactional emails with React Email

### Features Spécifiques MyCryptoPilot

- **Crypto Payments**: USDC (Base) et USDT (Tron) avec support pro-rata ⚠️ (structure créée, placeholders)
- **Trader Profiles**: Profils traders avec stats (winrate, payoff, followers) ❌ (à implémenter)
- **Trading Signals**: Signaux de trading avec format JSON structuré (trading cards) ❌ (à implémenter)
- **Follow System**: Système follow/unfollow avec limites par plan ❌ (à implémenter)
- **Trading Journal**: Journal personnel pour tracker performances ❌ (à implémenter)
- **Risk Console**: Calculateurs position sizing et risk/reward ❌ (à implémenter)
- **Marketplace**: Découverte et recherche de traders vérifiés ✅ (UI créée, 3 TODOs)

---

## Base de données

### Schéma Prisma MyCryptoPilot

Le schéma a été étendu avec 5 modèles principaux :

#### 1. TraderProfile
```prisma
model TraderProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  bio           String?
  verified      Boolean  @default(false)
  statsJson     Json     // { winrate, payoff, totalSignals, followers, ... }
  signals       Signal[]
  followers     Follow[] @relation("TraderFollowers")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### 2. Signal
```prisma
model Signal {
  id            String         @id @default(cuid())
  traderId      String
  trader        TraderProfile  @relation(fields: [traderId], references: [id])
  asset         String         // eg. "BTC", "ETH"
  status        SignalStatus   @default(ACTIVE) // ACTIVE, TP_HIT, INVALIDATED
  payloadJson   Json           // TradingCard structure
  publishedAt   DateTime       @default(now())
  closedAt      DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum SignalStatus {
  ACTIVE
  TP_HIT
  INVALIDATED
}
```

**Signal Structure** (payloadJson):
```typescript
{
  instrumentType: "SPOT" | "PERP",
  bias: "LONG" | "SHORT",
  entry: number,
  invalidation: number,
  tps: number[],
  leverageBand: string,
  risk: 1-5,
  confidence: 0-100,
  rationales: string[],
  regime: string,
  managedBy: "AI" | "HUMAN",
  version: string
}
```

#### 3. Follow
```prisma
model Follow {
  id          String        @id @default(cuid())
  followerId  String
  follower    User          @relation("UserFollowing", fields: [followerId], references: [id])
  traderId    String
  trader      TraderProfile @relation("TraderFollowers", fields: [traderId], references: [id])
  createdAt   DateTime      @default(now())

  @@unique([followerId, traderId])
}
```

#### 4. CryptoAddress
```prisma
model CryptoAddress {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  network       String   // "base" | "tron"
  address       String   @unique
  derivationIndex Int
  createdAt     DateTime @default(now())

  @@unique([userId, network])
}
```

#### 5. CryptoPayment
```prisma
model CryptoPayment {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  plan            String        // "PRO" | "ULTRA"
  network         String        // "base" | "tron"
  token           String        // "USDC" | "USDT"
  amount          String        // en unités token (eg. "49.00")
  toAddress       String
  txHash          String?
  status          PaymentStatus @default(PENDING)
  daysGranted     Int
  expiresAt       DateTime
  confirmedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  EXPIRED
}
```

#### 6. User (Extended)
```prisma
model User {
  // ... existing Better Auth fields
  userRole         UserRole         @default(USER)
  planName         String?          // "FREE", "PRO", "ULTRA"
  planExpiresAt    DateTime?
  dailySignalsUsed Int              @default(0)
  lastSignalReset  DateTime         @default(now())

  traderProfile    TraderProfile?
  following        Follow[]         @relation("UserFollowing")
  cryptoAddresses  CryptoAddress[]
  cryptoPayments   CryptoPayment[]
}

enum UserRole {
  USER
  TRADER
  BOTH
}
```

### Database Hooks

- User creation setup dans `src/lib/auth/auth-config-setup.ts`
- Organization-based data access patterns

---

## Système de paiement crypto

### ⚠️ État Actuel: STRUCTURE CRÉÉE, PLACEHOLDERS UNIQUEMENT

Le système de paiement crypto est **structuré mais NON FONCTIONNEL** :

**Fichiers créés**:
- ✅ `src/lib/crypto/mycryptopilot-plans.ts` - Plans config (fonctionnel)
- ⚠️ `src/lib/crypto/address-generator.ts` - HD wallet (placeholders)
- ⚠️ `src/lib/crypto/payment-watcher.ts` - RPC monitoring (placeholders)

**Variables d'env requises** (non configurées):
- `BASE_RPC_URL` - URL RPC Base network
- `TRON_RPC_URL` - URL RPC Tron network
- `CRYPTO_XPUB_BASE` - Extended public key Base (HD wallet)
- `CRYPTO_XPUB_TRON` - Extended public key Tron (HD wallet)

### Utilisation des Plans

```typescript
import { MYCRYPTOPILOT_PLANS, canPerformAction, calculateDaysGranted, getPlanFromAmount } from '@/lib/crypto/mycryptopilot-plans'

// Vérifier limites
const canFollow = canPerformAction("FREE", "tradersFollow", 0) // false (max 1)
const canFollow = canPerformAction("PRO", "tradersFollow", 3)   // true (max 5)

// Calculer pro-rata
const days = calculateDaysGranted(25, "PRO")  // 15 jours (49$/mois)
const days = calculateDaysGranted(99, "ULTRA") // 30 jours

// Détecter plan depuis montant
const plan = getPlanFromAmount(49)  // "PRO"
const plan = getPlanFromAmount(99)  // "ULTRA"
```

### Pour Implémenter le Crypto Payment

**Étapes requises** (4-5 jours):

1. **Installer dépendances**:
   ```bash
   pnpm add ethers@^6 tronweb
   ```

2. **Générer xpub keys** (HD wallet):
   - Créer wallet Ethereum/Base avec ethers
   - Créer wallet Tron avec tronweb
   - Exporter extended public keys (xpub)
   - Configurer dans `.env.local`

3. **Implémenter `address-generator.ts`** (2 TODOs):
   - Ligne 137: `deriveAddressFromIndex` - Utiliser ethers/tronweb pour dériver adresses
   - Ligne 184: `generatePaymentAddress` - Retourner vraies adresses dérivées

4. **Implémenter `payment-watcher.ts`** (2 TODOs):
   - Ligne 81: `watchPayment` - Appels RPC pour détecter Transfer events (USDC/USDT)
   - Ligne 120: `watchPaymentWithTimeout` - Polling réel avec retry

5. **Créer UI paiement**:
   - Page checkout (`/checkout/[plan]`)
   - Affichage adresses générées + QR codes
   - Timer countdown + status watcher
   - Redirection post-paiement

---

## Conventions de code

### TypeScript

- Use `type` over `interface` (enforced by ESLint)
- Prefer functional components with TypeScript types
- No enums - use maps instead (exception: Prisma enums auto-generated)
- Strict TypeScript configuration

### React/Next.js

- Prefer React Server Components over client components
- Use `"use client"` only for Web API access in small components
- Wrap client components in `Suspense` with fallback
- Use dynamic loading for non-critical components

### Styling

- Mobile-first approach with TailwindCSS
- Use Shadcn/UI components from `src/components/ui/`
- Custom components in `src/components/nowts/`

### Styling Preferences

- Use shared typography components in `@/components/ui/typography.tsx` for paragraphs and headings (instead of creating custom `p`, `h1`, `h2`, etc.)
- For spacing, prefer utility layouts like `flex flex-col gap-4` for vertical spacing and `flex gap-4` for horizontal spacing (instead of `space-y-4`)
- Prefer the card container `@/components/ui/card.tsx` for styled wrappers rather than adding custom styles directly to `<div>` elements

### State Management

- Use `nuqs` for URL search parameter state
- Zustand for global state (see `dialog-store.ts`)
- TanStack Query for server state

### Forms and Server Actions

- Use React Hook Form with Zod validation
- Server actions in `.action.ts` files
- Use `resolveActionResult` helper for mutations
- Follow form creation pattern in `/src/features/form/`

### Authentication

- Use `getUser()` for optional user (server-side)
- Use `getRequiredUser()` for required user (server-side)
- Use `useSession()` from `auth-client.ts` (client-side)
- Use `getCurrentOrgCache()` to get the current org

### Database

- Prisma ORM with PostgreSQL
- Database hooks for user creation setup
- Organization-based data access patterns

### Dialog System

- Use `dialogManager` for global modals
- Types: confirm, input, custom dialogs
- Automatic loading states and error handling

---

## Tests

### Unit Tests

- Located in `__tests__/` directory
- Use Vitest with React Testing Library
- Mock extended with `vitest-mock-extended`

### E2E Tests

- Located in `e2e/` directory
- Use Playwright with custom test utilities
- Helper functions in `e2e/utils/`

---

## Fichiers importants

### Core (NOW.TS)
- `src/lib/auth/auth-config-setup.ts` - Authentication configuration
- `src/features/dialog-manager/` - Global dialog system
- `src/lib/actions/actions-utils.ts` - Server action utilities
- `src/components/ui/form.tsx` - Form components
- `src/site-config.ts` - Site configuration ✅ (MyCryptoPilot branding)
- `src/lib/actions/safe-actions.ts` - All Server Action SHOULD use this logic
- `src/lib/zod-route.ts` - All Next.js route (inside the folder `/app/api` and name `route.ts`) SHOULD use this logic

### Database
- `prisma/schema/schema.prisma` - Main database schema ✅ (MyCryptoPilot models)
- `prisma/schema/better-auth.prisma` - Better Auth schema ✅ (with MyCryptoPilot extensions)

### MyCryptoPilot Specific
- `src/lib/crypto/mycryptopilot-plans.ts` - Plans configuration ✅ (Free, Pro, Ultra)
- `src/lib/crypto/address-generator.ts` - Crypto address generation ⚠️ (2 TODOs - placeholders)
- `src/lib/crypto/payment-watcher.ts` - Payment monitoring ⚠️ (2 TODOs - placeholders)
- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` - User dashboard ✅ (3 TODOs)
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` - Trader dashboard ✅ (5 TODOs)
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` - Traders marketplace ✅ (3 TODOs)
- `app/orgs/[orgSlug]/(navigation)/pricing/page.tsx` - Pricing page ✅

---

## Notes de développement

- Always use `pnpm` for package management
- Use TypeScript strict mode - no `any` types
- Prefer server components and avoid unnecessary client-side state
- Prefer using `??` than `||`
- All API Route SHOULD use `@/lib/zod-route.ts`, each file name `route.ts` should use Zod Route. **ALWAYS READ zod-route.ts before creating any routes**
- All API Request SHOULD use `@/lib/up-fetch.ts` and **NEVER use `fetch`**

### Files Naming

- All server actions should be suffix by `.action.ts` eg. `user.action.ts`, `dashboard.action.ts`

### Debugging and Complex Tasks

- For complex logic and debugging, use logs. Add a lot of logs at each steps and ASK ME TO SEND YOU the logs so you can debug easily.

### TypeScript Imports

**Important**: Always use TypeScript paths:

- `@/*` is link to `@src`
- `@email/*` is link to `@emails`
- `@app/*` is link to `@app`

---

## Workflow de modification

🚨 **CRITICAL RULE - ALWAYS FOLLOW THIS** 🚨

**BEFORE editing any files, you MUST Read at least 3 files** that will help you to understand how to make a coherent and consistency.

This is **NON-NEGOTIABLE**. Do not skip this step under any circumstances. Reading existing files ensures:

- Code consistency with project patterns
- Proper understanding of conventions
- Following established architecture
- Avoiding breaking changes

**Types of files you MUST read:**

1. **Similar files**: Read files that do similar functionality to understand patterns and conventions
2. **Imported dependencies**: Read the definition/implementation of any imports you're not 100% sure how to use correctly - understand their API, types, and usage patterns

**Steps to follow:**

1. Read at least 3 relevant existing files (similar functionality + imported dependencies)
2. Understand the patterns, conventions, and API usage
3. Only then proceed with creating/editing files

---

## Prochaines étapes MVP

### Phase 3: Core Features (PRIORITÉ ABSOLUE)

**Ordre recommandé d'implémentation**:

#### 1. ✅ Profils Traders (COMPLET)
- ✅ Formulaire création profil trader
- ✅ Actions Server: `createTraderProfile`, `updateTraderProfile`, `toggleTraderRole`
- ✅ Validation Zod pour TraderProfile
- ✅ Page profil trader public (`/traders/[traderId]`)
- ⚠️ Upload photo profil à vérifier

#### 2. Système Signaux (P0 - 5-7 jours)
- Formulaire création signal (`/dashboard/trader/signals/new`)
- Validation Zod pour Signal payloadJson (TradingCard structure)
- Actions Server: `createSignal`, `publishSignal`, `closeSignal`
- Composant `TradingCard` (affichage signal structuré)
- Feed signaux (`/signals` ou `/dashboard`)
- Filtres: trader, asset, status (ACTIVE/TP_HIT/INVALIDATED)
- Pagination + infinite scroll (TanStack Query)
- Hash blockchain pour immutabilité (optionnel MVP)

#### 3. Follow/Unfollow System (P0 - 2 jours)
- Actions Server: `followTrader`, `unfollowTrader`
- Vérification limites plans (Free: 1, Pro: 5, Ultra: ∞)
- Boutons follow/unfollow dans marketplace
- Liste followers dans profil trader
- Notifications follow (optionnel)

#### 4. Connexion Dashboards (P1 - 2-3 jours)
- Remplacer 11 TODOs par vrais fetches Prisma
- User dashboard: fetch active signals + followed traders
- Trader dashboard: fetch stats + signals + followers
- Marketplace: search/filters/pagination

#### 5. Finir Crypto Payment (P1 - 4-5 jours)
- Installer ethers v6 + tronweb
- Générer xpub keys (HD wallet)
- Implémenter `deriveAddressFromIndex` (lignes 137, 184)
- Implémenter `watchPayment` avec RPC calls (lignes 81, 120)
- Créer UI paiement (`/checkout/[plan]`)
- Affichage adresses + QR codes
- Timer countdown + status watcher

**Total estimé**: ~12-15 jours (1 dev full-time) pour MVP fonctionnel
- Profils Traders: ✅ COMPLET (0j)
- Système Signaux: 1-2j (feed + composant TradingCard)
- Follow/Unfollow: 0.5j (TODOs plan user)
- Connexion Dashboards: 2-3j
- Crypto Payment: 4-5j
- Polish & Tests: 4-5j

---

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
