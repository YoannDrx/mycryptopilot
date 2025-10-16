#!/bin/bash

# Script de diagnostic pour vérifier l'environnement de test

echo "🔍 Diagnostic de l'environnement de test"
echo "=========================================="
echo ""

# 1. Vérifier Node.js
echo "1️⃣  Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js installé : $NODE_VERSION"
else
    echo "   ❌ Node.js non trouvé"
fi
echo ""

# 2. Vérifier pnpm
echo "2️⃣  pnpm"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo "   ✅ pnpm installé : v$PNPM_VERSION"
else
    echo "   ❌ pnpm non trouvé"
fi
echo ""

# 3. Vérifier PostgreSQL (binaire)
echo "3️⃣  PostgreSQL CLI"
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo "   ✅ psql installé : $PSQL_VERSION"
else
    echo "   ⚠️  psql non trouvé (pas critique si vous utilisez Conductor)"
fi
echo ""

# 4. Vérifier que PostgreSQL tourne
echo "4️⃣  PostgreSQL Server"
if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "   ✅ PostgreSQL tourne sur localhost:5432"

    # Essayer de se connecter
    echo "   📊 Tentative de connexion..."
    if psql -h localhost -U postgres -d postgres -c "SELECT version();" &> /dev/null 2>&1; then
        echo "   ✅ Connexion réussie avec l'utilisateur 'postgres'"
    else
        echo "   ⚠️  Connexion impossible avec 'postgres' (vérifiez le mot de passe)"
        echo "      Essayez: psql -h localhost -U postgres -d postgres"
    fi
else
    echo "   ❌ PostgreSQL ne répond pas sur localhost:5432"
    echo ""
    echo "   💡 Solutions :"
    echo "      - Ouvrez Conductor.app et démarrez PostgreSQL"
    echo "      - OU ouvrez Postgres.app"
    echo "      - OU lancez 'pnpm db:start' (Docker)"
fi
echo ""

# 5. Vérifier la base de données de test
echo "5️⃣  Base de données de test"
if pg_isready -h localhost -p 5432 &> /dev/null; then
    if psql -h localhost -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw mycryptopilot_test; then
        echo "   ✅ Base de données 'mycryptopilot_test' existe"
    else
        echo "   ⚠️  Base de données 'mycryptopilot_test' n'existe pas"
        echo "      Lancez: pnpm db:setup-test"
    fi
else
    echo "   ⏭️  Ignoré (PostgreSQL non accessible)"
fi
echo ""

# 6. Vérifier le fichier .env.test.local
echo "6️⃣  Configuration .env.test.local"
if [ -f ".env.test.local" ]; then
    echo "   ✅ Fichier .env.test.local existe"
    if grep -q "DATABASE_URL.*localhost:5432" .env.test.local; then
        echo "   ✅ DATABASE_URL pointe vers localhost"
    else
        echo "   ⚠️  DATABASE_URL ne pointe pas vers localhost"
    fi
else
    echo "   ❌ Fichier .env.test.local manquant"
    echo "      Un fichier par défaut a été créé"
fi
echo ""

# 7. Vérifier Playwright
echo "7️⃣  Playwright"
if [ -d "node_modules/@playwright/test" ]; then
    echo "   ✅ Playwright installé"
    PLAYWRIGHT_VERSION=$(npx playwright --version 2>&1 | head -1)
    echo "   📦 $PLAYWRIGHT_VERSION"
else
    echo "   ❌ Playwright non installé"
    echo "      Lancez: pnpm install"
fi
echo ""

# Résumé
echo "=========================================="
echo "📋 RÉSUMÉ"
echo "=========================================="
if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "✅ Vous pouvez lancer les tests E2E"
    echo ""
    echo "Commandes disponibles :"
    echo "  pnpm test:ci       → Tests unitaires"
    echo "  pnpm test:e2e      → Tests E2E (mode UI)"
    echo "  npx playwright test → Tests E2E (headless)"
else
    echo "⚠️  PostgreSQL doit être démarré avant les tests E2E"
    echo ""
    echo "Prochaines étapes :"
    echo "  1. Démarrez PostgreSQL dans Conductor"
    echo "  2. Lancez: pnpm db:setup-test"
    echo "  3. Lancez: pnpm test:e2e"
fi
echo ""
