/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronRight, Plus, ClipboardList } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { TaskRow } from "./TaskRow";
import { EmptyState } from "../../../components/common/EmptyState";
import { statusDot } from "../util/tasksUtils";

/**
 * Grouped task list: a section label per group (status dot · name · count)
 * and a card of 36px rows. Done/cancelled groups start collapsed. Optional
 * inline "Add a task" row at the top of the first open group (project page).
 */
export function TaskList({ groups, showProject = true, onAddTask, addPlaceholder = "Add a task… press Enter", emptyTitle = "No tasks here", emptyDescription = "Nothing matches the current filters." }) {
  const { activeWorkspaceProjects, users, taskStatuses, can, activeTaskId } = useAppState();
  const [open, setOpen] = useState({});
  const [draft, setDraft] = useState("");

  const total = groups.reduce((n, g) => n + g.tasks.length, 0);
  if (total === 0 && !onAddTask) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<ClipboardList className="w-6 h-6" />} />;
  }

  const firstOpenKey = groups.find((g) => g.kind === "open")?.key;

  const submitAdd = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddTask(draft.trim());
    setDraft("");
  };

  return (
    <div>
      {groups.map((group) => {
        const collapsible = group.kind !== "open";
        const isOpen = open[group.key] ?? !collapsible;
        const showAdd = onAddTask && can("editTasks") && group.key === firstOpenKey;
        if (group.tasks.length === 0 && !showAdd) return null;
        return (
          <section key={group.key}>
            <h2 className="section-label">
              {collapsible ? (
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [group.key]: !isOpen }))}
                  aria-expanded={isOpen}
                  className="inline-flex items-center gap-1.5 cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color || statusDot(group.key, taskStatuses) }} />
                  {group.label}
                  <span className="count">{group.tasks.length}{!isOpen ? " · collapsed" : ""}</span>
                </button>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color || statusDot(group.key, taskStatuses) }} />
                  {group.label}
                  <span className="count">{group.tasks.length}</span>
                </>
              )}
            </h2>
            {isOpen && (
              <div className="card overflow-hidden">
                {showAdd && (
                  <form onSubmit={submitAdd} className="flex items-center gap-2.5 h-[34px] px-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800/80">
                    <Plus className="w-4 h-4 text-primary shrink-0" />
                    <label className="sr-only" htmlFor={`add-task-${group.key}`}>Add a task</label>
                    <input
                      id={`add-task-${group.key}`}
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={addPlaceholder}
                      maxLength={500}
                      className="flex-1 min-w-0 h-full bg-transparent text-[13px] font-medium outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                  </form>
                )}
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={activeWorkspaceProjects.find((p) => p.id === task.projectId)}
                    assignee={users.find((u) => u.id === task.assigneeId)}
                    showProject={showProject}
                    selected={activeTaskId === task.id}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
