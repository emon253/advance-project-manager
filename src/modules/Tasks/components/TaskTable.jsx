/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ClipboardList, MessageSquare, Plus, SquareCheckBig } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { EmptyState } from "../../../components/common/EmptyState";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { PriorityBadge } from "../../../components/common/PriorityBadge";
import { Assignees } from "./Assignees";
import { DoneCheckbox, TaskRow } from "./TaskRow";
import { dueState, formatDue, formatRelative, isDoneTask, shortDate, taskAssignees } from "../util/tasksUtils";

const HEADERS = { status: "Status", project: "Project", due: "Due", priority: "Priority", assignee: "Assignee", updated: "Updated" };
const PRESETS = {
  my: { columns: ["status", "project", "due", "priority", "assignee"], template: "44px minmax(0, 1fr) 150px 180px 120px 120px 140px" },
  project: { columns: ["status", "assignee", "due", "priority", "updated"], template: "44px minmax(0, 1fr) 150px 160px 120px 120px 120px" },
};
const CHIP = "inline-flex items-center h-6 px-[9px] rounded-full text-xs font-bold whitespace-nowrap";

/** "2h ago" · "Just now" · "Yesterday" · "Nov 10". */
function agoLabel(timestamp) {
  const r = formatRelative(timestamp);
  if (r === "now") return "Just now";
  return /^\d+[mh]$/.test(r) ? `${r} ago` : r;
}

function Cell({ column, task, project, people, taskStatuses }) {
  if (column === "status") return <StatusBadge status={task.status} variant="tag" />;
  if (column === "priority") return <PriorityBadge priority={task.priority} variant="tag" />;
  if (column === "assignee") return <span className="flex font-semibold text-zinc-900 dark:text-zinc-100"><Assignees people={people} /></span>;
  if (column === "project") {
    return project ? (
      <span className="flex items-center gap-2 min-w-0 text-zinc-700 dark:text-zinc-300" title={project.name}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color || "#6366f1" }} />
        <span className="truncate">{project.name}</span>
      </span>
    ) : <span className="text-zinc-400 dark:text-zinc-500">No project</span>;
  }
  if (column === "due") {
    const due = dueState(task, taskStatuses);
    if (!due) return <span className="text-zinc-400 dark:text-zinc-500">No date</span>;
    if (due === "today") return <span className={`${CHIP} bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400`}>Today</span>;
    if (due === "late") return <span className={`${CHIP} bg-[#fde8e8] text-red-700 dark:bg-red-500/10 dark:text-red-400`} title="Overdue">{shortDate(task.dueDate)}</span>;
    return <span className="text-zinc-700 dark:text-zinc-300 font-tnum">{formatDue(task.dueDate)}</span>;
  }
  // updated: falls back to when the task was created if the API sent no updatedAt.
  const at = task.updatedAt || task.createdAt;
  return <span className="text-zinc-500 dark:text-zinc-400 font-tnum" title={at ? new Date(at).toLocaleString() : undefined}>{at ? agoLabel(at) : ""}</span>;
}

/**
 * Task list as a table: one bordered card, a header row, flat rows (no status
 * bands), status as a tinted tag in its own column. `variant` picks the
 * columns: "my" (… Project, Due, Priority, Assignee) or "project"
 * (… Assignee, Due, Priority, Updated). When the card is narrower than a
 * six-column table needs (phones, or the task drawer open beside it) each row
 * falls back to the compact TaskRow with the same information. Optional
 * quick "add a task" row at the bottom.
 */
export function TaskTable({ tasks, variant = "my", onAddTask, addLabel = "Add a task", emptyTitle = "No tasks here", emptyDescription = "Nothing matches the current filters." }) {
  const { activeWorkspaceProjects, users, taskStatuses, can, activeTaskId, setActiveTaskId } = useAppState();
  const [draft, setDraft] = useState("");
  const { columns, template } = PRESETS[variant];
  const canAdd = !!onAddTask && can("editTasks");

  if (tasks.length === 0 && !canAdd) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<ClipboardList className="w-6 h-6" />} />;
  }

  const submitAdd = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddTask(draft.trim());
    setDraft("");
  };

  return (
    <div className="@container">
      <div role="table" aria-label="Tasks" className="border border-zinc-200 dark:border-zinc-800 rounded-[10px] bg-white dark:bg-zinc-900 overflow-hidden">
        <div role="row" style={{ gridTemplateColumns: template }} className="hidden @[920px]:grid items-center h-9 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-[11.5px] font-bold tracking-[0.04em] uppercase text-zinc-500 dark:text-zinc-400">
          <span />
          <span role="columnheader">Task</span>
          {columns.map((c) => <span key={c} role="columnheader">{HEADERS[c]}</span>)}
        </div>

        {tasks.map((task) => {
          const project = activeWorkspaceProjects.find((p) => p.id === task.projectId);
          const people = taskAssignees(task, users);
          const done = isDoneTask(task, taskStatuses);
          const comments = task.comments?.length || task.commentCount || 0;
          const checkTotal = task.checklist?.length || task.checklistTotal || 0;
          const checkDone = task.checklist?.length ? task.checklist.filter((c) => c.completed).length : (task.checklistDone || 0);
          const selected = activeTaskId === task.id;
          return (
            <React.Fragment key={task.id}>
              <div
                role="row"
                tabIndex={0}
                onClick={() => setActiveTaskId(task.id)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) setActiveTaskId(task.id); }}
                style={{ gridTemplateColumns: template }}
                className={`hidden @[920px]:grid items-center min-h-[46px] border-b border-zinc-100 dark:border-zinc-800/80 text-[13.5px] cursor-pointer select-none transition-colors focus-visible:-outline-offset-2 ${selected ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
              >
                <span className="flex justify-center" onClick={(e) => e.stopPropagation()}><DoneCheckbox task={task} /></span>
                <span role="cell" className="flex items-center gap-3 min-w-0 pr-4">
                  <span className={`font-semibold truncate ${done ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"}`}>{task.title}</span>
                  {comments > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-tnum" title="Comments"><MessageSquare className="w-[13px] h-[13px]" />{comments}</span>
                  )}
                  {checkTotal > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-tnum" title="Checklist"><SquareCheckBig className="w-[13px] h-[13px]" />{checkDone}/{checkTotal}</span>
                  )}
                </span>
                {columns.map((c) => (
                  <span key={c} role="cell" className="min-w-0 pr-3"><Cell column={c} task={task} project={project} people={people} taskStatuses={taskStatuses} /></span>
                ))}
              </div>
              <div className="@[920px]:hidden border-b border-zinc-100 dark:border-zinc-800/80">
                <TaskRow task={task} project={project} showProject={columns.includes("project")} showStatus selected={selected} />
              </div>
            </React.Fragment>
          );
        })}

        {tasks.length === 0 && <p className="px-3.5 py-6 text-[13px] text-zinc-500 dark:text-zinc-400 text-center">{emptyDescription}</p>}

        {canAdd ? (
          <form onSubmit={submitAdd} className="flex items-center gap-3 h-[46px] px-2.5 @[920px]:px-3.5 text-primary">
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label={addLabel}
              placeholder={`${addLabel}, then press Enter`}
              maxLength={500}
              id="task-table-add"
              className="flex-1 min-w-0 h-10 bg-transparent outline-none text-base md:text-[13.5px] text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </form>
        ) : <div className="-mt-px" />}
      </div>
    </div>
  );
}
