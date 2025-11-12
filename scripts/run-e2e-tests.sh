#!/bin/bash

# ==============================================================================
# 🧪 E2E Tests Runner - MyCryptoPilot
# ==============================================================================
# Ce script automatise le setup et l'exécution des tests E2E Playwright
#
# Usage:
#   ./scripts/run-e2e-tests.sh [--reuse-db] [--reuse-server] [playwright-args...]
#   ou: pnpm test:e2e:ci
#
# Ce script va:
#   1. Nettoyer les serveurs Next.js existants (évite les conflits de port)
#   2. Libérer le port 3000 si occupé
#   3. Setup la base de données de test (mycryptopilot_test)
#   4. Lancer les tests Playwright (Playwright démarrera son propre serveur)
# ==============================================================================

set -e  # Exit on error

# ------------------------------------------------------------------------------
# CLI flags
# ------------------------------------------------------------------------------
SKIP_DB_SETUP=${SKIP_DB_SETUP:-false}
SKIP_SERVER_CLEANUP=${SKIP_SERVER_CLEANUP:-false}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reuse-db)
      SKIP_DB_SETUP=true
      shift
      ;;
    --reuse-server)
      SKIP_SERVER_CLEANUP=true
      shift
      ;;
    --)
      shift
      break
      ;;
    -*)
      # Unknown flag -> stop parsing and let Playwright handle it
      break
      ;;
    *)
      break
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

load_test_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    echo -e "${GREEN}   ℹ️  Variables chargées depuis ${file}\n${NC}"
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
  fi
}

echo -e "${BLUE}==============================================================================\n${NC}"
echo -e "${BLUE}🧪 MyCryptoPilot - E2E Tests Runner\n${NC}"
echo -e "${BLUE}==============================================================================\n${NC}"

# Detect if Playwright expects an external server (skips internal management)
USE_EXTERNAL_SERVER=false
if [[ -n "${PLAYWRIGHT_TEST_BASE_URL:-}" ]]; then
  USE_EXTERNAL_SERVER=true
fi

if [[ "$USE_EXTERNAL_SERVER" == true && "$SKIP_DB_SETUP" == false ]]; then
  SKIP_DB_SETUP=true
  echo -e "${GREEN}   ℹ️  Serveur externe détecté → DB conservée (utilisez --reuse-db=false pour forcer le reset)\n${NC}"
fi

# ------------------------------------------------------------------------------
# Step 1: Cleanup existing Next.js servers (unless external server is provided)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🧹 Étape 1/4 : Nettoyage des serveurs Next.js existants...\n${NC}"

if [[ "$USE_EXTERNAL_SERVER" == true || "$SKIP_SERVER_CLEANUP" == true ]]; then
  if [[ "$SKIP_SERVER_CLEANUP" == true && "$USE_EXTERNAL_SERVER" != true ]]; then
    echo -e "${GREEN}   ℹ️  Option --reuse-server activée, nettoyage ignoré\n${NC}"
  else
    echo -e "${GREEN}   ℹ️  Serveur externe détecté (${PLAYWRIGHT_TEST_BASE_URL}), nettoyage ignoré\n${NC}"
  fi
else
  # Kill all next-server processes
  if pkill -f "next-server" 2>/dev/null; then
    echo -e "${GREEN}   ✅ Serveurs Next.js arrêtés\n${NC}"
  else
    echo -e "${GREEN}   ℹ️  Aucun serveur Next.js à arrêter\n${NC}"
  fi

  # Wait a bit to ensure processes are fully killed
  sleep 1
fi

# ------------------------------------------------------------------------------
# Step 2: Free port 3000 if occupied (unless external server is provided)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🔓 Étape 2/4 : Libération du port 3000...\n${NC}"

if [[ "$USE_EXTERNAL_SERVER" == true || "$SKIP_SERVER_CLEANUP" == true ]]; then
  echo -e "${GREEN}   ℹ️  Port 3000 conservé (serveur externe ou --reuse-server)\n${NC}"
else
  # Kill any process using port 3000
  if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Port 3000 occupé, arrêt du processus...\n${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}   ✅ Port 3000 libéré\n${NC}"
  else
    echo -e "${GREEN}   ℹ️  Port 3000 déjà libre\n${NC}"
  fi

  # Wait a bit to ensure port is fully released
  sleep 1
fi

# ------------------------------------------------------------------------------
# Step 3: Setup test database
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🗄️  Étape 3/4 : Configuration de la base de données de test...\n${NC}"

if [[ "$SKIP_DB_SETUP" == true ]]; then
  echo -e "${GREEN}   ℹ️  Option --reuse-db activée, réutilisation de la base existante\n${NC}"
else
  # Run the test database setup script with NODE_ENV=test
  # This ensures .env.test.local is loaded (overrides .env.local)
  if NODE_ENV=test ./scripts/setup-test-db.sh; then
    echo -e "${GREEN}   ✅ Base de données de test prête\n${NC}"
  else
    echo -e "${RED}   ❌ Échec du setup de la base de données\n${NC}"
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# Load local test env vars (only outside CI) so Next.js + Playwright share DB
# ------------------------------------------------------------------------------
if [[ -z "${CI:-}" ]]; then
  echo -e "${YELLOW}🔐 Chargement des variables d'environnement de test locales...\n${NC}"
  load_test_env_file ".env.test"
  load_test_env_file ".env.test.local"
else
  echo -e "${GREEN}   ℹ️  Environnement CI détecté - variables existantes conservées\n${NC}"
fi

# ------------------------------------------------------------------------------
# Step 4: Run E2E tests
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🧪 Étape 4/4 : Lancement des tests E2E...\n${NC}"
if [[ "$USE_EXTERNAL_SERVER" == true ]]; then
  echo -e "${BLUE}   (Serveur Next.js externe détecté, Playwright utilisera ${PLAYWRIGHT_TEST_BASE_URL})\n${NC}"
else
  echo -e "${BLUE}   (Playwright va démarrer son propre serveur sur le port 3000)\n${NC}"
fi

# Run Playwright tests
# Playwright will automatically:
# - Build the app with NODE_ENV=test
# - Start the server with NODE_ENV=test
# - Use .env.test for environment variables
# - Connect to mycryptopilot_test database

# Pass all script arguments to playwright test
# Examples:
#   ./scripts/run-e2e-tests.sh                           # Run all tests
#   ./scripts/run-e2e-tests.sh e2e/follow-unfollow.spec.ts:7  # Run specific test
#   ./scripts/run-e2e-tests.sh e2e/follow-unfollow.spec.ts     # Run specific file
PLAYWRIGHT_HEADLESS="${HEADLESS:-true}"
PLAYWRIGHT_ARGS=("$@")

if [[ -n "${PLAYWRIGHT_SHARD_INDEX:-}" && -n "${PLAYWRIGHT_SHARD_TOTAL:-}" ]]; then
  PLAYWRIGHT_ARGS+=("--shard=${PLAYWRIGHT_SHARD_INDEX}/${PLAYWRIGHT_SHARD_TOTAL}")
fi

if NODE_ENV=test HEADLESS="$PLAYWRIGHT_HEADLESS" npx playwright test "${PLAYWRIGHT_ARGS[@]}"; then
  echo -e "\n${GREEN}==============================================================================\n${NC}"
  echo -e "${GREEN}✅ Tests E2E terminés avec succès !\n${NC}"
  echo -e "${GREEN}==============================================================================\n${NC}"
  exit 0
else
  echo -e "\n${RED}==============================================================================\n${NC}"
  echo -e "${RED}❌ Les tests E2E ont échoué\n${NC}"
  echo -e "${RED}==============================================================================\n${NC}"
  exit 1
fi
