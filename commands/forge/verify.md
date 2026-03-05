---
name: forge:verify
description: Verify phase completion against acceptance criteria
argument-hint: "[phase-number-or-id]"
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, AskUserQuestion
---

<objective>
Verify that a phase's tasks meet their acceptance criteria. Run automated checks where possible, then present results to the user for UAT confirmation. Close verified tasks and update phase status.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the verify workflow from @~/.claude/forge/workflows/verify.md end-to-end.

When resolving the phase (step 1), use verify-phase for a verification-focused view:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" verify-phase <phase-id>
```

This returns all tasks with their acceptance criteria and status, plus a summary
showing how many are ready for UAT vs still need completion.

For automated verification (step 3), spawn **forge-verifier** agents for tasks that
have acceptance criteria. If multiple tasks can be verified independently, spawn
agents **in parallel** using multiple Agent tool calls in the same response.

For UAT (step 4), use AskUserQuestion to batch-present verification results and
get user confirmation. Group tasks when there are many, present individually for
few tasks.

For tasks that fail UAT:
```bash
bd reopen <task-id>
bd update <task-id> --notes="UAT feedback: <user's feedback>"
```

When all tasks pass, close the phase:
```bash
bd close <phase-id> --reason="All tasks verified via UAT"
```
</execution_context>
