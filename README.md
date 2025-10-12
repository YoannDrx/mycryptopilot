# MyCryptoPilot

**MyCryptoPilot** est une plateforme de trading crypto "risk-first" permettant aux utilisateurs de suivre des traders vérifiés et recevoir des signaux de trading en temps réel.

## 🎯 Concept

- **Pour les Users (Followers)**: Suivre des traders professionnels, recevoir leurs signaux de trading, gérer un journal de trading, utiliser la console de risque
- **Pour les Traders**: Publier des signaux de trading, obtenir des followers, se faire vérifier, gagner des revenus
- **Paiement**: Crypto uniquement (USDC sur Base, USDT sur Tron) avec support pro-rata

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

## 💎 Plans & Pricing

| Plan  | Prix/mois | Signaux/jour | Traders | Screener |
| ----- | --------- | ------------ | ------- | -------- |
| Free  | $0        | 5            | 1       | 5min     |
| Pro   | $49       | 50           | 5       | 1min     |
| Ultra | $99       | ∞            | ∞       | 5sec     |

## 📝 Documentation

Pour plus d'informations sur l'architecture, l'état du développement et les conventions de code, voir `.claude/CLAUDE.md`.

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
