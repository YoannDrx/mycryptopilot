# MyCryptoPilot

<!-- Badges -->
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-145%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

**MyCryptoPilot** est une plateforme de trading crypto "risk-first" permettant aux utilisateurs de suivre des traders vérifiés et recevoir des signaux de trading en temps réel.

## 🎯 Concept

- **Pour les Users (Followers)**: Suivre des traders professionnels, recevoir leurs signaux de trading, gérer un journal de trading, utiliser la console de risque
- **Pour les Traders**: Publier des signaux de trading, obtenir des followers, se faire vérifier, gagner des revenus
- **Paiement**: Crypto uniquement (USDC sur Base, USDT sur Tron) avec support pro-rata

## ✨ Features

### 🎯 Système de Trading
- ✅ **Profils Traders**: Création et gestion de profils traders vérifiés
- ✅ **Signaux de Trading**: Publication de signaux au format TradingCard standardisé
- ✅ **Follow/Unfollow System**: Suivre jusqu'à 5 traders (Pro) ou illimité (Ultra)
- ✅ **Marketplace**: Recherche, filtres et pagination des traders
- ✅ **Dashboards**: Dashboards utilisateur et trader 100% connectés aux données

### 💳 Crypto Payments
- ✅ **HD Wallet**: Génération d'adresses de paiement Base (USDC) et Tron (USDT)
- ✅ **RPC Monitoring**: Détection automatique des paiements on-chain
- ✅ **Pro-rata**: Calcul automatique du montant pro-rata si paiement en milieu de mois
- ✅ **Checkout UI**: Page de paiement complète avec QR codes et countdown

### 🤖 Discord Integration
- ✅ **Discord Bot**: Bot Discord 24/7 déployé sur Railway
- ✅ **Slash Commands**: 11 commandes (5 user, 6 admin)
- ✅ **Auto Roles**: Attribution automatique des rôles selon le plan
- ✅ **Signal Notifications**: Webhooks automatiques pour les nouveaux signaux

### 🔐 Authentication & Security
- ✅ **Better Auth**: Authentication avec support OAuth (GitHub, Google, Discord)
- ✅ **Organization System**: 1 Organization = 1 User (B2C pattern)
- ✅ **Email Verification**: Système de vérification email avec Resend
- ✅ **Session Management**: Gestion sécurisée des sessions utilisateur

### 🎨 UI/UX
- ✅ **16 Pages**: Dashboard, Trader Dashboard, Marketplace, Pricing, Settings, etc.
- ✅ **Shadcn/UI**: Composants UI modernes et accessibles
- ✅ **TailwindCSS v4**: Styling moderne et responsive
- ✅ **Dark Mode**: Support du mode sombre
- ✅ **Mobile-First**: Design responsive pour tous les écrans

### 🧪 Testing
- ✅ **145 Unit Tests**: Tests Vitest pour la logique métier
- ✅ **15 E2E Tests**: Tests Playwright pour les parcours critiques
- ⏳ **80%+ Coverage**: (en cours d'amélioration)

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn/UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with organization support
- **Email**: React Email with Resend
- **Payments**: Crypto payments (USDC/USDT)
- **Testing**: Vitest for unit tests, Playwright for e2e
- **Package Manager**: pnpm

## 📦 Installation

```bash
# Clone the repository
git clone git@github.com:YoannDrx/mycryptopilot.git
cd mycryptopilot

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Configure your .env.local file with:
# - DATABASE_URL (PostgreSQL)
# - AUTH providers (GitHub, Google, Discord)
# - RESEND_API_KEY (emails)
# - Crypto RPC URLs (optional for crypto payments)

# Setup database
npx prisma migrate deploy  # Apply all Prisma migrations
npx prisma migrate status   # Verify: "Database schema is up to date!"

# Seed database (optional)
pnpm prisma:seed

# Start development server
pnpm dev
```

**✅ Database Status (12 octobre 2025)**: 8 migrations Prisma appliquées avec succès. Base de données opérationnelle. Toutes les fonctionnalités (profils traders, signaux, follows, crypto payments, Discord bot) sont débloquées.

## 🛠️ Development Commands

### Core Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application
- `pnpm start` - Start production server
- `pnpm ts` - Run TypeScript type checking
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm clean` - Run lint, type check, and format code

### Testing Commands

- `pnpm test:ci` - Run unit tests in CI mode
- `pnpm test:e2e:ci` - Run e2e tests in CI mode (headless)

### Database Commands

- `pnpm prisma:seed` - Seed the database
- `pnpm better-auth:migrate` - Generate better-auth Prisma schema

## 📸 Screenshots

> 🚧 Screenshots coming soon! En attendant, découvrez les features:
> - **Dashboard User**: Vue d'ensemble des signaux suivis
> - **Dashboard Trader**: Stats et gestion des signaux publiés
> - **Marketplace**: Recherche et découverte de traders vérifiés
> - **Checkout Crypto**: Paiement USDC/USDT avec QR codes
> - **Discord Bot**: Intégration Discord avec slash commands

## 💎 Plans & Pricing

| Plan  | Prix/mois | Signaux/jour | Traders | Screener | Features                        |
| ----- | --------- | ------------ | ------- | -------- | ------------------------------- |
| Free  | $0        | 5            | 1       | 5min     | Teasers floutés                 |
| Pro   | $49       | 50           | 5       | 1min     | Console risque, Journal         |
| Ultra | $99       | ∞            | ∞       | 5sec     | Alertes custom, Filtres avancés |

## 📝 Documentation

Pour plus d'informations détaillées, consultez les fichiers suivants:

- **`.claude/CLAUDE.md`** - Instructions principales (architecture, conventions, workflow)
- **`.claude/docs/DATABASE.md`** - Schémas Prisma, migrations, queries
- **`.claude/docs/CRYPTO-PAYMENTS.md`** - HD wallet, RPC monitoring, checkout UI
- **`.claude/docs/SUBSCRIPTIONS.md`** - Gestion abonnements, Discord, Email
- **`.claude/docs/TRADING-SYSTEM.md`** - Traders, signaux, follow/unfollow
- **`.claude/docs/DEVELOPMENT.md`** - État actuel, TODOs, roadmap
- **`RAILWAY_SETUP.md`** - Guide déploiement Discord bot sur Railway
- **`ENV_CHECKLIST.md`** - Checklist complète des variables d'environnement

## 🚀 Deployment

### 📦 Vercel (Web Application)

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   pnpm add -g vercel

   # Login and deploy
   vercel login
   vercel
   ```

2. **Configure Environment Variables**

   Go to Vercel Dashboard → Project → Settings → Environment Variables

   **Required variables** (voir `ENV_CHECKLIST.md` pour la liste complète):
   - `DATABASE_URL` - Neon pooled connection
   - `DATABASE_URL_UNPOOLED` - Neon direct connection
   - `BETTER_AUTH_URL` - `https://www.mycryptopilot.app`
   - `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
   - OAuth providers (GitHub, Google, Discord)
   - `RESEND_API_KEY` - For emails
   - Crypto RPC URLs (Base, Tron)
   - Crypto XPUBs (Base, Tron) - **NEVER reuse dev keys!**

3. **Deploy**
   ```bash
   # Vercel will automatically:
   # - Generate Prisma client
   # - Deploy migrations (prisma migrate deploy)
   # - Build Next.js app
   # - Deploy to production
   vercel --prod
   ```

### 🚂 Railway (Discord Bot)

Le bot Discord tourne 24/7 sur Railway (séparé de Vercel car serverless timeout).

1. **Create Railway Project**
   - Go to https://railway.app/dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `YoannDrx/mycryptopilot`

2. **Configure Build Settings**
   - **Start Command**: `pnpm tsx scripts/start-discord-bot.ts`
   - **Build Command**: `pnpm install`

3. **Add Environment Variables**

   **Required variables** (voir `RAILWAY_SETUP.md` pour le guide complet):
   - `DISCORD_BOT_TOKEN` - From Discord Developer Portal
   - `DISCORD_GUILD_ID` - Your server ID
   - `DISCORD_BOT_ENABLED=true`
   - `DISCORD_FREE_SIGNALS_CHANNEL_ID` - Channel for signals
   - `DISCORD_LOG_CHANNEL_ID` - Channel for logs
   - Same `DATABASE_URL` as Vercel
   - Same `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` as Vercel

4. **Deploy**

   Railway auto-deploys when you add variables. Check logs:
   ```
   Discord bot logged in as MyCryptoPilot Bot#2650
   ✅ Discord slash commands registered successfully
   ```

**📄 Documentation complète**: [`RAILWAY_SETUP.md`](RAILWAY_SETUP.md)

### 🔐 Environment Variables Checklist

Pour une checklist complète des variables d'environnement:
- **Vercel**: 35+ variables
- **Railway**: 15+ variables
- **Local Dev**: `.env.local` (already configured)

**📄 Checklist complète**: [`ENV_CHECKLIST.md`](ENV_CHECKLIST.md)

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
   ```bash
   gh repo fork YoannDrx/mycryptopilot
   ```

2. **Clone your fork**
   ```bash
   git clone git@github.com:YOUR_USERNAME/mycryptopilot.git
   cd mycryptopilot
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

5. **Make your changes**
   - Follow conventions in `.claude/CLAUDE.md`
   - Read at least 3 similar files before editing
   - Add tests for new features
   - Run `pnpm clean` before committing

6. **Run tests**
   ```bash
   pnpm test:ci          # Unit tests
   pnpm test:e2e:ci      # E2E tests
   pnpm ts               # Type checking
   pnpm lint             # Linting
   ```

7. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add my new feature"
   git push origin feature/my-new-feature
   ```

8. **Open a Pull Request**
   - Go to GitHub and open a PR
   - Describe your changes
   - Wait for review

### 📐 Development Guidelines

- **TypeScript**: Strict mode, no `any` types
- **React**: Prefer Server Components over Client Components
- **API Routes**: Always use `@/lib/zod-route.ts`
- **Fetch**: Always use `@/lib/up-fetch.ts` (never raw `fetch`)
- **Server Actions**: Suffix with `.action.ts`
- **Forms**: Use React Hook Form + Zod validation
- **Testing**: Add tests for all new features

Pour plus de détails, voir [`.claude/CLAUDE.md`](.claude/CLAUDE.md#conventions-de-code)

## 🔗 Git Remotes

- `origin` → `YoannDrx/mycryptopilot` (ce projet)
- `upstream` → `Melvynx/now.ts` (template NOW.TS source)

Pour récupérer les updates du template NOW.TS:

```bash
git fetch upstream
git merge upstream/main
```

## 📄 License

MIT

## 👨‍💻 Auteur

Yoann Drx - [@YoannDrx](https://github.com/YoannDrx)
