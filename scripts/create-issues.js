#!/usr/bin/env node

/**
 * Script de création automatique des issues GitHub pour MyCryptoPilot
 *
 * Usage:
 * npm run create-issues
 * ou
 * node scripts/create-issues.js
 *
 * Prérequis:
 * - GITHUB_TOKEN dans les variables d'environnement
 * - Package @octokit/rest installé
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  owner: 'yoannandrieux', // À remplacer par votre organisation GitHub
  repo: 'mycryptopilot',
  labels: ['user-story', 'phase-1', 'needs-triage'],
  assignees: [], // Ajouter les usernames des développeurs
};

// Initialisation Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// User Stories à créer (basées sur USER_STORIES.md)
const USER_STORIES = [
  {
    number: '01',
    title: 'Mise à jour du Branding',
    userStory: `En tant que propriétaire du projet
Je veux que l'application soit complètement rebrandée en MyCryptoPilot
Afin de créer une identité cohérente pour le produit de trading crypto`,
    scope: `**In scope** :
- Le nom du projet dans package.json est "mycryptopilot"
- Le site-config.ts contient la configuration MyCryptoPilot
- Le README.md reflète le nouveau positionnement
- Les couleurs du branding sont mises à jour (ambre, émeraude, rouge)
- Le domaine pointe vers mycryptopilot.app

**Out of scope** :
- Création du logo (à faire séparément)
- Marketing avancé`,
    dependencies: `- **APIs** : Aucune
- **Rôles** : Admin
- **Schémas** : Configuration files
- **Flags** : Aucun`,
    design: `**Schémas** :
- Mise à jour des variables dans package.json
- Configuration site-config.ts
- Mise à jour des couleurs TailwindCSS`,
    telemetry: `**Logs clés** :
- Brand configuration loaded
- Domain redirect applied

**Métriques Prometheus** :
- redirect_count_total`,
    security: `**ACL** : N/A
**Rate-limit** : N/A
**Idempotence** : N/A`,
    acceptanceCriteria: `**Scenario 1: Configuration package.json**
Given le fichier package.json existe
When je mets à jour le nom du projet
Then le nom est "mycryptopilot"

**Scenario 2: Domain redirect**
Given un utilisateur visite http://ancien-domaine.com
When il accède au site
Then il est redirigé vers mycryptopilot.app`,
    tests: `#### Tests Unitaires
- [ ] Configuration loading
- [ ] Domain redirect logic

#### Tests d'Intégration
- [ ] Brand consistency across pages
- [ ] Meta tags validation

#### Tests E2E
- [ ] Domain redirect test
- [ ] Brand validation`,
    testData: `**Adresses** : N/A
**Montants** : N/A
**IDs** : N/A
**Canaux Discord** : N/A`,
    dod: `- [ ] Package.json mis à jour
- [ ] Site-config.ts configuré
- [ ] README.md mis à jour
- [ ] Couleurs branding mises à jour
- [ ] Tests verts
- [ ] Documentation mise à jour`,
    estimation: 'Simple - 1 jour/homme',
    risks: 'Risque faible - principalement des modifications de configuration',
    labels: ['user-story', 'phase-1', 'branding'],
  },
  {
    number: '02',
    title: 'Structure de Données Initiale',
    userStory: `En tant que développeur
Je veux un schéma de base de données solide pour MyCryptoPilot
Afin de supporter toutes les fonctionnalités prévues`,
    scope: `**In scope** :
- Schéma Prisma avec modèles User, Subscription, Payment, Signal, Trader
- Support des rôles (User, Pro, Ultra, Trader, Admin)
- Système d'adresses crypto par utilisateur
- Tables pour le journal de trading et les performances
- Relations clairement définies entre les entités

**Out of scope** :
- Indexes avancés (à faire dans US performance)
- Sharding/Partitionnement`,
    dependencies: `- **APIs** : Aucune
- **Rôles** : Admin
- **Schémas** : Prisma schema
- **Flags** : Aucun`,
    design: `**Schémas** :
\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  discordId String   @unique
  email     String?
  role      UserRole @default(USER)
  plan      UserPlan @default(FREE)
  expiry    DateTime?

  subscriptions Subscription[]
  payments     Payment[]
  journals     JournalEntry[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\`

**DTOs** : UserDTO, SubscriptionDTO, PaymentDTO
**Permission model** : Role-based access control`,
    telemetry: `**Logs clés** :
- Database migration started/completed
- Schema validation results

**Métriques Prometheus** :
- database_connection_pool_size
- query_duration_seconds`,
    security: `**ACL** : Database role permissions
**Rate-limit** : Database connection limits
**Idempotence** : Migration idempotency`,
    acceptanceCriteria: `**Scenario 1: Création utilisateur**
Given un nouveau Discord user
When il est enregistré
Then une entrée User est créée avec rôle USER

**Scenario 2: Création abonnement**
Given un utilisateur existant
When il souscrit à un plan
Then une entrée Subscription est créée avec l'adresse crypto`,
    tests: `#### Tests Unitaires
- [ ] Schema validation
- [ ] Model creation
- [ ] Relation queries

#### Tests d'Intégration
- [ ] Database connection
- [ ] Migration execution
- [ ] Data integrity

#### Tests E2E
- [ ] Full CRUD operations
- [ ] Data relationships`,
    testData: `**Adresses** : 0x123..., TR7NH...
**Montants** : 39, 59, 99, 149
**IDs** : user_test_001, sub_test_001
**Canaux Discord** : #general`,
    dod: `- [ ] Schéma Prisma validé
- [ ] Toutes les migrations passent
- [ ] Tests de données passent
- [ ] Documentation schéma générée
- [ ] Relations testées
- [ ] Performance queries OK`,
    estimation: 'Complexe - 3 jours/homme',
    risks: 'Risque moyen - impact sur tout le système',
    labels: ['user-story', 'phase-1', 'database'],
  },
  {
    number: '03',
    title: 'Discord Bot Foundation',
    userStory: `En tant qu'administrateur Discord
Je veux un bot fonctionnel avec les permissions appropriées
Afin de gérer les rôles et interactions sur le serveur`,
    scope: `**In scope** :
- Bot Discord créé et invité sur le serveur
- Permissions configurées (gérer les rôles, envoyer des messages, etc.)
- Commandes de base (/help, /status, /upgrade) fonctionnelles
- Système de rôles automatiques implémenté
- Gestion des erreurs et logging

**Out of scope** :
- Commandes avancées de trading
- Système de paiement intégré`,
    dependencies: `- **APIs** : Discord Bot API
- **Rôles** : Admin
- **Schémas** : User schema
- **Flags** : feature_discord_bot_enabled`,
    design: `**Schémas** :
- Discord bot configuration
- Command structure with slash commands

**DTOs** : DiscordInteraction, CommandResponse
**Permission model** : Discord permission system`,
    telemetry: `**Logs clés** :
- Command executed
- Role assigned/removed
- Error occurred

**Métriques Prometheus** :
- discord_commands_total
- discord_response_time_seconds
- role_changes_total`,
    security: `**ACL** : Discord permission checks
**Rate-limit** : Discord API rate limits
**Idempotence** : Role change idempotency`,
    acceptanceCriteria: `**Scenario 1: Commande /help**
Given un utilisateur exécute /help
When le bot reçoit la commande
Then il répond avec la liste des commandes disponibles

**Scenario 2: Assignation rôle**
Given un utilisateur paie son abonnement
When le paiement est validé
Then le bot assigne le rôle Pro automatiquement`,
    tests: `#### Tests Unitaires
- [ ] Command parsing
- [ ] Permission checks
- [ ] Role management

#### Tests d'Intégration
- [ ] Discord API integration
- [ ] Command registration
- [ ] Error handling

#### Tests E2E
- [ ] Full command flow
- [ ] Role assignment test`,
    testData: `**Adresses** : N/A
**Montants** : N/A
**IDs** : test_user_001, test_guild_001
**Canaux Discord** : #general, #commands`,
    dod: `- [ ] Bot créé et configuré
- [ ] Commandes de base fonctionnelles
- [ ] Système de rôles opérationnel
- [ ] Logging implémenté
- [ ] Tests de Discord API passants
- [ ] Documentation bot créée`,
    estimation: 'Moyenne - 2 jours/homme',
    risks: 'Risque moyen - dépendances Discord API',
    labels: ['user-story', 'phase-1', 'discord'],
  },
  // Ajouter les autres user stories ici...
  {
    number: '04',
    title: 'Génération d\'Adresses Crypto',
    userStory: `En tant qu'utilisateur souhaitant souscrire
Je veux recevoir une adresse crypto unique pour mon paiement
Afin de pouvoir payer mon abonnement en crypto`,
    scope: `**In scope** :
- Commande /upgrade fonctionnelle
- Génération d'adresse unique par utilisateur/réseau
- Support de USDC (Base) et USDT (TRON)
- Affichage du montant exact et des instructions
- QR code généré pour chaque adresse

**Out of scope** :
- Gestion des multi-signatures
- Support de réseaux exotiques`,
    dependencies: `- **APIs** : Discord Bot API
- **Rôles** : User, Admin
- **Schémas** : CryptoAddress, Subscription
- **Flags** : feature_crypto_payments`,
    design: `**Schémas** :
\`\`\`prisma
model CryptoAddress {
  id            String   @id @default(cuid())
  subscriptionId String
  subscription  Subscription @relation(fields: [subscriptionId], references: [id])
  network       CryptoNetwork
  address       String   @unique
  derivationPath String?
  isActive      Boolean  @default(true)
}
\`\`\`

**DTOs** : CryptoAddressDTO, PaymentRequestDTO
**Permission model** : Role-based access control`,
    telemetry: `**Logs clés** :
- Address generated for user
- Payment request created
- QR code generated

**Métriques Prometheus** :
- crypto_addresses_generated_total
- payment_requests_created_total
- address_generation_duration_seconds`,
    security: `**ACL** : User can only access their own addresses
**Rate-limit** : 1 address generation per minute per user
**Idempotence** : Same address returned for same user/network`,
    acceptanceCriteria: `**Scenario 1: Génération adresse USDC**
Given un utilisateur exécute /upgrade USDC
When le bot traite la commande
Then une adresse unique Base USDC est générée

**Scenario 2: Réutilisation adresse**
Given un utilisateur demande une deuxième adresse pour le même réseau
When le bot traite la demande
Then la même adresse existante est retournée`,
    tests: `#### Tests Unitaires
- [ ] Address generation logic
- [ ] QR code generation
- [ ] Network validation

#### Tests d'Intégration
- [ ] Discord command integration
- [ ] Database storage
- [ ] Address uniqueness

#### Tests E2E
- [ ] Full /upgrade flow
- [ ] QR code display
- [ ] Multiple networks`,
    testData: `**Adresses** : 0x742d..., TR7NH...
**Montants** : 39, 59, 99, 149 USDC/USDT
**IDs** : user_test_001, sub_test_001
**Canaux Discord** : DM, #upgrade`,
    dod: `- [ ] Commande /upgrade fonctionnelle
- [ ] Génération d'adresses unique par réseau
- [ ] QR code générés correctement
- [ ] Instructions de paiement claires
- [ ] Tests multi-réseaux passants
- [ ] Documentation API générée`,
    estimation: 'Moyenne - 2 jours/homme',
    risks: 'Risque moyen - gestion des clés et adresses',
    labels: ['user-story', 'phase-2', 'crypto-payments'],
  },
  {
    number: '05',
    title: 'Watcher On-Chain',
    userStory: `En tant que système de paiement
Je veux surveiller les transactions blockchain en temps réel
Afin de valider automatiquement les paiements d'abonnements`,
    scope: `**In scope** :
- Watcher WebSocket pour Base (USDC)
- Watcher WebSocket/gRPC pour TRON (USDT)
- Détection des transactions vers les adresses monitorées
- Validation des montants avec tolérance (±5%)
- Système de confirmations par réseau

**Out of scope** :
- Support d'autres réseaux (Polygon, Ethereum mainnet)
- Analyse avancée des transactions`,
    dependencies: `- **APIs** : Base RPC, TRON gRPC
- **Rôles** : System
- **Schémas** : Payment, Transaction
- **Flags** : feature_watchers_enabled`,
    design: `**Schémas** :
\`\`\`prisma
model Payment {
  id          String        @id @default(cuid())
  userId      String
  addressId   String?
  network     CryptoNetwork
  amount      Decimal       @db.Decimal(18, 8)
  currency    String
  txHash      String        @unique
  confirmations Int         @default(0)
  status      PaymentStatus
}
\`\`\`

**DTOs** : TransactionDTO, PaymentConfirmationDTO
**Permission model** : System-only access`,
    telemetry: `**Logs clés** :
- Transaction detected
- Payment confirmed
- Payment validation failed

**Métriques Prometheus** :
- blockchain_transactions_detected_total
- payment_confirmations_total
- watcher_latency_seconds`,
    security: `**ACL** : System service only
**Rate-limit** : Blockchain API rate limits
**Idempotence** : Transaction processing idempotency`,
    acceptanceCriteria: `**Scenario 1: Détection transaction Base**
Given un paiement USDC est envoyé à une adresse monitorée
When la transaction est détectée
Then un enregistrement Payment est créé avec statut PENDING

**Scenario 2: Confirmation transaction**
Given une transaction atteint le nombre de confirmations requis
When le watcher traite la confirmation
Then le statut Payment est mis à jour CONFIRMED`,
    tests: `#### Tests Unitaires
- [ ] Transaction parsing
- [ ] Amount validation
- [ ] Confirmation counting

#### Tests d'Intégration
- [ ] WebSocket connection
- [ ] Database updates
- [ ] Error handling

#### Tests E2E
- [ ] Full payment flow testnet
- [ ] Multiple confirmations
- [ ] Amount validation`,
    testData: `**Adresses** : 0x742d... (testnet)
**Montants** : 39.0, 59.0 USDC
**IDs** : tx_test_001, payment_test_001
**Canaux Discord** : N/A`,
    dod: `- [ ] Watcher Base fonctionnel
- [ ] Watcher TRON fonctionnel
- [ ] Système de confirmations opérationnel
- [ ] Validation des montants avec tolérance
- [ ] Gestion des erreurs réseau
- [ ] Performance monitoring en place`,
    estimation: 'Complexe - 4 jours/homme',
    risks: 'Risque élevé - dépendances blockchain externes',
    labels: ['user-story', 'phase-2', 'blockchain'],
  },
  {
    number: '06',
    title: 'Gestion des Abonnements',
    userStory: `En tant que système d'abonnement
Je veux créditer automatiquement l'accès aux utilisateurs payants
Afin de leur donner accès aux fonctionnalités premium`,
    scope: `**In scope** :
- Calcul automatique de la durée d'accès (30 jours par paiement standard)
- Gestion des prorata pour sous-paiements
- Crédits pour surpaiements
- Assignation automatique des rôles Discord
- Notifications de confirmation et expiration

**Out of scope** :
- Gestion des remboursements
- Plans d'abonnement complexes (familiaux, etc.)`,
    dependencies: `- **APIs** : Discord Bot API
- **Rôles** : User, Admin, System
- **Schémas** : Subscription, Payment, User
- **Flags** : feature_subscription_management`,
    design: `**Schémas** :
\`\`\`prisma
model Subscription {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  plan      UserPlan
  status    SubscriptionStatus
  startedAt DateTime    @default(now())
  expiresAt DateTime
  network   CryptoNetwork
}
\`\`\`

**DTOs** : SubscriptionDTO, AccessGrantDTO
**Permission model** : Role-based access control`,
    telemetry: `**Logs clés** :
- Subscription activated
- Subscription extended
- Role assigned
- Subscription expired

**Métriques Prometheus** :
- subscriptions_activated_total
- subscriptions_extended_total
- role_assignments_total
- subscription_expiry_events_total`,
    security: `**ACL** : Admin can manage all subscriptions
**Rate-limit** : Discord API rate limits
**Idempotence** : Role assignment idempotency`,
    acceptanceCriteria: `**Scenario 1: Activation abonnement**
Given un paiement est confirmé
When le système traite le paiement
Then l'abonnement est activé pour 30 jours

**Scenario 2: Extension abonnement**
Given un utilisateur avec abonnement actif paie à nouveau
When le paiement est traité
Then la date d'expiration est prolongée`,
    tests: `#### Tests Unitaires
- [ ] Access duration calculation
- [ ] Prorata calculation
- [ ] Credit management

#### Tests d'Intégration
- [ ] Discord role assignment
- [ ] Database updates
- [ ] Notification sending

#### Tests E2E
- [ ] Full subscription flow
- [ ] Role verification
- [ ] Expiration handling`,
    testData: `**Adresses** : N/A
**Montants** : 39, 59, 99, 149
**IDs** : sub_test_001, user_test_001
**Canaux Discord** : #general, DM`,
    dod: `- [ ] Calcul durée d'accès fonctionnel
- [ ] Gestion prorata opérationnelle
- [ ] Assignation rôles automatique
- [ ] Système de notifications en place
- [ ] Gestion des crédits pour surpaiements
- [ ] Tests de cycle de vie abonnement`,
    estimation: 'Moyenne - 3 jours/homme',
    risks: 'Risque moyen - gestion des états et synchronisation',
    labels: ['user-story', 'phase-2', 'subscription'],
  },
  {
    number: '07',
    title: 'Notifications de Paiement',
    userStory: `En tant qu'utilisateur
Je veux être notifié lorsque mon paiement est reçu
Afin de confirmer que mon abonnement est actif`,
    scope: `**In scope** :
- DM Discord de confirmation immédiate
- Email de confirmation (optionnel)
- Affichage de la date d'expiration
- Instructions pour les renouvellements
- Notifications de rappel avant expiration

**Out of scope** :
- Notifications SMS
- Notifications mobile push`,
    dependencies: `- **APIs** : Discord Bot API, Email API
- **Rôles** : User, System
- **Schémas** : Notification, User
- **Flags** : feature_notifications_enabled`,
    design: `**Schémas** :
\`\`\`prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  channel   NotificationChannel
  status    NotificationStatus
  content   String
  sentAt    DateTime?
  readAt    DateTime?
}
\`\`\`

**DTOs** : NotificationDTO, PaymentConfirmationDTO
**Permission model** : User can manage their notifications`,
    telemetry: `**Logs clés** :
- Payment confirmation sent
- Expiration reminder sent
- Notification delivery failed

**Métriques Prometheus** :
- notifications_sent_total
- notifications_failed_total
- notification_delivery_latency_seconds`,
    security: `**ACL** : Users can only access their notifications
**Rate-limit** : 10 notifications per hour per user
**Idempotence** : Notification deduplication`,
    acceptanceCriteria: `**Scenario 1: Confirmation paiement**
Given un paiement est confirmé
When le système traite la confirmation
Then une notification DM est envoyée à l'utilisateur

**Scenario 2: Rappel expiration**
Given un abonnement expire dans 3 jours
When le job de rappel s'exécute
Then une notification de rappel est envoyée`,
    tests: `#### Tests Unitaires
- [ ] Notification formatting
- [ ] Channel selection
- [ ] Template rendering

#### Tests d'Intégration
- [ ] Discord DM delivery
- [ ] Email delivery
- [ ] Database updates

#### Tests E2E
- [ ] Full notification flow
- [ ] Multiple channels
- [ ] Error scenarios`,
    testData: `**Adresses** : N/A
**Montants** : N/A
**IDs** : user_test_001, notif_test_001
**Canaux Discord** : DM`,
    dod: `- [ ] Notifications DM fonctionnelles
- [ ] Notifications email fonctionnelles
- [ ] Système de rappels expiration en place
- [ ] Templates de notification validés
- [ ] Gestion des erreurs de livraison
- [ ] Performance monitoring des notifications`,
    estimation: 'Simple - 2 jours/homme',
    risks: 'Risque faible - principalement de l'intégration',
    labels: ['user-story', 'phase-2', 'notifications'],
  },
  {
    number: '08',
    title: 'Ingestion Données Marché',
    userStory: `En tant que système d'analyse
Je veux recevoir les données marché en temps réel
Afin de détecter les opportunités de trading`,
    scope: `**In scope** :
- Connexion WebSocket aux exchanges (Binance, Bybit, OKX, Bitget)
- Abonnement aux streams: trades, order book, funding, OI
- Système de reconnexion automatique
- Gestion des limites de rate
- Stockage temporaire des données pour analyse

**Out of scope** :
- Support d'exchanges supplémentaires
- Analyse avancée des données`,
    dependencies: `- **APIs** : Binance API, Bybit API, OKX API, Bitget API
- **Rôles** : System
- **Schémas** : MarketData, ExchangeConnection
- **Flags** : feature_market_data_enabled`,
    design: `**Schémas** :
\`\`\`prisma
model MarketData {
  id          String      @id @default(cuid())
  exchange    String
  symbol      String
  dataType    MarketDataType
  data        Json
  timestamp   DateTime    @default(now())
  receivedAt  DateTime    @default(now())
}
\`\`\`

**DTOs** : TradeDTO, OrderBookDTO, FundingRateDTO
**Permission model** : System-only access`,
    telemetry: `**Logs clés** :
- WebSocket connection established
- Market data received
- Connection lost/reconnected
- Rate limit hit

**Métriques Prometheus** :
- market_data_messages_received_total
- websocket_connections_total
- market_data_ingestion_latency_seconds
- rate_limit_events_total`,
    security: `**ACL** : System service only
**Rate-limit** : Exchange API rate limits
**Idempotence** : Data deduplication`,
    acceptanceCriteria: `**Scenario 1: Connexion Binance**
Given le système démarre
When il se connecte à Binance WebSocket
Then la connexion est établie et les données sont reçues

**Scenario 2: Reconnexion automatique**
Given une connexion WebSocket est perdue
When le système détecte la déconnexion
Then il tente de se reconnecter automatiquement`,
    tests: `#### Tests Unitaires
- [ ] WebSocket connection logic
- [ ] Data parsing
- [ ] Rate limit handling

#### Tests d'Intégration
- [ ] Exchange API integration
- [ ] Data storage
- [ ] Reconnection logic

#### Tests E2E
- [ ] Full data ingestion flow
- [ ] Multiple exchanges
- [ ] Error scenarios`,
    testData: `**Adresses** : N/A
**Montants** : N/A
**IDs** : conn_test_001, data_test_001
**Canaux Discord** : N/A`,
    dod: `- [ ] Connexions WebSocket aux 4 exchanges
- [ ] Système de reconnexion automatique
- [ ] Gestion des rate limits fonctionnelle
- [ ] Stockage temporaire des données
- [ ] Monitoring des connexions en place
- [ ] Performance benchmarks atteints`,
    estimation: 'Complexe - 5 jours/homme',
    risks: 'Risque élevé - multiples dépendances externes',
    labels: ['user-story', 'phase-3', 'market-data'],
  },
  {
    number: '09',
    title: 'Détection de Signaux',
    userStory: `En tant qu'analyste de trading
Je veux détecter automatiquement les setups de trading
Afin de générer des signaux pertinents`,
    scope: `**In scope** :
- Détecteur de funding flips
- Détecteur de OI spikes anormaux
- Détecteur de sweep de niveaux HTF
- Détecteur de cassures de structure
- Filtres de qualité (liquidité, spread, volume)

**Out of scope** :
- Détection de patterns avancés (harmoniques, etc.)
- Machine learning pour la prédiction`,
    dependencies: `- **APIs** : Market data API
- **Rôles** : System, Analyst
- **Schémas** : Signal, DetectionRule
- **Flags** : feature_signal_detection`,
    design: `**Schémas** :
\`\`\`prisma
model Signal {
  id          String      @id @default(cuid())
  symbol      String
  instrumentType InstrumentType
  bias        SignalBias
  confidence  Float
  detection   Json        // Détails de la détection
  createdAt   DateTime    @default(now())
  expiresAt   DateTime
  status      SignalStatus
}
\`\`\`

**DTOs** : SignalDTO, DetectionResultDTO
**Permission model** : System-generated, Analyst-reviewed`,
    telemetry: `**Logs clés** :
- Signal detected
- Signal validated
- Signal filtered out
- Confidence score calculated

**Métriques Prometheus** :
- signals_detected_total
- signals_validated_total
- signal_confidence_score
- detection_latency_seconds`,
    security: `**ACL** : System service only
**Rate-limit** : Internal rate limiting
**Idempotence** : Signal deduplication`,
    acceptanceCriteria: `**Scenario 1: Détection funding flip**
Given un financement rate passe de négatif à positif
When le détecteur analyse les données
Then un signal de funding flip est généré

**Scenario 2: Filtre qualité**
Given un signal est détecté avec liquidité insuffisante
When le filtre qualité s'exécute
Then le signal est rejeté`,
    tests: `#### Tests Unitaires
- [ ] Detection algorithms
- [ ] Quality filters
- [ ] Confidence scoring

#### Tests d'Intégration
- [ ] Market data integration
- [ ] Signal generation
- [ ] Quality filtering

#### Tests E2E
- [ ] Full detection pipeline
- [ ] Multiple signal types
- [ ] Quality scenarios`,
    testData: `**Adresses** : N/A
**Montants** : N/A
**IDs** : signal_test_001, detect_test_001
**Canaux Discord** : N/A`,
    dod: `- [ ] 4 détecteurs principaux opérationnels
- [ ] Système de filtres qualité fonctionnel
- [ ] Scoring de confiance implémenté
- [ ] Gestion du TTL des signaux
- [ ] Logs de détection complets
- [ ] Performance benchmarks atteints`,
    estimation: 'Complexe - 6 jours/homme',
    risks: 'Risque élevé - complexité algorithmique',
    labels: ['user-story', 'phase-3', 'signal-detection'],
  },
  {
    number: '10',
    title: 'Génération de Cartes de Trading',
    userStory: `En tant que système de signal
Je veux générer des cartes de trading structurées
Afin de présenter les informations clairement aux utilisateurs`,
    scope: `**In scope** :
- Format de carte structuré avec tous les champs requis
- Calcul automatique de la taille de position (risk-based)
- Suggestions de levier selon la liquidité
- TTL (Time-To-Live) pour chaque signal
- Génération d'ID unique et hash pour traçabilité

**Out of scope** :
- Cartes personnalisées par utilisateur
- Analyses techniques avancées sur les cartes`,
    dependencies: `- **APIs** : Signal API, Risk API
- **Rôles** : System, RiskEngine
- **Schémas** : TradingCard, RiskCalculation
- **Flags** : feature_trading_cards`,
    design: `**Schémas** :
\`\`\`prisma
model TradingCard {
  id          String      @id @default(cuid())
  signalId    String
  signal      Signal      @relation(fields: [signalId], references: [id])
  symbol      String
  instrumentType InstrumentType
  bias        SignalBias
  entryZone   Json        // Zone d'entrée [min, max]
  invalidation Float
  takeProfits Json        // Array de TP
  risk        Json        // Calculs de risque
  confidence  Float
  ttlSec      Int
  createdAt   DateTime    @default(now())
  hash        String      @unique
}
\`\`\`

**DTOs** : TradingCardDTO, RiskCalculationDTO
**Permission model** : System-generated, user-accessible`,
    telemetry: `**Logs clés** :
- Trading card generated
- Risk calculation performed
- Hash generated
- Card expired

**Métriques Prometheus** :
- trading_cards_generated_total
- risk_calculations_total
- card_generation_latency_seconds
- card_expiry_events_total`,
    security: `**ACL** : Users can access their cards
**Rate-limit** : Card generation rate limiting
**Idempotence** : Same inputs = same hash`,
    acceptanceCriteria: `**Scenario 1: Génération carte**
Given un signal valide est détecté
When le système génère la carte
Then une carte structurée est créée avec tous les champs

**Scenario 2: Calcul taille position**
Given une carte est générée
When le calcul de risque s'exécute
Then la taille de position est calculée selon le % de risque`,
    tests: `#### Tests Unitaires
- [ ] Card formatting
- [ ] Risk calculations
- [ ] Hash generation
- [ ] TTL management

#### Tests d'Intégration
- [ ] Signal integration
- [ ] Risk engine integration
- [ ] Data validation

#### Tests E2E
- [ ] Full card generation flow
- [ ] Multiple scenarios
- [ ] Hash consistency`,
    testData: `**Adresses** : N/A
**Montants** : N/A
**IDs** : card_test_001, signal_test_001
**Canaux Discord** : N/A`,
    dod: `- [ ] Format de carte structuré validé
- [ ] Calculs de risque fonctionnels
- [ ] Génération de hash consistante
- [ ] Système de TTL opérationnel
- [ ] Validation des cartes générées
- [ ] Documentation du format complète`,
    estimation: 'Moyenne - 3 jours/homme',
    risks: 'Risque moyen - calculs financiers complexes',
    labels: ['user-story', 'phase-3', 'trading-cards'],
  },
];

async function createIssue(story) {
  try {
    const issue = await octokit.issues.create({
      owner: CONFIG.owner,
      repo: CONFIG.repo,
      title: `[US-${story.number}] ${story.title}`,
      body: formatIssueBody(story),
      labels: story.labels || CONFIG.labels,
      assignees: CONFIG.assignees,
    });

    console.log(`✅ Issue créée: #${issue.data.number} - ${story.title}`);
    return issue.data;
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'issue ${story.title}:`, error.message);
    throw error;
  }
}

function formatIssueBody(story) {
  return `## User Story

${story.userStory}

### Portée
${story.scope}

### Dépendances
${story.dependencies}

### Design Notes
${story.design}

### Telemetry
${story.telemetry}

### Sécurité
${story.security}

### Critères d'Acceptation (BDD)
${story.acceptanceCriteria}

### Tests
${story.tests}

### Données de Test
${story.testData}

### DoD Spécifique
${story.dod}

### Estimation
${story.estimation}

### Risques
${story.risks}

---

### Definition of Ready (DoR) Checklist
- [ ] Problème clair : Valeur utilisateur explicite en 1 phrase
- [ ] Portée définie : In scope/Out scope explicite
- [ ] Dépendances identifiées : APIs, clés, rôles, schémas
- [ ] Métriques définies : Logs et métriques à exposer
- [ ] Critères BDD listés et testables
- [ ] Estimation ≤ 3-5 jours homme

### Definition of Done (DoD) Global
- [ ] Code, tests unitaires (≥80%), tests d'intégration verts
- [ ] Logs structurés + métriques Prometheus exposées
- [ ] Alertes créées si applicable
- [ ] Documentation : README + runbook + notes de sécurité
- [ ] Demo steps reproductibles (5 étapes max)
- [ ] Feature flag/rollout si risque prod
- [ ] 0 P0/P1 lints, 0 secrets en clair, SAST vert

---

*Cette issue a été générée automatiquement à partir du template MyCryptoPilot*`;
}

async function main() {
  console.log('🚀 Démarrage de la création des issues GitHub pour MyCryptoPilot...\n');

  // Vérifier que GITHUB_TOKEN est défini
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ Erreur: GITHUB_TOKEN non défini dans les variables d\'environnement');
    console.log('📝 Instructions:');
    console.log('1. Créer un personal access token sur GitHub');
    console.log('2. Exporter la variable: export GITHUB_TOKEN=votre_token');
    process.exit(1);
  }

  // Vérifier que @octokit/rest est installé
  try {
    require.resolve('@octokit/rest');
  } catch (e) {
    console.error('❌ Erreur: @octokit/rest n\'est pas installé');
    console.log('📝 Installation: npm install --save-dev @octokit/rest');
    process.exit(1);
  }

  // Demander confirmation
  console.log(`📋 Configuration:`);
  console.log(`   Repository: ${CONFIG.owner}/${CONFIG.repo}`);
  console.log(`   Nombre d'issues à créer: ${USER_STORIES.length}`);
  console.log(`   Assignees: ${CONFIG.assignees.join(', ') || 'Non spécifiés'}`);
  console.log('');

  // Créer les issues
  const createdIssues = [];
  for (const story of USER_STORIES) {
    try {
      const issue = await createIssue(story);
      createdIssues.push(issue);

      // Petit délai pour éviter de dépasser les rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`L'issue ${story.title} n'a pas pu être créée, continuation...`);
    }
  }

  // Résumé
  console.log('\n📊 Résumé:');
  console.log(`✅ Issues créées: ${createdIssues.length}/${USER_STORIES.length}`);
  console.log(`❌ Échecs: ${USER_STORIES.length - createdIssues.length}`);

  if (createdIssues.length > 0) {
    console.log('\n🔗 Liens vers les issues créées:');
    createdIssues.forEach(issue => {
      console.log(`   #${issue.number}: ${issue.html_url}`);
    });
  }

  console.log('\n🎉 Création des issues terminée !');
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

// Lancer le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createIssue, formatIssueBody, USER_STORIES };