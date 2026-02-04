# MyCryptoPilot - Spécifications Complètes du Projet

**Version**: 1.0
**Date de création**: 26 janvier 2026
**Dernière mise à jour**: 26 janvier 2026

---

## Table des Matières

1. [Vision et Proposition de Valeur](#1-vision-et-proposition-de-valeur)
2. [Public Cible](#2-public-cible)
3. [Modèle Économique](#3-modèle-économique)
4. [Architecture Technique](#4-architecture-technique)
5. [Fonctionnalités Détaillées](#5-fonctionnalités-détaillées)
   - [5.1 Système de Trading Social](#51-système-de-trading-social)
   - [5.2 Paiements Crypto](#52-paiements-crypto)
   - [5.3 Portfolio Tracking](#53-portfolio-tracking)
   - [5.4 Console de Risque](#54-console-de-risque)
   - [5.5 Copy Trading](#55-copy-trading)
   - [5.6 Intégration Discord](#56-intégration-discord)
6. [Flux Utilisateurs](#6-flux-utilisateurs)
7. [Modèles de Données](#7-modèles-de-données)
8. [Sécurité](#8-sécurité)
9. [Intégrations Externes](#9-intégrations-externes)
10. [État Actuel et Roadmap](#10-état-actuel-et-roadmap)

---

## 1. Vision et Proposition de Valeur

### 1.1 Mission

MyCryptoPilot est une plateforme de trading crypto "risk-first" qui démocratise l'accès aux signaux de trading professionnels tout en éduquant les utilisateurs à la gestion du risque.

### 1.2 Proposition de Valeur Unique

**Pour les Followers (Utilisateurs)**:
- Accès à des signaux de trading émis par des traders vérifiés avec performances auditables
- Outils de gestion du risque intégrés (console de risque avec règle des 2%)
- Copy trading automatisé ou manuel selon le niveau de confort
- Journal de trading pour suivre ses performances personnelles

**Pour les Traders**:
- Monétisation de leur expertise trading via abonnements de leurs followers
- Système de vérification automatique des performances via connexion exchange
- Badge "Verified" attestant de stats réelles (non manuelles)
- Audience qualifiée via la marketplace de traders

### 1.3 Différenciateurs Clés

| Aspect | Concurrents | MyCryptoPilot |
|--------|-------------|---------------|
| **Vérification stats** | Auto-déclarées | Vérifiées on-chain via API Binance/Bybit |
| **Paiement** | Carte bancaire uniquement | Crypto uniquement (USDC/USDT) |
| **Risque** | Ignoré | Console de risque intégrée (2% rule) |
| **Transparence** | Limitée | Performances publiques, calculs explicables |

### 1.4 Tagline

> "Signaux de trading crypto risk-first. Analyse temps réel, plans explicables, console de risque."

---

## 2. Public Cible

### 2.1 Segments Utilisateurs

#### Followers (Acheteurs de Signaux)

**Profil type**:
- Âge: 25-45 ans
- Capital trading: $5,000 - $100,000
- Expérience: Débutant à intermédiaire
- Objectif: Apprendre en suivant des pros, éviter les erreurs de débutant

**Pain points**:
- Manque de temps pour analyser les marchés
- Difficulté à identifier les traders légitimes (vs scammeurs)
- Peur de la perte (absence de gestion du risque)
- Signaux Telegram/Discord non vérifiables

**Besoins**:
- Accès à des signaux de qualité avec track record vérifiable
- Outils pour calculer la taille de position adaptée
- Flexibilité: copier manuellement ou automatiquement
- Communauté pour échanger et apprendre

#### Traders (Vendeurs de Signaux)

**Profil type**:
- Âge: 28-50 ans
- Expérience: 3+ ans de trading actif
- Track record: Winrate > 50%, profit factor > 1.5
- Motivation: Revenus complémentaires + notoriété

**Pain points**:
- Difficulté à monétiser leur expertise
- Gestion communauté chronophage (Telegram, Discord)
- Impossible de prouver leurs performances passées
- Dépendance à des plateformes non adaptées

**Besoins**:
- Plateforme dédiée au signal trading
- Connexion exchange pour prouver les stats
- Revenus récurrents via abonnements
- Outils de publication de signaux efficaces

### 2.2 Marchés Géographiques

**Phase 1 (MVP)**: Francophone (France, Belgique, Suisse, Canada)
**Phase 2**: Anglophone (US, UK, Australie)
**Phase 3**: Global

---

## 3. Modèle Économique

### 3.1 Plans Tarifaires

| Plan | Prix/mois | Signaux/jour | Traders suivis | Screener | Console Risque |
|------|-----------|--------------|----------------|----------|----------------|
| **FREE** | $0 | 5 (teasers floutés) | 1 | 5 min | Démo publique |
| **PRO** | $49 | 50 | 5 | 1 min | Accès complet |
| **ULTRA** | $99 | Illimité | Illimité | 5 sec | + Capital live exchange |

### 3.2 Modes de Paiement

**Crypto exclusivement** (pas de carte bancaire):
- **Base Network**: USDC (Ethereum L2, frais ~$0.10)
- **Tron Network**: USDT TRC-20 (frais ~$0.50)

**Avantages du crypto-only**:
- Audience native crypto (early adopters)
- Pas de frais Stripe (3%)
- Transactions irréversibles (pas de chargebacks)
- Support pro-rata automatique

### 3.3 Calcul Pro-Rata

Le système supporte les paiements partiels avec calcul automatique des jours accordés:

```
jours_accordés = montant_payé / prix_journalier_du_plan

Exemple PRO:
- Prix mensuel: $49
- Prix journalier: $49 / 30 = $1.63
- Paiement de $25 → 25 / 1.63 = 15 jours accordés
```

### 3.4 Revenus Projetés

| Métrique | Mois 6 | Mois 12 | Mois 24 |
|----------|--------|---------|---------|
| Users FREE | 5,000 | 15,000 | 50,000 |
| Users PRO | 200 | 800 | 3,000 |
| Users ULTRA | 50 | 200 | 800 |
| **MRR** | $12,350 | $49,400 | $185,200 |

---

## 4. Architecture Technique

### 4.1 Stack Technologique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework** | Next.js 15 (App Router) | SSR, RSC, performance optimale |
| **Langage** | TypeScript (strict) | Typage fort, maintenabilité |
| **Styling** | TailwindCSS v4 + Shadcn/UI | DX, composants accessibles |
| **Base de données** | PostgreSQL + Prisma | ORM typé, migrations automatiques |
| **Auth** | Better Auth | Flexible, support OAuth |
| **Paiements** | Custom HD Wallet | USDC/USDT, pas de tiers |
| **Email** | React Email + Resend | Templates typés, délivrabilité |
| **Bot Discord** | discord.js | Intégration native |
| **Tests** | Vitest + Playwright | Unit + E2E |
| **Package Manager** | pnpm | Performance, workspace |

### 4.2 Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐     ┌───────────────────┐               │
│  │   Vercel          │     │   Fly.io Worker   │               │
│  │   (Next.js App)   │     │   (Discord Bot +  │               │
│  │                   │     │    Cron Jobs)     │               │
│  └─────────┬─────────┘     └─────────┬─────────┘               │
│            │                         │                          │
│            └──────────┬──────────────┘                          │
│                       │                                         │
│            ┌──────────▼──────────┐                              │
│            │  PostgreSQL (Neon)  │                              │
│            │   via Prisma ORM    │                              │
│            └──────────┬──────────┘                              │
│                       │                                         │
├───────────────────────┼─────────────────────────────────────────┤
│                       │         SERVICES EXTERNES               │
├───────────────────────┼─────────────────────────────────────────┤
│                       │                                         │
│  ┌────────────────────┼────────────────────┐                    │
│  │                    │                    │                    │
│  ▼                    ▼                    ▼                    │
│ Resend            Binance API         Tron RPC                  │
│ (Emails)          Bybit API           Base RPC                  │
│                   (Portfolio)         (Paiements)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Organisation du Code

```
mycryptopilot/
├── app/                              # Next.js App Router
│   ├── (landing)/                    # Pages publiques (SEO)
│   ├── (marketing)/                  # Pricing, features
│   ├── orgs/[orgSlug]/               # App authentifiée
│   │   ├── (navigation)/             # Pages avec sidebar
│   │   │   ├── dashboard/            # Dashboard utilisateur
│   │   │   ├── traders/              # Marketplace traders
│   │   │   ├── signals/              # Feed de signaux
│   │   │   ├── pricing/              # Page pricing
│   │   │   └── account/              # Paramètres compte
│   │   └── (trading)/                # Espace trading
│   │       ├── portfolio/            # Portfolio tracking
│   │       └── risk-console/         # Console de risque
│   ├── api/                          # API Routes
│   │   ├── crypto/                   # Paiements crypto
│   │   ├── exchange/                 # Connexions exchange
│   │   └── cron/                     # Jobs planifiés
│   └── admin/                        # Dashboard admin
├── src/
│   ├── components/
│   │   ├── ui/                       # Shadcn/UI (primitives)
│   │   ├── nowts/                    # Composants métier
│   │   └── checkout/                 # UI paiement
│   ├── features/                     # Logique par domaine
│   │   ├── trader/                   # Profils traders
│   │   ├── signal/                   # Signaux trading
│   │   ├── follow/                   # Système follow
│   │   └── risk-console/             # Console risque
│   ├── lib/
│   │   ├── auth/                     # Better Auth config
│   │   ├── crypto/                   # HD Wallet, encryption
│   │   ├── exchange/                 # Binance, Bybit
│   │   ├── discord/                  # Bot Discord
│   │   ├── trading/                  # Copy trading
│   │   └── subscription/             # Gestion abonnements
│   └── hooks/                        # React hooks custom
├── prisma/
│   ├── schema.prisma                 # Schéma principal
│   └── migrations/                   # Migrations SQL
└── scripts/                          # Scripts utilitaires
```

---

## 5. Fonctionnalités Détaillées

### 5.1 Système de Trading Social

#### 5.1.1 Profils Traders

**Création du profil**:
1. L'utilisateur clique sur "Become a Trader" dans son compte
2. Remplit le formulaire: nom d'affichage, bio, spécialité (SPOT/FUTURES), réseaux sociaux
3. Upload photo de profil (optionnel)
4. Le profil est créé avec `verified: false`

**Champs du profil trader**:
```typescript
type TraderProfile = {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  specialty: "SPOT" | "FUTURES" | "BOTH";
  socialLinks: {
    twitter?: string;
    telegram?: string;
    youtube?: string;
  };
  verified: boolean;           // True si exchange connecté
  verifiedAt: Date | null;
  statsJson: TraderStats;      // Stats agrégées (winrate, trades, etc.)
  createdAt: Date;
};

type TraderStats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winrate: number;            // 0-100
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
};
```

**Badge "Verified"**:
- Automatiquement activé quand le trader connecte son premier exchange
- Automatiquement désactivé si toutes les connexions exchange sont supprimées
- Affiché sur le profil public et dans la marketplace

#### 5.1.2 Signaux de Trading

**Structure d'un signal (TradingCard)**:
```typescript
type Signal = {
  id: string;
  traderId: string;
  createdAt: Date;
  expiresAt: Date;           // TTL du signal

  // Payload JSON structuré
  payload: {
    symbol: string;          // "BTC/USDT"
    direction: "LONG" | "SHORT";
    entry: number;           // Prix d'entrée
    invalidation: number;    // Stop-loss
    takeProfits: {
      price: number;
      allocation: number;    // % de la position à fermer
    }[];
    leverage?: number;       // Pour FUTURES uniquement
    rationale: string;       // Explication du setup
    timeframe: string;       // "4H", "1D", etc.
    riskReward: number;      // Calculé automatiquement
  };

  // Statut
  status: "ACTIVE" | "TRIGGERED" | "INVALIDATED" | "EXPIRED";

  // Lien avec trade réel (optionnel)
  linkedTradeId?: string;    // TraderTrade si signal lié à position réelle
};
```

**Cycle de vie d'un signal**:
1. **ACTIVE**: Signal publié, en attente d'exécution
2. **TRIGGERED**: Prix d'entrée atteint, position ouverte
3. **INVALIDATED**: Stop-loss touché, signal perdant
4. **EXPIRED**: TTL dépassé sans trigger

**Calcul du Risk/Reward**:
```
Pour un LONG:
  potentialProfit = takeProfit - entry
  potentialLoss = entry - stopLoss
  R/R = potentialProfit / potentialLoss

Pour un SHORT:
  potentialProfit = entry - takeProfit
  potentialLoss = stopLoss - entry
  R/R = potentialProfit / potentialLoss
```

**Publication d'un signal**:
1. Trader remplit le formulaire de création (515 lignes de code)
2. Validation Zod des champs
3. Calcul automatique du R/R ratio
4. Sauvegarde en base avec TTL
5. Notification Discord via webhook (si configuré)
6. Notification email aux followers (selon préférences)

#### 5.1.3 Système Follow/Unfollow

**Limites par plan**:
| Plan | Traders suivis max |
|------|-------------------|
| FREE | 1 |
| PRO | 5 |
| ULTRA | Illimité |

**Modèle de données**:
```typescript
type Follow = {
  id: string;
  followerId: string;        // User qui suit
  traderId: string;          // Trader suivi
  status: "ACTIVE" | "INACTIVE";
  source: "WEBAPP" | "DISCORD" | "API";
  createdAt: Date;
};
```

**Actions déclenchées au follow**:
1. Vérification limite plan de l'utilisateur
2. Création relation Follow en base
3. Attribution rôle Discord (si discordId présent)
4. Notification au trader (optionnel)

**Actions déclenchées à l'unfollow**:
1. Mise à jour status Follow → INACTIVE
2. Retrait accès channel Discord privé du trader
3. Arrêt copy trading automatique (si activé)

#### 5.1.4 Marketplace de Traders

**Fonctionnalités de recherche**:
- Recherche par nom
- Filtres: spécialité (SPOT/FUTURES), vérifié uniquement, winrate minimum
- Tri: followers, winrate, trades récents

**Affichage carte trader**:
- Photo profil + nom
- Badge "Verified" (si applicable)
- Spécialité (SPOT/FUTURES/BOTH)
- Stats: winrate, nombre de trades, followers
- Bouton Follow/Unfollow

**Gating FREE users**:
- Stats complètes visibles uniquement pour PRO/ULTRA
- FREE voit seulement le winrate (autres métriques floutées)
- CTA "Upgrade to see full stats"

---

### 5.2 Paiements Crypto

#### 5.2.1 Architecture HD Wallet

**Principe**: Génération d'adresses uniques par paiement via dérivation hiérarchique, sans stocker de clés privées.

**Dérivation BIP-44**:
```
Base (Ethereum):  m/44'/60'/0'/0/{index}
Tron:             m/44'/195'/0'/0/{index}
```

**Configuration**:
```bash
# Extended Public Keys (pas de private keys!)
CRYPTO_XPUB_BASE="xpub6F..."   # Pour dériver adresses Base
CRYPTO_XPUB_TRON="xpub6D..."   # Pour dériver adresses Tron
```

**Flow de génération d'adresse**:
```typescript
async function generateCryptoAddress(userId: string, plan: string) {
  // 1. Trouver le prochain index disponible
  const lastAddress = await prisma.cryptoAddress.findFirst({
    orderBy: { derivationIndex: "desc" }
  });
  const nextIndex = (lastAddress?.derivationIndex ?? -1) + 1;

  // 2. Dériver les adresses
  const baseAddress = deriveBaseAddress(nextIndex);  // ethers.js
  const tronAddress = deriveTronAddress(nextIndex);  // @scure/bip32

  // 3. Sauvegarder avec expiration 15min
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.$transaction([
    prisma.cryptoAddress.create({
      data: { userId, network: "BASE", address: baseAddress, derivationIndex: nextIndex, expiresAt }
    }),
    prisma.cryptoAddress.create({
      data: { userId, network: "TRON", address: tronAddress, derivationIndex: nextIndex, expiresAt }
    })
  ]);

  return { base: baseAddress, tron: tronAddress, expiresAt };
}
```

#### 5.2.2 Détection des Paiements On-Chain

**Méthode**: Polling RPC toutes les 10 secondes pendant le checkout.

**Base Network (USDC)**:
```typescript
// Query Transfer events vers notre adresse
const provider = new JsonRpcProvider(BASE_RPC_URL);
const usdcContract = new Contract(USDC_CONTRACT, ["event Transfer(...)"], provider);

const events = await usdcContract.queryFilter(
  usdcContract.filters.Transfer(null, ourAddress),
  currentBlock - 1000,  // Derniers 1000 blocs
  currentBlock
);

// Extraire montant (6 decimals pour USDC)
const amount = Number(event.args.value) / 1e6;
```

**Tron Network (USDT)**:
```typescript
// TronGrid API pour events TRC-20
const tronWeb = new TronWeb({ fullHost: TRON_RPC_URL });
const events = await tronWeb.event.getEventsByContractAddress(
  USDT_CONTRACT,
  { eventName: "Transfer", size: 200 }
);

// Filtrer ceux vers notre adresse
const payments = events.filter(e => e.result.to === ourAddressHex);
```

**Confirmations requises**:
- Base: 1 bloc (~2 secondes)
- Tron: 2 blocs (~6 secondes)

#### 5.2.3 Flow Checkout Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHECKOUT FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User clique "Upgrade to PRO" sur /pricing                   │
│     │                                                           │
│     ▼                                                           │
│  2. Redirect vers /checkout/pro                                 │
│     │                                                           │
│     ▼                                                           │
│  3. generateCryptoAddress() → 2 adresses (Base + Tron)          │
│     │                                                           │
│     ▼                                                           │
│  4. Affichage UI:                                               │
│     ┌─────────────────────────────────────────────┐             │
│     │  💰 Pay 49 USDC to activate PRO plan        │             │
│     │                                             │             │
│     │  [QR Code Base]      [QR Code Tron]         │             │
│     │  0x7a2d...          TYasr5...               │             │
│     │  [Copy]              [Copy]                 │             │
│     │                                             │             │
│     │  ⏱️ Time remaining: 14:32                   │             │
│     │  Status: Waiting for payment...             │             │
│     └─────────────────────────────────────────────┘             │
│     │                                                           │
│     ▼                                                           │
│  5. Polling /api/crypto/check-payment toutes les 10s            │
│     │                                                           │
│     ▼                                                           │
│  6. Payment détecté on-chain (via RPC)                          │
│     │                                                           │
│     ▼                                                           │
│  7. activateSubscription():                                     │
│     - User.planName = "pro"                                     │
│     - User.planExpiresAt = now + 30 jours                       │
│     - CryptoPayment créé en base                                │
│     │                                                           │
│     ▼                                                           │
│  8. Effets secondaires:                                         │
│     - Email confirmation envoyé (Resend)                        │
│     - Rôle Discord "Pro Trader" assigné                         │
│     - DM Discord envoyé                                         │
│     │                                                           │
│     ▼                                                           │
│  9. Redirect vers /dashboard avec toast "Welcome to PRO!"       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.4 Test Payment ($1)

Système de paiement test permettant de valider l'intégration sans activer d'abonnement:

- Montant: $1 USDC ou USDT
- `daysGranted: 0` (pas d'activation subscription)
- Email de confirmation envoyé
- Visible dans l'historique des paiements
- CTA vers plans réels dans le popup de succès

---

### 5.3 Portfolio Tracking

#### 5.3.1 Vue d'Ensemble

Le Portfolio Tracking permet aux **traders** de connecter leurs exchanges (Binance, Bybit) en **lecture seule** pour:
- Synchroniser automatiquement leurs trades
- Calculer des statistiques vérifiées
- Obtenir le badge "Verified"

**Important**: Il existe 2 systèmes de connexion exchange:

| Système | Utilisateur | Permissions | Usage |
|---------|-------------|-------------|-------|
| `ExchangeConnection` | Traders | READ-ONLY | Vérification stats |
| `UserExchangeConnection` | Followers | READ/WRITE | Copy trading |

#### 5.3.2 Connexion Exchange (Traders)

**Exchanges supportés**:
- Binance (Spot + Futures)
- Bybit (Spot + Futures)

**Limites par plan**:
| Plan | Connexions | Sync interval |
|------|------------|---------------|
| FREE | 0 | N/A |
| PRO | 1 | 5 minutes |
| ULTRA | 3 | 1 minute |

**Flow de connexion**:
1. Trader va sur `/account/exchanges`
2. Entre API Key + Secret Key Binance/Bybit
3. Système valide:
   - Clés valides (test authentication)
   - **READ-ONLY enforcement** (pas de permissions trading/withdrawal)
4. Clés encryptées AES-256-GCM et stockées
5. Premier sync déclenché (30 jours d'historique)
6. Badge "Verified" automatiquement activé

**Encryption des clés API**:
```typescript
// AES-256-GCM avec IV unique par encryption
type EncryptedData = {
  encrypted: string;  // Ciphertext (hex)
  iv: string;         // 16 bytes random (hex)
  tag: string;        // Auth tag 16 bytes (hex)
};

function encryptApiKey(plaintext: string): EncryptedData {
  const key = deriveKey(ENCRYPTION_SECRET);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  };
}
```

#### 5.3.3 Synchronisation des Trades

**Mécanisme**:
- Cron job Vercel toutes les 5 minutes
- Fetch trades via ccxt (bibliothèque multi-exchange)
- Upsert idempotent (via `externalOrderId` unique)
- Recalcul des snapshots de performance après chaque sync

**Données synchronisées par trade**:
```typescript
type ExchangeTrade = {
  externalOrderId: string;    // ID Binance/Bybit (unique)
  symbol: string;             // "BTC/USDT"
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | ...;
  quantity: number;
  price: number;
  quoteQuantity: number;      // Total en USDT
  fee: number;
  feeAsset: string;           // "BNB", "USDT"
  realizedPnl?: number;       // Futures uniquement
  executedAt: Date;
};
```

#### 5.3.4 Calcul des Performances

**15 métriques calculées automatiquement**:

| Métrique | Formule | Description |
|----------|---------|-------------|
| Winrate | wins / total × 100 | Pourcentage de trades gagnants |
| Net PnL | Σ profits - Σ losses | Profit net total |
| Profit Factor | Σ profits / Σ losses | Ratio profits/pertes |
| Average Win | Σ wins / nbWins | Gain moyen par trade gagnant |
| Average Loss | Σ losses / nbLosses | Perte moyenne par trade perdant |
| Largest Win | max(profits) | Plus gros gain |
| Largest Loss | max(losses) | Plus grosse perte |
| Sharpe Ratio | (µ - rf) / σ | Rendement ajusté au risque total |
| Sortino Ratio | (µ - rf) / σdown | Rendement ajusté au risque baissier |
| Max Drawdown | max(peak - trough) | Plus grosse baisse depuis un sommet |

**4 périodes de calcul**:
- ALL_TIME: Tous les trades
- LAST_30D: 30 derniers jours
- LAST_90D: 90 derniers jours
- LAST_365D: 365 derniers jours

**Stockage**: Snapshots pré-calculés en base pour performance (pas de recalcul à chaque affichage).

---

### 5.4 Console de Risque

#### 5.4.1 Concept "Risk-First"

La console de risque implémente la **règle des 2%**: ne jamais risquer plus de 2% de son capital sur un seul trade.

**Pourquoi c'est crucial**:
- Avec 2% de risque: survie à 50 pertes consécutives
- Avec 10% de risque: ruine après 10 pertes
- Protection contre le "revenge trading" et l'over-leverage

#### 5.4.2 Disponibilité par Plan

| Plan | Accès |
|------|-------|
| FREE | Démo sur landing page (non authentifié) |
| PRO | Accès complet + historique + presets |
| ULTRA | + Capital live depuis exchanges connectés |

#### 5.4.3 Calculs Implémentés

**1. Montant à risquer**:
```
riskAmount = capital × (riskPercent / 100)

Exemple: $10,000 × 2% = $200 maximum à risquer
```

**2. Taille de position**:
```
stopLossDistance = |entryPrice - stopLoss|
stopLossPercent = stopLossDistance / entryPrice
positionSize = riskAmount / stopLossPercent

Exemple LONG:
- Entry: $42,000
- Stop: $41,000
- Distance: $1,000 (2.38%)
- Risk: $200
- Position: $200 / 0.0238 = $8,400
```

**3. Quantité (contracts)**:
```
contracts = positionSize / entryPrice

Exemple: $8,400 / $42,000 = 0.2 BTC
```

**4. Risk/Reward Ratio**:
```
LONG:
  profit = takeProfit - entry
  loss = entry - stopLoss
  R/R = profit / loss

SHORT:
  profit = entry - takeProfit
  loss = stopLoss - entry
  R/R = profit / loss
```

#### 5.4.4 Multiple Take Profits

Support de jusqu'à 4 niveaux de TP avec allocation pondérée:

```typescript
takeProfits = [
  { price: 44000, allocation: 25 },  // TP1: fermer 25%
  { price: 46000, allocation: 50 },  // TP2: fermer 50%
  { price: 48000, allocation: 25 },  // TP3: fermer 25%
];

// Total = 100%

// R/R pondéré
weightedRR = Σ(rrForTP × allocation / 100)
```

#### 5.4.5 Features Phase 2 (Prévues)

- **Capital Live**: Auto-remplissage depuis Binance/Bybit connecté
- **Historique**: Sauvegarde de tous les calculs
- **Presets**: Templates réutilisables (Conservative 1%, Moderate 2%, Aggressive 3%)
- **Mini-Console**: Intégration dans le formulaire de création de signal

---

### 5.5 Copy Trading

#### 5.5.1 Deux Modes de Copy Trading

**Mode MANUAL (Journal Personnel)**:
- L'utilisateur copie le signal dans son journal de trading
- Aucune exécution automatique
- Il exécute manuellement sur son exchange
- Suivi de la position via l'interface MyCryptoPilot

**Mode AUTO (Exécution Automatique)**:
- Connexion API exchange avec permissions WRITE
- Exécution automatique des ordres
- Position sizing ajustée au capital utilisateur
- Circuit breakers intégrés pour protection

#### 5.5.2 Différences SPOT vs FUTURES

**SPOT Trading**:
```typescript
// Position sizing simple
const quantity = capital / entryPrice;
// $1000 / $50000 = 0.02 BTC
```

**FUTURES Trading**:
```typescript
// Position sizing avec leverage
const quantity = (capital × leverage) / entryPrice;
// ($1000 × 10x) / $50000 = 0.2 BTC
```

| Aspect | SPOT | FUTURES |
|--------|------|---------|
| Liquidation | Non | Oui (tracking) |
| Leverage | 1x | 1-125x |
| Ownership | Direct | Dérivé |
| Risque | Modéré | Élevé |

#### 5.5.3 Circuit Breakers (Sécurité)

**1. Max Position Size**:
```typescript
if (copyValue > maxPositionSize) {
  throw new Error("Position size exceeds limit");
}
```

**2. Daily Trade Limit**:
```typescript
const dailyCopies = await getCopyTradesCountToday(userId);
if (dailyCopies >= 10) {
  throw new Error("Daily copy limit reached");
}
```

**3. Stop Loss Auto**:
```typescript
const dailyPnl = await calculateDailyPnL(userId);
if (dailyPnl < -maxDailyLoss) {
  await disableCopyTrading(userId);
  // Notification à l'utilisateur
}
```

#### 5.5.4 État Actuel

- ✅ Mode MANUAL implémenté
- ✅ UI CopyTrade Button/Dialog
- 🚧 Mode AUTO: queue d'exécution à implémenter (TODO)

---

### 5.6 Intégration Discord

#### 5.6.1 Fonctionnalités du Bot

**11 commandes slash** (5 utilisateur + 6 admin):

**Commandes Utilisateur**:
| Commande | Description |
|----------|-------------|
| `/help` | Liste des commandes disponibles |
| `/status` | Affiche le plan actuel et limites |
| `/upgrade` | Lien vers page pricing |
| `/link` | Lier compte Discord à MyCryptoPilot |
| `/portfolio` | Affiche exchanges connectés |

**Commandes Admin**:
| Commande | Description |
|----------|-------------|
| `/deploy-commands` | Republier les slash commands |
| `/create-roles` | Créer rôles Free/Pro/Ultra |
| `/sync-roles` | Synchroniser tous les rôles |
| `/test-signal <traderId>` | Envoyer signal de test |
| `/stats` | Statistiques serveur |
| `/purge <count>` | Supprimer messages |

#### 5.6.2 Rôles Automatiques

**Attribution automatique lors**:
1. Connexion OAuth Discord
2. Upgrade de plan (crypto payment)
3. Expiration de plan (downgrade)

**Hiérarchie des rôles**:
```
1. 🤖 BotMyCryptoPilot  ← Bot (doit être en haut!)
2. 👑 Admin
3. 🛡️ Mod
4. 🚀 Ultra Trader      ← Plan ULTRA
5. 💎 Pro Trader        ← Plan PRO
6. 🆓 Free Member       ← Plan FREE
7. @everyone
```

**Permissions par rôle**:

| Feature | FREE | PRO | ULTRA |
|---------|------|-----|-------|
| Channels publics | ✅ | ✅ | ✅ |
| Signaux détaillés | ❌ | ✅ | ✅ |
| Notifications DM | ❌ | ✅ | ✅ |
| Channels privés traders | ❌ | ✅ | ✅ |
| Ultra Lounge | ❌ | ❌ | ✅ |

#### 5.6.3 Notifications Signaux

**Webhook Discord**:
- Déclenché à chaque publication de signal
- Embed riche avec détails du signal
- Mention des followers concernés

**Format du message**:
```
📊 New Signal from @TraderName

🪙 BTC/USDT LONG
📥 Entry: $42,000
🛑 Stop Loss: $41,000
🎯 Take Profits:
   TP1: $44,000 (25%)
   TP2: $46,000 (50%)
   TP3: $48,000 (25%)

📈 Risk/Reward: 1:3.0 (Excellent)
⏰ Valid for: 24h
```

#### 5.6.4 Infrastructure

**Déploiement**: Fly.io worker (24/7)
- Process séparé du site Next.js
- Cron jobs (sync exchanges, expiration plans)
- Gateway intents activés (SERVER MEMBERS, MESSAGE CONTENT)

---

## 6. Flux Utilisateurs

### 6.1 Onboarding Nouveau Follower

```
┌────────────────────────────────────────────────────────────────┐
│                   ONBOARDING FOLLOWER                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Landing Page (mycryptopilot.app)                           │
│     │                                                          │
│     ├─► Voir démo Risk Console (sans login)                    │
│     ├─► Voir marketplace traders (preview)                     │
│     │                                                          │
│     ▼                                                          │
│  2. Sign Up (email magic link ou OAuth Discord/Google)         │
│     │                                                          │
│     ▼                                                          │
│  3. Auto-création: User + Organization (1:1) + Plan FREE       │
│     │                                                          │
│     ▼                                                          │
│  4. Dashboard (plan FREE actif)                                │
│     │                                                          │
│     ├─► Explorer marketplace (/traders)                        │
│     ├─► Follow 1 trader (limite FREE)                          │
│     ├─► Voir 5 signaux/jour (teasers floutés)                  │
│     │                                                          │
│     ▼                                                          │
│  5. Upsell: "Upgrade to PRO for full signals"                  │
│     │                                                          │
│     ▼                                                          │
│  6. Checkout crypto ($49 USDC/USDT)                            │
│     │                                                          │
│     ▼                                                          │
│  7. PRO activé:                                                │
│     - 50 signaux/jour                                          │
│     - 5 traders max                                            │
│     - Console risque complète                                  │
│     - Rôle Discord "Pro Trader"                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Onboarding Nouveau Trader

```
┌────────────────────────────────────────────────────────────────┐
│                   ONBOARDING TRADER                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. User existant avec plan PRO ou ULTRA                       │
│     │                                                          │
│     ▼                                                          │
│  2. Clic "Become a Trader" (/account/become-trader)            │
│     │                                                          │
│     ▼                                                          │
│  3. Formulaire profil trader:                                  │
│     - Display name                                             │
│     - Bio (expertise, style)                                   │
│     - Spécialité (SPOT/FUTURES)                                │
│     - Photo profil                                             │
│     - Liens sociaux                                            │
│     │                                                          │
│     ▼                                                          │
│  4. Profil créé (verified: false)                              │
│     │                                                          │
│     ▼                                                          │
│  5. Connecter exchange (/account/exchanges)                    │
│     │                                                          │
│     ├─► Entrer API Key + Secret (READ-ONLY!)                   │
│     ├─► Validation automatique permissions                     │
│     ├─► Encryption AES-256-GCM                                 │
│     │                                                          │
│     ▼                                                          │
│  6. Premier sync (30 jours de trades)                          │
│     │                                                          │
│     ▼                                                          │
│  7. Badge "Verified" activé ✅                                 │
│     │                                                          │
│     ▼                                                          │
│  8. Profil visible dans marketplace                            │
│     │                                                          │
│     ▼                                                          │
│  9. Publier premier signal (/dashboard/trader/signals/new)     │
│     │                                                          │
│     ▼                                                          │
│  10. Signal diffusé aux followers + Discord                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.3 Flux Paiement Crypto

(Voir section 5.2.3 pour le diagramme détaillé)

---

## 7. Modèles de Données

### 7.1 Schéma Prisma Simplifié

```prisma
// ═══════════════════════════════════════════════════════════════
// AUTHENTIFICATION & UTILISATEURS
// ═══════════════════════════════════════════════════════════════

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  image           String?

  // Plan & Subscription
  planName        String    @default("free")  // free, pro, ultra
  planExpiresAt   DateTime?

  // Discord
  discordId       String?   @unique

  // Relations
  traderProfile   TraderProfile?
  follows         Follow[]  @relation("FollowerToFollow")
  cryptoAddresses CryptoAddress[]
  cryptoPayments  CryptoPayment[]
  copyTrades      CopyTrade[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ═══════════════════════════════════════════════════════════════
// TRADING SOCIAL
// ═══════════════════════════════════════════════════════════════

model TraderProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])

  displayName   String
  bio           String?
  specialty     Specialty @default(BOTH)  // SPOT, FUTURES, BOTH
  socialLinks   Json?

  verified      Boolean   @default(false)
  verifiedAt    DateTime?
  statsJson     Json?     // Cached stats

  // Relations
  signals       Signal[]
  followers     Follow[]
  connections   ExchangeConnection[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Signal {
  id            String    @id @default(cuid())
  traderId      String
  trader        TraderProfile @relation(fields: [traderId], references: [id])

  payloadJson   Json      // TradingCard structured data
  ttlSec        Int       @default(86400)  // 24h default
  expiresAt     DateTime
  status        SignalStatus @default(ACTIVE)
  hash          String?   @unique  // For deduplication

  linkedTradeId String?   // Optional link to TraderTrade

  createdAt     DateTime  @default(now())
}

model Follow {
  id          String    @id @default(cuid())
  followerId  String
  follower    User      @relation("FollowerToFollow", fields: [followerId], references: [id])
  traderId    String
  trader      TraderProfile @relation(fields: [traderId], references: [id])

  status      FollowStatus @default(ACTIVE)
  source      String    @default("WEBAPP")

  createdAt   DateTime  @default(now())

  @@unique([followerId, traderId])
}

// ═══════════════════════════════════════════════════════════════
// PAIEMENTS CRYPTO
// ═══════════════════════════════════════════════════════════════

model CryptoAddress {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])

  network         Network   // BASE, TRON
  address         String
  derivationIndex Int

  expiresAt       DateTime
  usedAt          DateTime?

  createdAt       DateTime  @default(now())

  @@unique([network, derivationIndex])
}

model CryptoPayment {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])

  plan          String
  network       Network
  currency      String    // USDC, USDT
  amountToken   Decimal
  amountUSD     Decimal
  txHash        String    @unique
  confirmations Int
  status        PaymentStatus
  daysGranted   Int

  confirmedAt   DateTime?
  createdAt     DateTime  @default(now())
}

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO TRACKING
// ═══════════════════════════════════════════════════════════════

model ExchangeConnection {
  id                String    @id @default(cuid())
  traderProfileId   String
  trader            TraderProfile @relation(fields: [traderProfileId], references: [id])

  exchange          Exchange  // BINANCE, BYBIT
  encryptedApiKey   String
  encryptedSecretKey String
  keyIv             String
  keyTag            String

  isActive          Boolean   @default(true)
  lastSyncedAt      DateTime?
  lastSyncError     String?
  nextSyncAt        DateTime?

  trades            ExchangeTrade[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([traderProfileId, exchange])
}

model ExchangeTrade {
  id              String    @id @default(cuid())
  connectionId    String
  connection      ExchangeConnection @relation(fields: [connectionId], references: [id])

  externalOrderId String    @unique
  symbol          String
  side            TradeSide
  type            OrderType
  quantity        Decimal
  price           Decimal
  quoteQuantity   Decimal
  fee             Decimal
  feeAsset        String
  realizedPnl     Decimal?

  executedAt      DateTime
  createdAt       DateTime  @default(now())
}

model TraderPerformanceSnapshot {
  id              String    @id @default(cuid())
  traderProfileId String
  trader          TraderProfile @relation(fields: [traderProfileId], references: [id])

  period          PerformancePeriod
  totalTrades     Int
  winningTrades   Int
  losingTrades    Int
  winrate         Decimal
  totalProfits    Decimal
  totalLosses     Decimal
  netPnl          Decimal
  profitFactor    Decimal
  sharpeRatio     Decimal?
  sortinoRatio    Decimal?
  maxDrawdown     Decimal
  averageWin      Decimal
  averageLoss     Decimal
  largestWin      Decimal
  largestLoss     Decimal

  calculatedAt    DateTime
  createdAt       DateTime  @default(now())

  @@unique([traderProfileId, period])
}

// ═══════════════════════════════════════════════════════════════
// COPY TRADING
// ═══════════════════════════════════════════════════════════════

model UserExchangeConnection {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  exchange          Exchange
  mode              CopyMode  // MANUAL, AUTO
  encryptedApiKey   String
  encryptedSecretKey String
  keyIv             String
  keyTag            String

  isActive          Boolean   @default(true)

  copyTrades        CopyTrade[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model CopyTrade {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  connectionId    String?
  connection      UserExchangeConnection? @relation(fields: [connectionId], references: [id])

  sourceSignalId  String?
  sourceTradeId   String?

  symbol          String
  side            TradeSide
  entryPrice      Decimal
  quantity        Decimal
  status          CopyTradeStatus
  pnl             Decimal?
  fills           Json?

  createdAt       DateTime  @default(now())
  closedAt        DateTime?
}

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

enum Network { BASE, TRON }
enum Exchange { BINANCE, BYBIT }
enum Specialty { SPOT, FUTURES, BOTH }
enum TradeSide { BUY, SELL }
enum OrderType { MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT }
enum SignalStatus { ACTIVE, TRIGGERED, INVALIDATED, EXPIRED }
enum FollowStatus { ACTIVE, INACTIVE }
enum PaymentStatus { PENDING, CONFIRMED, FAILED }
enum PerformancePeriod { ALL_TIME, LAST_30D, LAST_90D, LAST_365D }
enum CopyMode { MANUAL, AUTO }
enum CopyTradeStatus { PENDING, OPEN, CLOSED, CANCELLED }
```

### 7.2 Migrations Appliquées

23 migrations au total (novembre 2025):
- Auth tables (Better Auth)
- Trading models (TraderProfile, Signal, Follow)
- Crypto payments (CryptoAddress, CryptoPayment)
- Portfolio tracking (ExchangeConnection, ExchangeTrade, Snapshots)
- Copy trading (UserExchangeConnection, CopyTrade)
- Unified trading system

---

## 8. Sécurité

### 8.1 Authentification

**Better Auth** avec support:
- Magic link (email)
- OAuth: Discord, Google
- Session JWT sécurisée

**Gestion des rôles**:
- `User.planName`: free, pro, ultra
- Vérification côté serveur sur chaque route protégée

### 8.2 Encryption des Clés API

**Algorithme**: AES-256-GCM (authenticated encryption)

**Propriétés**:
- **IV unique**: 16 bytes random par encryption
- **Auth tag**: 16 bytes pour vérification intégrité
- **Key derivation**: PBKDF2 depuis `ENCRYPTION_SECRET`

**Jamais**:
- ❌ Stocker clés en clair
- ❌ Logger clés (même encryptées)
- ❌ Exposer en API responses

### 8.3 Validation API Exchange

**Read-only enforcement**:
```typescript
// Binance: vérifier restrictions
const restrictions = await exchange.sapiGetAccountApiRestrictions();
const isReadOnly =
  !restrictions.enableSpotAndMarginTrading &&
  !restrictions.enableFutures &&
  !restrictions.enableWithdrawals;

if (!isReadOnly) {
  throw new Error("API keys must be read-only");
}
```

### 8.4 Protection des Paiements

**Idempotence**: `txHash` unique constraint
- Impossible de créditer 2x le même paiement

**Confirmations**:
- Base: 1 bloc minimum
- Tron: 2 blocs minimum

**Expiration adresses**: 15 minutes
- Évite réutilisation accidentelle

### 8.5 Circuit Breakers Copy Trading

- Max position size par copy
- Limite quotidienne (10 copies/jour)
- Stop loss automatique si pertes > seuil

---

## 9. Intégrations Externes

### 9.1 Exchanges

| Exchange | Version API | Features |
|----------|-------------|----------|
| Binance | v3 (via ccxt) | Spot, Futures, Balance, Trades |
| Bybit | v5 (via ccxt) | Spot, Futures, Balance, Trades |

**Bibliothèque**: ccxt (Cryptocurrency eXchange Trading)
- Rate limiting automatique
- API unifiée multi-exchange

### 9.2 Blockchains (Paiements)

| Network | Token | RPC |
|---------|-------|-----|
| Base | USDC | Alchemy / Base public |
| Tron | USDT TRC-20 | TronGrid |

**Bibliothèques**:
- ethers.js v6 (Base)
- TronWeb (Tron)

### 9.3 Services

| Service | Usage |
|---------|-------|
| Resend | Envoi emails transactionnels |
| Discord | Bot + OAuth + Webhooks |
| Vercel | Hosting Next.js + Analytics |
| Fly.io | Worker (Bot Discord + Cron) |
| Neon | PostgreSQL serverless |

---

## 10. État Actuel et Roadmap

### 10.1 Modules Livrés (Novembre 2025)

| Module | Status | Couverture |
|--------|--------|------------|
| Auth & Plans | ✅ | 100% |
| Trading Social | ✅ | 100% |
| Paiements Crypto | ✅ | 100% |
| Portfolio Tracking | ✅ | 95% (docs manquants) |
| Console Risque | ✅ | Phase 1 (MVP) |
| Discord Bot | ✅ | 100% (11 commandes) |
| Copy Trading | 🚧 | 70% (queue AUTO à faire) |

### 10.2 TODOs Identifiés

| Fichier | Description |
|---------|-------------|
| `tier-check-job.ts` | Notifications tier-up + récompenses |
| `copy-trade.service.ts` | Queue exécution AUTO |
| `user-exchange-connection.service.ts` | Validation API réelle |
| `send-signal-notification.ts` | Préférences email utilisateur |
| `email-notifications.ts` | Template rapport hebdomadaire |
| `user-management.ts` | Channels Discord privés par trader |

### 10.3 Roadmap Technique

**Court terme (Q1 2026)**:
1. Finaliser validation API exchange utilisateurs
2. Implémenter queue copy trading AUTO
3. Notifications tier-check + email hebdo
4. Dashboard monitoring sweeps

**Moyen terme (Q2-Q3 2026)**:
- Journal de trading complet
- Console risque Phase 2 (capital live, historique, presets)
- Système de referral traders
- Support multi-langue (EN)

**Long terme (2027+)**:
- Application mobile native
- API publique pour intégrateurs
- Nouveaux exchanges (Kraken, OKX)
- Copy trading cross-exchange

### 10.4 Refactoring Planifié

**RFC-001: Suppression Organizations**

Architecture actuelle héritée de NOW.TS (multi-tenant B2B) avec 1 org = 1 user.

**Objectif**: Simplifier vers modèle B2C pur sans organizations.

**Impact**: 150+ fichiers, 26-35 jours de travail.

**Bénéfices**:
- -30% queries DB
- URLs simplifiées (`/dashboard` vs `/orgs/xxx/dashboard`)
- Maintenance réduite

**Status**: Phase 0 (Design) validée, Phase 1 en attente.

---

## Annexes

### A. Variables d'Environnement Requises

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="https://mycryptopilot.app"

# Discord
DISCORD_BOT_TOKEN="..."
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_GUILD_ID="..."
DISCORD_BOT_ENABLED="true"

# Crypto Payments
CRYPTO_XPUB_BASE="xpub6F..."
CRYPTO_XPUB_TRON="xpub6D..."
BASE_RPC_URL="https://mainnet.base.org"
TRON_RPC_URL="https://api.trongrid.io"

# Encryption
ENCRYPTION_SECRET="32-char-minimum-secret-key-here"

# Email
RESEND_API_KEY="re_..."

# Cron
CRON_SECRET="..."
```

### B. Commandes Utiles

```bash
# Développement
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm ts               # TypeScript check
pnpm lint             # ESLint + auto-fix

# Database
npx prisma migrate dev --name xxx  # Nouvelle migration
npx prisma generate                 # Générer client
npx prisma studio                   # GUI database

# Tests
pnpm test:ci          # Unit tests
pnpm test:e2e:ci      # E2E tests

# Discord Bot (local)
npx tsx scripts/start-discord-bot.ts
```

### C. Documentation Complémentaire

| Document | Contenu |
|----------|---------|
| `.claude/CLAUDE.md` | Instructions Claude Code |
| `.claude/docs/DATABASE.md` | Schémas Prisma détaillés |
| `.claude/docs/CRYPTO-PAYMENTS.md` | HD Wallet, RPC, checkout |
| `.claude/docs/SUBSCRIPTIONS.md` | Gestion abonnements |
| `.claude/docs/TRADING-SYSTEM.md` | Signaux, follow, copy |
| `.claude/docs/PORTFOLIO-TRACKING.md` | Binance/Bybit integration |
| `.claude/docs/DISCORD-SETUP.md` | Configuration bot Discord |
| `.claude/docs/RISK-CONSOLE.md` | Console de risque |
| `.claude/docs/DEVELOPMENT.md` | État actuel, roadmap |

---

**Fin du document de spécifications**

*Ce document est maintenu par l'équipe MyCryptoPilot et mis à jour à chaque évolution majeure du projet.*
