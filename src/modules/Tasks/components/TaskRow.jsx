/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MessageSquare, Calendar, ChevronRight, CheckCircle2, Paperclip } from "lucide-react";
import { PriorityBadge } from "../../../components/common/PriorityBadge";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { UserAvatar } from "../../../components/common/UserAvatar";

export function TaskRow({
  task,
  proj,
  assign,
  setActiveTaskId,
  updateTask
}) {
  const isCompleted = task.status === "Completed";
  const checklistItems = task.checklist || [];
  const completedCLCount = checklistItems.filter((i) => i.completed).length;
  const commentCount = task.comments?.length || 0;

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj && dueDateObj < new Date() && !isCompleted;
  const formattedDate = dueDateObj
    ? dueDateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  const renderProjectChip = (visibility) => proj && (
    <span className={`${visibility} items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 max-w-40`}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: proj.color || "#6366f1" }} />
      <span className="truncate">{proj.name}</span>
    </span>
  );

  // Quieter variant for the mobile meta line: colored dot + name, no pill chrome
  const projectPlainLabel = proj && (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 min-w-0">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: proj.color || "#6366f1" }} />
      <span className="truncate max-w-36">{proj.name}</span>
    </span>
  );

  const metaChips = (
    <>
      {/* Checklist progress */}
      {checklistItems.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
          title={`${completedCLCount}/${checklistItems.length} Milestones completed`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono font-tnum">{completedCLCount}/{checklistItems.length}</span>
        </span>
      )}

      {/* Attachments count */}
      {task.attachments?.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
          title={`${task.attachments.length} attached documents`}
        >
          <Paperclip className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono font-tnum">{task.attachments.length}</span>
        </span>
      )}

      {/* Comments counter */}
      {commentCount > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
          title={`${commentCount} discussion entries`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono font-tnum">{commentCount}</span>
        </span>
      )}

      {/* Due date / overdue warning */}
      {formattedDate && (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            isOverdue
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
          title={isOverdue ? "Overdue delivery" : "Due date"}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{formattedDate}{isOverdue && " · Overdue"}</span>
        </span>
      )}
    </>
  );

  return (
    <div
      onClick={() => setActiveTaskId(task.id)}
      className="group/row flex items-start md:items-center gap-2 md:gap-3 px-3 py-3 md:px-4 md:py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer select-none transition-colors"
      id={`task-item-${task.id}`}
    >
      {/* Completion checkbox — 44px touch target on mobile */}
      <div
        className="flex items-center justify-center w-11 h-11 -my-2.5 -ml-3 md:w-9 md:h-9 md:-my-1.5 md:ml-0 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => updateTask(task.id, { status: isCompleted ? "To Do" : "Completed" })}
          aria-label={isCompleted ? "Mark task as not completed" : "Mark task as completed"}
          className="w-5 h-5 rounded-md border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary/30 cursor-pointer shrink-0 bg-transparent"
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Line 1 — desktop: chip + title + inline meta; mobile: title + trailing avatar */}
        <div className="flex items-center gap-2 min-w-0">
          {renderProjectChip("hidden md:inline-flex")}
          <h4
            className={`flex-1 md:flex-none md:max-w-full font-semibold text-sm leading-snug truncate transition-colors ${
              isCompleted
                ? "line-through text-zinc-400 dark:text-zinc-500"
                : "text-zinc-900 dark:text-white group-hover/row:text-primary"
            }`}
          >
            {task.title}
          </h4>
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {metaChips}
          </div>
          <span className="md:hidden shrink-0">
            <UserAvatar user={assign} size="xs" />
          </span>
        </div>

        {/* Line 2 — mobile only: one quiet wrapping meta line.
            Completed rows skip the status badge (checkbox + strikethrough already say it). */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
          {!isCompleted && <StatusBadge status={task.status} size="sm" />}
          <PriorityBadge priority={task.priority} size="sm" />
          {projectPlainLabel}
          {metaChips}
        </div>
      </div>

      {/* Right side — desktop only: badges + hover action */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <PriorityBadge priority={task.priority} size="sm" />
        <StatusBadge status={task.status} size="sm" />
        <UserAvatar user={assign} size="xs" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveTaskId(task.id); }}
          aria-label="Open task details"
          title="Open task details"
          className="btn-icon h-8 w-8 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
