---
name: forge:complete-milestone
description: Archive completed milestone — verify, summarize, and close milestone epic
argument-hint: "[milestone-id-or-name]"
allowed-tools: Read, Bash, Grep, Glob, AskUserQuestion
---

<objective>
Mark a milestone as complete. Verify all phases are closed, generate a retrospective summary, close the milestone epic, and suggest next steps.

Checks for audit status first: recommends /forge:audit-milestone if no audit exists, or /forge:plan-milestone-gaps if gaps were found.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the complete-milestone workflow from @~/.claude/forge/workflows/complete-milestone.md end-to-end.

When loading milestone context (step 1), use:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" milestone-list <project-id>
```

This returns all milestones with their phases, status, and completion stats.
</execution_context>
