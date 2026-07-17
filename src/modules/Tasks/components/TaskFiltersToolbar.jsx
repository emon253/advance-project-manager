/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Filter, RotateCcw } from "lucide-react";

export function TaskFiltersToolbar({
  projectFilter,
  setProjectFilter,
  activeWorkspaceProjects,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  users
}) {
  const hasActiveFilters = projectFilter || priorityFilter || assigneeFilter;

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap select-none">
      <span className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 shrink-0">
        <Filter className="w-3.5 h-3.5" /> Filters
      </span>

      {/* Project select */}
      <select
        value={projectFilter}
        onChange={(e) => setProjectFilter(e.target.value)}
        aria-label="Filter by project"
        className="field w-auto shrink-0 text-xs font-semibold"
      >
        <option value="">All Projects</option>
        {activeWorkspaceProjects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* Priority select */}
      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        aria-label="Filter by priority"
        className="field w-auto shrink-0 text-xs font-semibold"
      >
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>

      {/* Assignee select */}
      <select
        value={assigneeFilter}
        onChange={(e) => setAssigneeFilter(e.target.value)}
        aria-label="Filter by assignee"
        className="field w-auto shrink-0 text-xs font-semibold"
      >
        <option value="">All Assignees</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      {/* Reset filters */}
      {hasActiveFilters && (
        <button
          onClick={() => { setProjectFilter(""); setPriorityFilter(""); setAssigneeFilter(""); }}
          type="button"
          className="btn btn-sm btn-danger-soft shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset filters
        </button>
      )}
    </div>
  );
}
