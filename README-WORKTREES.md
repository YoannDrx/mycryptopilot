# Guide Git Worktrees - MyCryptoPilot

Ce guide explique comment utiliser **Git Worktrees** pour travailler sur plusieurs features en parallèle.

## 🤔 C'est quoi Git Worktrees ?

Git Worktrees permet d'avoir **plusieurs copies du même repo** avec des branches différentes, **sans cloner le repo plusieurs fois**.

### Exemple concret :

```
~/Developer/worktrees/mycryptopilot-worktrees/
├── issue-42-add-portfolio-page/     ← Branch: issue-42 (feature en cours)
├── issue-51-fix-auth-bug/           ← Branch: issue-51 (bug critique)
└── main repo (ton dossier actuel)   ← Branch: main
```

**Avantages** :
- ✅ Travail parallèle sur plusieurs features
- ✅ Isolation complète (dépendances, DB, env)
- ✅ Pas besoin de stash/commit en WIP
- ✅ Économie de temps (pas de `git switch`)

## 🆚 Conductor vs Git Worktrees

| Concept | Conductor | Git Worktrees |
|---------|-----------|---------------|
| **But** | Gestion workspaces dev (services, DB, env) | Branches Git parallèles |
| **Isolation** | Services (Postgres, Redis, etc.) | Code Git uniquement |
| **Quand utiliser** | 1 feature à la fois | Plusieurs features en parallèle |
| **Setup DB** | Auto (Postgres.app) | Manuel (copie .env) |

**Ils ne s'interfacent PAS automatiquement !**

Conductor gère ton environnement de dev, Git Worktrees gère tes branches Git.

## 📋 Prérequis

### CLI Tools nécessaires :

```bash
# GitHub CLI
brew install gh
gh auth login

# Claude CLI
curl https://claude.ai/cli | sh
claude login

# jq (JSON parser)
brew install jq

# Ghostty terminal
# Déjà installé chez toi ✅
```

### Vérifier l'installation :

```bash
pnpm worktree:check
```

## 🚀 Utilisation

### 1. Créer un worktree pour une issue GitHub

```bash
# Méthode 1 : Avec pnpm (recommandé)
pnpm worktree:setup https://github.com/YoannDrx/mycryptopilot/issues/123

# Méthode 2 : Script direct
./.claude/scripts/setup-worktree.sh https://github.com/YoannDrx/mycryptopilot/issues/123
```

**Ce que fait le script** :

1. 🤖 **Génère un nom de branche intelligent** via Claude AI
   - Format : `issue-XX-descriptive-name`
   - Exemple : `issue-123-add-risk-console`

2. 📁 **Crée le worktree** dans `~/Developer/worktrees/mycryptopilot-worktrees/`

3. 📋 **Copie tous les fichiers `.env*`**
   - `.env.local` → Neon Cloud dev
   - `.env.test.local` → PostgreSQL local test

4. 📦 **Installe les dépendances**
   ```bash
   pnpm install
   ```

5. 🗄️ **Génère Prisma Client**
   ```bash
   pnpm prisma generate
   ```

6. 🖥️ **Ouvre Ghostty** avec Claude en plan mode
   - Terminal prêt dans le nouveau worktree
   - Claude démarre avec `/run-tasks <issue-url>`

### 2. Lister les worktrees actifs

```bash
# Méthode 1 : Avec pnpm
pnpm worktree:list

# Méthode 2 : Git direct
git worktree list
```

**Output exemple** :
```
/Users/yoannandrieux/Projets/mycryptopilot                            66498c3 [main]
/Users/yoannandrieux/Developer/worktrees/issue-42-add-portfolio-page  a1b2c3d [issue-42]
/Users/yoannandrieux/Developer/worktrees/issue-51-fix-auth-bug        e4f5g6h [issue-51]
```

### 3. Nettoyer les worktrees obsolètes

```bash
# Méthode 1 : Avec pnpm
pnpm worktree:clean

# Méthode 2 : Script direct
./.claude/scripts/clean-worktree.sh
```

**Ce que fait le script** :

1. 🔍 **Fetch remote** et prune branches supprimées
2. 📊 **Check chaque worktree** :
   - Branche existe encore sur remote ?
   - PR mergée ?
3. 🗑️ **Supprime automatiquement** les worktrees obsolètes
4. ✅ **Affiche** les worktrees restants

### 4. Diagnostic complet

```bash
pnpm worktree:check
```

**Affiche** :
- ✅ CLI tools installés (gh, claude, jq, Ghostty)
- 📊 Worktrees existants
- 💾 Espace disque utilisé
- 🔗 GitHub authentication status

## 🔧 Workflow complet

### Scénario : Travailler sur 2 features en parallèle

#### Feature 1 : Ajout Portfolio Page (urgent)

```bash
# 1. Créer worktree
pnpm worktree:setup https://github.com/YoannDrx/mycryptopilot/issues/42

# 2. Ghostty s'ouvre automatiquement
# 3. Travailler dans le worktree
cd ~/Developer/worktrees/mycryptopilot-worktrees/issue-42-add-portfolio-page
pnpm dev

# 4. Commit & push
git add .
git commit -m "feat: Add portfolio page"
git push origin issue-42-add-portfolio-page

# 5. Créer PR sur GitHub
gh pr create --title "feat: Add portfolio page" --body "Closes #42"
```

#### Feature 2 : Fix Auth Bug (parallèle)

```bash
# 1. Créer un DEUXIÈME worktree (pendant que feat 1 tourne !)
pnpm worktree:setup https://github.com/YoannDrx/mycryptopilot/issues/51

# 2. Nouveau terminal Ghostty s'ouvre
# 3. Travailler sur le bug fix (isolation complète)
cd ~/Developer/worktrees/mycryptopilot-worktrees/issue-51-fix-auth-bug
pnpm dev  # Port 3000 déjà pris ? Utilise 3001

# 4. Fix, commit, push
git add .
git commit -m "fix: Auth session timeout"
git push origin issue-51-fix-auth-bug

# 5. Créer PR
gh pr create --title "fix: Auth session timeout" --body "Fixes #51"
```

#### Après merge des PRs

```bash
# Nettoyer les worktrees obsolètes
pnpm worktree:clean

# Output:
# Checking: issue-42-add-portfolio-page
#   → PR #42 merged, removing worktree
# Checking: issue-51-fix-auth-bug
#   → PR #51 merged, removing worktree
# Done! Remaining worktrees:
# /Users/yoannandrieux/Projets/mycryptopilot  66498c3 [main]
```

## ⚙️ Configuration Spécifique MyCryptoPilot

### Base de données

**Important** : Les worktrees partagent la même DB !

**Development** :
- `.env.local` est copié → Pointe vers **Neon Cloud dev**
- Tous les worktrees utilisent la **même DB Neon**

**Tests E2E** :
- `.env.test.local` est copié → Pointe vers **PostgreSQL Local test**
- DB : `mycryptopilot_test` sur Postgres.app

**Recommandation** :
- Si tu veux isoler les données, utilise des **branches Neon** différentes
- Ou crée des DB locales séparées (non recommandé)

### Prisma

**Multi-file schema** :
- `prisma/schema.prisma` (main)
- `prisma/schema/better-auth.prisma` (auth)

Le script exécute automatiquement :
```bash
pnpm prisma generate
```

Grâce à `prisma.config.ts`, tous les schémas sont chargés ✅

### Variables d'environnement

**Fichiers copiés automatiquement** :
- `.env.local` → Neon dev credentials
- `.env.test.local` → PostgreSQL local test
- Tout autre `.env*` dans le projet

**Secrets** :
- `BETTER_AUTH_SECRET`
- Discord tokens
- Neon credentials

→ **Tous copiés dans le worktree** ✅

## 🐛 Troubleshooting

### "Command not found: gh"

```bash
brew install gh
gh auth login
```

### "Command not found: claude"

```bash
curl https://claude.ai/cli | sh
claude login
```

### "Ghostty not found"

Installe Ghostty depuis : https://ghostty.org/

### "Branch name generation failed"

Le script fallback sur `issue-XX` si Claude échoue.

### "Port 3000 already in use"

Un worktree utilise déjà le port 3000 :

```bash
# Option 1 : Tuer le process
lsof -ti:3000 | xargs kill -9

# Option 2 : Utiliser un autre port
PORT=3001 pnpm dev
```

### "Prisma Client not generated"

```bash
cd ~/Developer/worktrees/mycryptopilot-worktrees/issue-XX-feature
pnpm prisma generate
```

### "Database does not exist"

Si tu utilises PostgreSQL local :

```bash
pnpm db:setup-test
```

## 📁 Structure Worktrees

```
~/Developer/worktrees/
└── mycryptopilot-worktrees/
    ├── issue-42-add-portfolio-page/
    │   ├── .env.local (copié)
    │   ├── .env.test.local (copié)
    │   ├── node_modules/ (installé)
    │   ├── src/generated/prisma/ (généré)
    │   └── [reste du code...]
    └── issue-51-fix-auth-bug/
        └── [même structure...]
```

## 🚀 Commandes Rapides

| Commande | Description |
|----------|-------------|
| `pnpm worktree:setup <url>` | Créer worktree pour une issue |
| `pnpm worktree:clean` | Nettoyer worktrees obsolètes |
| `pnpm worktree:list` | Lister worktrees actifs |
| `pnpm worktree:check` | Diagnostic complet |
| `git worktree list` | Lister (Git natif) |
| `git worktree remove <path>` | Supprimer manuellement |

## 💡 Quand Utiliser Git Worktrees ?

### ✅ Utilise Git Worktrees si :

- Tu travailles sur **plusieurs features en parallèle**
- Tu dois **switch rapidement** entre features sans stash
- Tu veux **isoler** les dépendances (node_modules)
- Tu fais du **review de PR** sur une autre branche

### ❌ N'utilise PAS Git Worktrees si :

- Tu travailles sur **1 seule feature à la fois**
- Tu es à l'aise avec `git switch`
- Tu as **peu d'espace disque** (chaque worktree = ~500MB)

**Workflow simple** :
```bash
# Sans worktrees (simple)
git switch main
git pull
git switch -c issue-42
# ... code ...
git push
```

**Workflow avancé** :
```bash
# Avec worktrees (parallèle)
pnpm worktree:setup <issue-42-url>
pnpm worktree:setup <issue-51-url>
# ... code dans les 2 worktrees en même temps ...
pnpm worktree:clean
```

## 📚 Ressources

- [Git Worktrees Documentation](https://git-scm.com/docs/git-worktree)
- [GitHub CLI](https://cli.github.com/)
- [Claude CLI](https://claude.ai/cli)
- [Ghostty Terminal](https://ghostty.org/)

---

**Note** : Ces scripts sont **optionnels** ! Si tu n'en as pas besoin, tu peux les ignorer et continuer à travailler normalement. 😊
