#!/bin/bash

# Script pour configurer la base de données de test
# Fonctionne avec Conductor, Postgres.app ou Docker

set -e

echo "🔍 Vérification de PostgreSQL..."

# Vérifier que PostgreSQL est accessible
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL n'est pas accessible sur localhost:5432"
    echo ""
    echo "Solutions possibles :"
    echo "  1. Ouvrez Conductor et démarrez PostgreSQL"
    echo "  2. Ouvrez Postgres.app et démarrez le serveur"
    echo "  3. Lancez 'pnpm db:start' pour utiliser Docker"
    exit 1
fi

echo "✅ PostgreSQL est accessible"

# Déterminer l'utilisateur PostgreSQL à utiliser
# Conductor/Postgres.app: utilise l'utilisateur macOS
# Docker: utilise 'postgres' avec mot de passe
PG_USER=${PGUSER:-$(whoami)}

# Créer la base de données si elle n'existe pas
echo "🗄️  Création de la base de données 'mycryptopilot_test'..."

if psql -h localhost -U "$PG_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw mycryptopilot_test; then
    echo "✅ La base de données 'mycryptopilot_test' existe déjà"
else
    createdb -h localhost -U "$PG_USER" mycryptopilot_test 2>/dev/null || true
    echo "✅ Base de données 'mycryptopilot_test' créée"
fi

# Appliquer les migrations
echo "🔄 Application des migrations..."
# Temporarily hide .env and .env.local to prevent Prisma from loading them
# This forces Prisma to use DATABASE_URL from environment variable
[ -f .env ] && mv .env .env.backup
[ -f .env.local ] && mv .env.local .env.local.backup

# Export DATABASE_URL for test database
export DATABASE_URL="postgresql://$PG_USER:@localhost:5432/mycryptopilot_test"
export DATABASE_URL_UNPOOLED="postgresql://$PG_USER:@localhost:5432/mycryptopilot_test"

# Run migrations
npx prisma migrate deploy

# Restore .env files
[ -f .env.backup ] && mv .env.backup .env
[ -f .env.local.backup ] && mv .env.local.backup .env.local

echo ""
echo "✅ Base de données de test configurée avec succès !"
echo ""
echo "Vous pouvez maintenant lancer les tests E2E :"
echo "  pnpm test:e2e"
