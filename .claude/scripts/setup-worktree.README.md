# setup-worktree.sh

## What it does

Creates an isolated Git worktree for a GitHub issue with intelligent branch naming and complete development setup.

## Why use it

- **Isolation**: Work on features without affecting main codebase
- **Smart naming**: AI generates descriptive branch names from issue content
- **Complete setup**: Automatically installs dependencies, copies env files, runs Prisma
- **Integration**: Opens Claude in plan mode for the issue

## How to use

```bash
# From project root
./.claude/scripts/setup-worktree.sh <github-issue-url>

# Or via pnpm (recommended)
pnpm worktree:setup <github-issue-url>
```

**Examples:**

```bash
# Example 1: Create worktree for issue #42
pnpm worktree:setup https://github.com/YoannDrx/mycryptopilot/issues/42

# Example 2: Using script directly
./.claude/scripts/setup-worktree.sh https://github.com/YoannDrx/mycryptopilot/issues/123
```

**What happens:**

- Creates worktree at: `~/Developer/worktrees/mycryptopilot-worktrees/issue-XX-descriptive-name/`
- Copies all `.env*` files from main project
- Installs dependencies (`pnpm install`)
- Generates Prisma Client (`pnpm prisma generate`)
- Opens Ghostty terminal with Claude in plan mode
