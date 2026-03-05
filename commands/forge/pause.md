---
name: forge:pause
description: Save session context for later resumption
argument-hint: ""
allowed-tools: Read, Bash
---

<objective>
Save current session context to beads memory for resumption in a future session. Records the active phase, in-progress tasks, recent decisions, and any blockers.
</objective>

<process>
1. Find the current project:
   ```bash
   node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project
   ```

2. Save session state using forge-tools (captures project, phase, in-progress tasks):
   ```bash
   node "$HOME/.claude/forge/bin/forge-tools.cjs" session-save <project-id> "<brief summary of where things stand>"
   ```

   The session-save command automatically:
   - Identifies the current active phase
   - Finds all in-progress tasks
   - Records a timestamped snapshot to `bd remember`

3. If there are important decisions or context not captured in beads, save them:
   ```bash
   bd remember "forge:context:<project-id> <key decisions, blockers, or notes>"
   ```

4. Report what was saved:
   - Project name and ID
   - Current phase
   - Tasks in progress
   - Any notes saved
   - How to resume: "Use `/forge:resume` in your next session to pick up where you left off."
</process>
