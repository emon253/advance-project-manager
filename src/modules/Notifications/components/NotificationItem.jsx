/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckSquare, Clock, AlertTriangle, MessageSquare, AtSign, Briefcase, Bell, FileText, Activity, Calendar, Trash2, Circle, CircleDot } from "lucide-react";
import { formatRelative } from "../../Tasks/util/tasksUtils";

const ICONS = {
  assigned: [CheckSquare, "text-primary bg-primary/8 dark:bg-primary/15"],
  mention: [AtSign, "text-sky-600 bg-sky-50 dark:bg-sky-500/10"],
  comment: [MessageSquare, "text-sky-600 bg-sky-50 dark:bg-sky-500/10"],
  due_soon: [Clock, "text-amber-600 bg-amber-50 dark:bg-amber-500/10"],
  overdue: [AlertTriangle, "text-rose-600 bg-rose-50 dark:bg-rose-500/10"],
  project_update: [Briefcase, "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"],
  update: [Briefcase, "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"],
  reminder: [Bell, "text-violet-600 bg-violet-50 dark:bg-violet-500/10"],
  file_attached: [FileText, "text-purple-600 bg-purple-50 dark:bg-purple-500/10"],
  file: [FileText, "text-purple-600 bg-purple-50 dark:bg-purple-500/10"],
  status_changed: [Activity, "text-teal-600 bg-teal-50 dark:bg-teal-500/10"],
  milestone_rescheduled: [Calendar, "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-500/10"],
};

/** One inbox row (~60px): icon · message over type · project · time; unread dot; hover actions. The row opens the task. */
export function NotificationItem({ item, relatedProject, onOpen, onToggleRead, onDelete }) {
  const [Icon, tone] = ICONS[item.type] || [Bell, "text-zinc-500 bg-zinc-100 dark:bg-zinc-800"];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      className={`group/n flex items-center gap-3 px-4 py-3 min-h-[60px] border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0 cursor-pointer transition-colors ${
        item.read ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/40" : "bg-primary/[0.04] dark:bg-primary/10 hover:bg-primary/[0.07]"
      }`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${tone}`}><Icon className="w-4 h-4" /></span>
      <span className="flex-1 min-w-0">
        <span className={`block text-[13px] leading-snug line-clamp-2 md:line-clamp-1 break-words ${item.read ? "font-medium text-zinc-700 dark:text-zinc-300" : "font-bold text-zinc-900 dark:text-white"}`}>{item.message}</span>
        <span className="block mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {item.title}{relatedProject && <> · <span className="inline-block w-1.5 h-1.5 rounded-full align-middle mr-1" style={{ backgroundColor: relatedProject.color }} />{relatedProject.name}</>}
        </span>
      </span>
      <span className="flex items-center gap-2 text-xs text-zinc-400 font-tnum shrink-0 group-hover/n:hidden">{formatRelative(item.timestamp)}{!item.read && <span className="w-2 h-2 rounded-full bg-primary" aria-label="Unread" />}</span>
      <span className="hidden group-hover/n:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onToggleRead} className="btn-icon h-7 w-7" aria-label={item.read ? "Mark unread" : "Mark read"} title={item.read ? "Mark unread" : "Mark read"}>
          {item.read ? <CircleDot className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={onDelete} className="btn-icon h-7 w-7 hover:text-rose-600" aria-label="Delete notification"><Trash2 className="w-3.5 h-3.5" /></button>
      </span>
    </div>
  );
}
