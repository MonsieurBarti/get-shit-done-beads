---
name: forge:audit-milestone
description: Audit milestone completion against original requirements
argument-hint: "[milestone-id-or-name]"
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
---

<objective>
Verify a milestone achieved its definition of done. Check requirement coverage via validates dependencies, aggregate phase verification results, and assess cross-phase integration.

This command IS the orchestrator. Reads task verification status from the bead graph, checks requirement traceability via validates links, then spawns an integration checker for cross-phase wiring.
</objective>

<context>
Read the Forge conventions: @~/.claude/forge/references/conventions.md
</context>

<execution_context>
Execute the audit-milestone workflow from @~/.claude/forge/workflows/audit-milestone.md end-to-end.

When loading milestone context (step 1), use:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" milestone-audit <milestone-id>
```

This returns requirement coverage, phase completion status, and uncovered requirements in a single call.

When spawning the integration checker (step 3), resolve the model first:
```bash
MODEL=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" resolve-model forge-verifier --raw)
```
Then spawn a **forge-verifier** agent to check cross-phase integration.
</execution_context>
