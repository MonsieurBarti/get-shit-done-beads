---
name: forge:progress
description: Show project progress dashboard from bead graph
argument-hint: ""
allowed-tools: Read, Bash, Grep, Glob
---

<objective>
Display a rich progress dashboard for the current Forge project by querying the bead graph. Show phase completion, current work, blockers, and next steps.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the progress workflow from @~/.claude/forge/workflows/progress.md end-to-end.

When finding the project (step 1), use forge-tools:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project
```

When loading progress (step 2), use both progress and project-context:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" progress <project-id>
node "$HOME/.claude/forge/bin/forge-tools.cjs" project-context <project-id>
```

For the current phase detail, load task-level data:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" phase-context <current-phase-id>
```

When displaying the dashboard (step 3), include:
- Overall progress bar with percentage
- Each phase with task counts and status indicators
- Current phase expanded with individual task statuses
- Requirement coverage summary
- Recent decisions from `bd memories forge`

When suggesting next action (step 4), route based on state:
- Phase has ready tasks -> suggest `/forge:execute <phase>`
- Phase tasks all closed but not verified -> suggest `/forge:verify <phase>`
- Phase verified, next unplanned -> suggest `/forge:plan <next-phase>`
- All complete -> congratulate and suggest new milestone
</execution_context>
