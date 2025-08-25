# LIGHT.TS - Suppression du système d'organisation

**Subject:** Analyse complète des modifications nécessaires pour supprimer le système d'organisation de NOW.TS et créer une version LIGHT.TS pour un SaaS single-user.

**Solution:** Créer une branche `light-version` avec suppression complète du système multi-tenant et conversion vers un modèle single-user avec subscription directe.

## Options

### Option 1: Branche spécialisée avec refactoring complet (RECOMMANDÉE)

Créer une branche `light-version` et effectuer les modifications suivantes :

**Avantages:**

- Partage du même repository
- Possibilité de merger des fixes communs
- Déploiements séparés possibles
- Maintenance centralisée

**Inconvénients:**

- Refactoring initial important
- Complexité de merge future

### Option 2: Fork complet avec repository séparé

Créer un nouveau repository `light-ts` en forkant `now-ts`.

**Avantages:**

- Indépendance totale
- Pas de conflits de merge
- Développement parallèle

**Inconvénients:**

- Duplication complète du code
- Synchronisation manuelle des fixes
- Maintenance double

### Option 3: Monorepo avec packages

Restructurer en monorepo avec packages séparés.

**Avantages:**

- Code partagé optimal
- Builds indépendants
- Typings communs

**Inconvénients:**

- Refactoring architectural majeur
- Configuration complexe

## Analysis

L'Option 1 est recommandée car elle permet de conserver l'historique du projet, partager les fixes critiques tout en ayant une version simplifiée. Voici l'analyse détaillée des modifications nécessaires :

## 🗄️ Base de données - Modifications critiques

### Modèles à supprimer complètement

```prisma
// À SUPPRIMER
model Organization { ... }
model Member { ... }
model Invitation { ... }
```

### Modèles à modifier

**Session :** Supprimer `activeOrganizationId`

```prisma
model Session {
  // SUPPRIMER cette ligne :
  activeOrganizationId String?
}
```

**User :** Ajouter les champs de subscription directement

```prisma
model User {
  id              String   @id
  name            String
  email           String
  emailVerified   Boolean
  image           String?
  createdAt       DateTime
  updatedAt       DateTime
  resendContactId String?

  // AJOUTER pour LIGHT.TS :
  stripeCustomerId String?

  // Relations existantes à conserver
  sessions    Session[]
  accounts    Account[]
  feedbacks   Feedback[]

  // SUPPRIMER ces relations :
  // members     Member[]
  // invitations Invitation[]
}
```

**Subscription :** Changer la référence vers User

```prisma
model Subscription {
  id                   String @id
  plan                 String
  referenceId          String @unique
  user                 User   @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  status               String?
  periodStart          DateTime?
  periodEnd            DateTime?
  cancelAtPeriodEnd    Boolean?
  seats                Int?
}
```

## 🔐 Authentification - Modifications majeures

### `/src/lib/auth.ts`

- **SUPPRIMER** : `organization` plugin (ligne 148)
- **SUPPRIMER** : `organizationLimit`, `membershipLimit`, `autoCreateOrganizationOnSignUp`
- **MODIFIER** : `databaseHooks.user.create.after` pour créer directement un customer Stripe

```typescript
// REMPLACER le hook de création d'organisation par :
databaseHooks: {
  user: {
    create: {
      after: async (user, req) => {
        await setupResendCustomer(user);

        // Créer directement un customer Stripe pour l'utilisateur
        try {
          const stripeCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId: user.id },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: stripeCustomer.id },
          });
        } catch (err) {
          logger.error("Failed to create Stripe customer", { err });
        }
      },
    },
  },
},
```

### `/src/lib/auth-client.ts`

- **SUPPRIMER** : `organizationClient()` (ligne 13)

### `/src/lib/auth/auth-permissions.ts`

**SUPPRIMER** complètement ce fichier et toute référence aux rôles/permissions.

## 🔄 Système d'actions et routes

### `/src/lib/actions/safe-actions.ts`

- **SUPPRIMER** : `orgAction` complètement
- **SUPPRIMER** : Import de `getRequiredCurrentOrg`
- **SUPPRIMER** : `AuthPermissionSchema`, `RolesKeys`

### `/src/lib/zod-route.ts`

- **SUPPRIMER** : `getCurrentOrg` import
- **SUPPRIMER** : Toutes les références aux organisations dans les middlewares

## 🏗️ Utilitaires et services

### Dossier `/src/lib/organizations/`

**SUPPRIMER** complètement ce dossier :

- `get-org.ts`
- `get-org-subscription.ts`
- `is-in-roles.ts`

### `/src/lib/react/cache.ts`

**SUPPRIMER** complètement les exports :

- `getCurrentOrgCache`
- `getRequiredCurrentOrgCache`

## 📊 Queries

### Dossier `/src/query/org/`

**SUPPRIMER** complètement ce dossier :

- `org-create.query.ts`
- `get-users-orgs.query.ts`
- `get-orgs-members.ts`

## 🎨 Interface utilisateur - Suppression massive

### Pages et layouts à supprimer

- **SUPPRIMER** : Tout le dossier `/app/orgs/`
- **SUPPRIMER** : Tout le dossier `/app/admin/organizations/`
- **MODIFIER** : `/app/(logged-in)/(account-layout)/account-navigation.tsx` pour supprimer les références aux organisations
- **MODIFIER** : `/app/(logged-in)/(account-layout)/account-sidebar.tsx`

### Navigation principale

**MODIFIER** `/app/(logged-in)/(account-layout)/account-navigation.tsx` :

```typescript
// SUPPRIMER :
// import { getUsersOrgs } from "@/query/org/get-users-orgs.query";
// const userOrganizations = await getUsersOrgs();
// <AccountSidebar userOrgs={userOrganizations} />

// REMPLACER par :
export async function AccountNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AccountSidebar />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg">
            <SidebarTrigger className="-ml-1" />
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

## 💳 Billing et Stripe

### `/app/api/webhooks/stripe/route.ts`

**MODIFICATIONS MAJEURES** :

- Remplacer la recherche par `organization.stripeCustomerId` par recherche `user.stripeCustomerId`
- Modifier `subscription.referenceId` pour pointer vers `user.id` au lieu de `organization.id`

```typescript
// REMPLACER :
// const organization = await prisma.organization.findFirst({
//   where: { stripeCustomerId: customerId },
// });

// PAR :
const user = await prisma.user.findFirst({
  where: { stripeCustomerId: customerId },
});

// Et tous les `organization.id` deviennent `user.id`
```

### Plans de facturation

**MODIFIER** `/src/lib/auth/stripe/auth-plans.ts` :

- Supprimer toute référence à `organizationId`
- Remplacer par `userId` dans les callbacks

## 📧 Emails

### Emails à modifier

- **SUPPRIMER** : `/emails/account-confirm-deletion.email.tsx` références organisations
- **SUPPRIMER** : `/emails/account-ask-deletion.email.tsx` références organisations
- **SUPPRIMER** : `/emails/subscription-downgrade-email.email.tsx` références organisations

## 🧪 Tests

### Tests à supprimer/modifier

- **SUPPRIMER** : `/e2e/organization-members.spec.ts`
- **SUPPRIMER** : `/e2e/org-slug-update.spec.ts`
- **SUPPRIMER** : `/e2e/org-details-update.spec.ts`
- **SUPPRIMER** : `/e2e/create-organization.test.ts`
- **MODIFIER** : `/e2e/signup.spec.ts` (supprimer création d'org automatique)
- **SUPPRIMER** : `/__tests__/org-navigation-links.test.ts`
- **SUPPRIMER** : `/__tests__/is-in-roles.test.ts`

## ⚙️ Configuration

### Variables d'environnement

Aucune modification nécessaire pour les variables d'environnement.

### `/src/site-config.ts`

Potentiellement supprimer des références aux organisations si présentes.

## 🚀 Plan d'implémentation

1. **Créer la branche** : `git checkout -b light-version`
2. **Base de données** : Créer et appliquer les migrations Prisma
3. **Authentification** : Modifier le système d'auth Better Auth
4. **Supprimer les dossiers** : `/app/orgs/`, `/src/lib/organizations/`, etc.
5. **Modifier les utilitaires** : Actions, routes, cache
6. **Billing** : Adapter Stripe pour user direct
7. **Navigation** : Simplifier l'interface utilisateur
8. **Tests** : Nettoyer et adapter les tests
9. **Validation** : Tests complets du parcours utilisateur

## 📈 Impact estimé

- **Fichiers à supprimer** : ~85 fichiers
- **Fichiers à modifier** : ~25 fichiers
- **Réduction du code** : ~40-50%
- **Temps d'implémentation** : 2-3 jours de développement
- **Complexité** : Moyenne à élevée (système central)

## ⚠️ Risques et considérations

1. **Migration existante** : Les utilisateurs existants devront être migrés
2. **Fonctionnalités perdues** : Collaboration, gestion d'équipe, invitations
3. **Billing** : Changement complet du modèle de facturation
4. **Tests E2E** : Refonte complète nécessaire
5. **Documentation** : Mise à jour complète requise

Cette analyse détaillée montre que la transformation vers LIGHT.TS nécessite une refactorisation significative mais parfaitement réalisable en supprimant le système multi-tenant au profit d'un modèle single-user plus simple.
