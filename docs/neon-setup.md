# Configuration Neon Database

Ce document explique comment configurer Neon avec la stratégie **Branch-Per-Preview** pour MyCryptoPilot.

---

## 📊 Architecture Actuelle

### Branches Neon

| Branch | Usage | Endpoint | Fichier .env |
|--------|-------|----------|--------------|
| **main** (prod) | Production | `ep-proud-term-abutee8y` | `.env.production` |
| **dev** | Staging/Dev | `ep-falling-bar-ab0lufee` | `.env.development` |
| **preview-\*** | PR previews | Auto-créées par Vercel | Variables Vercel |

---

## 🚀 Activer Branch-Per-Preview (Recommandé)

### Pourquoi ?

Chaque Pull Request aura sa propre base de données isolée :
- ✅ Pas de risque de casser la DB dev/prod
- ✅ Tests E2E sur données isolées
- ✅ Nettoyage automatique après merge
- ✅ Réplication de la DB prod pour tests réalistes

### Étapes

#### 1. Via Vercel Dashboard

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **mycryptopilot**
3. Aller dans **Settings → Integrations**
4. Trouver **Neon** dans la liste
5. Activer l'option **"Create a branch for each Preview deployment"**

#### 2. Configuration Neon

1. Aller sur [Neon Console](https://console.neon.tech)
2. Sélectionner votre projet
3. Dans **Settings → Branching**
4. Activer **"Auto-delete branches"** (pour nettoyer après merge)
5. Configurer le délai de rétention : **7 jours** (recommandé)

---

## 🔧 Configuration des Environnements

### Local Development

```bash
# Utilise .env.development
pnpm dev

# Base de données : ep-falling-bar-ab0lufee (branch dev)
```

### Preview (Vercel PR)

```bash
# Push une branche feature
git checkout -b feature/new-feature
git push origin feature/new-feature

# Vercel crée automatiquement :
# - Un deployment preview : https://mycryptopilot-git-feature-xxx.vercel.app
# - Une branch Neon : preview-feature-new-feature
```

Les variables d'environnement sont automatiquement configurées par Vercel.

### Production (Vercel main)

```bash
# Merge dans main
git checkout main
git merge feature/new-feature
git push origin main

# Vercel déploie sur : https://www.mycryptopilot.app
# Base de données : ep-proud-term-abutee8y (branch main)
```

---

## 🔐 Variables d'Environnement

### Local (.env.development)

```bash
DATABASE_URL="postgresql://neondb_owner:***@ep-falling-bar-ab0lufee-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:***@ep-falling-bar-ab0lufee.eu-west-2.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_URL=http://localhost:3000
```

### Vercel (Production)

Configuré dans **Vercel → Settings → Environment Variables** :

```bash
# Scope: Production
DATABASE_URL="postgresql://neondb_owner:***@ep-proud-term-abutee8y-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:***@ep-proud-term-abutee8y.eu-west-2.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_URL=https://www.mycryptopilot.app
BETTER_AUTH_SECRET=<production-secret>
```

### Vercel (Preview)

Configuré automatiquement par l'intégration Neon :

```bash
# Scope: Preview
# DATABASE_URL et DATABASE_URL_UNPOOLED sont auto-générées par Neon
BETTER_AUTH_URL=https://$VERCEL_URL
BETTER_AUTH_SECRET=<same-as-production>
```

---

## 🧪 Tests E2E (GitHub Actions)

Les tests Playwright utilisent `.env.test` et une base PostgreSQL locale :

```yaml
# .github/workflows/playwright.yml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_DB: mycryptopilot_test

env:
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mycryptopilot_test"
  BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET_TEST }}
```

---

## 🛠️ Commandes Utiles

### Lister les branches Neon

```bash
# Via CLI Neon
neonctl branches list --project-id <your-project-id>

# Via Neon Console
# https://console.neon.tech/app/projects/<your-project-id>/branches
```

### Créer manuellement une branch

```bash
neonctl branches create --name preview-test --parent dev
```

### Supprimer une branch preview

```bash
neonctl branches delete preview-test
```

### Appliquer les migrations

```bash
# Local (dev branch)
pnpm prisma migrate dev

# Production (via Vercel build)
pnpm prisma migrate deploy
```

---

## 📋 Checklist Migration

Si tu veux activer Branch-Per-Preview maintenant :

- [ ] Aller sur Vercel Dashboard → Settings → Integrations → Neon
- [ ] Activer "Create a branch for each Preview deployment"
- [ ] Aller sur Neon Console → Settings → Branching
- [ ] Activer "Auto-delete branches" (7 jours)
- [ ] Tester en créant une PR :
  ```bash
  git checkout -b test-preview
  git push origin test-preview
  # Vérifier sur Vercel que le preview deployment a bien une DB Neon dédiée
  ```
- [ ] Vérifier dans Neon Console qu'une branche `preview-test-preview` a été créée
- [ ] Merger la PR et vérifier que la branche Neon est auto-supprimée après 7 jours

---

## 🔗 Ressources

- [Neon Branching Guide](https://neon.tech/docs/guides/branching)
- [Vercel + Neon Integration](https://vercel.com/integrations/neon)
- [Prisma + Neon Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel#using-neon-with-prisma)
