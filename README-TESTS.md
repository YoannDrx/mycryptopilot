# Guide des Tests - MyCryptoPilot

Ce guide explique comment lancer les tests en local avec **Postgres.app**.

## 📋 Prérequis

- Node.js 22+ installé
- pnpm installé (`npm install -g pnpm`)
- [Postgres.app](https://postgresapp.com/) installé et démarré

## 🚀 Configuration initiale (une seule fois)

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer PostgreSQL avec Postgres.app

1. **Ouvrez Postgres.app**
2. **Vérifiez que le serveur est démarré** (icône éléphant bleu dans la barre de menu)
3. **Configuration par défaut** :
   - Port : `5432`
   - Username : `yoannandrieux` (votre nom d'utilisateur macOS)
   - Password : (aucun)
   - Base de données par défaut : `postgres`

### 3. Vérifier que PostgreSQL est accessible

```bash
# Vérifier que PostgreSQL répond
pg_isready -h localhost -p 5432

# Devrait afficher :
# localhost:5432 - accepting connections
```

Si vous avez une erreur :
- Vérifiez que Postgres.app est bien démarré
- Vérifiez que le port est bien 5432

### 4. Créer la base de données de test

```bash
# Créer la base de données mycryptopilot_test
createdb -h localhost -U yoannandrieux mycryptopilot_test

# Appliquer les migrations Prisma
DATABASE_URL="postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test" npx prisma migrate deploy
```

## ✅ Lancer les tests

### Tests unitaires (Vitest)

```bash
# Mode watch (re-run automatiquement)
pnpm test

# Mode CI (run une seule fois)
pnpm test:ci
```

### Tests E2E (Playwright)

Les tests E2E se connectent automatiquement à la DB de test grâce à la configuration dans `playwright.config.mts`.

#### Mode interactif (avec UI)

```bash
pnpm test:e2e
```

Cela ouvre l'interface Playwright où vous pouvez :
- Voir les tests en temps réel
- Débugger visuellement
- Relancer des tests spécifiques

#### Mode headless (ligne de commande)

```bash
# Tous les tests
pnpm test:e2e:ci

# Un seul fichier de test
HEADLESS=true npx playwright test signup.spec.ts

# Un test spécifique par nom
HEADLESS=true npx playwright test -g "sign up"

# Tests avec pattern
HEADLESS=true npx playwright test signals-feed
```

#### Voir les résultats

```bash
# Afficher le rapport HTML
npx playwright show-report

# Voir la trace d'un test qui a échoué
npx playwright show-trace test-results/[nom-du-test]/trace.zip
```

### Autres commandes de test

```bash
# Linter (ESLint)
pnpm lint

# Linter en mode CI (sans auto-fix)
pnpm lint:ci

# TypeScript check
pnpm ts

# Tout nettoyer et formater
pnpm clean
```

## 🔧 Commandes utiles

### Base de données

```bash
# Réinitialiser la base de test (supprime et recrée)
dropdb -h localhost -U yoannandrieux mycryptopilot_test
createdb -h localhost -U yoannandrieux mycryptopilot_test
DATABASE_URL="postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test" npx prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique pour la DB)
DATABASE_URL="postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test" npx prisma studio

# Voir les données de la base de test via psql
psql -h localhost -U yoannandrieux -d mycryptopilot_test
```

### Migrations Prisma

```bash
# Appliquer les migrations (mode production)
npx prisma migrate deploy

# Créer une nouvelle migration (mode dev)
npx prisma migrate dev --name description_migration

# Reset complet avec seed
npx prisma migrate reset
```

## 🐛 Troubleshooting

### "Can't reach database server at localhost:5432"

**Cause** : PostgreSQL n'est pas démarré

**Solution** :
1. Ouvrez Postgres.app
2. Vérifiez que le serveur est démarré (icône verte)
3. Si besoin, cliquez sur "Start" pour le démarrer

### "Database does not exist"

**Cause** : La base `mycryptopilot_test` n'a pas été créée

**Solution** :
```bash
createdb -h localhost -U yoannandrieux mycryptopilot_test
DATABASE_URL="postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test" npx prisma migrate deploy
```

### "Migration failed" ou schéma obsolète

**Solution** :
```bash
# Réappliquer les migrations
DATABASE_URL="postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test" npx prisma migrate deploy
```

### Tests Playwright qui timeout

1. Assurez-vous que Postgres.app est bien démarré
2. Vérifiez que le port 3000 est libre :
   ```bash
   lsof -ti:3000 | xargs kill -9  # Tuer les process sur le port 3000
   ```
3. Augmentez les timeouts dans `playwright.config.mts` si nécessaire

### Tests qui échouent aléatoirement

Les tests E2E peuvent être flaky. Utilisez les retries automatiques :

```bash
# Playwright relaunch automatiquement 1 fois les tests qui échouent (configuré par défaut)
npx playwright test --retries=2
```

## 📁 Architecture des tests

```
mycryptopilot/
├── __tests__/              # Tests unitaires (Vitest + React Testing Library)
├── e2e/                    # Tests end-to-end (Playwright)
│   ├── utils/             # Helpers pour les tests E2E
│   ├── global-teardown.ts # Cleanup après tous les tests
│   └── *.spec.ts          # Fichiers de tests E2E
└── playwright.config.mts  # Configuration Playwright
```

## 🔐 Variables d'environnement

### Development (`pnpm dev`)
Utilise `.env.local` → Neon Cloud dev branch

### Tests E2E (`pnpm test:e2e:ci`)
Utilise automatiquement la DB locale de test grâce à `playwright.config.mts`
```
DATABASE_URL=postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test
```

## 💡 Indicateur visuel de base de données

Quand vous lancez `pnpm dev`, un badge apparaît en bas à droite de l'écran indiquant :
- **☁️ Neon Cloud** - Connecté à Neon dev
- **💻 PostgreSQL Local** - Connecté à la DB locale (tests)

## 🚀 CI/CD

Les tests tournent automatiquement sur GitHub Actions :

- **Pull Request** : Lint + TypeScript + Tests unitaires + Tests E2E
- **Main branch** : Idem + déploiement Vercel

Les tests GitHub Actions utilisent **PostgreSQL Docker** (pas Postgres.app) pour l'isolation.

Voir `.github/workflows/` pour les configurations.

## 💡 Workflow quotidien

**Première fois** :
```bash
# 1. Démarrer Postgres.app (GUI)
# 2. Créer la DB de test
createdb -h localhost -U yoannandrieux mycryptopilot_test
DATABASE_URL="postgresql://yoannandrieux:@localhost:5432/mycryptopilot_test" npx prisma migrate deploy
# 3. Lancer les tests
pnpm test:e2e
```

**Les fois suivantes** :
```bash
# 1. Démarrer Postgres.app (si pas déjà fait)
# 2. Lancer les tests directement
pnpm test:e2e
```

Postgres.app reste actif jusqu'à ce que vous l'arrêtiez manuellement ou redémarriez votre Mac.

## 📚 Ressources

- [Postgres.app Documentation](https://postgresapp.com/documentation/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
