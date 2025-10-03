# MyCryptoPilot - Analyse Complète du Projet

**Date**: 3 octobre 2025
**Version**: 1.0.0

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Schéma de Base de Données](#schéma-de-base-de-données)
4. [Features Implémentées](#features-implémentées)
5. [Features Partiellement Implémentées](#features-partiellement-implémentées)
6. [Features Manquantes](#features-manquantes)
7. [Parcours Utilisateurs Testables](#parcours-utilisateurs-testables)
8. [Parcours Utilisateurs Manquants](#parcours-utilisateurs-manquants)
9. [Points Critiques et Blocages](#points-critiques-et-blocages)
10. [Prochaines Étapes Recommandées](#prochaines-étapes-recommandées)

---

## 🎯 Vue d'ensemble

**MyCryptoPilot** est une plateforme de trading crypto "risk-first" permettant aux utilisateurs de suivre des traders vérifiés et de recevoir des signaux de trading. Le projet est basé sur le template NOW.TS et utilise un système de paiement crypto (USDC sur Base, USDT sur Tron) au lieu de Stripe traditionnel.

### Concept Principal

- **Pour les Users (Followers)**: Suivre des traders professionnels, recevoir leurs signaux de trading, gérer un journal de trading
- **Pour les Traders**: Publier des signaux de trading, obtenir des followers, se faire vérifier, gagner des revenus
- **Paiement**: Crypto uniquement (USDC/Base, USDT/Tron) avec pro-rata support

### Différence avec NOW.TS Template

Le projet a été adapté depuis le template NOW.TS (orienté SaaS multi-tenant) vers une application crypto avec:
- Système d'organisation simplifié (1 org = 1 user)
- Paiements crypto au lieu de Stripe
- Nouveaux modèles de données (Traders, Signals, Follows, CryptoPayments)
- Plans spécifiques crypto (Free, Pro, Ultra)

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend
- **Framework**: Next.js 15.5.3 (App Router)
- **React**: 19.1.1
- **UI Library**: Shadcn/UI + Radix UI primitives
- **Styling**: TailwindCSS v4.1.13
- **Animations**: Motion (Framer Motion) 12.23.12
- **State Management**:
  - Zustand (global state)
  - TanStack Query (server state)
  - nuqs (URL state)
- **Forms**: React Hook Form + Zod validation

#### Backend
- **Runtime**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL + Prisma ORM 6.15.0
- **Authentication**: Better Auth 1.3.8 (with organizations)
- **Email**: Resend + React Email 4.2.8
- **Payments**: Stripe 18.5.0 (legacy) + Crypto Payment System (new)
- **Validation**: Zod 4.1.5
- **API Client**: up-fetch 2.4.0

#### DevOps & Testing
- **Testing**: Vitest (unit) + Playwright (e2e)
- **TypeScript**: 5.9.2 (strict mode)
- **Linting**: ESLint 9.35.0
- **Formatting**: Prettier 3.6.2
- **Package Manager**: pnpm 10.14.0

### Structure du Projet

```
mycryptopilot/
├── app/                          # Next.js App Router
│   ├── (layout)/                 # Public pages layout
│   │   ├── contact/
│   │   ├── about/
│   │   ├── legal/
│   │   └── posts/
│   ├── (logged-in)/              # Authenticated user pages
│   │   └── (account-layout)/
│   │       └── account/          # Account settings
│   ├── auth/                     # Authentication pages
│   │   ├── signin/
│   │   ├── signup/
│   │   ├── verify/
│   │   └── reset-password/
│   ├── orgs/                     # Organization routes
│   │   └── [orgSlug]/
│   │       └── (navigation)/     # Sidebar layout
│   │           ├── dashboard/    # Trading dashboard ✨ NEW
│   │           │   └── trader/   # Trader dashboard ✨ NEW
│   │           ├── traders/      # Marketplace ✨ NEW
│   │           ├── pricing/      # Pricing page ✨ NEW
│   │           ├── users/
│   │           └── settings/
│   ├── admin/                    # Admin panel
│   └── api/                      # API routes
│       ├── auth/
│       ├── webhooks/
│       └── orgs/
├── src/
│   ├── components/               # UI Components
│   │   ├── ui/                   # Shadcn components
│   │   └── nowts/                # Custom components
│   ├── features/                 # Feature modules
│   │   ├── landing/
│   │   ├── dialog-manager/
│   │   ├── contact/
│   │   ├── email/
│   │   └── plans/
│   ├── lib/                      # Libraries & utilities
│   │   ├── auth/                 # Auth utilities
│   │   ├── crypto/               # Crypto payment system ✨ NEW
│   │   │   ├── mycryptopilot-plans.ts
│   │   │   ├── address-generator.ts
│   │   │   └── payment-watcher.ts
│   │   ├── actions/              # Server actions utilities
│   │   └── mail/
│   └── hooks/                    # Custom React hooks
├── prisma/
│   └── schema/
│       ├── schema.prisma         # Main schema ✨ MODIFIED
│       └── better-auth.prisma    # Auth schema ✨ MODIFIED
└── emails/                       # Email templates
```

### Configuration Environnement

#### Variables Requises

**Base de données**
- `DATABASE_URL`: PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED`: PostgreSQL direct connection

**Authentication (Better Auth)**
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (optionnel)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optionnel)
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` (optionnel)

**Email (Resend)**
- `RESEND_API_KEY`: API key Resend
- `EMAIL_FROM`: Adresse email expéditeur
- `RESEND_AUDIENCE_ID`: ID audience (optionnel)

**Paiements Stripe (Legacy)**
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key

**Paiements Crypto (Nouveau) ⚠️ NON CONFIGURÉ**
- `BASE_RPC_URL`: RPC endpoint Base network
- `TRON_RPC_URL`: RPC endpoint Tron network
- `CRYPTO_XPUB_BASE`: Extended public key pour Base (HD wallet)
- `CRYPTO_XPUB_TRON`: Extended public key pour Tron (HD wallet)

**Other**
- `NODE_ENV`: development | production | test
- `NEXT_PUBLIC_EMAIL_CONTACT`: Email de contact public

---

## 💾 Schéma de Base de Données

### Modèles Principaux

#### User (Better Auth + Extensions MyCryptoPilot)

```prisma
model User {
  id              String   @id
  name            String
  email           String   @unique
  emailVerified   Boolean
  image           String?

  // MyCryptoPilot Extensions
  userRole        UserRole @default(USER)  // USER | TRADER | BOTH
  traderProfile   TraderProfile?
  cryptoAddresses CryptoAddress[]
  cryptoPayments  CryptoPayment[]
  follows         Follow[] @relation("UserFollows")
  followers       Follow[] @relation("TraderFollowers")
  signals         Signal[]

  // Relations Better Auth
  sessions        Session[]
  accounts        Account[]
  members         Member[]
  feedbacks       Feedback[]
}
```

#### TraderProfile ✨ NOUVEAU

```prisma
model TraderProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(...)

  // Public info
  displayName     String
  bio             String?
  priceMonthlyUSD Int      @default(0)

  // Stats (JSON)
  // Format: { winrate, payoff, maxDD, nTrades, expectancy }
  statsJson       Json?

  // Certification
  verified        Boolean  @default(false)
  verifiedAt      DateTime?
}
```

#### Signal ✨ NOUVEAU

```prisma
model Signal {
  id          String   @id
  traderId    String
  trader      User     @relation(...)

  symbol      String   // "BTC-USDT", "SOL-USDT"

  // Trading card (JSON)
  // Format: { instrumentType, bias, entry, invalidation, tps, leverageBand, risk, confidence, rationales, regime, managedBy, version }
  payloadJson Json

  ttlSec      Int      // Time-to-live
  hash        String   @unique // SHA256 integrity hash

  createdAt   DateTime
  expiresAt   DateTime
}
```

#### Follow ✨ NOUVEAU

```prisma
model Follow {
  id        String       @id
  userId    String       // Follower
  user      User         @relation("UserFollows", ...)
  traderId  String       // Followed trader
  trader    User         @relation("TraderFollowers", ...)

  status    FollowStatus @default(ACTIVE) // ACTIVE | EXPIRED | CANCELLED
  startedAt DateTime
  expiresAt DateTime?

  @@unique([userId, traderId])
}
```

#### CryptoAddress ✨ NOUVEAU

```prisma
model CryptoAddress {
  id             String        @id
  userId         String
  user           User          @relation(...)

  network        CryptoNetwork // BASE | TRON | POLYGON | ETHEREUM
  address        String        @unique
  derivationPath String?       // HD wallet path
  isActive       Boolean       @default(true)

  payments       CryptoPayment[]
}
```

#### CryptoPayment ✨ NOUVEAU

```prisma
model CryptoPayment {
  id            String        @id
  userId        String
  user          User          @relation(...)
  addressId     String?
  address       CryptoAddress? @relation(...)

  network       CryptoNetwork
  txHash        String        @unique
  amountToken   Decimal       @db.Decimal(38, 18)
  amountUSD     Decimal       @db.Decimal(18, 2)
  currency      String        // USDC, USDT

  confirmations Int           @default(0)
  status        PaymentStatus @default(PENDING) // PENDING | CONFIRMED | FAILED
  confirmedAt   DateTime?

  // Plan
  plan          String        // free, pro, ultra
  daysGranted   Int           @default(30)
}
```

#### Organization (Better Auth - Simplifié pour MyCryptoPilot)

```prisma
model Organization {
  id               String        @id
  name             String
  slug             String?       @unique
  email            String?
  logo             String?
  stripeCustomerId String?

  members          Member[]
  invitations      Invitation[]
  subscription     Subscription?
}
```

#### Subscription

```prisma
model Subscription {
  id                   String       @id
  plan                 String        // free, pro, ultra
  referenceId          String       @unique  // Organization ID
  organization         Organization @relation(...)

  stripeCustomerId     String?      // Legacy Stripe
  stripeSubscriptionId String?      // Legacy Stripe

  status               String?       // active, cancelled, expired
  periodStart          DateTime?
  periodEnd            DateTime?
  cancelAtPeriodEnd    Boolean?
  seats                Int?
}
```

### Enums

```prisma
enum UserRole {
  USER    // Can follow traders
  TRADER  // Can publish signals
  BOTH    // Can do both
}

enum FollowStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

enum CryptoNetwork {
  BASE
  TRON
  POLYGON
  ETHEREUM
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  FAILED
}

enum InvoiceStatus {
  OPEN
  PAID
  EXPIRED
}
```

---

## ✅ Features Implémentées

### 1. Système d'Authentification (Complet)

**Status**: ✅ Fonctionnel

- Email/Password authentication
- OAuth providers (GitHub, Google, Discord)
- Magic links (OTP)
- Email verification
- Password reset
- Account deletion flow
- Session management
- Organization-based auth

**Files**:
- `src/lib/auth/`
- `app/auth/`
- Better Auth configuration

### 2. Système d'Organisation (Hérité de NOW.TS)

**Status**: ✅ Fonctionnel (simplifié 1:1)

- Organization creation (1 per user)
- Member management
- Roles & permissions (admin, member, owner)
- Organization settings
- Invitations
- Organization switcher (adapté pour single org)

**Files**:
- `app/orgs/[orgSlug]/(navigation)/settings/`
- `src/lib/auth/auth-org.ts`
- `src/lib/organizations/`

### 3. Système de Plans & Pricing

**Status**: ✅ Implémenté (structure complète)

**Plans MyCryptoPilot**:

| Plan | Prix | Signaux/jour | Traders | Screener Refresh | Features |
|------|------|--------------|---------|------------------|----------|
| Free | $0 | 5 | 1 | 5min | Teasers floutés |
| Pro | $49 | 50 | 5 | 1min | Console risque, Journal ⭐ Popular |
| Ultra | $99 | ∞ | ∞ | 5sec | Alertes custom, Filtres avancés |

**Fonctionnalités**:
- 3 plans configurés avec limites
- Calcul pro-rata des paiements
- Auto-détection du plan depuis le montant
- Fonction de vérification des limites
- UI pricing page (créée récemment)

**Files**:
- `src/lib/crypto/mycryptopilot-plans.ts` ✅
- `app/orgs/[orgSlug]/(navigation)/pricing/page.tsx` ✅

### 4. Système de Paiement Crypto (Structure)

**Status**: ⚠️ Structure créée, NON fonctionnel (placeholders)

**Implémenté**:
- ✅ Schéma DB (CryptoAddress, CryptoPayment)
- ✅ Générateur d'adresses HD (structure)
- ✅ Payment watcher (structure)
- ✅ Gestion des confirmations
- ✅ Pro-rata payment support
- ✅ Auto-activation subscription

**Non implémenté** (TODO):
- ❌ Dérivation réelle HD wallet (ethers.js/tronweb)
- ❌ Appels RPC Base/Tron pour détecter paiements
- ❌ Monitoring on-chain en temps réel
- ❌ Configuration des xpub keys
- ❌ UI pour afficher adresses de paiement

**Files**:
- `src/lib/crypto/address-generator.ts` ⚠️ (placeholders)
- `src/lib/crypto/payment-watcher.ts` ⚠️ (placeholders)

### 5. UI Dashboard & Navigation

**Status**: ✅ UI créée, ❌ Données non connectées

**Pages créées récemment**:

1. **Dashboard User** (`/dashboard`)
   - ✅ Stats cards (signaux actifs, traders suivis, plan)
   - ✅ Alert pour suivre des traders
   - ✅ Tabs (Signals Feed, Trading Journal, Performance)
   - ✅ Quick actions
   - ❌ Fetch données réelles (TODOs présents)

2. **Dashboard Trader** (`/dashboard/trader`)
   - ✅ Stats trader (followers, signaux, win rate, revenue)
   - ✅ Trader verification status card
   - ✅ Tabs (My Signals, Performance, Revenue)
   - ✅ Quick actions
   - ❌ Fetch données réelles (TODOs présents)

3. **Traders Marketplace** (`/traders`)
   - ✅ Search & filters UI
   - ✅ Stats overview cards
   - ✅ Trader cards grid (placeholder data)
   - ✅ Empty state UI
   - ✅ CTA section "Become a Trader"
   - ❌ Fetch traders from DB (TODO)
   - ❌ Search/filter functionality (TODO)
   - ❌ Pagination (TODO)

4. **Pricing Page** (`/pricing`)
   - ✅ 3 plans cards
   - ✅ Features comparison
   - ✅ FAQ section
   - ✅ Crypto payment badges
   - ✅ Responsive design

**Navigation Sidebar**:
- ✅ Ajout des liens vers nouvelles pages
- ✅ Groupes "Menu", "Trader", "Account"
- ✅ Icons adaptées (BarChart3, Users, DollarSign, TrendingUp)

**Files**:
- `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx` ✅⚠️
- `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx` ✅⚠️
- `app/orgs/[orgSlug]/(navigation)/traders/page.tsx` ✅⚠️
- `app/orgs/[orgSlug]/(navigation)/pricing/page.tsx` ✅
- `app/orgs/[orgSlug]/(navigation)/_navigation/org-navigation.links.ts` ✅

### 6. Admin Panel

**Status**: ✅ Fonctionnel (hérité de NOW.TS)

- Users management
- Organizations management
- Feedback viewing
- Payment history (Stripe legacy)

**Files**:
- `app/admin/`

### 7. Email System

**Status**: ✅ Fonctionnel

- React Email templates
- Resend integration
- Contact forms
- Email verification
- Password reset emails
- Audience sync avec Resend

**Files**:
- `emails/`
- `src/lib/mail/`
- `src/features/email/`

### 8. Landing Page

**Status**: ⚠️ Template "Threader" non adapté

- ✅ Composants fonctionnels (Hero, Features, FAQ, Reviews, etc.)
- ❌ Contenu encore "Threader" au lieu de "MyCryptoPilot"
- ❌ Images placeholder
- ❌ Reviews non pertinentes

**À adapter**:
- Contenu spécifique crypto trading
- Images et screenshots de l'app
- Reviews de traders
- Features MyCryptoPilot

**Files**:
- `app/page.tsx`
- `src/features/landing/`

---

## ⚠️ Features Partiellement Implémentées

### 1. Crypto Payment System

**Ce qui existe**:
- ✅ Schéma DB complet
- ✅ Structure de code (address-generator, payment-watcher)
- ✅ Logique pro-rata
- ✅ Auto-activation subscription

**Ce qui manque**:
- ❌ Implémentation réelle HD wallet derivation
  - `deriveBaseAddress()` retourne placeholder
  - `deriveTronAddress()` retourne placeholder
  - Besoin d'intégrer ethers.js pour Base
  - Besoin d'intégrer tronweb pour Tron

- ❌ Détection des paiements on-chain
  - `checkBaseAddress()` retourne []
  - `checkTronAddress()` retourne []
  - Besoin d'appels RPC vers Base/Tron
  - Besoin de parser Transfer events (USDC/USDT)

- ❌ Configuration environnement
  - `BASE_RPC_URL` non configuré
  - `TRON_RPC_URL` non configuré
  - `CRYPTO_XPUB_BASE` non configuré
  - `CRYPTO_XPUB_TRON` non configuré

- ❌ UI Paiement
  - Pas de page pour afficher adresses crypto
  - Pas de QR codes
  - Pas de monitoring status paiement en temps réel
  - Pas d'historique paiements crypto

**TODOs dans le code**:
```typescript
// src/lib/crypto/address-generator.ts:137
// TODO: Implement actual HD wallet derivation using ethers.js or web3.js

// src/lib/crypto/address-generator.ts:184
// TODO: Implement actual HD wallet derivation using tronweb

// src/lib/crypto/payment-watcher.ts:81
// TODO: Implement actual Base/Ethereum RPC calls using ethers.js

// src/lib/crypto/payment-watcher.ts:120
// TODO: Implement actual Tron RPC calls using tronweb
```

**Priorité**: 🔴 CRITIQUE - Nécessaire pour accepter des paiements

### 2. Dashboard Pages (UI vs Data)

**Ce qui existe**:
- ✅ UI complète et responsive
- ✅ Components Shadcn/UI intégrés
- ✅ Layout avec sidebar navigation
- ✅ Tabs, cards, stats display
- ✅ Empty states

**Ce qui manque**:
- ❌ Fetch données depuis DB
- ❌ Server actions pour les mutations
- ❌ Loading states
- ❌ Error handling

**TODOs dans le code**:
```typescript
// app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx:31-33
// TODO: Fetch user's followed traders
// TODO: Fetch recent signals from followed traders
// TODO: Fetch user's trading stats

// app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx:29-33
// TODO: Fetch trader profile
// TODO: Fetch trader's signals
// TODO: Fetch trader's stats (winrate, payoff, etc.)
// TODO: Fetch followers count
// TODO: Fetch revenue stats

// app/orgs/[orgSlug]/(navigation)/traders/page.tsx:30-32
// TODO: Fetch traders from database
// TODO: Implement search and filters
// TODO: Add pagination
```

**Priorité**: 🟡 HAUTE - UI existe mais inutilisable sans données

### 3. Landing Page Adaptation

**Ce qui existe**:
- ✅ Structure complète de landing
- ✅ Tous les composants fonctionnels
- ✅ Responsive design
- ✅ Animations

**Ce qui manque**:
- ❌ Contenu adapté à MyCryptoPilot
- ❌ Copy crypto-trading (actuellement "Threader")
- ❌ Images et screenshots de l'app
- ❌ Reviews pertinentes pour crypto traders
- ❌ Features section adaptée aux signaux trading

**Priorité**: 🟢 MOYENNE - Marketing, pas bloquant fonctionnellement

---

## ❌ Features Manquantes

### 1. Trader Profile Management

**Description**: Système pour créer et gérer un profil trader

**Ce qui manque**:
- ❌ Page création profil trader
- ❌ Formulaire profil (displayName, bio, priceMonthlyUSD)
- ❌ Upload avatar trader
- ❌ Server action `createTraderProfile()`
- ❌ Server action `updateTraderProfile()`
- ❌ Validation Zod schema
- ❌ UI édition profil dans settings
- ❌ Switch USER ↔ TRADER ↔ BOTH

**DB**: ✅ Schema exists (`TraderProfile`)

**Priorité**: 🔴 CRITIQUE - Pas de traders sans profil

### 2. Signal Publication System

**Description**: Interface pour que les traders publient des signaux

**Ce qui manque**:
- ❌ Page création signal (`/dashboard/trader/signals/new`)
- ❌ Formulaire signal (symbol, bias, entry, TPs, etc.)
- ❌ Validation des champs trading
- ❌ Génération hash SHA256 intégrité
- ❌ Server action `createSignal()`
- ❌ Upload de screenshots (optionnel)
- ❌ Prévisualisation carte de trading
- ❌ TTL (time-to-live) management

**DB**: ✅ Schema exists (`Signal`)

**Priorité**: 🔴 CRITIQUE - Core feature du produit

### 3. Signal Feed & Display

**Description**: Affichage des signaux pour les followers

**Ce qui manque**:
- ❌ Liste des signaux dans dashboard user
- ❌ Composant `TradingCard` pour afficher signal
- ❌ Filtres (par trader, par crypto, par date)
- ❌ Real-time updates (websockets ou polling)
- ❌ Notification nouveaux signaux
- ❌ Signal expiration handling (TTL)
- ❌ Historique des signaux expirés

**DB**: ✅ Schema exists

**Priorité**: 🔴 CRITIQUE - Raison d'être du produit

### 4. Follow/Unfollow System

**Description**: Système pour suivre/unfollow des traders

**Ce qui manque**:
- ❌ Bouton "Follow" sur profil trader
- ❌ Bouton "Unfollow"
- ❌ Server action `followTrader()`
- ❌ Server action `unfollowTrader()`
- ❌ Vérification limites plan (max traders)
- ❌ Liste "Following" dans settings
- ❌ Liste "Followers" pour trader
- ❌ Expiration automatique follow

**DB**: ✅ Schema exists (`Follow`)

**Priorité**: 🔴 CRITIQUE - Connexion trader-follower

### 5. Trading Journal

**Description**: Journal personnel pour tracker ses trades

**Ce qui manque**:
- ❌ Modèle DB `Trade` ou `JournalEntry`
- ❌ Page journal (`/dashboard/journal`)
- ❌ Formulaire ajout trade
- ❌ Calculs stats (winrate, payoff, expectancy)
- ❌ Graphiques performance (equity curve)
- ❌ Export CSV/JSON
- ❌ Tags et notes sur trades
- ❌ Upload screenshots

**DB**: ❌ Schema missing (à créer)

**Priorité**: 🟡 HAUTE - Feature Pro/Ultra plan

### 6. Risk Console

**Description**: Calculateur de position et gestion du risque

**Ce qui manque**:
- ❌ Page console risque (`/dashboard/risk`)
- ❌ Calculateur taille position
- ❌ Calculateur R:R (risk/reward)
- ❌ Calculateur stop loss / take profit
- ❌ Portfolio risk display
- ❌ Correlation matrix (plan Ultra)
- ❌ Position sizing recommandations

**DB**: ❌ Potentiellement besoin modèle `Portfolio` ou `Position`

**Priorité**: 🟡 HAUTE - Feature Pro/Ultra plan

### 7. Screeners & Market Data

**Description**: Screeners temps réel pour crypto

**Ce qui manque**:
- ❌ Page screeners (`/dashboard/screeners`)
- ❌ Intégration API market data (CoinGecko, Binance, etc.)
- ❌ Tableaux avec sorting/filtering
- ❌ Refresh intervals basés sur plan
- ❌ Alerts sur conditions custom (plan Ultra)
- ❌ Funding rates display
- ❌ Open Interest display
- ❌ Correlation analysis (plan Ultra)

**DB**: ❌ Possiblement modèle `MarketData` pour cache

**Priorité**: 🟡 HAUTE - Feature différenciatrice

### 8. Verification System (Traders)

**Description**: Système de vérification des traders

**Ce qui manque**:
- ❌ Admin UI pour approuver traders
- ❌ Critères de vérification (10+ signaux, 5+ followers)
- ❌ Page demande vérification
- ❌ Badge "Verified" sur profil
- ❌ Server action `verifyTrader()` (admin)
- ❌ Email notification vérification
- ❌ Affichage stats pour vérification

**DB**: ✅ Fields exist (`verified`, `verifiedAt`)

**Priorité**: 🟢 MOYENNE - Quality control

### 9. Revenue System (Traders)

**Description**: Système de revenus pour traders

**Ce qui manque**:
- ❌ Modèle DB `TraderRevenue` ou intégration dans `Follow`
- ❌ Calcul revenus (prix trader × followers actifs)
- ❌ Dashboard revenus (déjà UI créée, manque data)
- ❌ Payout system (withdraw crypto)
- ❌ Revenue share avec plateforme
- ❌ Historique transactions
- ❌ Tax reporting tools

**DB**: ❌ Schema missing pour revenus

**Priorité**: 🟢 MOYENNE - Monétisation traders

### 10. Notifications System

**Description**: Notifications push/email pour événements

**Ce qui manque**:
- ❌ Modèle DB `Notification`
- ❌ UI notifications (bell icon, dropdown)
- ❌ Email notifications
- ❌ Push notifications (web push API)
- ❌ Préférences notifications dans settings
- ❌ Types: nouveau signal, nouveau follower, payment confirmed
- ❌ Mark as read functionality

**DB**: ❌ Schema missing

**Priorité**: 🟢 MOYENNE - User engagement

### 11. Search & Filters (Traders)

**Description**: Recherche et filtres avancés traders

**Ce qui manque**:
- ❌ Search bar fonctionnelle (UI existe)
- ❌ Filters par: verified, winrate, profit factor, followers
- ❌ Sort par: winrate, followers, recent, price
- ❌ Server action `searchTraders()`
- ❌ Debounced search
- ❌ Pagination (UI existe, logic manque)

**DB**: ✅ Data exists, besoin queries optimisées

**Priorité**: 🟡 HAUTE - UX critique marketplace

### 12. Admin Tools (Crypto Payments)

**Description**: Admin interface pour gérer paiements crypto

**Ce qui manque**:
- ❌ Page admin crypto payments (`/admin/crypto-payments`)
- ❌ Liste tous les paiements
- ❌ Statut confirmations
- ❌ Retry failed payments
- ❌ Manual confirmation (si besoin)
- ❌ Refund system
- ❌ Analytics revenue crypto

**DB**: ✅ Schema exists

**Priorité**: 🟢 MOYENNE - Admin tools

---

## 🧪 Parcours Utilisateurs Testables

### ✅ Parcours Complètement Fonctionnels

#### 1. Inscription & Authentification

**Steps**:
1. Visiteur arrive sur landing page
2. Clique "Sign Up"
3. Remplit email/password
4. Reçoit email de vérification
5. Clique lien dans email
6. Email vérifié → Redirect vers onboarding
7. Organisation créée automatiquement (1:1)
8. Accès au dashboard

**Status**: ✅ Testable de bout en bout

**Files**:
- `app/auth/signup/page.tsx`
- `app/auth/verify/page.tsx`
- `app/auth/new-user/page.tsx`

**Notes**:
- OAuth (GitHub, Google, Discord) aussi fonctionnel
- Magic links fonctionnels
- Password reset fonctionnel

---

#### 2. Connexion & Déconnexion

**Steps**:
1. User sur `/auth/signin`
2. Entre email/password
3. Connexion réussie
4. Redirect vers `/orgs/[slug]`
5. Clique profil → Logout
6. Session terminée

**Status**: ✅ Testable

---

#### 3. Gestion du Compte

**Steps**:
1. User connecté
2. Va dans Account Settings (`/account`)
3. Peut modifier:
   - Nom
   - Email (avec verification)
   - Password
   - Photo de profil
4. Peut supprimer compte (avec confirmation)

**Status**: ✅ Testable

**Files**:
- `app/(logged-in)/(account-layout)/account/`

---

#### 4. Gestion Organisation

**Steps**:
1. User dans `/orgs/[slug]/settings`
2. Peut modifier:
   - Nom organisation
   - Logo
   - Slug
3. Peut gérer membres (invite, remove)
4. Peut voir billing (Stripe legacy)

**Status**: ✅ Testable (Stripe billing)

**Note**: ⚠️ Billing Stripe legacy, pas crypto

---

#### 5. Consultation Pricing

**Steps**:
1. User visite `/pricing` ou `/orgs/[slug]/pricing`
2. Voit 3 plans (Free, Pro, Ultra)
3. Compare features
4. Lit FAQ
5. Voit badges crypto payment

**Status**: ✅ Testable (UI seulement)

**Note**: ⚠️ Boutons "Subscribe" non fonctionnels (crypto payment manquant)

---

#### 6. Contact & Support

**Steps**:
1. User sur `/contact`
2. Remplit formulaire (name, email, message)
3. Submit
4. Email envoyé à l'équipe
5. Confirmation affichée

**Status**: ✅ Testable

**Files**:
- `app/(layout)/contact/page.tsx`
- `src/features/contact/`

---

#### 7. Admin - Voir Feedbacks

**Steps**:
1. Admin connecté
2. Va sur `/admin/feedback`
3. Voit liste des feedbacks
4. Peut cliquer pour détails
5. Peut voir user associé

**Status**: ✅ Testable

**Files**:
- `app/admin/feedback/page.tsx`

---

#### 8. Admin - Gérer Users

**Steps**:
1. Admin sur `/admin/users`
2. Voit liste tous les users
3. Peut voir détails user
4. Peut voir leurs organizations
5. Peut voir leurs paiements (Stripe)

**Status**: ✅ Testable

---

### ⚠️ Parcours Partiellement Fonctionnels (UI OK, Data KO)

#### 9. Consulter Dashboard User

**Steps**:
1. User connecté va sur `/orgs/[slug]/dashboard`
2. Voit UI avec:
   - Stats cards (0 signaux, 0 traders)
   - Alert "Follow traders"
   - Tabs (Signals, Journal, Performance)
   - Empty states
3. Clique boutons → Rien ne se passe (pas de données)

**Status**: ⚠️ UI testable, fonctionnalité non testable

**Blocage**:
- Pas de fetch traders
- Pas de fetch signals
- Pas de stats réelles

---

#### 10. Consulter Dashboard Trader

**Steps**:
1. Trader connecté va sur `/orgs/[slug]/dashboard/trader`
2. Voit UI avec:
   - Stats trader (tous à 0)
   - Verification status "Not Verified"
   - Tabs (Signals, Performance, Revenue)
   - Empty states
3. Clique "Create Signal" → Rien ne se passe

**Status**: ⚠️ UI testable, fonctionnalité non testable

**Blocage**:
- Pas de profil trader (pas de formulaire)
- Pas de création signal
- Pas de données réelles

---

#### 11. Explorer Marketplace Traders

**Steps**:
1. User va sur `/orgs/[slug]/traders`
2. Voit:
   - Search bar (non fonctionnel)
   - Filters (non fonctionnels)
   - Stats "0 traders"
   - Empty state "No traders yet"
3. Clique "Become a Trader" → Rien ne se passe

**Status**: ⚠️ UI testable, fonctionnalité non testable

**Blocage**:
- Pas de traders dans DB
- Pas de formulaire création profil trader
- Pas de recherche/filtre fonctionnel

---

### ❌ Parcours Non Testables (Bloqués)

#### 12. S'abonner avec Crypto

**Steps** (théoriques):
1. User veut passer Pro
2. Clique "Subscribe" sur pricing
3. → BLOQUÉ: pas de page paiement crypto
4. (Théorique) Voit adresse USDC Base
5. (Théorique) Scan QR code
6. (Théorique) Envoie 49 USDC
7. (Théorique) Attend confirmations
8. (Théorique) Subscription activée auto

**Status**: ❌ Non testable

**Blocage**:
- Crypto payment system non implémenté
- Pas de UI paiement crypto
- Pas de génération adresses
- Pas de monitoring blockchain

---

#### 13. Créer Profil Trader

**Steps** (théoriques):
1. User veut devenir trader
2. Clique "Become a Trader"
3. → BLOQUÉ: pas de page/formulaire
4. (Théorique) Remplit: displayName, bio, price
5. (Théorique) Upload avatar
6. (Théorique) Submit
7. (Théorique) Profil créé, `userRole` → TRADER

**Status**: ❌ Non testable

**Blocage**:
- Pas de formulaire création profil
- Pas de server action

---

#### 14. Publier un Signal

**Steps** (théoriques):
1. Trader clique "Create Signal"
2. → BLOQUÉ: pas de page/formulaire
3. (Théorique) Remplit signal form:
   - Symbol (BTC-USDT)
   - Bias (LONG/SHORT)
   - Entry price
   - Invalidation
   - TPs
   - Confidence, risk, rationales
4. (Théorique) Preview carte
5. (Théorique) Submit
6. (Théorique) Signal publié, visible pour followers

**Status**: ❌ Non testable

**Blocage**:
- Pas de formulaire signal
- Pas de server action `createSignal`
- Pas de validation schema

---

#### 15. Suivre un Trader

**Steps** (théoriques):
1. User voit trader dans marketplace
2. Clique "Follow"
3. → BLOQUÉ: bouton non fonctionnel
4. (Théorique) Server vérifie limites plan
5. (Théorique) Crée `Follow` record
6. (Théorique) User voit signaux de ce trader

**Status**: ❌ Non testable

**Blocage**:
- Pas de server action `followTrader`
- Pas de traders à suivre
- Pas de vérification limites

---

#### 16. Recevoir Signaux

**Steps** (théoriques):
1. User a suivi des traders
2. Trader publie signal
3. → BLOQUÉ: pas de feed
4. (Théorique) Signal apparaît dans dashboard
5. (Théorique) Notification envoyée
6. (Théorique) User voit carte de trading complète

**Status**: ❌ Non testable

**Blocage**:
- Pas de signal feed
- Pas de composant TradingCard
- Pas de notifications

---

#### 17. Gérer Journal de Trading

**Steps** (théoriques):
1. User clique tab "Trading Journal"
2. → BLOQUÉ: pas de données, pas de formulaire
3. (Théorique) Clique "Add Trade"
4. (Théorique) Remplit trade details
5. (Théorique) Voit stats calculées
6. (Théorique) Voit equity curve

**Status**: ❌ Non testable

**Blocage**:
- Pas de modèle DB Trade
- Pas de formulaire ajout trade
- Pas de calculs stats

---

#### 18. Utiliser Risk Console

**Steps** (théoriques):
1. User Pro/Ultra clique "Risk Console"
2. → BLOQUÉ: pas de page
3. (Théorique) Entre capital, risk %
4. (Théorique) Entre entry, stop
5. (Théorique) Voit taille position calculée
6. (Théorique) Voit R:R ratio

**Status**: ❌ Non testable

**Blocage**:
- Pas de page risk console
- Pas de calculateurs

---

#### 19. Utiliser Screeners

**Steps** (théoriques):
1. User clique "Screeners"
2. → BLOQUÉ: pas de page
3. (Théorique) Voit tableau cryptos
4. (Théorique) Sort par volume, change%
5. (Théorique) Filtre par market cap
6. (Théorique) Voit refresh rate selon plan

**Status**: ❌ Non testable

**Blocage**:
- Pas de page screeners
- Pas d'intégration market data API

---

#### 20. Demander Vérification Trader

**Steps** (théoriques):
1. Trader a 10+ signaux, 5+ followers
2. Clique "Request Verification"
3. → BLOQUÉ: pas de page/bouton
4. (Théorique) Admin reçoit demande
5. (Théorique) Admin approuve
6. (Théorique) Badge "Verified" ajouté

**Status**: ❌ Non testable

**Blocage**:
- Pas de système vérification
- Pas d'admin UI pour approuver

---

## 🔴 Points Critiques et Blocages

### Blocage Niveau 1: CRITIQUE (Bloque Core Functionality)

#### 1. Crypto Payment System Non Fonctionnel

**Impact**: ⛔ Impossible d'accepter des paiements

**Problème**:
- Générateur d'adresses utilise placeholders
- Payment watcher ne détecte rien
- Pas d'appels RPC blockchain
- Variables d'environnement manquantes

**Solution**:
1. Intégrer `ethers.js` pour Base (USDC)
2. Intégrer `tronweb` pour Tron (USDT)
3. Configurer xpub keys pour HD wallet
4. Implémenter RPC calls (Base/Tron)
5. Créer UI page paiement avec adresses + QR
6. Tester end-to-end avec testnet

**Effort estimé**: 3-5 jours (1 dev)

**Dependencies**:
- Compte Base Mainnet RPC (Alchemy, Infura)
- Compte Tron RPC (TronGrid)
- HD wallet setup (xpub generation)
- Environnement de test (testnets)

---

#### 2. Aucune Fonctionnalité Signal

**Impact**: ⛔ Produit inutilisable (raison d'être)

**Problème**:
- Pas de création signal
- Pas de feed signal
- Pas de composant TradingCard
- Pas de follow/unfollow

**Solution**:
1. Créer formulaire signal avec validation Zod
2. Server action `createSignal()` avec hash SHA256
3. Composant `<TradingCard>` pour display
4. Page feed avec filtres et pagination
5. System follow/unfollow avec vérif limites
6. Real-time updates (polling ou websockets)

**Effort estimé**: 5-7 jours (1 dev)

**Dependencies**:
- UX/UI design carte de trading
- Définition précise payload signal
- Stratégie real-time (polling vs WS)

---

#### 3. Pas de Profil Trader

**Impact**: ⛔ Impossible de devenir trader

**Problème**:
- Pas de formulaire création profil
- Pas de UI édition profil
- Pas de switch USER/TRADER

**Solution**:
1. Page `/account/become-trader` avec formulaire
2. Schema Zod validation (displayName, bio, price)
3. Server actions `createTraderProfile()`, `updateTraderProfile()`
4. Upload avatar (système déjà présent)
5. Toggle USER ↔ TRADER dans settings
6. Update `userRole` enum

**Effort estimé**: 2-3 jours (1 dev)

**Dependencies**:
- Aucune (DB schema existe)

---

### Blocage Niveau 2: HAUTE (Limite Functionality)

#### 4. Dashboard Pages Sans Données

**Impact**: 🟡 UI existe mais inutilisable

**Problème**:
- Tous les TODOs "Fetch data"
- Pas de server actions
- Pas de loading states

**Solution**:
1. Créer server actions pour fetch:
   - `getUserStats()`
   - `getTraderStats()`
   - `getFollowedTraders()`
   - `getTraderSignals()`
2. Intégrer dans pages avec Suspense
3. Ajouter loading skeletons
4. Error boundaries

**Effort estimé**: 2-3 jours (1 dev)

**Dependencies**:
- Signals system fonctionnel
- Follow system fonctionnel

---

#### 5. Search & Filters Non Fonctionnels

**Impact**: 🟡 Marketplace inutilisable si > 10 traders

**Problème**:
- Search bar UI seulement
- Filters UI seulement
- Pagination UI seulement

**Solution**:
1. Server action `searchTraders()` avec Prisma
2. Debounced search avec `nuqs`
3. Filters: verified, winrate, followers, price
4. Sort: winrate, followers, recent
5. Cursor pagination (efficient)
6. Cache avec TanStack Query

**Effort estimé**: 2 jours (1 dev)

**Dependencies**:
- Trader profiles existent en DB

---

### Blocage Niveau 3: MOYENNE (Nice to Have)

#### 6. Landing Page Outdated

**Impact**: 🟢 Marketing, pas fonctionnel

**Problème**:
- Contenu "Threader" template
- Reviews non pertinentes
- Images placeholder

**Solution**:
1. Réécrire copy pour crypto/trading
2. Remplacer reviews avec témoignages traders
3. Screenshots/video démos de l'app
4. Features section adaptée (signaux, risk console, etc.)
5. FAQ crypto-spécifique

**Effort estimé**: 1-2 jours (content + dev)

**Dependencies**:
- App fonctionnelle pour screenshots

---

#### 7. Features Premium Non Implémentées

**Impact**: 🟢 Plans Pro/Ultra incomplets

**Problèmes**:
- Risk Console manquant
- Trading Journal manquant
- Screeners manquants
- Alerts custom manquantes

**Solutions**: (séparées)

**7a. Risk Console**
- Page `/dashboard/risk`
- Calculateurs: position size, R:R, stop/TP
- Portfolio risk view
- Effort: 3-4 jours

**7b. Trading Journal**
- Modèle DB `Trade`
- Formulaire ajout trade
- Calculs stats (winrate, payoff, expectancy)
- Equity curve chart (recharts)
- Effort: 4-5 jours

**7c. Screeners**
- Intégration API (CoinGecko, Binance)
- Tableaux avec filters/sort
- Refresh intervals par plan
- Cache market data
- Effort: 5-6 jours

**7d. Alerts Custom**
- Modèle DB `Alert`
- Page gestion alerts
- Background job monitoring
- Notifications (email, push)
- Effort: 4-5 jours

---

### Dépendances Techniques Manquantes

#### Intégrations Externes

1. **Blockchain RPCs**
   - Base RPC endpoint (Alchemy, Infura, ou self-hosted)
   - Tron RPC endpoint (TronGrid)
   - Cost: ~$50-200/mois selon usage

2. **Market Data API**
   - CoinGecko API (free tier limité)
   - Binance API (gratuit mais rate limited)
   - Alternative: CoinMarketCap Pro
   - Cost: $0-500/mois

3. **Real-time Infrastructure**
   - WebSockets pour signals feed (optionnel)
   - Alternative: polling toutes les 5-10sec
   - Cost: complexité dev

4. **HD Wallet Libraries**
   - `ethers` v6 (pour Base/Ethereum)
   - `tronweb` (pour Tron)
   - Cost: gratuit (npm packages)

---

## 🚀 Prochaines Étapes Recommandées

### Phase 1: MVP Fonctionnel (2-3 semaines)

**Objectif**: App minimale utilisable end-to-end

#### Semaine 1: Crypto Payments + Profils Traders

**Jour 1-3: Crypto Payment System**
1. Intégrer ethers.js + tronweb
2. Implémenter HD wallet derivation (Base + Tron)
3. Configurer xpub keys (testnet puis mainnet)
4. Implémenter RPC calls monitoring
5. Tester avec testnets (Base Sepolia, Tron Shasta)

**Jour 4-5: UI Paiement Crypto**
1. Page `/pricing/checkout` avec sélection plan
2. Affichage adresses crypto (Base + Tron)
3. QR codes génération
4. Polling status paiement en temps réel
5. Confirmation page après payment

**Jour 6-7: Profils Traders**
1. Page `/account/become-trader`
2. Formulaire création profil (displayName, bio, price)
3. Server actions create/update
4. Upload avatar
5. Toggle USER ↔ TRADER

**Livrable**: ✅ Users peuvent payer en crypto ✅ Users peuvent devenir traders

---

#### Semaine 2: Signals Core Functionality

**Jour 1-3: Création Signals**
1. Page `/dashboard/trader/signals/new`
2. Formulaire signal complet:
   - Symbol (select crypto)
   - Bias (LONG/SHORT)
   - Entry price
   - Invalidation level
   - Take profits (array)
   - Leverage band
   - Risk level (1-5)
   - Confidence (%)
   - Rationales (text)
3. Validation Zod schema
4. Génération hash SHA256
5. Server action `createSignal()`
6. TTL management (24h default)

**Jour 4-5: Display Signals**
1. Composant `<TradingCard>` avec design crypto
2. Display tous les champs du signal
3. Couleurs LONG (green) / SHORT (red)
4. Badge TTL countdown
5. Trader info (avatar, name, verified)

**Jour 6-7: Feed Signals**
1. Page `/dashboard` - fetch signals
2. Filtres: par trader, par crypto, par date
3. Sort: récent, expiring soon
4. Pagination cursor-based
5. Empty states

**Livrable**: ✅ Traders peuvent publier signals ✅ Users voient les signals

---

#### Semaine 3: Follow System + Data Integration

**Jour 1-2: Follow/Unfollow**
1. Server action `followTrader(userId, traderId)`
2. Vérification limites plan (1 pour Free, 5 pour Pro, ∞ pour Ultra)
3. Bouton "Follow" sur profil trader
4. Bouton "Unfollow"
5. Liste "Following" dans settings
6. Liste "Followers" pour trader

**Jour 3-4: Dashboard Data Integration**
1. Fetch user stats (followers, signals count)
2. Fetch trader stats (followers, revenue, winrate)
3. Remplacer tous les TODOs par vrais fetches
4. Loading states
5. Error handling

**Jour 5-7: Marketplace Functional**
1. Fetch traders from DB avec stats
2. Search by name (debounced)
3. Filters: verified, winrate min, price range
4. Sort: winrate, followers, recent
5. Pagination (20 per page)
6. Trader cards cliquables → profil détail

**Livrable**: ✅ Parcours complet end-to-end fonctionnel

---

### Phase 2: Features Premium (3-4 semaines)

**Objectif**: Justifier plans Pro et Ultra

#### Semaine 4-5: Trading Journal

1. Modèle DB `Trade`:
   - userId, symbol, side (LONG/SHORT)
   - entryPrice, exitPrice, quantity
   - entryDate, exitDate
   - pnl, pnlPercent
   - notes, tags
2. Page `/dashboard/journal`
3. Formulaire ajout trade
4. Liste trades avec filtres
5. Calculs stats:
   - Winrate
   - Payoff ratio
   - Expectancy
   - Max drawdown
6. Graphique equity curve (recharts)
7. Export CSV

---

#### Semaine 6: Risk Console

1. Page `/dashboard/risk`
2. Calculateur position size:
   - Input: capital, risk%, entry, stop
   - Output: quantity, $ risk
3. Calculateur R:R:
   - Input: entry, stop, TPs
   - Output: R:R ratios
4. Portfolio risk view (si multiple positions)
5. Suggestions position sizing

---

#### Semaine 7-8: Screeners + Market Data

1. Intégration API (CoinGecko ou Binance)
2. Page `/dashboard/screeners`
3. Tableaux:
   - Top gainers/losers 24h
   - Volume leaders
   - Trending coins
4. Sort, filters
5. Refresh intervals par plan:
   - Free: 5min
   - Pro: 1min
   - Ultra: 5sec
6. Cache avec Redis (optionnel)

---

### Phase 3: Polish & Scale (2-3 semaines)

**Objectif**: Production-ready

#### Semaine 9: Notifications

1. Modèle DB `Notification`
2. Bell icon avec dropdown
3. Email notifications (Resend)
4. Push notifications (optionnel)
5. Préférences dans settings

---

#### Semaine 10: Verification & Admin

1. Critères vérification traders
2. Page demande vérification
3. Admin UI approval
4. Badge verified
5. Admin crypto payments management

---

#### Semaine 11: Landing Page

1. Réécriture copy MyCryptoPilot
2. Screenshots/videos
3. Testimonials traders
4. Features section adaptée
5. FAQ crypto

---

#### Semaine 12: Testing & Bug Fixes

1. Tests e2e Playwright (parcours critiques)
2. Tests unitaires (server actions)
3. Performance optimization
4. Security audit
5. Bug fixes

---

## 📊 Résumé Chiffré

### Code Stats

- **Total files**: ~337 files (150 app/, 187 src/)
- **TODO comments**: 18
- **Pages créées**: 55+ pages
- **API routes**: 6 routes
- **Server actions**: 7 fichiers

### Features Stats

| Catégorie | Implémentées | Partielles | Manquantes | Total |
|-----------|--------------|------------|------------|-------|
| Auth & Users | 8 | 0 | 0 | 8 |
| Organizations | 5 | 0 | 0 | 5 |
| Payments | 1 (Stripe) | 1 (Crypto) | 0 | 2 |
| Traders | 0 | 1 (UI) | 4 | 5 |
| Signals | 0 | 1 (UI) | 3 | 4 |
| Trading Tools | 0 | 0 | 3 | 3 |
| Admin | 4 | 1 | 1 | 6 |
| **TOTAL** | **18** | **4** | **11** | **33** |

### Effort Estimation

| Phase | Features | Effort (jours) | Priority |
|-------|----------|----------------|----------|
| Phase 1: MVP | Crypto pay + Traders + Signals + Follow | 15-20 | 🔴 CRITIQUE |
| Phase 2: Premium | Journal + Risk + Screeners | 15-20 | 🟡 HAUTE |
| Phase 3: Polish | Notifs + Verif + Landing + Tests | 10-15 | 🟢 MOYENNE |
| **TOTAL** | **33 features** | **40-55 jours** | **(2-3 mois, 1 dev)** |

### Tech Debt

| Issue | Severity | Effort |
|-------|----------|--------|
| Crypto payment placeholders | 🔴 CRITICAL | 3-5 jours |
| Dashboard TODOs (11 fichiers) | 🟡 HIGH | 2-3 jours |
| Landing page Threader content | 🟢 LOW | 1-2 jours |
| No tests for new features | 🟡 MEDIUM | 3-5 jours |

---

## 🎯 Conclusion

### État Actuel

MyCryptoPilot est actuellement une **belle coquille UI** basée sur le template NOW.TS, avec:
- ✅ Infrastructure solide (Next.js, Prisma, Better Auth)
- ✅ UI/UX complète et moderne (Shadcn/UI)
- ✅ Schema DB bien conçu pour crypto trading
- ⚠️ **MAIS: Aucune fonctionnalité core implémentée**

### Blocages Majeurs

1. **Crypto payments**: Structure existe mais non fonctionnel (placeholders)
2. **Signals system**: Complètement manquant (core product)
3. **Trader profiles**: Pas de formulaire création

### Path to MVP

**Timeline**: 2-3 semaines (1 dev full-time)

**Priorité absolue**:
1. Finir crypto payment system (4-5 jours)
2. Implémenter signals (création + display) (5-7 jours)
3. Implémenter follow system (2 jours)
4. Connecter dashboards aux données (2-3 jours)

Après ces 3 semaines: **Produit utilisable end-to-end** 🎉

### Recommandations

1. **Focus MVP first**: Ne pas se disperser sur features premium avant MVP
2. **Testnets**: Utiliser Base Sepolia et Tron Shasta pour tester crypto payments
3. **Market data**: Commencer avec CoinGecko free tier (suffisant pour MVP)
4. **Real-time**: Polling simple pour MVP, websockets plus tard
5. **Tests**: Écrire tests e2e Playwright pour parcours critiques
6. **Documentation**: Mettre à jour README et CLAUDE.md

---

**Dernière mise à jour**: 3 octobre 2025
**Analyste**: Claude (AI Assistant)
**Version**: 1.0.0
