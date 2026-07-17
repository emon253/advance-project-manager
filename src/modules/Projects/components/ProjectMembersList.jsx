/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { UserPlus, X } from "lucide-react";

export function ProjectMembersList({ project, users, updateProject }) {
  // If the project doesn't have members array, fallback to default behavior
  const projectMemberIds = project?.members || [];
  const projectMembers = users.filter((u) => projectMemberIds.includes(u.id));
  const nonMembers = users.filter((u) => !projectMemberIds.includes(u.id));

  const handleAddMember = (memberId) => {
    if (!memberId) return;
    const updatedMembers = [...projectMemberIds, memberId];
    updateProject(project.id, { members: updatedMembers });
  };

  const handleRemoveMember = (memberId) => {
    if (projectMemberIds.length <= 1) {
      alert("A project must have at least one team member.");
      return;
    }
    const updatedMembers = projectMemberIds.filter((id) => id !== memberId);
    updateProject(project.id, { members: updatedMembers });
  };

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Project Team (<span className="font-tnum">{projectMembers.length}</span>)
        </p>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 sm:divide-y-0 sm:space-y-1">
        {projectMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-2.5 group min-h-10 py-1 sm:py-0 px-1 rounded-none sm:rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar user={member} size="sm" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-200 truncate leading-tight">{member.name}</p>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{member.role}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRemoveMember(member.id)}
              className="btn-icon text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 transition-all"
              title={`Remove ${member.name} from project`}
              aria-label={`Remove ${member.name} from project`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {nonMembers.length > 0 && (
        <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
          <label htmlFor="project-add-member-select" className="label flex items-center gap-1.5 text-left">
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            Add Project Member
          </label>
          <select
            id="project-add-member-select"
            value=""
            onChange={(e) => handleAddMember(e.target.value)}
            className="field"
          >
            <option value="" disabled>+ Add team member to project...</option>
            {nonMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
