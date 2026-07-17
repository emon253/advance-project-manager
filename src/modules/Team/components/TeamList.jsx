/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppCard } from "../../../components/common/AppCard";
import { UserAvatar } from "../../../components/common/UserAvatar";

export function TeamList({ users, activeWorkspaceTasks }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
      {users.map((assoc) => {
        const assocTasks = activeWorkspaceTasks.filter(
          (t) => t.assigneeId === assoc.id && t.status !== "Completed" && t.status !== "Cancelled"
        );

        const loadBadge =
          assocTasks.length > 3
            ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
            : assocTasks.length > 1
            ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
            : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";

        return (
          <AppCard key={assoc.id} className="flex items-start gap-2.5 sm:gap-3" id={`team-item-${assoc.id}`}>
            <span className="sm:hidden"><UserAvatar user={assoc} size="sm" /></span>
            <span className="hidden sm:block"><UserAvatar user={assoc} size="md" /></span>

            <div className="min-w-0 text-left space-y-1 sm:space-y-1.5 w-full">
              <div>
                <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white truncate">
                  {assoc.name}
                </h3>
                <span className="badge mt-1 text-primary bg-primary/8 dark:bg-primary/15 border-primary/20">
                  {assoc.role}
                </span>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">{assoc.email}</p>

              <div className="pt-1.5 sm:pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Sprint tasks load</span>
                <span className={`badge font-tnum ${loadBadge}`}>
                  {assocTasks.length} assigned
                </span>
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}
