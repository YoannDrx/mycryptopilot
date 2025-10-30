#!/bin/bash

# ==============================================================================
# 🧪 E2E Tests Runner - MyCryptoPilot
# ==============================================================================
# Ce script automatise le setup et l'exécution des tests E2E Playwright
#
# Usage:
#   ./scripts/run-e2e-tests.sh
#   ou: pnpm test:e2e:ci
#
# Ce script va:
#   1. Nettoyer les serveurs Next.js existants (évite les conflits de port)
#   2. Libérer le port 3000 si occupé
#   3. Setup la base de données de test (mycryptopilot_test)
#   4. Lancer les tests Playwright (Playwright démarrera son propre serveur)
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================\n${NC}"
echo -e "${BLUE}🧪 MyCryptoPilot - E2E Tests Runner\n${NC}"
echo -e "${BLUE}==============================================================================\n${NC}"

# ------------------------------------------------------------------------------
# Step 1: Cleanup existing Next.js servers
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🧹 Étape 1/4 : Nettoyage des serveurs Next.js existants...\n${NC}"

# Kill all next-server processes
if pkill -f "next-server" 2>/dev/null; then
  echo -e "${GREEN}   ✅ Serveurs Next.js arrêtés\n${NC}"
else
  echo -e "${GREEN}   ℹ️  Aucun serveur Next.js à arrêter\n${NC}"
fi

# Wait a bit to ensure processes are fully killed
sleep 1

# ------------------------------------------------------------------------------
# Step 2: Free port 3000 if occupied
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🔓 Étape 2/4 : Libération du port 3000...\n${NC}"

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

# ------------------------------------------------------------------------------
# Step 3: Setup test database
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🗄️  Étape 3/4 : Configuration de la base de données de test...\n${NC}"

# Run the test database setup script
if ./scripts/setup-test-db.sh; then
  echo -e "${GREEN}   ✅ Base de données de test prête\n${NC}"
else
  echo -e "${RED}   ❌ Échec du setup de la base de données\n${NC}"
  exit 1
fi

# ------------------------------------------------------------------------------
# Step 4: Run E2E tests
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🧪 Étape 4/4 : Lancement des tests E2E...\n${NC}"
echo -e "${BLUE}   (Playwright va démarrer son propre serveur sur le port 3000)\n${NC}"

# Run Playwright tests
# Playwright will automatically:
# - Build the app with NODE_ENV=test
# - Start the server with NODE_ENV=test
# - Use .env.test for environment variables
# - Connect to mycryptopilot_test database
if NODE_ENV=test HEADLESS=true playwright test; then
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
