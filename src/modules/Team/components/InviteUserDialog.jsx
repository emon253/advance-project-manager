/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Mail, X } from "lucide-react";

export function InviteUserDialog({
  handleInviteUser,
  inviteName,
  setInviteName,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  setShowInviteForm
}) {
  return (
    <div className="modal-overlay" id="team-invite-modal-container">
      <div className="modal-panel sm:max-w-md" role="dialog" aria-modal="true" aria-labelledby="team-invite-title">
        <div className="sheet-grabber" />

        <form onSubmit={handleInviteUser} className="flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 id="team-invite-title" className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-primary" />
              Invite Associate
            </h3>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="btn-icon"
              aria-label="Close invite dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label htmlFor="invite-full-name" className="label">Full Name</label>
                <input
                  id="invite-full-name"
                  type="text"
                  required
                  placeholder="e.g. Salim Al Mamun"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="invite-email" className="label">Email Address</label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="developer@corp.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="invite-role" className="label">Role</label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="field"
              >
                <option value="Lead Architect">Lead Architect</option>
                <option value="Designer">UI/UX Designer</option>
                <option value="Developer">Systems Developer</option>
                <option value="Manager">Product Scrum Manager</option>
                <option value="Analyst">Business Security Analyst</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 sm:px-5 pt-3 sm:pt-3.5 border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
