#!/bin/bash
# Wrapper to test crypto address generation with environment variables loaded

set -a  # automatically export all variables
source .env.local
set +a

NODE_ENV=development npx tsx scripts/test-address-generation.ts
