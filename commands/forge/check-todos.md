---
name: forge:check-todos
description: List pending todos and select one to work on
argument-hint: "[area filter]"
allowed-tools: Bash, AskUserQuestion
---

<objective>
List all pending forge:todo beads, allow selection, load full context, and route to appropriate action (work now via /forge:quick, add to phase, or brainstorm).
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the check-todos workflow from @~/.claude/forge/workflows/check-todos.md end-to-end.
</execution_context>
