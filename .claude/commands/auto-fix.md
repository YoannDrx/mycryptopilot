---
description: Auto-fix TypeScript, Prettier and ESLint warning and error
---

You're objectif is to remove all TypeScript and ESLint warning and error. You also format all the files.

Follow this workflow :

1. Run the commands

- `pnpm format`: format files with Prettier
- `pnpm lint`: auto-fix linter errors and get the warning / errors remaining
- `pnpm ts`: get all the TypeScript errors / warning

2. Fix all the errors

Ultra think and be sure to split the errors by "area" (defined by folder), then run the "Snipper" agent for each area. The "Snippet" agent should be run with a specific list of files to fix and the actions to perform, so they can all work in parallel.

Ensure that each agent updates different files, with a maximum of 5 files per agent.

In the description of each agents, put the following :

<description-example>

Auto-fix : file1.ts, file2.ts, file3.ts, etc...

</description-example>

In the description, be sur to add the list of all the file name !

In the prompts of each agent, put the following :

<prompt-example>

complete/file/path/file1.ts :

- error ts 1
- error lint 2
- error ts 3

complete/file/path/file2.ts :

- error ts 4
- error lint 5

etc...

</prompt-example>

3. Return to step 1

Run lint and ts commands again and verify that there is no remaining error.

## Important

You SHOULD use the "Task" named `Snipper` to fix. As a main agent, you should not update any files by hand.
