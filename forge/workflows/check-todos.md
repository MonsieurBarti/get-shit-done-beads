<purpose>
List all pending forge:todo beads, allow selection, load full context for the selected todo,
and route to appropriate action. Todos are individual beads under the project epic.
</purpose>

<process>

**Step 1: Load todos**

```bash
TODOS=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" todo-list)
```

Parse `todo_count` and `todos` array from the JSON.

If `todo_count` is 0:
```
No pending todos.

Todos are captured during work sessions with /forge:add-todo.

---

Would you like to:
1. Continue with current phase (/forge:progress)
2. Add a todo now (/forge:add-todo)
```
Exit.

---

**Step 2: Filter by area (optional)**

If `$ARGUMENTS` is non-empty, use it as an area filter.
- `/forge:check-todos` -> show all
- `/forge:check-todos api` -> filter to area matching "api" (case-insensitive match on title or description)

If filter yields 0 results:
```
No todos matching area "$ARGUMENTS".

All areas: [list unique areas from all todos]
```
Exit.

---

**Step 3: List todos**

Display as numbered list:

```
Pending Todos ([count]):

1. [title] ([area], [relative age])    [id]
2. [title] ([area], [relative age])    [id]
3. [title] ([area], [relative age])    [id]

---

Reply with a number to view details, or:
- /forge:check-todos [area] to filter by area
- q to exit
```

Format age as relative time from created timestamp (e.g., "2d ago", "5h ago").

Use AskUserQuestion:
- header: "Select Todo"
- question: "Which todo would you like to review?"
- options: numbered list of todo titles + "Exit"

---

**Step 4: Load context for selected todo**

Read the selected todo bead:
```bash
bd show $SELECTED_ID
```

Display:

```
## [title]

**ID:** [id]
**Area:** [area from notes/description]
**Created:** [date] ([relative time] ago)

### Description
[description content]

### Referenced Files
[files list or "None"]
```

If the todo has referenced file paths, briefly note which ones exist in the current codebase.

---

**Step 5: Offer actions**

Check if a roadmap exists (phases under the project):
```bash
PHASES=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project)
```

Use AskUserQuestion:
- header: "Action"
- question: "What would you like to do with this todo?"
- options:
  - "Work on it now" -- route to /forge:quick with todo context
  - "Add to a phase" -- note for inclusion in phase planning (if phases exist)
  - "Brainstorm approach" -- discuss problem and approaches
  - "Delete it" -- close the todo bead
  - "Back to list" -- return to step 3

**Execute selected action:**

**Work on it now:**
Close the todo bead and launch quick execution:
```bash
bd close $SELECTED_ID --reason="Starting work via forge:quick"
```
Then display: "Run `/forge:quick [todo description]` to execute."
Present the full command for the user to run.

**Add to a phase:**
```bash
bd update $SELECTED_ID --notes="Earmarked for phase planning"
```
Display: "Noted. This todo will surface during phase planning."

**Brainstorm approach:**
Keep todo open. Start discussion about the problem and possible approaches.
Update the bead notes with any conclusions:
```bash
bd update $SELECTED_ID --notes="Brainstorm: [key conclusions]"
```

**Delete it:**
```bash
bd close $SELECTED_ID --reason="Deleted by user"
```
Display: "Todo deleted. Returning to list."
Return to step 3 (if more todos remain).

**Back to list:**
Return to step 3.

</process>

<success_criteria>
- [ ] All pending forge:todo beads listed with title, area, age
- [ ] Area filter applied if specified in arguments
- [ ] Selected todo's full context loaded and displayed
- [ ] Appropriate actions offered based on project state
- [ ] Selected action executed correctly
- [ ] Bead state updated (closed, notes updated, etc.) as needed
</success_criteria>
