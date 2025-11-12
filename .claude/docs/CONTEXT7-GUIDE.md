# Guide Context7 MCP - MyCryptoPilot

**Dernière mise à jour**: 2 novembre 2025

---

## 📖 Vue d'ensemble

**Context7** est un serveur MCP développé par Upstash qui fournit de la documentation à jour pour des milliers de bibliothèques. Il permet à Claude Code d'accéder à la documentation la plus récente plutôt que de se fier aux données d'entraînement obsolètes.

## ✅ Configuration Actuelle

Context7 est déjà configuré dans ton projet :

**Fichier** : `.claude/config.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## 🎯 Comment Utiliser Context7

### Méthode Simple : "Use Context7"

Il suffit de demander dans ta conversation Claude Code :

```
"Use context7 for Next.js 15"
"Use context7 for Prisma"
"Use context7 for React 19"
```

Claude utilisera automatiquement les outils MCP pour :

1. Résoudre l'ID de la bibliothèque
2. Charger la documentation à jour
3. L'utiliser dans ses réponses

### Les 2 Outils MCP Context7

#### 1. `resolve-library-id`

- **But** : Trouve l'ID Context7 d'une bibliothèque
- **Entrée** : Nom de package (ex: "next", "prisma", "react")
- **Sortie** : ID Context7 (ex: "vercel/nextjs", "prisma/prisma")

#### 2. `get-library-docs`

- **But** : Récupère la documentation complète
- **Entrée** : ID Context7
- **Sortie** : Documentation à jour avec exemples de code

## 📚 Bibliothèques Clés de MyCryptoPilot

Voici les bibliothèques principales de ton projet et leurs IDs Context7 probables :

### Core Framework

- **Next.js 15** → `vercel/nextjs`
- **React 19** → `facebook/react`
- **TypeScript** → `microsoft/typescript`

### Base de données & ORM

- **Prisma** → `prisma/prisma`
- **PostgreSQL** → `postgresql/postgresql`

### Authentification

- **Better Auth** → `better-auth/better-auth` (si disponible, sinon consulter docs officielles)

### UI/UX

- **TailwindCSS 4** → `tailwindlabs/tailwindcss`
- **Radix UI** → `radix-ui/primitives`
- **Shadcn/UI** → Note: Shadcn est déjà intégré nativement dans Claude Code !

### State Management

- **TanStack Query** → `tanstack/query`
- **Zustand** → `pmndrs/zustand`
- **nuqs** → `47ng/nuqs`

### Forms & Validation

- **React Hook Form** → `react-hook-form/react-hook-form`
- **Zod** → `colinhacks/zod`

### Crypto & Web3

- **Ethers.js** → `ethers-io/ethers.js`
- **TronWeb** → `tronprotocol/tronweb`
- **ccxt** → `ccxt/ccxt`
- **@scure/bip32** → `paulmillr/scure-bip32`
- **@scure/bip39** → `paulmillr/scure-bip39`

### Testing

- **Vitest** → `vitest-dev/vitest`
- **Playwright** → Note: Playwright est déjà intégré nativement dans Claude Code !
- **Testing Library** → `testing-library/react-testing-library`

### AI & assistants

- **@ai-sdk/openai** → `ai-sdk/openai` (ou `vercel/ai` pour l’intégration complète)

### Other

- **Discord.js** → `discordjs/discord.js`
- **date-fns** → `date-fns/date-fns`
- **drizzle-kit** → `drizzle-team/drizzle-orm` (pour référence rapide si besoin)

## 💡 Exemples d'Usage

### Exemple 1 : Implémenter une feature Next.js 15

**Tu demandes** :

```
Use context7 for Next.js 15. Comment utiliser les Server Actions avec revalidatePath ?
```

**Claude va** :

1. Résoudre "next" → "vercel/nextjs"
2. Charger la doc Next.js 15
3. Te donner la réponse exacte avec la syntaxe à jour

### Exemple 2 : Optimiser des queries Prisma

**Tu demandes** :

```
Use context7 for Prisma. Comment faire un include avec des nested relations ?
```

**Claude va** :

1. Résoudre "prisma" → "prisma/prisma"
2. Charger la doc Prisma
3. Te montrer les patterns recommandés à jour

### Exemple 3 : Comparer plusieurs bibliothèques

**Tu demandes** :

```
Use context7 for TanStack Query and Zustand. Quelle approche est meilleure pour gérer l'état des signaux de trading ?
```

**Claude va** :

1. Charger la doc des deux bibliothèques
2. Comparer les approches avec code à jour
3. Te recommander la meilleure solution

## 🎯 Quand Utiliser Context7 ?

### ✅ Utilise Context7 pour :

1. **Nouvelles features** : Syntaxe exacte de Next.js 15, React 19
2. **APIs récentes** : Nouvelles méthodes Prisma, TanStack Query v5
3. **Migration** : Changer de version (ex: Zod v3 → v4)
4. **Best practices** : Patterns recommandés officiels
5. **Debugging** : Erreurs liées à des changements d'API

### ❌ N'utilise PAS Context7 pour :

1. **Concepts généraux** : Comment fonctionne React ? (Claude le sait déjà)
2. **Code spécifique projet** : Logique métier MyCryptoPilot
3. **Debug code existant** : Lire les fichiers du projet est plus rapide
4. **Outils intégrés** : Playwright, Shadcn (déjà dans Claude Code nativement)

## 🚀 Performance Tips

1. **Sois spécifique** : "Use context7 for Prisma 6.15" plutôt que juste "Prisma"
2. **Combine intelligemment** : Charge plusieurs docs en une fois si besoin
3. **Cache automatique** : Context7 cache les docs, pas de souci de performance
4. **Évite le over-fetch** : Ne charge pas la doc si tu connais déjà la réponse

## 🔧 Troubleshooting

### "Library not found"

- Vérifie le nom exact du package npm
- Essaie avec l'org : "vercel/nextjs" au lieu de "next"
- Certaines libraries peuvent ne pas être supportées (très rares ou privées)

### "Documentation outdated"

- Context7 met à jour régulièrement, mais parfois avec 1-2 semaines de retard
- Pour des features très récentes (sorties il y a 1-2 jours), consulte directement la doc officielle

### Performance lente

- Context7 utilise `npx -y` qui télécharge le package au premier lancement
- Les appels suivants sont plus rapides grâce au cache npm

## 📊 Bibliothèques Supportées

Context7 supporte **des milliers de bibliothèques**, incluant :

- ✅ Tous les frameworks JS populaires (Next, React, Vue, Svelte, etc.)
- ✅ ORMs (Prisma, Drizzle, TypeORM, etc.)
- ✅ UI libraries (Radix, Material-UI, Chakra, etc.)
- ✅ Testing tools (Vitest, Jest, Playwright, Cypress, etc.)
- ✅ State management (Redux, Zustand, Jotai, etc.)
- ✅ Et bien plus...

Pour vérifier si une library est supportée, demande simplement à Claude :

```
Is [library-name] available on context7?
```

## 🎓 Ressources

- **GitHub** : https://github.com/upstash/context7
- **Blog Upstash** : https://upstash.com/blog/context7-mcp
- **Documentation** : https://deepwiki.com/upstash/context7-mcp
- **Dashboard** (optionnel) : https://context7.com/dashboard

---

**Note** : Context7 est déjà configuré et prêt à l'emploi ! Il suffit de dire "use context7 for [library]" dans tes conversations avec Claude Code. 🚀
