<purpose>

Clean up the Forge bead graph after milestone completion. Unlike GSD's file-based cleanup
(archiving .planning/ directories), Forge is beads-native — cleanup targets the bead graph:
orphan open beads under completed phases, stale forge:todo beads, and bead graph health.

Optionally removes regeneratable .forge/codebase/ analysis files.

</purpose>

<process>

## 1. Find Project

```bash
PROJECT=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project)
```

If no project found, report "No Forge project found" and suggest `/forge:new`. Stop.

Extract the project ID from the result.

## 2. Identify Completed Phases

List all phases and partition by status:

```bash
bd children <project-id> --json
```

Filter to beads with `forge:phase` label. Categorize:
- **Closed phases**: status == "closed"
- **Open phases**: status == "open" or "in_progress"

If no closed phases exist:
```
No completed phases found. Nothing to clean up yet.

Run /forge:progress to check project status.
```
Stop.

## 3. Find Orphan Beads Under Completed Phases

For each closed phase, list its children:

```bash
bd children <phase-id> --json
```

Identify orphan beads — children of closed phases that are still open:
- Tasks still marked `open` or `in_progress` under a closed phase
- These were likely forgotten when the phase was closed

Collect all orphans into a list with their phase, title, and status.

## 4. Find Stale Todos

List all forge:todo beads:

```bash
bd list --label forge:todo --json
```

Categorize todos by age:
- **Stale** (>14 days old): likely forgotten, candidates for closing
- **Recent** (<14 days): still relevant, show but don't suggest closing

## 5. Check Bead Graph Health

Run health diagnostics for context:

```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" health <project-id>
```

Extract key health issues relevant to cleanup:
- Closed phases with open tasks (overlaps with orphan detection)
- Open phases with all tasks closed (candidates for closing)
- Stale in-progress tasks

## 6. Check for Regeneratable Files

Check if `.forge/codebase/` exists:

```bash
ls -d .forge/codebase 2>/dev/null
```

If it exists, note its size for the summary. This directory is regeneratable
via `/forge:map-codebase` and can be removed to save space.

## 7. Show Cleanup Summary

Present the dry-run summary:

```
# Forge Cleanup Summary

## Project: <name> (<id>)

### Orphan Beads (open under closed phases)
[count] beads found:
- [title] ([id]) — under Phase [N]: [phase-name] — status: [status]
- [title] ([id]) — under Phase [N]: [phase-name] — status: [status]
Action: Close with reason "cleanup: phase completed"

### Stale Todos
[count] todos older than 14 days:
- [title] ([id]) — [age] old
Action: Offer to close or keep each

### Recent Todos
[count] todos under 14 days (kept):
- [title] ([id]) — [age] old

### Closeable Phases
[count] open phases with all tasks closed:
- Phase [N]: [name] ([id])
Action: Close phase

### Regeneratable Files
- .forge/codebase/ ([size]) — regeneratable via /forge:map-codebase
Action: Remove directory

### Summary
- [N] orphan beads to close
- [N] stale todos to review
- [N] phases to close
- [size] regeneratable files to remove
```

If nothing to clean up:
```
Bead graph is clean. No cleanup needed.
```
Stop.

If `--dry-run` was specified:
```
(Dry run — no changes made. Run /forge:cleanup to execute.)
```
Stop.

## 8. Confirm and Execute

Use AskUserQuestion:
- header: "Execute Cleanup"
- question: "Proceed with the cleanup actions listed above?"
- options:
  - "Yes — execute all cleanup actions"
  - "Select which actions to execute"
  - "Cancel"

**If "Cancel":** Stop.

**If "Select which actions":**
Use AskUserQuestion to let user toggle each category:
- Close orphan beads? (Yes/No)
- Review stale todos? (Yes/No)
- Close ready phases? (Yes/No)
- Remove .forge/codebase/? (Yes/No)

**Execute selected actions:**

### Close Orphan Beads
For each orphan:
```bash
bd close <id> --reason="cleanup: parent phase completed"
```

### Review Stale Todos
For each stale todo, use AskUserQuestion:
- header: "[todo title]"
- question: "This todo is [age] old. What should we do?"
- options: "Close it" | "Keep it" | "Close all remaining"

If "Close it":
```bash
bd close <id> --reason="cleanup: stale todo"
```
If "Keep it": skip.
If "Close all remaining": close this and all subsequent stale todos.

### Close Ready Phases
For each closeable phase:
```bash
bd close <id> --reason="cleanup: all tasks completed"
```

### Remove Regeneratable Files
```bash
rm -rf .forge/codebase/
```

## 9. Report

```
# Cleanup Complete

- [N] orphan beads closed
- [N] stale todos closed, [N] kept
- [N] phases closed
- [size] regeneratable files removed

Bead graph health: [summary from health check]

Next: /forge:progress to see updated project status.
```

</process>

<success_criteria>
- [ ] Project identified and phases enumerated
- [ ] Orphan beads under completed phases identified
- [ ] Stale forge:todo beads identified (>14 days)
- [ ] Bead graph health checked
- [ ] Regeneratable files identified (.forge/codebase/)
- [ ] Dry-run summary shown before any changes
- [ ] User confirmed (or --dry-run stopped early)
- [ ] Selected cleanup actions executed
- [ ] Final report with counts shown
</success_criteria>
