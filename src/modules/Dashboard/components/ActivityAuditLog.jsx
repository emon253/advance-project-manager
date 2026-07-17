/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Activity } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { formatDateTime } from "../../Projects/util/projectUtils";

export function ActivityAuditLog({ activities, users }) {
  return (
    <div className="card p-3 sm:p-4 text-left" id="dashboard-activity-audit-log">
      <h2 className="font-display font-semibold text-sm text-zinc-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        Activity Audit log
      </h2>

      <ul className="max-h-[300px] overflow-y-auto pr-1 no-scrollbar divide-y divide-zinc-100 dark:divide-zinc-800">
        {activities.slice(0, 8).map((act) => {
          const user = users.find((u) => u.id === act.userId);
          return (
            <li key={act.id} className="flex gap-2.5 sm:gap-3 py-2.5 first:pt-0 last:pb-0 text-left">
              <div className="shrink-0 mt-0.5">
                <UserAvatar user={user} size="xs" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-snug font-medium">
                  <span className="font-semibold text-zinc-900 dark:text-white mr-1">{user?.name}</span>
                  {act.text.replace(user?.name + " " || "", "")}
                </p>
                <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500 block mt-0.5">
                  {act.timestamp ? formatDateTime(act.timestamp) : act.time}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
