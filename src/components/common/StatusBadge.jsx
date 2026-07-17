/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, Clock, Play, AlertOctagon, XCircle, FileEdit, Tag } from "lucide-react";
import { useAppState } from "../../app/providers";

export function StatusBadge({ status, size = "md" }) {
  let taskStatuses = [];
  try {
    const state = useAppState();
    taskStatuses = state.taskStatuses;
  } catch (e) {
    // safe fallback outside provider
  }

  const iconClass = "w-3 h-3 shrink-0";
  const icons = {
    FileEdit: <FileEdit className={iconClass} />,
    Play: <Play className={iconClass} />,
    Clock: <Clock className={iconClass} />,
    AlertOctagon: <AlertOctagon className={iconClass} />,
    CheckCircle2: <CheckCircle2 className={iconClass} />,
    XCircle: <XCircle className={iconClass} />,
  };

  const sizeClass = size === "sm" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]";
  const base = `inline-flex items-center gap-1 font-semibold whitespace-nowrap rounded-full border ${sizeClass}`;

  const matched = taskStatuses?.find((s) => s.name === status);

  if (matched) {
    const iconEl = icons[matched.icon] || <Tag className={iconClass} />;
    const classes = [
      matched.bg || "bg-zinc-100",
      matched.text || "text-zinc-700",
      matched.border || "border-zinc-200",
      matched.darkBg || "dark:bg-zinc-800",
      matched.darkText || "dark:text-zinc-300",
      matched.darkBorder || "dark:border-zinc-700",
    ].join(" ");

    return (
      <span className={`${base} ${classes}`}>
        {iconEl}
        {status}
      </span>
    );
  }

  const styles = {
    "To Do": {
      bg: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      icon: icons.FileEdit,
    },
    "In Progress": {
      bg: "bg-primary/8 text-primary border-primary/20 dark:bg-primary/15",
      icon: icons.Play,
    },
    "In Review": {
      bg: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      icon: icons.Clock,
    },
    "Blocked": {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
      icon: icons.AlertOctagon,
    },
    "Completed": {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      icon: icons.CheckCircle2,
    },
    "Cancelled": {
      bg: "bg-zinc-200 text-zinc-500 border-zinc-300 line-through dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700",
      icon: icons.XCircle,
    },
  };

  const choice = styles[status] || styles["To Do"];

  return (
    <span className={`${base} ${choice.bg}`}>
      {choice.icon}
      {status}
    </span>
  );
}
