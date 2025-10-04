# MyCryptoPilot - Rapport d'implémentation

## 📋 Résumé de l'adaptation de la boilerplate now.ts

Ce document récapitule l'adaptation de la boilerplate now.ts pour créer MyCryptoPilot, une plateforme de signaux de trading crypto avec un modèle B2C user/trader.

---

## ⚠️ Phase 1 Partiellement Complétée : Base de données & Configuration (4 oct 2025)

### ⚠️ IMPORTANT - Migrations Prisma

**BLOCAGE CRITIQUE** : Les schémas Prisma ont été créés mais **aucune migration n'a été générée ni appliquée**.

**État actuel** :
- ✅ Schémas définis dans `prisma/schema/`
- ❌ Dossier `prisma/migrations/` inexistant
- ❌ Base de données non synchronisée avec le schéma

**Actions requises** :
```bash
# Générer la migration initiale
npx prisma migrate dev --name init_mycryptopilot

# Ou en production
npx prisma migrate deploy
```

**⚠️ Sans ces migrations, aucune fonctionnalité base de données ne fonctionnera.**

---

### 1. Schéma Prisma MyCryptoPilot

**Fichiers modifiés/créés :**
- ✅ `prisma/schema/schema.prisma` - Modèles MyCryptoPilot (TraderProfile, CryptoAddress, Follow, Signal, CryptoPayment)
- ✅ `prisma/schema/better-auth.prisma` - Extension du modèle User avec les champs MyCryptoPilot
- ❌ Migration à générer : Pas encore appliquée (voir warning ci-dessus)

**Nouveaux modèles créés :**

#### Enums
- `UserRole` : USER, TRADER, BOTH
- `FollowStatus` : ACTIVE, EXPIRED, CANCELLED
- `CryptoNetwork` : BASE, TRON, POLYGON, ETHEREUM
- `PaymentStatus` : PENDING, CONFIRMED, FAILED

#### Models
- **TraderProfile** : Profil public des traders (bio, prix, stats, certification)
- **CryptoAddress** : Adresses crypto pour paiements (HD wallet dérivées)
- **Follow** : Relations de suivi user → trader
- **CryptoPayment** : Paiements crypto reçus (USDC/USDT)
- **Signal** : Signaux de trading avec payload JSON

#### Extension User
Le modèle `User` de better-auth a été étendu avec :
- `userRole` : Rôle MyCryptoPilot (USER/TRADER/BOTH)
- Relations : traderProfile, cryptoAddresses, cryptoPayments, follows, followers, signals

⚠️ **Note importante** : Le fichier `better-auth.prisma` est auto-généré. Si vous exécutez `npx @better-auth/cli generate`, vous devez réappliquer manuellement les extensions User (lignes 27-36).

### 2. Configuration

**Fichiers modifiés :**

#### `src/lib/auth.ts`
- ✅ Simplifié le nom d'organisation : `"Account"` au lieu de `"${email}'s org"`
- ✅ Utilise l'ID user pour le slug (au lieu d'un extrait d'email)
- ✅ Logo changé en `account-logo.png`

#### `src/site-config.ts`
- ✅ Rebranding complet MyCryptoPilot
- ✅ Couleur principale : `#F59E0B` (Amber - thème crypto)
- ✅ `enableLandingRedirection: false` (garder la landing visible)
- ✅ `enableImageUpload: true` (pour photos traders)
- ✅ Ajout de la config crypto avec explorateurs :
  ```ts
  crypto: {
    networks: {
      base: {
        name: "Base",
        currency: "USDC",
        confirmations: 1,
        explorerUrl: "https://basescan.org"
      },
      tron: {
        name: "Tron",
        currency: "USDT",
        confirmations: 2,
        explorerUrl: "https://tronscan.org"
      },
    }
  }
  ```

### 3. Types TypeScript

**Fichier créé : `src/types/mycryptopilot.ts`**

Types principaux :
- ✅ `TradingCardPayload` : Structure complète d'un signal (entry, stop, TPs, levier, risque, etc.)
- ✅ `TraderStats` : Statistiques trader (winrate, payoff, maxDD, expectancy)
- ✅ `CryptoNetworkConfig` : Configuration réseau crypto
- ✅ `FollowRelationship` : Relation de suivi avec détails trader
- ✅ `CryptoPaymentWithDetails` : Paiement crypto avec infos réseau
- ✅ `SignalWithTrader` : Signal avec infos trader
- ✅ `TraderProfileWithStats` : Profil trader complet
- ✅ `UserWithRole` : User avec rôle et profil trader

### 4. Plans & Pricing

**Fichier créé : `src/lib/crypto/mycryptopilot-plans.ts`**

Plans configurés :

| Plan | Prix | Signaux/jour | Traders | Refresh | Features clés |
|------|------|-------------|---------|---------|---------------|
| **Free** | 0 USDC/USDT | 5 | 1 | 5min | Teasers floutés |
| **Pro** | 49 USDC/USDT | 50 | 5 | 1min | Signaux complets, Console risque, Journal ⭐ |
| **Ultra** | 99 USDC/USDT | ∞ | ∞ | 5sec | Alertes custom, Filtres avancés |

Fonctions utilitaires :
- ✅ `getPlanByName(name)` : Récupère un plan par nom
- ✅ `getPlanLimits(plan)` : Récupère les limites d'un plan
- ✅ `canPerformAction(plan, action)` : Vérifie si une action est autorisée
- ✅ `calculateDaysGranted(amountUSD, plan)` : Calcul prorata jours accordés
- ✅ `getPlanFromAmount(amountUSD)` : Détecte le plan depuis le montant payé

---

## ✅ Phase 2 Complétée : Système de paiement crypto (3 oct 2025)

### 1. Service de génération d'adresses crypto

**Fichier créé : `src/lib/crypto/address-generator.ts`**

Fonctionnalités implémentées :
- ✅ Génération d'adresses via HD wallet (xpub) - Structure prête pour implémentation
- ✅ Support Base (USDC) et Tron (USDT)
- ✅ Dérivation path unique par user (BIP44)
  - Base : `m/44'/60'/0'/0/{index}` (Ethereum coin type)
  - Tron : `m/44'/195'/0'/0/{index}` (Tron coin type)
- ✅ Stockage en DB via `CryptoAddress`
- ✅ Réutilisation d'adresses existantes (évite duplication)
- ✅ Désactivation d'adresses (sécurité)
- ✅ Génération multi-réseau pour un user (`ensureUserCryptoAddresses`)

**Fonctions exportées :**
- `generateCryptoAddress(userId, network)` - Génère ou retourne adresse existante
- `getUserCryptoAddresses(userId)` - Récupère toutes les adresses actives
- `deactivateCryptoAddress(addressId)` - Désactive une adresse
- `ensureUserCryptoAddresses(userId)` - Génère adresses pour tous les réseaux

**Note importante :** Les fonctions de dérivation HD wallet utilisent actuellement des placeholders. L'implémentation réelle nécessite :
- `ethers.js` ou `web3.js` pour Base (Ethereum-compatible)
- `tronweb` pour Tron
- Configuration des xpub dans les variables d'environnement

### 2. Watcher de paiements on-chain

**Fichier créé : `src/lib/crypto/payment-watcher.ts`**

Fonctionnalités implémentées :
- ✅ Architecture de polling RPC (Base + Tron) - Structure prête
- ✅ Validation des confirmations réseau (1 pour Base, 2 pour Tron)
- ✅ Détection automatique du plan depuis le montant payé (avec tolérance 5%)
- ✅ Calcul prorata des jours accordés
- ✅ Gestion des paiements en doublon (évite duplication)
- ✅ Activation/extension automatique de l'abonnement
- ✅ Support des paiements partiels (pro-rata)
- ✅ Traitement parallèle des adresses (performance)

**Fonctions exportées :**
- `checkAddressForPayments(address, network)` - Vérifie transactions pour une adresse
- `processPayment(payment, userId)` - Traite un paiement détecté
- `startPaymentWatcher(intervalMs)` - Démarre le watcher en background
- `retryPayment(paymentId)` - Réessaie un paiement échoué (admin)
- `getPaymentStatus(txHash)` - Récupère statut d'un paiement

**Workflow complet :**
1. Watcher poll toutes les adresses actives (intervalle configurable)
2. Pour chaque transaction détectée :
   - Vérifie si déjà en DB (évite doublon)
   - Valide nombre de confirmations
   - Auto-détecte le plan (free/pro/ultra) depuis montant
   - Calcule jours accordés (prorata supporté)
   - Crée/met à jour `CryptoPayment`
3. Si confirmé → Active/étend `Subscription` sur l'organisation user

**Note importante :** Les fonctions RPC utilisent actuellement des placeholders. L'implémentation réelle nécessite :
- Provider RPC Base via `ethers.js` (Infura, Alchemy, etc.)
- TronGrid API via `tronweb`
- Adresses des contrats USDC (Base) et USDT (Tron)

### 3. Variables d'environnement ajoutées

**Fichier modifié : `src/lib/env.ts`**

Nouvelles variables (optionnelles) :
```env
BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_KEY
TRON_RPC_URL=https://api.trongrid.io
CRYPTO_XPUB_BASE=xpub... (watch-only Base wallet)
CRYPTO_XPUB_TRON=xpub... (watch-only Tron wallet)
```

### Tâches restantes Phase 2

#### Implémentation complète HD Wallet
- ⏳ Intégrer `ethers.js` pour dérivation Base
- ⏳ Intégrer `tronweb` pour dérivation Tron
- ⏳ Configurer xpubs en production (Ledger/Trezor recommandé)
- ⏳ Tester en testnet (Base Sepolia, Tron Nile)

#### Implémentation complète RPC Watcher
- ⏳ Intégrer queries RPC Base pour events USDC Transfer
- ⏳ Intégrer queries TronGrid pour events USDT TRC-20
- ⏳ Gérer reconnexions WebSocket (fallback polling)
- ⏳ Tester avec transactions réelles en testnet

---

## ✅ Phase 2.5 Complétée : UI Pages & Navigation (4 oct 2025)

### Pages Dashboard Créées

**Status** : ✅ UI complète, ❌ Données non connectées (TODOs présents)

#### 1. Dashboard User (`/orgs/[orgSlug]/dashboard`)

**Fichier** : `app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx`

**Fonctionnalités UI** :
- ✅ Stats cards (Active Signals, Traders Followed, Your Plan)
- ✅ Alert pour suivre des traders
- ✅ Tabs : Signals Feed, Trading Journal, Performance
- ✅ Quick actions buttons
- ✅ Empty states avec messages appropriés

**TODOs restants** :
- ❌ `TODO: Fetch user's followed traders` (ligne 31)
- ❌ `TODO: Fetch recent signals from followed traders` (ligne 32)
- ❌ `TODO: Fetch user's trading stats` (ligne 33)

#### 2. Dashboard Trader (`/orgs/[orgSlug]/dashboard/trader`)

**Fichier** : `app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx`

**Fonctionnalités UI** :
- ✅ Stats trader (Followers, Signals, Win Rate, Revenue)
- ✅ Verification status card
- ✅ Tabs : My Signals, Performance, Revenue
- ✅ Quick actions buttons
- ✅ Empty states

**TODOs restants** :
- ❌ `TODO: Fetch trader profile` (ligne 29)
- ❌ `TODO: Fetch trader's signals` (ligne 30)
- ❌ `TODO: Fetch trader's stats` (ligne 31)
- ❌ `TODO: Fetch followers count` (ligne 32)
- ❌ `TODO: Fetch revenue stats` (ligne 33)

#### 3. Marketplace Traders (`/orgs/[orgSlug]/traders`)

**Fichier** : `app/orgs/[orgSlug]/(navigation)/traders/page.tsx`

**Fonctionnalités UI** :
- ✅ Search bar (UI seulement)
- ✅ Filters (Verified, Win Rate, Followers) - UI seulement
- ✅ Stats overview cards
- ✅ Trader cards grid (placeholder data)
- ✅ Empty state UI
- ✅ CTA "Become a Trader"

**TODOs restants** :
- ❌ `TODO: Fetch traders from database` (ligne 30)
- ❌ `TODO: Implement search and filters` (ligne 31)
- ❌ `TODO: Add pagination` (ligne 32)

#### 4. Pricing Page (`/orgs/[orgSlug]/pricing`)

**Fichier** : `app/orgs/[orgSlug]/(navigation)/pricing/page.tsx`

**Fonctionnalités** :
- ✅ 3 plans cards (Free, Pro, Ultra) avec toutes les features
- ✅ Utilise `MYCRYPTOPILOT_PLANS` depuis `mycryptopilot-plans.ts`
- ✅ Features comparison complète
- ✅ FAQ section (4 questions)
- ✅ Badges crypto payment (USDC Base, USDT Tron)
- ✅ Responsive design
- ✅ "Most Popular" badge sur plan Pro
- ⚠️ Boutons "Subscribe" non connectés (pas de UI paiement crypto encore)

### Navigation Sidebar Mise à Jour

**Fichier** : `app/orgs/[orgSlug]/(navigation)/_navigation/org-navigation.links.ts`

**Nouveaux liens ajoutés** :
```typescript
{
  title: "Menu",
  links: [
    { href: "/dashboard", Icon: BarChart3, label: "Trading Dashboard" }, // ✅ NEW
    { href: "/traders", Icon: Users, label: "Traders Marketplace" },     // ✅ NEW
    { href: "/pricing", Icon: DollarSign, label: "Pricing" },            // ✅ NEW
    // ... existing links
  ]
},
{
  title: "Trader", // ✅ NEW GROUP
  links: [
    { href: "/dashboard/trader", Icon: TrendingUp, label: "Trader Dashboard" },
  ]
}
```

### Landing Page Adaptation

**Status** : ⚠️ Partiellement adapté

**Fichier** : `app/page.tsx` + `src/features/landing/`

**Adaptations faites** :
- ✅ Hero section : "Crypto Trading Signals Risk-First"
- ✅ CTA buttons adaptés
- ✅ Metadata MyCryptoPilot

**Sections non adaptées** (encore template "Threader") :
- ❌ Reviews section - Témoignages non pertinents pour crypto
- ❌ Features section - Fonctionnalités non adaptées
- ❌ Bento grid - Exemples "Threader"
- ❌ Images placeholder - Pas de screenshots de l'app
- ❌ Stats section - Chiffres non représentatifs

---

## 🔄 Phase 3 à venir : Features Core Manquantes

### ⚠️ BLOCAGE CRITIQUE : Migrations Prisma

**Avant toute fonctionnalité** :
```bash
npx prisma migrate dev --name init_mycryptopilot
npx prisma db seed  # Si seed existe
```

### Tâches Critiques (MVP)

#### 1. Profils Traders (PRIORITÉ P0)

**Status** : ❌ Pas commencé

**Fonctionnalités manquantes** :
- ⏳ Page `/account/become-trader` avec formulaire
- ⏳ Formulaire création profil (displayName, bio, priceMonthlyUSD)
- ⏳ Server action `createTraderProfile()`
- ⏳ Server action `updateTraderProfile()`
- ⏳ Validation Zod schema
- ⏳ Upload avatar trader
- ⏳ Toggle USER ↔ TRADER ↔ BOTH dans settings

**Estimation** : 2-3 jours

#### 2. Système de Signaux (PRIORITÉ P0)

**Status** : ❌ Pas commencé

**Fonctionnalités manquantes** :
- ⏳ Page `/dashboard/trader/signals/new`
- ⏳ Formulaire signal complet avec validation Zod
- ⏳ Server action `createSignal()` avec hash SHA256
- ⏳ Composant `<TradingCard>` pour affichage signal
- ⏳ Feed signaux dans `/dashboard` avec filtres
- ⏳ Pagination et sorting
- ⏳ TTL (time-to-live) management
- ⏳ Signal expiration handling

**Estimation** : 5-7 jours

#### 3. Système Follow/Unfollow (PRIORITÉ P0)

**Status** : ❌ Pas commencé

**Fonctionnalités manquantes** :
- ⏳ Server action `followTrader(userId, traderId)`
- ⏳ Server action `unfollowTrader(followId)`
- ⏳ Vérification limites plan (1 Free, 5 Pro, ∞ Ultra)
- ⏳ Bouton "Follow" sur profil trader
- ⏳ Bouton "Unfollow"
- ⏳ Liste "Following" dans settings
- ⏳ Liste "Followers" pour trader
- ⏳ Gestion expiration follow

**Estimation** : 2 jours

#### 4. UI Paiement Crypto (PRIORITÉ P1)

**Status** : ❌ Pas commencé (dépend de US-04 et US-05)

**Fonctionnalités manquantes** :
- ⏳ Page `/pricing/checkout` avec sélection plan
- ⏳ Affichage adresses crypto (USDC Base + USDT Tron)
- ⏳ Génération QR codes pour paiement
- ⏳ Polling status paiement en temps réel
- ⏳ Confirmation page après paiement
- ⏳ Historique paiements crypto
- ⏳ Admin UI pour gérer paiements crypto

**Estimation** : 3-4 jours

#### 5. Connecter Dashboard aux Données

**Status** : ⏳ UI créée, données manquantes

**Fonctionnalités manquantes** :
- ⏳ Server action `getUserStats()` - dashboard user
- ⏳ Server action `getTraderStats()` - dashboard trader
- ⏳ Server action `getFollowedTraders()` - dashboard user
- ⏳ Server action `getTraderSignals()` - dashboard trader
- ⏳ Server action `searchTraders()` - marketplace
- ⏳ Loading states et Suspense
- ⏳ Error boundaries

**Estimation** : 2-3 jours

### Tâches Secondaires (Post-MVP)

#### 6. Adaptation Landing Page

**Status** : ⏳ Hero adapté, sections non adaptées

**À adapter** :
- ⏳ Reviews section - Témoignages crypto traders
- ⏳ Features section - Features MyCryptoPilot
- ⏳ Bento grid - Screenshots app
- ⏳ Images placeholder - Vraies images
- ⏳ Stats section - Vrais chiffres

**Estimation** : 1-2 jours

---

## 📝 Notes techniques importantes

### 1. Architecture retenue

**Décision : Garder le système d'organisations en "mode compte personnel"**

Au lieu de supprimer complètement le système d'organisations (refactoring massif), on l'adapte :
- Une organisation = un compte utilisateur (toujours seul dedans)
- Les invitations sont désactivées (UI masquée + logique bloquée)
- Le paiement reste lié à l'organisation (via `Subscription`)
- On ajoute un système parallèle de paiement crypto

**Avantages :**
- Refactoring minimal (2-3 semaines au lieu de 1-2 mois)
- Réutilisation de 80% du code existant
- Possibilité de migrer plus tard vers une architecture sans org

### 2. Paiements

**Dual system (transition) :**
- Stripe (Subscription liée à Organization) : conservé mais non utilisé pour l'instant
- Crypto (CryptoPayment + CryptoAddress) : nouveau système principal
- Les deux systèmes mettent à jour le même `Subscription.plan` sur l'organisation

### 3. Rôles

**Distinction importante :**
- `User.role` (better-auth) : rôle admin (banned, etc.)
- `User.userRole` (MyCryptoPilot) : USER / TRADER / BOTH

### 4. Schéma multi-fichiers Prisma

Le projet utilise Prisma 6 avec multi-schema (`prisma.config.ts` pointe vers le dossier `prisma/`).

**Fichiers .prisma :**
- `better-auth.prisma` : Auto-généré, contient User + modèles auth (⚠️ modifié manuellement pour les extensions)
- `schema.prisma` : Modèles MyCryptoPilot + generator + datasource

---

## 🚀 Prochaines étapes recommandées

### ⚠️ ÉTAPE 0 : Migrations Database (BLOQUANT - 1h)

**CRITIQUE** : Avant tout développement, appliquer les migrations :

```bash
# 1. Générer migration initiale
npx prisma migrate dev --name init_mycryptopilot

# 2. Vérifier que tout est synchronisé
npx prisma migrate status

# 3. (Optionnel) Créer seed pour données de test
npx prisma db seed
```

**Sans cela, AUCUNE fonctionnalité base de données ne fonctionnera.**

---

### Semaine 1 : MVP Core (15-20 jours)

#### Jour 1-3 : Profils Traders
1. ⏳ Créer page `/account/become-trader`
2. ⏳ Formulaire création profil (displayName, bio, price)
3. ⏳ Server actions create/update
4. ⏳ Upload avatar trader
5. ⏳ Toggle USER ↔ TRADER

**Livrable** : Users peuvent devenir traders ✅

#### Jour 4-10 : Système Signaux
1. ⏳ Page `/dashboard/trader/signals/new`
2. ⏳ Formulaire signal complet (symbol, bias, entry, TPs, etc.)
3. ⏳ Validation Zod + hash SHA256
4. ⏳ Server action `createSignal()`
5. ⏳ Composant `<TradingCard>` pour display
6. ⏳ Feed signaux dans `/dashboard`
7. ⏳ Filtres et pagination

**Livrable** : Traders peuvent publier, users peuvent voir signaux ✅

#### Jour 11-12 : Follow System
1. ⏳ Server actions follow/unfollow
2. ⏳ Vérification limites plan
3. ⏳ Boutons Follow/Unfollow
4. ⏳ Listes Following/Followers

**Livrable** : Users peuvent suivre traders ✅

#### Jour 13-15 : Connecter Dashboards
1. ⏳ Remplacer TODOs par vrais fetches
2. ⏳ Server actions pour stats
3. ⏳ Loading states + Suspense
4. ⏳ Error boundaries

**Livrable** : Dashboards fonctionnels avec vraies données ✅

**🎉 Fin Semaine 1 : MVP utilisable end-to-end**

---

### Semaine 2 : Crypto Payments (4-5 jours)

#### Jour 1-2 : HD Wallet Implementation
1. ⏳ Intégrer ethers.js pour Base
2. ⏳ Intégrer tronweb pour Tron
3. ⏳ Configurer xpub keys (testnet)
4. ⏳ Implémenter dérivation réelle dans `address-generator.ts`

#### Jour 3-4 : RPC Watcher
1. ⏳ Implémenter appels RPC Base (USDC Transfer events)
2. ⏳ Implémenter appels RPC Tron (USDT TRC-20)
3. ⏳ Tester en testnet (Base Sepolia, Tron Shasta)

#### Jour 5 : UI Paiement
1. ⏳ Page `/pricing/checkout`
2. ⏳ Affichage adresses + QR codes
3. ⏳ Polling status paiement
4. ⏳ Confirmation page

**Livrable** : Paiements crypto fonctionnels ✅

---

### Semaine 3 : Features Premium (facultatif)

#### Trading Journal (4-5 jours)
1. ⏳ Modèle DB `Trade`
2. ⏳ Formulaire ajout trade
3. ⏳ Calculs stats (winrate, payoff)
4. ⏳ Equity curve chart

#### Risk Console (3-4 jours)
1. ⏳ Page `/dashboard/risk`
2. ⏳ Calculateurs position size, R:R
3. ⏳ Portfolio risk view

#### Screeners (5-6 jours)
1. ⏳ Intégration API market data
2. ⏳ Tableaux avec filters/sort
3. ⏳ Refresh intervals par plan

---

### Semaine 4 : Polish (facultatif)

1. ⏳ Adapter landing page (reviews, features, images)
2. ⏳ Notifications system
3. ⏳ Trader verification system
4. ⏳ Admin UI crypto payments
5. ⏳ Tests e2e Playwright

---

## 📚 Ressources

### Documentation
- [Better Auth](https://better-auth.com)
- [Prisma Multi-schema](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-file-schema)
- [Base Network](https://docs.base.org)
- [Tron Network](https://developers.tron.network)

### Fichiers clés du projet
- `src/lib/auth.ts` : Configuration auth + hooks
- `prisma/schema/` : Schémas DB
- `src/types/mycryptopilot.ts` : Types principaux
- `src/lib/crypto/mycryptopilot-plans.ts` : Plans & pricing

### Variables d'environnement requises
```env
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Auth (existant)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...

# Crypto (à ajouter)
BASE_RPC_URL=https://base-mainnet.infura.io/v3/YOUR_KEY
TRON_RPC_URL=https://api.trongrid.io
CRYPTO_XPUB_BASE=xpub... (watch-only wallet)
CRYPTO_XPUB_TRON=xpub... (watch-only wallet)
```

---

## 🎯 Objectifs MVP (6-8 semaines)

### Minimum viable :
- ✅ User peut s'inscrire (Google/Discord/Email) - Better Auth configuré
- ✅ Schéma BDD complet (Users, Traders, Signals, Payments, Follows)
- ✅ Plans tarifaires définis (Free/Pro/Ultra avec limites)
- ✅ Service génération adresses crypto (structure prête)
- ✅ Service détection paiements (structure prête)
- ⏳ Implémentation complète HD wallet + RPC
- ⏳ Paiement détecté → abonnement activé (logique complète, à tester)
- ⏳ User peut voir les signaux des traders suivis
- ⏳ Trader peut créer et publier des signaux
- ⏳ Marketplace de traders avec stats

### Nice to have :
- Journal de trading
- Console de risque
- Alertes personnalisées
- Filtres avancés (funding, OI)
- Discord comme canal de diffusion

---

**Date de dernière mise à jour :** 4 octobre 2025 (Phase 2.5 complétée - UI pages créées)
**Auteur :** Claude Code
**Version :** 2.0
