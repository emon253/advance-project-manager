/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";
import { TaskToolbar, applyTaskFilters } from "../components/TaskToolbar";
import { TaskList } from "../components/TaskList";
import { TaskBoard } from "../components/TaskBoard";
import { groupByProject, groupByStatus, isOpenTask } from "../util/tasksUtils";

const SCOPES = [
  { value: "mine", label: "Assigned to me" },
  { value: "watching", label: "Watching" },
  { value: "all", label: "Everyone" },
];

/**
 * My Tasks: one list grouped by status, filters as chips (URL-backed so a
 * filtered view can be shared), list/board toggle. Done stays collapsed.
 */
export function TasksPage() {
  const { activeWorkspaceTasks, activeWorkspaceProjects, users, currentUser, taskStatuses } = useAppState();
  const { isLoading, isError, retry } = useMockQuery();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(() => localStorage.getItem("apm_tasks_view") || "list");

  const scope = params.get("scope") || "mine";
  const groupBy = params.get("group") || "status";
  const filters = {
    projectId: params.get("project") || "",
    assigneeId: params.get("assignee") || "",
    priority: params.get("priority") || "",
    due: params.get("due") || "",
  };
  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const onFilter = (patch) => setParam({
    project: patch.projectId, assignee: patch.assigneeId, priority: patch.priority, due: patch.due,
  });

  const scoped = useMemo(() => activeWorkspaceTasks.filter((t) => {
    if (scope === "mine") return t.assigneeId === currentUser?.id;
    if (scope === "watching") return (t.watchers || []).includes(currentUser?.id);
    return true;
  }), [activeWorkspaceTasks, scope, currentUser]);

  const filtered = useMemo(() => applyTaskFilters(scoped, filters, taskStatuses), [scoped, filters.projectId, filters.assigneeId, filters.priority, filters.due, taskStatuses]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => (
    groupBy === "project" ? groupByProject(filtered, activeWorkspaceProjects, taskStatuses) : groupByStatus(filtered, taskStatuses)
  ), [filtered, groupBy, activeWorkspaceProjects, taskStatuses]);

  const openCount = scoped.filter((t) => isOpenTask(t, taskStatuses)).length;
  const lateCount = scoped.filter((t) => isOpenTask(t, taskStatuses) && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))).length;

  const changeView = (v) => { setView(v); localStorage.setItem("apm_tasks_view", v); };

  return (
    <div className="text-left" id="tasks-page-root">
      <div className="flex items-baseline gap-3 mb-3">
        <h1 className="page-title">My Tasks</h1>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium font-tnum">
          {openCount} open{lateCount > 0 && <> · <span className="text-rose-700 dark:text-rose-400 font-bold">{lateCount} overdue</span></>}
        </p>
      </div>

      <TaskToolbar
        scope={scope}
        scopeOptions={SCOPES}
        onScope={(v) => setParam({ scope: v === "mine" ? "" : v })}
        filters={filters}
        onFilter={onFilter}
        projects={activeWorkspaceProjects}
        users={users}
        showAssigneeFilter={scope !== "mine"}
        groupBy={groupBy}
        onGroupBy={(v) => setParam({ group: v === "status" ? "" : v })}
        view={view}
        onView={changeView}
      />

      <div className="mt-1">
        {isLoading ? <ListSkeleton rows={6} /> : isError ? <ErrorState onRetry={retry} title="Couldn't load tasks" /> : view === "board" ? (
          <div className="mt-4"><TaskBoard groups={groups} /></div>
        ) : (
          <TaskList groups={groups} emptyDescription={scope === "mine" ? "Nothing assigned to you matches these filters." : "No tasks match these filters."} />
        )}
      </div>
    </div>
  );
}
