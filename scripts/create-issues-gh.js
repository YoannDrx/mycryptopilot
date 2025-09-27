#!/usr/bin/env node

/**
 * Script de création automatique des issues GitHub pour MyCryptoPilot en utilisant GitHub CLI
 *
 * Usage: pnpm create-issues:gh
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  owner: 'yoannandrieux',
  repo: 'mycryptopilot',
  labels: ['user-story', 'needs-triage'],
  assignees: [],
};

// User Stories complètes
const USER_STORIES = [
  {
    number: '01',
    title: 'Mise à jour du Branding',
    userStory: `En tant que propriétaire du projet
Je veux que l'application soit complètement rebrandée en MyCryptoPilot
Afin de créer une identité cohérente pour le produit de trading crypto`,
    body: `### Portée
**In scope** :
- Le nom du projet dans package.json est "mycryptopilot"
- Le site-config.ts contient la configuration MyCryptoPilot
- Le README.md reflète le nouveau positionnement
- Les couleurs du branding sont mises à jour (ambre, émeraude, rouge)
- Le domaine pointe vers mycryptopilot.app

**Out of scope** :
- Création du logo (à faire séparément)
- Marketing avancé

### Dépendances
- **APIs** : Aucune
- **Rôles** : Admin
- **Schémas** : Configuration files
- **Flags** : Aucun

### Critères d'Acceptation (BDD)
**Scenario 1: Configuration package.json**
Given le fichier package.json existe
When je mets à jour le nom du projet
Then le nom est "mycryptopilot"

**Scenario 2: Domain redirect**
Given un utilisateur visite http://ancien-domaine.com
When il accède au site
Then il est redirigé vers mycryptopilot.app

### DoD Spécifique
- [ ] Package.json mis à jour
- [ ] Site-config.ts configuré
- [ ] README.md mis à jour
- [ ] Couleurs branding mises à jour
- [ ] Tests verts
- [ ] Documentation mise à jour

### Estimation
Simple - 1 jour/homme`,
    labels: ['user-story', 'phase-1', 'branding'],
  },
  {
    number: '02',
    title: 'Structure de Données Initiale',
    userStory: `En tant que développeur
Je veux un schéma de base de données solide pour MyCryptoPilot
Afin de supporter toutes les fonctionnalités prévues`,
    body: `### Portée
**In scope** :
- Schéma Prisma avec modèles User, Subscription, Payment, Signal, Trader
- Support des rôles (User, Pro, Ultra, Trader, Admin)
- Système d'adresses crypto par utilisateur
- Tables pour le journal de trading et les performances
- Relations clairement définies entre les entités

**Out of scope** :
- Indexes avancés (à faire dans US performance)
- Sharding/Partitionnement

### Dépendances
- **APIs** : Aucune
- **Rôles** : Admin
- **Schémas** : Prisma schema
- **Flags** : Aucun

### Critères d'Acceptation (BDD)
**Scenario 1: Création utilisateur**
Given un nouveau Discord user
When il est enregistré
Then une entrée User est créée avec rôle USER

**Scenario 2: Création abonnement**
Given un utilisateur existant
When il souscrit à un plan
Then une entrée Subscription est créée avec l'adresse crypto

### DoD Spécifique
- [ ] Schéma Prisma validé
- [ ] Toutes les migrations passent
- [ ] Tests de données passent
- [ ] Documentation schéma générée
- [ ] Relations testées
- [ ] Performance queries OK

### Estimation
Complexe - 3 jours/homme`,
    labels: ['user-story', 'phase-1', 'database'],
  },
  {
    number: '03',
    title: 'Discord Bot Foundation',
    userStory: `En tant qu'administrateur Discord
Je veux un bot fonctionnel avec les permissions appropriées
Afin de gérer les rôles et interactions sur le serveur`,
    body: `### Portée
**In scope** :
- Bot Discord créé et invité sur le serveur
- Permissions configurées (gérer les rôles, envoyer des messages, etc.)
- Commandes de base (/help, /status, /upgrade) fonctionnelles
- Système de rôles automatiques implémenté
- Gestion des erreurs et logging

**Out of scope** :
- Commandes avancées de trading
- Système de paiement intégré

### Dépendances
- **APIs** : Discord Bot API
- **Rôles** : Admin
- **Schémas** : User schema
- **Flags** : feature_discord_bot_enabled

### Critères d'Acceptation (BDD)
**Scenario 1: Commande /help**
Given un utilisateur exécute /help
When le bot reçoit la commande
Then il répond avec la liste des commandes disponibles

**Scenario 2: Assignation rôle**
Given un utilisateur paie son abonnement
When le paiement est validé
Then le bot assigne le rôle Pro automatiquement

### DoD Spécifique
- [ ] Bot créé et configuré
- [ ] Commandes de base fonctionnelles
- [ ] Système de rôles opérationnel
- [ ] Logging implémenté
- [ ] Tests de Discord API passants
- [ ] Documentation bot créée

### Estimation
Moyenne - 2 jours/homme`,
    labels: ['user-story', 'phase-1', 'discord'],
  },
  {
    number: '04',
    title: 'Génération d\'Adresses Crypto',
    userStory: `En tant qu'utilisateur souhaitant souscrire
Je veux recevoir une adresse crypto unique pour mon paiement
Afin de pouvoir payer mon abonnement en crypto`,
    body: `### Portée
**In scope** :
- Commande /upgrade fonctionnelle
- Génération d'adresse unique par utilisateur/réseau
- Support de USDC (Base) et USDT (TRON)
- Affichage du montant exact et des instructions
- QR code généré pour chaque adresse

**Out of scope** :
- Gestion des multi-signatures
- Support de réseaux exotiques

### Dépendances
- **APIs** : Discord Bot API
- **Rôles** : User, Admin
- **Schémas** : CryptoAddress, Subscription
- **Flags** : feature_crypto_payments

### Critères d'Acceptation (BDD)
**Scenario 1: Génération adresse USDC**
Given un utilisateur exécute /upgrade USDC
When le bot traite la commande
Then une adresse unique Base USDC est générée

**Scenario 2: Réutilisation adresse**
Given un utilisateur demande une deuxième adresse pour le même réseau
When le bot traite la demande
Then la même adresse existante est retournée

### DoD Spécifique
- [ ] Commande /upgrade fonctionnelle
- [ ] Génération d'adresses unique par réseau
- [ ] QR code générés correctement
- [ ] Instructions de paiement claires
- [ ] Tests multi-réseaux passants
- [ ] Documentation API générée

### Estimation
Moyenne - 2 jours/homme`,
    labels: ['user-story', 'phase-2', 'crypto-payments'],
  },
  {
    number: '05',
    title: 'Watcher On-Chain',
    userStory: `En tant que système de paiement
Je veux surveiller les transactions blockchain en temps réel
Afin de valider automatiquement les paiements d'abonnements`,
    body: `### Portée
**In scope** :
- Watcher WebSocket pour Base (USDC)
- Watcher WebSocket/gRPC pour TRON (USDT)
- Détection des transactions vers les adresses monitorées
- Validation des montants avec tolérance (±5%)
- Système de confirmations par réseau

**Out of scope** :
- Support d'autres réseaux (Polygon, Ethereum mainnet)
- Analyse avancée des transactions

### Dépendances
- **APIs** : Base RPC, TRON gRPC
- **Rôles** : System
- **Schémas** : Payment, Transaction
- **Flags** : feature_watchers_enabled

### Critères d'Acceptation (BDD)
**Scenario 1: Détection transaction Base**
Given un paiement USDC est envoyé à une adresse monitorée
When la transaction est détectée
Then un enregistrement Payment est créé avec statut PENDING

**Scenario 2: Confirmation transaction**
Given une transaction atteint le nombre de confirmations requis
When le watcher traite la confirmation
Then le statut Payment est mis à jour CONFIRMED

### DoD Spécifique
- [ ] Watcher Base fonctionnel
- [ ] Watcher TRON fonctionnel
- [ ] Système de confirmations opérationnel
- [ ] Validation des montants avec tolérance
- [ ] Gestion des erreurs réseau
- [ ] Performance monitoring en place

### Estimation
Complexe - 4 jours/homme`,
    labels: ['user-story', 'phase-2', 'blockchain'],
  },
  {
    number: '06',
    title: 'Gestion des Abonnements',
    userStory: `En tant que système d'abonnement
Je veux créditer automatiquement l'accès aux utilisateurs payants
Afin de leur donner accès aux fonctionnalités premium`,
    body: `### Portée
**In scope** :
- Calcul automatique de la durée d'accès (30 jours par paiement standard)
- Gestion des prorata pour sous-paiements
- Crédits pour surpaiements
- Assignation automatique des rôles Discord
- Notifications de confirmation et expiration

**Out of scope** :
- Gestion des remboursements
- Plans d'abonnement complexes (familiaux, etc.)

### Dépendances
- **APIs** : Discord Bot API
- **Rôles** : User, Admin, System
- **Schémas** : Subscription, Payment, User
- **Flags** : feature_subscription_management

### Critères d'Acceptation (BDD)
**Scenario 1: Activation abonnement**
Given un paiement est confirmé
When le système traite le paiement
Then l'abonnement est activé pour 30 jours

**Scenario 2: Extension abonnement**
Given un utilisateur avec abonnement actif paie à nouveau
When le paiement est traité
Then la date d'expiration est prolongée

### DoD Spécifique
- [ ] Calcul durée d'accès fonctionnel
- [ ] Gestion prorata opérationnelle
- [ ] Assignation rôles automatique
- [ ] Système de notifications en place
- [ ] Gestion des crédits pour surpaiements
- [ ] Tests de cycle de vie abonnement

### Estimation
Moyenne - 3 jours/homme`,
    labels: ['user-story', 'phase-2', 'subscription'],
  },
  {
    number: '07',
    title: 'Notifications de Paiement',
    userStory: `En tant qu'utilisateur
Je veux être notifié lorsque mon paiement est reçu
Afin de confirmer que mon abonnement est actif`,
    body: `### Portée
**In scope** :
- DM Discord de confirmation immédiate
- Email de confirmation (optionnel)
- Affichage de la date d'expiration
- Instructions pour les renouvellements
- Notifications de rappel avant expiration

**Out of scope** :
- Notifications SMS
- Notifications mobile push

### Dépendances
- **APIs** : Discord Bot API, Email API
- **Rôles** : User, System
- **Schémas** : Notification, User
- **Flags** : feature_notifications_enabled

### Critères d'Acceptation (BDD)
**Scenario 1: Confirmation paiement**
Given un paiement est confirmé
When le système traite la confirmation
Then une notification DM est envoyée à l'utilisateur

**Scenario 2: Rappel expiration**
Given un abonnement expire dans 3 jours
When le job de rappel s'exécute
Then une notification de rappel est envoyée

### DoD Spécifique
- [ ] Notifications DM fonctionnelles
- [ ] Notifications email fonctionnelles
- [ ] Système de rappels expiration en place
- [ ] Templates de notification validés
- [ ] Gestion des erreurs de livraison
- [ ] Performance monitoring des notifications

### Estimation
Simple - 2 jours/homme`,
    labels: ['user-story', 'phase-2', 'notifications'],
  },
  {
    number: '08',
    title: 'Ingestion Données Marché',
    userStory: `En tant que système d'analyse
Je veux recevoir les données marché en temps réel
Afin de détecter les opportunités de trading`,
    body: `### Portée
**In scope** :
- Connexion WebSocket aux exchanges (Binance, Bybit, OKX, Bitget)
- Abonnement aux streams: trades, order book, funding, OI
- Système de reconnexion automatique
- Gestion des limites de rate
- Stockage temporaire des données pour analyse

**Out of scope** :
- Support d'exchanges supplémentaires
- Analyse avancée des données

### Dépendances
- **APIs** : Binance API, Bybit API, OKX API, Bitget API
- **Rôles** : System
- **Schémas** : MarketData, ExchangeConnection
- **Flags** : feature_market_data_enabled

### Critères d'Acceptation (BDD)
**Scenario 1: Connexion Binance**
Given le système démarre
When il se connecte à Binance WebSocket
Then la connexion est établie et les données sont reçues

**Scenario 2: Reconnexion automatique**
Given une connexion WebSocket est perdue
When le système détecte la déconnexion
Then il tente de se reconnecter automatiquement

### DoD Spécifique
- [ ] Connexions WebSocket aux 4 exchanges
- [ ] Système de reconnexion automatique
- [ ] Gestion des rate limits fonctionnelle
- [ ] Stockage temporaire des données
- [ ] Monitoring des connexions en place
- [ ] Performance benchmarks atteints

### Estimation
Complexe - 5 jours/homme`,
    labels: ['user-story', 'phase-3', 'market-data'],
  },
  {
    number: '09',
    title: 'Détection de Signaux',
    userStory: `En tant qu'analyste de trading
Je veux détecter automatiquement les setups de trading
Afin de générer des signaux pertinents`,
    body: `### Portée
**In scope** :
- Détecteur de funding flips
- Détecteur de OI spikes anormaux
- Détecteur de sweep de niveaux HTF
- Détecteur de cassures de structure
- Filtres de qualité (liquidité, spread, volume)

**Out of scope** :
- Détection de patterns avancés (harmoniques, etc.)
- Machine learning pour la prédiction

### Dépendances
- **APIs** : Market data API
- **Rôles** : System, Analyst
- **Schémas** : Signal, DetectionRule
- **Flags** : feature_signal_detection

### Critères d'Acceptation (BDD)
**Scenario 1: Détection funding flip**
Given un financement rate passe de négatif à positif
When le détecteur analyse les données
Then un signal de funding flip est généré

**Scenario 2: Filtre qualité**
Given un signal est détecté avec liquidité insuffisante
When le filtre qualité s'exécute
Then le signal est rejeté

### DoD Spécifique
- [ ] 4 détecteurs principaux opérationnels
- [ ] Système de filtres qualité fonctionnel
- [ ] Scoring de confiance implémenté
- [ ] Gestion du TTL des signaux
- [ ] Logs de détection complets
- [ ] Performance benchmarks atteints

### Estimation
Complexe - 6 jours/homme`,
    labels: ['user-story', 'phase-3', 'signal-detection'],
  },
  {
    number: '10',
    title: 'Génération de Cartes de Trading',
    userStory: `En tant que système de signal
Je veux générer des cartes de trading structurées
Afin de présenter les informations clairement aux utilisateurs`,
    body: `### Portée
**In scope** :
- Format de carte structuré avec tous les champs requis
- Calcul automatique de la taille de position (risk-based)
- Suggestions de levier selon la liquidité
- TTL (Time-To-Live) pour chaque signal
- Génération d'ID unique et hash pour traçabilité

**Out of scope** :
- Cartes personnalisées par utilisateur
- Analyses techniques avancées sur les cartes

### Dépendances
- **APIs** : Signal API, Risk API
- **Rôles** : System, RiskEngine
- **Schémas** : TradingCard, RiskCalculation
- **Flags** : feature_trading_cards

### Critères d'Acceptation (BDD)
**Scenario 1: Génération carte**
Given un signal valide est détecté
When le système génère la carte
Then une carte structurée est créée avec tous les champs

**Scenario 2: Calcul taille position**
Given une carte est générée
When le calcul de risque s'exécute
Then la taille de position est calculée selon le % de risque

### DoD Spécifique
- [ ] Format de carte structuré validé
- [ ] Calculs de risque fonctionnels
- [ ] Génération de hash consistante
- [ ] Système de TTL opérationnel
- [ ] Validation des cartes générées
- [ ] Documentation du format complète

### Estimation
Moyenne - 3 jours/homme`,
    labels: ['user-story', 'phase-3', 'trading-cards'],
  },
];

async function createIssue(story) {
  try {
    const title = `[US-${story.number}] ${story.title}`;

    // Construire le body complet
    const fullBody = `## User Story

${story.userStory}

${story.body}

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

    // Préparer les labels (éviter les doublons)
    const allLabels = [...new Set([...story.labels, ...CONFIG.labels])];
    const labelString = allLabels.map(label => `--label "${label}"`).join(' ');

    // Préparer les assignees
    const assigneeString = CONFIG.assignees.length > 0
      ? CONFIG.assignees.map(assignee => `--assignee "${assignee}"`).join(' ')
      : '';

    // Construire la commande gh
    const command = `gh issue create --title "${title}" --body "${fullBody}" ${labelString} ${assigneeString}`;

    // Exécuter la commande
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });

    // Extraire l'URL de l'issue créée
    const urlMatch = result.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues\/\d+/);
    const url = urlMatch ? urlMatch[0] : 'URL non trouvée';

    console.log(`✅ Issue créée: ${title}`);
    console.log(`   🔗 ${url}`);

    return { title, url, success: true };
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'issue ${story.title}:`, error.message);
    return { title: story.title, success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Démarrage de la création des issues GitHub pour MyCryptoPilot...\n');

  // Vérifier que gh est installé
  try {
    execSync('gh --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Erreur: GitHub CLI (gh) n\'est pas installé');
    console.log('📝 Installation: https://cli.github.com/');
    process.exit(1);
  }

  // Vérifier l'authentification
  try {
    execSync('gh auth status', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Erreur: Vous n\'êtes pas authentifié avec GitHub CLI');
    console.log('📝 Authentification: gh auth login');
    process.exit(1);
  }

  // Demander confirmation
  console.log(`📋 Configuration:`);
  console.log(`   Repository: ${CONFIG.owner}/${CONFIG.repo}`);
  console.log(`   Nombre d'issues à créer: ${USER_STORIES.length}`);
  console.log(`   Assignees: ${CONFIG.assignees.join(', ') || 'Non spécifiés'}`);
  console.log('');

  // Créer les issues
  const results = [];
  for (const story of USER_STORIES) {
    try {
      const result = await createIssue(story);
      results.push(result);

      // Petit délai pour éviter de dépasser les rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`L'issue ${story.title} n'a pas pu être créée, continuation...`);
      results.push({ title: story.title, success: false, error: error.message });
    }
  }

  // Résumé
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n📊 Résumé:');
  console.log(`✅ Issues créées: ${successful.length}/${USER_STORIES.length}`);
  console.log(`❌ Échecs: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n🔗 Liens vers les issues créées:');
    successful.forEach(issue => {
      console.log(`   ${issue.url}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Issues échouées:');
    failed.forEach(issue => {
      console.log(`   ${issue.title}: ${issue.error}`);
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

module.exports = { createIssue, USER_STORIES };