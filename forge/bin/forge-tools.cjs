#!/usr/bin/env node
'use strict';

/**
 * forge-tools.cjs -- Thin helper that queries beads and formats context for workflows.
 *
 * Unlike GSD's gsd-tools.cjs which does heavy state/roadmap/config CRUD on markdown files,
 * forge-tools delegates most work to `bd` commands. This file mostly:
 * 1. Queries beads and formats results as context JSON for workflows
 * 2. Provides convenience wrappers for common bead patterns
 *
 * Usage: node forge-tools.cjs <command> [args]
 */

const { execFileSync } = require('child_process');

// --- Helpers ---

function bd(args, opts = {}) {
  const argList = args.split(/\s+/);
  try {
    const result = execFileSync('bd', argList, {
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...opts,
    });
    return result.trim();
  } catch (err) {
    if (opts.allowFail) return '';
    throw err;
  }
}

function bdJson(args) {
  const raw = bd(`${args} --json`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function output(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

// --- Commands ---

const commands = {
  /**
   * Get full project context for a workflow.
   * Returns: project epic, requirements, phases (ordered), current state.
   */
  'project-context'(args) {
    const projectId = args[0];
    if (!projectId) {
      console.error('Usage: forge-tools project-context <project-bead-id>');
      process.exit(1);
    }

    const project = bdJson(`show ${projectId}`);
    const children = bdJson(`children ${projectId}`);

    if (!children) {
      output({ project, requirements: [], phases: [], tasks: [] });
      return;
    }

    const issues = Array.isArray(children) ? children : (children.issues || children.children || []);

    const requirements = issues.filter(i =>
      (i.labels || []).includes('forge:req') || i.issue_type === 'feature'
    );
    const phases = issues.filter(i =>
      (i.labels || []).includes('forge:phase') || i.issue_type === 'epic'
    ).filter(i => i.id !== projectId);

    output({
      project,
      requirements,
      phases,
      summary: {
        total_requirements: requirements.length,
        total_phases: phases.length,
        phases_complete: phases.filter(p => p.status === 'closed').length,
        phases_in_progress: phases.filter(p => p.status === 'in_progress').length,
      },
    });
  },

  /**
   * Get phase context: phase details + all tasks + their statuses.
   */
  'phase-context'(args) {
    const phaseId = args[0];
    if (!phaseId) {
      console.error('Usage: forge-tools phase-context <phase-bead-id>');
      process.exit(1);
    }

    const phase = bdJson(`show ${phaseId}`);
    const children = bdJson(`children ${phaseId}`);
    const tasks = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    const ready = tasks.filter(t => t.status === 'open');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const done = tasks.filter(t => t.status === 'closed');

    output({
      phase,
      tasks,
      summary: {
        total: tasks.length,
        ready: ready.length,
        in_progress: inProgress.length,
        done: done.length,
      },
    });
  },

  /**
   * Get ready work within a specific phase.
   */
  'phase-ready'(args) {
    const phaseId = args[0];
    if (!phaseId) {
      console.error('Usage: forge-tools phase-ready <phase-bead-id>');
      process.exit(1);
    }

    const children = bdJson(`children ${phaseId}`);
    const tasks = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    const ready = tasks.filter(t => t.status === 'open');
    output({ phase_id: phaseId, ready_tasks: ready });
  },

  /**
   * Record a project memory (wraps bd remember).
   */
  remember(args) {
    const memory = args.join(' ');
    if (!memory) {
      console.error('Usage: forge-tools remember <text>');
      process.exit(1);
    }
    bd(`remember ${memory}`);
    output({ ok: true, memory });
  },

  /**
   * Get progress summary for a project.
   */
  progress(args) {
    const projectId = args[0];
    if (!projectId) {
      console.error('Usage: forge-tools progress <project-bead-id>');
      process.exit(1);
    }

    const project = bdJson(`show ${projectId}`);
    const children = bdJson(`children ${projectId}`);
    const issues = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    const phases = issues.filter(i =>
      (i.labels || []).includes('forge:phase')
    );

    const totalPhases = phases.length;
    const completedPhases = phases.filter(p => p.status === 'closed').length;
    const currentPhase = phases.find(p => p.status === 'in_progress') || phases.find(p => p.status === 'open');

    const memories = bd('memories forge', { allowFail: true });

    output({
      project: { id: project?.id, title: project?.title, status: project?.status },
      progress: {
        phases_total: totalPhases,
        phases_completed: completedPhases,
        phases_remaining: totalPhases - completedPhases,
        percent: totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0,
      },
      current_phase: currentPhase ? { id: currentPhase.id, title: currentPhase.title, status: currentPhase.status } : null,
      memories: memories || null,
    });
  },

  /**
   * Validate a phase plan: check acceptance criteria, requirement coverage,
   * task labels, and parent-child links.
   */
  'plan-check'(args) {
    const phaseId = args[0];
    if (!phaseId) {
      console.error('Usage: forge-tools plan-check <phase-bead-id>');
      process.exit(1);
    }

    const phase = bdJson(`show ${phaseId}`);
    const children = bdJson(`children ${phaseId}`);
    const tasks = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    const issues = [];
    const tasksWithoutCriteria = [];
    const tasksWithoutLabel = [];

    for (const task of tasks) {
      if (!task.acceptance_criteria || task.acceptance_criteria.trim() === '') {
        tasksWithoutCriteria.push({ id: task.id, title: task.title });
      }
      if (!(task.labels || []).includes('forge:task')) {
        tasksWithoutLabel.push({ id: task.id, title: task.title });
      }
    }

    if (tasksWithoutCriteria.length > 0) {
      issues.push({
        type: 'missing_acceptance_criteria',
        severity: 'error',
        tasks: tasksWithoutCriteria,
      });
    }

    if (tasksWithoutLabel.length > 0) {
      issues.push({
        type: 'missing_forge_task_label',
        severity: 'warning',
        tasks: tasksWithoutLabel,
      });
    }

    // Check requirement coverage via validates deps
    // Find the parent project to get requirements
    const parentId = phase?.parent || null;
    let uncoveredReqs = [];
    if (parentId) {
      const projectChildren = bdJson(`children ${parentId}`);
      const allIssues = Array.isArray(projectChildren)
        ? projectChildren
        : (projectChildren?.issues || projectChildren?.children || []);
      const requirements = allIssues.filter(i =>
        (i.labels || []).includes('forge:req')
      );

      // Check which requirements have validates links from any task
      for (const req of requirements) {
        const depsRaw = bd(`dep list ${req.id} --type validates --json`, { allowFail: true });
        let deps = [];
        if (depsRaw) {
          try { deps = JSON.parse(depsRaw); } catch { /* ignore */ }
        }
        if (!Array.isArray(deps) || deps.length === 0) {
          uncoveredReqs.push({ id: req.id, title: req.title });
        }
      }

      if (uncoveredReqs.length > 0) {
        issues.push({
          type: 'uncovered_requirements',
          severity: 'warning',
          requirements: uncoveredReqs,
        });
      }
    }

    const passed = issues.filter(i => i.severity === 'error').length === 0;

    output({
      phase_id: phaseId,
      phase_title: phase?.title,
      total_tasks: tasks.length,
      verdict: passed ? 'PASS' : 'NEEDS_REVISION',
      issues,
      summary: {
        tasks_with_criteria: tasks.length - tasksWithoutCriteria.length,
        tasks_without_criteria: tasksWithoutCriteria.length,
        tasks_with_label: tasks.length - tasksWithoutLabel.length,
        uncovered_requirements: uncoveredReqs.length,
      },
    });
  },

  /**
   * Detect dependency waves for phase execution.
   * Groups tasks into waves based on intra-phase blocking dependencies.
   * Wave 1: tasks with no intra-phase blockers
   * Wave 2: tasks that only depend on wave 1 tasks
   * Wave N: tasks that only depend on wave 1..N-1 tasks
   */
  'detect-waves'(args) {
    const phaseId = args[0];
    if (!phaseId) {
      console.error('Usage: forge-tools detect-waves <phase-bead-id>');
      process.exit(1);
    }

    const phase = bdJson(`show ${phaseId}`);
    const children = bdJson(`children ${phaseId}`);
    const tasks = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    if (tasks.length === 0) {
      output({ phase_id: phaseId, waves: [], summary: { total_tasks: 0, total_waves: 0 } });
      return;
    }

    // Build set of task IDs in this phase
    const phaseTaskIds = new Set(tasks.map(t => t.id));

    // For each task, find its intra-phase blocking dependencies
    const taskDeps = {};
    for (const task of tasks) {
      const depsRaw = bd(`dep list ${task.id} --type blocks --json`, { allowFail: true });
      let deps = [];
      if (depsRaw) {
        try { deps = JSON.parse(depsRaw); } catch { /* ignore */ }
      }
      if (!Array.isArray(deps)) deps = [];
      // Only keep dependencies that are within this phase and still open
      const intraPhaseDeps = deps
        .filter(d => phaseTaskIds.has(d.id || d.dependency_id || d))
        .map(d => d.id || d.dependency_id || d)
        .filter(id => {
          const depTask = tasks.find(t => t.id === id);
          return depTask && depTask.status !== 'closed';
        });
      taskDeps[task.id] = intraPhaseDeps;
    }

    // Topological wave assignment
    const waves = [];
    const assigned = new Set();

    while (assigned.size < tasks.length) {
      const wave = [];
      for (const task of tasks) {
        if (assigned.has(task.id)) continue;
        const unmetDeps = (taskDeps[task.id] || []).filter(d => !assigned.has(d));
        if (unmetDeps.length === 0) {
          wave.push(task);
        }
      }

      if (wave.length === 0) {
        // Circular dependency or all remaining tasks are blocked
        const remaining = tasks.filter(t => !assigned.has(t.id));
        waves.push({
          wave_number: waves.length + 1,
          tasks: remaining.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            blocked_by: taskDeps[t.id] || [],
          })),
          note: 'circular_or_external_dependency',
        });
        break;
      }

      waves.push({
        wave_number: waves.length + 1,
        tasks: wave.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
        })),
      });

      for (const t of wave) assigned.add(t.id);
    }

    // Separate executable vs already-done tasks
    const executableWaves = waves.map(w => ({
      ...w,
      tasks_to_execute: w.tasks.filter(t => t.status === 'open' || t.status === 'in_progress'),
      tasks_already_done: w.tasks.filter(t => t.status === 'closed'),
    }));

    output({
      phase_id: phaseId,
      phase_title: phase?.title,
      phase_status: phase?.status,
      waves: executableWaves,
      summary: {
        total_tasks: tasks.length,
        total_waves: waves.length,
        tasks_open: tasks.filter(t => t.status === 'open').length,
        tasks_in_progress: tasks.filter(t => t.status === 'in_progress').length,
        tasks_closed: tasks.filter(t => t.status === 'closed').length,
      },
    });
  },

  /**
   * Save session state for forge:pause.
   * Records active phase, in-progress tasks, and notes to bd remember.
   */
  'session-save'(args) {
    const projectId = args[0];
    const notes = args.slice(1).join(' ') || '';

    if (!projectId) {
      console.error('Usage: forge-tools session-save <project-id> [notes]');
      process.exit(1);
    }

    // Get current project state
    const project = bdJson(`show ${projectId}`);
    const children = bdJson(`children ${projectId}`);
    const issues = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    const phases = issues.filter(i => (i.labels || []).includes('forge:phase'));
    const currentPhase = phases.find(p => p.status === 'in_progress') || phases.find(p => p.status === 'open');

    let inProgressTasks = [];
    if (currentPhase) {
      const phaseChildren = bdJson(`children ${currentPhase.id}`);
      const tasks = Array.isArray(phaseChildren) ? phaseChildren : (phaseChildren?.issues || phaseChildren?.children || []);
      inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    }

    const timestamp = new Date().toISOString();
    const state = {
      project_id: projectId,
      project_title: project?.title,
      phase_id: currentPhase?.id || null,
      phase_title: currentPhase?.title || null,
      tasks_in_progress: inProgressTasks.map(t => t.id),
      notes,
      saved_at: timestamp,
    };

    // Save as bd memory
    const memoryKey = `forge:session:${projectId}`;
    const memoryValue = JSON.stringify(state);
    bd(`remember ${memoryKey} ${memoryValue}`, { allowFail: true });

    output(state);
  },

  /**
   * Restore session state for forge:resume.
   * Reads the last saved session state from bd memories.
   */
  'session-restore'(args) {
    const projectId = args[0];

    // Try to find memories matching forge:session
    const raw = bd('memories forge:session', { allowFail: true });
    if (!raw) {
      output({ found: false, reason: 'no_session_memories' });
      return;
    }

    // Parse memories - bd memories returns text, try to extract JSON from it
    const lines = raw.split('\n').filter(l => l.trim());
    let lastState = null;

    for (const line of lines) {
      // Try to find JSON in the memory value
      const jsonMatch = line.match(/\{.*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (!projectId || parsed.project_id === projectId) {
            lastState = parsed;
          }
        } catch { /* not JSON, skip */ }
      }
    }

    if (!lastState) {
      output({ found: false, reason: 'no_matching_session' });
      return;
    }

    // Enrich with current status
    const project = bdJson(`show ${lastState.project_id}`);
    let currentPhase = null;
    if (lastState.phase_id) {
      currentPhase = bdJson(`show ${lastState.phase_id}`);
    }

    let taskStatuses = [];
    for (const taskId of (lastState.tasks_in_progress || [])) {
      const task = bdJson(`show ${taskId}`);
      if (task) {
        taskStatuses.push({ id: task.id, title: task.title, status: task.status });
      }
    }

    output({
      found: true,
      saved_state: lastState,
      current: {
        project: project ? { id: project.id, title: project.title, status: project.status } : null,
        phase: currentPhase ? { id: currentPhase.id, title: currentPhase.title, status: currentPhase.status } : null,
        tasks_in_progress: taskStatuses,
      },
    });
  },

  /**
   * Get verification context for a phase: tasks with their acceptance criteria and status.
   */
  'verify-phase'(args) {
    const phaseId = args[0];
    if (!phaseId) {
      console.error('Usage: forge-tools verify-phase <phase-bead-id>');
      process.exit(1);
    }

    const phase = bdJson(`show ${phaseId}`);
    const children = bdJson(`children ${phaseId}`);
    const tasks = Array.isArray(children) ? children : (children?.issues || children?.children || []);

    const verificationItems = tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      acceptance_criteria: t.acceptance_criteria || null,
      has_criteria: !!(t.acceptance_criteria && t.acceptance_criteria.trim()),
    }));

    const closedWithCriteria = verificationItems.filter(t => t.status === 'closed' && t.has_criteria);
    const closedNoCriteria = verificationItems.filter(t => t.status === 'closed' && !t.has_criteria);
    const notClosed = verificationItems.filter(t => t.status !== 'closed');

    output({
      phase_id: phaseId,
      phase_title: phase?.title,
      phase_status: phase?.status,
      tasks: verificationItems,
      summary: {
        total: tasks.length,
        closed_with_criteria: closedWithCriteria.length,
        closed_no_criteria: closedNoCriteria.length,
        not_closed: notClosed.length,
        ready_for_uat: closedWithCriteria.length,
        needs_completion: notClosed.length,
      },
    });
  },

  /**
   * Find the project bead in the current beads database.
   */
  'find-project'() {
    const result = bd('list --label forge:project --json', { allowFail: true });
    if (!result) {
      output({ found: false });
      return;
    }
    try {
      const data = JSON.parse(result);
      const issues = Array.isArray(data) ? data : (data.issues || []);
      output({ found: issues.length > 0, projects: issues });
    } catch {
      output({ found: false });
    }
  },
};

// --- Main ---

const [command, ...args] = process.argv.slice(2);

if (!command || command === '--help' || command === '-h') {
  console.log('Usage: forge-tools <command> [args]');
  console.log('\nCommands:');
  Object.keys(commands).forEach(cmd => console.log(`  ${cmd}`));
  process.exit(0);
}

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  console.error(`Available: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

try {
  commands[command](args);
} catch (err) {
  console.error(`Error in ${command}: ${err.message}`);
  process.exit(1);
}
