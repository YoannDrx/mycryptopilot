# clean-worktree.sh

## What it does

Automatically removes Git worktrees for merged pull requests and deleted branches.

## Why use it

- **Cleanup**: Keeps your workspace tidy by removing completed work
- **Automatic**: No manual tracking of which PRs are merged
- **Safe**: Only removes worktrees, never affects main directory
- **Storage**: Frees up disk space from old feature branches

## How to use

```bash
# From project root
./.claude/scripts/clean-worktree.sh

# Or via pnpm (recommended)
pnpm worktree:clean
```

**No arguments needed.** The script will:

1. Fetch remote and prune deleted branches
2. Check all worktrees for merged PRs or deleted branches
3. Remove obsolete worktrees automatically from `~/Developer/worktrees/mycryptopilot-worktrees/`
4. Show remaining active worktrees

**Example output:**

```
🧹 Cleaning up obsolete worktrees...
Checking: issue-42-add-portfolio-page
  → PR #42 merged, removing worktree
Checking: issue-51-fix-auth-bug
  → PR #51 merged, removing worktree

✅ Done! Remaining worktrees:
/Users/yoannandrieux/Projets/mycryptopilot  66498c3 [main]
```

**💡 Tip:** Run this periodically (e.g., weekly) to maintain a clean development environment and free up disk space.
