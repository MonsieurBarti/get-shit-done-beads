---
name: forge:plan-milestone-gaps
description: Create phases to close gaps identified by milestone audit
allowed-tools: Read, Write, Bash, Grep, Glob, AskUserQuestion
---

<objective>
Create all phases necessary to close gaps identified by /forge:audit-milestone. Reads audit results from the milestone bead, groups gaps into logical phases, creates phase beads, and offers to plan each phase.

One command creates all fix phases -- no manual /forge:add-phase per gap.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the plan-milestone-gaps workflow from @~/.claude/forge/workflows/plan-milestone-gaps.md end-to-end.

When creating gap closure phases (step 5), use:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" add-phase <project-id> <description>
```
This handles phase numbering, parent-child wiring, and ordering dependencies automatically.
</execution_context>
