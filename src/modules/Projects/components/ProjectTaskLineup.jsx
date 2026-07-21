/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Inbox, ChevronRight, CheckSquare } from "lucide-react";
import { TaskRow } from "../../Tasks/components/TaskRow";
import { TaskChecklist } from "../../Tasks/components/TaskChecklist";
import { useAppState } from "../../../app/providers";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { EmptyState } from "../../../components/common/EmptyState";

/**
 * One task in the lineup: the Trello-style card (TaskRow) plus an inline,
 * expandable checklist so items can be viewed and ticked without opening the
 * task drawer. The bulk task list carries only checklist counts, so the full
 * items are lazy-loaded via loadTaskChecklist the first time the row expands.
 */
function LineupTaskCard({ task, proj, assign, setActiveTaskId, updateTask }) {
  const { loadTaskChecklist, can } = useAppState();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const items = task.checklist || [];
  // Prefer loaded items (kept current by every mutation); fall back to the
  // list's counts before the row has ever been expanded.
  const total = items.length || (task.checklistTotal || 0);
  const done = items.length ? items.filter((i) => i.completed).length : (task.checklistDone || 0);
  const progress = total ? Math.round((done / total) * 100) : 0;
  const editable = can("editTasks");

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    // Fetch items the first time we open a task that has some but hasn't loaded them.
    if (next && total > 0 && items.length === 0) {
      setLoading(true);
      await loadTaskChecklist(task.id);
      setLoading(false);
    }
  };

  // Nothing to show and can't add → skip the toggle bar entirely (view-only, no checklist).
  const showBar = total > 0 || editable;

  return (
    <div className="card overflow-hidden hover:shadow-elevated hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-150">
      <TaskRow
        task={task}
        proj={proj}
        assign={assign}
        setActiveTaskId={setActiveTaskId}
        updateTask={updateTask}
      />

      {showBar && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="w-full flex items-center gap-2 px-3 md:px-4 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
          >
            <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
            {total > 0 ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Checklist</span>
                <span className="text-[11px] font-mono font-tnum text-zinc-500 dark:text-zinc-400">{done}/{total}</span>
                <span className="flex-1 max-w-[140px] h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden ml-1">
                  <span
                    className={`block h-full rounded-full transition-all duration-300 ${progress === 100 ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Add checklist</span>
            )}
          </button>

          {open && (
            <div className="px-3 md:px-4 pb-3 pt-0.5">
              {loading ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 py-3 text-center">Loading checklist…</p>
              ) : (
                <TaskChecklist key={task.id} task={task} showTitle={false} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectTaskLineup({
  projectTasks,
  users,
  inlineTaskTitle,
  setInlineTaskTitle,
  handleInlineAddTask,
  updateTask,
  setActiveTaskId
}) {
  const { activeWorkspaceProjects, can } = useAppState();

  return (
    <div className="space-y-2.5 sm:space-y-4 text-left animate-in fade-in duration-150">
      {/* Inline creation form — hidden for view-only roles */}
      {can("editTasks") && (
      <form onSubmit={handleInlineAddTask} className="card flex items-center gap-2 p-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
          <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            required
            placeholder="Add a task…"
            value={inlineTaskTitle}
            onChange={(e) => setInlineTaskTitle(e.target.value)}
            aria-label="New task title"
            className="flex-1 min-w-0 h-10 bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium"
          />
        </div>
        <span className="hidden sm:block shrink-0">
          <AIEnhanceButton value={inlineTaskTitle} onEnhance={setInlineTaskTitle} type="title" />
        </span>
        <button type="submit" className="btn btn-primary btn-sm sm:h-9 sm:px-3.5 sm:text-sm shrink-0">
          Add
        </button>
      </form>
      )}

      {projectTasks.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-7 h-7" />}
          title="No tasks in this project yet"
          description="Add a task above, or deploy a workflow template to seed the backlog."
        />
      ) : (
        // Trello-inspired: each task is its own stacked card with an inline,
        // expandable checklist — items are viewable/tickable in place.
        <div className="space-y-2">
          {projectTasks.map((task) => (
            <LineupTaskCard
              key={task.id}
              task={task}
              proj={activeWorkspaceProjects.find((p) => p.id === task.projectId)}
              assign={users.find((u) => u.id === task.assigneeId)}
              setActiveTaskId={setActiveTaskId}
              updateTask={updateTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
