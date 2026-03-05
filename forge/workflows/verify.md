<purpose>
Verify that a phase's tasks meet their acceptance criteria. Automated checks where possible,
then human UAT confirmation. Close verified work and update phase status.
</purpose>

<process>

## 1. Resolve Phase

If a phase number or ID was provided, resolve it. Otherwise find the current phase.

Load verification context:
```bash
VERIFY=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" verify-phase <phase-id>)
```

This returns all tasks with acceptance criteria and a summary of what's ready for UAT.

If the phase has tasks that aren't closed yet (`needs_completion > 0`), warn the user
that some tasks still need to be executed before verification can complete. Suggest
`/forge:execute <phase>` for incomplete tasks.

## 2. Gather Acceptance Criteria

For each closed task, extract its acceptance_criteria from the verify-phase output.
Tasks without acceptance criteria can still be verified but note the gap.

Group tasks into:
- **Verifiable**: closed with acceptance_criteria
- **No criteria**: closed but missing acceptance_criteria (verify existence only)
- **Incomplete**: not yet closed (skip, report as incomplete)

## 3. Automated Verification

For each verifiable task, attempt to verify acceptance criteria programmatically.

**Spawn forge-verifier agents** for independent tasks. If multiple tasks can be
verified simultaneously, spawn agents **in parallel**:

```
Agent(forge-verifier): "Verify task <task-id>: <title>
  Acceptance criteria: <criteria>
  Phase context: <phase summary>"
```

Each verifier agent will:
1. **Code inspection** -- read relevant code, check it exists and looks correct
2. **Test execution** -- run any tests that cover this task's functionality
3. **Behavioral check** -- if applicable, run the feature and verify it works
4. **Regression check** -- verify no existing tests are broken

Record results as comments:
```bash
bd comments add <task-id> "Verification: PASS|FAIL - <details>"
```

**Single task** -- verify it directly without spawning an agent (saves context).

## 4. UAT with User

Present each task's acceptance criteria and automated verification results.
Use AskUserQuestion for confirmation:

**For few tasks (1-3)**: present each individually:
- "Task: <title>\n  Criteria: <criteria>\n  Auto-check: <PASS/FAIL details>\n  Verified?"
- Options: "Yes, verified" / "No, needs work" / "Skip for now"

**For many tasks (4+)**: batch presentation:
- Present a summary table of all tasks with auto-check results
- "All tasks shown above pass automated checks. Confirm all, or specify which need rework?"
- Options: "All verified" / "These need work: <ids>" / "Let me review individually"

For tasks that need work:
```bash
bd reopen <task-id>
bd update <task-id> --notes="UAT feedback: <user's feedback>"
```

## 5. Update Phase Status

If all tasks verified:
```bash
bd close <phase-id> --reason="All tasks verified via UAT"
```

If some tasks need rework:
- Keep phase as `in_progress`
- Report which tasks need attention
- Suggest `/forge:execute <phase>` to redo failed tasks

## 6. Requirement Coverage Check

Check which requirements this phase's tasks validate:
```bash
bd dep list <task-id> --type=validates
```

Report any requirements that still have no validated tasks across all closed phases.

Suggest next step:
- Rework needed -> `/forge:execute <phase>`
- Next phase unplanned -> `/forge:plan <next-phase>`
- All done -> `/forge:progress` for full dashboard

</process>
