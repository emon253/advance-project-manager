/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { assigneeLabel } from "../util/tasksUtils";

/** A typed name (no Hub account) drawn as a neutral grey initial. */
const NAME_TONE = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
export const personAvatar = (p) => p.user || { name: p.name, avatar: p.name.charAt(0).toUpperCase(), color: NAME_TONE };

/**
 * Who is on a task, members and typed names together: overlapping avatars and
 * "Jim & Yasin". `people` comes from taskAssignees(). `empty` is what an
 * unassigned task shows (a dashed "Assign" placeholder by default).
 */
export function Assignees({ people, showLabel = true, ring = "ring-white dark:ring-zinc-900", empty }) {
  if (!people.length) {
    return empty !== undefined ? empty : (
      <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <span className="w-[22px] h-[22px] rounded-full border-[1.5px] border-dashed border-zinc-300 dark:border-zinc-600 shrink-0" />
        {showLabel && "Assign"}
      </span>
    );
  }
  const label = assigneeLabel(people);
  return (
    <span className="inline-flex items-center gap-2 min-w-0 max-w-full" title={people.map((p) => p.name).join(", ")}>
      <span className="inline-flex shrink-0">
        {people.slice(0, 3).map((p, i) => (
          <span key={p.key} className={`rounded-full ${people.length > 1 ? `ring-2 ${ring}` : ""} ${i ? "-ml-2" : ""}`}>
            <UserAvatar user={personAvatar(p)} size="xs" />
          </span>
        ))}
      </span>
      {showLabel ? <span className="truncate">{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
