---
description: Workflow intelligent pour démarrer une issue avec gestion automatique des branches et recommandations contextuelles.
allowed-tools: Bash(git :*), Bash(gh :*)
---

# Start Issue Workflow

Cette commande gère intelligemment le démarrage d'une issue en vérifiant l'état du projet, les branches existantes, les PRs en cours, et te guide vers la meilleure issue à traiter.

---

## 🔍 Phase 1: État des Lieux

**Objectif**: Comprendre la situation actuelle du projet.

### Actions à exécuter en parallèle:

1. **Vérifier état git local**:

   ```bash
   git status
   git fetch origin
   git branch --list
   ```

   - Branche actuelle?
   - Modifications en cours?
   - Branches locales existantes?

2. **Vérifier branches remote + état sync**:

   ```bash
   git rev-list --count HEAD..origin/main 2>/dev/null || echo "0"
   git rev-list --count origin/main..HEAD 2>/dev/null || echo "0"
   ```

   - Main est-il à jour avec origin/main?
   - Branche actuelle est-elle sync avec remote?

3. **Lister PRs en cours**:

   ```bash
   gh pr list --json number,title,headRefName,state,isDraft
   ```

   - Y a-t-il des PRs ouvertes?
   - Quelles branches sont concernées?

4. **Lister toutes les issues**:
   ```bash
   gh issue list --limit 50 --json number,title,state,labels,createdAt,updatedAt
   ```

   - Issues ouvertes disponibles
   - Labels (priority, phase, status)

### Analyse de la situation:

Après avoir récupéré ces infos, déterminer le **Scenario**:

- **A**: PR en cours → proposer de continuer sur la branche de la PR
- **B**: Branche locale non-main sans PR → proposer de continuer ou créer PR
- **C**: Sur main, à jour → proposer de choisir une nouvelle issue
- **D**: Sur main, pas à jour → proposer de sync puis choisir issue
- **E**: Modifications non commitées → proposer de commit/stash avant

---

## 🎯 Phase 2: Recommandations Intelligentes

**Objectif**: Analyser le contexte projet et recommander les meilleures issues.

### Si Scenario A ou B (travail en cours):

1. **Identifier l'issue liée à la branche**:
   - Parser le nom de branche pour extraire le numéro d'issue (pattern: `issue-<number>-*` ou `<number>-*`)
   - Ou chercher dans le body de la PR l'issue référencée

2. **Afficher l'état d'avancement**:
   - Récupérer l'issue via `gh issue view <number> --json title,body,labels`
   - Parser le body pour extraire les checkboxes `- [ ]` et `- [x]`
   - Calculer le % done:
     ```
     % Done = (checked / total) * 100
     ```
   - Afficher résumé:

     ```
     📍 Travail en cours sur: #<number> - <title>

     ✅ Complété:
     - [x] Item 1
     - [x] Item 2

     ⏳ Restant:
     - [ ] Item 3
     - [ ] Item 4

     📊 Progression: ████████░░ 80% (4/5 items)
     ```

3. **Proposer action**:

   ```
   🔧 Options:

   1. Continuer sur cette issue (#<number>)
   2. Choisir une autre issue (créera une nouvelle branche)

   Tape le numéro de ton choix:
   ```

### Si Scenario C ou D (pas de travail en cours):

1. **Analyser le contexte projet**:
   - Lire `.claude/CLAUDE.md` section "État actuel" et "Prochaines étapes MVP"
   - Identifier les blocages critiques (P0)
   - Identifier les dépendances entre issues

2. **Scorer les issues disponibles**:

   Pour chaque issue ouverte, calculer un **score de priorité**:

   ```
   Score = Priority_Weight + Dependency_Weight + Freshness_Weight

   Où:
   - Priority_Weight:
     - Label "priority-p0" ou "P0" dans body → +100
     - Label "priority-p1" ou "P1" dans body → +50
     - Label "priority-p2" ou "P2" dans body → +10
     - Sinon → 0

   - Dependency_Weight:
     - Si issue bloque d'autres (chercher "Bloque:" dans body) → +30
     - Si issue est bloquée (chercher "Bloqué par:" dans body) → -50

   - Freshness_Weight:
     - Issue créée/modifiée dans les 7 derniers jours → +5
   ```

3. **Trier et afficher recommandations**:

   ```
   📋 Issues Recommandées (par priorité):

   🔴 Priorité P0 (Urgent - Bloque MVP):

   1. [Score: 130] #42 - Générer et appliquer migrations Prisma
      ⏱️  Estimation: 30 min
      🏷️  Labels: priority-p0, phase-1
      💡 Pourquoi: Bloque toutes les features DB (3 issues dépendantes)
      📌 Status: ❌ Not Started

   2. [Score: 100] #43 - Créer système profils traders
      ⏱️  Estimation: 2-3 jours
      🏷️  Labels: priority-p0, phase-3
      💡 Pourquoi: Requis pour système signaux
      📌 Status: ❌ Not Started

   🟡 Priorité P1 (Important - MVP Core):

   3. [Score: 50] #44 - Implémenter création signaux
      ⏱️  Estimation: 5-7 jours
      🏷️  Labels: priority-p1, phase-3
      💡 Pourquoi: Core feature du MVP
      📌 Status: ❌ Not Started
      ⚠️  Bloqué par: #43

   [...]

   🟢 Priorité P2 (Nice to Have):

   8. [Score: 10] #50 - Adapter landing page sections
      ⏱️  Estimation: 1-2 jours
      🏷️  Labels: priority-p2, ui
      💡 Pourquoi: Polish UX
      📌 Status: ❌ Not Started

   ---

   💡 Recommandation: Commence par #42 (migrations) car elle débloque 3 autres issues.

   🔧 Choisis une issue:

   - Tape le numéro d'issue (ex: 42) pour démarrer
   - Ou tape "list" pour voir toutes les issues
   - Ou tape "quit" pour annuler

   Ton choix:
   ```

---

## 🚀 Phase 3: Setup Branche

**Objectif**: Créer ou checkout la branche appropriée.

### Actions selon le choix de l'utilisateur:

#### Si l'utilisateur choisit une issue:

1. **Vérifier qu'une branche n'existe pas déjà**:

   ```bash
   git branch --list "*<issue_number>*" --all
   ```

   - Si branche locale existe → checkout
   - Si branche remote existe → checkout + track
   - Sinon → créer nouvelle branche

2. **Créer nom de branche intelligent**:

   Format: `issue-<number>-<slug>`

   Où `<slug>` = titre de l'issue:
   - Convertir en lowercase
   - Remplacer espaces par `-`
   - Garder uniquement alphanumériques et `-`
   - Limiter à 50 caractères max

   Exemple:
   - Issue #42: "Générer et appliquer migrations Prisma"
   - Branch: `issue-42-generer-et-appliquer-migrations-prisma`

3. **Créer/Checkout la branche**:

   **Si branche existe déjà**:

   ```bash
   git checkout <branch_name>
   git pull origin <branch_name> 2>/dev/null || echo "Pas de remote"
   ```

   **Si branche n'existe pas**:

   ```bash
   # S'assurer que main est à jour
   git checkout main
   git pull origin main

   # Créer nouvelle branche
   git checkout -b <branch_name>
   ```

4. **Afficher confirmation**:

   ```
   ✅ Branche configurée: <branch_name>

   📍 Travail sur: #<number> - <title>
   ```

---

## 📊 Phase 4: État d'Avancement

**Objectif**: Afficher l'état détaillé de l'issue choisie.

### Récupérer détails de l'issue:

```bash
gh issue view <number> --json title,body,labels,state
```

### Parser le body pour extraire:

1. **User Story / Description**
2. **État Actuel** (si section existe):
   - Status (✅⏳❌⚠️)
   - Items complétés vs manquants
3. **Critères d'Acceptation / DoD**:
   - Compter `- [x]` (done) vs `- [ ]` (todo)
4. **Estimation**
5. **Dépendances / Blocages**

### Calculer progression:

```
Total items = count(- [ ]) + count(- [x])
Completed = count(- [x])
% Done = (Completed / Total) * 100
```

### Afficher résumé détaillé:

```
═══════════════════════════════════════════════════════════
📌 Issue #<number>: <title>
═══════════════════════════════════════════════════════════

📝 Description:
<User Story / Description principale>

───────────────────────────────────────────────────────────

📊 Progression: ████████░░ <XX>% (<completed>/<total> items)

✅ Complété (<N> items):
- [x] Item 1
- [x] Item 2

⏳ Restant (<N> items):
- [ ] Item 3
- [ ] Item 4
- [ ] Item 5

───────────────────────────────────────────────────────────

🎯 Critères d'Acceptation:
<Liste des DoD / AC>

⏱️  Estimation: <estimation>
🏷️  Labels: <labels>

───────────────────────────────────────────────────────────

⚠️ Dépendances:
<Si applicable, lister blocages/dépendances>

───────────────────────────────────────────────────────────

🚀 Prochaines Étapes Suggérées:
1. <Action 1 basée sur items restants>
2. <Action 2>
3. <Action 3>

═══════════════════════════════════════════════════════════

💡 Conseil: <Conseil contextuel basé sur CLAUDE.md>

✅ Tu es prêt à travailler sur cette issue!
```

---

## 🎨 Phase 5: CLI Interactif (Bonus)

**Note**: Cette phase est optionnelle selon le contexte.

### Si plusieurs choix possibles:

Utiliser un **mini CLI interactif** en affichant:

```
╔════════════════════════════════════════════════════════════╗
║         🎯 MyCryptoPilot - Issue Workflow                  ║
╚════════════════════════════════════════════════════════════╝

📊 État actuel:
- Branche: main
- Status: À jour avec origin/main ✅
- PRs en cours: 1 (#76 - fix-after-new-version)

───────────────────────────────────────────────────────────

🔧 Que veux-tu faire?

  1  →  Continuer PR #76 (fix-after-new-version)
  2  →  Démarrer une nouvelle issue
  3  →  Voir toutes les issues disponibles
  4  →  Quitter

Choix (1-4):
```

Puis selon le choix, afficher le menu suivant.

---

## ⚙️ Workflow Exécution

Quand l'utilisateur lance `/start-issue`:

1. **Phase 1**: "🔍 Analyse de l'état du projet..." (exécuter checks git/gh en parallèle)
2. **Déterminer Scenario**: Afficher situation actuelle
3. **Phase 2**: "🎯 Analyse des issues disponibles..." (si pas de travail en cours)
4. **Afficher recommandations** avec CLI interactif
5. **Attendre choix utilisateur** (simulation via réponse directe)
6. **Phase 3**: "🚀 Configuration de la branche..." (create/checkout)
7. **Phase 4**: "📊 Récupération état d'avancement..." (fetch issue details)
8. **Afficher résumé final détaillé**
9. **Fin**: "✅ Setup terminé! Tu peux commencer à travailler."

---

## 🎯 Contraintes & Guidelines

1. **Toujours vérifier avant d'agir**:
   - Ne jamais créer de branche sans vérifier qu'elle n'existe pas
   - Ne jamais switch de branche avec modifications non commitées
   - Toujours sync main avant de créer branche

2. **Gestion des erreurs**:
   - Si modifications non commitées → proposer `git stash` ou commit
   - Si branche pas sync → proposer pull
   - Si conflits → afficher message clair et arrêter

3. **Priorité à la sécurité**:
   - Ne jamais faire `git reset --hard`
   - Ne jamais forcer push
   - Toujours confirmer actions destructives

4. **Parser intelligemment**:
   - Extraire numéro d'issue depuis nom de branche (patterns multiples)
   - Parser body markdown avec robustesse (gérer variations format)
   - Gérer absences de sections (pas de panic)

5. **CLI lisible**:
   - Utiliser emojis pour clarté visuelle
   - Progress bars pour %
   - Lignes de séparation pour structure
   - Messages concis et actionnables

6. **Recommandations contextuelles**:
   - Toujours justifier pourquoi une issue est recommandée
   - Mentionner blocages/dépendances
   - Suggérer prochaines étapes concrètes

---

## 💡 Exemples de Scénarios

### Scenario A: PR en cours

```
📍 Tu as une PR en cours:
   #76 - fix: convert configuration files to ES modules
   Branche: fix-after-new-version

📊 Progression: ██████░░░░ 60% (3/5 items)

🔧 Options:
1. Continuer sur cette PR
2. Choisir une autre issue

Choix (1-2):
```

### Scenario C: Choisir nouvelle issue

```
📋 Issues Recommandées:

🔴 P0 (Urgent):
1. [Score: 130] #42 - Migrations Prisma (30 min)
   💡 Débloque 3 issues, aucune dépendance

🟡 P1 (Important):
2. [Score: 50] #43 - Profils Traders (2-3j)
   💡 Requis pour système signaux

Recommandation: #42

Tape le numéro d'issue (ou 'list' pour tout voir):
```

---

## 📝 Notes Finales

Cette commande doit:

- ✅ Être **autonome** (pas besoin de taper des commandes manuellement)
- ✅ Être **intelligente** (analyser contexte, recommander)
- ✅ Être **sûre** (vérifier avant d'agir, gérer erreurs)
- ✅ Être **claire** (CLI visuel, progress, emojis)
- ✅ Être **utile** (vraies recommandations basées sur CLAUDE.md)

**Durée estimée**: 30 secondes - 2 minutes selon scenario.
