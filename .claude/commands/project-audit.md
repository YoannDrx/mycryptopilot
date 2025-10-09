---
description: Audit complet du projet avec mise à jour documentation + issues GitHub + rapport détaillé
tags: project-management, documentation, github, analysis
---

# Project Audit Command

Effectue un audit complet du projet MyCryptoPilot, met à jour toute la documentation et les issues GitHub, puis génère un rapport détaillé avec progress tracking et recommandations.

**Durée estimée**: 5-10 minutes

---

## Instructions

Tu vas effectuer un audit complet et systématique du projet MyCryptoPilot en 5 phases distinctes, puis générer un rapport final ultra-détaillé.

### 🔍 Phase 1: Deep Code Analysis (Ultrathink)

**Objectif**: Avoir une vision précise et exhaustive de l'état du développement.

**Actions**:

1. **Scanner le codebase complet**:
   - Utilise `Glob` pour lister tous les fichiers `.ts`, `.tsx`, `.prisma`
   - Compte les fichiers par catégorie (app/, src/, prisma/)
   - Identifie les fichiers modifiés récemment

2. **Identifier features implémentées vs planifiées**:
   - Lire `src/site-config.ts`, `src/lib/crypto/mycryptopilot-plans.ts`
   - Scanner les pages dans `app/orgs/[orgSlug]/(navigation)/`
   - Vérifier existence des modèles Prisma (TraderProfile, Signal, Follow, CryptoAddress, CryptoPayment)
   - Chercher les server actions (fichiers `.action.ts`)
   - Identifier composants UI créés vs manquants

3. **Détecter parcours testables end-to-end**:
   - Authentification (signup, signin, OAuth)
   - Dashboard pages (accessibles mais avec/sans données?)
   - Création profils traders (existe?)
   - Création signaux (existe?)
   - Follow/unfollow (existe?)
   - Paiements crypto (fonctionnel?)
   - Pour chaque parcours, déterminer: ✅ Testable full, ⚠️ UI only, ❌ Not testable

4. **Lister TOUS les TODOs et warnings**:
   - Utilise `Grep` pour trouver tous les `TODO` dans le code (hors node_modules)
   - Note le fichier, la ligne, et le contexte
   - Catégorise par criticité (P0 blocage, P1 important, P2 nice-to-have)

5. **Identifier blocages et dépendances**:
   - Migrations Prisma appliquées? (vérifier existence dossier `prisma/migrations/`)
   - Env vars configurées? (lire `src/lib/env.ts`)
   - Dependencies npm installées? (lire `package.json`)
   - APIs externes requises (RPC URLs, API keys)

6. **Analyser qualité code**:
   - Build réussit? (vérifier dernière exécution)
   - Tests présents? (chercher fichiers `*.test.ts`, `*.spec.ts`)
   - Types TypeScript stricts?

---

### 📝 Phase 2: Update All Documentation Files

**Objectif**: Synchroniser toute la documentation avec l'état réel du projet en lisant TOUS les fichiers .md.

**Actions**:

1. **Scanner TOUS les fichiers .md du projet**:
   - Utilise `Glob` pour trouver récursivement tous les `**/*.md` (y compris sous-dossiers)
   - Lire chaque fichier complètement
   - Identifier les fichiers nécessitant une mise à jour

2. **Mettre à jour chaque fichier .md**:

   a. **README.md** (racine projet):
      - Section "Documentation" renvoyant vers CLAUDE.md
      - Section "Installation" avec warnings si nécessaire (ex: migrations)
      - Garder le contenu minimal et vitrine publique
      - Mettre à jour date si nécessaire
      - Vérifier cohérence avec état réel du projet

   b. **.claude/CLAUDE.md** (FICHIER PRINCIPAL - Support dev):
      - ⚠️ **PRIORITÉ ABSOLUE** - C'est le fichier de référence pour tout le développement
      - Lire complètement le fichier actuel
      - Section "État Actuel du développement" synchronisée avec découvertes de la Phase 1
      - Progression globale du projet mise à jour (avec %)
      - TODOs critiques listés avec fichiers et lignes précises
      - Parcours testables documentés (✅ ⚠️ ❌)
      - Blocages critiques identifiés (migrations, env vars, etc.)
      - Section "Prochaines étapes MVP" mise à jour avec priorités P0/P1/P2
      - Mettre à jour TOUTES les dates dans le fichier
      - Vérifier cohérence de toutes les sections avec l'état réel

   c. **Autres fichiers .md trouvés**:
      - Pour chaque fichier .md trouvé (docs/, src/, features/, etc.):
        - Lire le contenu
        - Vérifier si le contenu est à jour (dates, TODOs, statuts)
        - Mettre à jour si nécessaire
        - Exemples : TRADING_CARDS.md, XPUB_GENERATION.md, etc.

3. **Synchroniser toutes les dates**:
   - Utiliser date actuelle (format: "X octobre 2025")
   - Remplacer les anciennes dates dans tous les fichiers .md

---

### 🔖 Phase 3: GitHub Issues Deep Analysis & Update

**Objectif**: Parcourir TOUTES les issues (ouvertes ET fermées), vérifier leur statut réel, et réouvrir celles qui ne sont pas complètes.

**Actions**:

1. **Lister TOUTES les issues GitHub (open + closed)**:

   ```bash
   # Lister toutes les issues ouvertes
   gh issue list --repo YoannDrx/mycryptopilot --state open --limit 100 --json number,title,state,labels

   # Lister toutes les issues fermées
   gh issue list --repo YoannDrx/mycryptopilot --state closed --limit 100 --json number,title,state,labels
   ```

2. **Pour CHAQUE issue (ouverte OU fermée), effectuer les actions suivantes**:

   a. **Récupérer contenu actuel**:

   ```bash
   gh issue view <number> --json title,body,labels,state
   ```

   b. **Analyser PROFONDÉMENT le statut réel de l'issue**:
   - **Lire les fichiers/code mentionnés dans l'issue**
   - **Rechercher dans le codebase** les features liées à l'issue
   - **Vérifier existence** des actions, queries, components, pages mentionnés
   - **Compter les TODOs** restants dans les fichiers concernés
   - **Tester mentalement** le parcours end-to-end décrit
   - Déterminer statut RÉEL: ✅ Completed, ⏳ In Progress, ❌ Not Started, ⚠️ Blocked
   - **Identifier précisément** ce qui est fait vs ce qui manque

   c. **Décision critique pour issues FERMÉES**:
   - ⚠️ **Si l'issue est CLOSED mais PAS 100% complète**:
     - **RÉOUVRIR l'issue** avec `gh issue reopen <number>`
     - Ajouter commentaire expliquant pourquoi réouverte
     - Lister précisément ce qui reste à faire
   - ✅ **Si l'issue est CLOSED et vraiment 100% complète**:
     - Laisser fermée
     - Optionnellement ajouter commentaire de confirmation

   d. **Mettre à jour le body de l'issue** avec sections enrichies:

   ````markdown
   ## User Story

   [Conserver existant]

   ### 🔄 État Actuel (Mis à jour le <DATE>)

   **Status**: <✅⏳❌⚠️> <DESCRIPTION_PRECISE>

   **✅ Complété**:

   - [x] Item 1
   - [x] Item 2

   **❌ Manquant** ou **⏳ En cours**:

   - [ ] Item 1
   - [ ] Item 2

   **⚠️ Blocages** (si applicable):

   - Bloqué par: #<issue_number>
   - Raison: <description>

   ---

   ### 🔗 Dépendances

   **Bloque**:

   - #<issue_number> - <Titre>

   **Bloqué par**:

   - #<issue_number> - <Titre>

   **Requiert** (optionnel):

   - Migrations Prisma appliquées
   - Env vars configurées: <liste>
   - Packages installés: <liste>

   ---

   ### ⚙️ Configuration Required

   [Si applicable - sinon omettre cette section]

   **Env Variables**:

   ```bash
   # .env.local
   VARIABLE_NAME=value_example
   ANOTHER_VAR=...
   ```
   ````

   **API Keys / Services externes**:
   - Service X: Obtenir clé sur <URL>
   - Service Y: Configurer <instructions>

   **Setup Step-by-Step**:
   1. Faire ceci
   2. Puis cela
   3. Vérifier avec: <commande>

   ***

   ### 🧪 Guide Test End-to-End

   **Prérequis**:
   - [ ] Migrations Prisma appliquées
   - [ ] User compte créé (email: test@example.com)
   - [ ] Server dev lancé (`pnpm dev`)
   - [ ] Autre prérequis spécifique

   **Steps de test**:
   1. **Action 1**: Aller sur <URL>
      - **Attendu**: Tu vois <description>

   2. **Action 2**: Cliquer sur <bouton>
      - **Attendu**: <ce qui se passe>

   3. **Action 3**: Remplir formulaire avec <données>
      - **Attendu**: <validation, redirection, etc.>

   4. **Vérification finale**: Ouvrir <DB/UI/logs>
      - **Attendu**: <résultat précis>

   **Résultats attendus finaux**:
   - ✅ <Critère 1 validé>
   - ✅ <Critère 2 validé>
   - ✅ <Aucune erreur console>

   **En cas d'échec**:
   - Vérifier: <checklist debugging>
   - Erreur commune: <description + solution>

   ***

   ### Portée

   [Conserver existant et ajuster si nécessaire]

   ### Critères d'Acceptation (BDD)

   [Conserver existant et compléter si incomplet]

   ### DoD Spécifique

   [Cocher items complétés avec [x]]

   ### Estimation

   [Corriger si nécessaire basé sur l'analyse]

   ***

   ### Prochaines Étapes
   1. <Action suivante prioritaire>
   2. <Autre action>

   ***

   _Mis à jour le <DATE> par /project-audit_

   ````

   e. **Mettre à jour via GitHub CLI**:
   ```bash
   gh issue edit <number> --body "<nouveau_contenu>"
   ````

   f. **Ajuster labels si nécessaire**:
   - Ajouter `priority-p0`, `priority-p1`, `priority-p2` selon analyse
   - Ajouter `blocked` si bloquée
   - Ajouter `in-progress` si en cours

3. **Créer issues manquantes critiques** (si pas déjà fait):
   - Vérifier si issues pour features core existent
   - Créer si manquantes (Migrations, Profils Traders, Signaux, Follow, etc.)

---

### 📊 Phase 4: Calculate Progress

**Objectif**: Calculer précisément l'avancement du projet basé sur l'analyse complète des issues.

**Actions**:

1. **Compter les issues par statut RÉEL**:
   - Total issues (open + closed après réouvertures)
   - Completed (state: closed ET vraiment 100% complète selon analyse Phase 3)
   - In Progress (state: open ET dans body: "Status: ⏳")
   - Blocked (state: open ET dans body: "Status: ⚠️")
   - Not Started (state: open ET dans body: "Status: ❌")
   - Reopened (issues réouvertes pendant l'audit)

2. **Calculer pourcentage global**:

   ```
   Progress = (Completed + 0.5 * InProgress) / Total * 100
   ```

3. **Calculer par catégorie** (si labels présents):
   - phase-1 (Base de données & Config)
   - phase-2 (Paiement Crypto)
   - phase-3 (Système Signaux Trading)
   - Autre

4. **Estimer jours restants**:
   - Sommer estimations issues restantes
   - Diviser par vélocité estimée (issues/jour)

5. **Générer progress bar visuelle**:
   ```
   ████████░░ 80%
   ```

---

### 📋 Phase 5: Generate Comprehensive Report

**Objectif**: Fournir un rapport clair, structuré et actionnable.

**Format du rapport** (à afficher à l'utilisateur):

````markdown
# 🎯 MyCryptoPilot - Project Audit Report

**Date**: <DATE_ACTUELLE>
**Generated by**: /project-audit command
**Duration**: <temps_execution>

---

## 📊 Progress Overview

### Global Progress

<PROGRESS_BAR_VISUELLE> **<XX>%**

- ✅ **Completed**: <N> issues (<XX>%)
- ⏳ **In Progress**: <N> issues (<XX>%)
- ⚠️ **Blocked**: <N> issues
- ❌ **Not Started**: <N> issues (<XX>%)
- **Total**: <N> issues

### Progress by Phase

- **Phase 1 (Base & Config)**: <PROGRESS_BAR> <XX>%
- **Phase 2 (Crypto Payments)**: <PROGRESS_BAR> <XX>%
- **Phase 3 (Trading Signals)**: <PROGRESS_BAR> <XX>%

### 🔄 Issues Réouvertes Pendant l'Audit

[Si aucune issue réouverte, omettre cette section]

⚠️ **<N> issues ont été réouvertes** car elles étaient marquées comme fermées mais n'étaient pas 100% complètes :

- **#<number> - <Titre>**
  - **Raison réouverture**: <explication>
  - **Ce qui reste à faire**: <liste précise>
  - **Estimation**: <temps>

- **#<number> - <Titre>**
  - ...

✅ **<N> issues fermées ont été vérifiées** et confirmées comme vraiment complètes.

---

## 📋 Status US par US

| #   | Titre                | Status         | Priority | Blocage    | % Done | Estimation Reste |
| --- | -------------------- | -------------- | -------- | ---------- | ------ | ---------------- |
| 1   | [US-01] Branding     | ⏳ In Progress | P2       | -          | 80%    | 0.5j             |
| 2   | [US-02] Structure DB | ⚠️ Blocked     | P0       | Migrations | 90%    | 0.5h             |
| ... | ...                  | ...            | ...      | ...        | ...    | ...              |

**Légende**:

- ✅ Completed
- ⏳ In Progress
- ⚠️ Blocked
- ❌ Not Started

---

## 🧪 Features Testables End-to-End

### ✅ Fully Testable (Production Ready)

1. **Authentification complète**
   - Signup/Signin email/password
   - OAuth (GitHub, Google, Discord)
   - Email verification
   - Password reset
   - ✅ Testable: Oui, parcours complet fonctionnel

2. **[Autre feature]**
   - ...

### ⚠️ Partially Testable (UI Only / Incomplete)

1. **Dashboard User**
   - UI complète ✅
   - Données non connectées ❌
   - ⚠️ Testable: UI seulement, pas de vraies données

2. **[Autre feature]**
   - ...

### ❌ Not Testable (Blocked / Missing)

1. **Création profils traders**
   - Pas de page/formulaire ❌
   - ❌ Testable: Non, feature manquante

2. **[Autre feature]**
   - ...

---

## 🚨 Blocages Critiques (P0)

### 1. 🔴 Migrations Prisma Non Appliquées

- **Impact**: BLOQUE TOUT développement DB
- **Issue**: #<number>
- **Solution**: `npx prisma migrate dev --name init_mycryptopilot`
- **Durée**: 30 minutes
- **URGENT**: À faire IMMÉDIATEMENT

### 2. 🔴 [Autre blocage P0]

- ...

---

## 📊 Breakdown par Catégorie

### Infrastructure & Config

- ✅ Completed: <N> / <Total>
- Features: Next.js, Prisma, Auth, Site Config
- Status: <XX>% done

### Core Features (MVP)

- ✅ Completed: <N> / <Total>
- Features: Traders, Signals, Follow, Dashboards
- Status: <XX>% done

### Crypto Payments

- ✅ Completed: <N> / <Total>
- Features: Address Gen, Watcher, UI Checkout
- Status: <XX>% done

### Premium Features

- ✅ Completed: <N> / <Total>
- Features: Journal, Risk Console, Screeners
- Status: <XX>% done

---

## 🎯 Next Steps Recommandés

### 🔴 Priorité P0 (URGENT - Bloque MVP)

1. **#<number> - Migrations Prisma** (30 min)
   - Générer et appliquer migrations
   - Débloquer toutes les features DB

2. **#<number> - Profils Traders** (2-3 jours)
   - Créer formulaire création profil
   - Server actions create/update
   - Essentiel pour signaux

3. **[Autre P0]**
   - ...

### 🟡 Priorité P1 (Important - MVP Core)

1. **#<number> - Système Signaux** (5-7 jours)
   - Formulaire création signal
   - Composant TradingCard
   - Feed signaux

2. **[Autre P1]**
   - ...

### 🟢 Priorité P2 (Nice to Have - Post-MVP)

1. **#<number> - Landing Page Adaptation** (1-2 jours)
   - Adapter sections reviews/features
   - Screenshots app

2. **[Autre P2]**
   - ...

---

## 💡 Tips, Conseils & Observations

### 🏗️ Architecture

**✅ Points Forts**:

- <Observation positive 1>
- <Observation positive 2>

**⚠️ Points d'Attention**:

- <Observation/conseil 1 avec justification>
- <Observation/conseil 2 avec justification>

**💡 Recommandations**:

- <Conseil actionnable 1>
- <Conseil actionnable 2>

### 🔧 Dev Process

**✅ Ce qui fonctionne bien**:

- <Élément positif>

**⚠️ À améliorer**:

- <Suggestion 1>
- <Suggestion 2>

**💡 Suggestions**:

- <Conseil process dev>

### 📝 Code Quality

**Analyse**:

- TypeScript strict: <Oui/Non>
- TODOs count: <N> (<catégorisation>)
- Tests coverage: <estimation>
- Build status: <✅❌>

**Recommandations**:

- <Conseil code quality 1>
- <Conseil code quality 2>

### 🧪 Testing Strategy

**État actuel**:

- Unit tests: <présents/absents>
- E2E tests: <présents/absents>
- Coverage: <estimation>

**Recommandations**:

- <Conseil testing 1>
- <Conseil testing 2>
- Prioriser tests pour: <features critiques>

### 📚 Documentation

**État**:

- README: <score/10>
- ANALYSIS: <score/10>
- CLAUDE.md: <score/10>
- Inline comments: <score/10>

**Recommandations**:

- <Conseil doc 1>
- <Conseil doc 2>

### ⚡ Performance

**Observations**:

- <Analyse perf si applicable>

**Suggestions**:

- <Conseil perf si applicable>

### 🔒 Security

**Checks**:

- Secrets en clair: <✅❌>
- Env vars: <gestion correcte?>
- Auth: <sécurisée?>

**Recommandations**:

- <Conseil sécurité 1>
- <Conseil sécurité 2>

### 🎨 UX/UI

**Points forts**:

- <Élément UX positif>

**Améliorations possibles**:

- <Suggestion UX 1>
- <Suggestion UX 2>

### 🔄 CI/CD & DevOps

**État**:

- CI configurée: <Oui/Non>
- Déploiement: <status>

**Suggestions**:

- <Conseil DevOps>

---

## 📈 Velocity & Timeline

### Estimation Completion

**Basé sur**:

- Issues restantes: <N>
- Effort total restant: <N> jours/homme
- Vélocité estimée: <X> issues/semaine

**Timeline estimée**:

- MVP Core (P0+P1): <N> semaines
- Full MVP (incl. P2): <N> semaines
- Production Ready: <N> semaines

**Hypothèses**:

- 1 dev full-time
- Pas de bloqueurs majeurs après migrations
- Vélocité constante

---

## 🎓 Key Learnings & Patterns

### Patterns Observés

1. <Pattern 1 dans le code/architecture>
2. <Pattern 2>

### Best Practices Appliquées

1. <Best practice 1>
2. <Best practice 2>

### Leçons du Projet

1. <Learning 1>
2. <Learning 2>

---

## 📎 Annexes

### Useful Commands

```bash
# Générer migrations
npx prisma migrate dev

# Run dev
pnpm dev

# Run tests
pnpm test:ci

# Build
pnpm build
```
````

### Important Files

- Config: `src/site-config.ts`
- Plans: `src/lib/crypto/mycryptopilot-plans.ts`
- DB Schema: `prisma/schema/`
- Env: `src/lib/env.ts`

### Links

- GitHub: https://github.com/YoannDrx/mycryptopilot
- Issues: https://github.com/YoannDrx/mycryptopilot/issues
- Docs: See .claude/CLAUDE.md

---

**🎉 Fin du Rapport**

_Ce rapport a été généré automatiquement par la commande `/project-audit`._
_Pour toute question ou clarification, consulter les fichiers .md mis à jour ou les issues GitHub enrichies._

```

---

## Contraintes & Guidelines

1. **Utiliser les outils disponibles uniquement**:
   - `Read`, `Glob`, `Grep` pour lire code/docs
   - `Bash` avec `gh` CLI pour GitHub
   - `Edit`, `Write` pour mettre à jour fichiers .md
   - **NE PAS** éditer le code source

2. **Être précis et factuel**:
   - Statuts basés sur analyse réelle du code
   - Estimations réalistes
   - Observations constructives et actionnables

3. **Rapport final lisible**:
   - Markdown bien formaté
   - Emojis pour clarté visuelle
   - Sections bien organisées
   - Tableaux pour données structurées

4. **Observations constructives**:
   - Toujours justifier les conseils
   - Proposer solutions concrètes
   - Équilibrer positif et amélioration

5. **Ne pas être redondant**:
   - Éviter répétitions entre sections
   - Synthétiser intelligemment

---

## Workflow Exécution

Lorsque l'utilisateur lance `/project-audit`:

1. Afficher: "🔍 Démarrage audit complet du projet..."
2. Exécuter Phase 1 (afficher progress: "Phase 1/5: Code Analysis...")
3. Exécuter Phase 2 (afficher progress: "Phase 2/5: Updating ALL documentation files...")
4. Exécuter Phase 3 (afficher progress: "Phase 3/5: Analyzing ALL GitHub issues (open + closed)..." avec compteur)
   - Afficher: "Analyzing issue #X..."
   - Si réouverture: Afficher "⚠️ Reopening issue #X (not complete)"
5. Exécuter Phase 4 (afficher progress: "Phase 4/5: Calculating progress...")
6. Exécuter Phase 5 (afficher: "Phase 5/5: Generating comprehensive report...")
7. Afficher le rapport complet final
8. Résumé: "✅ Audit terminé! Documentation mise à jour (<N> fichiers .md), <N> issues GitHub analysées, <N> issues réouvertes, <N> issues enrichies."

**Durée totale estimée**: 5-15 minutes selon taille du projet et nombre d'issues.
```
