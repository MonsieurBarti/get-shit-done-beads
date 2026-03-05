---
name: forge:resume
description: Restore session context from previous pause
argument-hint: ""
allowed-tools: Read, Bash, Grep, Glob
---

<objective>
Restore context from a previous `/forge:pause`. Load the project, current phase, in-progress tasks, and recent decisions from beads memory. Present a summary and suggest the next action.
</objective>

<process>
1. Restore session state using forge-tools:
   ```bash
   node "$HOME/.claude/forge/bin/forge-tools.cjs" session-restore
   ```

   If no session found, try finding the project directly:
   ```bash
   node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project
   ```

2. Load current progress:
   ```bash
   node "$HOME/.claude/forge/bin/forge-tools.cjs" progress <project-id>
   ```

3. If there's an active phase, load its task details:
   ```bash
   node "$HOME/.claude/forge/bin/forge-tools.cjs" phase-context <phase-id>
   ```

4. Load any additional context from memories:
   ```bash
   bd memories forge:context 2>/dev/null || true
   ```

5. Check for in-progress tasks that may need attention:
   ```bash
   bd list --status=in_progress --label forge:task --json 2>/dev/null || true
   ```

6. Present a resume summary:
   - Project name and overall progress
   - Current phase and task breakdown
   - Tasks that were in-progress at pause time (and their current status)
   - Saved notes/decisions from the pause
   - Time since last pause

7. Suggest next action based on current state:
   - In-progress tasks exist -> `/forge:execute <phase>` to continue
   - Phase tasks all closed -> `/forge:verify <phase>`
   - Phase verified -> `/forge:plan <next-phase>`
   - Or `/forge:progress` for a full dashboard
</process>
