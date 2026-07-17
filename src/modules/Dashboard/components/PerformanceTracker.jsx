/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { getIconComponent } from "../../../components/common/IconHelper";

export function PerformanceTracker({ activeWorkspaceProjects, activeWorkspaceTasks }) {
  return (
    <div className="card p-3 sm:p-4 text-left h-full" id="dashboard-performance-tracker">
      <h2 className="font-display font-semibold text-sm text-zinc-900 dark:text-white mb-2 sm:mb-3">
        Project Performance Tracker
      </h2>

      {activeWorkspaceProjects.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium py-6 text-center">
          No projects in this workspace yet.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
          {activeWorkspaceProjects.map((p) => {
            const projTasks = activeWorkspaceTasks.filter((t) => t.projectId === p.id);
            const projectCompleted = projTasks.filter((t) => t.status === "Completed").length;
            const pct = projTasks.length > 0 ? Math.round((projectCompleted / projTasks.length) * 100) : 0;
            // clamp pct to max 100
            const displayPct = Math.min(pct, 100);
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="px-0 py-2.5 sm:p-3 border-0 sm:border sm:border-zinc-200 sm:dark:border-zinc-800 rounded-none sm:rounded-lg sm:hover:border-primary/40 sm:dark:hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors text-left block"
              >
                <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
                  <span className="w-8 h-8 rounded-lg bg-primary/8 dark:bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    {getIconComponent(p.icon, "w-4 h-4")}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate">{p.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{p.status}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${displayPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 font-tnum">
                    <span>{projectCompleted}/{projTasks.length} done</span>
                    <span>{displayPct}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
