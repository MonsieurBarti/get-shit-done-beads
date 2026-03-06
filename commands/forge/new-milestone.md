---
name: forge:new-milestone
description: Start a new milestone cycle with goals, requirements, and phased roadmap
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, AskUserQuestion
---

<objective>
Start a new milestone for an existing Forge project. Gathers milestone goals, defines scoped requirements as beads, and spawns the roadmapper to create a phased execution plan -- all tracked in the bead graph.

Brownfield equivalent of forge:new. Project exists with history. Gathers "what's next", creates milestone epic, defines requirements, and builds a roadmap that continues phase numbering from previous work.

Use when a milestone is complete and you're ready to start the next cycle.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the new-milestone workflow from @~/.claude/forge/workflows/new-milestone.md end-to-end.

When creating the phased roadmap (step 7), use the Agent tool to spawn the **forge-roadmapper** agent.
Pass it the project ID, milestone vision, and all requirement details so it can propose an optimal phase ordering.

Milestone name: $ARGUMENTS (optional -- will prompt if not provided)
</execution_context>
