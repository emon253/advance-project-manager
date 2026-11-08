/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Paperclip, Flag, Check } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { useAppState } from "../../../app/providers";
import { completedStatusName, defaultStatusName, dueState, formatDue, isDoneTask } from "../util/tasksUtils";

/**
 * The one task row used everywhere (Today, My Tasks, project, search):
 * checkbox · title · priority flag (only High/Urgent) · counts · checklist
 * progress (only when there is one) · project · due · assignee.
 * 44px single line on desktop; two lines (title + meta) at phone width.
 */
/**
 * Small pop-confirm under the checkbox so a stray tap doesn't complete a task.
 * Fixed-positioned from the checkbox rect so list cards can't clip it; closes
 * on outside click, Escape or scroll. Enter confirms (the button has focus).
 */
function DoneConfirm({ anchor, title, onConfirm, onCancel }) {
  const r = anchor.getBoundingClientRect();
  const width = 248;
  const left = Math.max(8, Math.min(r.left - 8, window.innerWidth - width - 8));
  const below = r.bottom + 130 < window.innerHeight;
  useEffect(() => {
    const close = (e) => { if (e.type !== "keydown" || e.key === "Escape") onCancel(); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); window.removeEventListener("keydown", close); };
  }, [onCancel]);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onCancel(); }} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-label="Confirm mark as done"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") onCancel(); }}
        className="menu-panel fixed z-50 p-3 animate-in fade-in zoom-in-95 duration-100 cursor-default"
        style={{ width, left, ...(below ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }) }}
      >
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">Mark as done?</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{title}</p>
        <div className="mt-2.5 flex justify-end gap-1.5">
          <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">Cancel</button>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <button type="button" autoFocus onClick={onConfirm} className="btn btn-sm btn-primary"><Check className="w-3.5 h-3.5" /> Mark done</button>
        </div>
      </div>
    </>
  );
}

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

  const checkboxRef = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const toggleDone = (e) => {
    e.stopPropagation();
    if (done) updateTask(task.id, { status: defaultStatusName(taskStatuses) });
    else setConfirming(true);
  };
  const confirmDone = () => {
    setConfirming(false);
    updateTask(task.id, { status: completedStatusName(taskStatuses) });
  };

  const flag = task.priority === "Urgent" || task.priority === "High" ? (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold shrink-0 ${task.priority === "Urgent" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}>
      <Flag className="w-3 h-3" />
      {task.priority} priority
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
    <span className={`text-xs shrink-0 font-tnum md:w-[92px] md:text-right ${
      due === "late" ? "text-rose-700 dark:text-rose-400 font-bold"
        : due === "today" ? "text-zinc-900 dark:text-white font-semibold"
        : "text-zinc-500 dark:text-zinc-400"
    }`}>
      <span className={`font-medium ${due === "late" ? "" : "text-zinc-400 dark:text-zinc-500"}`}>Due </span>{dueLabel}
    </span>
  ) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActiveTaskId(task.id)}
      onKeyDown={(e) => { if (e.key === "Enter") setActiveTaskId(task.id); }}
      className={`group/row flex items-start md:items-center gap-2.5 px-2.5 md:px-3 py-2.5 md:py-0 md:h-11 border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0 cursor-pointer select-none transition-colors ${
        selected ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      }`}
      id={`task-item-${task.id}`}
    >
      <span className="flex items-center h-7 md:h-auto shrink-0" onClick={(e) => e.stopPropagation()}>
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={done}
          disabled={!can("editTasks")}
          onChange={toggleDone}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          className="cb"
        />
        {confirming && checkboxRef.current && (
          <DoneConfirm anchor={checkboxRef.current} title={task.title} onConfirm={confirmDone} onCancel={() => setConfirming(false)} />
        )}
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
        <div className="flex md:hidden flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {flag}{dueChip}{assignee && <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{assignee.name.split(" ")[0]}</span>}{projectChip}{counts}
        </div>
      </div>

      <span className="shrink-0 mt-0.5 md:mt-0 inline-flex items-center gap-1.5 md:min-w-[64px] justify-end" title={assignee?.name}>
        {assignee ? (
          <>
            <span className="hidden md:inline text-xs font-semibold text-zinc-600 dark:text-zinc-300 truncate max-w-[72px]">{assignee.name.split(" ")[0]}</span>
            <UserAvatar user={assignee} size="xs" />
          </>
        ) : <span className="block h-6 w-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600" aria-label="Unassigned" />}
      </span>
    </div>
  );
}
