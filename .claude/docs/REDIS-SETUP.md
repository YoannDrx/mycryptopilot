# 🔴 Redis Setup Guide - Upstash

**Phase 1.3a**: Setup Upstash Redis pour SSE (Server-Sent Events) et BullMQ

---

## 🎯 Objectif

Configurer Redis cloud (Upstash) pour:
- **SSE pub/sub** - Balance updates en temps réel pour traders
- **BullMQ** - Job queue pour copy-trading automation
- **Circuit breaker** - Rate limiting distribué

---

## 📋 Plan d'Action

### 1. Créer compte Upstash (si pas déjà fait)

**URL**: https://console.upstash.com/login

- Connexion avec GitHub (recommandé)
- Plan FREE suffisant pour démarrage (10k commandes/jour)

### 2. Créer Redis Database

**Dans Upstash Console**:

1. Click "Create Database"
2. **Name**: `mycryptopilot-prod`
3. **Type**: Regional (meilleure latence qu'EverywhereReplica pour single region)
4. **Region**: `eu-west-1` (Ireland) - proche Vercel + Fly Europe
5. **Eviction**: `noeviction` (important pour queue jobs)
6. Click "Create"

**Récupérer REDIS_URL**:
- Dans database details → "REST API" tab
- Copy `UPSTASH_REDIS_REST_URL` (format: `https://...upstash.io`)

**Ou préférer Redis Protocol**:
- Tab "Redis" → Copy **"Connect with ioredis"**
- Format: `rediss://default:[PASSWORD]@[HOST]:6379`

**⚠️ Important**: Utiliser la connection string **Redis Protocol** (pas REST API) car `ioredis` utilise le protocole Redis natif.

---

## 📝 Configuration Environment Variables

### Local Development (`.env.local`)

```bash
# Redis (Upstash)
REDIS_URL="rediss://default:[PASSWORD]@[HOST]:6379"
```

**Update `.env.example`**:
```bash
# Add to .env.example
# Redis (Upstash) - For SSE pub/sub and BullMQ
REDIS_URL="rediss://default:YOUR_PASSWORD@your-redis.upstash.io:6379"
```

### Vercel (Production)

```bash
# Via Vercel Dashboard ou CLI
vercel env add REDIS_URL production

# Paste: rediss://default:[PASSWORD]@[HOST]:6379
```

**Ou via CLI**:
```bash
echo "rediss://default:[PASSWORD]@[HOST]:6379" | vercel env add REDIS_URL production
```

### Fly.io Worker

```bash
# Set secret for Fly worker
fly secrets set REDIS_URL="rediss://default:[PASSWORD]@[HOST]:6379" -a mycryptopilot-worker
```

**Verify secrets**:
```bash
fly secrets list -a mycryptopilot-worker
```

---

## ✅ Validation

### Test Redis Connection Locally

```bash
# From project root
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(res => {
  console.log('✅ Redis connected:', res === 'PONG' ? 'SUCCESS' : 'FAILED');
  redis.quit();
}).catch(err => {
  console.error('❌ Redis connection failed:', err.message);
  process.exit(1);
});
"
```

**Expected output**:
```
✅ Redis connected: SUCCESS
```

### Test from Vercel (after deploy)

Create test endpoint `app/api/test-redis/route.ts`:

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

Expected:
```json
{
  "redis": "connected",
  "url": "configured"
}
```

### Test from Fly Worker

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

---

## 🔧 Troubleshooting

### Error: "Connection timeout"

**Cause**: Wrong Redis URL or Upstash database not accessible

**Fix**:
1. Verify `REDIS_URL` format: must be `rediss://` (with SSL)
2. Check Upstash console → Database is "Active" (not paused)
3. Verify region allows connections from Vercel/Fly IPs

### Error: "NOAUTH Authentication required"

**Cause**: Missing or wrong password in Redis URL

**Fix**:
1. Copy exact connection string from Upstash console
2. Must include `default:[PASSWORD]@` part
3. Check for special characters that need URL encoding

### Error: "ioredis not found"

**Cause**: ioredis package not installed

**Fix**:
```bash
pnpm add ioredis
```

### Error: "SSL routines:ssl3_get_record:wrong version number"

**Cause**: Using `redis://` instead of `rediss://`

**Fix**: Change URL to use `rediss://` (SSL enabled)

### BullMQ jobs not processing

**Cause**: Redis connection not configured for BullMQ

**Fix**:
1. Check `src/lib/queue/config.ts` uses `getRedisConnection()`
2. Verify `REDIS_URL` env var is set
3. Check worker logs: `fly logs -a mycryptopilot-worker`

---

## 📊 Monitoring

### Upstash Dashboard

- **Commands/sec**: Should spike during signal creation (auto-copy jobs)
- **Memory usage**: Watch for memory leaks (queue retention)
- **Latency**: Should be <10ms for EU region

### Expected Redis Usage

**Copy-trading scenario** (1 signal → 100 followers):
- ~200 commands (queue + circuit breaker + SSE)
- ~2KB memory per job (retention: 24h completed, 7d failed)

**Daily volume estimate** (50 signals/day):
- ~10k commands/day (well within FREE tier)
- ~100KB memory (negligible)

---

## 🚀 Next Steps

Once Redis is configured:

1. ✅ **Phase 1.3a complete** - Redis URL configured everywhere
2. → **Phase 1.3b** - Refactor SSE with Redis pub/sub
3. → **Phase 1.3c** - Fix worker to decrypt API keys

---

## 📚 References

- [Upstash Redis Docs](https://upstash.com/docs/redis/overall/getstarted)
- [ioredis GitHub](https://github.com/redis/ioredis)
- [BullMQ with Redis](https://docs.bullmq.io/guide/connections)
- [Redis Pub/Sub Pattern](https://redis.io/docs/interact/pubsub/)
