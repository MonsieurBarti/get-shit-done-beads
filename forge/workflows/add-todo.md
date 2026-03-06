<purpose>
Capture an idea, task, or issue that surfaces during a Forge session as a tracked todo bead.
Enables "thought -> capture -> continue" flow without losing context.
Each todo becomes a first-class bead with the `forge:todo` label under the project epic.
</purpose>

<process>

**Step 1: Find the project**

```bash
PROJ=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project)
```

Parse `found` and `projects[0].id` from the JSON.

If `found` is false:
```
No Forge project found. Run /forge:new first.
```
Exit.

Store `$PROJECT_ID`.

---

**Step 2: Extract content**

**With arguments:** Use `$ARGUMENTS` as the title/focus.
- `/forge:add-todo Add auth token refresh` -> title = "Add auth token refresh"

**Without arguments:** Analyze recent conversation to extract:
- The specific problem, idea, or task discussed
- Relevant file paths mentioned
- Technical details (error messages, line numbers, constraints)

Formulate:
- `title`: 3-10 word descriptive title (action verb preferred)
- `description`: What's wrong or why this is needed -- enough context for future Claude to understand weeks later
- `area`: Inferred area from file paths or topic (e.g., api, ui, auth, database, testing, tooling, general)
- `files`: Relevant file paths from conversation (if any)

---

**Step 3: Check for duplicates**

```bash
EXISTING=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" todo-list)
```

Parse the `todos` array. Search for similar titles (case-insensitive substring match on key words).

If potential duplicate found, use AskUserQuestion:
- header: "Possible duplicate"
- question: "Similar todo exists: '[existing title]' (ID). Create anyway?"
- options:
  - "Skip" -- keep existing todo
  - "Create anyway" -- create as separate todo

If user selects "Skip", exit with: "Kept existing todo. Continuing with current work."

---

**Step 4: Create the todo bead**

```bash
RESULT=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" todo-create "$PROJECT_ID" "$TITLE" "$DESCRIPTION" "$AREA" "$FILES")
```

Parse `todo_id` from the JSON response.

If creation fails, report error and exit.

---

**Step 5: Confirm**

```
Todo captured: $TODO_ID

  $TITLE
  Area: $AREA
  Files: [count] referenced

---

Continue with current work, or:
- /forge:add-todo -- capture another idea
- /forge:check-todos -- view all pending todos
```

</process>

<success_criteria>
- [ ] Project exists (find-project returns a project bead)
- [ ] Title extracted from arguments or conversation context
- [ ] Duplicate check performed against existing forge:todo beads
- [ ] Todo bead created with forge:todo label and parent-child dep to project
- [ ] Description has enough context for future Claude to understand
- [ ] Confirmation displayed with todo ID and details
</success_criteria>
