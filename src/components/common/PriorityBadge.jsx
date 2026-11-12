/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertCircle, ArrowDown, ArrowUp, Flag, Minus } from "lucide-react";

/** Tint per priority: `tag` for the pill, `text` for a bare flag + name. */
export const PRIORITY_TONE = {
  Urgent: { tag: "bg-[#fde8e8] text-red-700 dark:bg-red-500/10 dark:text-red-400", text: "text-red-700 dark:text-red-400" },
  High: { tag: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400", text: "text-amber-700 dark:text-amber-400" },
  Medium: { tag: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", text: "text-zinc-700 dark:text-zinc-300" },
  Low: { tag: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", text: "text-zinc-500 dark:text-zinc-400" },
};

/** `variant="tag"`: borderless tinted pill with a flag (tables). */
export function PriorityBadge({ priority, size = "md", variant }) {
  if (variant === "tag") {
    return (
      <span className={`inline-flex items-center gap-[5px] h-6 pl-[7px] pr-[9px] rounded-full text-xs font-bold whitespace-nowrap ${(PRIORITY_TONE[priority] || PRIORITY_TONE.Medium).tag}`}>
        <Flag className="w-3 h-3 shrink-0" />
        {priority || "Medium"}
      </span>
    );
  }

  const iconClass = "w-3 h-3 shrink-0";
  const styles = {
    Urgent: {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
      icon: <AlertCircle className={iconClass} />,
    },
    High: {
      bg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
      icon: <ArrowUp className={iconClass} />,
    },
    Medium: {
      bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
      icon: <Minus className={iconClass} />,
    },
    Low: {
      bg: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20",
      icon: <ArrowDown className={iconClass} />,
    }
  };

  const choice = styles[priority] || styles.Medium;
  const sizeClass = size === "sm" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]";

  return (
    <span className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap rounded-md border ${choice.bg} ${sizeClass}`}>
      {choice.icon}
      {priority}
    </span>
  );
}
