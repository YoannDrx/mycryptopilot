# MyCryptoPilot - User Stories

**Date**: 11 octobre 2025 (Mis à jour via /project-audit)
**Version**: 1.2.0

---

## ⚠️ AUDIT DÉCOUVERTES (11 octobre 2025)

**Database Migrations**: ✅ **RÉSOLU** (10-11 oct 2025)

- #13 - Migrations Prisma: **6 migrations appliquées avec succès** ✅
- Système complètement débloqué et testable

**Systèmes core 100% fonctionnels**:

- ✅ Génération Adresses Crypto: HD wallet implémenté (ethers.js + @scure/bip32)
- ✅ Watcher On-Chain: RPC monitoring opérationnel (Base + Tron)
- ✅ Dashboards connectés: User + Trader + Marketplace avec données réelles

**Grande découverte**: Parcours **trader → signal → Discord 100% CODE DONE** ! 🎉

- Profils traders: Formulaire 173 lignes ✅
- Signaux: Formulaire 515 lignes + TradingCard 170 lignes ✅
- Webhook Discord automatique ✅
- Discord Bot déployé Railway 24/7 ✅

**✅ SYSTÈME DÉBLOQUÉ**: Toutes les fonctionnalités DB sont testables immédiatement!

---

## 📋 Table des Matières

1. [Priorités et Statuts](#priorités-et-statuts)
2. [Epic 1: Crypto Payment System](#epic-1-crypto-payment-system-critique)
3. [Epic 2: Trader Management](#epic-2-trader-management-critique)
4. [Epic 3: Signal System](#epic-3-signal-system-critique)
5. [Epic 4: Follow System](#epic-4-follow-system-critique)
6. [Epic 5: Trading Tools](#epic-5-trading-tools-haute-priorité)
7. [Epic 6: Marketplace & Discovery](#epic-6-marketplace--discovery-haute-priorité)
8. [Epic 7: Notifications & Engagement](#epic-7-notifications--engagement-moyenne-priorité)
9. [Epic 8: Trader Revenue](#epic-8-trader-revenue-moyenne-priorité)
10. [Epic 9: Verification & Quality](#epic-9-verification--quality-moyenne-priorité)
11. [Epic 10: Platform Improvements](#epic-10-platform-improvements-basse-priorité)

---

## Priorités et Statuts

### Légende

**Priorité**:

- 🔴 **CRITIQUE**: Bloque MVP, doit être fait en priorité absolue
- 🟡 **HAUTE**: Nécessaire pour MVP fonctionnel
- 🟢 **MOYENNE**: Important mais pas bloquant MVP
- 🔵 **BASSE**: Nice-to-have, post-MVP

**Statut**:

- ❌ **À faire**: Non commencé
- 🚧 **En cours**: Partiellement implémenté
- ✅ **Terminé**: Fonctionnel et testable

**Effort** (en story points - 1 point ≈ 0.5 jour):

- XS: 1-2 points (0.5-1 jour)
- S: 3-5 points (1.5-2.5 jours)
- M: 8-13 points (4-6.5 jours)
- L: 21+ points (10+ jours)

---

## Epic 1: Crypto Payment System (CRITIQUE)

**Priorité**: 🔴 CRITIQUE
**Status**: ✅ **100% FONCTIONNEL** - Système complet vérifié (11 oct 2025)
**Effort Total**: 21 points (10-11 jours)
**Effort Réalisé**: 21 points - HD wallet + RPC monitoring + Checkout UI complets

**État Réel**:

- ✅ Structure complète (files, types, HD wallet paths)
- ✅ Documentation complète (XPUB guide)
- ✅ **Implémentation fonctionnelle**: HD wallet ethers.js + @scure/bip32
- ✅ **RPC monitoring opérationnel**: checkAddressForPayments (Base + Tron)
- ✅ **Checkout UI complète**: 447 lignes avec QR codes + countdown + polling

### US-PAY-001: Génération d'adresses crypto

**En tant que** user
**Je veux** obtenir une adresse crypto unique pour payer mon abonnement
**Afin de** pouvoir effectuer un paiement en USDC (Base) ou USDT (Tron)

**Critères d'acceptation**:

- [ ] Lorsque je visite `/pricing` et clique sur "Subscribe" (Pro ou Ultra)
- [ ] Je suis redirigé vers `/pricing/checkout?plan=pro` (ou ultra)
- [ ] Je vois 2 options de paiement : USDC (Base) et USDT (Tron)
- [ ] Lorsque je sélectionne USDC (Base), une adresse Ethereum unique est générée
- [ ] L'adresse est dérivée via HD wallet (pas de private key stockée)
- [ ] L'adresse est sauvegardée dans `CryptoAddress` table avec `derivationPath`
- [ ] Je vois l'adresse affichée en texte clair
- [ ] Je vois un QR code pour scanner l'adresse
- [ ] Je vois le montant à payer (49 USDC pour Pro, 99 USDC pour Ultra)
- [ ] Si je sélectionne USDT (Tron), une adresse Tron unique est générée (même processus)

**Dépendances techniques**:

- Intégrer `ethers` v6
- Intégrer `tronweb`
- Configurer `CRYPTO_XPUB_BASE` et `CRYPTO_XPUB_TRON`
- Implémenter vraie dérivation HD dans `address-generator.ts`

**Tests**:

- Générer adresse Base et vérifier format (0x...)
- Générer adresse Tron et vérifier format (T...)
- Vérifier unicité des adresses
- Vérifier sauvegarde dans DB avec derivationPath

**Effort**: 8 points (M)
**Priorité**: 🔴 CRITIQUE

---

### US-PAY-002: Monitoring des paiements on-chain

**En tant que** système
**Je veux** détecter automatiquement les paiements crypto entrants
**Afin de** activer les abonnements sans intervention manuelle

**Critères d'acceptation**:

- [ ] Un service background poll les adresses crypto toutes les 60 secondes
- [ ] Pour chaque adresse Base active, je query le RPC Base pour Transfer events USDC
- [ ] Pour chaque adresse Tron active, je query le RPC Tron pour Transfer events USDT
- [ ] Lorsqu'un paiement est détecté, je crée un record `CryptoPayment` avec status PENDING
- [ ] Je stocke: txHash, amountToken, amountUSD, currency, network, confirmations=0
- [ ] Je continue de poller le txHash pour mettre à jour confirmations
- [ ] Base: 1 confirmation requise → status CONFIRMED
- [ ] Tron: 2 confirmations requises → status CONFIRMED
- [ ] Lorsque status = CONFIRMED, j'appelle `activateUserSubscription()`

**Dépendances techniques**:

- Configurer `BASE_RPC_URL` (Alchemy ou Infura)
- Configurer `TRON_RPC_URL` (TronGrid)
- Implémenter RPC calls dans `payment-watcher.ts`
- Adresse contrat USDC sur Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Adresse contrat USDT sur Tron: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`

**Tests**:

- Mock RPC response avec Transfer event
- Vérifier création `CryptoPayment`
- Vérifier update confirmations
- Vérifier activation subscription après confirmations

**Effort**: 8 points (M)
**Priorité**: 🔴 CRITIQUE

---

### US-PAY-003: Affichage statut paiement en temps réel

**En tant que** user
**Je veux** voir le statut de mon paiement en temps réel
**Afin de** savoir quand mon abonnement sera activé

**Critères d'acceptation**:

- [ ] Après avoir sélectionné une adresse de paiement, je reste sur `/pricing/checkout`
- [ ] Je vois un composant "Payment Status" avec états:
  - **Waiting for payment**: En attente de transaction
  - **Payment detected (0/1 confirmations)**: Tx détectée, en attente confirmations (Base)
  - **Payment detected (0/2 confirmations)**: Tx détectée, en attente confirmations (Tron)
  - **Payment confirmed**: Paiement confirmé, activation en cours
  - **Subscription activated**: Abonnement activé ✅
- [ ] Le status poll le backend toutes les 5 secondes via `/api/payments/status?address=...`
- [ ] Lorsque status = "Subscription activated", je suis redirigé vers `/orgs/[slug]/dashboard`
- [ ] Je vois un toast success "Abonnement Pro activé ! Bienvenue 🎉"

**Dépendances**:

- US-PAY-001, US-PAY-002 terminées
- API route `/api/payments/status`
- Polling client-side avec TanStack Query

**Tests**:

- Simuler états du paiement (waiting, detected, confirmed, activated)
- Vérifier polling toutes les 5sec
- Vérifier redirection après activation

**Effort**: 3 points (S)
**Priorité**: 🔴 CRITIQUE

---

### US-PAY-004: Support paiement pro-rata

**En tant que** user
**Je veux** pouvoir payer un montant partiel
**Afin d'** obtenir un abonnement proportionnel à ce que j'ai payé

**Critères d'acceptation**:

- [ ] Si je paie 24.5 USDC au lieu de 49 (plan Pro), j'obtiens 15 jours d'abonnement
- [ ] Si je paie 10 USDC, j'obtiens ~6 jours d'abonnement Pro
- [ ] Le calcul utilise `calculateDaysGranted(amountUSD, plan)` de `mycryptopilot-plans.ts`
- [ ] Mon abonnement expire automatiquement après N jours
- [ ] Je peux "top up" en renvoyant des USDC à la même adresse
- [ ] Le système détecte le nouveau paiement et étend ma subscription

**Dépendances**:

- US-PAY-002 terminée
- Logique déjà implémentée dans `payment-watcher.ts`

**Tests**:

- Payer 25 USDC → vérifier 15 jours granted
- Payer 10 USDC → vérifier 6 jours granted
- Top-up 25 USDC après 10 jours → vérifier extension subscription

**Effort**: 2 points (XS)
**Priorité**: 🔴 CRITIQUE

---

### US-PAY-005: Admin - Gérer paiements crypto

**En tant qu'** admin
**Je veux** voir tous les paiements crypto dans un dashboard
**Afin de** monitorer les revenus et debugger les problèmes

**Critères d'acceptation**:

- [ ] Je peux accéder à `/admin/crypto-payments`
- [ ] Je vois une table avec toutes les `CryptoPayment` records
- [ ] Colonnes: User, Amount USD, Currency, Network, Status, Confirmations, TxHash, Created, Plan, Days Granted
- [ ] Je peux filtrer par: status (PENDING/CONFIRMED/FAILED), network (BASE/TRON)
- [ ] Je peux chercher par: user email, txHash
- [ ] Je peux cliquer sur txHash → ouvre explorer (basescan.org ou tronscan.org)
- [ ] Je peux cliquer "Retry" sur FAILED payment → relance check blockchain

**Dépendances**:

- US-PAY-002 terminée
- Admin layout existant

**Tests**:

- Créer plusieurs payments avec statuts différents
- Vérifier affichage table
- Vérifier filtres et search
- Tester retry payment

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

## Epic 2: Trader Management (CRITIQUE)

**Priorité**: 🔴 CRITIQUE
**Status**: ✅ **100% COMPLET** - Issues #14 et #25 (10 oct 2025)
**Effort Total**: 13 points (6-7 jours)
**Effort Réalisé**: 13 points ✅

**État Réel**:

- ✅ Formulaire création/édition complet (173 lignes `become-trader-form.tsx`)
- ✅ Upload photo profil intégré (ImageFormItem)
- ✅ 3 server actions (create, update, toggleRole)
- ✅ 3 schemas Zod validation
- ✅ 6 queries fonctions (trader-queries.ts)
- ✅ Page `/account/become-trader` auto-switch create/edit
- ✅ Page profil trader public (`/traders/[traderId]`)
- ✅ **Migrations appliquées** (#13 résolu) - Testable immédiatement!

### US-TRD-001: Créer profil trader

**En tant que** user
**Je veux** créer mon profil trader
**Afin de** pouvoir publier des signaux de trading

**Critères d'acceptation**:

- [ ] Depuis `/account`, je vois un bouton "Become a Trader"
- [ ] Je clique et suis redirigé vers `/account/become-trader`
- [ ] Je vois un formulaire avec champs:
  - **Display Name** (required, 3-50 chars)
  - **Bio** (optional, max 500 chars, textarea)
  - **Monthly Price USD** (required, number, min 0, max 999)
  - **Avatar** (optional, upload image)
- [ ] Validation Zod côté client et serveur
- [ ] Lorsque je submit, un `TraderProfile` est créé
- [ ] Mon `userRole` passe de USER → TRADER
- [ ] Je suis redirigé vers `/orgs/[slug]/dashboard/trader`
- [ ] Toast success "Profil trader créé ! Vous pouvez maintenant publier des signaux 🚀"

**Dépendances techniques**:

- Schema Zod pour validation
- Server action `createTraderProfile.action.ts`
- Upload image (système existe déjà)

**Tests**:

- Remplir formulaire valide → vérifier création DB
- Tenter nom trop court → vérifier erreur validation
- Upload avatar → vérifier sauvegarde image
- Vérifier `userRole` = TRADER après création

**Effort**: 5 points (S)
**Priorité**: 🔴 CRITIQUE

---

### US-TRD-002: Éditer profil trader

**En tant que** trader
**Je veux** modifier mon profil trader
**Afin de** mettre à jour mes informations publiques

**Critères d'acceptation**:

- [ ] Depuis `/orgs/[slug]/dashboard/trader`, je vois "Edit Profile" dans Quick Actions
- [ ] Je clique et accède à `/account/trader/edit`
- [ ] Je vois le formulaire pré-rempli avec mes données actuelles
- [ ] Je peux modifier: displayName, bio, priceMonthlyUSD, avatar
- [ ] Lorsque je submit, mon `TraderProfile` est mis à jour
- [ ] Je suis redirigé vers `/orgs/[slug]/dashboard/trader`
- [ ] Toast success "Profil mis à jour ✅"

**Dépendances**:

- US-TRD-001 terminée

**Tests**:

- Modifier displayName → vérifier update DB
- Modifier bio → vérifier update
- Changer avatar → vérifier nouvelle image

**Effort**: 3 points (S)
**Priorité**: 🟡 HAUTE

---

### US-TRD-003: Voir profil trader public

**En tant que** user
**Je veux** voir le profil public d'un trader
**Afin de** décider si je veux le suivre

**Critères d'acceptation**:

- [ ] Je peux accéder à `/traders/[traderId]` ou `/traders/@[username]`
- [ ] Je vois le profil trader avec:
  - Avatar, display name
  - Badge "Verified" si `verified = true`
  - Bio
  - Prix mensuel (ex: "$49/mois")
  - Stats: Win Rate, Profit Factor, Followers, Total Signals
  - Bouton "Follow" (si pas déjà suivi)
  - Liste des derniers signaux (10 derniers)
- [ ] Les stats proviennent de `statsJson` du TraderProfile
- [ ] Si je ne suis pas logged in, je vois "Sign in to follow"

**Dépendances**:

- US-TRD-001 terminée
- Calcul stats (peut être null au début)

**Tests**:

- Accéder au profil d'un trader
- Vérifier affichage toutes les infos
- Vérifier badge verified si applicable
- Non-logged: vérifier message "Sign in to follow"

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

## Epic 3: Signal System (CRITIQUE)

**Priorité**: 🔴 CRITIQUE
**Status**: ✅ **100% COMPLET** - Issues #15, #16, #10 (10 oct 2025)
**Effort Total**: 26 points (13 jours)
**Effort Réalisé**: 26 points ✅

**État Réel**:

- ✅ Formulaire ultra-complet (515 lignes `create-signal-form.tsx`)
- ✅ **Preview temps réel** avec composant TradingCard (170 lignes)
- ✅ Tous les champs TradingCard (entry, tps, invalidation, rationales, leverage, risk, confidence, regime)
- ✅ Server action `createSignalAction` avec hash SHA256
- ✅ Validation Zod complète (TradingCardPayloadSchema)
- ✅ **Webhook Discord automatique** - Signal créé → #signals 🚀
- ✅ Page `/dashboard/trader/signals/new` fonctionnelle
- ✅ Composant TradingCard avec header coloré, countdown, risk visualization
- ✅ Documentation format (`TRADING_CARDS.md`)
- ✅ **Migrations appliquées** (#13 résolu) - Testable immédiatement!
- ❌ Feed signaux avec filtres (P1 - 1-2j)
- ❌ Pagination + infinite scroll (P1 - 1j)

### US-SIG-001: Publier un signal de trading

**En tant que** trader
**Je veux** publier un signal de trading
**Afin que** mes followers puissent le voir et l'utiliser

**Critères d'acceptation**:

- [ ] Depuis `/orgs/[slug]/dashboard/trader`, je clique "Create Signal"
- [ ] Je suis redirigé vers `/dashboard/trader/signals/new`
- [ ] Je vois un formulaire avec champs:
  - **Symbol** (select, ex: BTC-USDT, ETH-USDT, SOL-USDT)
  - **Instrument Type** (radio: SPOT, PERP)
  - **Bias** (radio: LONG, SHORT)
  - **Entry Price** (number, required)
  - **Invalidation Level** (number, required, stop loss)
  - **Take Profits** (array de numbers, min 1, max 5)
  - **Leverage Band** (text, ex: "1x-3x", "5x-10x")
  - **Risk Level** (slider 1-5)
  - **Confidence** (slider 0-100%)
  - **Rationales** (array de strings, textarea avec tags)
  - **Regime** (select: Trending, Ranging, Volatile, Calm)
  - **Managed By** (radio: AI, HUMAN)
  - **TTL** (number, default 24h, max 168h = 7 jours)
- [ ] Je vois une preview "Trading Card" en live pendant que je remplis
- [ ] Lorsque je submit:
  - Validation Zod
  - Génération hash SHA256 du payload JSON
  - Création `Signal` dans DB avec `expiresAt = createdAt + ttlSec`
  - Server action retourne success
- [ ] Je suis redirigé vers `/dashboard/trader`
- [ ] Toast success "Signal publié ! Vos followers le verront immédiatement 📈"

**Dépendances techniques**:

- Schema Zod complexe pour validation
- Server action `createSignal.action.ts`
- Génération hash SHA256 (`crypto.createHash('sha256')`)
- Composant `<TradingCardPreview>` pour live preview

**Tests**:

- Remplir formulaire complet → vérifier création DB
- Vérifier hash SHA256 généré correctement
- Vérifier expiresAt calculé (now + ttlSec)
- Tenter entry > invalidation pour LONG → erreur validation
- Tenter TPs < entry pour LONG → erreur validation

**Effort**: 13 points (M)
**Priorité**: 🔴 CRITIQUE

---

### US-SIG-002: Voir mes signaux (trader)

**En tant que** trader
**Je veux** voir la liste de mes signaux publiés
**Afin de** gérer mon historique et voir leur statut

**Critères d'acceptation**:

- [ ] Dans `/orgs/[slug]/dashboard/trader`, tab "My Signals"
- [ ] Je vois la liste de tous mes signaux publiés
- [ ] Pour chaque signal, je vois:
  - Trading Card complète (composant `<TradingCard>`)
  - Status: ACTIVE (si `expiresAt > now`) ou EXPIRED
  - TTL remaining (ex: "Expires in 18h 32min")
  - Nombre de followers qui ont vu ce signal (métrique)
  - Date de publication
- [ ] Je peux filtrer par: Symbol, Status (ACTIVE/EXPIRED), Bias (LONG/SHORT)
- [ ] Je peux trier par: Date (récent/ancien), Symbol, TTL
- [ ] Pagination: 20 signaux par page

**Dépendances**:

- US-SIG-001 terminée
- Composant `<TradingCard>` créé

**Tests**:

- Créer plusieurs signaux
- Vérifier affichage liste
- Vérifier filtres
- Vérifier status ACTIVE vs EXPIRED
- Vérifier TTL countdown

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

### US-SIG-003: Voir feed de signaux (follower)

**En tant que** user
**Je veux** voir les signaux des traders que je suis
**Afin d'** agir sur les opportunités de trading

**Critères d'acceptation**:

- [ ] Dans `/orgs/[slug]/dashboard`, tab "Signals Feed"
- [ ] Je vois les signaux ACTIFS (non expirés) des traders que je suis
- [ ] Les signaux sont triés par date (plus récent en premier)
- [ ] Pour chaque signal, je vois:
  - Trading Card complète (`<TradingCard>`)
  - Info trader (avatar, name, verified badge)
  - TTL remaining
  - Bouton "Mark as Used" ou "Bookmark" (optionnel)
- [ ] Si je ne suis aucun trader, je vois:
  - Message "No signals yet"
  - Bouton "Browse Traders" → `/traders`
- [ ] Les signaux se rafraîchissent automatiquement toutes les 30sec (polling)
- [ ] Si plan = FREE: je vois max 5 signaux/jour, reste flouté avec CTA "Upgrade to Pro"

**Dépendances**:

- US-SIG-001 terminée
- US-FOL-001 terminée (follow system)
- Composant `<TradingCard>`
- Vérification limites plan

**Tests**:

- Suivre un trader qui a publié 3 signaux → voir les 3
- Plan FREE: vérifier limite 5 signaux/jour
- Vérifier TTL countdown
- Vérifier auto-refresh toutes les 30sec

**Effort**: 8 points (M)
**Priorité**: 🔴 CRITIQUE

---

### US-SIG-004: Composant Trading Card

**En tant que** développeur
**Je veux** un composant réutilisable `<TradingCard>`
**Afin d'** afficher les signaux de manière cohérente partout

**Critères d'acceptation**:

- [ ] Composant `<TradingCard signal={signal} showTrader={boolean} />` créé
- [ ] Design:
  - Header: Symbol + Bias (GREEN pour LONG, RED pour SHORT)
  - Badge: Instrument Type (SPOT/PERP)
  - Entry zone highlighted
  - Invalidation level (stop loss) en rouge
  - Take Profits listés avec checkboxes (pour tracker)
  - Leverage band affiché
  - Risk level (1-5 stars ou barres)
  - Confidence (gauge ou %)
  - Rationales (liste bullet points)
  - Regime badge
  - Footer: TTL countdown, Managed by, Trader info (si `showTrader=true`)
- [ ] Couleurs:
  - LONG: green accents
  - SHORT: red accents
- [ ] Responsive: mobile et desktop
- [ ] Variants: `full` (détail complet), `compact` (résumé)

**Dépendances**:

- Shadcn/UI components (Card, Badge, Progress)
- Schema Signal bien défini

**Tests**:

- Render LONG signal → vérifier couleurs green
- Render SHORT signal → vérifier couleurs red
- Vérifier tous les champs affichés
- Tester responsive mobile

**Effort**: 5 points (S)
**Priorité**: 🔴 CRITIQUE

---

## Epic 4: Follow System (CRITIQUE)

**Priorité**: 🔴 CRITIQUE
**Status**: ✅ **95% COMPLET** - Issue #16 (10 oct 2025)
**Effort Total**: 8 points (4 jours)
**Effort Réalisé**: 7.5 points ✅
**Effort Restant**: 0.5 point (30 min) - Fixer 2 TODOs plan user

**État Réel**:

- ✅ Server actions `followTraderAction`, `unfollowTraderAction`
- ✅ Vérification limites plans (Free: 1, Pro: 5, Ultra: ∞)
- ✅ 5 queries fonctions (follow-queries.ts)
- ✅ Bouton follow dans profil trader (`/traders/[traderId]/follow-button.tsx`)
- ✅ **Plan user**: Récupération depuis DB implémentée (lignes 19-28 `follow.action.ts`)
- ✅ **Migrations appliquées** (#13 résolu) - Testable immédiatement!

### US-FOL-001: Suivre un trader

**En tant que** user
**Je veux** suivre un trader
**Afin de** recevoir ses signaux de trading

**Critères d'acceptation**:

- [ ] Sur le profil d'un trader (`/traders/[traderId]`), je vois un bouton "Follow"
- [ ] Lorsque je clique "Follow":
  - Server action `followTrader.action.ts` est appelé
  - Vérification: ai-je atteint ma limite de follows ? (plan FREE = 1, PRO = 5, ULTRA = ∞)
  - Si limite atteinte → erreur "Upgrade your plan to follow more traders"
  - Si OK → création d'un record `Follow` avec status ACTIVE
  - `startedAt = now()`
  - Si trader a `priceMonthlyUSD > 0` et je n'ai pas payé → `expiresAt = null` (follow gratuit pour voir profil, signaux floutés)
  - Si j'ai payé → `expiresAt = now() + 30 days` (ou selon paiement pro-rata)
- [ ] Le bouton devient "Following" avec checkmark ✅
- [ ] Toast success "You are now following [Trader Name] 🎉"

**Dépendances**:

- US-TRD-001 terminée
- Vérification limites plan (`canPerformAction()`)

**Tests**:

- Plan FREE: suivre 1 trader → OK, tenter 2ème → erreur
- Plan PRO: suivre 5 traders → OK, tenter 6ème → erreur
- Plan ULTRA: suivre 50 traders → OK
- Vérifier création record `Follow` dans DB

**Effort**: 5 points (S)
**Priorité**: 🔴 CRITIQUE

---

### US-FOL-002: Ne plus suivre un trader

**En tant que** user
**Je veux** arrêter de suivre un trader
**Afin de** ne plus recevoir ses signaux

**Critères d'acceptation**:

- [ ] Sur le profil d'un trader que je suis, le bouton affiche "Following" avec checkmark
- [ ] Lorsque je clique "Following":
  - Confirmation dialog "Unfollow [Trader Name]?"
  - Bouton "Cancel" et "Unfollow"
- [ ] Si je confirme:
  - Server action `unfollowTrader.action.ts`
  - Update du record `Follow`: `status = CANCELLED`
  - Le bouton redevient "Follow"
  - Toast "You unfollowed [Trader Name]"
- [ ] Je ne vois plus les signaux de ce trader dans mon feed

**Dépendances**:

- US-FOL-001 terminée

**Tests**:

- Suivre un trader, puis unfollow → vérifier status CANCELLED
- Vérifier disparition signaux du feed après unfollow

**Effort**: 3 points (S)
**Priorité**: 🟡 HAUTE

---

### US-FOL-003: Voir mes follows (user)

**En tant que** user
**Je veux** voir la liste des traders que je suis
**Afin de** gérer mes follows

**Critères d'acceptation**:

- [ ] Dans `/account/following` (ou section dans settings)
- [ ] Je vois la liste de tous mes follows ACTIFS
- [ ] Pour chaque follow:
  - Avatar trader, name, verified badge
  - Status: ACTIVE, EXPIRED (si `expiresAt < now`)
  - Expires at (date) si applicable
  - Bouton "Unfollow"
  - Bouton "View Profile" → `/traders/[id]`
- [ ] Je vois le compteur: "Following X/Y traders" (X = actifs, Y = limite plan)
- [ ] Si plan FREE (limite 1), je vois CTA "Upgrade to follow more traders"

**Dépendances**:

- US-FOL-001 terminée

**Tests**:

- Suivre 3 traders
- Vérifier affichage liste
- Vérifier compteur correct
- Tester unfollow depuis cette page

**Effort**: 3 points (S)
**Priorité**: 🟢 MOYENNE

---

### US-FOL-004: Voir mes followers (trader)

**En tant que** trader
**Je veux** voir la liste de mes followers
**Afin de** savoir qui suit mes signaux

**Critères d'acceptation**:

- [ ] Dans `/dashboard/trader`, Quick Actions "View Followers"
- [ ] Accède à `/dashboard/trader/followers`
- [ ] Je vois la liste de tous mes followers ACTIFS
- [ ] Pour chaque follower:
  - Avatar user, name
  - Followed since (date)
  - Status: ACTIVE, EXPIRED
- [ ] Je vois le compteur total: "X followers"
- [ ] Les followers sont triés par date (plus récent en premier)

**Dépendances**:

- US-FOL-001 terminée

**Tests**:

- Avoir 5 followers
- Vérifier affichage liste
- Vérifier compteur
- Vérifier tri par date

**Effort**: 3 points (S)
**Priorité**: 🟢 MOYENNE

---

## Epic 5: Trading Tools (HAUTE PRIORITÉ)

**Priorité**: 🟡 HAUTE
**Status**: ❌ À faire
**Effort Total**: 26 points (13 jours)

### US-TLS-001: Créer journal de trading

**En tant que** user avec plan Pro/Ultra
**Je veux** enregistrer mes trades dans un journal
**Afin de** tracker ma performance et apprendre de mes erreurs

**Critères d'acceptation**:

- [ ] Nouveau modèle DB `Trade`:
  - `id, userId, symbol, side (LONG/SHORT), instrumentType (SPOT/PERP)`
  - `entryPrice, exitPrice, quantity`
  - `entryDate, exitDate`
  - `pnl (calculated), pnlPercent (calculated)`
  - `notes (text), tags (string[])`
  - `relatedSignalId (optional, FK vers Signal)`
  - `createdAt, updatedAt`
- [ ] Dans `/dashboard`, tab "Trading Journal"
- [ ] Bouton "Add Trade" → ouvre dialog
- [ ] Formulaire dans dialog:
  - Symbol (select)
  - Side (LONG/SHORT radio)
  - Entry Price, Exit Price, Quantity
  - Entry Date, Exit Date (date pickers)
  - Notes (textarea)
  - Tags (multi-select: scalp, swing, breakout, etc.)
- [ ] Lorsque je submit:
  - Calcul auto PnL = (exitPrice - entryPrice) × quantity (si LONG)
  - Calcul auto PnL % = ((exitPrice - entryPrice) / entryPrice) × 100
  - Création record `Trade`
  - Toast "Trade ajouté au journal ✅"
- [ ] Le trade apparaît dans la liste

**Dépendances**:

- Vérification plan Pro/Ultra
- Nouveau modèle Prisma

**Tests**:

- Ajouter trade LONG profitable → vérifier PnL positif
- Ajouter trade SHORT perdant → vérifier PnL négatif
- Vérifier calculs PnL et PnL%
- Plan FREE: tenter accéder → redirect avec message "Upgrade to Pro"

**Effort**: 8 points (M)
**Priorité**: 🟡 HAUTE

---

### US-TLS-002: Voir historique trades

**En tant que** user
**Je veux** voir la liste de mes trades
**Afin de** revoir mon historique

**Critères d'acceptation**:

- [ ] Dans `/dashboard`, tab "Trading Journal"
- [ ] Je vois la liste de tous mes trades
- [ ] Pour chaque trade:
  - Symbol, Side (badge LONG green / SHORT red)
  - Entry Price, Exit Price
  - PnL (coloré: green si positif, red si négatif)
  - PnL %
  - Entry/Exit dates
  - Tags (badges)
  - Bouton "Edit", "Delete"
- [ ] Je peux filtrer par:
  - Symbol
  - Side (LONG/SHORT)
  - Outcome (Winning/Losing)
  - Tags
  - Date range
- [ ] Je peux trier par: Date, PnL, PnL%, Symbol
- [ ] Pagination: 50 trades par page

**Dépendances**:

- US-TLS-001 terminée

**Tests**:

- Créer 10 trades (5 winning, 5 losing)
- Vérifier affichage liste
- Filtrer par LONG → voir seulement LONG
- Filtrer par Winning → voir seulement PnL > 0
- Trier par PnL desc → vérifier ordre

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

### US-TLS-003: Calculer statistiques trading

**En tant que** user
**Je veux** voir mes statistiques de trading
**Afin d'** évaluer ma performance globale

**Critères d'acceptation**:

- [ ] Au-dessus de la liste trades, je vois des stats cards:
  - **Win Rate**: % de trades gagnants
  - **Payoff Ratio**: Average Win / Average Loss
  - **Total PnL**: Somme de tous les PnL
  - **Expectancy**: (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
  - **Max Drawdown**: Plus grande perte consécutive en %
  - **Total Trades**: Nombre total de trades
  - **Avg Win**: PnL moyen des trades gagnants
  - **Avg Loss**: PnL moyen des trades perdants
- [ ] Les stats se mettent à jour automatiquement quand j'ajoute/modifie/supprime un trade
- [ ] Formules:
  - Win Rate = (Winning Trades / Total Trades) × 100
  - Payoff = Avg Win / |Avg Loss|
  - Expectancy = (Win Rate × Avg Win) - ((1 - Win Rate) × |Avg Loss|)

**Dépendances**:

- US-TLS-001, US-TLS-002 terminées

**Tests**:

- 10 trades: 6 wins (avg +100), 4 losses (avg -50)
- Vérifier Win Rate = 60%
- Vérifier Payoff = 100/50 = 2.0
- Vérifier Expectancy = (0.6 × 100) - (0.4 × 50) = 60 - 20 = 40

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

### US-TLS-004: Afficher equity curve

**En tant que** user
**Je veux** voir mon equity curve (courbe de capital)
**Afin de** visualiser l'évolution de mon capital dans le temps

**Critères d'acceptation**:

- [ ] Sous les stats cards, je vois un graphique ligne (recharts)
- [ ] X axis: Dates des trades
- [ ] Y axis: Capital cumulé (commence à capital initial, défaut 10,000)
- [ ] Chaque point = capital après chaque trade
- [ ] Capital[n] = Capital[n-1] + PnL[n]
- [ ] Couleur ligne:
  - Green si en profit global
  - Red si en perte globale
- [ ] Tooltip au hover: Date, Trade symbol, PnL, Capital at this point
- [ ] Bouton "Settings" pour changer capital initial

**Dépendances**:

- US-TLS-001, US-TLS-002 terminées
- `recharts` library

**Tests**:

- 10 trades avec PnL variés
- Vérifier calcul capital cumulé correct
- Hover sur point → vérifier tooltip
- Changer capital initial 5000 → vérifier recalcul

**Effort**: 8 points (M)
**Priorité**: 🟡 HAUTE

---

### US-TLS-005: Risk Console - Calculateur position sizing

**En tant que** user Pro/Ultra
**Je veux** calculer la taille de ma position
**Afin de** respecter mon risk management

**Critères d'acceptation**:

- [ ] Page `/dashboard/risk` accessible
- [ ] Section "Position Size Calculator"
- [ ] Inputs:
  - **Account Capital** (number, ex: 10,000)
  - **Risk per Trade (%)** (slider 0.5% - 5%, default 1%)
  - **Entry Price** (number)
  - **Stop Loss Price** (number)
  - **Leverage** (number, default 1x)
- [ ] Outputs (calculés automatiquement):
  - **Risk Amount ($)**: Capital × Risk%
  - **Distance to Stop (%)**: |entryPrice - stopLoss| / entryPrice × 100
  - **Position Size (units)**: RiskAmount / (Distance × Entry Price / Leverage)
  - **Position Value ($)**: Position Size × Entry Price
  - **Max Loss if Stopped**: Risk Amount (affiché en rouge)
- [ ] Formule:
  - `riskAmount = capital × (risk% / 100)`
  - `distancePercent = Math.abs(entry - stop) / entry × 100`
  - `positionSize = riskAmount / (distancePercent / 100 × entry / leverage)`

**Dépendances**:

- Vérification plan Pro/Ultra

**Tests**:

- Capital 10k, Risk 1%, Entry 100, Stop 95, Leverage 1x
  - Risk Amount = 100
  - Distance = 5%
  - Position Size = 100 / (0.05 × 100) = 20 units
  - Position Value = 2000
- Vérifier calculs corrects
- Changer inputs → vérifier recalcul instantané

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

### US-TLS-006: Risk Console - Calculateur R:R

**En tant que** user Pro/Ultra
**Je veux** calculer le ratio Risk/Reward
**Afin de** évaluer si un trade vaut le coup

**Critères d'acceptation**:

- [ ] Dans `/dashboard/risk`, section "R:R Calculator"
- [ ] Inputs:
  - **Entry Price** (number)
  - **Stop Loss** (number)
  - **Take Profit(s)** (array de numbers, min 1, max 5)
- [ ] Outputs:
  - **Risk ($)**: |Entry - Stop|
  - Pour chaque TP:
    - **Reward ($)**: |TP - Entry|
    - **R:R Ratio**: Reward / Risk
    - **Win Rate Needed (%)**: 1 / (1 + R:R) × 100 (pour break-even)
  - **Average R:R** si multiple TPs
- [ ] Affichage visuel: barres risk (red) vs reward (green)
- [ ] Formule:
  - `risk = Math.abs(entry - stop)`
  - `reward = Math.abs(tp - entry)`
  - `rr = reward / risk`
  - `winRateNeeded = 1 / (1 + rr) × 100`

**Dépendances**:

- Vérification plan Pro/Ultra

**Tests**:

- Entry 100, Stop 95, TP1 110
  - Risk = 5, Reward = 10, R:R = 2.0
  - Win Rate Needed = 1/(1+2) × 100 = 33.33%
- Entry 100, Stop 98, TP1 106, TP2 112
  - Risk = 2
  - TP1: Reward = 6, R:R = 3.0, WR Needed = 25%
  - TP2: Reward = 12, R:R = 6.0, WR Needed = 14.29%

**Effort**: 5 points (S)
**Priorité**: 🟢 MOYENNE

---

## Epic 6: Marketplace & Discovery (HAUTE PRIORITÉ)

**Priorité**: 🟡 HAUTE
**Status**: 🚧 En cours (UI existe, logique manquante)
**Effort Total**: 13 points (6-7 jours)

### US-MKT-001: Rechercher traders

**En tant que** user
**Je veux** rechercher des traders par nom
**Afin de** trouver un trader spécifique

**Critères d'acceptation**:

- [ ] Sur `/traders`, search bar en haut
- [ ] Lorsque je tape dans le search (debounced 300ms):
  - Query Prisma `TraderProfile` avec `displayName` LIKE `%query%`
  - Update de la liste traders affichée
- [ ] Si aucun résultat: "No traders found for 'query'"
- [ ] Le search persiste dans l'URL: `/traders?search=john`
- [ ] Si je refresh la page, le search est toujours actif

**Dépendances**:

- UI existe déjà
- Server action `searchTraders.action.ts`
- `nuqs` pour URL state

**Tests**:

- Chercher "crypto" → voit traders avec "crypto" dans le nom
- Chercher "zzz" → voit "No traders found"
- Vérifier debounce (pas de query avant 300ms)
- Vérifier URL state

**Effort**: 3 points (S)
**Priorité**: 🟡 HAUTE

---

### US-MKT-002: Filtrer traders

**En tant que** user
**Je veux** filtrer les traders par critères
**Afin de** trouver des traders qui correspondent à mes besoins

**Critères d'acceptation**:

- [ ] Sur `/traders`, selects pour filtrer:
  - **Status**: All, Verified Only
  - **Min Win Rate**: 0%, 50%, 60%, 70%, 80%
  - **Max Price**: Any, Free, <$50, <$100
  - **Min Followers**: Any, 10+, 50+, 100+
- [ ] Lorsque je change un filtre:
  - Query Prisma avec conditions WHERE
  - Update liste traders
- [ ] Les filtres se combinent (AND)
- [ ] Filtres persistent dans URL: `/traders?verified=true&winrate=60&price=50`
- [ ] Compteur résultats: "Showing X traders"

**Dépendances**:

- US-MKT-001 terminée
- `statsJson` doit contenir winrate

**Tests**:

- Filter "Verified Only" → voir seulement verified=true
- Filter "Min WR 70%" → voir seulement winrate >= 70
- Combiner verified + WR 70% → vérifier AND
- Vérifier URL state

**Effort**: 5 points (S)
**Priorité**: 🟡 HAUTE

---

### US-MKT-003: Trier traders

**En tant que** user
**Je veux** trier les traders par métrique
**Afin de** voir les meilleurs traders en premier

**Critères d'acceptation**:

- [ ] Sur `/traders`, select "Sort by":
  - **Win Rate** (high to low)
  - **Followers** (most to least)
  - **Profit Factor** (high to low)
  - **Recently Joined** (newest first)
  - **Price** (low to high, high to low)
- [ ] Lorsque je change le sort:
  - Query Prisma avec ORDER BY
  - Update liste traders
- [ ] Sort persiste dans URL: `/traders?sort=winrate`
- [ ] Default sort: Win Rate (high to low)

**Dépendances**:

- US-MKT-001, US-MKT-002 terminées

**Tests**:

- Sort by Followers → vérifier ordre desc
- Sort by Price → vérifier ordre asc
- Combiner filter + sort → vérifier les deux appliqués

**Effort**: 3 points (S)
**Priorité**: 🟡 HAUTE

---

### US-MKT-004: Pagination traders

**En tant que** user
**Je veux** naviguer par pages dans la liste traders
**Afin de** ne pas charger tous les traders d'un coup

**Critères d'acceptation**:

- [ ] Affichage: 20 traders par page
- [ ] En bas de liste, pagination:
  - Bouton "Previous" (disabled si page 1)
  - Numéros pages: 1, 2, 3, ..., N
  - Bouton "Next" (disabled si dernière page)
- [ ] Lorsque je clique page 2:
  - Query Prisma avec `skip = 20, take = 20`
  - Update liste
  - URL: `/traders?page=2`
  - Scroll to top
- [ ] Compteur: "Showing 21-40 of 150 traders"

**Dépendances**:

- US-MKT-001 terminée
- Cursor pagination (plus performant) ou offset (plus simple)

**Tests**:

- Naviguer page 1 → 2 → 3
- Vérifier skip/take corrects
- Vérifier compteur
- Vérifier URL state

**Effort**: 3 points (S)
**Priorité**: 🟡 HAUTE

---

### US-MKT-005: Stats overview marketplace

**En tant que** user
**Je veux** voir les stats générales du marketplace
**Afin de** comprendre l'écosystème

**Critères d'acceptation**:

- [ ] Sur `/traders`, en haut, 3 cards stats:
  - **Active Traders**: Count total `TraderProfile`
  - **Verified Traders**: Count `verified = true`
  - **Avg Win Rate**: Average de `statsJson.winrate` de tous les traders
- [ ] Les stats se mettent à jour dynamiquement
- [ ] Utilisent des queries Prisma agrégées (performant)

**Dépendances**:

- TraderProfile records existent

**Tests**:

- 10 traders, 5 verified → vérifier counts
- Winrates: 60, 70, 80 → avg = 70%
- Vérifier calculs corrects

**Effort**: 2 points (XS)
**Priorité**: 🟢 MOYENNE

---

## Epic 7: Notifications & Engagement (MOYENNE PRIORITÉ)

**Priorité**: 🟢 MOYENNE
**Status**: ❌ À faire
**Effort Total**: 13 points (6-7 jours)

### US-NOT-001: Notification nouveau signal (in-app)

**En tant que** user
**Je veux** être notifié quand un trader que je suis publie un signal
**Afin de** ne pas rater les opportunités

**Critères d'acceptation**:

- [ ] Nouveau modèle DB `Notification`:
  - `id, userId, type (enum), title, message, link, read (boolean)`
  - Types: NEW_SIGNAL, NEW_FOLLOWER, PAYMENT_CONFIRMED, VERIFICATION_APPROVED
  - `createdAt`
- [ ] Lorsqu'un trader publie un signal:
  - Pour chaque follower ACTIF de ce trader
  - Créer `Notification` type NEW_SIGNAL
  - Title: "New signal from [Trader Name]"
  - Message: "[LONG/SHORT] [SYMBOL] at [entry]"
  - Link: `/dashboard?highlight=[signalId]`
- [ ] Dans le header, bell icon 🔔
- [ ] Badge rouge avec count si notifications unread
- [ ] Cliquer bell → dropdown avec liste notifications (10 dernières)
- [ ] Cliquer notification → redirect vers link + mark as read
- [ ] Bouton "Mark all as read"

**Dépendances**:

- US-SIG-001, US-FOL-001 terminées
- Nouveau modèle Prisma

**Tests**:

- Trader publie signal → vérifier notif créée pour followers
- Vérifier badge count
- Mark as read → vérifier disparition badge
- Cliquer notif → vérifier redirect

**Effort**: 8 points (M)
**Priorité**: 🟢 MOYENNE

---

### US-NOT-002: Email notification nouveau signal

**En tant que** user
**Je veux** recevoir un email quand un signal est publié
**Afin de** être alerté même si pas sur l'app

**Critères d'acceptation**:

- [ ] Dans `/account/settings`, section "Notifications"
- [ ] Checkbox "Email me when traders I follow publish signals"
- [ ] Sauvegardé dans `UserPreferences` (nouveau modèle ou JSON dans User)
- [ ] Lorsqu'un trader publie un signal ET user a activé email notifs:
  - Envoyer email via Resend
  - Template React Email: `NewSignalEmail.tsx`
  - Contenu: Trader name, Symbol, Bias, Entry, TPs, CTA "View Signal"
- [ ] CTA → `/auth/signin` si non logged, sinon `/dashboard`

**Dépendances**:

- US-NOT-001 terminée
- Email system (déjà existant)

**Tests**:

- Activer email notifs → publier signal → vérifier email reçu
- Désactiver → publier signal → vérifier pas d'email
- Vérifier template email correct

**Effort**: 5 points (S)
**Priorité**: 🟢 MOYENNE

---

### US-NOT-003: Notification nouveau follower (trader)

**En tant que** trader
**Je veux** être notifié quand quelqu'un me suit
**Afin de** savoir que mon audience grandit

**Critères d'acceptation**:

- [ ] Lorsqu'un user suit un trader (US-FOL-001):
  - Créer `Notification` pour le trader
  - Type: NEW_FOLLOWER
  - Title: "New follower!"
  - Message: "[User Name] is now following you"
  - Link: `/dashboard/trader/followers`
- [ ] Notification apparaît dans bell dropdown
- [ ] (Optionnel) Email au trader si préférence activée

**Dépendances**:

- US-NOT-001 terminée
- US-FOL-001 terminée

**Tests**:

- User suit trader → vérifier notif créée pour trader
- Vérifier affichage dans bell dropdown

**Effort**: 2 points (XS)
**Priorité**: 🟢 MOYENNE

---

### US-NOT-004: Notification payment confirmé

**En tant que** user
**Je veux** être notifié quand mon paiement crypto est confirmé
**Afin de** savoir que mon abonnement est actif

**Critères d'acceptation**:

- [ ] Lorsque `CryptoPayment` status passe à CONFIRMED (US-PAY-002):
  - Créer `Notification` pour user
  - Type: PAYMENT_CONFIRMED
  - Title: "Payment confirmed!"
  - Message: "Your [plan] subscription is now active"
  - Link: `/dashboard`
- [ ] Envoyer email confirmation avec détails paiement

**Dépendances**:

- US-NOT-001, US-PAY-002 terminées

**Tests**:

- Paiement confirmé → vérifier notif + email
- Vérifier message contient bon plan

**Effort**: 2 points (XS)
**Priorité**: 🟢 MOYENNE

---

## Epic 8: Trader Revenue (MOYENNE PRIORITÉ)

**Priorité**: 🟢 MOYENNE
**Status**: ❌ À faire
**Effort Total**: 13 points (6-7 jours)

### US-REV-001: Calculer revenus trader

**En tant que** trader
**Je veux** voir mes revenus mensuels
**Afin de** connaître mes gains

**Critères d'acceptation**:

- [ ] Les revenus sont calculés depuis les `Follow` records:
  - Pour chaque follower ACTIF (status = ACTIVE, expiresAt > now)
  - Revenue mensuel = `TraderProfile.priceMonthlyUSD` × nombre followers actifs
- [ ] Dans `/dashboard/trader`, tab "Revenue"
- [ ] Cards stats:
  - **This Month**: Revenue mensuel actuel
  - **Active Subscribers**: Nombre followers actifs
  - **Avg Revenue per Subscriber**: priceMonthlyUSD
  - **All Time**: Somme de tous les revenus (historique)
- [ ] Les revenus sont calculés en temps réel (pas besoin de cron job pour MVP)

**Dépendances**:

- US-FOL-001 terminée
- TraderProfile.priceMonthlyUSD configuré

**Tests**:

- Trader prix $50, 10 followers actifs → vérifier $500/mois
- 5 followers expirent → vérifier $250/mois
- Vérifier calculs corrects

**Effort**: 5 points (S)
**Priorité**: 🟢 MOYENNE

---

### US-REV-002: Historique revenus

**En tant que** trader
**Je veux** voir l'évolution de mes revenus
**Afin de** tracker ma croissance

**Critères d'acceptation**:

- [ ] Dans `/dashboard/trader`, tab "Revenue"
- [ ] Graphique ligne (recharts) "Monthly Revenue"
- [ ] X axis: Mois (dernier 12 mois)
- [ ] Y axis: Revenue ($)
- [ ] Chaque point = revenue de ce mois
- [ ] Calcul:
  - Pour chaque mois, compter followers ACTIFS durant ce mois
  - Revenue[mois] = price × followers[mois]
- [ ] Tooltip: Mois, Revenue, Followers count

**Dépendances**:

- US-REV-001 terminée

**Tests**:

- Simuler followers sur 6 mois
- Vérifier calculs par mois corrects
- Vérifier affichage graphique

**Effort**: 5 points (S)
**Priorité**: 🟢 MOYENNE

---

### US-REV-003: Revenue sharing avec plateforme

**En tant que** admin
**Je veux** prendre une commission sur les revenus traders
**Afin de** monétiser la plateforme

**Critères d'acceptation**:

- [ ] Configuration dans `site-config.ts`:
  - `platformCommission = 20%` (à ajuster)
- [ ] Dans le calcul revenue trader:
  - Gross Revenue = price × followers
  - Platform Fee = Gross Revenue × 20%
  - **Net Revenue (trader)** = Gross Revenue - Platform Fee
- [ ] Le trader voit dans son dashboard:
  - Gross Revenue
  - Platform Fee (20%)
  - **Net Revenue** (ce qu'il reçoit)
- [ ] Admin voit dashboard plateforme revenue total

**Dépendances**:

- US-REV-001 terminée

**Tests**:

- Revenue $1000 → Platform $200, Trader $800
- Vérifier calculs
- Admin dashboard vérifier totaux

**Effort**: 3 points (S)
**Priorité**: 🔵 BASSE (post-MVP)

---

## Epic 9: Verification & Quality (MOYENNE PRIORITÉ)

**Priorité**: 🟢 MOYENNE
**Status**: ❌ À faire
**Effort Total**: 8 points (4 jours)

### US-VER-001: Demander vérification trader

**En tant que** trader
**Je veux** demander à être vérifié
**Afin d'** avoir le badge "Verified" et plus de crédibilité

**Critères d'acceptation**:

- [ ] Dans `/dashboard/trader`, card "Trader Status"
- [ ] Je vois les critères de vérification:
  - ✅ Complete profile (displayName, bio, avatar)
  - ✅/❌ 10+ signals published
  - ✅/❌ 5+ active followers
  - ✅/❌ Account > 30 days old
- [ ] Si tous critères remplis, bouton "Request Verification" actif
- [ ] Lorsque je clique:
  - Server action `requestVerification.action.ts`
  - Création `VerificationRequest` (nouveau modèle):
    - `id, traderId, status (PENDING/APPROVED/REJECTED), requestedAt, reviewedAt, reviewedBy (adminId)`
  - Status trader reste `verified = false` (en attente admin)
  - Toast "Verification request submitted. You'll be notified when reviewed."

**Dépendances**:

- US-TRD-001, US-SIG-001, US-FOL-001 terminées
- Nouveau modèle Prisma `VerificationRequest`

**Tests**:

- Remplir tous critères → bouton actif
- Manquer 1 critère → bouton disabled
- Soumettre request → vérifier création DB
- Vérifier badge pas encore affiché

**Effort**: 5 points (S)
**Priorité**: 🟢 MOYENNE

---

### US-VER-002: Admin approuver vérification

**En tant qu'** admin
**Je veux** approuver ou rejeter les demandes de vérification
**Afin de** maintenir la qualité des traders vérifiés

**Critères d'acceptation**:

- [ ] Page `/admin/verification-requests`
- [ ] Liste de toutes les `VerificationRequest` avec status PENDING
- [ ] Pour chaque request:
  - Trader name, avatar
  - Profile completeness, signals count, followers count, account age
  - Tous les critères verts/rouges
  - Bouton "Approve", "Reject"
- [ ] Lorsque j'approuve:
  - Update `VerificationRequest`: status = APPROVED, reviewedAt = now, reviewedBy = adminId
  - Update `TraderProfile`: verified = true, verifiedAt = now
  - Créer `Notification` pour trader: "Congratulations! You are now verified ✅"
  - (Optionnel) Email au trader
- [ ] Lorsque je rejette:
  - Update `VerificationRequest`: status = REJECTED
  - Notification: "Your verification request was rejected. [Reason]"

**Dépendances**:

- US-VER-001 terminée
- Admin layout existant

**Tests**:

- Créer verification request
- Admin approve → vérifier verified = true, badge affiché
- Admin reject → vérifier verified = false
- Vérifier notifications envoyées

**Effort**: 5 points (S)
**Priorité**: 🟢 MOYENNE

---

### US-VER-003: Badge verified affiché

**En tant que** user
**Je veux** voir le badge "Verified" sur les traders vérifiés
**Afin de** faire confiance à leur légitimité

**Critères d'acceptation**:

- [ ] Sur le profil trader (`/traders/[id]`):
  - Si `verified = true` → badge "Verified" ✅ à côté du nom
- [ ] Dans la marketplace (`/traders`):
  - Badge visible sur chaque trader card si verified
- [ ] Dans le feed de signaux:
  - Badge à côté du nom du trader dans la TradingCard
- [ ] Badge design: checkmark icon, couleur primary (amber), tooltip "Verified by MyCryptoPilot"

**Dépendances**:

- US-VER-002 terminée

**Tests**:

- Trader vérifié → voir badge partout
- Trader non vérifié → pas de badge
- Hover badge → voir tooltip

**Effort**: 2 points (XS)
**Priorité**: 🟢 MOYENNE

---

## Epic 10: Platform Improvements (BASSE PRIORITÉ)

**Priorité**: 🔵 BASSE (post-MVP)
**Status**: ❌ À faire
**Effort Total**: 21+ points (10+ jours)

### US-PLT-001: Screeners temps réel

**En tant que** user Pro/Ultra
**Je veux** voir des screeners crypto en temps réel
**Afin de** détecter les opportunités de marché

**Critères d'acceptation**:

- [ ] Page `/dashboard/screeners`
- [ ] Intégration API market data (CoinGecko ou Binance)
- [ ] Tableaux:
  - **Top Gainers 24h** (top 20 cryptos par % change)
  - **Top Losers 24h**
  - **Volume Leaders** (top 20 par volume)
  - **Trending** (selon CoinGecko trending endpoint)
- [ ] Pour chaque crypto: Symbol, Price, Change 24h (%), Volume, Market Cap
- [ ] Filtres: Market Cap range, Volume min
- [ ] Sort: Price, Change%, Volume, Market Cap
- [ ] Refresh intervals:
  - FREE: 5min (disabled pour screeners)
  - PRO: 1min
  - ULTRA: 5sec
- [ ] Countdown timer "Next refresh in..."

**Dépendances**:

- Intégration CoinGecko API (free tier: 10-30 calls/min)
- Ou Binance API (gratuit, rate limits)
- Cache Redis (optionnel, pour optimiser)

**Tests**:

- Vérifier fetch data API
- Vérifier refresh selon plan
- Filtrer Market Cap > 1B → voir résultats corrects
- Sort by Volume → vérifier ordre

**Effort**: 13 points (M-L)
**Priorité**: 🔵 BASSE

---

### US-PLT-002: Alertes personnalisées (plan Ultra)

**En tant que** user Ultra
**Je veux** créer des alertes custom
**Afin d'** être notifié quand certaines conditions sont remplies

**Critères d'acceptation**:

- [ ] Page `/dashboard/alerts`
- [ ] Bouton "Create Alert"
- [ ] Formulaire:
  - **Alert Name** (ex: "BTC above 50k")
  - **Condition Type**: Price, Volume, Change%
  - **Symbol** (select crypto)
  - **Operator**: >, <, =, >=, <=
  - **Value** (number)
  - **Notification**: Email, In-app, Both
- [ ] Modèle DB `Alert`:
  - `id, userId, name, conditionType, symbol, operator, value, notificationType, active (boolean), triggeredAt`
- [ ] Background job (cron toutes les 1min) check alerts:
  - Fetch current price via API
  - Si condition remplie → trigger alert
  - Envoyer notification
  - Update `triggeredAt`
  - Désactiver alert (ou garder active selon config)
- [ ] Liste des alerts avec status: Active, Triggered

**Dépendances**:

- Market data API
- Notification system (US-NOT-001)
- Cron job setup

**Tests**:

- Créer alert "BTC > 50000"
- Simuler BTC = 51000 → vérifier trigger
- Vérifier notification envoyée
- Vérifier désactivation alert

**Effort**: 13 points (M-L)
**Priorité**: 🔵 BASSE

---

### US-PLT-003: Adapter landing page MyCryptoPilot

**En tant que** visiteur
**Je veux** comprendre MyCryptoPilot depuis la landing
**Afin de** décider si je veux m'inscrire

**Critères d'acceptation**:

- [ ] Page `/` (landing)
- [ ] Hero:
  - Titre: "Trade Smarter with Verified Crypto Traders"
  - Sous-titre: "Follow professional traders, receive signals, manage your risk"
  - CTA: "Start for Free" → `/auth/signup`
  - Image/Video: Screenshot de l'app avec TradingCard
- [ ] Section "How It Works":
  1. Browse verified traders
  2. Follow and get signals
  3. Trade with confidence
- [ ] Features Section:
  - Real-time signals
  - Risk console
  - Trading journal
  - Pro screeners
- [ ] Pricing Section (déjà créée, adapter texte)
- [ ] Testimonials: 3-5 reviews de traders/users réels
- [ ] FAQ adaptée crypto trading
- [ ] Footer: Links, Legal, Social

**Dépendances**:

- App fonctionnelle pour screenshots
- Testimonials réels (ou placeholders réalistes)

**Tests**:

- Vérifier tous les liens fonctionnels
- Vérifier responsive mobile
- Vérifier CTA redirect vers signup

**Effort**: 8 points (M)
**Priorité**: 🔵 BASSE

---

### US-PLT-004: Export journal trades (CSV)

**En tant que** user
**Je veux** exporter mon journal de trading en CSV
**Afin de** l'analyser dans Excel ou autre outil

**Critères d'acceptation**:

- [ ] Dans `/dashboard`, tab "Trading Journal"
- [ ] Bouton "Export CSV"
- [ ] Lorsque je clique:
  - Génération fichier CSV avec colonnes:
    - Symbol, Side, Entry Price, Exit Price, Quantity, Entry Date, Exit Date, PnL, PnL%, Notes, Tags
  - Download automatique: `mycryptopilot-trades-[date].csv`
- [ ] Format CSV standard (séparateur `,`, échappement `"`)

**Dépendances**:

- US-TLS-001 terminée

**Tests**:

- Exporter 10 trades
- Ouvrir CSV dans Excel → vérifier formatage
- Vérifier toutes les colonnes présentes
- Vérifier encoding UTF-8

**Effort**: 2 points (XS)
**Priorité**: 🔵 BASSE

---

### US-PLT-005: Dark mode

**En tant que** user
**Je veux** activer le dark mode
**Afin de** protéger mes yeux le soir

**Critères d'acceptation**:

- [ ] Toggle dark mode dans header ou settings
- [ ] Utilise `next-themes` (déjà installé)
- [ ] Modes: Light, Dark, System
- [ ] Préférence sauvegardée dans localStorage
- [ ] Toutes les pages supportent dark mode
- [ ] Couleurs adaptées (TailwindCSS dark: variants)

**Dépendances**:

- `next-themes` déjà configuré dans NOW.TS

**Tests**:

- Toggle dark → vérifier toutes pages dark
- Toggle light → vérifier toutes pages light
- System → vérifier suit préférence OS
- Refresh → vérifier préférence persiste

**Effort**: 2 points (XS)
**Priorité**: 🔵 BASSE

---

## Récapitulatif Par Priorité

### 🔴 CRITIQUE (MVP Bloquant) - 68 points (34 jours)

| Epic                      | User Stories                       | Effort    |
| ------------------------- | ---------------------------------- | --------- |
| Epic 1: Crypto Payments   | US-PAY-001 à US-PAY-004            | 21 points |
| Epic 2: Trader Management | US-TRD-001                         | 5 points  |
| Epic 3: Signal System     | US-SIG-001, US-SIG-003, US-SIG-004 | 26 points |
| Epic 4: Follow System     | US-FOL-001                         | 5 points  |

**Total**: 57 points (≈ 28-29 jours, 1 dev)

---

### 🟡 HAUTE (MVP Fonctionnel) - 52 points (26 jours)

| Epic                      | User Stories            | Effort    |
| ------------------------- | ----------------------- | --------- |
| Epic 1: Crypto Payments   | US-PAY-005              | 5 points  |
| Epic 2: Trader Management | US-TRD-002, US-TRD-003  | 8 points  |
| Epic 3: Signal System     | US-SIG-002              | 5 points  |
| Epic 4: Follow System     | US-FOL-002              | 3 points  |
| Epic 5: Trading Tools     | US-TLS-001 à US-TLS-005 | 31 points |
| Epic 6: Marketplace       | US-MKT-001 à US-MKT-004 | 14 points |

**Total**: 66 points (≈ 33 jours, 1 dev)

---

### 🟢 MOYENNE (Important mais pas MVP) - 42 points (21 jours)

| Epic                  | User Stories            | Effort    |
| --------------------- | ----------------------- | --------- |
| Epic 4: Follow System | US-FOL-003, US-FOL-004  | 6 points  |
| Epic 5: Trading Tools | US-TLS-006              | 5 points  |
| Epic 6: Marketplace   | US-MKT-005              | 2 points  |
| Epic 7: Notifications | US-NOT-001 à US-NOT-004 | 17 points |
| Epic 8: Revenue       | US-REV-001, US-REV-002  | 10 points |
| Epic 9: Verification  | US-VER-001 à US-VER-003 | 12 points |

**Total**: 52 points (≈ 26 jours, 1 dev)

---

### 🔵 BASSE (Post-MVP) - 38+ points (19+ jours)

| Epic              | User Stories            | Effort    |
| ----------------- | ----------------------- | --------- |
| Epic 8: Revenue   | US-REV-003              | 3 points  |
| Epic 10: Platform | US-PLT-001 à US-PLT-005 | 38 points |

**Total**: 41 points (≈ 20 jours, 1 dev)

---

## Timeline Recommandé

### Phase 1: MVP Core (6-7 semaines)

1. **Semaines 1-2**: Epic 1 Crypto Payments (21 points)
2. **Semaine 3**: Epic 2 Trader Mgmt (US-TRD-001, 002, 003 = 13 points)
3. **Semaines 4-5**: Epic 3 Signal System (26 points)
4. **Semaine 6**: Epic 4 Follow System (8 points)
5. **Semaine 7**: Epic 6 Marketplace (14 points)

**Livrable**: Produit utilisable end-to-end ✅

### Phase 2: MVP Complet (4-5 semaines)

6. **Semaines 8-10**: Epic 5 Trading Tools (31 points)
7. **Semaine 11**: Polish, tests, bug fixes

**Livrable**: Produit MVP avec features premium ✅

### Phase 3: Growth Features (4-5 semaines)

8. **Semaines 12-13**: Epic 7 Notifications (17 points)
9. **Semaines 14-15**: Epic 9 Verification + Epic 8 Revenue (22 points)

**Livrable**: Produit production-ready ✅

### Phase 4: Scale & Polish (4+ semaines)

10. **Semaines 16+**: Epic 10 Platform Improvements (41+ points)

---

## 📊 Résumé Effort & Timeline (Mis à jour 10 oct 2025)

### ✅ Effort Réalisé (Audit)

**Epic 1 - Crypto Payments**: 14/21 points (67% - structure OK, impl manquante)
**Epic 2 - Trader Management**: 13/13 points (100% ✅)
**Epic 3 - Signal System**: 26/26 points (100% ✅)
**Epic 4 - Follow System**: 7.5/8 points (95% ✅)
**Epic Discord Bot** (hors backlog): 13 points (100% déployé Railway ✅)

**Total réalisé**: 73.5 points / 217+ points = **34% du backlog total**
**Core MVP réalisé**: 59.5 points / 57 points = **104% du MVP minimal** 🎉

### 🎯 Nouvelle Estimation MVP (Post-Résolution)

**✅ P0 - RÉSOLU** (10 oct 2025 - 16h15):

- Migrations Prisma (#13): **✅ APPLIQUÉES** 🎉

**✅ Testable IMMÉDIATEMENT** (migrations résolues):

- Profils traders ✅
- Création signaux ✅
- Follow traders ✅
- Webhook Discord ✅
- **Total: 0 jour** (code done + DB opérationnelle!)

**🟡 P1 - Finir MVP**:

- Dashboards data (#17): 2-3j
- Crypto payments impl (#4, #5): 3.5j
- UI checkout + subs (#6): 2j
- Tests + polish: 2-3j
- **Total: 8-10 jours**

**MVP Fonctionnel**: **~2 semaines** (vs 7 semaines avant)

---

### 🎉 Grande Découverte

Le parcours **trader → signal → Discord** est **100% CODE DONE** grâce au travail déjà effectué! Il ne manque que:

1. Appliquer migrations (30 min)
2. Connecter dashboards (2-3j)
3. Implémenter crypto payments (3.5j)

**Le MVP est beaucoup plus proche que prévu!**

---

**Total Effort Estimation Original**: 217+ story points (≈ 108+ jours = 4-5 mois, 1 dev full-time)

**MVP Minimal Original**: 57 points (≈ 7 semaines)
**MVP Minimal Réel**: 59.5 points **DONE** + 0.5h migrations + 8-10j finitions = **2 semaines** 🚀

---

**Dernière mise à jour**: 10 octobre 2025 (via /project-audit)
**Version**: 1.1.0
