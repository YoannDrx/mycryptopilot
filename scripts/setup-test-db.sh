#!/bin/bash

# Script pour configurer la base de données de test
# Fonctionne en local (Postgres.app) ET sur CI (Docker Postgres)

set -euo pipefail

IS_CI=${GITHUB_ACTIONS:-""}

if [[ -z "$IS_CI" ]]; then
  # En local on utilise Postgres.app (macOS)
  export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
  PG_USER=${PGUSER:-$(whoami)}
  PG_PASSWORD=${PGPASSWORD:-}
else
  # Sur CI (GitHub Actions) on utilise le service docker postgres
  PG_USER=${PGUSER:-postgres}
  PG_PASSWORD=${PGPASSWORD:-}
  if [[ -z "$PG_PASSWORD" ]]; then
    echo "❌ PGPASSWORD doit être fourni via l'environnement CI_POSTGRES_PASSWORD"
    exit 1
  fi
fi

export PGUSER="$PG_USER"
export PGPASSWORD="$PG_PASSWORD"

echo "🔍 Vérification de PostgreSQL..."

if ! pg_isready -h localhost -p 5432 -U "$PG_USER" > /dev/null 2>&1; then
  echo "❌ PostgreSQL n'est pas accessible sur localhost:5432"
  if [[ -z "$IS_CI" ]]; then
    echo ""
    echo "Solutions possibles :"
    echo "  1. Ouvrez Postgres.app et démarrez le serveur"
    echo "  2. Vérifiez que le port 5432 est bien utilisé"
  fi
  exit 1
fi

echo "✅ PostgreSQL est accessible (user: $PG_USER)"

echo "🗄️  Création de la base de données 'mycryptopilot_test'..."

if psql -h localhost -U "$PG_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw mycryptopilot_test; then
  echo "✅ La base de données 'mycryptopilot_test' existe déjà"
else
  createdb -h localhost -U "$PG_USER" mycryptopilot_test
  echo "✅ Base de données 'mycryptopilot_test' créée"
fi

echo "🔄 Application des migrations..."

DB_URL="postgresql://$PG_USER"
if [[ -n "$PG_PASSWORD" ]]; then
  DB_URL="postgresql://$PG_USER:$PG_PASSWORD"
fi
DB_URL+="@localhost:5432/mycryptopilot_test"

export DATABASE_URL="$DB_URL"
export DATABASE_URL_UNPOOLED="$DB_URL"

npx prisma migrate deploy

echo ""
echo "✅ Base de données de test configurée avec succès !"
echo ""
echo "Vous pouvez maintenant lancer les tests E2E :"
echo "  pnpm test:e2e"
