<purpose>
Display a rich progress dashboard for the current Forge project by querying the bead graph.
</purpose>

<process>

## 1. Find Project

```bash
PROJECT=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" find-project)
```

If no project found, suggest `/forge:new`.

## 2. Load Full Context

```bash
PROGRESS=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" progress <project-id>)
CONTEXT=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" project-context <project-id>)
```

For the current active phase (first `in_progress`, or first `open` if none in progress):
```bash
PHASE=$(node "$HOME/.claude/forge/bin/forge-tools.cjs" phase-context <current-phase-id>)
```

Load recent decisions from memory:
```bash
bd memories forge 2>/dev/null || true
```

## 3. Display Dashboard

Build a progress bar from the percentage. Use block characters for visual impact:

```
# <Project Name>

## Progress: [=========>          ] 37% (3/8 phases)

## Phases
  [x] Phase 1: Foundation        (4/4 tasks done)
  [x] Phase 2: Core API          (3/3 tasks done)
  [x] Phase 3: Auth Layer        (5/5 tasks done)
  [>] Phase 4: Frontend          (2/4 tasks done, 1 in progress)
  [ ] Phase 5: Testing           (blocked by Phase 4)
  [ ] Phase 6: Deployment        (blocked by Phase 5)
  [ ] Phase 7: Docs              (blocked by Phase 6)
  [ ] Phase 8: Polish            (blocked by Phase 7)

## Current Phase: Phase 4 - Frontend
  - [x] Set up React scaffold
  - [x] Create layout components
  - [>] Build dashboard page (in_progress)
  - [ ] Add authentication flow (blocked by dashboard)

## Requirements Coverage
  [x] 8/12 requirements have verified tasks
  [ ] 4 requirements pending: ...

## Recent Decisions
  - <from bd memories>
```

Phase status indicators:
- `[x]` = closed (all tasks done)
- `[>]` = in_progress (has active tasks)
- `[ ]` = open (not yet started)
- `[!]` = blocked (has unmet dependencies)

Task status indicators within the current phase:
- `[x]` = closed
- `[>]` = in_progress
- `[ ]` = open (ready)
- `[!]` = blocked

For requirement coverage, check which requirements have `validates` dependencies from
closed tasks. Report uncovered requirements.

## 4. Suggest Next Action

Analyze the current state and suggest the most productive next step:

| State | Suggestion |
|-------|------------|
| Current phase has open/ready tasks | `/forge:execute <phase>` |
| Current phase all tasks closed, not verified | `/forge:verify <phase>` |
| Current phase verified, next phase exists but unplanned | `/forge:plan <next-phase>` |
| Current phase verified, next phase already planned | `/forge:execute <next-phase>` |
| All phases complete and verified | Project complete! |
| No current phase (all blocked) | Check blockers, may need external resolution |

</process>
