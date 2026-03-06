<purpose>
Create all phases necessary to close gaps identified by /forge:audit-milestone. Reads audit
results from the milestone bead, groups gaps into logical phases, creates phase beads with
proper wiring, and offers to plan each phase. One command creates all fix phases.
</purpose>

<process>

## 1. Find Project and Milestone

```bash
PROJECT=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project)
```

If no project found, report "No Forge project found" and suggest `/forge:new`. Stop.

Extract the project ID.

If a milestone ID was given as argument, use it directly.

Otherwise, find the active milestone:
```bash
node "$HOME/.claude/forge/bin/forge-tools.cjs" milestone-list <project-id>
```

## 2. Load Audit Results

Read the milestone bead's design field for audit results:
```bash
bd show <milestone-id> --json
```

Parse the design field for structured audit data:
- `status`: must be `gaps_found` or `tech_debt`
- Unsatisfied requirements list
- Integration issues list
- Tech debt items

If no audit results found or status is `passed`:
```
No gaps found. Run /forge:audit-milestone first, or milestone audit already passed.
```
Stop.

## 3. Prioritize Gaps

Group gaps by severity:

| Priority | Source | Action |
|----------|--------|--------|
| Critical | Unsatisfied requirements | Must create phase |
| High | Integration issues | Should create phase |
| Medium | Tech debt items | Ask user: include or defer? |

For medium-priority gaps, use AskUserQuestion:
- header: "Tech Debt Items"
- question: "Include these tech debt items in gap closure?"
- Show each item with option to include or defer

## 4. Group Gaps into Phases

Cluster related gaps into logical phases:

**Grouping rules:**
- Same requirement domain -> combine into one fix phase
- Same subsystem (auth, API, UI) -> combine
- Dependency order (fix foundations before wiring)
- Keep phases focused: 2-4 tasks each

## 5. Present Gap Closure Plan

```
## Gap Closure Plan

**Milestone:** <name>
**Gaps to close:** N requirements, M integration, K tech debt

### Proposed Phases

**Phase N: <Name>**
Closes:
- <req-title> (<req-id>)
- Integration: <description>
Tasks: <count>

**Phase N+1: <Name>**
Closes:
- <req-title> (<req-id>)
Tasks: <count>

---

Create these N phases? (yes / adjust)
```

Use AskUserQuestion for confirmation.

If "adjust": Get feedback, revise plan, re-present.

## 6. Create Gap Closure Phases

For each approved phase, use forge-tools to handle numbering and wiring:

```bash
RESULT=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" add-phase <project-id> "<phase-description>")
```

Extract the phase ID from the result.

Wire each new phase to the milestone:
```bash
bd dep add <phase-id> <milestone-id> --type=parent-child
```

Update the phase description with gap context:
```bash
bd update <phase-id> --description="Gap closure: <detailed description of gaps this phase addresses>"
```

## 7. Wire Requirement Traceability

For each gap closure phase, note which requirements it targets.

Update the phase notes with requirement mapping:
```bash
bd update <phase-id> --notes="Target requirements: <req-ids>
Gap source: audit of <milestone-name>"
```

## 8. Update Milestone Status

Reopen the milestone if it was closed:
```bash
bd reopen <milestone-id>
bd update <milestone-id> --notes="Gap closure phases added: <phase-ids>"
```

## 9. Report

```
## Gap Closure Phases Created

**Phases added:** N
**Gaps addressed:** X requirements, Y integration, Z tech debt

### Created Phases
- Phase N: <name> (<phase-id>) -- closes <req-ids>
- Phase N+1: <name> (<phase-id>) -- closes <req-ids>

---

Next: /forge:plan <first-gap-phase-number> -- plan the first gap closure phase

Also:
- /forge:progress -- see updated project status
- /forge:audit-milestone -- re-audit after gap phases complete
- /forge:complete-milestone -- close milestone when audit passes
```

</process>

<success_criteria>
- [ ] Project and milestone identified
- [ ] Audit results loaded from milestone bead
- [ ] Gaps prioritized (critical/high/medium)
- [ ] Tech debt items presented for user decision
- [ ] Related gaps grouped into logical phases
- [ ] User confirmed gap closure plan
- [ ] Phase beads created with proper numbering and wiring
- [ ] Phases wired to milestone via parent-child
- [ ] Requirement traceability noted in phase beads
- [ ] Milestone status updated
- [ ] Next steps presented to user
</success_criteria>
