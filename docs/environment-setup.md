# Guide de Gestion des Environnements

Ce guide explique comment gérer les différents environnements (dev, test, production) pour MyCryptoPilot.

---

## ✅ Database Status (10 octobre 2025 - 16h15)

**RÉSOLUTION COMPLÉTÉE**: Les 5 migrations Prisma ont été appliquées avec succès !

```bash
npx prisma migrate status
# Database schema is up to date! ✅
```

**Migrations appliquées**:
- ✅ `20250806031537_initail_migration`
- ✅ `20250813011134_org_move_to_stirpe_to_org_level`
- ✅ `20250813021925_admin_add_admin_control_of_better_auth`
- ✅ `20251003143237_add_mycryptopilot_models`
- ✅ `20251010090500_add_user_plan_and_discord_fields`

✅ **Toutes les fonctionnalités sont maintenant opérationnelles**:
- Profils traders ✅
- Création de signaux ✅
- Système follow/unfollow ✅
- Paiements crypto ✅
- Discord Bot integration ✅

---

## 📁 Structure des Fichiers

```
mycryptopilot/
├── .env-template          # Template à copier (tracké en git)
├── .env.development       # Dev local (non tracké)
├── .env.production        # Prod backup (non tracké)
├── .env.test             # Tests E2E (non tracké)
└── docs/
    ├── environment-setup.md   # Ce fichier
    └── neon-setup.md          # Configuration Neon détaillée
```

---

## 🚀 Setup Initial

### 1. Créer vos fichiers d'environnement

```bash
# Copier le template
cp .env-template .env.development
cp .env-template .env.production
# .env.test est déjà créé

# Éditer .env.development avec tes credentials dev
# Éditer .env.production avec tes credentials prod (backup uniquement)
```

### 2. Configurer les bases de données

Voir [docs/neon-setup.md](./neon-setup.md) pour la configuration complète Neon.

**Résumé rapide :**

| Environnement | Base Neon | Fichier |
|---------------|-----------|---------|
| Dev local | Branch `dev` | `.env.development` |
| Production | Branch `main` | Variables Vercel |
| Tests E2E | PostgreSQL local | `.env.test` |

---

## 🔧 Utilisation

### Développement Local

```bash
# Next.js charge automatiquement .env.development en mode dev
pnpm dev

# Ou explicitement avec NODE_ENV
NODE_ENV=development pnpm dev
```

**Variables importantes :**
```bash
DATABASE_URL="postgresql://...@ep-falling-bar-ab0lufee..." # Branch dev
BETTER_AUTH_URL=http://localhost:3000
```

### Tests E2E (Local)

```bash
# Les tests utilisent .env.test
pnpm test:e2e

# Avec UI
pnpm test:e2e:ui
```

**Prérequis :** PostgreSQL local doit tourner :
```bash
# Avec Docker
docker run -d \
  --name postgres-test \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=mycryptopilot_test \
  -p 5432:5432 \
  postgres:15

# Appliquer les migrations
NODE_ENV=test pnpm prisma migrate deploy
```

### Production (Vercel)

Les variables sont configurées dans **Vercel Dashboard → Settings → Environment Variables**.

```bash
# Build de production (local)
NODE_ENV=production pnpm build

# En production Vercel, les env vars sont auto-injectées
```

---

## 🔐 Sécurité

### ⚠️ RÈGLES IMPORTANTES

1. **JAMAIS commit les fichiers `.env.*`** (sauf `.env-template`)
2. **JAMAIS exposer `BETTER_AUTH_SECRET`** en clair dans le code
3. **Utiliser des secrets différents** pour dev/test/prod
4. **Rotate les secrets** tous les 3-6 mois

### Fichiers Trackés vs Non-Trackés

```bash
# ✅ Tracké en git
.env-template

# ❌ NON tracké en git (.gitignore)
.env.development
.env.production
.env.test
.env*.local
```

### GitHub Secrets

Les secrets GitHub Actions sont configurés dans **Settings → Secrets → Actions** :

| Secret | Usage | Exemple |
|--------|-------|---------|
| `BETTER_AUTH_SECRET_TEST` | Tests E2E CI | `test-secret-key...` |
| `RESEND_API_KEY` | Emails en CI | `re_***` |
| `NEON_PROJECT_ID` | Gestion DB Neon | `prj_***` |

**Ajouter un secret :**
```bash
gh secret set SECRET_NAME -R YoannDrx/mycryptopilot
```

---

## 📊 Priorité de Chargement des Variables

Next.js charge les variables dans cet ordre (priorité décroissante) :

1. **Variables d'environnement système** (CLI)
2. `.env.$(NODE_ENV).local` (ex: `.env.development.local`)
3. `.env.local` (⚠️ NON utilisé dans notre setup)
4. `.env.$(NODE_ENV)` (ex: `.env.development`) ← **Notre choix**
5. `.env`

**Notre stratégie :** On utilise uniquement `.env.development`, `.env.production`, `.env.test`.

---

## 🧪 Tests des Environnements

### Vérifier que les bonnes variables sont chargées

```bash
# Dev
pnpm dev
# Console → Voir BETTER_AUTH_URL devrait être http://localhost:3000

# Test
NODE_ENV=test node -e "console.log(process.env.DATABASE_URL)"
# Devrait afficher : postgresql://postgres:postgres@localhost:5432/mycryptopilot_test
```

### Debug des variables

Ajouter temporairement dans `next.config.ts` :

```typescript
console.log({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL?.slice(0, 30) + '...', // Tronquer pour sécurité
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
})
```

---

## 🔄 Workflow Typique

### Feature Development

```bash
# 1. Créer une branche
git checkout -b feature/new-feature

# 2. Développer en local (utilise .env.development)
pnpm dev

# 3. Tester en local
pnpm test:e2e

# 4. Push et créer PR
git push origin feature/new-feature

# 5. Vercel crée un preview deployment avec DB Neon preview
# URL : https://mycryptopilot-git-feature-xxx.vercel.app

# 6. Review + merge
# La branch Neon preview sera auto-supprimée après 7 jours
```

### Hotfix Production

```bash
# 1. Créer branche hotfix depuis main
git checkout -b hotfix/critical-bug main

# 2. Fix le bug (tester en local avec .env.development)
pnpm dev

# 3. Push et merge rapidement
git push origin hotfix/critical-bug

# 4. Merge dans main → deploy auto sur prod
```

---

## 🆘 Troubleshooting

### Erreur : "Invalid `prisma.xxx()` invocation"

**Cause :** Mauvaise `DATABASE_URL` ou DB non accessible.

**Solution :**
```bash
# Vérifier quelle URL est chargée
echo $DATABASE_URL

# Tester la connexion
pnpm prisma db pull
```

### Erreur : "BETTER_AUTH_SECRET is required"

**Cause :** Variable manquante ou non chargée.

**Solution :**
```bash
# Générer un nouveau secret
openssl rand -base64 32

# Ajouter dans .env.development
BETTER_AUTH_SECRET="<votre-secret-généré>"
```

### Les variables ne se chargent pas

**Cause :** Fichier `.env.*` au mauvais endroit ou mal nommé.

**Solution :**
```bash
# Vérifier que les fichiers sont à la racine du projet
ls -la .env.*

# Output attendu :
# .env-template
# .env.development
# .env.production
# .env.test
```

### Erreur GitHub Actions : "secret not found"

**Cause :** Secret non configuré dans GitHub.

**Solution :**
```bash
# Lister les secrets
gh secret list -R YoannDrx/mycryptopilot

# Ajouter le secret manquant
gh secret set SECRET_NAME -R YoannDrx/mycryptopilot
```

---

## 📚 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Neon Branching](https://neon.tech/docs/guides/branching)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma + Neon](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

## 🎯 Checklist Rapide

Avant de commencer à développer :

- [ ] `.env.development` existe et est configuré
- [ ] `DATABASE_URL` pointe vers la branch Neon dev
- [ ] `BETTER_AUTH_SECRET` est défini
- [ ] `pnpm dev` démarre sans erreur
- [ ] `pnpm prisma studio` accède à la DB dev
- [ ] `.env.test` existe pour les tests E2E
- [ ] PostgreSQL local tourne pour les tests (si besoin)

Avant de merge en production :

- [ ] Tests E2E passent en local
- [ ] Preview deployment Vercel fonctionne
- [ ] Migrations Prisma sont appliquées sur preview
- [ ] Aucun secret hardcodé dans le code
- [ ] Variables d'env Vercel (production) sont à jour
