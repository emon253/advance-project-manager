/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "../../../components/common/UserAvatar";

export function WorkloadSpeedDials({ users, activeWorkspaceTasks }) {
  return (
    <div className="card p-3 sm:p-4 text-left" id="dashboard-workloads-speeddials">
      <h2 className="font-display font-semibold text-sm text-zinc-900 dark:text-white mb-2 sm:mb-3">
        Workload speed dials
      </h2>

      <div className="space-y-2.5 sm:space-y-3">
        {users.slice(0, 4).map((user) => {
          const count = activeWorkspaceTasks.filter((t) => t.assigneeId === user.id && t.status !== "Completed").length;
          let barColor = "bg-primary";
          if (count > 4) barColor = "bg-rose-500";
          else if (count > 2) barColor = "bg-amber-500";
          const barWidth = Math.min(count / 6, 1) * 100;

          return (
            <div key={user.id}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={user} size="xs" />
                  <span className="font-medium text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 truncate">{user.name}</span>
                </div>
                <span className="text-xs font-medium font-tnum text-zinc-500 dark:text-zinc-400 shrink-0">
                  {count} active
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link to="/team" className="block text-center mt-3 sm:mt-4 py-1 text-xs font-semibold text-primary hover:underline">
        Manage team workloads
      </Link>
    </div>
  );
}
