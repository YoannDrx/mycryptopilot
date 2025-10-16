#!/bin/bash

# Script de diagnostic pour l'environnement de test

# Ajouter Postgres.app au PATH (requis pour pg_isready, psql)
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

echo "🔍 Diagnostic de l'environnement de test"
echo "========================================"
echo ""

# Check PostgreSQL
echo "📊 PostgreSQL Status:"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL is running on localhost:5432"

    # Get PostgreSQL version
    PG_VERSION=$(psql --version 2>/dev/null || echo "N/A")
    echo "  📦 Version: $PG_VERSION"

    # Get current user
    PG_USER=${PGUSER:-$(whoami)}
    echo "  👤 User: $PG_USER"
else
    echo "  ❌ PostgreSQL is NOT accessible on localhost:5432"
    echo "     → Start Postgres.app or check your PostgreSQL installation"
fi

echo ""

# Check test database
echo "🗄️  Test Database:"
PG_USER=${PGUSER:-$(whoami)}
if psql -h localhost -U "$PG_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw mycryptopilot_test; then
    echo "  ✅ Database 'mycryptopilot_test' exists"

    # Count tables
    TABLE_COUNT=$(psql -h localhost -U "$PG_USER" -d mycryptopilot_test -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "  📊 Tables: $TABLE_COUNT"
else
    echo "  ❌ Database 'mycryptopilot_test' does NOT exist"
    echo "     → Run 'pnpm db:setup-test' to create it"
fi

echo ""

# Check environment variables
echo "🔐 Environment Variables:"
if [ -f ".env.local" ]; then
    echo "  ✅ .env.local exists"

    # Check if DATABASE_URL is set (without showing the full URL for security)
    if grep -q "DATABASE_URL" .env.local; then
        DB_TYPE=$(grep "DATABASE_URL" .env.local | head -1 | cut -d'=' -f2 | cut -d'/' -f3 | cut -d'@' -f2 | cut -d'/' -f1)
        if [[ "$DB_TYPE" == *"neon.tech"* ]]; then
            echo "  📍 .env.local → Neon Cloud (dev)"
        elif [[ "$DB_TYPE" == "localhost:5432" ]]; then
            echo "  📍 .env.local → PostgreSQL Local"
        else
            echo "  📍 .env.local → Unknown database type"
        fi
    fi
else
    echo "  ⚠️  .env.local does NOT exist"
fi

echo ""

# Check Prisma
echo "🔧 Prisma:"
if command -v prisma &> /dev/null; then
    PRISMA_VERSION=$(prisma --version 2>/dev/null | grep "prisma" | head -1 || echo "N/A")
    echo "  ✅ Prisma CLI available"
    echo "  📦 $PRISMA_VERSION"

    # Check if schema exists
    if [ -f "prisma/schema.prisma" ]; then
        echo "  ✅ prisma/schema.prisma exists"
    else
        echo "  ❌ prisma/schema.prisma NOT found"
    fi
else
    echo "  ❌ Prisma CLI NOT found"
fi

echo ""

# Check Node.js and pnpm
echo "📦 Dependencies:"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js: $NODE_VERSION"
else
    echo "  ❌ Node.js NOT found"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo "  ✅ pnpm: v$PNPM_VERSION"
else
    echo "  ❌ pnpm NOT found"
fi

echo ""

# Check Playwright
echo "🎭 Playwright:"
if [ -d "node_modules/@playwright/test" ]; then
    echo "  ✅ @playwright/test installed"

    # Check if browsers are installed
    if npx playwright --version &> /dev/null; then
        PLAYWRIGHT_VERSION=$(npx playwright --version 2>/dev/null || echo "N/A")
        echo "  📦 $PLAYWRIGHT_VERSION"
    fi
else
    echo "  ❌ @playwright/test NOT installed"
    echo "     → Run 'pnpm install' to install dependencies"
fi

echo ""
echo "========================================"
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "  1. Fix any ❌ issues above"
echo "  2. Run 'pnpm db:setup-test' if database doesn't exist"
echo "  3. Run 'pnpm test:e2e' to start testing"
