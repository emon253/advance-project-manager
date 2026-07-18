/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserPlus, X, Archive, AlertTriangle } from "lucide-react";

export function WorkspaceSettingsModals({
  ws,
  showInviteModal,
  setShowInviteModal,
  inviteName,
  setInviteName,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteError,
  handleInviteMember,
  showArchiveConfirm,
  setShowArchiveConfirm,
  handleArchiveWorkspace,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDeleteWorkspace
}) {
  return (
    <>
      {/* MODAL 1: Invite member mock popup dialog */}
      {showInviteModal && (
        <div className="modal-overlay animate-in fade-in duration-150" id="ws-invite-popup">
          <div
            className="modal-panel sm:max-w-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-invite-title"
          >
            <div className="sheet-grabber" />

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 id="ws-invite-title" className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Invite member
              </h3>
              <button onClick={() => setShowInviteModal(false)} type="button" className="btn-icon" aria-label="Close dialog">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="flex flex-col flex-1 min-h-0 text-left">
              <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-4">
                <div>
                  <label className="label" htmlFor="ws-invite-email">Email address</label>
                  <input
                    id="ws-invite-email"
                    type="email"
                    required
                    placeholder="rachel@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="field"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="ws-invite-role">Role</label>
                  <select
                    id="ws-invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="field"
                  >
                    <option value="Admin">Admin (Full Access & Settings)</option>
                    <option value="Manager">Manager (Track & Edit Projects)</option>
                    <option value="Member">Member (Task Assignment & Edits)</option>
                    <option value="Viewer">Viewer (Read-Only Access)</option>
                  </select>
                </div>

                {/* Inline invitation error (dedupe, seat limits, validation) */}
                {inviteError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 animate-in fade-in" id="ws-invite-inline-error">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 px-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Archive confirmation popup */}
      {showArchiveConfirm && (
        <div className="modal-overlay animate-in fade-in duration-150" id="ws-archive-modal">
          <div
            className="modal-panel sm:max-w-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-archive-title"
          >
            <div className="sheet-grabber" />

            <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="flex items-start gap-3 text-left">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100 dark:border-amber-500/20 select-none">
                  <Archive className="w-5 h-5 shrink-0" />
                </div>
                <div className="space-y-1">
                  <h4 id="ws-archive-title" className="font-semibold text-sm text-zinc-900 dark:text-white">Archive workspace?</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    You are archiving <strong>'{ws.name}'</strong>. This removes it from active selectors. All files, tasks, and project states will remain preserved and can be restored anytime.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                No, keep it
              </button>
              <button
                type="button"
                onClick={handleArchiveWorkspace}
                className="btn flex-1 text-white bg-amber-600 hover:bg-amber-700"
              >
                Yes, archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete workspace confirmation popup */}
      {showDeleteConfirm && (
        <div className="modal-overlay animate-in fade-in duration-150" id="ws-delete-modal">
          <div
            className="modal-panel sm:max-w-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-delete-title"
          >
            <div className="sheet-grabber" />

            <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="flex items-start gap-3 text-left">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg shrink-0 border border-rose-100 dark:border-rose-500/20 select-none">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                </div>
                <div className="space-y-1">
                  <h4 id="ws-delete-title" className="font-semibold text-sm text-rose-600 dark:text-rose-400">Delete workspace permanently?</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    You are permanently deleting <strong>'{ws.name}'</strong>. Associated projects, boards, activity records, and checklists will be permanently destroyed. This operation cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                className="btn btn-danger flex-1"
              >
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
