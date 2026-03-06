---
name: forge:cleanup
description: Archive completed work — clean up bead graph after milestone completion
argument-hint: "[--dry-run]"
allowed-tools: Bash, AskUserQuestion
---

<objective>
Clean up the Forge bead graph after milestone completion. Identifies orphan beads, stale todos, and completed phases, then offers bulk operations to tidy the project.

Use when a milestone is complete and the bead graph has accumulated finished work.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the cleanup workflow from @~/.claude/forge/workflows/cleanup.md end-to-end.

If the user passed `--dry-run`, show the cleanup summary but do not execute any changes.

Always present a dry-run summary before making changes, and ask for confirmation
unless `--dry-run` was specified (in which case, stop after the summary).
</execution_context>
