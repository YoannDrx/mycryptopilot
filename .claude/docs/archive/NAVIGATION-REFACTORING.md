# 🎯 Navigation Refactoring : 4 Espaces avec Sidebars Dédiées

**Date de début** : 13 octobre 2025 (21h00)
**Date de fin** : 14 octobre 2025
**Branch** : `feature/app-reorganization-3-sections`
**Status** : ✅ Complété à 100%

---

## 📋 Objectif

Réorganiser la navigation de MyCryptoPilot en **4 espaces indépendants** avec leurs **propres sidebars dédiées** :

1. **Trading** → Sidebar avec 6 liens Trading uniquement
2. **Crypto School** → Sidebar avec 2 liens School uniquement
3. **Tax & Declaration** → Sidebar avec 2 liens Tax uniquement
4. **Account Settings** → Sidebar avec 5 liens Account uniquement

Chaque espace est accessible via le **menu contextuel** (dropdown user) et possède un **search global** (cmd+k).

---

## 🏗️ Architecture Implémentée

```
app/orgs/[orgSlug]/(navigation)/
├── layout.tsx                      # ✅ Layout parent (minimal)
├── _navigation/                    # ✅ Composants partagés
│   ├── global-search-command.tsx   # ✅ Search cmd+k (4 espaces)
│   ├── base-sidebar-layout.tsx     # ✅ Wrapper layout
│   ├── org-navigation.links.ts     # ✅ Tous les liens (search)
│   ├── org-breadcrumb.tsx          # ✅ Réutilisé
│   ├── orgs-select.tsx             # ✅ Réutilisé
│   └── upgrade-org-card.tsx        # ✅ Réutilisé
│
├── (trading)/                      # ✅ Espace Trading
│   ├── layout.tsx                  # ✅ Layout avec TradingSidebar
│   ├── _navigation/
│   │   ├── trading-sidebar.tsx     # ✅ Sidebar Trading
│   │   └── trading-links.ts        # ✅ 6 liens Trading
│   ├── dashboard/
│   ├── signals/
│   ├── traders/
│   └── pricing/
│
├── (school)/                       # ✅ Espace School
│   ├── layout.tsx                  # ✅ Layout avec SchoolSidebar
│   ├── _navigation/
│   │   ├── school-sidebar.tsx      # ✅ Sidebar School
│   │   └── school-links.ts         # ✅ 2 liens School
│   ├── courses/
│   └── progress/
│
├── (tax)/                          # ✅ Espace Tax
│   ├── layout.tsx                  # ✅ Layout avec TaxSidebar
│   ├── _navigation/
│   │   ├── tax-sidebar.tsx         # ✅ Sidebar Tax
│   │   └── tax-links.ts            # ✅ 2 liens Tax
│   ├── import/
│   └── reports/
│
└── (account)/                      # ✅ Espace Account
    ├── layout.tsx                  # ✅ Layout avec AccountSidebar
    ├── _navigation/
    │   ├── account-sidebar.tsx     # ✅ Sidebar Account
    │   └── account-links.ts        # ✅ 5 liens Account
    ├── page.tsx                    # ✅ Déplacé (profile)
    ├── discord/                    # ✅ Déplacé
    ├── email/                      # ✅ Déplacé
    ├── following/                  # ✅ Déplacé
    ├── become-trader/              # ✅ Déplacé
    ├── change-email/               # ✅ Déplacé
    ├── change-password/            # ✅ Déplacé
    └── danger/                     # ✅ Déplacé
```

---

## ✅ Tâches Complétées

### Phase 1 : Composants Partagés ✅

**1.1. `global-search-command.tsx`** (30min)

- Composant de search global (cmd+k)
- Affiche tous les liens des 4 espaces groupés par section
- Réutilisé dans les 4 sidebars

**1.2. `base-sidebar-layout.tsx`** (15min)

- Layout wrapper partagé
- Contient : SidebarProvider + SidebarInset + Header + Breadcrumb
- Évite la duplication de code entre les 4 layouts

---

### Phase 2 : Trading Space ✅

**2.1. `trading-links.ts`** (10min)

- 6 liens Trading :
  - Dashboard (home)
  - My Trading Dashboard
  - Signals Feed
  - Traders Marketplace
  - Pricing & Plans
  - Trader Dashboard

**2.2. `trading-sidebar.tsx`** (20min)

- Sidebar dédiée Trading
- Affiche uniquement les 6 liens Trading
- Contient : OrgsSelect + GlobalSearch + Links + Footer

**2.3. `trading/layout.tsx`** (10min)

- Layout Trading avec TradingSidebar
- Récupère org + userOrgs + allLinks pour le search

---

### Phase 3 : School Space ✅

**3.1. `school-links.ts`** (10min)

- 2 liens School :
  - Courses
  - My Progress

**3.2. `school-sidebar.tsx`** (20min)

- Sidebar dédiée School
- Affiche uniquement les 2 liens School

**3.3. `school/layout.tsx`** (10min)

- Layout School avec SchoolSidebar

---

### Phase 4 : Tax Space ✅

**4.1. `tax-links.ts`** (10min)

- 2 liens Tax :
  - Import Transactions (FileUp icon)
  - Tax Reports (FileText icon)

**4.2. `tax-sidebar.tsx`** (20min)

- Sidebar dédiée Tax
- Affiche uniquement les 2 liens Tax

**4.3. `tax/layout.tsx`** (10min)

- Layout Tax avec TaxSidebar

---

### Phase 5 : Account Space ✅

**5.1. Déplacement pages Account** (1h)

- Copié `/app/(logged-in)/(account-layout)/account/` vers `/app/orgs/[orgSlug]/(navigation)/(account)/`
- 11 pages déplacées :
  - page.tsx (settings principal)
  - (settings)/ folder
  - discord/
  - email/
  - following/
  - become-trader/
  - change-email/
  - change-password/
  - danger/

**5.2. `account-links.ts`** (10min)

- 5 liens Account :
  - Profile
  - Discord Integration
  - Email Preferences
  - Following
  - Danger Zone

**5.3. `account-sidebar.tsx`** (20min)

- Sidebar dédiée Account
- Affiche uniquement les 5 liens Account

**5.4. `account/layout.tsx`** (10min)

- Layout Account avec AccountSidebar
- Remplace l'ancien layout Settings

---

### Phase 6 : Mise à Jour Navigation Links ✅

**6.1. Correction routes School/Tax** (15min)

- ❌ Avant : `/school/courses`, `/school/progress`, `/tax/import`, `/tax/reports`
- ✅ Après : `/courses`, `/progress`, `/import`, `/reports`
- Ajout icône FileUp pour Import Transactions

**6.2. Ajout liens Account** (10min)

- Ajouté groupe "Account" dans `org-navigation.links.ts`
- 5 liens Account avec icônes appropriées

**Fichier** : `_navigation/org-navigation.links.ts`

```typescript
export const ORGANIZATION_LINKS: NavigationGroup[] = [
  { title: "Home", links: [Dashboard] },           // 1 lien
  { title: "Trading", links: [...] },              // 6 liens
  { title: "Crypto School", links: [...] },        // 2 liens
  { title: "Tax & Declaration", links: [...] },    // 2 liens
  { title: "Account", links: [...] },              // 5 liens (nouveau)
];
```

---

## ✅ Phase 7 : User Dropdown - Complétée

**Objectif** : Remplacer les 2 boutons actuels par 4 boutons (Trading, School, Tax, Account)

**Fichier** : `src/features/auth/user-dropdown.tsx`

**Avant** :

```tsx
<DropdownMenuItem href="/orgs">Dashboard</DropdownMenuItem>
<DropdownMenuItem href="/account">Account Settings</DropdownMenuItem>
```

**Après** (à implémenter) :

```tsx
<DropdownMenuItem href="/orgs/{slug}/dashboard">Trading</DropdownMenuItem>
<DropdownMenuItem href="/orgs/{slug}/courses">Crypto School</DropdownMenuItem>
<DropdownMenuItem href="/orgs/{slug}/import">Tax & Declaration</DropdownMenuItem>
<DropdownMenuItem href="/orgs/{slug}/account">Account Settings</DropdownMenuItem>
```

**Solution** : Utilisation du hook `useCurrentOrg()` pour récupérer dynamiquement le slug.

**Changements**:

- Ajout import `useCurrentOrg` depuis `@app/orgs/[orgSlug]/use-current-org`
- Construction dynamique du `basePath` basé sur `currentOrg?.slug`
- Remplacement des 4 liens avec les bonnes routes
- Icônes mises à jour (BarChart3, BookOpen, FileText, User2)

---

## ✅ Phase 8 : Simplifier Layout Parent - Complétée

**Objectif** : Rendre le layout parent minimal

**Fichier** : `app/orgs/[orgSlug]/(navigation)/layout.tsx`

**Changement** : Layout simplifié à `<>{props.children}</>` puisque chaque espace gère maintenant sa propre sidebar.

## ✅ Phase 9 : Nettoyer Fichiers Obsolètes - Complétée

**Fichiers supprimés**:

- ✅ Supprimé `/app/(logged-in)/(account-layout)/` (tout le dossier - 25 fichiers)
- ✅ Supprimé `_navigation/org-navigation.tsx` (remplacé par layouts individuels)
- ✅ Supprimé `_navigation/org-sidebar.tsx` (remplacé par sidebars individuelles)
- ✅ Supprimé `_navigation/org-command.tsx` (remplacé par global-search-command.tsx)

## ✅ Phase 10 : Mettre à Jour Routes Account - Complétée

**Fichiers corrigés**:

- ✅ `edit-profile-form.tsx` - Liens vers change-email/change-password mis à jour
- ✅ `trader-mode-toggle.tsx` - Liens vers become-trader mis à jour
- ✅ `discord/page.tsx` - Redirect vers `/orgs/${slug}/account/discord` mis à jour
- ✅ `org-list.tsx`, `new/page.tsx`, `not-found.tsx` - Suppression imports AccountNavigation

## ✅ Phase 11 : Tests - Complétés

**Tests exécutés**:

- ✅ `pnpm ts` - TypeScript compilation **PASSED** ✓
- ✅ `pnpm build` - Next.js build **PASSED** ✓
- ✅ Warnings ESLint corrigés (orgSlug, Settings imports non utilisés)
- ✅ NavigationLink exporté depuis navigation.type.ts

## ✅ Phase 12 : Fix Dashboard Principal

**Problème détecté** : La page `/orgs/[orgSlug]` n'affichait plus de sidebar

**Solution** : Déplacé les fichiers du dashboard principal dans `(trading)/`:

- ✅ Déplacé `page.tsx` vers `(trading)/page.tsx`
- ✅ Déplacé `information-cards.tsx` vers `(trading)/`
- ✅ Déplacé `subscribers-charts.tsx` vers `(trading)/`

La page est maintenant accessible avec la TradingSidebar comme prévu.

---

## 📊 Progression Globale

| Phase                          | Tâches | Complétées | Status      |
| ------------------------------ | ------ | ---------- | ----------- |
| Phase 1: Composants partagés   | 2      | 2          | 🟢 100%     |
| Phase 2: Trading space         | 3      | 3          | 🟢 100%     |
| Phase 3: School space          | 3      | 3          | 🟢 100%     |
| Phase 4: Tax space             | 3      | 3          | 🟢 100%     |
| Phase 5: Account space         | 4      | 4          | 🟢 100%     |
| Phase 6: Navigation links      | 2      | 2          | 🟢 100%     |
| Phase 7: User dropdown         | 1      | 1          | 🟢 100%     |
| Phase 8: Simplifier layout     | 1      | 1          | 🟢 100%     |
| Phase 9: Nettoyer fichiers     | 1      | 1          | 🟢 100%     |
| Phase 10: Mettre à jour routes | 1      | 1          | 🟢 100%     |
| Phase 11: Tests                | 4      | 4          | 🟢 100%     |
| Phase 12: Fix dashboard        | 1      | 1          | 🟢 100%     |
| **TOTAL**                      | **26** | **26**     | **🟢 100%** |

---

## 🎨 Résultat Attendu

### Menu Contextuel (dropdown user)

```
┌─────────────────────────────┐
│ Nnayo                        │
│ yoann.andrieux@gmail.com     │
├─────────────────────────────┤
│ 📊 Trading              →   │ /orgs/myorg/dashboard
│ 🎓 Crypto School        →   │ /orgs/myorg/courses
│ 📄 Tax & Declaration    →   │ /orgs/myorg/import
│ ⚙️  Account Settings     →   │ /orgs/myorg/account
├─────────────────────────────┤
│ 🌙 Theme                 >   │
│ 🚪 Logout                →   │
└─────────────────────────────┘
```

### Search Global (cmd+k) - Identique dans les 4 espaces

```
🔍 Search...

Home
  → Dashboard

Trading
  → My Trading Dashboard
  → Signals Feed
  → Traders Marketplace
  → Pricing & Plans
  → Trader Dashboard

Crypto School
  → Courses
  → My Progress

Tax & Declaration
  → Import Transactions
  → Tax Reports

Account
  → Profile
  → Discord Integration
  → Email Preferences
  → Following
  → Danger Zone
```

### Sidebar Trading (exemple)

```
┌────────────────────────┐
│ [OrgsSelect]           │
│ 🔍 Search... (cmd+k)   │
├────────────────────────┤
│ 🏠 Dashboard           │
│ 📊 My Trading Dashboard│
│ 📈 Signals Feed        │
│ 👥 Traders Marketplace │
│ 💰 Pricing & Plans     │
│ 📊 Trader Dashboard    │
├────────────────────────┤
│ [Upgrade Card]         │
│ [Feedback]             │
│ [User Button]          │
└────────────────────────┘
```

---

## 🔍 Points d'Attention

### 1. orgSlug dans user-dropdown

**Problème** : Le user-dropdown est un client component, il faut récupérer le slug de l'org courante.

**Solutions possibles** :

- Via `useSession()` si le slug est stocké dans la session
- Via un custom hook `useCurrentOrg()`
- Via context React

### 2. Imports circulaires

**Attention** : `global-search-command.tsx` importe les links de chaque espace.
Vérifier qu'il n'y a pas de cycles d'imports.

### 3. Account routes

**Important** : Mettre à jour tous les liens `/account` vers `/orgs/{slug}/account` dans :

- Components (Link href)
- Server actions (redirect)
- Forms (action)

### 4. Tests e2e

Si des tests Playwright existent pour `/account`, les mettre à jour vers la nouvelle route.

---

## 📝 Décisions Techniques

### Pourquoi 4 layouts séparés ?

**Option choisie** : 4 layouts indépendants (Trading, School, Tax, Account)

**Avantages** :

- ✅ Isolation complète des espaces
- ✅ Chaque layout gère sa propre sidebar
- ✅ Facile à maintenir et étendre
- ✅ Pas de logique conditionnelle

**Alternative rejetée** : 1 layout parent avec sidebar conditionnelle (basée sur pathname)

- ❌ Logique fragile
- ❌ Difficile à maintenir

### Pourquoi un search global ?

**Décision** : Le search (cmd+k) affiche tous les liens des 4 espaces

**Raison** :

- Pattern moderne (Notion, Linear, VS Code)
- Navigation rapide entre espaces
- Découverte des features

### Pourquoi garder tout sous `/orgs/[orgSlug]/` ?

**Décision** : Toutes les pages restent sous `/orgs/[orgSlug]/...`

**Raisons** :

- Cohérence totale
- Compatible avec Better Auth orgs
- Moins de refactoring
- 1 user = 1 org → slug transparent pour l'utilisateur

---

## 🚀 Prochaines Étapes

1. ✅ Terminer user-dropdown (récupérer orgSlug + 4 boutons)
2. ✅ Simplifier layout parent
3. ✅ Nettoyer fichiers obsolètes
4. ✅ Mettre à jour routes Account dans les pages
5. ✅ Tests TypeScript + Build
6. ✅ Test manuel complet

---

**Dernière mise à jour** : 13 octobre 2025 - 23:30
**Temps total estimé** : 7-8h
**Temps écoulé** : ~5h
**Temps restant** : ~2-3h
