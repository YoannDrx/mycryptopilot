# MyCryptoPilot

![MyCryptoPilot](https://img.shields.io/badge/MyCryptoPilot-Crypto%20Trading%20Copilot-blue?style=for-the-badge&logo=bitcoin&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![Discord](https://img.shields.io/badge/Discord-Bot-purple?style=for-the-badge&logo=discord&logoColor=white)

**MyCryptoPilot** est un copilote de trading crypto intelligent qui analyse le marché en temps réel et fournit des signaux de trading clairs avec une approche risk-first. Notre mission est d'aider les traders à prendre des décisions éclairées grâce à des analyses techniques poussées et une gestion du risque rigoureuse.

## 🎯 Vision

MyCryptoPilot n'est pas un simple bot de signaux. C'est un assistant de trading personnel qui :
- **Analyse en temps réel** les microstructures de marché et les données dérivées
- **Génère des cartes de trading explicables** avec zones d'entrée, stops, et take profits
- **Calcule automatiquement** la taille de position et le levier optimal selon votre profil de risque
- **Documente chaque signal** pour permettre le suivi et l'amélioration continue

## 🚀 Fonctionnalités Principales

### Signaux de Trading en Temps Réel
- **Detection intelligente** : Funding flips, OI spikes, sweep de niveaux HTF, cassures de structure
- **Qualité garantie** : Filtres de liquidité, spread, et concordance de signaux
- **Multi-exchanges** : Intégration avec Binance, Bybit, OKX, Bitget
- **Spot & Perps** : Gestion des signaux pour trading spot et trading avec levier

### Approche Risk-First
- **Taille de position automatique** : Calculée selon le % de risque par trade
- **Leviers recommandés** : Suggestions basées sur la liquidité et le risque
- **Stop-loss intelligents** : Basés sur la structure de marché, pas seulement sur l'ATR
- **Portfolio management** : Caps d'exposition par actif et kill-switch global

### Système de Diffusion via Discord
- **Canal public gratuit** : Teasers floutés avec délai pour acquisition
- **Accès premium en DM** : Cartes complètes pour les abonnés payants
- **Rôles automatisés** : Gestion des accès selon les abonnements
- **Anti-leak** : Watermarking et traçabilité des cartes

### Monétisation 100% Crypto
- **Paiements directs** : USDC sur Base, USDT sur TRON, et autres réseaux
- **Adresses dédiées** : Une adresse unique par utilisateur pour la traçabilité
- **Gestion automatique** : Détection on-chain et crédits d'abonnement
- **Renouvellements simples** : Même adresse pour faciliter les paiements récurrents

### Multi-Traders Certifiés
- **Traders vérifiés** : Processus de certification avec preuve de track-record
- **Dashboard créateur** : Interface pour créer et publier des signaux
- **Revenue sharing** : Monétisation pour les traders contributeurs
- **Transparence** : Stats publiques (winrate, payoff, max DD)

## 🏗️ Architecture Technique

### Stack Principale
- **Frontend** : Next.js 15 + TypeScript + TailwindCSS + Shadcn/UI
- **Backend** : API routes Next.js + services séparés pour l'ingestion
- **Base de données** : PostgreSQL avec Prisma ORM
- **Bot** : Discord.js avec TypeScript
- **Crypto** : Web3.js/Ethers.js pour les watcheurs on-chain

### Infrastructure
- **Ingestion données** : WebSocket natifs pour basse latence
- **Traitement signaux** : Services Python FastAPI pour l'analyse
- **Stockage** : ClickHouse pour les données temps réel + PostgreSQL pour l'app
- **Messaging** : NATS/Redpanda pour la communication entre services

### Sécurité
- **Validation on-chain** : Vérification des transactions blockchain
- **Clés sécurisées** : Jamais de private keys côté frontend
- **Rate limiting** : Protection contre le spam et les abus
- **Audit trail** : Traçabilité complète de toutes les actions

## 📊 Modèle Économique

### Plans d'Abonnement
- **Free** : Teasers floutés, délai 5-10min, screeners limités
- **Pro** (39-59€/mois) : Signaux temps réel, screeners 30-60s
- **Ultra** (99-149€/mois) : Priorité, screeners 1-5s, alertes personnalisées
- **Trader Pro** (19-39€/mois) : Accès aux signaux d'un trader certifié

### Monétisation Crypto
- **Paiements directs** : Crypto adressables (USDC, USDT, etc.)
- **Gestion automatique** : Watcheurs on-chain pour valider les paiements
- **Commissions** : Revenue sharing avec les traders certifiés
- **B2B futur** : API et white-label pour institutions

## 🛠️ Installation

### Prérequis
- Node.js 18+
- pnpm
- PostgreSQL
- Compte Discord développeur
- Accès API exchanges (Binance, Bybit, etc.)

### Setup du projet
```bash
# Cloner le repository
git clone https://github.com/votre-org/mycryptopilot.git
cd mycryptopilot

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env-template .env
# Éditer .env avec vos configurations

# Générer le schéma Prisma
pnpm prisma generate

# Lancer le développement
pnpm dev
```

### Configuration Discord
1. Créer un bot sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Ajouter le bot à votre serveur avec les permissions nécessaires
3. Configurer le `DISCORD_BOT_TOKEN` dans `.env`

### Configuration Exchanges
1. Créer des clés API sur chaque exchange (mode lecture seule)
2. Configurer les clés dans `.env`
3. Activer les permissions pour les WebSocket streams

## 📚 Documentation

- [User Stories Détaillées](USER_STORIES.md)
- [Documentation API](docs/api.md)
- [Guide Développeur](docs/developer-guide.md)
- [Déploiement Production](docs/deployment.md)

## 🤝 Contribuer

Nous welcome les contributions ! Veuillez suivre ces étapes :

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous license MIT - voir le fichier [LICENSE](LICENSE) pour les détails.

## 🙏 Remerciements

- Aux contributeurs open source qui rendent ce projet possible
- Aux équipes des exchanges pour leurs APIs robustes
- À la communauté crypto pour son innovation constante

## ⚠️ Disclaimer Important

**MyCryptoPilot n'est pas un service de conseil en investissement.** Les signaux et analyses fournis sont à titre éducatif et informatif seulement. Le trading de crypto-monnaies comporte des risques significatifs, y compris la perte potentielle de votre capital investi. Faites vos propres recherches (DYOR) et consultez un conseiller financier qualifié avant de prendre des décisions d'investissement.

---

**Contact** : [Discord Server](https://discord.gg/mycryptopilot) | [Twitter](https://twitter.com/mycryptopilot) | [Website](https://mycryptopilot.app)

**Made with ❤️ for the crypto community**