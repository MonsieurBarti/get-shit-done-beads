---
name: forge:debug
description: Systematic debugging with persistent state across context resets
argument-hint: "[issue description]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

<objective>
Debug issues using scientific method with subagent isolation.

**Orchestrator role:** Gather symptoms, spawn forge-debugger agent, handle checkpoints, spawn continuations.

**Why subagent:** Investigation burns context fast (reading files, forming hypotheses, testing). Fresh 200k context per investigation. Main context stays lean for user interaction.
</objective>

<context>
User's issue: $ARGUMENTS

Check for active debug sessions:
```bash
bd list --label forge:debug --status open --json
```
</context>

<process>

## 1. Check Active Sessions

```bash
bd list --label forge:debug --status open --json
```

If active sessions exist AND no $ARGUMENTS:
- List sessions with status, current hypothesis (from notes), next action
- User picks one to resume OR describes new issue

If $ARGUMENTS provided OR user describes new issue:
- Continue to symptom gathering

## 2. Gather Symptoms (if new issue)

Use AskUserQuestion for each:

1. **Expected behavior** - What should happen?
2. **Actual behavior** - What happens instead?
3. **Error messages** - Any errors? (paste or describe)
4. **Timeline** - When did this start? Ever worked?
5. **Reproduction** - How do you trigger it?

After all gathered, confirm ready to investigate.

## 3. Create Debug Session Bead

Create a bead to track the debug session:

```bash
bd create --title="Debug: {slug}" \
  --description="trigger: {verbatim user input}
expected: {expected}
actual: {actual}
errors: {errors}
reproduction: {reproduction}
timeline: {timeline}" \
  --type=task \
  --label forge:debug \
  --json
```

Save the returned bead ID as `{debug_id}`.

## 4. Spawn forge-debugger Agent

Fill prompt and spawn:

```markdown
<objective>
Investigate issue: {slug}

**Summary:** {trigger}
**Debug bead:** {debug_id}
</objective>

<symptoms>
expected: {expected}
actual: {actual}
errors: {errors}
reproduction: {reproduction}
timeline: {timeline}
</symptoms>

<mode>
symptoms_prefilled: true
goal: find_and_fix
</mode>
```

```
Agent(
  prompt=filled_prompt,
  subagent_type="forge-debugger",
  description="Debug {slug}"
)
```

## 5. Handle Agent Return

**If `## ROOT CAUSE FOUND`:**
- Display root cause and evidence summary
- Offer options:
  - "Fix now" - spawn fix subagent
  - "Plan fix" - suggest /forge:plan
  - "Manual fix" - done

**If `## CHECKPOINT REACHED`:**
- Present checkpoint details to user
- Get user response
- If checkpoint type is `human-verify`:
  - If user confirms fixed: continue so agent can finalize/close
  - If user reports issues: continue so agent returns to investigation/fixing
- Spawn continuation agent (see step 6)

**If `## INVESTIGATION INCONCLUSIVE`:**
- Show what was checked and eliminated
- Offer options:
  - "Continue investigating" - spawn new agent with additional context
  - "Manual investigation" - done
  - "Add more context" - gather more symptoms, spawn again

## 6. Spawn Continuation Agent (After Checkpoint)

When user responds to checkpoint, spawn fresh agent:

```markdown
<objective>
Continue debugging {slug}.
**Debug bead:** {debug_id}
</objective>

<prior_state>
Load state from bead: `bd show {debug_id} --json`
</prior_state>

<checkpoint_response>
**Type:** {checkpoint_type}
**Response:** {user_response}
</checkpoint_response>

<mode>
goal: find_and_fix
</mode>
```

```
Agent(
  prompt=continuation_prompt,
  subagent_type="forge-debugger",
  description="Continue debug {slug}"
)
```

</process>

<success_criteria>
- [ ] Active sessions checked via bd list
- [ ] Symptoms gathered (if new)
- [ ] Debug session bead created with forge:debug label
- [ ] forge-debugger spawned with bead ID
- [ ] Checkpoints handled correctly
- [ ] Root cause confirmed before fixing
</success_criteria>
