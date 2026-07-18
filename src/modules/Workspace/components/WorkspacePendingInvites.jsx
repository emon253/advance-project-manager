/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MailOpen, Link2, Check, Send, Trash2 } from "lucide-react";

export function WorkspacePendingInvites({ pendingInvites, revokeInvite, resendInvite }) {
  const [copiedId, setCopiedId] = useState(null);
  const [resentId, setResentId] = useState(null);

  const handleCopyLink = (invite) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId((prev) => (prev === invite.id ? null : prev)), 2000);
  };

  const handleResend = (invite) => {
    resendInvite(invite.id);
    setResentId(invite.id);
    setTimeout(() => setResentId((prev) => (prev === invite.id ? null : prev)), 2000);
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4" id="ws-pending-invites-card">
      <div className="pb-2.5 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
          <MailOpen className="w-4 h-4 text-primary" />
          Pending invites ({pendingInvites.length})
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
          Invitations awaiting acceptance. Invitees join once they open their link.
        </p>
      </div>

      {pendingInvites.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium" id="ws-no-pending-invites">
          No pending invitations right now.
        </p>
      ) : (
        <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800" id="ws-pending-invites-list">
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-3 py-2.5 sm:p-3.5 sm:items-center sm:justify-between hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{invite.email}</span>
                  <span className="badge text-primary bg-primary/8 dark:bg-primary/15 border-primary/20 shrink-0">
                    {invite.role}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate font-medium mt-0.5">
                  Invited by {invite.invitedBy} · {formatDate(invite.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Copy shareable invite link */}
                <button
                  type="button"
                  onClick={() => handleCopyLink(invite)}
                  className="btn btn-sm btn-ghost"
                  title="Copy invitation link"
                >
                  {copiedId === invite.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{copiedId === invite.id ? "Copied" : "Copy link"}</span>
                </button>

                {/* Re-send the invitation email */}
                <button
                  type="button"
                  onClick={() => handleResend(invite)}
                  className="btn btn-sm btn-ghost"
                  title="Re-send invitation"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>{resentId === invite.id ? "Sent" : "Resend"}</span>
                </button>

                {/* Revoke the pending invitation */}
                <button
                  type="button"
                  onClick={() => revokeInvite(invite.id)}
                  className="btn btn-sm btn-danger-soft px-2"
                  title="Revoke invitation"
                  aria-label={`Revoke invitation for ${invite.email}`}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
