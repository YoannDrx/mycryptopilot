# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Dernière mise à jour**: 2 novembre 2025 — Audit documentation & scripts (voir `.claude/docs/AUDIT-2025-11-02.md`)

---

## 📋 Table des Matières

1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture](#architecture)
3. [État actuel](#état-actuel)
4. [Conventions de code](#conventions-de-code)
5. [Workflow de modification](#workflow-de-modification)
6. [Commandes de développement](#commandes-de-développement)
7. [Structure du projet](#structure-du-projet)
8. [Fichiers importants](#fichiers-importants)
9. [Documentation Modules](#documentation-modules)
10. [Notes de développement](#notes-de-développement)

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

| Plan  | Prix/mois | Signaux/jour | Traders | Screener | Features                        |
| ----- | --------- | ------------ | ------- | -------- | ------------------------------- |
| Free  | $0        | 5            | 1       | 5min     | Teasers floutés                 |
| Pro   | $49       | 50           | 5       | 1min     | Console risque, Journal         |
| Ultra | $99       | ∞            | ∞       | 5sec     | Alertes custom, Filtres avancés |

---

## État actuel

### 📊 Synthèse rapide — 2 novembre 2025

- Dernier audit: `.claude/docs/AUDIT-2025-11-02.md` consolide l’état de la documentation et des scripts.
- Les modules critiques (paiements crypto, signaux, portfolio tracking, Discord) sont présents et branchés dans le codebase. Les flux demeurent dépendants de la configuration des env vars décrites dans `.claude/docs/ENV-VARIABLES-MAPPING.md`.
- Les migrations Prisma couvrent maintenant 22 itérations (voir `prisma/migrations/`), incluant l’unified trading system, les métriques portfolio et la tenue des sweeps.
- Le bot Discord fonctionne via `src/lib/discord/bot-client.ts` mais son démarrage local nécessite la variable `DISCORD_BOT_ENABLED=true` (voir `scripts/start-discord-bot.ts`).

### ✅ Couverture fonctionnelle vérifiée dans le code

- **Trading System** – `src/lib/trading/*`, `app/orgs/[orgSlug]/(trading)` et `src/features/trader/*` confirment profils traders, signaux, copy-trades et agrégations de fills.
- **Crypto Payments** – `src/lib/crypto/address-generator.ts`, `payment-watcher.ts` et `checkout` montrent un flux complet Base/Tron avec HD wallet et suivi pro-rata.
- **Portfolio Tracking** – `src/lib/exchange/*`, `TraderPerformanceSnapshot` et `UserExchangeConnection` gèrent Binance + Bybit en lecture seule et calculs de KPI.
- **Discord** – `src/lib/discord` couvre commandes, rôles, DM, webhooks; la synchro automatique dépend de la configuration Railway décrite dans `.claude/docs/DEPLOYMENT.md`.
- **Env Management & Tooling** – scripts sous `scripts/` et `.claude/commands/*.md` donnent des workflows automatisés (worktrees, audit, sync env, tests).

### ⚠️ Points de vigilance / TODO connus

Références relevées via `rg "TODO"` (nov 2025) :

- `src/lib/cron/tier-check-job.ts`: notifications Discord/email + distribution de récompenses de tiers.
- `src/lib/trading/user-exchange-connection.service.ts`: validation API réelle pour les connexions utilisateurs (actuellement mockée).
- `src/components/copy-trading/copy-trade-button.tsx`: dépend encore d’une résolution automatique du plan actif.
- `src/lib/trading/copy-trade.service.ts`: file d’exécution vers les exchanges à implémenter pour l’automatisation complète.
- `src/lib/discord/user-management.ts`: gestion des channels privés par trader à brancher.
- `src/lib/mail/send-signal-notification.ts`: filtrage selon les préférences email à implémenter.
- `src/lib/exchange/email-notifications.ts`: gabarit hebdo des performances manquant.

`scripts/sweep-to-binance.ts` n’a plus de TODO ouvert: le script peut effectuer des transferts réels (dry-run par défaut). Vérifier la présence de `.env.sweep` avant usage.

### 🎯 Priorités suggérées

1. Finaliser la validation « real exchange » pour `user-exchange-connection.service.ts` afin de sécuriser l’onboarding utilisateur.
2. Livrer les notifications (tier-check + email hebdo) pour améliorer la boucle de rétention.
3. Solidifier la queue de copy-trade (actuellement synchronisation manuelle) avant communication aux utilisateurs.
4. Documenter/monitorer les sweeps mainnet dans un tableau de bord (scripts présents mais observabilité à renforcer).

📄 Voir également `.claude/docs/DEVELOPMENT.md` pour l’historique détaillé des phases et la roadmap courte.

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

- Use `getUser()` for optional user (server-side) - returns user with subscription data
- Use `getRequiredUser()` for required user (server-side) - throws if not authenticated
- Use `useSession()` from `auth-client.ts` (client-side)

### Database

- Prisma ORM with PostgreSQL
- Database hooks for user creation setup
- Organization-based data access patterns

### Dialog System

- Use `dialogManager` for global modals
- Types: confirm, input, custom dialogs
- Automatic loading states and error handling

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

## Commandes de développement

### Core Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application
- `pnpm start` - Start production server
- `pnpm ts` - Run TypeScript type checking
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm clean` - Run lint, type check, and format code

### Database Commands

- `npx prisma migrate status` - Check migration status
- `npx prisma migrate deploy` - Apply migrations
- `npx prisma migrate dev --name <name>` - Create new migration
- `npx prisma generate` - Generate Prisma client
- `pnpm prisma:seed` - Seed the database
- `npx prisma studio` - Open Prisma Studio (DB GUI)

### Testing Commands

- `pnpm test:ci` - Run unit tests in CI mode
- `pnpm test:e2e:ci` - Run e2e tests in CI mode (headless)

### Development Tools

- `pnpm email` - Email development server
- `pnpm knip` - Run knip for unused code detection

---

## Structure du projet

```
mycryptopilot/
├── app/                              # Next.js App Router
│   ├── orgs/[orgSlug]/
│   │   ├── (navigation)/
│   │   │   ├── dashboard/           # User dashboard ✅ (100% fonctionnel)
│   │   │   │   └── trader/          # Trader dashboard ✅ (100% fonctionnel)
│   │   │   ├── traders/             # Marketplace ✅ (100% fonctionnel)
│   │   │   ├── checkout/[plan]/     # Crypto checkout ✅ (447 lignes!)
│   │   │   └── pricing/             # Pricing page ✅
│   │   └── settings/                # Settings pages
│   └── api/                         # API routes (use zod-route.ts)
│       └── crypto/                  # Crypto payment routes ✅
├── src/
│   ├── components/
│   │   ├── ui/                      # Shadcn/UI components
│   │   ├── nowts/                   # Custom components
│   │   └── checkout/                # Checkout UI ✅
│   ├── features/                    # Feature-specific logic
│   │   ├── auth/
│   │   ├── trader/                  # Trader profiles ✅
│   │   ├── signal/                  # Trading signals ✅
│   │   ├── follow/                  # Follow system ✅
│   │   ├── dialog-manager/          # Global dialog system
│   │   └── form/                    # Form patterns
│   ├── lib/
│   │   ├── auth/                    # Better Auth config
│   │   ├── crypto/                  # Crypto payments ✅ (HD wallet + RPC)
│   │   ├── subscription/            # Subscription manager ✅
│   │   ├── discord/                 # Discord Bot integration ✅
│   │   ├── actions/                 # Server actions utils
│   │   ├── zod-route.ts            # API route patterns (ALWAYS USE)
│   │   └── up-fetch.ts             # Fetch wrapper (NEVER use fetch)
│   ├── hooks/                       # Custom React hooks
│   └── site-config.ts              # Site configuration ✅
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma           # Main DB schema ✅
│   │   └── better-auth.prisma      # Auth schema + extensions ✅
│   ├── migrations/                  # ✅ 6 migrations appliquées
│   └── seed.ts                      # Database seed
├── .claude/
│   ├── CLAUDE.md                    # This file (core instructions)
│   └── docs/                        # Documentation modules
│       ├── DATABASE.md              # DB schemas + migrations
│       ├── CRYPTO-PAYMENTS.md       # HD wallet + RPC + checkout
│       ├── SUBSCRIPTIONS.md         # Subscription management
│       ├── TRADING-SYSTEM.md        # Traders + Signals + Follow
│       ├── DEVELOPMENT.md           # État actuel + roadmap
│       └── CONTEXT7-GUIDE.md        # Context7 MCP usage guide
├── emails/                          # React Email templates
├── e2e/                            # Playwright tests
└── __tests__/                      # Unit tests (Vitest)
```

---

## Fichiers importants

### Core (NOW.TS)

- `src/lib/auth/auth-config-setup.ts` - Authentication configuration
- `src/lib/auth.ts` - Better Auth config + hook plan FREE (lignes 61-73)
- `src/features/dialog-manager/` - Global dialog system
- `src/lib/actions/actions-utils.ts` - Server action utilities
- `src/lib/actions/safe-actions.ts` - All Server Action SHOULD use this logic
- `src/lib/zod-route.ts` - All Next.js route (inside the folder `/app/api` and name `route.ts`) SHOULD use this logic
- `src/components/ui/form.tsx` - Form components
- `src/site-config.ts` - Site configuration ✅ (MyCryptoPilot branding)

### Database

- `prisma/schema/schema.prisma` - Main database schema ✅ (MyCryptoPilot models)
- `prisma/schema/better-auth.prisma` - Better Auth schema ✅ (with MyCryptoPilot extensions)
- `src/lib/prisma.ts` - Prisma client instance

### MyCryptoPilot Specific

**Crypto Payments** (✅ 100% fonctionnel):

- `src/lib/crypto/address-generator.ts` - HD wallet (212 lignes)
- `src/lib/crypto/payment-watcher.ts` - RPC monitoring (415 lignes)
- `src/lib/crypto/mycryptopilot-plans.ts` - Plans config + pro-rata (95 lignes)
- `src/components/checkout/checkout-form.tsx` - Checkout UI (447 lignes!)
- `app/api/crypto/generate-address/route.ts` - Address generation API
- `app/api/crypto/check-payment/route.ts` - Payment check API (152 lignes)

**Subscription Management** (✅ 100% fonctionnel):

- `src/lib/subscription/subscription-manager.ts` - Subscription logic (435 lignes)
- `src/components/nowts/subscription-card.tsx` - UI subscription card (200 lignes)
- `src/components/nowts/subscription-cta.tsx` - UI upgrade CTA (180 lignes)

**Trading System** (✅ 100% fonctionnel):

- `src/features/trader/trader.action.ts` - Trader profile actions
- `src/features/trader/trader-queries.ts` - Trader queries (6 fonctions)
- `src/features/signal/signal.action.ts` - Signal creation actions
- `src/features/signal/signal-queries.ts` - Signal queries
- `src/features/follow/follow.action.ts` - Follow/unfollow actions
- `src/features/follow/follow-queries.ts` - Follow queries (5 fonctions)
- `app/orgs/[orgSlug]/(navigation)/account/become-trader/become-trader-form.tsx` - Trader form (173 lignes)
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/signals/new/create-signal-form.tsx` - Signal form (515 lignes!)
- `src/components/nowts/trading-card.tsx` - TradingCard display (170 lignes)

**Dashboards & Pages** (✅ 100% fonctionnels):

- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` - User dashboard
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` - Trader dashboard
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` - Traders marketplace
- `app/orgs/[orgSlug]/(navigation)/pricing/page.tsx` - Pricing page

**Discord** (✅ Déployé Railway):

- `src/lib/discord/webhook.ts` - Signal notifications
- `src/lib/discord/roles.ts` - Role assignment
- `discord-bot/` - Discord bot source code (Railway deployment)

**Portfolio Tracking / Exchange Integration** (✅ Binance + Bybit):

- `src/lib/exchange/binance-service.ts` - Binance API integration
- `src/lib/exchange/bybit-service.ts` - Bybit API integration (396 lignes)
- `src/lib/exchange/exchange-service-factory.ts` - Multi-exchange factory pattern
- `src/lib/exchange/sync-service.ts` - Automatic sync engine (supports both exchanges)
- `src/lib/exchange/performance-calculator.ts` - Trading metrics calculations
- `src/lib/crypto/encryption-service.ts` - AES-256-GCM API keys encryption
- `app/orgs/[orgSlug]/(navigation)/(account)/account/exchanges/` - Exchange connections UI
- `app/api/exchange/connect/route.ts` - Exchange connection API
- `content/docs/binance-setup.mdx` - Binance setup guide
- `content/docs/bybit-setup.mdx` - Bybit setup guide (234 lignes)

---

## Documentation Modules

Le projet utilise une architecture documentaire modulaire pour optimiser les performances de Claude Code.

### 📄 Core Instructions (This File)

**`.claude/CLAUDE.md`** - Instructions principales (15-20k chars):

- Vue d'ensemble projet
- Architecture stack
- Conventions de code (CRITIQUE)
- Workflow de modification (CRITIQUE)
- Commandes dev
- Fichiers importants

### 📚 Documentation Détaillée (Modules)

Les détails techniques sont organisés en modules spécialisés:

#### 1. [`.claude/docs/DATABASE.md`](.claude/docs/DATABASE.md)

**Schémas Prisma + Migrations + Queries**

- Modèles DB (TraderProfile, Signal, Follow, CryptoAddress, CryptoPayment)
- Migrations history (8 migrations appliquées)
- Relations entre tables
- Queries patterns courants
- Better Auth extensions

#### 2. [`.claude/docs/CRYPTO-PAYMENTS.md`](.claude/docs/CRYPTO-PAYMENTS.md)

**HD Wallet + RPC Monitoring + Checkout UI**

- Architecture HD wallet (ethers.js + @scure/bip32)
- Dérivation adresses Base/Tron
- RPC calls (payment detection on-chain)
- Guide XPUB generation
- Checkout UI complète (447 lignes)
- API routes
- Plans & pro-rata

#### 3. [`.claude/docs/SUBSCRIPTIONS.md`](.claude/docs/SUBSCRIPTIONS.md)

**Gestion Abonnements + Discord + Email**

- Better Auth hook (plan FREE par défaut)
- Subscription manager (`activateSubscription()`)
- Payment integration
- Discord roles automatiques
- Email confirmations
- UI components (SubscriptionCard, SubscriptionCTA)

#### 4. [`.claude/docs/TRADING-SYSTEM.md`](.claude/docs/TRADING-SYSTEM.md)

**Traders + Signals + Follow/Unfollow**

- Profils traders (formulaire, actions, queries)
- Système signaux (TradingCard format, validation, webhook Discord)
- Follow/Unfollow (limites plans, actions, queries)
- Composants UI (formulaires, TradingCard display)
- Marketplace (search/filters/pagination)
- Dashboards connectés

#### 5. [`.claude/docs/DEVELOPMENT.md`](.claude/docs/DEVELOPMENT.md)

**État Actuel + TODOs + Roadmap**

- Progression globale (98%)
- État détaillé par système
- TODOs réels (minimaux)
- Issues GitHub (ouvertes/fermées)
- Roadmap MVP
- Commandes utiles

#### 6. [`.claude/docs/CONTEXT7-GUIDE.md`](.claude/docs/CONTEXT7-GUIDE.md)

**Context7 MCP - Documentation à jour pour libraries**

- Configuration Context7 (déjà installé)
- Comment utiliser ("use context7 for [library]")
- Les 2 outils MCP (resolve-library-id, get-library-docs)
- Bibliothèques clés de MyCryptoPilot
- Exemples d'usage pratiques
- Performance tips & troubleshooting

### 📦 Guides de Déploiement

#### [`RAILWAY_SETUP.md`](../RAILWAY_SETUP.md)

**Déploiement Discord Bot sur Railway**

- Setup Railway project
- Configuration build settings
- Environment variables Discord Bot
- Deployment et monitoring
- Troubleshooting commun

#### [`ENV_CHECKLIST.md`](../ENV_CHECKLIST.md)

**Checklist Complète des Variables d'Environnement**

- Vercel: 35+ variables (web app production)
- Railway: 15+ variables (Discord bot production)
- Local Dev: `.env.local` (development)
- Comment obtenir les Discord IDs
- Common issues et solutions

### 🔍 Quand Utiliser Quel Module?

**Besoin de comprendre la DB?** → Lire `DATABASE.md`
**Implémenter paiements crypto?** → Lire `CRYPTO-PAYMENTS.md`
**Gérer abonnements?** → Lire `SUBSCRIPTIONS.md`
**Ajouter features trading?** → Lire `TRADING-SYSTEM.md`
**Voir état du projet?** → Lire `DEVELOPMENT.md`
**Utiliser Context7 MCP?** → Lire `CONTEXT7-GUIDE.md`
**Déployer sur Railway?** → Lire `RAILWAY_SETUP.md`
**Configurer env vars?** → Lire `ENV_CHECKLIST.md`

---

## Notes de développement

### Important Rules

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

### Files Creation Policy

IMPORTANT: Assist with defensive security tasks only. Refuse to create, modify, or improve code that may be used maliciously. Do not assist with credential discovery or harvesting, including bulk crawling for SSH keys, browser cookies, or cryptocurrency wallets. Allow security analysis, detection rules, vulnerability explanations, defensive tools, and security documentation.

IMPORTANT: NEVER create files unless they're absolutely necessary for achieving your goal. ALWAYS prefer editing an existing file to creating a new one. This includes markdown files.

NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

---

## Prochaines Étapes MVP

### ✅ Déjà Fait (99%)

**6 Phases complètes**:

- Phase 1: Setup & Infrastructure ✅
- Phase 2: Database & Auth ✅
- Phase 2.5: UI/UX Pages ✅
- Phase 3: Core Features ✅
- Phase 4: Crypto Payments ✅
- Phase 5: Discord Integration MVP ✅ (11 commandes, roles auto, webhooks)
- **Phase 6: Feed Signaux Avancé ✅** (PR #40, 13 oct 2025)

**Tous les systèmes opérationnels**:

- Profils traders ✅
- Création signaux ✅
- Follow/unfollow ✅
- Crypto payments (HD wallet + RPC) ✅
- Subscriptions (activateSubscription) ✅
- Discord Bot 24/7 Railway ✅
- Dashboards 100% connectés ✅
- **Feed signaux avec filtres avancés ✅**

### 🎉 MVP 100% Complete!

**Code Cleanup** - ✅ **DONE**:

1. ~~Fix `webhook.ts:37`~~ - ✅ DONE (commit 41bd066)
2. ~~Fix `follow-button.tsx:20`~~ - ✅ DONE (déjà fonctionnel)
3. ~~Decide `payment-status` route~~ - ✅ DONE (deleted, commit 41bd066)

**Total Restant MVP**: **✅ 0 heures - 100% COMPLETE!** 🎯

**Status**: **READY FOR BETA LAUNCH!** 🚀

📄 **Détails complets**: [`.claude/docs/DEVELOPMENT.md`](.claude/docs/DEVELOPMENT.md)

---

**End of CLAUDE.md** - Pour les détails techniques, consulter les modules dans `.claude/docs/`
