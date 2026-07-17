/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Users, UserPlus, Shield } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";

export function WorkspaceOccupantsMatrix({
  currentMembers,
  currentUser,
  setError,
  setShowInviteModal,
  handleChangeMemberRole,
  handleRemoveMember
}) {
  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4" id="ws-members-management-card">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Members ({currentMembers.length})
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">People who can access, manage, or view work in this workspace.</p>
        </div>

        <button
          type="button"
          onClick={() => { setError(""); setShowInviteModal(true); }}
          className="btn btn-sm btn-primary self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>Invite member</span>
        </button>
      </div>

      {currentMembers.length === 0 ? (
        <div className="py-8 text-center px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl" id="ws-empty-members">
          <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2 shrink-0 select-none" />
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No members yet</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Use the invite button to add your team members.</p>
        </div>
      ) : (
        // Stacked cards on mobile, single-line rows on >=sm — no wide table.
        <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800" id="ws-members-list-table">
          {currentMembers.map((member) => (
            <div key={member.id} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 px-3 py-2.5 sm:p-3.5 sm:items-center sm:justify-between hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar user={member} size="xs" />
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{member.name}</span>
                    {member.id === currentUser?.id && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold border border-zinc-200/60 dark:border-zinc-700 uppercase tracking-wide">You</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate font-medium">{member.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">

                {/* Access Role dropdown select picker */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <select
                    value={member.role || "Member"}
                    onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                    disabled={member.id === currentUser?.id && member.role === "Owner"}
                    aria-label={`Role for ${member.name}`}
                    className="field w-auto text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={member.role === "Owner" || member.id === currentUser?.id}
                  className="btn btn-sm btn-danger-soft"
                  title="Remove member from workspace"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
