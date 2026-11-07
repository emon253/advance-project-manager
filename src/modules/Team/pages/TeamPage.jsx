/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { isOpenTask } from "../../Tasks/util/tasksUtils";

/** Who has what: one row per member with open and overdue counts. Inviting lives in Settings › Members. */
export function TeamPage() {
  const { users, activeWorkspaceTasks, taskStatuses, can } = useAppState();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const rows = users.map((u) => {
    const open = activeWorkspaceTasks.filter((t) => t.assigneeId === u.id && isOpenTask(t, taskStatuses));
    const late = open.filter((t) => t.dueDate && new Date(t.dueDate) < today).length;
    return { ...u, open: open.length, late };
  }).sort((a, b) => b.late - a.late || b.open - a.open);
  const max = Math.max(1, ...rows.map((r) => r.open));

  return (
    <div className="text-left max-w-[800px]" id="team-root">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-sub">{users.length} members · open work per person</p>
        </div>
        {can("manageMembers") && <Link to="/settings/members" className="btn btn-secondary ml-auto"><UserPlus className="w-4 h-4" /> Invite</Link>}
      </div>
      <div className="card">
        {rows.map((u) => (
          <Link key={u.id} to={`/my-tasks?scope=all&assignee=${u.id}`} className="flex items-center gap-3 h-12 px-3 border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
            <UserAvatar user={u} size="sm" />
            <span className="w-[180px] min-w-0">
              <span className="block text-[13px] font-bold truncate">{u.name}</span>
              <span className="block text-[11px] text-zinc-400 truncate">{u.role}</span>
            </span>
            <span className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden hidden sm:block">
              <span className={`block h-full rounded-full ${u.late ? "bg-rose-500" : "bg-primary"}`} style={{ width: `${(u.open / max) * 100}%` }} />
            </span>
            <span className="text-xs font-semibold font-tnum w-16 text-right">{u.open} open</span>
            <span className={`text-xs font-bold font-tnum w-20 text-right ${u.late ? "text-rose-700 dark:text-rose-400" : "text-zinc-400"}`}>{u.late ? `${u.late} overdue` : "—"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
