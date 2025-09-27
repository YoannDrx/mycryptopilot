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