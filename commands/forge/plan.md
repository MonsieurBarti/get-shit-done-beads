---
name: forge:plan
description: Plan a phase -- research approach and create task beads with acceptance criteria
argument-hint: "[phase-number-or-id]"
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, AskUserQuestion, WebFetch, WebSearch
---

<objective>
Plan a specific phase of the project. Research the implementation approach, then create task beads under the phase epic with clear acceptance criteria and requirement traceability. Verify the plan passes quality checks before marking ready for execution.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the plan-phase workflow from @~/.claude/forge/workflows/plan-phase.md end-to-end.

When researching the implementation approach (step 3), use the Agent tool to spawn the **forge-researcher** agent.
Pass it the phase title, goal, project context, and any relevant codebase pointers.

When breaking the phase into tasks (step 5), use the Agent tool to spawn the **forge-planner** agent.
Pass it the phase ID, project context, research findings, and user decisions.

When verifying the plan (step 6), use the Agent tool to spawn the **forge-plan-checker** agent.
Pass it the phase ID and project ID so it can validate acceptance criteria, requirement coverage,
task sizing, and dependency correctness. If the plan-checker returns NEEDS REVISION, fix the issues
and re-run the checker until it passes.
</execution_context>
