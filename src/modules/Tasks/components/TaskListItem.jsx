/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronRight, CheckSquare } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { TaskChecklist } from "./TaskChecklist";
import { useAppState } from "../../../app/providers";

/**
 * One task as a stacked card with an inline, expandable checklist — the shared
 * list row for both the project Tasks Lineup and the My Tasks page. View and
 * tick checklist items in place without opening the drawer, Trello-style.
 *
 * The bulk task list carries only checklist counts, so full items lazy-load
 * via loadTaskChecklist the first time a row expands.
 */
export function TaskListItem({ task, proj, assign, setActiveTaskId, updateTask }) {
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
    if (next && total > 0 && items.length === 0) {
      setLoading(true);
      await loadTaskChecklist(task.id);
      setLoading(false);
    }
  };

  const showBar = total > 0 || editable;

  return (
    <div className="card overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150">
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
            className="w-full flex items-center gap-2 px-3 md:px-4 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
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
            <div className="px-3 md:px-4 pb-2.5 pt-0.5">
              {loading ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2.5 text-center">Loading checklist…</p>
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
