#!/bin/bash
# Test script for crypto payment watcher functionality

echo "🔍 Testing Crypto Payment Watcher"
echo "================================="
echo ""

# Check if RPC URLs are configured
echo "📡 Checking RPC URLs..."
if [ -z "$BASE_RPC_URL" ]; then
  echo "⚠️  BASE_RPC_URL not set"
else
  echo "✅ BASE_RPC_URL: $BASE_RPC_URL"
fi

if [ -z "$TRON_RPC_URL" ]; then
  echo "⚠️  TRON_RPC_URL not set"
else
  echo "✅ TRON_RPC_URL: $TRON_RPC_URL"
fi

echo ""

# Check if XPUB keys are configured
echo "🔑 Checking XPUB keys..."
if [ -z "$CRYPTO_XPUB_BASE" ]; then
  echo "⚠️  CRYPTO_XPUB_BASE not set"
else
  echo "✅ CRYPTO_XPUB_BASE configured"
fi

if [ -z "$CRYPTO_XPUB_TRON" ]; then
  echo "⚠️  CRYPTO_XPUB_TRON not set"
else
  echo "✅ CRYPTO_XPUB_TRON configured"
fi

echo ""
echo "🧪 Running unit tests..."
pnpm test:ci __tests__/crypto/payment-watcher.test.ts

echo ""
echo "✨ Test completed!"
