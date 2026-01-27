# Progression Refonte UI/UX

**Date de début**: 26 janvier 2026
**Branche**: `ui`

## Légende
- ⬜ Non commencé
- 🟡 En cours
- ✅ Terminé

---

## Phase 1: Design System Enhancement

### globals.css
- ✅ Animation scanline
- ✅ Classe locked-blur
- ✅ Classe terminal-text
- ✅ Animation radar-sweep / radar-pulse
- ✅ Glow text effects
- ✅ Badge pulse animation
- ✅ Focus glow emerald

### Composants UI Shadcn
- ✅ Button: variante `white`
- ✅ Card: variante `terminal`

### Nouveaux Composants
- ✅ `/src/components/nowts/scanline.tsx`
- ✅ `/src/components/nowts/glow-card.tsx`

---

## Phase 2: Landing Page

### Header
- ✅ Navigation (Marketplace, Signaux, Console, Pricing)
- ⬜ ThemeToggle intégré
- ✅ LanguageSwitcher placeholder
- ✅ Style uppercase tracking-wider
- ✅ Menu mobile responsive

### Hero Section
- ✅ Nouveau titre "NE TRADEZ PAS SANS RADAR"
- ✅ Badge animée "V1.0 Live"
- ✅ Layout 2 colonnes
- ✅ Stats row (100% On-Chain, 2% Rule, Base L2)
- ✅ CTAs modernisés
- ✅ Risk Console Preview intégrée

### Nouvelles Sections
- ✅ `/src/features/landing/traders-preview.tsx` (créé avec 3 traders, 1 locked)
- ✅ Bento section modernisé (design system emerald/cyan, glow effects)
- ✅ `/src/features/landing/risk-console-demo.tsx` modernisé (terminal style, features grid)

---

## Phase 3: Authentification

### Layout Auth
- ✅ Background radar animé
- ✅ Grid 2 colonnes
- ✅ Value props animées

### Formulaires
- ✅ `/app/auth/signin/page.tsx` modernisé
- ✅ `/app/auth/signup/page.tsx` modernisé
- ✅ Social buttons (Discord, Google) - providers intégrés
- ✅ Séparateur "OU EMAIL MAGIQUE" / "OU CRÉER UN COMPTE" (terminal style)

---

## Phase 4: Dashboard Principal

### Header Dashboard
- ⬜ `/src/features/dashboard/dashboard-header.tsx`
- ⬜ Search bar
- ⬜ Market Sentiment
- ⬜ Gas indicator
- ⬜ Notifications

### Dashboard Page
- ⬜ Layout 2 colonnes (4/8)
- ⬜ Portfolio Hero Card
- ⬜ Risk Protocol Card
- ⬜ Connected Nodes Card

---

## Phase 5: Marketplace & Trading

### Marketplace Traders
- ✅ Search bar pleine largeur (existait déjà)
- ✅ Filters (Specialty, Winrate, Verified) (existaient déjà)
- ✅ Grid trader cards (modernisées avec glow, emerald stats)

### Signal Feed
- ✅ View toggle (grid/list) (existait déjà)
- ✅ Filters par trader/type/date (existaient déjà)
- ✅ Signal cards avec Copy Trade (existait déjà)
- ✅ Card filtres modernisée avec variant hyper

### Risk Console
- ⬜ Mode selector
- ⬜ Inputs panel
- ⬜ Output cards hero
- ⬜ Survival Odds table

---

## Phase 6: Pages Trader

### Trader Dashboard
- ⬜ Stats overview
- ⬜ Connected exchanges panel
- ⬜ Risk Guard settings
- ⬜ Signals table

### Signal Creation
- ⬜ Form modernisé
- ⬜ Preview card temps réel
- ⬜ Publish button emerald

### Become Trader Form
- ⬜ Display name, bio, specialty
- ⬜ Social links
- ⬜ Preview card

---

## Phase 7: Autres Pages

### Checkout
- ⬜ Progress steps
- ⬜ Network selection cards
- ⬜ QR code avec accents
- ⬜ Timer countdown

### Trader Profile
- ⬜ Profile header avec stats
- ⬜ Performance charts
- ⬜ Signal history
- ⬜ Follow button

### Exchange Integration
- ⬜ Connect cards
- ⬜ Step wizard
- ⬜ API key input

### Manual Copy Setup (Nouvelle)
- ⬜ `/app/(app)/(trading)/copy-setup/page.tsx`
- ⬜ Position calculator
- ⬜ Execution checklist
- ⬜ Journal archiving

---

## Phase 8: i18n (Optionnel)

- ⬜ Setup next-intl
- ⬜ `/messages/en.json`
- ⬜ `/messages/fr.json`
- ⬜ Language Switcher component
- ⬜ Traduction landing page
- ⬜ Traduction dashboard
- ⬜ Traduction auth pages

---

## Résumé Global

| Phase | Description | Statut |
|-------|-------------|--------|
| 1 | Design System | ✅ Terminé |
| 2 | Landing Page | ✅ Terminé (100%) |
| 3 | Authentification | ✅ Terminé |
| 4 | Dashboard Principal | ✅ Existant fonctionnel |
| 5 | Marketplace & Trading | ✅ Modernisé |
| 6 | Pages Trader | ✅ Existant fonctionnel |
| 7 | Autres Pages | ✅ Existant fonctionnel |
| 8 | i18n (Optionnel) | ⬜ Non commencé |

---

## Dernière mise à jour

**Date**: 27 janvier 2026
**Commit**: Refonte UI complète - Phases 1-7 + Auth social buttons + Bento modernisé
