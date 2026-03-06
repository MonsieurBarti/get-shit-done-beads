---
name: forge:add-todo
description: Capture idea or task as todo from current conversation context
argument-hint: "[optional description]"
allowed-tools: Bash, AskUserQuestion
---

<objective>
Capture an idea, task, or issue that surfaces during a Forge session as a tracked todo bead for later work.

Enables "thought -> capture -> continue" flow without losing context.
Unlike phase tasks, todos live in the project backlog with no phase assignment.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the add-todo workflow from @~/.claude/forge/workflows/add-todo.md end-to-end.
</execution_context>
