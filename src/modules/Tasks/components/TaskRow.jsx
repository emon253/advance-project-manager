/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MessageSquare, Paperclip, Flag } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { useAppState } from "../../../app/providers";
import { completedStatusName, defaultStatusName, dueState, formatDue, isDoneTask } from "../util/tasksUtils";

/**
 * The one task row used everywhere (Today, My Tasks, project, search):
 * checkbox · title · priority flag (only High/Urgent) · counts · checklist
 * progress (only when there is one) · project · due · assignee.
 * 36px single line on desktop; two lines (title + meta) at phone width.
 */
export function TaskRow({ task, project, assignee, showProject = true, selected = false }) {
  const { can, updateTask, setActiveTaskId, taskStatuses } = useAppState();
  const done = isDoneTask(task, taskStatuses);
  const due = dueState(task, taskStatuses);
  const dueLabel = formatDue(task.dueDate);

  const checklistTotal = task.checklist?.length || task.checklistTotal || 0;
  const checklistDone = task.checklist?.length
    ? task.checklist.filter((c) => c.completed).length
    : (task.checklistDone || 0);
  const commentCount = task.comments?.length || task.commentCount || 0;
  const attachmentCount = task.attachments?.length || task.attachmentCount || 0;

  const toggleDone = (e) => {
    e.stopPropagation();
    updateTask(task.id, { status: done ? defaultStatusName(taskStatuses) : completedStatusName(taskStatuses) });
  };

  const flag = task.priority === "Urgent" || task.priority === "High" ? (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold shrink-0 ${task.priority === "Urgent" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}>
      <Flag className="w-3 h-3" />
      {task.priority}
    </span>
  ) : null;

  const counts = (
    <>
      {commentCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0 font-tnum">
          <MessageSquare className="w-3 h-3" />{commentCount}
        </span>
      )}
      {attachmentCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0 font-tnum">
          <Paperclip className="w-3 h-3" />{attachmentCount}
        </span>
      )}
      {checklistTotal > 0 && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0 font-tnum" title="Checklist">
          <span className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <span className={`block h-full rounded-full ${checklistDone === checklistTotal ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${(checklistDone / checklistTotal) * 100}%` }} />
          </span>
          {checklistDone}/{checklistTotal}
        </span>
      )}
    </>
  );

  const projectChip = showProject && project ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]" title={project.name}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color || "#6366f1" }} />
      <span className="truncate">{project.name}</span>
    </span>
  ) : null;

  const dueChip = dueLabel ? (
    <span className={`text-xs shrink-0 font-tnum md:w-[60px] md:text-right ${
      due === "late" ? "text-rose-700 dark:text-rose-400 font-bold"
        : due === "today" ? "text-zinc-900 dark:text-white font-semibold"
        : "text-zinc-500 dark:text-zinc-400"
    }`}>
      {dueLabel}
    </span>
  ) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActiveTaskId(task.id)}
      onKeyDown={(e) => { if (e.key === "Enter") setActiveTaskId(task.id); }}
      className={`group/row flex items-start md:items-center gap-2.5 px-2.5 py-1.5 md:py-0 md:h-9 border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0 cursor-pointer select-none transition-colors ${
        selected ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      }`}
      id={`task-item-${task.id}`}
    >
      <span className="flex items-center h-7 md:h-auto shrink-0" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={done}
          disabled={!can("editTasks")}
          onChange={toggleDone}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          className="cb"
        />
      </span>

      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-2.5">
        <span className={`text-[13px] md:text-[13px] font-medium leading-snug md:truncate flex-1 min-w-0 ${
          done ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
        }`}>
          {task.title}
        </span>
        {/* Desktop: inline meta */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {flag}{counts}{projectChip}{dueChip}
        </div>
        {/* Phone: meta line */}
        <div className="flex md:hidden flex-wrap items-center gap-x-2 gap-y-0.5">
          {flag}{dueChip}{projectChip}{counts}
        </div>
      </div>

      <span className="shrink-0 mt-0.5 md:mt-0 inline-flex items-center gap-1.5 min-w-[64px] justify-end" title={assignee?.name}>
        {assignee ? (
          <>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate max-w-[72px]">{assignee.name.split(" ")[0]}</span>
            <UserAvatar user={assignee} size="xs" />
          </>
        ) : <span className="block h-6 w-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600" aria-label="Unassigned" />}
      </span>
    </div>
  );
}
