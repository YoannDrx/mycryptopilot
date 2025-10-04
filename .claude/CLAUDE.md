# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About the project MyCryptoPilot

**MyCryptoPilot** est une plateforme de trading crypto "risk-first" permettant aux utilisateurs de suivre des traders vérifiés et recevoir des signaux de trading en temps réel.

### Concept

- **Pour les Users (Followers)**: Suivre des traders professionnels, recevoir leurs signaux de trading, gérer un journal de trading, utiliser la console de risque
- **Pour les Traders**: Publier des signaux de trading, obtenir des followers, se faire vérifier, gagner des revenus
- **Paiement**: Crypto uniquement (USDC sur Base, USDT sur Tron) avec support pro-rata

### Goals

1. Permettre aux traders professionnels de monétiser leur expertise
2. Donner accès à des signaux de qualité aux traders débutants
3. Offrir des outils de gestion du risque (console de risque, journal)
4. Créer une marketplace de traders vérifiés avec transparence

### Architecture Spécifique MyCryptoPilot

- **1 Organization = 1 User**: Simplifié par rapport au template NOW.TS multi-tenant
- **Crypto Payments**: Remplacement de Stripe par système de paiement crypto (Base/Tron)
- **Trading Cards**: Format JSON structuré pour les signaux de trading
- **Plans**: Free (5 signaux/jour), Pro (50 signaux/jour), Ultra (illimité)

### État Actuel (4 Octobre 2025)

⚠️ **Le projet est en phase de développement MVP**:

**✅ Infrastructure & Config**:
- ✅ Next.js 15 + App Router configuré
- ✅ Prisma schemas complets (tous modèles MyCryptoPilot créés)
- ✅ Better Auth avec extensions User (userRole, relations)
- ✅ Site-config MyCryptoPilot (branding, couleurs, crypto)
- ✅ Plans tarifaires (Free/Pro/Ultra) dans `mycryptopilot-plans.ts`
- ⚠️ **BLOQUANT**: Migrations Prisma non appliquées (dossier `migrations/` inexistant)

**✅ UI Pages Créées** (🆕 depuis dernière mise à jour):
- ✅ Dashboard User (`/dashboard`) - UI complète, 3 TODOs data
- ✅ Dashboard Trader (`/dashboard/trader`) - UI complète, 5 TODOs data
- ✅ Marketplace (`/traders`) - UI complète, 3 TODOs data
- ✅ Pricing (`/pricing`) - Fonctionnelle (boutons Subscribe non connectés)
- ✅ Navigation sidebar avec nouveaux liens

**⚠️ Systèmes Partiels**:
- ⚠️ Crypto payment - Structure créée avec 4 TODOs (placeholders HD wallet + RPC)
- ⚠️ Landing page - Hero adapté, sections (reviews/features) encore "Threader"

**❌ Core Features Manquantes**:
- ❌ Profils traders (formulaire, actions)
- ❌ Système signaux (création, affichage, feed)
- ❌ Follow/Unfollow (actions, vérif limites)
- ❌ Connexion dashboards aux données (11 TODOs total)
- ❌ UI paiement crypto (checkout, adresses, QR codes)

**🚨 Prochaine étape CRITIQUE**: Générer et appliquer migrations Prisma (`npx prisma migrate dev --name init_mycryptopilot`)

**Voir ANALYSIS.md pour analyse complète et détaillée du projet.**

## Development Commands

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
- `pnpm stripe-webhooks` - Listen for Stripe webhooks
- `pnpm knip` - Run knip for unused code detection

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with organization support
- **Email**: React Email with Resend
- **Payments**: Stripe integration
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Package Manager**: pnpm

### Project Structure

- `app/` - Next.js App Router pages and layouts
- `src/components/` - UI components (Shadcn/UI in `ui/`, custom in `nowts/`)
- `src/features/` - Feature-specific components and logic
- `src/lib/` - Utilities, configurations, and services
- `src/hooks/` - Custom React hooks
- `emails/` - Email templates using React Email
- `prisma/` - Database schema and migrations
- `e2e/` - End-to-end tests
- `__tests__/` - Unit tests

### Key Features (NOW.TS Inherited)

- **Multi-tenant Organizations**: Full organization management with roles and permissions (simplifié 1:1 pour MyCryptoPilot)
- **Authentication**: Email/password, magic links, OAuth (GitHub, Google, Discord)
- **Billing**: Stripe subscriptions (legacy) + Crypto payments (nouveau)
- **Dialog System**: Global dialog manager for modals and confirmations
- **Forms**: React Hook Form with Zod validation and server actions
- **Email System**: Transactional emails with React Email

### Key Features (MyCryptoPilot Specific)

- **Crypto Payments**: USDC (Base) et USDT (Tron) avec support pro-rata
- **Trader Profiles**: Profils traders avec stats (winrate, payoff, followers)
- **Trading Signals**: Signaux de trading avec format JSON structuré (trading cards)
- **Follow System**: Système follow/unfollow avec limites par plan
- **Trading Journal**: Journal personnel pour tracker performances (à implémenter)
- **Risk Console**: Calculateurs position sizing et risk/reward (à implémenter)
- **Marketplace**: Découverte et recherche de traders vérifiés

### MyCryptoPilot Plans

| Plan | Prix/mois | Signaux/jour | Traders | Screener | Features |
|------|-----------|--------------|---------|----------|----------|
| Free | $0 | 5 | 1 | 5min | Teasers floutés |
| Pro | $49 | 50 | 5 | 1min | Console risque, Journal |
| Ultra | $99 | ∞ | ∞ | 5sec | Alertes custom, Filtres avancés |

## Code Conventions

### TypeScript

- Use `type` over `interface` (enforced by ESLint)
- Prefer functional components with TypeScript types
- No enums - use maps instead
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

### Styling preferences

- Use the shared typography components in `@src/components/ui/typography.tsx` for paragraphs and headings (instead of creating custom `p`, `h1`, `h2`, etc.).
- For spacing, prefer utility layouts like `flex flex-col gap-4` for vertical spacing and `flex gap-4` for horizontal spacing (instead of `space-y-4`).
- Prefer the card container `@src/components/ui/card.tsx` for styled wrappers rather than adding custom styles directly to `<div>` elements.

### State Management

- Use `nuqs` for URL search parameter state
- Zustand for global state (see dialog-store.ts)
- TanStack Query for server state

### Forms and Server Actions

- Use React Hook Form with Zod validation
- Server actions in `.action.ts` files
- Use `resolveActionResult` helper for mutations
- Follow form creation pattern in `/src/features/form/`

### Authentication

- Use `getUser()` for optional user (server-side)
- Use `getRequiredUser()` for required user (server-side)
- Use `useSession()` from auth-client.ts (client-side)
- Use `getCurrentOrgCache()` to get the current org

### Database

- Prisma ORM with PostgreSQL
- Database hooks for user creation setup
- Organization-based data access patterns

### Dialog System

- Use `dialogManager` for global modals
- Types: confirm, input, custom dialogs
- Automatic loading states and error handling

## Testing

### Unit Tests

- Located in `__tests__/` directory
- Use Vitest with React Testing Library
- Mock extended with `vitest-mock-extended`

### E2E Tests

- Located in `e2e/` directory
- Use Playwright with custom test utilities
- Helper functions in `e2e/utils/`

## Important Files

### Core (NOW.TS)
- `src/lib/auth/auth-config-setup.ts` - Authentication configuration
- `src/features/dialog-manager/` - Global dialog system
- `src/lib/actions/actions-utils.ts` - Server action utilities
- `src/components/ui/form.tsx` - Form components
- `src/site-config.ts` - Site configuration
- `src/lib/actions/safe-actions.ts` - All Server Action SHOULD use this logic
- `src/lib/zod-route.ts` - All Next.js route (inside the folder `/app/api` and name `route.ts`) SHOULD use this logic

### Database
- `prisma/schema/schema.prisma` - Main database schema (MyCryptoPilot models)
- `prisma/schema/better-auth.prisma` - Better Auth schema (with MyCryptoPilot extensions)

### MyCryptoPilot Specific
- `src/lib/crypto/mycryptopilot-plans.ts` - Plans configuration (Free, Pro, Ultra)
- `src/lib/crypto/address-generator.ts` - Crypto address generation (HD wallet) ⚠️ PLACEHOLDERS
- `src/lib/crypto/payment-watcher.ts` - Payment monitoring (Base/Tron) ⚠️ PLACEHOLDERS
- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` - User trading dashboard
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` - Trader dashboard
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` - Traders marketplace
- `app/orgs/[orgSlug]/(navigation)/pricing/page.tsx` - Pricing page

## Development Notes

- Always use `pnpm` for package management
- Use TypeScript strict mode - no `any` types
- Prefer server components and avoid unnecessary client-side state
- Prefer using `??` than `||`
- All API Route SHOULD use @src/lib/zod-route.ts, each file name `route.ts` should use Zod Route. ALWAYS READ zod-route.ts before creating any routes.
- All API Request SHOULD use @src/lib/up-fetch.ts and NEVER use `fetch`

## Files naming

- All server actions should be suffix by `.action.ts` eg. `user.action.ts`, `dashboard.action.ts`

## Debugging and complexe tasks

- For complexe logic and debugging, use logs. Add a lot of logs at each steps and ASK ME TO SEND YOU the logs so you can debugs easily.

## TypeScript imports

Important, when you import thing try to always use TypeScript paths :

- `@/*` is link to @src
- `@email/*` is link to @emails
- `@app/*` is link to @app

## Workflow modification

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

## MyCryptoPilot Development Notes

### Database Schema Extensions

Le schéma Prisma a été étendu avec les modèles MyCryptoPilot :
- `TraderProfile`: Profils traders avec stats JSON
- `Signal`: Signaux de trading avec payload JSON
- `Follow`: Relations follower ↔ trader
- `CryptoAddress`: Adresses crypto générées (HD wallet)
- `CryptoPayment`: Paiements crypto on-chain
- `User` étendu avec: `userRole` (USER/TRADER/BOTH), relations vers nouveaux modèles

### Crypto Payment System

⚠️ **IMPORTANT**: Le système de paiement crypto est structuré mais NON FONCTIONNEL :
- `address-generator.ts` retourne des placeholders (pas de vraie dérivation HD)
- `payment-watcher.ts` ne fait aucun appel RPC (pas de monitoring blockchain)
- Variables d'env requises mais non configurées: `BASE_RPC_URL`, `TRON_RPC_URL`, `CRYPTO_XPUB_BASE`, `CRYPTO_XPUB_TRON`

**Pour implémenter**:
1. Intégrer `ethers` v6 pour Base/Ethereum
2. Intégrer `tronweb` pour Tron
3. Générer et configurer xpub keys (HD wallet)
4. Implémenter dérivation d'adresses réelle
5. Implémenter appels RPC pour détecter Transfer events (USDC/USDT)
6. Créer UI paiement avec affichage adresses + QR codes

### Signal Structure

Les signaux utilisent un format JSON structuré (`payloadJson`):
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

### Plans & Limits

Utiliser `src/lib/crypto/mycryptopilot-plans.ts` pour :
- Vérifier limites: `canPerformAction(plan, "tradersFollow")`
- Calculer pro-rata: `calculateDaysGranted(amountUSD, plan)`
- Détecter plan depuis montant: `getPlanFromAmount(amountUSD)`

### TODOs Critiques

**Total: 11 TODOs dans le code applicatif** (hors node_modules):

**Dashboard pages** (11 TODOs) - fetch data:
- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` - 3 TODOs (lignes 31-33)
  - Fetch user's followed traders
  - Fetch recent signals from followed traders
  - Fetch user's trading stats
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` - 5 TODOs (lignes 29-33)
  - Fetch trader profile
  - Fetch trader's signals
  - Fetch trader's stats (winrate, payoff, etc.)
  - Fetch followers count
  - Fetch revenue stats
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` - 3 TODOs (lignes 30-32)
  - Fetch traders from database
  - Implement search and filters
  - Add pagination

**Crypto system** (4 TODOs) - HD wallet + RPC calls:
- `src/lib/crypto/address-generator.ts` - 2 TODOs (lignes 137, 184)
  - Implement HD wallet derivation (Base avec ethers.js)
  - Implement HD wallet derivation (Tron avec tronweb)
- `src/lib/crypto/payment-watcher.ts` - 2 TODOs (lignes 81, 120)
  - Implement RPC calls Base/Ethereum
  - Implement RPC calls Tron

### Prochaines Étapes MVP

⚠️ **ÉTAPE 0 (BLOQUANT) - 30 minutes**:
```bash
npx prisma migrate dev --name init_mycryptopilot
npx prisma migrate status
```
Sans cela, RIEN ne fonctionnera.

**Priorité P0 - Core Features** (voir ANALYSIS.md pour détails):
1. **Profils traders** (2-3 jours)
   - Page `/account/become-trader` avec formulaire
   - Server actions create/update
   - Toggle USER ↔ TRADER

2. **Système signaux** (5-7 jours)
   - Page `/dashboard/trader/signals/new`
   - Formulaire signal + validation Zod + hash SHA256
   - Composant `<TradingCard>` display
   - Feed signaux avec filtres/pagination

3. **Follow/Unfollow** (2 jours)
   - Server actions follow/unfollow
   - Vérification limites plan
   - Boutons UI + listes

4. **Connecter dashboards** (2-3 jours)
   - Remplacer les 11 TODOs par vrais fetches
   - Server actions pour stats
   - Loading states + error boundaries

**Total Semaine 1**: ~11-15 jours → **MVP utilisable end-to-end** ✅

**Priorité P1 - Crypto Payments** (4-5 jours):
5. **Implémenter HD wallet + RPC** (voir crypto TODOs)
6. **UI paiement crypto** (checkout, QR codes)

**Total MVP complet**: ~15-20 jours (1 dev full-time)

### Architecture Simplifiée (vs NOW.TS)

NOW.TS = multi-tenant B2B SaaS, MyCryptoPilot = B2C single-tenant:
- 1 Organization = 1 User (pas de vraie multi-tenant)
- Organisation sert de "compte" pour compatibility avec Better Auth
- Stripe legacy conservé mais non utilisé (crypto payments à la place)
- Invitations et membres désactivés dans UI (pas utiles pour B2C)
