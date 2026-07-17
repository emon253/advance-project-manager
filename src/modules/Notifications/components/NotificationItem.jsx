/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckSquare, Clock, AlertTriangle, MessageSquare, Briefcase, Bell, FileText, Activity, Calendar, Trash2 } from "lucide-react";

/** Compact inbox-style timestamp: "now", "5m", "3h", "Yesterday", "Jul 17". */
function formatCompactTime(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date)) return null;
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && date.getDate() === now.getDate()) return `${diffHr}h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const opts = { month: "short", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return date.toLocaleDateString(undefined, opts);
}

export function renderNotificationIcon(type) {
  switch (type) {
    case "assigned":
      return (
        <div className="p-2 rounded-lg bg-primary/8 dark:bg-primary/15 text-primary shrink-0">
          <CheckSquare className="w-4 h-4" />
        </div>
      );
    case "due_soon":
      return (
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
          <Clock className="w-4 h-4" />
        </div>
      );
    case "overdue":
      return (
        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    case "mention":
      return (
        <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    case "project_update":
    case "update":
      return (
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Briefcase className="w-4 h-4" />
        </div>
      );
    case "reminder":
      return (
        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      );
    case "file":
    case "file_attached":
      return (
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    case "status_change":
    case "status_changed":
      return (
        <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0">
          <Activity className="w-4 h-4" />
        </div>
      );
    case "rescheduled":
    case "milestone_rescheduled":
      return (
        <div className="p-2 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      );
  }
}

export function NotificationItem({
  item,
  isSelected,
  relatedTask,
  relatedProject,
  handleNotificationClick,
  handleToggleRead,
  handleDeleteNotification,
  setActiveTaskId,
  navigate
}) {
  return (
    <article
      onClick={() => handleNotificationClick(item)}
      className={`group relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        isSelected
          ? "border-primary/20 bg-primary/8 dark:bg-primary/15"
          : item.read
          ? "border-transparent bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
          : "border-transparent bg-primary/8 dark:bg-primary/15 hover:bg-primary/10 dark:hover:bg-primary/20"
      }`}
    >
      {/* Type icon chip */}
      {renderNotificationIcon(item.type)}

      {/* Content area */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {!item.read && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            )}
            <h3
              className={`truncate text-sm font-semibold leading-snug ${
                item.read ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {item.title}
            </h3>
          </div>
          <time className="text-xs text-zinc-400 dark:text-zinc-500 font-medium shrink-0 leading-snug text-right font-tnum">
            {(item.timestamp && formatCompactTime(item.timestamp)) || item.time || "now"}
          </time>
        </div>

        <p
          className={`mt-0.5 line-clamp-2 text-xs leading-relaxed ${
            item.read ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {item.message}
        </p>

        {/* Related entity chips & quick actions — single row, chips shrink before wrapping */}
        <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
            {item.taskId && relatedTask && (
              <button
                type="button"
                onClick={() => {
                  handleToggleRead(item.id, true);
                  setActiveTaskId(item.taskId);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-600 hover:bg-primary/8 hover:text-primary border border-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/80 dark:hover:bg-primary/15 dark:hover:text-primary transition-colors cursor-pointer min-w-0 shrink"
              >
                <CheckSquare className="h-3 w-3 shrink-0" />
                <span className="truncate">{relatedTask.title}</span>
              </button>
            )}

            {item.projectId && relatedProject && (
              <button
                type="button"
                onClick={() => {
                  handleToggleRead(item.id, true);
                  navigate(`/projects/${item.projectId}`);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200 border border-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer min-w-0 shrink"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: relatedProject.color }}
                />
                <span className="truncate">{relatedProject.name}</span>
              </button>
            )}
          </div>

          {/* Inline quick actions */}
          <div
            className="flex items-center shrink-0 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleToggleRead(item.id)}
              className="px-2 py-1.5 rounded-md text-[11px] font-semibold text-zinc-500 hover:text-primary hover:bg-primary/8 dark:text-zinc-400 dark:hover:text-primary dark:hover:bg-primary/15 transition-colors cursor-pointer whitespace-nowrap"
              title={item.read ? "Mark as unread" : "Mark as read"}
            >
              {item.read ? "Mark unread" : "Mark read"}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteNotification(item.id)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete notification"
              aria-label="Delete notification"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
