# MyCryptoPilot - User Stories Détaillées

## Table des Matières

1. [Phase 1: Fondation & Configuration](#phase-1-fondation--configuration)
2. [Phase 2: Système de Paiement Crypto](#phase-2-système-de-paiement-crypto)
3. [Phase 3: Système de Signaux Trading](#phase-3-système-de-signaux-trading)
4. [Phase 4: Dashboard & Interface Trader](#phase-4-dashboard--interface-trader)
5. [Phase 5: Optimisation & Lancement](#phase-5-optimisation--lancement)

---

## Phase 1: Fondation & Configuration

### US-01: Mise à jour du Branding

**En tant que** propriétaire du projet
**Je veux** que l'application soit complètement rebrandée en MyCryptoPilot
**Afin de** créer une identité cohérente pour le produit de trading crypto

**Critères d'acceptation:**
- [ ] Le nom du projet dans package.json est "mycryptopilot"
- [ ] Le site-config.ts contient la configuration MyCryptoPilot
- [ ] Le README.md reflète le nouveau positionnement
- [ ] Les couleurs du branding sont mises à jour (ambre, émeraude, rouge)
- [ ] Le domaine pointe vers mycryptopilot.app

**Tâches techniques:**
- Mise à jour des variables d'environnement
- Création des assets visuels (logo, icônes)
- Configuration des métadonnées Open Graph

---

### US-02: Structure de Données Initiale

**En tant que** développeur
**Je veux** un schéma de base de données solide pour MyCryptoPilot
**Afin de** supporter toutes les fonctionnalités prévues

**Critères d'acceptation:**
- [ ] Schéma Prisma avec modèles User, Subscription, Payment, Signal, Trader
- [ ] Support des rôles (User, Pro, Ultra, Trader, Admin)
- [ ] Système d'adresses crypto par utilisateur
- [ ] Tables pour le journal de trading et les performances
- [ ] Relations clairement définies entre les entités

**Schéma principal:**
```prisma
model User {
  id        String   @id @default(cuid())
  discordId String   @unique
  email     String?
  role      UserRole @default(USER)
  plan      UserPlan @default(FREE)
  expiry    DateTime?

  // Relations
  subscriptions Subscription[]
  payments     Payment[]
  journals     JournalEntry[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Subscription {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  plan      UserPlan
  status    SubscriptionStatus
  startedAt DateTime    @default(now())
  expiresAt DateTime
  network   CryptoNetwork

  cryptoAddresses CryptoAddress[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CryptoAddress {
  id            String   @id @default(cuid())
  subscriptionId String
  subscription  Subscription @relation(fields: [subscriptionId], references: [id])
  network       CryptoNetwork
  address       String   @unique
  derivationPath String?
  isActive      Boolean  @default(true)

  payments Payment[]

  createdAt DateTime @default(now())
}

model Payment {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  addressId   String?
  address     CryptoAddress? @relation(fields: [addressId], references: [id])
  network     CryptoNetwork
  amount      Decimal       @db.Decimal(18, 8)
  currency    String
  txHash      String        @unique
  confirmations Int         @default(0)
  status      PaymentStatus
  plan        UserPlan
  duration    Int           // jours d'accès crédités

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### US-03: Discord Bot Foundation

**En tant que** administrateur Discord
**Je veux** un bot fonctionnel avec les permissions appropriées
**Afin de** gérer les rôles et interactions sur le serveur

**Critères d'acceptation:**
- [ ] Bot Discord créé et invité sur le serveur
- [ ] Permissions configurées (gérer les rôles, envoyer des messages, etc.)
- [ ] Commandes de base (/help, /status, /upgrade) fonctionnelles
- [ ] Système de rôles automatiques implémenté
- [ ] Gestion des erreurs et logging

**Permissions requises:**
- `Manage Roles`
- `Send Messages`
- `Embed Links`
- `Read Message History`
- `Use External Emojis`

---

## Phase 2: Système de Paiement Crypto

### US-04: Génération d'Adresses Crypto

**En tant que** utilisateur souhaitant souscrire
**Je veux** recevoir une adresse crypto unique pour mon paiement
**Afin de** pouvoir payer mon abonnement en crypto

**Critères d'acceptation:**
- [ ] Commande `/upgrade` fonctionnelle
- [ ] Génération d'adresse unique par utilisateur/réseau
- [ ] Support de USDC (Base) et USDT (TRON)
- [ ] Affichage du montant exact et des instructions
- [ ] QR code généré pour chaque adresse

**Flux utilisateur:**
1. User exécute `/upgrade`
2. Bot demande le réseau souhaité
3. Bot génère une adresse dédiée
4. Bot affiche les instructions de paiement avec QR code

---

### US-05: Watcher On-Chain

**En tant que** système de paiement
**Je veux** surveiller les transactions blockchain en temps réel
**Afin de** valider automatiquement les paiements d'abonnements

**Critères d'acceptation:**
- [ ] Watcher WebSocket pour Base (USDC)
- [ ] Watcher WebSocket/gRPC pour TRON (USDT)
- [ ] Détection des transactions vers les adresses monitorées
- [ ] Validation des montants avec tolérance (±5%)
- [ ] Système de confirmations par réseau

**Configuration réseaux:**
```typescript
const NETWORK_CONFIG = {
  base: {
    confirmations: 1,
    provider: 'https://base-mainnet.infura.io/v3/...',
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  },
  tron: {
    confirmations: 2,
    provider: 'https://api.trongrid.io',
    tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT
  }
}
```

---

### US-06: Gestion des Abonnements

**En tant que** système d'abonnement
**Je veux** créditer automatiquement l'accès aux utilisateurs payants
**Afin de** leur donner accès aux fonctionnalités premium

**Critères d'acceptation:**
- [ ] Calcul automatique de la durée d'accès (30 jours par paiement standard)
- [ ] Gestion des prorata pour sous-paiements
- [ ] Crédits pour surpaiements
- [ ] Assignation automatique des rôles Discord
- [ ] Notifications de confirmation et expiration

**Logique de calcul:**
```typescript
function calculateAccessDays(amount: number, plan: UserPlan): number {
  const basePrice = getPlanPrice(plan);
  const baseDays = 30;
  return Math.floor((amount / basePrice) * baseDays);
}
```

---

### US-07: Notifications de Paiement

**En tant que** utilisateur
**Je veux** être notifié lorsque mon paiement est reçu
**Afin de** confirmer que mon abonnement est actif

**Critères d'acceptation:**
- [ ] DM Discord de confirmation immédiate
- [ ] Email de confirmation (optionnel)
- [ ] Affichage de la date d'expiration
- [ ] Instructions pour les renouvellements
- [ ] Notifications de rappel avant expiration

---

## Phase 3: Système de Signaux Trading

### US-08: Ingestion Données Marché

**En tant que** système d'analyse
**Je veux** recevoir les données marché en temps réel
**Afin de** détecter les opportunités de trading

**Critères d'acceptation:**
- [ ] Connexion WebSocket aux exchanges (Binance, Bybit, OKX, Bitget)
- [ ] Abonnement aux streams: trades, order book, funding, OI
- [ ] Système de reconnexion automatique
- [ ] Gestion des limites de rate
- [ ] Stockage temporaire des données pour analyse

**Exchanges prioritaires:**
- Binance (BTC/USDT, ETH/USDT, SOL/USDT)
- Bybit (mêmes paires + perp)
- OKX et Bitget (v2)

---

### US-09: Détection de Signaux

**En tant que** analyste de trading
**Je veux** détecter automatiquement les setups de trading
**Afin de** générer des signaux pertinents

**Critères d'acceptation:**
- [ ] Détecteur de funding flips
- [ ] Détecteur de OI spikes anormaux
- [ ] Détecteur de sweep de niveaux HTF
- [ ] Détecteur de cassures de structure
- [ ] Filtres de qualité (liquidité, spread, volume)

**Algorithmes de détection:**
```typescript
interface SignalDetector {
  name: string;
  detect(marketData: MarketData): SignalScore | null;
  confidence: number;
  ttl: number; // secondes
}

const FUNDING_FLIP_DETECTOR: SignalDetector = {
  name: 'funding_flip',
  detect: detectFundingFlip,
  confidence: 0.8,
  ttl: 600 // 10 minutes
};
```

---

### US-10: Génération de Cartes de Trading

**En tant que** système de signal
**Je veux** générer des cartes de trading structurées
**Afin de** présenter les informations clairement aux utilisateurs

**Critères d'acceptation:**
- [ ] Format de carte structuré avec tous les champs requis
- [ ] Calcul automatique de la taille de position (risk-based)
- [ ] Suggestions de levier selon la liquidité
- [ ] TTL (Time-To-Live) pour chaque signal
- [ ] Génération d'ID unique et hash pour traçabilité

**Format de carte:**
```typescript
interface TradingCard {
  id: string;
  symbol: string;
  instrumentType: 'spot' | 'perp';
  bias: 'bull' | 'bear' | 'neutral';

  // Zones de trading
  entry: {
    zone: [number, number]; // [min, max]
    type: 'limit' | 'market';
  };
  invalidation: number;
  tps: number[];

  // Risk management
  leverageBand?: [number, number]; // pour perps uniquement
  risk: {
    Rpct: number; // % de risque par trade
    maxPortfolioExpPct: number;
  };

  // Métadonnées
  confidence: number; // 0-100
  rationales: string[];
  regime: string;
  managedBy: 'system' | `proTrader:${string}`;
  ttlSec: number;
  createdAt: string;
  version: string;
  hash: string;
}
```

---

### US-11: Diffusion sur Discord

**En tant que** système de distribution
**Je veux** publier les signaux sur Discord
**Afin de** les rendre accessibles aux utilisateurs

**Critères d'acceptation:**
- [ ] Publication des teasers floutés dans le canal public
- [ ] Envoi des cartes complètes en DM aux abonnés
- [ ] Système de boutons interactifs (Voir, Journaliser, Mute)
- [ ] Gestion des rôles pour le filtrage
- [ ] Anti-leak avec watermarking

**Formats de diffusion:**
- **Teaser**: Image floutée + résumé + bouton "Voir"
- **Complet**: Embed structuré + boutons d'action
- **DM**: Version complète avec watermark utilisateur

---

## Phase 4: Dashboard & Interface Trader

### US-12: Dashboard Utilisateur

**En tant que** trader
**Je veux** un dashboard pour suivre mes signaux et performances
**Afin de** gérer mon activité de trading

**Critères d'acceptation:**
- [ ] Affichage des signaux reçus en temps réel
- [ ] Journal de trading avec entrée/sortie
- [ ] Statistiques de performance (winrate, payoff, drawdown)
- [ ] Gestion du profil et préférences
- [ ] Système d'alertes personnalisées

**Sections du dashboard:**
- Signaux actifs
- Historique des trades
- Performance analytics
- Paramètres de risque
- Abonnement et facturation

---

### US-13: Interface Trader Pro

**En tant que** trader certifié
**Je veux** une interface pour créer et gérer mes signaux
**Afin de** partager mon expertise avec la communauté

**Critères d'acceptation:**
- [ ] Création de signaux manuels
- [ ] Templates pour setups courants
- [ ] Planification de signaux à l'avance
- [ ] Stats personnelles et performance
- [ ] Système de revenue sharing

**Fonctionnalités trader:**
- Créateur de signaux avec validation
- Dashboard de performance
- Gestion des abonnés
- Export des statistiques

---

### US-14: Système de Certification Traders

**En tant que** administrateur
**Je veux** un processus pour certifier les traders
**Afin de** garantir la qualité des signaux partagés

**Critères d'acceptation:**
- [ ] Processus de vérification d'identité
- [ ] Validation du track-record (clés API read-only)
- [ ] Système de notation et reviews
- [ ] Contrat de revenue sharing
- [ ] Page profil publique pour chaque trader

**Processus de certification:**
1. Soumission de candidature
2. Vérification KYC de base
3. Validation du track-record
4. Test de connaissances trading
5. Approbation finale

---

### US-15: Risk Management Engine

**En tant que** système risk-first
**Je veux** calculer automatiquement la taille des positions
**Afin de** protéger le capital des utilisateurs

**Critères d'acceptation:**
- [ ] Calcul de position sizing basé sur le % de risque
- [ ] Suggestions de levier selon la liquidité
- [ ] Stop-loss intelligents (structurels)
- [ ] Caps d'exposition par actif/secteur
- [ ] Kill-switch global en cas de drawdown

**Formules de calcul:**
```typescript
// Position sizing pour perps
function calculatePositionSize(
  equity: number,
  riskPercent: number,
  stopDistance: number,
  currentPrice: number
): number {
  const riskAmount = equity * (riskPercent / 100);
  const positionSize = riskAmount / stopDistance;
  return positionSize;
}

// Levier suggéré
function suggestLeverage(
  positionSize: number,
  margin: number,
  liquidityTier: string
): number {
  const maxLeverage = getMaxLeverageByLiquidity(liquidityTier);
  const neededLeverage = positionSize / margin;
  return Math.min(neededLeverage, maxLeverage);
}
```

---

## Phase 5: Optimisation & Lancement

### US-16: Performance & Latence

**En tant que** système temps réel
**Je veux** optimiser la latence de bout en bout
**Afin de** fournir des signaux pertinents rapidement

**Critères d'acceptation:**
- [ ] Latence tick-to-signal < 100ms
- [ ] Latence signal-to-discord < 200ms
- [ ] Système de monitoring de performance
- [ ] Optimisation des requêtes base de données
- [ ] Cache pour les données fréquemment accédées

**SLOs (Service Level Objectives):**
- P95 latence ingestion < 50ms
- P95 latence détection < 100ms
- P95 latence publication < 200ms
- Taux de perte de messages < 0.1%

---

### US-17: Monitoring & Alertes

**En tant que** administrateur système
**Je veux** un système de monitoring complet
**Afin de** détecter et résoudre les problèmes rapidement

**Critères d'acceptation:**
- [ ] Dashboard Grafana pour les métriques clés
- [ ] Alertes pour les anomalies (latence, erreurs, drop rate)
- [ ] Logging structuré centralisé
- [ ] Health checks pour tous les services
- [ ] Système de notification d'incidents

**Métriques à monitorer:**
- Latence par étape du pipeline
- Taux d'erreur par service
- Nombre de signaux générés
- Taux d'engagement utilisateurs
- Performance des exchanges

---

### US-18: Documentation & Déploiement

**En tant que** équipe de développement
**Je veux** une documentation complète
**Afin de** faciliter la maintenance et l'onboarding

**Critères d'acceptation:**
- [ ] Documentation API complète
- [ ] Guide de déploiement production
- [ ] Architecture diagrams
- [ ] Runbooks pour les opérations courantes
- [ ] Documentation utilisateur finale

**Structure documentation:**
- `/docs/api.md` - Documentation API
- `/docs/deployment.md` - Guide déploiement
- `/docs/operations.md` - Runbooks
- `/docs/troubleshooting.md` - Diagnostic

---

### US-19: Tests & QA

**En tant que** équipe QA
**Je veux** une couverture de test complète
**Afin de** garantir la qualité et la fiabilité

**Critères d'acceptation:**
- [ ] Tests unitaires pour tous les services
- [ ] Tests d'intégration pour le flux crypto
- [ ] Tests end-to-end pour le bot Discord
- [ ] Tests de charge et performance
- [ ] Tests de sécurité (pénétration, audits)

**Types de tests:**
```typescript
// Test unitaire
describe('SignalDetector', () => {
  it('should detect funding flips correctly', () => {
    const result = detector.detect(mockMarketData);
    expect(result).toMatchObject(expectedSignal);
  });
});

// Test d'intégration
describe('PaymentWatcher', () => {
  it('should detect ETH payments and update subscriptions', async () => {
    // Test avec blockchain de test
  });
});
```

---

### US-20: Lancement & Go-Live

**En tant que** propriétaire du projet
**Je veux** un lancement réussi et stable
**Afin de** commencer à acquérir des utilisateurs

**Critères d'acceptation:**
- [ ] Checklist de lancement complétée
- [ ] Infrastructure production prête
- [ ] Processus de monitoring en place
- [ ] Support utilisateur configuré
- [ ] Marketing initial prêt

**Checklist lancement:**
- [ ] Domaines et TLS configurés
- [ ] Base de données production initialisée
- [ ] Secrets et clés API configurés
- [ ] Services déployés et health check OK
- [ ] Bot Discord en ligne et testé
- [ ] Page de paiement fonctionnelle
- [ ] Documentation accessible

---

## Définition des Termes

### Rôles Utilisateurs
- **User**: Accès gratuit aux teasers avec délai
- **Pro**: Accès temps réel aux signaux standard
- **Ultra**: Accès prioritaire + features avancées
- **Trader**: Peut créer et partager des signaux
- **Admin**: Accès complet à l'administration

### Plans d'Abonnement
- **Free**: Teasers floutés, délai 5-10min, screeners limités
- **Pro** (39-59€/mois): Signaux temps réel, screeners 30-60s
- **Ultra** (99-149€/mois): Priorité, screeners 1-5s, alertes perso

### Réseaux Crypto Supportés
- **Base**: USDC (faibles frais, rapide)
- **TRON**: USDT (adoption globale)
- **Polygon**: USDC (alternative low-cost)
- **Ethereum**: USDC/USDT (option)

### Exchanges Intégrés
- **Binance**: Liquidité la plus élevée
- **Bybit**: Meilleur pour les perps
- **OKX**: API robuste et complète
- **Bitget**: Croissance rapide et innovation

---

## Notes d'Implémentation

### Priorités de Développement
1. **Phase 1** est critique pour le reste du projet
2. Le système de paiement crypto doit être ultra-fiable
3. La latence de détection de signaux est cruciale
4. L'expérience utilisateur Discord doit être parfaite

### Considérations Techniques
- Utiliser TypeScript pour toute la base de code
- Implémenter le logging structuré dès le début
- Prévoir l'évolutivité avec des services modulaires
- Documenter toutes les décisions d'architecture

### Sécurité
- Jamais stocker de private keys côté frontend
- Valider toutes les transactions on-chain
- Implémenter le rate limiting et anti-spam
- Auditer régulièrement le code et l'infrastructure

### Performance
- Optimiser les requêtes base de données
- Utiliser du caching intelligemment
- Monitorer la latence bout en bout
- Prévoir le scaling horizontal

---

*Ce document est vivant et sera mis à jour tout au long du développement. Chaque user story sera transformée en issue GitHub avec une assignation claire et des estimations de temps.*