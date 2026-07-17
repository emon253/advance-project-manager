/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Search, CheckSquare } from "lucide-react";
import { PriorityBadge } from "../../../components/common/PriorityBadge";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { EmptyState } from "../../../components/common/EmptyState";

export function SearchList({
  sortedTasks,
  activeWorkspaceProjects,
  users,
  setActiveTaskId
}) {
  const [searchParams] = useSearchParams();
  const hasQuery = (searchParams.get("q") || "").trim() !== "";

  if (sortedTasks.length === 0) {
    return hasQuery ? (
      <EmptyState
        title="No matches found"
        description="Try broadening your query (e.g. 'layout', 'design', 'auth' or 'API')."
        icon={<SearchX className="w-7 h-7" />}
      />
    ) : (
      <EmptyState
        title="Search your workspace"
        description="Search across tasks, projects and people. Results will appear here as you search."
        icon={<Search className="w-7 h-7" />}
      />
    );
  }

  return (
    <div className="overflow-hidden text-left border-y border-zinc-100 dark:border-zinc-800 -mx-3 sm:mx-0 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800 sm:bg-white sm:dark:bg-zinc-900 sm:rounded-xl sm:shadow-soft">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-transparent sm:bg-zinc-50/70 sm:dark:bg-zinc-800/40">
        <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
        <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tasks
        </h3>
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 font-tnum">
          {sortedTasks.length}
        </span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {sortedTasks.map((task) => {
          const proj = activeWorkspaceProjects.find((p) => p.id === task.projectId);
          const assign = users.find((u) => u.id === task.assigneeId);
          return (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className="px-3 py-2.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer select-none transition-colors"
              id={`search-item-${task.id}`}
            >
              <div className="min-w-0 pr-2">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 leading-snug truncate">
                  {task.title}
                </h4>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: proj?.color }} />
                  <span className="truncate">{proj?.name}</span>
                  <span aria-hidden="true">•</span>
                  <span className="font-tnum shrink-0">
                    Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </span>
              </div>

              <div className="flex gap-2 shrink-0 self-end sm:self-auto items-center" onClick={(e) => e.stopPropagation()}>
                <PriorityBadge priority={task.priority} size="sm" />
                <StatusBadge status={task.status} size="sm" />
                <UserAvatar user={assign} size="xs" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
