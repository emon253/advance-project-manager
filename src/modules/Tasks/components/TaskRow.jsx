/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Paperclip, Flag, Check } from "lucide-react";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useAppState } from "../../../app/providers";
import { Assignees } from "./Assignees";
import { assigneeLabel, completedStatusName, defaultStatusName, dueState, formatDue, isDoneTask, taskAssignees } from "../util/tasksUtils";

/**
 * Small pop-confirm under the checkbox so a stray tap doesn't complete a task.
 * Fixed-positioned from the anchor's rect and portalled to <body>, so list
 * cards can't clip it and a transformed ancestor (the task drawer) can't
 * shift it; closes on outside click, Escape or scroll. Enter confirms (the
 * button has focus).
 */
export function DoneConfirm({ anchor, title, onConfirm, onCancel }) {
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
  return createPortal(
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
    </>,
    document.body
  );
}

/** The row checkbox: ticking asks first (DoneConfirm), unticking reopens straight away. */
export function DoneCheckbox({ task }) {
  const { can, updateTask, taskStatuses } = useAppState();
  const done = isDoneTask(task, taskStatuses);
  const ref = useRef(null);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="checkbox"
        checked={done}
        disabled={!can("editTasks")}
        onChange={() => (done ? updateTask(task.id, { status: defaultStatusName(taskStatuses) }) : setConfirming(true))}
        aria-label={done ? `Reopen ${task.title}` : `Mark ${task.title} done`}
        className="cb"
      />
      {confirming && ref.current && (
        <DoneConfirm
          anchor={ref.current}
          title={task.title}
          onConfirm={() => { setConfirming(false); updateTask(task.id, { status: completedStatusName(taskStatuses) }); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}

/**
 * The compact task row (Today, search, and My Tasks / project lists where a
 * table does not fit): checkbox · title · priority flag (only High/Urgent) ·
 * counts · checklist progress (only when there is one) · project · due ·
 * assignees. 44px single line when the list is wide; two lines (title +
 * meta) when it is narrow (a phone, or the task drawer open beside it). `showStatus` adds the status tag for flat, ungrouped lists.
 */
export function TaskRow({ task, project, showProject = true, showStatus = false, selected = false }) {
  const { setActiveTaskId, taskStatuses, users } = useAppState();
  const done = isDoneTask(task, taskStatuses);
  const due = dueState(task, taskStatuses);
  const dueLabel = formatDue(task.dueDate);
  const people = taskAssignees(task, users);
  const statusTag = showStatus ? <StatusBadge status={task.status} variant="tag" /> : null;

  const checklistTotal = task.checklist?.length || task.checklistTotal || 0;
  const checklistDone = task.checklist?.length
    ? task.checklist.filter((c) => c.completed).length
    : (task.checklistDone || 0);
  const commentCount = task.comments?.length || task.commentCount || 0;
  const attachmentCount = task.attachments?.length || task.attachmentCount || 0;

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
    <span className={`text-xs shrink-0 font-tnum @2xl:w-[92px] @2xl:text-right ${
      due === "late" ? "text-rose-700 dark:text-rose-400 font-bold"
        : due === "today" ? "text-zinc-900 dark:text-white font-semibold"
        : "text-zinc-500 dark:text-zinc-400"
    }`}>
      <span className={`font-medium ${due === "late" ? "" : "text-zinc-400 dark:text-zinc-500"}`}>Due </span>{dueLabel}
    </span>
  ) : null;

  return (
    <div className="@container border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0">
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActiveTaskId(task.id)}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) setActiveTaskId(task.id); }}
      className={`group/row flex items-start @2xl:items-center gap-2.5 px-2.5 @2xl:px-3 py-2.5 @2xl:py-0 @2xl:h-11 cursor-pointer select-none transition-colors focus-visible:-outline-offset-2 ${
        selected ? "bg-primary/8 dark:bg-primary/15" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      }`}
      id={`task-item-${task.id}`}
    >
      <span className="flex items-center h-7 @2xl:h-auto shrink-0" onClick={(e) => e.stopPropagation()}>
        <DoneCheckbox task={task} />
      </span>

      <div className="flex-1 min-w-0 flex flex-col @2xl:flex-row @2xl:items-center gap-1 @2xl:gap-2.5">
        <span className={`text-[13px] @2xl:text-[13px] font-medium leading-snug @2xl:truncate flex-1 min-w-0 ${
          done ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"
        }`}>
          {task.title}
        </span>
        {/* Desktop: inline meta */}
        <div className="hidden @2xl:flex items-center gap-2.5 shrink-0">
          {statusTag}{flag}{counts}{projectChip}{dueChip}
        </div>
        {/* Phone: meta line */}
        <div className="flex @2xl:hidden flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {statusTag}{flag}{dueChip}{people.length > 0 && <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{assigneeLabel(people)}</span>}{projectChip}{counts}
        </div>
      </div>

      <span className="shrink-0 mt-0.5 @2xl:mt-0 inline-flex items-center justify-end @2xl:min-w-[64px] max-w-[150px] text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        <span className="hidden @2xl:inline-flex min-w-0"><Assignees people={people} empty={<span className="block h-6 w-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600" aria-label="Unassigned" />} /></span>
        <span className="@2xl:hidden"><Assignees people={people} showLabel={false} empty={<span className="block h-6 w-6 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600" aria-label="Unassigned" />} /></span>
      </span>
    </div>
    </div>
  );
}
