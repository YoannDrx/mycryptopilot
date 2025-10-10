#!/usr/bin/env bash

# ==============================================================================
# Railway Deployment Script for Discord Bot
# ==============================================================================
# This script automates the deployment of the Discord bot to Railway
#
# Usage:
#   chmod +x scripts/deploy-railway.sh
#   ./scripts/deploy-railway.sh
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "===================================================================="
echo "  🚀 Deploying MyCryptoPilot Discord Bot to Railway"
echo "===================================================================="
echo ""

# Step 1: Check if Railway CLI is installed
print_info "Checking Railway CLI installation..."
if ! command -v railway &> /dev/null; then
  print_error "Railway CLI not found"
  echo ""
  print_info "Installing Railway CLI..."
  npm install -g @railway/cli
  print_success "Railway CLI installed"
else
  print_success "Railway CLI is installed"
fi

echo ""

# Step 2: Check if user is logged in
print_info "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
  print_warning "Not logged in to Railway"
  print_info "Opening Railway login..."
  railway login
  print_success "Logged in to Railway"
else
  RAILWAY_USER=$(railway whoami)
  print_success "Logged in as: $RAILWAY_USER"
fi

echo ""

# Step 3: Check if project exists
print_info "Checking Railway project..."
if ! railway status &> /dev/null; then
  print_warning "No Railway project linked"
  echo ""
  print_info "Creating new Railway project..."
  railway init
  print_success "Railway project created"
else
  print_success "Railway project already linked"
fi

echo ""

# Step 4: Configure environment variables
print_info "Configuring environment variables..."
echo ""
print_warning "⚠️  IMPORTANT: You need to set these environment variables on Railway:"
echo ""
echo "Required variables:"
echo "  - DISCORD_BOT_TOKEN"
echo "  - DISCORD_GUILD_ID"
echo "  - DISCORD_BOT_ENABLED=true"
echo "  - DATABASE_URL (Neon production - SAME as Vercel!)"
echo "  - BETTER_AUTH_SECRET (SAME as Vercel!)"
echo "  - NODE_ENV=production"
echo ""

read -p "Have you configured these variables in Railway Dashboard? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "Please configure environment variables first:"
  echo ""
  echo "1. Go to: https://railway.app/dashboard"
  echo "2. Select your project"
  echo "3. Go to Variables tab"
  echo "4. Add the required variables"
  echo ""
  print_info "Or use Railway CLI:"
  echo "  railway variables set DISCORD_BOT_TOKEN='your_token'"
  echo "  railway variables set DISCORD_GUILD_ID='your_guild_id'"
  echo "  railway variables set DISCORD_BOT_ENABLED='true'"
  echo "  railway variables set DATABASE_URL='your_neon_production_url'"
  echo "  railway variables set BETTER_AUTH_SECRET='your_production_secret'"
  echo "  railway variables set NODE_ENV='production'"
  echo ""
  exit 1
fi

echo ""

# Step 5: Deploy to Railway
print_info "Deploying to Railway..."
railway up

echo ""

# Step 6: Show deployment status
print_success "Deployment initiated!"
echo ""
print_info "Checking deployment logs..."
railway logs

echo ""
echo "===================================================================="
echo "  ✅ Deployment Complete!"
echo "===================================================================="
echo ""
print_info "Next steps:"
echo "  1. Check logs: railway logs"
echo "  2. Check status: railway status"
echo "  3. Restart service: railway restart"
echo ""
print_info "Monitor your bot at: https://railway.app/dashboard"
echo ""
