# MyCryptoPilot - Rapport d'implémentation

## 📋 Résumé de l'adaptation de la boilerplate now.ts

Ce document récapitule l'adaptation de la boilerplate now.ts pour créer MyCryptoPilot, une plateforme de signaux de trading crypto avec un modèle B2C user/trader.

---

## ✅ Phase 1 Complétée : Base de données & Configuration (3 oct 2025)

### 1. Schéma Prisma MyCryptoPilot

**Fichiers modifiés/créés :**
- ✅ `prisma/schema/schema.prisma` - Modèles MyCryptoPilot (TraderProfile, CryptoAddress, Follow, Signal, CryptoPayment)
- ✅ `prisma/schema/better-auth.prisma` - Extension du modèle User avec les champs MyCryptoPilot
- ✅ Migration appliquée : `20251003143237_add_mycryptopilot_models`

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
- ✅ Ajout de la config crypto :
  ```ts
  crypto: {
    networks: {
      base: { name: "Base", currency: "USDC", confirmations: 1 },
      tron: { name: "Tron", currency: "USDT", confirmations: 2 },
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

## 🔄 Phase 3 à venir : Adaptation UI

### Tâches restantes

#### 1. Adaptation UI

**Pages à modifier/créer :**
- ⏳ Masquer `orgs-select.tsx` (retourner null)
- ⏳ Désactiver `/orgs/[orgSlug]/settings/members` (redirection)
- ⏳ Renommer "Organization" → "Account" dans les settings
- ⏳ Créer `/pricing` avec paiement crypto (USDC/USDT)
- ⏳ Créer `/dashboard` (User) : signaux, journal, stats
- ⏳ Créer `/dashboard/trader` : créer signaux, stats, revenue
- ⏳ Créer `/traders` : marketplace publique

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

### Semaine 1 (Finaliser crypto billing) ✅ EN COURS
1. ✅ Implémenter `address-generator.ts` (structure HD wallet xpub)
2. ✅ Implémenter `payment-watcher.ts` (structure RPC Base + Tron)
3. ⏳ Compléter implémentation HD wallet (ethers.js + tronweb)
4. ⏳ Compléter implémentation RPC watcher (queries on-chain)
5. ⏳ Tester en testnet (Base Sepolia, Tron Nile)
6. ✅ Configurer les variables d'environnement (ajoutées dans env.ts)

### Semaine 2 (UI - Phase 3)
7. Masquer sélecteur d'orgs (`orgs-select.tsx → return null`)
8. Désactiver page Members (redirection vers `/dashboard/settings`)
9. Renommer "Organization" → "Account" dans l'UI
10. Créer page `/pricing` avec cartes crypto (USDC Base + USDT Tron)

### Semaine 3-4 (Dashboards)
11. Dashboard User (`/dashboard`) : feed signaux, journal, stats
12. Dashboard Trader (`/dashboard/trader`) : créer signaux, stats, revenue
13. Marketplace (`/traders`) : liste traders avec stats

### Semaine 4-5 (Features métier)
14. Système de signaux (création, hash, TTL)
15. Système de suivi (Follow)
16. Ingestion données marché (WebSocket exchanges)
17. Détection de signaux (microstructure, dérivés)

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

**Date de dernière mise à jour :** 3 octobre 2025 (Phase 2 complétée)
**Auteur :** Claude Code
**Version :** 1.1
