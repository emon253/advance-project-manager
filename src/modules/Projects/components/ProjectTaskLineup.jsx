/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Plus, Inbox } from "lucide-react";
import { TaskRow } from "../../Tasks/components/TaskRow";
import { useAppState } from "../../../app/providers";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { EmptyState } from "../../../components/common/EmptyState";

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
        <div className="card overflow-hidden">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {projectTasks.map((task) => {
              const proj = activeWorkspaceProjects.find((p) => p.id === task.projectId);
              const assign = users.find((u) => u.id === task.assigneeId);
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  proj={proj}
                  assign={assign}
                  setActiveTaskId={setActiveTaskId}
                  updateTask={updateTask}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
