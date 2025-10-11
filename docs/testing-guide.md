# MyCryptoPilot - Guide de Test E2E Complet

**Dernière mise à jour** : 11 octobre 2025
**Version** : MVP 1.0
**Objectif** : Tester l'application dans son intégralité avant le déploiement production

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Parcours User](#parcours-user)
3. [Parcours Trader](#parcours-trader)
4. [Parcours Admin](#parcours-admin)
5. [Tests Crypto Payment](#tests-crypto-payment)
6. [Tests Discord Integration](#tests-discord-integration)
7. [Checklist de Validation](#checklist-de-validation)
8. [Bugs Connus](#bugs-connus)

---

## Prérequis

### Configuration Requise

- **Environnement** : Local (dev) ou Staging
- **Base de données** : PostgreSQL avec migrations appliquées
- **Variables d'env** : Toutes configurées (voir `.env.example`)
- **Discord Bot** : Déployé et actif sur Railway
- **Wallet crypto** : Pour tester paiements (testnet recommandé)

### Comptes de Test

Créer au minimum 3 comptes :
1. **User Basic** : Pour tester le parcours utilisateur standard
2. **Trader** : Pour tester la création de signaux
3. **Admin** : Pour tester le panel admin

---

## Parcours User

### 🎯 Parcours 1 : Inscription et Découverte (15-20 min)

#### Objectif
Tester le flow complet d'inscription et découverte de l'application.

#### Étapes Détaillées

##### 1.1 Landing Page → Inscription

1. **Ouvrir** `http://localhost:3000` (ou votre URL de staging)

2. **Vérifier l'affichage** :
   - ✅ Hero section avec titre "Crypto Trading Signals Risk-First"
   - ✅ Image de la marketplace
   - ✅ 2 boutons CTA visibles :
     - "Get started" (bleu)
     - "Learn more" (lien)

3. **Cliquer sur "Get started"**
   - ✅ **Attendu** : Redirection vers `/auth/signin`
   - ✅ Page de connexion affichée
   - ✅ Lien "Don't have an account? Sign up" visible

4. **Cliquer sur "Sign up"**
   - ✅ **Attendu** : Redirection vers `/auth/signup`
   - ✅ Formulaire d'inscription affiché avec 4 champs :
     - Name (optionnel)
     - Email
     - Password
     - Confirm Password

5. **Remplir le formulaire** :
   ```
   Name: Test User
   Email: testuser@example.com
   Password: TestPassword123!
   Confirm Password: TestPassword123!
   ```

6. **Cliquer sur "Sign Up"**
   - ✅ **Attendu** : Loading spinner pendant ~1-2s
   - ✅ **Puis** : Redirection vers `/auth/new-user`
   - ✅ Page "Welcome to MyCryptoPilot" affichée
   - ✅ Bouton "Continue" visible

7. **Cliquer sur "Continue"**
   - ✅ **Attendu** : Redirection vers `/orgs/new`
   - ✅ Formulaire création organisation affiché
   - ✅ Champ "Organization name" pré-rempli avec le nom de l'utilisateur

8. **Valider la création d'organisation**
   - ⚠️ **Note** : Dans MyCryptoPilot, 1 org = 1 user, c'est automatique
   - ✅ **Attendu** : Redirection vers `/orgs/[slug]/dashboard`

##### 1.2 Premier Aperçu du Dashboard User

9. **Vérifier l'affichage du dashboard** :
   - ✅ Header "Dashboard" visible
   - ✅ 3 cartes de stats :
     - **Active Signals** : 0
     - **Traders Followed** : 0
     - **Your Plan** : Free
   - ✅ Alert "No traders followed yet" affiché en orange
   - ✅ Lien "Browse Traders" dans l'alert

10. **Observer les tabs** :
    - ✅ 3 tabs visibles :
      - "Signals Feed" (actif par défaut)
      - "Trading Journal"
      - "Performance"

11. **Cliquer sur tab "Signals Feed"**
    - ✅ **Attendu** : Message "No signals yet" affiché
    - ✅ Texte : "Start following traders to receive their signals"

12. **Cliquer sur tab "Trading Journal"**
    - ✅ **Attendu** : Card "Trading Journal" affichée
    - ✅ Icône BookOpen visible
    - ✅ Message "No trades recorded yet"
    - ⚠️ **BOUTON NON FONCTIONNEL** : "Add First Trade" (pas d'action)

13. **Cliquer sur tab "Performance"**
    - ✅ **Attendu** : 2 cartes + 1 grande carte
    - ✅ **Win Rate** : "--%" avec badge "No data"
    - ✅ **Profit Factor** : "-.-" avec badge "No data"
    - ✅ **Equity Curve** : Message "Not enough data to display chart"

14. **Scroller vers le bas → Section "Quick Actions"**
    - ✅ 4 boutons visibles :
      - Follow Traders
      - View Signals
      - Add Trade
      - Risk Calculator
    - ⚠️ **TOUS NON FONCTIONNELS** : Pas d'action au clic

##### 1.3 Découverte de la Marketplace

15. **Cliquer sur "Browse Traders"** (dans l'alert orange)
    - ✅ **Attendu** : Redirection vers `/orgs/[slug]/traders`
    - ✅ Page "Traders Marketplace" affichée

16. **Vérifier l'affichage de la marketplace** :
    - ✅ Header "Discover Verified Traders"
    - ✅ Filtres visibles :
      - "All Traders" (par défaut)
      - "Verified Only"
    - ✅ Tri : Dropdown "Sort by" avec options :
      - Win Rate
      - Followers
      - Signals
      - Most Recent
    - ✅ Barre de recherche en haut
    - ✅ Liste de traders affichée (ou "No traders found" si DB vide)

17. **Si aucun trader n'existe** :
    - ✅ Message "No traders found" affiché
    - ✅ Texte : "No traders match your criteria"
    - ⚠️ **Passer au Parcours 2 pour créer un trader**

18. **Si des traders existent** :
    - ✅ Chaque carte trader affiche :
      - Photo de profil (ou placeholder)
      - Nom du trader
      - Badge "Verified" (si vérifié)
      - Bio (si renseignée)
      - Stats : Win Rate, Payoff Ratio, Max Drawdown
      - Nombre de followers
      - Nombre de signaux publiés
      - Bouton "Follow" (bleu) ou "Unfollow" (outline)

19. **Cliquer sur un trader** (carte entière cliquable)
    - ✅ **Attendu** : Redirection vers `/orgs/[slug]/traders/[traderId]`
    - ✅ Page profil trader affichée
    - ✅ Header avec photo + nom + bio
    - ✅ Stats détaillées
    - ✅ Bouton "Follow" / "Unfollow" en haut à droite

20. **Cliquer sur "Follow"**
    - ✅ **Attendu** :
      - Loading spinner sur le bouton (~1s)
      - Toast "Following [trader name]" affiché
      - Bouton devient "Unfollow" (outline)
    - ⚠️ **Vérifier les limites du plan** :
      - Free : Max 1 trader
      - Si déjà 1 trader suivi → Toast erreur "Upgrade to Pro to follow more traders"

21. **Retourner au dashboard** (cliquer "Dashboard" dans sidebar)
    - ✅ **Attendu** :
      - **Traders Followed** : 1 (au lieu de 0)
      - Alert orange disparue
      - Tab "Signals Feed" affiche maintenant les signaux du trader suivi (si il en a)

##### 1.4 Consultation des Signaux

22. **Vérifier tab "Signals Feed"**
    - ✅ Si le trader a des signaux actifs :
      - **TradingCard** affichée avec :
        - Header coloré (rouge pour SHORT, vert pour LONG)
        - Asset (ex: BTC, ETH)
        - Entry price
        - Take Profit(s)
        - Invalidation (Stop Loss)
        - Risk level (1-5)
        - Confidence (0-100%)
        - Rationales (liste)
        - Regime (ex: "Bullish continuation")
        - Countdown timer (temps avant expiration)

23. **Cliquer sur une TradingCard**
    - ⚠️ **Actuellement** : Pas d'action (pas de modal détail)
    - ✅ **Attendu futur** : Modal avec détails complets

---

### 🎯 Parcours 2 : Upgrade Plan (10-15 min)

#### Objectif
Tester le flow de souscription crypto (Pro ou Ultra).

#### Étapes Détaillées

##### 2.1 Navigation vers Pricing

1. **Depuis le dashboard**, cliquer sur "Pricing" dans la sidebar
   - ✅ **Attendu** : Redirection vers `/orgs/[slug]/pricing`
   - ✅ Page "Simple, Transparent Pricing" affichée

2. **Vérifier l'affichage des plans** :
   - ✅ 3 cartes de plans visibles :
     - **Free** : $0/mois
     - **Pro** : $49/mois (badge "Most Popular")
     - **Ultra** : $99/mois

3. **Vérifier les features de chaque plan** :
   - ✅ Free :
     - 5 signals/day
     - 1 trader to follow
     - 5min screener refresh
   - ✅ Pro :
     - 50 signals/day
     - 5 traders to follow
     - 1min screener refresh
     - Risk Console
     - Trading Journal
   - ✅ Ultra :
     - Unlimited signals
     - Unlimited traders
     - 5sec screener refresh
     - Custom Alerts
     - Advanced Filters

4. **Scroller vers le bas** :
   - ✅ Section "Secure Crypto Payments" affichée
   - ✅ 2 badges :
     - "Base (USDC) - 1 confirmation"
     - "Tron (USDT) - 2 confirmations"

5. **Vérifier la FAQ** :
   - ✅ 4 questions affichées avec réponses
   - ✅ Question "Can I pay less than the monthly price?" → Réponse pro-rata expliquée

##### 2.2 Sélection d'un Plan

6. **Cliquer sur "Subscribe Now" (plan Pro)**
   - ✅ **Attendu** : Redirection vers `/orgs/[slug]/checkout/pro`
   - ✅ Page "Subscribe to Pro Plan" affichée

7. **Vérifier l'affichage du checkout** :
   - ✅ Header :
     - Titre "Subscribe to Pro Plan"
     - Prix "$49 /month" en grand
     - Badge "Pay with Crypto (USDC or USDT)"

   - ✅ Card "What's included" :
     - Liste des features du plan Pro avec checkmarks verts

   - ✅ Card "Select Payment Method" :
     - 2 tabs :
       - "Base USDC ~2s"
       - "Tron USDT ~3s"

##### 2.3 Génération d'Adresse de Paiement

8. **Tab "Base USDC" sélectionné par défaut**
   - ✅ **Contenu affiché** :
     - Titre "Base (USDC)"
     - Description "Ethereum Layer 2 - Fast & cheap transactions"
     - Temps de confirmation "~2 seconds"
     - Bouton "Pay $49 with USDC"

9. **Cliquer sur "Pay $49 with USDC"**
   - ✅ **Attendu** :
     - Loading spinner pendant ~2-3s
     - Toast "Payment address generated!"
     - **Interface de paiement affichée** :
       - Instructions (3 étapes numérotées)
       - **QR Code** (200x200px, scannable)
       - **Adresse crypto** (format `0x...` pour Base)
       - Bouton "Copy" à côté de l'adresse
       - **Timer countdown** : 15:00 (15 minutes)
       - Section "Payment Status" : "Waiting for payment..." (spinner bleu)
       - Warning en orange : "Only send USDC on Base network..."

10. **Cliquer sur bouton "Copy"**
    - ✅ **Attendu** :
      - Adresse copiée dans le presse-papiers
      - Toast "Address copied to clipboard!"

11. **Observer le timer**
    - ✅ **Attendu** : Countdown en temps réel (14:59, 14:58, ...)
    - ⚠️ **Laisser tourner 1 minute pour vérifier**

##### 2.4 Test Paiement (Testnet Recommandé)

12. **Scanner le QR code avec un wallet mobile** OU **copier l'adresse**
    - ⚠️ **ATTENTION** : Utiliser TESTNET si possible (Base Sepolia)
    - ✅ Wallet doit ouvrir avec :
      - Adresse pré-remplie
      - Montant : Vide (à remplir manuellement)
      - Network : Base

13. **Envoyer EXACTEMENT $49 en USDC** (sur testnet)
    - ✅ **Attendre confirmation on-chain** (1-2 minutes sur Base)
    - ✅ **Observer le polling** :
      - Status vérifié toutes les 5 secondes
      - Spinner continue de tourner

14. **Une fois confirmé** :
    - ✅ **Attendu** :
      - Status passe à "CONFIRMED" (checkmark vert)
      - Toast "Payment confirmed! Activating your subscription..."
      - **Redirection automatique** vers `/orgs/[slug]/dashboard` après 2 secondes

15. **Vérifier le dashboard après paiement** :
    - ✅ Carte "Your Plan" affiche maintenant "Pro"
    - ✅ Date d'expiration affichée (dans 30 jours)
    - ✅ Peut maintenant suivre jusqu'à 5 traders

##### 2.5 Test Expiration Timer

16. **Si tu veux tester l'expiration** (optionnel) :
    - Générer une nouvelle adresse
    - **NE PAS PAYER**
    - Attendre 15 minutes (ou réduire le timer dans le code pour tester)
    - ✅ **Attendu** :
      - Timer atteint 00:00
      - Alert rouge "Payment session expired"
      - Message "Please generate a new address"
      - Bouton "Generate New Address" affiché

17. **Cliquer sur "Generate New Address"**
    - ✅ **Attendu** :
      - Nouvelle adresse générée (différente)
      - Timer reset à 15:00
      - Nouveau QR code affiché

---

### 🎯 Parcours 3 : Following et Signaux (10 min)

#### Objectif
Tester le système de follow/unfollow et la réception de signaux.

#### Étapes Détaillées

##### 3.1 Suivre Plusieurs Traders

1. **Aller sur la marketplace** (`/orgs/[slug]/traders`)

2. **Suivre un 2ème trader** :
   - ✅ **Si Free plan** : Toast erreur "Upgrade to Pro to follow more traders"
   - ✅ **Si Pro plan** : Peut suivre jusqu'à 5 traders
   - ✅ Bouton devient "Unfollow"

3. **Vérifier les limites** :
   - Free : 1 max → Erreur si on essaye de suivre un 2ème
   - Pro : 5 max → Peut suivre 5, erreur au 6ème
   - Ultra : Illimité → Pas de limite

##### 3.2 Consultation du Feed de Signaux

4. **Retourner au dashboard**
   - ✅ Compteur "Traders Followed" mis à jour
   - ✅ Tab "Signals Feed" affiche les signaux de TOUS les traders suivis

5. **Vérifier le tri des signaux** :
   - ✅ Plus récents en premier
   - ✅ Signaux expirés marqués comme "EXPIRED" (grisés)

##### 3.3 Unfollow

6. **Retourner sur la marketplace**
   - ✅ Traders suivis ont bouton "Unfollow" (outline)

7. **Cliquer sur "Unfollow"**
   - ✅ **Attendu** :
     - Loading spinner
     - Toast "Unfollowed [trader name]"
     - Bouton devient "Follow" (bleu)

8. **Retourner au dashboard**
   - ✅ Compteur "Traders Followed" décrémenté
   - ✅ Signaux du trader unfollowed disparaissent du feed

---

## Parcours Trader

### 🎯 Parcours 4 : Devenir Trader (20-25 min)

#### Objectif
Tester la création d'un profil trader et la publication de signaux.

#### Étapes Détaillées

##### 4.1 Création Profil Trader

1. **Se connecter avec un compte utilisateur**
   - ⚠️ **Peut être le même compte que Parcours 1** (MyCryptoPilot supporte BOTH)

2. **Aller dans Account** (sidebar) → Cliquer sur ton avatar en haut à droite
   - ✅ **Attendu** : Menu dropdown affiché
   - ✅ Items visibles :
     - Account
     - Settings
     - Logout

3. **Cliquer sur "Account"**
   - ✅ **Attendu** : Redirection vers `/account`
   - ✅ Page "Edit Profile" affichée

4. **Scroller vers le bas → Trouver section "Trader Mode"**
   - ✅ Card "Trader Mode" affichée
   - ✅ Toggle switch visible (OFF par défaut)
   - ✅ Texte : "Share your trading signals and earn revenue"

5. **Activer le toggle "Trader Mode"**
   - ✅ **Attendu** :
      - Loading spinner pendant ~1s
      - Toast "Trader mode enabled!"
      - **Redirection automatique** vers `/account/become-trader`

##### 4.2 Remplir le Formulaire Trader

6. **Vérifier l'affichage du formulaire** :
   - ✅ Titre "Become a Verified Trader"
   - ✅ Description : "Complete your profile to start publishing signals"
   - ✅ Formulaire avec 6 champs :
     - Display Name (requis)
     - Profile Image (upload)
     - Bio (textarea)
     - Trading Style (select)
     - Experience (select)
     - Social Links (optionnel)

7. **Remplir le formulaire** :
   ```
   Display Name: Crypto Master
   Bio: 5+ years in crypto trading. Specializing in BTC/ETH swing trading with risk management focus.
   Trading Style: Swing Trader
   Experience: 3-5 years
   Social Links:
     Twitter: @cryptomaster
     Discord: cryptomaster#1234
   ```

8. **Upload une photo de profil** :
   - ✅ **Attendu** :
     - Cliquer sur zone "Upload Image"
     - Sélectionner image (JPG/PNG, max 5MB)
     - Preview affiché immédiatement
     - Loading pendant upload
     - URL stockée dans le formulaire

9. **Cliquer sur "Create Trader Profile"**
   - ✅ **Attendu** :
     - Loading spinner pendant ~2s
     - Toast "Trader profile created successfully!"
     - **Redirection** vers `/orgs/[slug]/dashboard/trader`

##### 4.3 Découverte du Trader Dashboard

10. **Vérifier l'affichage du Trader Dashboard** :
    - ✅ Header "Trader Dashboard"
    - ✅ Bouton "Create Signal" (vert) en haut à droite
    - ✅ 4 cartes de stats :
      - **Followers** : 0
      - **Active Signals** : 0
      - **Win Rate** : --%
      - **Revenue** : $0

11. **Observer la carte "Trader Status"** (orange) :
    - ✅ Badge "Not Verified"
    - ✅ Checklist de progression :
      - [1/3] Complete your trader profile ✅
      - [0/10] Publish 10+ quality signals
      - [0/5] Get 5+ followers
    - ⚠️ **BOUTON NON FONCTIONNEL** : "Complete Profile"

12. **Observer les tabs** :
    - ✅ 3 tabs :
      - "My Signals" (actif par défaut)
      - "Performance"
      - "Revenue"

13. **Tab "My Signals"** :
    - ✅ Message "No signals published yet"
    - ✅ Bouton "Create Your First Signal"

14. **Tab "Performance"** :
    - ✅ Placeholder data (--%, -.-,  --)
    - ✅ Message "Not enough data to display chart"

15. **Tab "Revenue"** :
    - ✅ 3 cartes : This Month, Last Month, All Time (toutes à $0)
    - ✅ Message "No revenue data yet"

16. **Section "Quick Actions"** en bas :
    - ✅ 4 boutons :
      - Create Signal
      - View Followers
      - Analytics
      - Edit Profile
    - ⚠️ **TOUS NON FONCTIONNELS** sauf "Create Signal"

##### 4.4 Création d'un Signal de Trading

17. **Cliquer sur "Create Signal"** (bouton vert en haut à droite)
    - ✅ **Attendu** : Redirection vers `/orgs/[slug]/dashboard/trader/signals/new`
    - ✅ Page "Create Trading Signal" affichée

18. **Vérifier l'affichage du formulaire** :
    - ✅ **Grand formulaire** (515 lignes de code !) avec sections :
      - Basic Info
      - Price Levels
      - Take Profits
      - Risk & Confidence
      - Market Context
      - Rationales
    - ✅ **Preview en temps réel** : TradingCard affichée à droite (ou en bas sur mobile)

19. **Remplir le formulaire - Section "Basic Info"** :
    ```
    Asset: BTC
    Instrument Type: PERP (sélectionner radio)
    Bias: LONG (sélectionner radio)
    ```
    - ✅ **Observer le preview** : Header devient vert (LONG)

20. **Section "Price Levels"** :
    ```
    Entry Price: 42000
    Invalidation (Stop Loss): 40500
    ```
    - ✅ **Observer le preview** : Prix affichés dans la card

21. **Section "Take Profits"**  :
    ```
    TP1: 43500
    TP2: 45000
    TP3: 47000
    ```
    - ✅ Cliquer sur "+ Add TP" pour ajouter TP2 et TP3
    - ✅ **Observer le preview** : TPs listés dans la card

22. **Section "Risk & Confidence"** :
    ```
    Risk Level: 3 (slider)
    Confidence: 75% (slider)
    Leverage Band: 1x-3x (input)
    ```
    - ✅ **Observer le preview** : Risk indicator affiché (3/5 étoiles)

23. **Section "Market Context"** :
    ```
    Regime: Bullish continuation after breakout
    ```

24. **Section "Rationales"** :
    ```
    Rationale 1: Breaking above key resistance at 41.8k with strong volume
    Rationale 2: RSI showing bullish divergence on 4H timeframe
    Rationale 3: Funding rate neutral, indicating no overheating
    ```
    - ✅ Cliquer sur "+ Add Rationale" pour ajouter 2ème et 3ème

25. **Vérifier la TradingCard preview** :
    - ✅ Tous les champs remplis affichés en temps réel
    - ✅ Header vert avec "LONG"
    - ✅ Asset "BTC" visible
    - ✅ Entry, TPs, Invalidation listés
    - ✅ Risk 3/5
    - ✅ Confidence 75%
    - ✅ 3 rationales affichées
    - ✅ Countdown timer (durée configurable, défaut 24h)

26. **Cliquer sur "Publish Signal"**
    - ✅ **Attendu** :
      - Loading spinner pendant ~2-3s
      - **Appel Discord webhook automatique** (signal envoyé au channel #signals)
      - Toast "Signal published successfully!"
      - **Redirection** vers `/orgs/[slug]/dashboard/trader`

27. **Vérifier le Trader Dashboard après publication** :
    - ✅ Compteur "Active Signals" : 1
    - ✅ Tab "My Signals" affiche maintenant le signal créé (TradingCard)
    - ✅ Checklist "Trader Status" : [1/10] Publish 10+ quality signals

##### 4.5 Vérification Discord Webhook

28. **Ouvrir Discord** → Aller sur le serveur MyCryptoPilot
    - ✅ Channel #signals existe
    - ✅ **Signal automatiquement posté** :
      - Embed riche avec :
        - Titre "[LONG] BTC PERP"
        - Couleur verte (LONG)
        - Fields : Entry, TPs, Invalidation, Risk, Confidence
        - Rationales listées
        - Footer : "Posted by @Crypto Master"
        - Timestamp

29. **Vérifier les notifications** :
    - ✅ Si le trader a des followers → Ils reçoivent une DM Discord (si connecté)
    - ✅ DM contient :
      - "New signal from Crypto Master!"
      - Lien vers le signal
      - Résumé (Asset, Bias, Entry)

---

### 🎯 Parcours 5 : Gestion des Signaux (10 min)

#### Objectif
Tester l'édition, clôture et gestion des signaux.

#### Étapes Détaillées

##### 5.1 Liste des Signaux

1. **Depuis le Trader Dashboard** → Tab "My Signals"
   - ✅ Liste de tous les signaux publiés
   - ✅ Chaque signal affiche :
     - TradingCard complète
     - Badge status : ACTIVE, TP_HIT, INVALIDATED, EXPIRED
     - Bouton "Edit" (optionnel)
     - Bouton "Close" (pour marquer TP hit ou invalidation)

##### 5.2 Clôture d'un Signal

2. **Cliquer sur "Close Signal"** (si implémenté)
   - ⚠️ **Actuellement** : Pas encore implémenté (Phase 5)
   - ✅ **Attendu futur** :
     - Modal "Close Signal"
     - Radio buttons : "TP Hit" / "Invalidated"
     - Sélectionner quel TP a été hit (si plusieurs)
     - Bouton "Confirm"

3. **Après clôture** :
   - ✅ Status passe à "TP_HIT" ou "INVALIDATED"
   - ✅ Stats mises à jour (winrate, payoff)
   - ✅ Signal reste visible mais marqué comme fermé

##### 5.3 Édition Profil Trader

4. **Cliquer sur "Edit Profile"** (dans Quick Actions ou menu)
   - ⚠️ **Actuellement** : Bouton non fonctionnel
   - ✅ **Attendu** : Retour au formulaire `/account/become-trader` en mode édition

---

## Parcours Admin

### 🎯 Parcours 6 : Panel Admin (15 min)

#### Objectif
Tester les fonctionnalités d'administration (réservé aux admins).

⚠️ **Note** : Nécessite un compte avec `role: ADMIN` dans la DB.

#### Étapes Détaillées

##### 6.1 Accès au Panel

1. **Se connecter avec un compte ADMIN**

2. **Aller à** `http://localhost:3000/admin`
   - ✅ **Si non admin** : Redirection ou erreur 403
   - ✅ **Si admin** : Page "Admin Dashboard" affichée

3. **Vérifier les sections visibles** :
   - ✅ Sidebar avec 4 liens :
     - Dashboard
     - Users
     - Organizations
     - Feedback

##### 6.2 Gestion des Users

4. **Cliquer sur "Users"**
   - ✅ **Attendu** : Redirection vers `/admin/users`
   - ✅ Liste de tous les utilisateurs affichée en tableau
   - ✅ Colonnes :
     - Name
     - Email
     - Role (USER / TRADER / BOTH / ADMIN)
     - Created At
     - Actions

5. **Cliquer sur un user**
   - ✅ **Attendu** : Redirection vers `/admin/users/[userId]`
   - ✅ Détails complets de l'utilisateur :
     - Infos de base (name, email, image)
     - Role et permissions
     - Organizations liées
     - Statistiques (signaux, followers, etc.)
     - Actions : Ban, Delete (danger zone)

##### 6.3 Gestion des Organizations

6. **Aller sur "Organizations"**
   - ✅ Liste de toutes les orgs en tableau
   - ✅ Colonnes : Name, Slug, Owner, Members, Created At

7. **Cliquer sur une org**
   - ✅ Détails de l'org
   - ✅ Liste des membres
   - ✅ Subscription info (plan, status, dates)

##### 6.4 Feedback

8. **Aller sur "Feedback"**
   - ✅ Liste de tous les feedbacks users
   - ✅ Filtres : All / Pending / Resolved
   - ✅ Marquer comme résolu

---

## Tests Crypto Payment

### 🎯 Parcours 7 : Tests Paiements Avancés (30 min)

#### Objectif
Tester tous les cas edge du système de paiement crypto.

#### Scénarios à Tester

##### 7.1 Paiement Pro-Rata

**Scénario** : Payer moins que le prix mensuel.

1. Aller sur `/orgs/[slug]/checkout/pro`
2. Générer une adresse Base USDC
3. **Payer seulement $25** (au lieu de $49)
4. ✅ **Attendu** :
   - Paiement confirmé
   - Subscription activée pour **15 jours** (25/49 * 30 jours)
   - Dashboard affiche expiration dans 15 jours

##### 7.2 Paiement Doublé

**Scénario** : Payer $98 d'un coup.

1. Générer une adresse pour plan Pro ($49)
2. **Payer $98** (double)
3. ✅ **Attendu** :
   - Paiement confirmé
   - Subscription activée pour **60 jours** (2 mois)

##### 7.3 Mauvais Montant (Trop Faible)

**Scénario** : Payer moins de $1.

1. Générer une adresse
2. **Payer $0.50**
3. ✅ **Attendu** :
   - Paiement détecté mais rejeté
   - Toast erreur "Amount too low (minimum $1)"
   - Status reste "PENDING"

##### 7.4 Mauvais Network

**Scénario** : Payer USDC sur Ethereum au lieu de Base.

1. Générer une adresse Base
2. **Envoyer USDC sur Ethereum** (mainnet) vers cette adresse
3. ✅ **Attendu** :
   - ⚠️ **Paiement non détecté** (watcher surveille seulement Base RPC)
   - Status reste "PENDING"
   - Timer expire après 15 min

##### 7.5 Expiration et Régénération

**Scénario** : Laisser expirer puis régénérer.

1. Générer une adresse
2. **Ne pas payer**
3. Attendre 15 minutes (ou réduire timer pour test)
4. ✅ **Attendu** :
   - Status passe à "EXPIRED"
   - Alert rouge "Payment session expired"
   - Bouton "Generate New Address"
5. Cliquer sur "Generate New Address"
6. ✅ **Nouvelle adresse différente** générée
7. Payer la nouvelle adresse
8. ✅ **Attendu** : Paiement confirmé normalement

##### 7.6 Double Paiement (Edge Case)

**Scénario** : Payer 2 fois la même adresse.

1. Générer une adresse
2. **Payer $49**
3. Attendre confirmation
4. **Payer encore $49** sur la MÊME adresse
5. ✅ **Attendu** :
   - Premier paiement : Subscription activée (30 jours)
   - Deuxième paiement :
     - Détecté comme nouveau paiement
     - **Étend la subscription** de 30 jours supplémentaires (total 60 jours)
     - Ou crée un crédit (si implémenté)

##### 7.7 Tron USDT (Network Alternatif)

**Scénario** : Tester le réseau Tron.

1. Aller sur checkout
2. Sélectionner tab "Tron USDT"
3. Générer adresse Tron (format `T...`)
4. Payer $49 en USDT (TRC-20)
5. ✅ **Attendu** :
   - Confirmation après **2 blocks** (au lieu de 1 pour Base)
   - Délai ~3-6 secondes
   - Subscription activée normalement

---

## Tests Discord Integration

### 🎯 Parcours 8 : Discord Bot (20 min)

#### Objectif
Tester toutes les commandes Discord et intégrations.

⚠️ **Note** : Nécessite accès au serveur Discord MyCryptoPilot.

#### Étapes Détaillées

##### 8.1 Connexion Discord

1. **Aller sur** `/account/discord`
   - ✅ Card "Connect Discord" affichée
   - ✅ Bouton "Connect Discord"

2. **Cliquer sur "Connect Discord"**
   - ✅ **Attendu** :
     - Redirection OAuth Discord
     - Autoriser l'app
     - Retour sur `/account/discord`
     - Toast "Discord connected!"
     - Badge "Connected" affiché avec avatar Discord

##### 8.2 Commandes Slash

**Ouvrir Discord** → Aller sur le serveur MyCryptoPilot.

3. **Taper `/help`**
   - ✅ **Attendu** :
     - Embed avec liste de toutes les commandes
     - Descriptions claires

4. **Taper `/status`**
   - ✅ **Attendu** :
     - Affiche ton rôle (User / Trader / Both)
     - Plan actuel (Free / Pro / Ultra)
     - Nombre de signaux reçus aujourd'hui
     - Nombre de traders suivis

5. **Taper `/signals`**
   - ✅ **Attendu** :
     - Liste des 5 derniers signaux actifs
     - Pour chaque signal : Asset, Bias, Entry, Status

6. **Taper `/follow [trader_name]`**
   - ✅ **Attendu** :
     - Autocomplete des traders disponibles
     - Sélectionner un trader
     - Message "You are now following [trader]!"
     - Rôle Discord "@Follower" auto-assigné

7. **Taper `/upgrade`**
   - ✅ **Attendu** :
     - Embed avec liens vers pricing
     - Bouton "View Plans" (lien vers site)

##### 8.3 Rôles Automatiques

8. **Vérifier les rôles auto-assignés** :
   - ✅ Nouveaux members : `@Member`
   - ✅ Users avec plan Free : `@Free Tier`
   - ✅ Users avec plan Pro : `@Pro Tier`
   - ✅ Users avec plan Ultra : `@Ultra Tier`
   - ✅ Traders : `@Trader`
   - ✅ Verified traders : `@Verified Trader`

9. **Tester le changement de plan** :
   - Upgrader de Free à Pro (via crypto payment)
   - ✅ **Attendu** : Rôle Discord change automatiquement de `@Free Tier` à `@Pro Tier`

##### 8.4 Notifications DM

10. **Avoir un compte qui suit un trader**

11. **Le trader publie un signal** (via webapp)

12. **Vérifier les DMs Discord** :
    - ✅ **Attendu** :
      - DM reçue du bot MyCryptoPilot
      - Contenu :
        - "🚀 New signal from [Trader Name]!"
        - Asset, Bias, Entry
        - Lien vers le signal sur le site
        - Bouton "View Signal"

##### 8.5 Channel #signals

13. **Vérifier le channel #signals** sur le serveur :
    - ✅ Tous les signaux publiés apparaissent automatiquement
    - ✅ Format Embed riche
    - ✅ Réactions possibles : 👍 👎 💰

---

## Checklist de Validation

### ✅ Fonctionnalités Critiques (MVP)

#### Authentication & Users
- [ ] Inscription email/password
- [ ] Connexion email/password
- [ ] Magic link login (optionnel)
- [ ] OAuth (GitHub, Google, Discord)
- [ ] Reset password
- [ ] Email verification
- [ ] Logout

#### Profils & Roles
- [ ] Création profil trader
- [ ] Upload photo profil
- [ ] Toggle User ↔ Trader ↔ Both
- [ ] Édition profil user
- [ ] Édition profil trader

#### Signaux de Trading
- [ ] Création signal (formulaire complet)
- [ ] Preview temps réel (TradingCard)
- [ ] Publication signal
- [ ] Webhook Discord automatique
- [ ] Liste signaux (user dashboard)
- [ ] Liste signaux (trader dashboard)
- [ ] Filtres signaux (actifs, expirés)
- [ ] Countdown timer sur TradingCard

#### Follow System
- [ ] Follow trader (marketplace)
- [ ] Unfollow trader
- [ ] Limites plan respectées (Free: 1, Pro: 5, Ultra: ∞)
- [ ] Liste traders suivis
- [ ] Compteurs followers

#### Marketplace
- [ ] Liste traders
- [ ] Filtres (All, Verified)
- [ ] Tri (Win Rate, Followers, Signals, Recent)
- [ ] Search bar
- [ ] Pagination (cursor-based)
- [ ] Profil trader public
- [ ] Stats trader (winrate, payoff, drawdown)

#### Crypto Payments
- [ ] Page pricing
- [ ] Page checkout (Pro, Ultra)
- [ ] Génération adresse Base
- [ ] Génération adresse Tron
- [ ] QR code scannable
- [ ] Copy to clipboard
- [ ] Timer 15 minutes
- [ ] Polling status (5s)
- [ ] Détection paiement on-chain
- [ ] Confirmation (1 pour Base, 2 pour Tron)
- [ ] Activation subscription automatique
- [ ] Pro-rata supporté
- [ ] Gestion expiration
- [ ] Régénération adresse

#### Subscriptions
- [ ] Activation plan (Free par défaut)
- [ ] Upgrade Free → Pro
- [ ] Upgrade Free → Ultra
- [ ] Upgrade Pro → Ultra
- [ ] Expiration gérée (auto-downgrade à Free)
- [ ] Affichage date expiration
- [ ] Limites appliquées (signals/day, traders suivis)

#### Discord Integration
- [ ] Bot déployé 24/7 (Railway)
- [ ] Connexion Discord OAuth
- [ ] Commandes slash (/help, /status, /signals, /follow, /upgrade)
- [ ] Webhook signaux (#signals)
- [ ] DM notifications followers
- [ ] Rôles automatiques (5 rôles)
- [ ] Channel #signals auto-créé

#### Dashboards
- [ ] User Dashboard (3 stats cards, tabs, feed)
- [ ] Trader Dashboard (4 stats cards, tabs, signaux)
- [ ] Fetches Prisma réels (pas de placeholders)
- [ ] Stats mises à jour en temps réel

#### Admin Panel (Optionnel pour MVP)
- [ ] Liste users
- [ ] Détails user
- [ ] Liste organizations
- [ ] Détails org
- [ ] Feedback management

---

### ⚠️ Bugs Connus & Limitations

#### Boutons Non Fonctionnels (À Fixer)

##### Landing Page
- ❌ **`src/features/landing/cta/cta-card-section.tsx:29`**
  - Bouton "Learn more" → `<Link href="#">`
  - **Fix** : Lien vers `/docs` ou section #features

##### User Dashboard
- ❌ **`app/orgs/[orgSlug]/(navigation)/dashboard/page.tsx:79`**
  - Bouton "Follow Traders" (header) → Pas d'action
  - **Fix** : `<Link href="/traders">`

- ❌ **`page.tsx:184`** (Tab Trading Journal)
  - Bouton "Add First Trade" → Pas d'action
  - **Fix** : `<Link href="/journal/new">` (page à créer)

- ❌ **`page.tsx:259-274`** (Quick Actions - 4 boutons)
  - "Follow Traders" → Pas de lien
  - "View Signals" → Pas de lien
  - "Add Trade" → Pas de lien
  - "Risk Calculator" → Pas de lien
  - **Fix** : Ajouter `asChild` + `<Link>`

##### Trader Dashboard
- ❌ **`app/orgs/[orgSlug]/(navigation)/dashboard/trader/page.tsx:174`**
  - Bouton "Complete Profile" → Pas d'action
  - **Fix** : `<Link href="/account/become-trader">`

- ❌ **`page.tsx:325-341`** (Quick Actions - 4 boutons)
  - "Create Signal" → Pas de lien (sauf header qui fonctionne)
  - "View Followers" → Pas de lien
  - "Analytics" → Pas de lien
  - "Edit Profile" → Pas de lien
  - **Fix** : Ajouter `asChild` + `<Link>`

##### Total Boutons Cassés
- **Landing** : 1
- **User Dashboard** : 5
- **Trader Dashboard** : 5
- **TOTAL** : **11 boutons à fixer**

#### Fonctionnalités Manquantes (Phase 5 - Post-MVP)

##### Journal de Trading
- ❌ Page `/journal` (liste trades)
- ❌ Page `/journal/new` (ajouter trade)
- ❌ Calcul stats (win rate, profit factor)
- ❌ Graphique equity curve

##### Console de Risque
- ❌ Page `/risk-calculator`
- ❌ Calcul position sizing
- ❌ Calcul R:R ratio
- ❌ Suggestion stop loss

##### Alertes Custom (Ultra Plan)
- ❌ Créer alertes personnalisées
- ❌ Notifications email/Discord/SMS
- ❌ Filtres avancés (prix, volume, RSI, etc.)

##### Screener Temps Réel
- ❌ Page `/screener`
- ❌ Refresh automatique (5s pour Ultra, 1min pour Pro, 5min pour Free)
- ❌ Filtres techniques (RSI, MACD, Volume)

##### Gestion Signaux (Traders)
- ❌ Éditer signal existant
- ❌ Clôturer signal (TP hit / invalidated)
- ❌ Historique performances (calculé automatiquement)

##### Analytics Avancés
- ❌ Graphiques performances (equity curve)
- ❌ Heatmap trades
- ❌ Analyse par asset/timeframe
- ❌ Export CSV

##### Revenue Tracking (Traders)
- ❌ Dashboard revenue (actuellement $0 hardcodé)
- ❌ Historique paiements reçus
- ❌ Statistiques followers (growth chart)

---

### 🔍 Tests de Régression

Après chaque fix, re-tester :

1. **Authentification complète** (signup → login → logout)
2. **Parcours crypto payment** (génération adresse → paiement → activation)
3. **Création signal** (formulaire → preview → publication → Discord)
4. **Follow/Unfollow** (limits respectées, compteurs mis à jour)
5. **Dashboards data** (pas de données factices, fetches réels)

---

### 📊 Métriques de Succès

#### Performance
- ⏱️ Temps de chargement page < 2s
- ⏱️ Temps génération adresse crypto < 3s
- ⏱️ Temps publication signal < 3s
- ⏱️ Polling payment status : 5s intervals (pas de lag)

#### UX
- ✅ 0 erreurs console navigateur
- ✅ Mobile responsive (toutes pages)
- ✅ Toasts informatifs (pas d'erreurs silencieuses)
- ✅ Loading states clairs (pas de "hang")

#### Data Integrity
- ✅ Compteurs justes (followers, signaux, traders suivis)
- ✅ Stats mises à jour en temps réel
- ✅ Pas de data factice affichée
- ✅ Dates formatées correctement

---

## 🐛 Reporting de Bugs

### Template Bug Report

Quand tu trouves un bug, utilise ce format :

```markdown
### 🐛 [Titre du Bug]

**Parcours** : [Numéro du parcours, ex: Parcours 2.3]
**Page** : [URL exacte]
**User** : [Role: User / Trader / Admin]
**Plan** : [Free / Pro / Ultra]

**Steps to Reproduce** :
1. Aller sur X
2. Cliquer sur Y
3. Observer Z

**Comportement Attendu** :
[Ce qui devrait se passer]

**Comportement Actuel** :
[Ce qui se passe réellement]

**Screenshot** :
[Si applicable]

**Console Errors** :
[Copier erreurs console si présentes]

**Priorité** : [P0 Bloquant / P1 Critique / P2 Important / P3 Nice-to-have]
```

### Exemples

#### Bug P0 (Bloquant)

```markdown
### 🐛 Impossible de créer un signal (erreur 500)

**Parcours** : Parcours 4.4 - Étape 26
**Page** : `/orgs/test/dashboard/trader/signals/new`
**User** : Trader
**Plan** : Free

**Steps** :
1. Remplir formulaire signal complet
2. Cliquer "Publish Signal"
3. Erreur 500

**Attendu** : Signal publié, redirect dashboard

**Actuel** : Toast erreur "Failed to publish signal", reste sur la page

**Console** :
```
POST /api/signals/create 500
Error: Database connection failed
```

**Priorité** : P0 Bloquant
```

#### Bug P2 (Important mais non bloquant)

```markdown
### 🐛 Timer countdown ne s'arrête pas après paiement

**Parcours** : Parcours 2.3 - Étape 14
**Page** : `/orgs/test/checkout/pro`
**User** : User
**Plan** : Free

**Steps** :
1. Générer adresse
2. Payer $49 en USDC
3. Attendre confirmation
4. Observer le timer

**Attendu** : Timer s'arrête quand status devient "CONFIRMED"

**Actuel** : Timer continue jusqu'à 00:00 même après confirmation

**Screenshot** : [URL]

**Priorité** : P2 Important
```

---

## 🎯 Conclusion

Ce guide couvre **tous les parcours utilisateurs possibles** dans MyCryptoPilot MVP.

### Temps Total de Test

- **Parcours User** : ~45-50 min
- **Parcours Trader** : ~55-60 min
- **Parcours Admin** : ~15 min
- **Tests Crypto** : ~30 min
- **Tests Discord** : ~20 min
- **TOTAL** : **~2h30-3h** pour un test E2E complet

### Prochaines Étapes

1. ✅ **Tester chaque parcours** avec ce guide
2. ✅ **Reporter tous les bugs** trouvés (GitHub Issues)
3. ✅ **Fixer les 11 boutons cassés** (Quick wins)
4. ✅ **Valider crypto payment** en testnet
5. ✅ **Tester Discord webhook** en prod
6. 🚀 **Déployer en production** quand 100% des tests passent

---

**Bonne chance pour les tests !** 🎉

Si tu trouves des bugs ou as des questions, crée une issue GitHub avec le format ci-dessus.
