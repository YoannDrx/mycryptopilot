#!/bin/bash

# Git Worktree Environment Checker
#
# This script checks if all required tools and dependencies are installed
# for using Git worktrees with MyCryptoPilot.

echo "🔍 Git Worktrees Environment Check"
echo "===================================="
echo ""

# Check CLI tools
echo "📦 Required CLI Tools:"

# Check gh (GitHub CLI)
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -1)
    echo "  ✅ GitHub CLI: $GH_VERSION"

    # Check gh authentication
    if gh auth status &> /dev/null; then
        GH_USER=$(gh api user --jq '.login' 2>/dev/null || echo "Unknown")
        echo "     👤 Authenticated as: $GH_USER"
    else
        echo "     ⚠️  Not authenticated. Run: gh auth login"
    fi
else
    echo "  ❌ GitHub CLI (gh) NOT found"
    echo "     → Install: brew install gh"
fi

# Check claude (Claude CLI)
if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "installed")
    echo "  ✅ Claude CLI: $CLAUDE_VERSION"
else
    echo "  ❌ Claude CLI NOT found"
    echo "     → Install: curl https://claude.ai/cli | sh"
fi

# Check jq (JSON parser)
if command -v jq &> /dev/null; then
    JQ_VERSION=$(jq --version)
    echo "  ✅ jq: $JQ_VERSION"
else
    echo "  ❌ jq NOT found"
    echo "     → Install: brew install jq"
fi

# Check Ghostty
if [ -d "/Applications/Ghostty.app" ] || command -v ghostty &> /dev/null; then
    echo "  ✅ Ghostty: installed"
else
    echo "  ⚠️  Ghostty NOT found (optional)"
    echo "     → Download: https://ghostty.org/"
fi

echo ""

# Check Git worktrees
echo "📂 Git Worktrees:"
WORKTREE_COUNT=$(git worktree list | wc -l | xargs)
WORKTREE_COUNT=$((WORKTREE_COUNT - 1)) # Exclude main worktree

if [ "$WORKTREE_COUNT" -eq 0 ]; then
    echo "  📊 No additional worktrees (only main repo)"
else
    echo "  📊 Active worktrees: $WORKTREE_COUNT"
    echo ""
    git worktree list | tail -n +2 | while read -r line; do
        path=$(echo "$line" | awk '{print $1}')
        branch=$(echo "$line" | grep -o '\[.*\]' | tr -d '[]')
        echo "     - $branch → $path"
    done
fi

echo ""

# Check worktrees directory
WORKTREES_DIR="$HOME/Developer/worktrees/$(basename "$(pwd)")-worktrees"
echo "📁 Worktrees Directory:"
if [ -d "$WORKTREES_DIR" ]; then
    DISK_USAGE=$(du -sh "$WORKTREES_DIR" 2>/dev/null | awk '{print $1}')
    echo "  📍 $WORKTREES_DIR"
    echo "  💾 Disk usage: $DISK_USAGE"
else
    echo "  📍 $WORKTREES_DIR (not created yet)"
fi

echo ""

# Check project specifics
echo "🔧 MyCryptoPilot Configuration:"

# Check .env files
if [ -f ".env.local" ]; then
    echo "  ✅ .env.local exists (will be copied to worktrees)"
else
    echo "  ⚠️  .env.local NOT found"
fi

if [ -f ".env.test.local" ]; then
    echo "  ✅ .env.test.local exists (will be copied to worktrees)"
else
    echo "  ⚠️  .env.test.local NOT found"
fi

# Check Prisma
if [ -f "prisma/schema.prisma" ]; then
    echo "  ✅ Prisma schema found"

    if [ -f "prisma.config.ts" ]; then
        echo "  ✅ prisma.config.ts (multi-file schema support)"
    fi
fi

# Check package manager
if [ -f "pnpm-lock.yaml" ]; then
    echo "  ✅ Package manager: pnpm"
elif [ -f "yarn.lock" ]; then
    echo "  ⚠️  Package manager: yarn (pnpm recommended)"
else
    echo "  ⚠️  Package manager: npm (pnpm recommended)"
fi

echo ""
echo "===================================="

# Summary
MISSING_TOOLS=0
command -v gh &> /dev/null || ((MISSING_TOOLS++))
command -v claude &> /dev/null || ((MISSING_TOOLS++))
command -v jq &> /dev/null || ((MISSING_TOOLS++))

if [ "$MISSING_TOOLS" -eq 0 ]; then
    echo "✅ All required tools are installed!"
    echo ""
    echo "Next steps:"
    echo "  1. Create a worktree: pnpm worktree:setup <github-issue-url>"
    echo "  2. List worktrees: pnpm worktree:list"
    echo "  3. Clean worktrees: pnpm worktree:clean"
    echo ""
    echo "📖 Full documentation: README-WORKTREES.md"
else
    echo "⚠️  Missing $MISSING_TOOLS required tool(s)"
    echo ""
    echo "Please install missing tools and run this check again:"
    echo "  pnpm worktree:check"
fi
