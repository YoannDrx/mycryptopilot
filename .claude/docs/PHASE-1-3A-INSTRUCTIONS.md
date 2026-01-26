# 📋 Phase 1.3a - Setup Upstash Redis

**Status**: ✅ Ready to Execute
**Durée estimée**: 15-20 minutes
**Complexité**: ⭐⭐ (Facile)

---

## 🎯 Objectif

Configurer Redis (Upstash) pour activer :
- **SSE pub/sub** - Balance updates temps réel
- **BullMQ** - Job queue pour copy-trading
- **Circuit breaker** - Rate limiting distribué

---

## 📦 Fichiers Créés

✅ `.claude/docs/REDIS-SETUP.md` - Guide complet Redis setup
✅ `scripts/setup-redis.ts` - Script automatisé de configuration

---

## 🚀 Instructions Pas à Pas

### Étape 1: Créer compte Upstash (5 min)

1. Aller sur: https://console.upstash.com/login
2. Se connecter avec GitHub (recommandé)
3. Plan FREE suffit (10k commandes/jour)

### Étape 2: Créer Redis Database (2 min)

**Dans Upstash Console**:

1. Click **"Create Database"**
2. Configurer:
   - **Name**: `mycryptopilot-prod`
   - **Type**: **Regional** (pas EverywhereReplica)
   - **Region**: `eu-west-1` (Ireland) - proche Vercel + Fly Europe
   - **Eviction**: **noeviction** ⚠️ Important pour BullMQ jobs
3. Click **"Create"**

### Étape 3: Copier Redis URL (1 min)

**Dans database details**:

1. Click sur l'onglet **"Redis"** (pas REST API)
2. Section **"Connect with ioredis"**
3. Copier la connection string complète:
   ```
   rediss://default:[PASSWORD]@[HOST].upstash.io:6379
   ```

⚠️ **Important**: Utiliser **"Redis Protocol"** (rediss://), PAS "REST API" !

### Étape 4: Exécuter le script setup (3 min)

**Depuis la racine du projet**:

```bash
pnpm tsx scripts/setup-redis.ts
```

**Le script va**:
1. Demander la Redis URL
2. Valider le format
3. Tester la connexion
4. Mettre à jour `.env.local`
5. Mettre à jour `.env.example`
6. Afficher les next steps pour Vercel + Fly

**Exemple d'interaction**:

```
🔴 Redis Setup - Upstash Configuration

▸ Checking existing Redis configuration...
▸ Enter Redis URL from Upstash console
   Format: rediss://default:PASSWORD@your-redis.upstash.io:6379
   Get it from: https://console.upstash.com/redis

REDIS_URL: rediss://default:YOUR_PASSWORD_HERE@your-redis.upstash.io:6379

▸ Validating Redis URL format...
✓ URL format valid
ℹ Testing Redis connection...
✓ Redis connection successful!
▸ Updating .env.local...
ℹ Added REDIS_URL to .env.local
✓ .env.local updated
▸ Updating .env.example...
✓ .env.example updated with REDIS_URL placeholder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ Redis Setup Complete - Next Steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Vercel (Production):
   1. Via Dashboard:
      → https://vercel.com/[YOUR_TEAM]/mycryptopilot/settings/environment-variables
      → Add variable: REDIS_URL
      → Value: rediss://default:...
      → Environment: Production

   2. Via CLI:
      echo "rediss://..." | vercel env add REDIS_URL production

🪰 Fly.io Worker:
   fly secrets set REDIS_URL="rediss://..." -a mycryptopilot-worker

   Verify secrets:
   fly secrets list -a mycryptopilot-worker

🚀 Redeploy:
   Vercel: Automatic on next git push to main
   Fly.io: pnpm worker:deploy

📚 Documentation:
   Full guide: .claude/docs/REDIS-SETUP.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Phase 1.3a complete! ✅
```

### Étape 5: Configurer Vercel (2 min)

**Option A - Via Dashboard**:

1. Aller sur: https://vercel.com/[YOUR_TEAM]/mycryptopilot/settings/environment-variables
2. Click **"Add New"**
3. **Key**: `REDIS_URL`
4. **Value**: Coller la Redis URL d'Upstash
5. **Environment**: Cocher **Production**
6. Click **"Save"**

**Option B - Via CLI** (plus rapide):

```bash
echo "rediss://default:[PASSWORD]@[HOST].upstash.io:6379" | vercel env add REDIS_URL production
```

### Étape 6: Configurer Fly.io Worker (2 min)

```bash
fly secrets set REDIS_URL="rediss://default:[PASSWORD]@[HOST].upstash.io:6379" -a mycryptopilot-worker
```

**Vérifier les secrets**:

```bash
fly secrets list -a mycryptopilot-worker
```

**Redéployer le worker**:

```bash
pnpm worker:deploy
```

(Équivalent à: `fly deploy --config fly.worker.toml --ha=false`)

---

## ✅ Validation

### Test Local

```bash
# Test direct avec Node.js
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(res => {
  console.log('✅ Redis:', res === 'PONG' ? 'SUCCESS' : 'FAILED');
  redis.quit();
});
"
```

**Expected**: `✅ Redis: SUCCESS`

### Test Vercel (après déploiement)

Créer endpoint test `app/api/test-redis/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { pingRedis } from "@/lib/cache/redis-client";

export async function GET() {
  const isConnected = await pingRedis();
  return NextResponse.json({
    redis: isConnected ? "connected" : "disconnected",
    url: process.env.REDIS_URL ? "configured" : "missing",
  });
}
```

Visit: `https://mycryptopilot.app/api/test-redis`

**Expected**:
```json
{
  "redis": "connected",
  "url": "configured"
}
```

### Test Fly Worker

```bash
# SSH into Fly machine
fly ssh console -a mycryptopilot-worker

# Inside machine:
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(res => {
  console.log('Redis:', res);
  redis.quit();
});
"
```

**Expected**: `Redis: PONG`

---

## 🔧 Troubleshooting

### ❌ Error: "Connection timeout"

**Cause**: Redis URL incorrecte ou database pausée

**Fix**:
1. Vérifier format: `rediss://` (avec SSL)
2. Check Upstash console → Database est "Active"
3. Vérifier région permet connexions depuis Vercel/Fly

### ❌ Error: "NOAUTH Authentication required"

**Cause**: Password manquant dans Redis URL

**Fix**:
1. Copier exact connection string depuis Upstash
2. Doit inclure `default:[PASSWORD]@`
3. Check caractères spéciaux nécessitent URL encoding

### ❌ Error: "ioredis not found"

**Cause**: Package pas installé

**Fix**:
```bash
pnpm add ioredis
```

### ❌ Error: "SSL routines"

**Cause**: Utilise `redis://` au lieu de `rediss://`

**Fix**: Change URL pour utiliser `rediss://` (SSL enabled)

### ⚠️ BullMQ jobs not processing

**Cause**: Redis pas configuré pour BullMQ

**Fix**:
1. Check `src/lib/queue/config.ts` utilise `getRedisConnection()`
2. Verify `REDIS_URL` env var est set
3. Check worker logs: `fly logs -a mycryptopilot-worker`

---

## 📊 Monitoring Upstash

**Dans Upstash Dashboard**:

- **Commands/sec**: Devrait piquer pendant signal creation (auto-copy jobs)
- **Memory usage**: Watch for memory leaks (queue retention)
- **Latency**: Devrait être <10ms pour EU region

**Expected Redis Usage**:

**Scénario**: 1 signal → 100 followers auto-copy
- ~200 commands (queue + circuit breaker + SSE)
- ~2KB memory per job
- Retention: 24h completed, 7d failed

**Daily volume estimate** (50 signals/day):
- ~10k commands/day (FREE tier limite)
- ~100KB memory (négligeable)

---

## ✅ Checklist Phase 1.3a

- [ ] Compte Upstash créé
- [ ] Redis database créée (Regional, eu-west-1, noeviction)
- [ ] Redis URL copiée (format: `rediss://...`)
- [ ] Script `setup-redis.ts` exécuté avec succès
- [ ] `.env.local` mis à jour
- [ ] Test local connexion OK
- [ ] Vercel env var configurée
- [ ] Fly secret configuré
- [ ] Fly worker redéployé
- [ ] Test Vercel endpoint OK
- [ ] Test Fly worker OK

**Une fois tous cochés** → ✅ **Phase 1.3a COMPLETE!**

---

## 🚀 Next Steps

Après Phase 1.3a:

1. → **Phase 1.3b**: Refactor SSE avec Redis pub/sub (6-8h)
2. → **Phase 1.3c**: Fix worker pour déchiffrer clés API (2-4h)

Voir: `.claude/docs/REDIS-SETUP.md` pour détails complets

---

**Phase 1.3a Status**: ✅ Ready to Execute
**Temps total**: ~15-20 minutes
**Prérequis**: Compte Upstash, Vercel access, Fly CLI configuré
# Updated: Mon Jan 26 16:38:28 CET 2026
