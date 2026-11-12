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
import { TaskTable } from "../components/TaskTable";
import { TaskBoard } from "../components/TaskBoard";
import { dueState, groupByStatus, isOpenTask, sortTasks } from "../util/tasksUtils";

const SCOPES = [
  { value: "mine", label: "Assigned to me" },
  { value: "watching", label: "Watching" },
  { value: "all", label: "Everyone" },
];

/**
 * My Tasks: one flat table (open tasks first, then by due date), filters as
 * dropdowns (URL-backed so a filtered view can be shared), list/board toggle.
 */
export function TasksPage() {
  const { activeWorkspaceTasks, activeWorkspaceProjects, users, currentUser, taskStatuses } = useAppState();
  const { isLoading, isError, retry } = useMockQuery();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(() => localStorage.getItem("apm_tasks_view") || "list");

  const scope = params.get("scope") || "mine";
  const filters = {
    status: params.get("status") || "",
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
    status: patch.status, project: patch.projectId, assignee: patch.assigneeId, priority: patch.priority, due: patch.due,
  });

  const scoped = useMemo(() => activeWorkspaceTasks.filter((t) => {
    if (scope === "mine") return t.assigneeId === currentUser?.id;
    if (scope === "watching") return (t.watchers || []).includes(currentUser?.id);
    return true;
  }), [activeWorkspaceTasks, scope, currentUser]);

  const filtered = useMemo(() => applyTaskFilters(scoped, filters, taskStatuses), [scoped, filters.status, filters.projectId, filters.assigneeId, filters.priority, filters.due, taskStatuses]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => sortTasks(filtered, taskStatuses), [filtered, taskStatuses]);
  const groups = useMemo(() => (view === "board" ? groupByStatus(filtered, taskStatuses) : []), [view, filtered, taskStatuses]);

  const openTasks = scoped.filter((t) => isOpenTask(t, taskStatuses));
  const lateCount = openTasks.filter((t) => dueState(t, taskStatuses) === "late").length;
  const todayCount = openTasks.filter((t) => dueState(t, taskStatuses) === "today").length;

  const changeView = (v) => { setView(v); localStorage.setItem("apm_tasks_view", v); };

  return (
    <div className="text-left flex flex-col gap-4" id="tasks-page-root">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 md:px-0">
        <h1 className="page-title">My Tasks</h1>
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-tnum">
          {openTasks.length} open{todayCount > 0 && `, ${todayCount} due today`}{lateCount > 0 && <>, <span className="text-rose-700 dark:text-rose-400 font-bold">{lateCount} overdue</span></>}
        </p>
      </div>

      <TaskToolbar
        lead={(
          <div className="seg w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none" role="tablist" aria-label="Whose tasks">
            {SCOPES.map((o) => (
              <button key={o.value} type="button" role="tab" aria-selected={scope === o.value} onClick={() => setParam({ scope: o.value === "mine" ? "" : o.value })}>
                {o.label}
              </button>
            ))}
          </div>
        )}
        filters={filters}
        onFilter={onFilter}
        statuses={taskStatuses}
        projects={activeWorkspaceProjects}
        users={users}
        showAssigneeFilter={scope !== "mine"}
        view={view}
        onView={changeView}
      />

      {isLoading ? <ListSkeleton rows={6} /> : isError ? <ErrorState onRetry={retry} title="Couldn't load tasks" /> : view === "board" ? (
        <TaskBoard groups={groups} />
      ) : (
        <TaskTable tasks={rows} variant="my" emptyDescription={scope === "mine" ? "Nothing assigned to you matches these filters." : "No tasks match these filters."} />
      )}
    </div>
  );
}
