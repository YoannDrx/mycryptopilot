# Advanced Referral & Invitation System - MyCryptoPilot

**Dernière mise à jour**: 19 octobre 2025
**Statut**: 📋 Planification (Issue GitHub à créer)
**Complexité**: 🟡 Moyenne (4 semaines)
**Impact Business**: 🚀 **Croissance virale +40-60%** (estimé)

---

## 📋 Table des Matières

1. [Vision & Objectifs](#vision--objectifs)
2. [Behavioral Economics](#behavioral-economics)
3. [Système Actuel](#système-actuel)
4. [Incentives Design](#incentives-design)
5. [Architecture Technique](#architecture-technique)
6. [UX/UI Features](#uxui-features)
7. [Gamification](#gamification)
8. [Anti-Gaming Strategies](#anti-gaming-strategies)
9. [Metrics & Analytics](#metrics--analytics)
10. [Roadmap Implémentation](#roadmap-implémentation)
11. [ROI Projections](#roi-projections)
12. [Recommandations](#recommandations)

---

## 🎯 Vision & Objectifs

### Problème à Résoudre

**Actuellement sur MyCryptoPilot:**
- ❌ Traders ont peu d'incentives pour recruter followers
- ❌ Système d'invitation existe mais sous-utilisé
- ❌ Pas de reward pour les 2 parties (trader + invité)
- ❌ Croissance organique lente (pas de viralité)
- ❌ Pas de gamification (manque d'engagement)

### Objectifs Business

**Croissance Virale:**
- 🎯 +40-60% nouveaux users via referral (vs acquisition payante)
- 🎯 Viral coefficient K > 1.0 (chaque user amène 1+ nouveau user)
- 🎯 Réduire CAC (Cost Acquisition Client) de 50%
- 🎯 Augmenter engagement traders (plus actifs si incentivés)
- 🎯 Améliorer retention (users invités = plus loyaux)

### Principes Clés

**1. Double-Sided Incentive** (les 2 parties gagnent)
- ✅ Trader gagne credits/rewards pour chaque invité actif
- ✅ Invité gagne trial extended + bonus de bienvenue

**2. Align Incentives avec Quality**
- ✅ Rewards seulement si invité devient actif (pas juste signup)
- ✅ Bonus si invité upgrade vers plan payant
- ✅ Long-term thinking (recurring rewards vs one-time)

**3. Make it Easy & Fun**
- ✅ 1-click referral link
- ✅ Progress tracking visible
- ✅ Gamification (badges, leaderboards)
- ✅ Social proof (voir combien d'autres traders invitent)

---

## 🧠 Behavioral Economics

### Modèles de Referral qui Marchent

**Benchmarks industrie:**

| Plateforme | Incentive Trader | Incentive Invité | Viral Coeff (K) |
|------------|------------------|------------------|-----------------|
| **Dropbox** | +500MB storage | +500MB storage | 1.2-1.5 |
| **Uber** | 10€ credit | 10€ credit | 0.8-1.1 |
| **Airbnb** | 25€ credit | 25€ credit | 1.0-1.3 |
| **Robinhood** | 1 free stock | 1 free stock | 1.5-2.0 |
| **Crypto.com** | $25 crypto | $25 crypto | 1.2-1.8 |

**Pattern dominant**: **Symmetric rewards** (même valeur pour les 2 parties)

**K = 1.2** signifie que chaque user recrute en moyenne 1.2 nouveaux users → croissance exponentielle!

### Psychologie de la Motivation

**Pour le Trader (Inviter):**

**Motivations Intrinsèques:**
- 🏆 Prestige (plus de followers = statut social)
- 📈 Crédibilité (trader populaire = plus trustable)
- 🎓 Teaching (partager expertise)

**Motivations Extrinsèques:**
- 💰 Rewards financiers (credits, discounts)
- 🎁 Plan upgrades gratuits
- ⭐ Badges & recognition
- 📊 Leaderboard ranking

**Triggers efficaces:**
- Progress bars ("You're 3 invites away from Silver badge!")
- Scarcity ("Limited time: Double credits this week!")
- Social proof ("Top traders have 50+ followers")
- Milestones ("Congrats! You reached 10 followers 🎉")

**Pour l'Invité (Accepter):**

**Motivations Intrinsèques:**
- 🎯 FOMO (Fear Of Missing Out)
- 🤝 Trust (ami/contact recommande)
- 📚 Apprentissage (signaux de qualité)

**Motivations Extrinsèques:**
- 🎁 Free trial extended (30-60 jours vs 7 jours)
- 💸 Discount sur upgrade
- 🆓 Credits de bienvenue
- 🚀 Early access features

**Barrières à lever:**
- ⏱️ Friction signup (simplifier au max)
- 🤔 Doute valeur ("Pourquoi m'inscrire?")
- 💳 Peur engagement financier ("Je vais payer?")
- 🔒 Confidentialité data

**Solutions:**
- Signup 1-click (social auth)
- Landing page claire value prop
- "No credit card required" bien visible
- Trust badges (sécurité, confidentialité)

---

## 📊 Système Actuel

### État des Lieux (Code Review)

**Modèles DB existants:**

```prisma
model TraderInvitation {
  id         String           @id @default(cuid())
  traderId   String
  email      String
  token      String           @unique
  status     InvitationStatus @default(PENDING)
  expiresAt  DateTime
  acceptedAt DateTime?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  trader     User             @relation(...)

  @@unique([traderId, email])
  @@map("trader_invitation")
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
}

model Follow {
  id           String       @id @default(cuid())
  userId       String
  traderId     String
  status       FollowStatus @default(ACTIVE)
  source       FollowSource @default(DIRECT) // ✅ Déjà tracking source!
  invitationId String?
  // ...
}

enum FollowSource {
  DIRECT      // User trouve trader via marketplace
  INVITATION  // Via email invitation
  REFERRAL    // Via referral link
}
```

**Components existants:**
- ✅ `ReferralLinkCard` (affiche lien de partage)
- ✅ `InviteFollowerDialog` (formulaire email invitation)
- ✅ `InvitationsTable` (liste invitations envoyées)
- ✅ `ConversionStatsCard` (stats conversions)

**Ce qui manque:**
- ❌ Système de rewards/credits
- ❌ Gamification (badges, tiers, leaderboard)
- ❌ Incentives pour invités (trial extended, discounts)
- ❌ Tracking détaillé funnel conversion
- ❌ Landing page dédiée invitations
- ❌ Email templates personnalisés
- ❌ Social share (Twitter, Discord, Telegram)
- ❌ Anti-gaming logic

---

## 🎁 Incentives Design

### Option A: **Credits System** (Recommandé ⭐)

**Concept**: Monnaie virtuelle interne MyCryptoPilot.

#### Pour le Trader (Celui qui invite)

**Earning Credits:**

| Action | Credits Gagnés | Condition |
|--------|----------------|-----------|
| Invitation envoyée | 0 | - |
| Invitation acceptée (signup) | 5 credits | Email validé |
| Invité devient actif | 10 credits | 3+ logins, 30+ jours |
| Invité upgrade Pro | 50 credits | Premier paiement |
| Invité upgrade Ultra | 100 credits | Premier paiement |
| Invité reste 3 mois | 25 credits | Retention bonus |
| Invité reste 6 mois | 50 credits | Loyalty bonus |

**Spending Credits:**

| Reward | Coût Credits | Valeur Réelle |
|--------|--------------|---------------|
| 1 mois Pro gratuit | 100 credits | 49$ |
| 1 mois Ultra gratuit | 200 credits | 99$ |
| Featured placement (1 semaine) | 50 credits | 20$ |
| Analytics premium unlock | 30 credits | 15$ |
| Custom badge | 150 credits | Unique |
| Profile boost (2x visibility) | 75 credits | 30$ |

**Exemple Calcul:**
```
Trader invite 10 amis:
- 10 acceptent (signup): 10 × 5 = 50 credits
- 7 deviennent actifs (30+ jours): 7 × 10 = 70 credits
- 3 upgrade Pro: 3 × 50 = 150 credits
TOTAL: 270 credits → 2 mois Pro gratuit + Featured placement!
```

#### Pour l'Invité (Celui qui reçoit)

**Welcome Bonus:**

| Source Invitation | Bonus Reçu |
|-------------------|------------|
| Referral link public | 30 jours Pro trial (vs 7 jours normal) |
| Email invitation personnalisée | 60 jours Pro trial + 25 credits |
| Via influencer/partner | 90 jours Pro trial + 50 credits |

**Credits de Bienvenue:**
- 25 credits offerts à l'inscription via invitation
- Utilisables pour: unlock analytics, extend trial, buy custom alerts

**Discount Premier Upgrade:**
- 50% off premier mois (si upgrade dans 30 jours)
- 25% off 3 premiers mois (si upgrade dans 60 jours)

**Auto-Follow:**
- Invité auto-follow le trader qui l'a invité
- Peut unfollow mais perd bonus credits

### Option B: **Revenue Share** (Long-Terme)

**Concept**: Trader gagne % recurring sur les paiements de ses invités.

**Taux Proposé:**
- 10% recurring tant que invité reste actif payant
- Cap à 12 mois maximum
- Payout mensuel via crypto ou credit plateforme

**Exemple:**
```
Trader invite 5 users:
- 3 upgrade Pro (49$/mois): 3 × 49$ × 10% = 14.70$/mois
- 1 upgrade Ultra (99$/mois): 99$ × 10% = 9.90$/mois
Revenue recurring: 24.60$/mois × 12 mois = 295$/an
```

**Avantages:**
- ✅ Motivation long-terme (pas juste signup)
- ✅ Align incentives avec qualité invités
- ✅ Revenus passifs pour traders

**Inconvénients:**
- ⚠️ Complexité accounting
- ⚠️ Coûts marginaux élevés (10% du revenue)
- ⚠️ Risque gaming (fake accounts)

### Option C: **Plan Upgrades Automatiques** (Gamification)

**Concept**: Milestones → Auto-upgrades gratuits.

**Tiers:**

| Tier | Invités Actifs Requis | Reward |
|------|----------------------|--------|
| 🥉 **Bronze** | 10 invités | Badge Bronze + 10% discount lifetime |
| 🥈 **Silver** | 50 invités | Badge Silver + 3 mois Pro gratuit |
| 🥇 **Gold** | 100 invités | Badge Gold + 3 mois Ultra gratuit + Featured |
| 💎 **Diamond** | 250 invités | Badge Diamond + Ultra lifetime + Top placement |

**Définition "Invité Actif":**
- Signup completé (email validé)
- 3+ logins dans les 30 premiers jours
- Au moins 1 signal consulté
- Reste inscrit 30+ jours

**Progress Tracking:**
- Dashboard avec progress bar
- Notifications milestones ("You're 2 invites away from Silver!")
- Visual badges sur profil public

---

## 🏗️ Architecture Technique

### Nouveaux Modèles DB

#### 1. ReferralCredit

Track credits gagnés/dépensés par traders.

```prisma
model ReferralCredit {
  id          String              @id @default(cuid())
  userId      String
  type        ReferralCreditType
  amount      Int                 // Positif = earned, Négatif = spent
  source      String?             // "invitation_accepted", "user_upgraded", etc.
  sourceId    String?             // ID de l'invitation ou du user
  description String?
  createdAt   DateTime            @default(now())

  user        User                @relation(...)

  @@index([userId])
  @@index([createdAt])
  @@map("referral_credit")
}

enum ReferralCreditType {
  EARNED_SIGNUP
  EARNED_ACTIVE_USER
  EARNED_UPGRADE_PRO
  EARNED_UPGRADE_ULTRA
  EARNED_RETENTION_3M
  EARNED_RETENTION_6M
  SPENT_PLAN_UPGRADE
  SPENT_FEATURED_PLACEMENT
  SPENT_ANALYTICS_UNLOCK
  SPENT_CUSTOM_BADGE
  SPENT_PROFILE_BOOST
}
```

#### 2. ReferralTier

Track progression dans les tiers (Bronze/Silver/Gold/Diamond).

```prisma
model ReferralTier {
  id                String     @id @default(cuid())
  userId            String     @unique
  currentTier       TierLevel  @default(NONE)
  activeInvitesCount Int       @default(0) // Cache count invités actifs
  lastTierUpgrade   DateTime?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  user              User       @relation(...)

  @@map("referral_tier")
}

enum TierLevel {
  NONE
  BRONZE
  SILVER
  GOLD
  DIAMOND
}
```

#### 3. Extensions TraderInvitation

Ajouter champs tracking détaillé.

```prisma
model TraderInvitation {
  // ... existing fields

  // Nouveaux champs
  source          InvitationSource  @default(MANUAL) // MANUAL, BULK, API
  customMessage   String?           // Message personnalisé trader
  landingViews    Int               @default(0)      // Combien de fois landing vue
  clickedAt       DateTime?         // Premier click sur lien
  creditsAwarded  Int               @default(0)      // Credits donnés au trader
  inviteeUserId   String?           // User créé (si accepted)
  inviteeActive   Boolean           @default(false)  // Invité est actif (30+ jours)
  inviteeUpgraded Boolean           @default(false)  // Invité a upgradé

  invitee         User?             @relation("InviteeUser", ...)
}

enum InvitationSource {
  MANUAL        // Email invitation form
  BULK          // Bulk import CSV
  REFERRAL_LINK // Lien partagé public
  API           // Via API externe
}
```

#### 4. ReferralReward (History)

Log toutes les actions rewards (audit trail).

```prisma
model ReferralReward {
  id          String       @id @default(cuid())
  traderId    String
  inviteeId   String
  action      RewardAction
  creditsEarned Int
  description String
  createdAt   DateTime     @default(now())

  trader      User         @relation("TraderRewards", ...)
  invitee     User         @relation("InviteeRewards", ...)

  @@index([traderId])
  @@index([inviteeId])
  @@index([createdAt])
  @@map("referral_reward")
}

enum RewardAction {
  INVITATION_ACCEPTED
  USER_BECAME_ACTIVE
  USER_UPGRADED_PRO
  USER_UPGRADED_ULTRA
  USER_RETENTION_3M
  USER_RETENTION_6M
}
```

### Services Backend

#### 1. ReferralService

Service principal gestion referrals.

```typescript
// src/lib/referral/referral-service.ts

export class ReferralService {
  /**
   * Award credits to trader for action
   */
  async awardCredits(params: {
    traderId: string
    inviteeId: string
    action: RewardAction
    amount: number
  }) {
    const { traderId, inviteeId, action, amount } = params

    // Create credit transaction
    await prisma.referralCredit.create({
      data: {
        userId: traderId,
        type: mapActionToCreditType(action),
        amount,
        source: action,
        sourceId: inviteeId,
        description: `Earned ${amount} credits: ${action}`
      }
    })

    // Log reward history
    await prisma.referralReward.create({
      data: {
        traderId,
        inviteeId,
        action,
        creditsEarned: amount,
        description: `${action} for user ${inviteeId}`
      }
    })

    // Check tier progression
    await this.checkTierProgression(traderId)

    logger.info(`Awarded ${amount} credits to ${traderId} for ${action}`)
  }

  /**
   * Check and update tier progression
   */
  async checkTierProgression(userId: string) {
    // Count active invites
    const activeCount = await prisma.traderInvitation.count({
      where: {
        traderId: userId,
        inviteeActive: true
      }
    })

    // Get current tier
    let tier = await prisma.referralTier.findUnique({
      where: { userId }
    })

    if (!tier) {
      tier = await prisma.referralTier.create({
        data: { userId, activeInvitesCount: activeCount }
      })
    }

    // Determine new tier
    const newTier = calculateTier(activeCount)

    // Upgrade if needed
    if (newTier > tier.currentTier) {
      await prisma.referralTier.update({
        where: { userId },
        data: {
          currentTier: newTier,
          activeInvitesCount: activeCount,
          lastTierUpgrade: new Date()
        }
      })

      // Grant tier rewards
      await this.grantTierRewards(userId, newTier)

      logger.info(`User ${userId} upgraded to tier ${newTier}`)
    }
  }

  /**
   * Grant tier rewards (free months, badges, etc.)
   */
  async grantTierRewards(userId: string, tier: TierLevel) {
    switch (tier) {
      case 'BRONZE':
        // 10% discount lifetime (implement via user.discountPercent field)
        await prisma.user.update({
          where: { id: userId },
          data: { discountPercent: 10 }
        })
        break

      case 'SILVER':
        // 3 mois Pro gratuit
        const silverExpiry = addMonths(new Date(), 3)
        await prisma.user.update({
          where: { id: userId },
          data: {
            planName: 'pro',
            planExpiresAt: silverExpiry
          }
        })
        break

      case 'GOLD':
        // 3 mois Ultra gratuit + Featured
        const goldExpiry = addMonths(new Date(), 3)
        await prisma.user.update({
          where: { id: userId },
          data: {
            planName: 'ultra',
            planExpiresAt: goldExpiry,
            featuredUntil: addWeeks(new Date(), 2) // Featured 2 weeks
          }
        })
        break

      case 'DIAMOND':
        // Ultra lifetime
        await prisma.user.update({
          where: { id: userId },
          data: {
            planName: 'ultra',
            planExpiresAt: new Date('2099-12-31'), // Lifetime
            featuredUntil: new Date('2099-12-31')
          }
        })
        break
    }
  }

  /**
   * Calculate user's total credits balance
   */
  async getCreditBalance(userId: string): Promise<number> {
    const result = await prisma.referralCredit.aggregate({
      where: { userId },
      _sum: { amount: true }
    })

    return result._sum.amount ?? 0
  }

  /**
   * Spend credits for reward
   */
  async spendCredits(params: {
    userId: string
    amount: number
    type: ReferralCreditType
    description: string
  }) {
    const { userId, amount, type, description } = params

    // Check balance
    const balance = await this.getCreditBalance(userId)

    if (balance < amount) {
      throw new Error(`Insufficient credits. Balance: ${balance}, Required: ${amount}`)
    }

    // Deduct credits
    await prisma.referralCredit.create({
      data: {
        userId,
        type,
        amount: -amount, // Negative = spent
        description
      }
    })

    logger.info(`User ${userId} spent ${amount} credits for ${type}`)
  }
}

function calculateTier(activeCount: number): TierLevel {
  if (activeCount >= 250) return 'DIAMOND'
  if (activeCount >= 100) return 'GOLD'
  if (activeCount >= 50) return 'SILVER'
  if (activeCount >= 10) return 'BRONZE'
  return 'NONE'
}
```

#### 2. InvitationTrackingService

Track invitation funnel.

```typescript
// src/lib/referral/invitation-tracking.ts

export class InvitationTrackingService {
  /**
   * Track landing page view
   */
  async trackLandingView(invitationToken: string) {
    await prisma.traderInvitation.update({
      where: { token: invitationToken },
      data: {
        landingViews: { increment: 1 },
        clickedAt: { set: new Date() } // First click timestamp
      }
    })
  }

  /**
   * Track invitation acceptance (signup completed)
   */
  async trackAcceptance(params: {
    invitationToken: string
    newUserId: string
  }) {
    const { invitationToken, newUserId } = params

    // Update invitation
    await prisma.traderInvitation.update({
      where: { token: invitationToken },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        inviteeUserId: newUserId
      }
    })

    // Award credits to trader (signup bonus)
    const invitation = await prisma.traderInvitation.findUnique({
      where: { token: invitationToken }
    })

    if (invitation) {
      await referralService.awardCredits({
        traderId: invitation.traderId,
        inviteeId: newUserId,
        action: 'INVITATION_ACCEPTED',
        amount: 5 // 5 credits for signup
      })

      // Grant welcome bonus to invitee
      await this.grantWelcomeBonus(newUserId, invitation.source)
    }
  }

  /**
   * Grant welcome bonus to invitee
   */
  async grantWelcomeBonus(userId: string, source: InvitationSource) {
    // Determine trial duration based on source
    let trialDays = 30 // Default
    let welcomeCredits = 25

    if (source === 'MANUAL') {
      // Email invitation personnalisée
      trialDays = 60
      welcomeCredits = 25
    } else if (source === 'REFERRAL_LINK') {
      // Referral link public
      trialDays = 30
      welcomeCredits = 0
    }

    // Grant Pro trial
    const trialExpiry = addDays(new Date(), trialDays)
    await prisma.user.update({
      where: { id: userId },
      data: {
        planName: 'pro',
        planExpiresAt: trialExpiry,
        planTrialEndsAt: trialExpiry
      }
    })

    // Grant welcome credits
    if (welcomeCredits > 0) {
      await prisma.referralCredit.create({
        data: {
          userId,
          type: 'EARNED_SIGNUP',
          amount: welcomeCredits,
          description: 'Welcome bonus credits'
        }
      })
    }

    logger.info(`Granted ${trialDays}d trial + ${welcomeCredits} credits to ${userId}`)
  }

  /**
   * Check if user became "active" (30+ days, 3+ logins)
   */
  async checkUserActive(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!user) return false

    // Check criteria
    const accountAge = differenceInDays(new Date(), user.createdAt)
    const hasEnoughLogins = true // TODO: track login count

    const isActive = accountAge >= 30 && hasEnoughLogins

    if (isActive) {
      // Mark invitation as "active invitee"
      await prisma.traderInvitation.updateMany({
        where: {
          inviteeUserId: userId,
          inviteeActive: false
        },
        data: {
          inviteeActive: true
        }
      })

      // Award credits to trader
      const invitation = await prisma.traderInvitation.findFirst({
        where: { inviteeUserId: userId }
      })

      if (invitation) {
        await referralService.awardCredits({
          traderId: invitation.traderId,
          inviteeId: userId,
          action: 'USER_BECAME_ACTIVE',
          amount: 10 // 10 credits for active user
        })
      }
    }

    return isActive
  }
}
```

#### 3. Cron Jobs

Background jobs pour tracking automatique.

```typescript
// src/lib/cron/check-active-invitees.ts

/**
 * Check invitees qui deviennent "active" (30+ jours)
 * Run daily
 */
export const checkActiveInviteesJob = new CronJob(
  '0 2 * * *', // Every day at 2am
  async () => {
    logger.info('Starting check active invitees job')

    // Find invitees créés il y a 30 jours, pas encore marked active
    const targetDate = subDays(new Date(), 30)

    const pendingInvitees = await prisma.traderInvitation.findMany({
      where: {
        inviteeActive: false,
        inviteeUserId: { not: null },
        acceptedAt: {
          lte: targetDate
        }
      },
      include: {
        invitee: true
      }
    })

    logger.info(`Found ${pendingInvitees.length} invitees to check`)

    for (const invitation of pendingInvitees) {
      if (!invitation.invitee) continue

      await trackingService.checkUserActive(invitation.invitee.id)
    }

    logger.info('Check active invitees job completed')
  }
)
```

---

## 🎨 UX/UI Features

### Dashboard Trader - Onglet "Invitations"

**Layout:**

```tsx
export default async function TraderInvitationsPage() {
  const user = await getRequiredUser()
  const traderProfile = await getTraderProfileByUserId(user.id)

  if (!traderProfile) redirect('/account/become-trader')

  // Fetch data
  const creditBalance = await referralService.getCreditBalance(user.id)
  const tier = await prisma.referralTier.findUnique({ where: { userId: user.id } })
  const invitations = await prisma.traderInvitation.findMany({
    where: { traderId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  // Conversion stats
  const stats = {
    totalSent: invitations.length,
    accepted: invitations.filter(i => i.status === 'ACCEPTED').length,
    active: invitations.filter(i => i.inviteeActive).length,
    upgraded: invitations.filter(i => i.inviteeUpgraded).length
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <PageHeader
        title="Referral Program"
        description="Invite followers and earn rewards"
      />

      {/* Credits & Tier Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <CreditsBalanceCard balance={creditBalance} />
        <CurrentTierCard tier={tier} />
        <NextTierProgressCard tier={tier} invitations={invitations} />
      </div>

      {/* Referral Link */}
      <ReferralLinkCard traderId={user.id} />

      {/* Conversion Funnel Stats */}
      <ConversionFunnelCard stats={stats} />

      {/* Invitations Table */}
      <InvitationsTable invitations={invitations} />

      {/* Rewards Catalog */}
      <RewardsCatalogCard balance={creditBalance} />
    </div>
  )
}
```

**Components Détaillés:**

#### 1. CreditsBalanceCard

```tsx
export function CreditsBalanceCard({ balance }: { balance: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Credits Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">
          {balance} credits
        </div>
        <p className="text-muted-foreground text-xs mt-2">
          Earn more by inviting followers!
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="#rewards">
            <Gift className="mr-2 size-4" />
            Spend Credits
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### 2. CurrentTierCard

```tsx
export function CurrentTierCard({ tier }: { tier: ReferralTier | null }) {
  const currentTier = tier?.currentTier ?? 'NONE'

  const tierConfig = {
    NONE: { icon: '🎯', label: 'No Tier', color: 'text-gray-500' },
    BRONZE: { icon: '🥉', label: 'Bronze', color: 'text-orange-600' },
    SILVER: { icon: '🥈', label: 'Silver', color: 'text-gray-400' },
    GOLD: { icon: '🥇', label: 'Gold', color: 'text-yellow-500' },
    DIAMOND: { icon: '💎', label: 'Diamond', color: 'text-blue-500' }
  }

  const config = tierConfig[currentTier]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Current Tier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <p className={cn("text-2xl font-bold", config.color)}>
              {config.label}
            </p>
            <p className="text-muted-foreground text-xs">
              {tier?.activeInvitesCount ?? 0} active invites
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 3. NextTierProgressCard

```tsx
export function NextTierProgressCard({
  tier,
  invitations
}: {
  tier: ReferralTier | null
  invitations: TraderInvitation[]
}) {
  const activeCount = tier?.activeInvitesCount ?? 0
  const currentTier = tier?.currentTier ?? 'NONE'

  // Determine next tier target
  const tierTargets = {
    NONE: { next: 'BRONZE', target: 10 },
    BRONZE: { next: 'SILVER', target: 50 },
    SILVER: { next: 'GOLD', target: 100 },
    GOLD: { next: 'DIAMOND', target: 250 },
    DIAMOND: { next: null, target: null }
  }

  const { next, target } = tierTargets[currentTier]

  if (!next) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Max Tier Reached!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Congratulations! You've reached Diamond tier 🎉
          </p>
        </CardContent>
      </Card>
    )
  }

  const progress = (activeCount / target) * 100
  const remaining = target - activeCount

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Progress to {next}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {activeCount} / {target} active invites
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>

          <Progress value={progress} />

          <p className="text-muted-foreground text-xs">
            {remaining} more invite{remaining > 1 ? 's' : ''} to reach {next} tier!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 4. ReferralLinkCard (Enhanced)

```tsx
'use client'

export function ReferralLinkCard({ traderId }: { traderId: string }) {
  const referralUrl = `${window.location.origin}/invite/${traderId}`
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      "Check out my trading signals on MyCryptoPilot! Get 30 days Pro free 🚀"
    )
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralUrl)}`,
      '_blank'
    )
  }

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=Check out my trading signals!`,
      '_blank'
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Link</CardTitle>
        <CardDescription>
          Share this link to invite followers. They get 30 days Pro free, you earn credits!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Referral URL */}
        <div className="flex gap-2">
          <Input value={referralUrl} readOnly />
          <Button onClick={handleCopy} variant="outline">
            {copied ? (
              <><Check className="mr-2 size-4" /> Copied</>
            ) : (
              <><Copy className="mr-2 size-4" /> Copy</>
            )}
          </Button>
        </div>

        {/* Social Share Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleShareTwitter} variant="outline" size="sm">
            <Twitter className="mr-2 size-4" />
            Share on Twitter
          </Button>

          <Button onClick={handleShareTelegram} variant="outline" size="sm">
            <Send className="mr-2 size-4" />
            Share on Telegram
          </Button>

          <InviteFollowerDialog>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 size-4" />
              Send Email
            </Button>
          </InviteFollowerDialog>
        </div>

        {/* Incentive Reminder */}
        <Alert>
          <Gift className="size-4" />
          <AlertTitle>Earn 10 credits per active follower!</AlertTitle>
          <AlertDescription>
            Plus 50 credits if they upgrade to Pro, 100 for Ultra.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
```

#### 5. ConversionFunnelCard

```tsx
export function ConversionFunnelCard({ stats }: { stats: ConversionStats }) {
  const conversionRate = stats.totalSent > 0
    ? (stats.accepted / stats.totalSent) * 100
    : 0

  const activeRate = stats.accepted > 0
    ? (stats.active / stats.accepted) * 100
    : 0

  const upgradeRate = stats.active > 0
    ? (stats.upgraded / stats.active) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Step 1: Sent */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                <Send className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Invitations Sent</p>
                <p className="text-muted-foreground text-sm">{stats.totalSent} total</p>
              </div>
            </div>
            <span className="text-2xl font-bold">{stats.totalSent}</span>
          </div>

          <Separator />

          {/* Step 2: Accepted */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                <UserCheck className="size-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Accepted (Signups)</p>
                <p className="text-muted-foreground text-sm">
                  {conversionRate.toFixed(1)}% conversion
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold">{stats.accepted}</span>
          </div>

          <Separator />

          {/* Step 3: Active */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-100">
                <Activity className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Active Users (30+ days)</p>
                <p className="text-muted-foreground text-sm">
                  {activeRate.toFixed(1)}% retention
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold">{stats.active}</span>
          </div>

          <Separator />

          {/* Step 4: Upgraded */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-yellow-100">
                <DollarSign className="size-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Upgraded to Paid</p>
                <p className="text-muted-foreground text-sm">
                  {upgradeRate.toFixed(1)}% upgrade rate
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold">{stats.upgraded}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 6. RewardsCatalogCard

```tsx
export function RewardsCatalogCard({ balance }: { balance: number }) {
  const rewards = [
    {
      name: '1 Month Pro',
      cost: 100,
      value: '$49',
      icon: <Zap className="size-6" />,
      action: 'SPENT_PLAN_UPGRADE'
    },
    {
      name: '1 Month Ultra',
      cost: 200,
      value: '$99',
      icon: <Crown className="size-6" />,
      action: 'SPENT_PLAN_UPGRADE'
    },
    {
      name: 'Featured Placement (1 week)',
      cost: 50,
      value: '$20',
      icon: <Star className="size-6" />,
      action: 'SPENT_FEATURED_PLACEMENT'
    },
    {
      name: 'Analytics Premium Unlock',
      cost: 30,
      value: '$15',
      icon: <BarChart3 className="size-6" />,
      action: 'SPENT_ANALYTICS_UNLOCK'
    },
    {
      name: 'Custom Badge',
      cost: 150,
      value: 'Unique',
      icon: <Award className="size-6" />,
      action: 'SPENT_CUSTOM_BADGE'
    },
    {
      name: 'Profile Boost (2x visibility)',
      cost: 75,
      value: '$30',
      icon: <TrendingUp className="size-6" />,
      action: 'SPENT_PROFILE_BOOST'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend Your Credits</CardTitle>
        <CardDescription>
          Redeem credits for rewards and upgrades
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const canAfford = balance >= reward.cost

            return (
              <Card key={reward.name} className={cn(
                "transition-all hover:shadow-md",
                !canAfford && "opacity-50"
              )}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                      {reward.icon}
                    </div>

                    <div>
                      <p className="font-medium">{reward.name}</p>
                      <p className="text-muted-foreground text-sm">
                        Value: {reward.value}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-lg font-bold">
                      <Coins className="size-5" />
                      {reward.cost} credits
                    </div>

                    <RedeemRewardButton
                      reward={reward}
                      balance={balance}
                      disabled={!canAfford}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Landing Page Invitation (Public)

**Route**: `/invite/[traderId]` ou `/i/[invitationToken]`

```tsx
export default async function InvitationLandingPage({
  params
}: {
  params: { traderId: string }
}) {
  const trader = await getTraderProfileById(params.traderId)
  if (!trader) notFound()

  // Track landing view (analytics)
  // await trackingService.trackLandingView(...)

  return (
    <div className="container mx-auto py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-4">
            <Gift className="mr-2 size-4" />
            Special Invitation
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Get 30 Days Pro Free!
          </h1>

          <p className="text-muted-foreground text-xl">
            {trader.displayName} invited you to follow their trading signals on MyCryptoPilot
          </p>
        </div>

        {/* Trader Preview */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="size-24">
                <AvatarImage src={trader.user.image ?? undefined} />
                <AvatarFallback>{trader.displayName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{trader.displayName}</h2>
                  {trader.verified && (
                    <Badge variant="secondary">
                      <CheckCircle className="mr-1 size-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">{trader.bio}</p>

                {/* Quick Stats */}
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold">
                      {(trader.statsJson as any)?.winrate ?? 0}%
                    </p>
                    <p className="text-muted-foreground text-sm">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(trader.statsJson as any)?.totalSignals ?? 0}
                    </p>
                    <p className="text-muted-foreground text-sm">Signals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {(trader.statsJson as any)?.followers ?? 0}
                    </p>
                    <p className="text-muted-foreground text-sm">Followers</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-100">
                <Gift className="size-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">30 Days Pro Free</h3>
              <p className="text-muted-foreground text-sm">
                Full access to Pro features worth $49
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-blue-100">
                <Signal className="size-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Signals</h3>
              <p className="text-muted-foreground text-sm">
                Get instant notifications on trading opportunities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-purple-100">
                <Shield className="size-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">No Credit Card</h3>
              <p className="text-muted-foreground text-sm">
                Sign up in seconds, no payment required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="border-primary">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold mb-4">
              Ready to start your free trial?
            </h3>

            <Button asChild size="lg" className="text-lg px-8">
              <Link href={`/signup?ref=${trader.userId}`}>
                Get Started - It's Free!
              </Link>
            </Button>

            <p className="text-muted-foreground text-sm mt-4">
              By signing up, you'll automatically follow {trader.displayName}
            </p>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="size-4" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="size-4" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            <span>No Spam, Ever</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎮 Gamification

### Leaderboard Public

**Page**: `/leaderboard` ou section dans Dashboard

```tsx
export async function ReferralLeaderboard() {
  // Top traders par invités actifs (monthly)
  const topTraders = await prisma.user.findMany({
    where: {
      traderProfile: { isNot: null }
    },
    include: {
      traderProfile: true,
      _count: {
        select: {
          invitationsSent: {
            where: {
              inviteeActive: true,
              createdAt: {
                gte: startOfMonth(new Date())
              }
            }
          }
        }
      }
    },
    orderBy: {
      invitationsSent: {
        _count: 'desc'
      }
    },
    take: 10
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Recruiters This Month</CardTitle>
        <CardDescription>
          Traders who brought the most active followers
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {topTraders.map((trader, index) => {
            const rank = index + 1
            const invitesCount = trader._count.invitationsSent

            return (
              <div key={trader.id} className="flex items-center gap-4">
                {/* Rank Medal */}
                <div className="flex size-10 items-center justify-center">
                  {rank === 1 && <span className="text-3xl">🥇</span>}
                  {rank === 2 && <span className="text-3xl">🥈</span>}
                  {rank === 3 && <span className="text-3xl">🥉</span>}
                  {rank > 3 && (
                    <span className="text-muted-foreground font-medium">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Trader Info */}
                <Avatar>
                  <AvatarImage src={trader.image ?? undefined} />
                  <AvatarFallback>{trader.name?.[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-medium">{trader.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {invitesCount} active follower{invitesCount > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Badge Tier */}
                <TierBadge tier={trader.referralTier?.currentTier} />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Progress Notifications

**Real-time notifications pour motiver:**

```typescript
// When trader hits milestones
if (activeInvitesCount === 5) {
  await sendNotification({
    userId: traderId,
    type: 'MILESTONE',
    title: 'Halfway to Bronze! 🎯',
    message: '5 active followers! Just 5 more to unlock Bronze tier.',
    action: { label: 'Invite More', href: '/dashboard/trader/invitations' }
  })
}

if (activeInvitesCount === 10) {
  await sendNotification({
    userId: traderId,
    type: 'TIER_UPGRADE',
    title: 'Bronze Tier Unlocked! 🥉',
    message: 'Congrats! You earned 10% lifetime discount.',
    action: { label: 'View Rewards', href: '/dashboard/trader/invitations#rewards' }
  })
}
```

---

## 🛡️ Anti-Gaming Strategies

### Rate Limiting

```typescript
// src/lib/referral/rate-limit.ts

const LIMITS = {
  invitationsPerDay: 20,
  invitationsPerWeek: 50,
  invitationsPerMonth: 200
}

export async function checkInvitationRateLimit(traderId: string): Promise<{
  allowed: boolean
  limit: number
  current: number
  resetAt: Date
}> {
  const today = startOfDay(new Date())
  const thisWeek = startOfWeek(new Date())

  // Count invitations sent today
  const todayCount = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: today }
    }
  })

  if (todayCount >= LIMITS.invitationsPerDay) {
    return {
      allowed: false,
      limit: LIMITS.invitationsPerDay,
      current: todayCount,
      resetAt: addDays(today, 1)
    }
  }

  // Count invitations sent this week
  const weekCount = await prisma.traderInvitation.count({
    where: {
      traderId,
      createdAt: { gte: thisWeek }
    }
  })

  if (weekCount >= LIMITS.invitationsPerWeek) {
    return {
      allowed: false,
      limit: LIMITS.invitationsPerWeek,
      current: weekCount,
      resetAt: addWeeks(thisWeek, 1)
    }
  }

  return {
    allowed: true,
    limit: LIMITS.invitationsPerDay,
    current: todayCount,
    resetAt: addDays(today, 1)
  }
}
```

### Multi-Account Detection

```typescript
// src/lib/referral/fraud-detection.ts

export async function detectSuspiciousInvite(params: {
  inviteeEmail: string
  inviteeIP: string
  inviteeFingerprint: string
}): Promise<{ suspicious: boolean; reason?: string }> {
  const { inviteeEmail, inviteeIP, inviteeFingerprint } = params

  // Check 1: Email domain abuse (temp email services)
  const tempEmailDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
  const emailDomain = inviteeEmail.split('@')[1]

  if (tempEmailDomains.includes(emailDomain)) {
    return { suspicious: true, reason: 'Temporary email detected' }
  }

  // Check 2: Same IP multiple signups (within 24h)
  const recentSignupsFromIP = await prisma.user.count({
    where: {
      createdAt: { gte: subDays(new Date(), 1) },
      // TODO: add IP tracking field
    }
  })

  if (recentSignupsFromIP > 5) {
    return { suspicious: true, reason: 'Too many signups from same IP' }
  }

  // Check 3: Same device fingerprint
  const existingUser = await prisma.user.findFirst({
    where: {
      // TODO: add device fingerprint field
    }
  })

  if (existingUser) {
    return { suspicious: true, reason: 'Device fingerprint matches existing user' }
  }

  return { suspicious: false }
}
```

### Reward Clawback

Si invité devient inactif ou frauduleux, retirer credits.

```typescript
export async function clawbackRewards(inviteeId: string, reason: string) {
  // Find trader qui a invité
  const invitation = await prisma.traderInvitation.findFirst({
    where: { inviteeUserId: inviteeId }
  })

  if (!invitation) return

  // Find credits awarded
  const creditsAwarded = invitation.creditsAwarded

  if (creditsAwarded > 0) {
    // Deduct credits
    await prisma.referralCredit.create({
      data: {
        userId: invitation.traderId,
        type: 'EARNED_SIGNUP', // Opposite type
        amount: -creditsAwarded, // Negative
        description: `Clawback: ${reason}`,
        sourceId: inviteeId
      }
    })

    logger.warn(`Clawback ${creditsAwarded} credits from ${invitation.traderId} (reason: ${reason})`)
  }
}
```

---

## 📈 Metrics & Analytics

### KPIs à Tracker

**Trader Metrics:**
- Total invitations envoyées
- Invitation → Signup conversion rate
- Signup → Active user retention rate (30d)
- Active → Paid upgrade rate
- Average credits earned per trader
- Time to first reward redemption

**Invitee Metrics:**
- Source attribution (email vs referral link vs social)
- Landing page → Signup conversion
- Trial → Paid conversion rate
- Trial extension impact (30d vs 7d)
- Lifetime value (LTV) invités vs organic

**Platform Metrics:**
- Viral coefficient K (invités per user)
- CAC reduction (cost saved via referrals)
- Referral revenue attribution
- Credits issued vs credits spent
- Tier distribution (% Bronze/Silver/Gold/Diamond)

### Funnel Analysis Dashboard

```typescript
export async function getReferralFunnelData(traderId: string) {
  const invitations = await prisma.traderInvitation.findMany({
    where: { traderId },
    include: { invitee: true }
  })

  return {
    step1_sent: invitations.length,
    step2_landed: invitations.filter(i => i.landingViews > 0).length,
    step3_signed: invitations.filter(i => i.status === 'ACCEPTED').length,
    step4_active: invitations.filter(i => i.inviteeActive).length,
    step5_upgraded: invitations.filter(i => i.inviteeUpgraded).length,

    // Conversion rates
    landedRate: (invitations.filter(i => i.landingViews > 0).length / invitations.length) * 100,
    signupRate: (invitations.filter(i => i.status === 'ACCEPTED').length / invitations.length) * 100,
    activeRate: (invitations.filter(i => i.inviteeActive).length / invitations.filter(i => i.status === 'ACCEPTED').length) * 100,
    upgradeRate: (invitations.filter(i => i.inviteeUpgraded).length / invitations.filter(i => i.inviteeActive).length) * 100
  }
}
```

---

## 🗓️ Roadmap Implémentation

### Phase 1: Credits System (2 semaines)

**Semaine 1: DB & Backend**
- [ ] Migrations Prisma (4 nouveaux modèles)
- [ ] ReferralService implementation
- [ ] Award/spend credits logic
- [ ] Tests unitaires (100% coverage)

**Semaine 2: UI Credits**
- [ ] CreditsBalanceCard component
- [ ] RewardsCatalogCard component
- [ ] Redeem rewards flow
- [ ] Toast notifications

**Deliverable**: Credits system fonctionnel

### Phase 2: Tiers & Gamification (1 semaine)

**Semaine 3: Tiers System**
- [ ] ReferralTier model & logic
- [ ] Auto-upgrade tiers (Bronze/Silver/Gold/Diamond)
- [ ] Tier rewards (free months, badges)
- [ ] CurrentTierCard + NextTierProgressCard
- [ ] Public leaderboard page

**Deliverable**: Gamification active

### Phase 3: Enhanced Invitations (1 semaine)

**Semaine 4: UX Invitations**
- [ ] Landing page `/invite/[traderId]`
- [ ] Social share buttons (Twitter, Telegram)
- [ ] Email templates personnalisés
- [ ] ConversionFunnelCard
- [ ] InvitationTrackingService

**Deliverable**: UX invitations optimisée

### Phase 4: Anti-Gaming & Polish (1 semaine optionnelle)

**Semaine 5: Security & Fraud**
- [ ] Rate limiting invitations
- [ ] Multi-account detection
- [ ] Reward clawback logic
- [ ] Admin dashboard fraud monitoring

**Deliverable**: Production-ready avec sécurité

**TOTAL: 4 semaines (1 mois)**

---

## 💰 ROI Projections

### Scénario Conservateur

**Hypothèses:**
- 1,000 users actifs actuels
- 30% sont traders (300 traders)
- Chaque trader invite en moyenne 10 personnes
- 30% invitations → signups (viral coeff K = 0.3)
- 20% signups → active users (30+ jours)
- 15% active → upgrade payant

**Calculs:**
```
Invitations envoyées: 300 traders × 10 = 3,000
Signups: 3,000 × 30% = 900 nouveaux users
Active (30d): 900 × 20% = 180 users actifs
Upgraded: 180 × 15% = 27 nouveaux paying customers

Revenue additionnel:
- 20 upgrades Pro (49$/mois): 980$/mois
- 7 upgrades Ultra (99$/mois): 693$/mois
TOTAL: 1,673$/mois (+23% revenue)

CAC saved:
- Acquisition organique coûte ~50$ par user (ads)
- 900 signups × 50$ = 45,000$ saved!
- Coût referral program: ~5,000$ (credits)
NET SAVINGS: 40,000$
```

**ROI**: **800% en 3 mois** 🚀

### Scénario Optimiste (Growth Viral)

**Hypothèses:**
- K = 1.2 (chaque user recrute 1.2 nouveaux users)
- Croissance exponentielle sur 6 mois

**Calculs:**
```
Mois 1: 1,000 users → 1,200 nouveaux → 2,200 total
Mois 2: 2,200 users → 2,640 nouveaux → 4,840 total
Mois 3: 4,840 users → 5,808 nouveaux → 10,648 total
Mois 6: ~40,000 users total

Paying customers (assume 5% conversion):
40,000 × 5% = 2,000 paying

Revenue mensuel:
- 1,500 Pro (49$): 73,500$/mois
- 500 Ultra (99$): 49,500$/mois
TOTAL: 123,000$/mois 🤯

Annual Recurring Revenue (ARR): ~1.5M$
```

**Viral growth = game changer!**

---

## 🎯 Recommandations

### ✅ GO avec Option A: Credits System

**Pourquoi:**
1. ✅ Flexible (traders choose rewards)
2. ✅ Scalable (add new rewards easily)
3. ✅ Gamification naturelle (progress visible)
4. ✅ Low cost (virtual currency)
5. ✅ Align incentives (quality over quantity)

### 🎁 Incentives Recommandés

**Pour Traders:**
- 5 credits invitation accepted
- 10 credits invité actif (30+ jours)
- 50 credits invité upgrade Pro
- 100 credits invité upgrade Ultra

**Pour Invités:**
- 30 jours Pro trial (vs 7 jours normal)
- 25 credits bienvenue
- 50% off premier mois si upgrade rapide

### 🎮 Gamification Layers

**Tiers:**
- 🥉 Bronze (10 invités): 10% discount
- 🥈 Silver (50 invités): 3 mois Pro gratuit
- 🥇 Gold (100 invités): 3 mois Ultra + Featured
- 💎 Diamond (250 invités): Ultra lifetime

**Leaderboard:**
- Monthly top 10 recruiters
- Prizes: Credits bonus, Featured placement

### 🛡️ Anti-Gaming Must-Haves

- Rate limits (50 invitations/semaine max)
- Email validation obligatoire
- Rewards only si actif 30+ jours
- Multi-account detection
- Admin fraud monitoring dashboard

### 📊 Success Metrics (3 mois)

- ✅ Viral coefficient K > 0.5 (target 1.0+)
- ✅ 20%+ nouveaux users via referral
- ✅ CAC reduction -30%
- ✅ 50+ traders avec 10+ invités actifs
- ✅ 100+ rewards redeemed

---

## 🚀 Next Steps

**Si GO:**

1. **Phase 1 Start** (Semaine 1):
   - Create DB migrations
   - Implement ReferralService
   - Build Credits balance UI

2. **Beta Testing** (Post Phase 2):
   - Invite top 20 traders beta
   - Collect feedback
   - Iterate UX

3. **Public Launch** (Post Phase 3):
   - Marketing campaign
   - Blog post "Earn rewards by sharing"
   - Email blast to all traders

4. **Monitor & Optimize** (Ongoing):
   - Track metrics weekly
   - A/B test incentives amounts
   - Adjust based on data

---

**Ce système va transformer MyCryptoPilot en machine de croissance virale!** 🚀💰

**Estimated effort**: 4 semaines (1 dev full-time)
**Impact business**: +40-60% croissance virale + CAC reduction -50%
**ROI**: 800%+ en 3 mois
