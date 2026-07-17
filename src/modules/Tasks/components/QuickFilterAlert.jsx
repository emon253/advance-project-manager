/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function QuickFilterAlert({ quickFilter }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!quickFilter) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-primary/8 dark:bg-primary/15 border border-primary/20 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl animate-in slide-in-from-top-1 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
          Active filter:{" "}
          <span className="badge bg-primary/10 dark:bg-primary/20 text-primary border-transparent ml-1">
            {quickFilter === "overdue" ? "Overdue Deliverables" :
             quickFilter === "in-progress" ? "Tasks In Progress" :
             "Completed This Week"}
          </span>
        </span>
      </div>
      <button
        onClick={() => {
          navigate(location.pathname, { replace: true });
        }}
        type="button"
        className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer shrink-0 py-1"
      >
        Show all tasks
      </button>
    </div>
  );
}
