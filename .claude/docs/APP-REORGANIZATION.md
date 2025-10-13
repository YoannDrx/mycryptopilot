# 🔄 App Reorganization: Trading / School / Tax

**Date de début:** 13 octobre 2025
**Branch:** `feature/app-reorganization-3-sections`
**Status:** 🟡 En cours

---

## 📋 Objectif Global

Réorganiser l'application MyCryptoPilot en **3 sections distinctes**:
1. **Trading** - Signaux, Dashboard, Marketplace
2. **Crypto School** - Formation, Cours, Quiz, Progression
3. **Tax & Declaration** - Import CSV, Rapports fiscaux, Export

---

## 🎯 Architecture Cible

```
app/orgs/[orgSlug]/(navigation)/
├── _navigation/                    # ✅ Layout partagé (existant)
│   ├── org-navigation.tsx
│   ├── org-sidebar.tsx
│   ├── org-command.tsx
│   └── org-navigation.links.ts    # 🔄 À METTRE À JOUR
│
├── (trading)/                      # 📦 PHASE 1 - En cours
│   ├── dashboard/
│   ├── trader/
│   ├── traders/
│   ├── signals/
│   └── pricing/
│
├── (school)/                       # 📦 PHASE 2 - À faire
│   ├── courses/
│   ├── lessons/[id]/
│   ├── progress/
│   └── certificates/
│
└── (tax)/                          # 📦 PHASE 3 - À faire
    ├── import/
    ├── reports/
    ├── history/
    └── export/
```

---

## ✅ Phase 1: Restructuration & Trading (EN COURS)

### Étape 1.1: Lecture & Analyse ✅
- [x] Lire `org-navigation.links.ts`
- [x] Lire `org-sidebar.tsx`
- [x] Lire `org-command.tsx`
- [x] Identifier doublons (account/settings)
- [x] Créer document de suivi

### Étape 1.2: Nettoyage Doublons 🔄
- [ ] Supprimer `/app/orgs/[orgSlug]/(navigation)/account/` (vide)
- [ ] Supprimer `/app/orgs/[orgSlug]/(navigation)/settings/` (B2B legacy)
- [ ] Vérifier qu'aucune import ne casse

### Étape 1.3: Créer Structure Trading 🔄
- [ ] Créer dossier `(trading)/`
- [ ] Déplacer `dashboard/` → `(trading)/dashboard/`
- [ ] Déplacer `traders/` → `(trading)/traders/`
- [ ] Déplacer `signals/` → `(trading)/signals/`
- [ ] Déplacer `pricing/` → `(trading)/pricing/`
- [ ] Créer `(trading)/layout.tsx`

### Étape 1.4: Mise à Jour Navigation 🔄
- [ ] Mettre à jour `org-navigation.links.ts` (3 groupes)
- [ ] Tester navigation sidebar
- [ ] Tester cmd+k search
- [ ] Vérifier breadcrumbs

---

## 📦 Phase 2: Crypto School (À FAIRE)

### Étape 2.1: Structure de Base
- [ ] Créer dossier `(school)/`
- [ ] Créer `(school)/layout.tsx`
- [ ] Créer pages placeholder:
  - [ ] `courses/page.tsx` (catalogue)
  - [ ] `progress/page.tsx` (suivi)
  - [ ] `certificates/page.tsx` (badges)

### Étape 2.2: Modèles DB (Plus tard)
- [ ] Créer schémas Prisma (Chapter, Lesson, Progress, Quiz)
- [ ] Migration DB
- [ ] Seed données test

### Étape 2.3: Pages & Composants
- [ ] Page catalogue cours
- [ ] Page leçon individuelle
- [ ] Composant quiz
- [ ] Page progression

---

## 📦 Phase 3: Tax & Declaration (À FAIRE)

### Étape 3.1: Structure de Base
- [ ] Créer dossier `(tax)/`
- [ ] Créer `(tax)/layout.tsx`
- [ ] Créer pages placeholder:
  - [ ] `import/page.tsx` (upload CSV)
  - [ ] `reports/page.tsx` (rapports)
  - [ ] `history/page.tsx` (historique)

### Étape 3.2: Parser CSV (Plus tard)
- [ ] Parser Binance CSV
- [ ] Parser Bybit CSV
- [ ] Validation Zod
- [ ] Tests unitaires

### Étape 3.3: Calculs & Rapports
- [ ] Algorithme FIFO
- [ ] Calcul PnL
- [ ] Génération rapport
- [ ] Export PDF/MD

---

## 🚨 Checklist Nettoyage

### Doublons Identifiés
- [x] `/app/orgs/[orgSlug]/(navigation)/account/following/` (vide) → À SUPPRIMER
- [ ] `/app/orgs/[orgSlug]/(navigation)/settings/` (B2B legacy) → À SUPPRIMER
- [x] `/app/(logged-in)/(account-layout)/account/` (standalone) → À GARDER

### Liens à Vérifier
- [ ] Tous les `Link href` dans les composants
- [ ] Redirections dans actions/routes
- [ ] Tests e2e avec anciens chemins

---

## 📊 Progression Globale

| Phase | Tâches | Complétées | Status |
|-------|---------|------------|---------|
| Phase 1: Trading | 10 | 5 | 🟡 50% |
| Phase 2: School | 8 | 0 | ⚪ 0% |
| Phase 3: Tax | 8 | 0 | ⚪ 0% |
| **TOTAL** | **26** | **5** | **🟡 19%** |

---

## 📝 Notes & Décisions

### Décision 1: Gestion Account/Settings
**Problème:** Doublon entre `/account` et `/orgs/[orgSlug]/settings`

**Décision:**
- ✅ Garder `/account` (standalone, hors org)
- ❌ Supprimer `/settings` dans orgs (inutile en B2C)
- 🔗 Ajouter lien "Settings" dans sidebar → `/account`

**Raison:** App B2C (1 user = 1 org), pas besoin de settings par org.

### Décision 2: Route Groups
**Choix:** Utiliser route groups `(trading)`, `(school)`, `(tax)`

**Avantages:**
- Isolation logique
- Layouts spécifiques par section
- URL non affectées (pas de `/trading/` dans l'URL)

### Décision 3: Navigation
**Choix:** 3 groupes collapsibles dans sidebar

**Implémentation:**
- Garder `OrgSidebar` actuel
- Mettre à jour `ORGANIZATION_LINKS` avec 3 groupes
- `OrgCommand` (cmd+k) liste automatiquement les nouveaux liens

---

## 🔧 Commandes Utiles

```bash
# Développement
pnpm dev

# Type checking
pnpm ts

# Linting
pnpm lint

# Tests
pnpm test:ci

# DB
npx prisma studio
npx prisma migrate dev
```

---

## 📅 Prochaines Étapes

### Immédiat (Phase 1)
1. ✅ Créer ce document de suivi
2. 🔄 Supprimer doublons account/settings
3. 🔄 Créer structure `(trading)/`
4. 🔄 Déplacer pages existantes
5. 🔄 Mettre à jour navigation links

### Court terme (Phase 2 & 3)
1. Créer structures `(school)/` et `(tax)/`
2. Pages placeholder
3. Layouts spécifiques
4. Tests navigation

### Moyen terme (Implémentation)
1. Modèles DB School
2. Parser CSV Tax
3. Logique métier
4. Tests e2e

---

**Dernière mise à jour:** 13 octobre 2025 - 19:00
**Prochaine action:** Supprimer doublons et créer structure Trading
