/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldAlert, Archive, Trash2, LogOut } from "lucide-react";

export function WorkspaceDangerZone({
  ws,
  setError,
  setShowArchiveConfirm,
  setShowDeleteConfirm,
  canArchive,
  canDelete,
  currentRole,
  handleLeaveWorkspace
}) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const isOwner = currentRole === "Owner";
  const hasDangerActions = canArchive || canDelete;

  // Nothing to render: no archive/delete rights and no leave option (Owners must transfer first,
  // but Owners always have both rights — this guard covers unexpected states).
  if (!hasDangerActions && isOwner) return null;

  return (
    <div className="card border-rose-200/70 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/10 p-3 sm:p-4 text-left space-y-2.5 sm:space-y-3" id="ws-safety-hazard-zone">
      <h3 className="font-display font-semibold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
        <ShieldAlert className="w-4 h-4" />
        Danger zone
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
        {hasDangerActions
          ? "Archiving hides this workspace from active selectors and can be undone. Deleting is permanent."
          : "Leaving removes your access to this workspace's projects and tasks."}
      </p>

      <div className="space-y-2 pt-1">

        {/* Archive Trigger Button */}
        {canArchive && (
          <button
            type="button"
            onClick={() => { setError(""); setShowArchiveConfirm(true); }}
            className="btn btn-secondary w-full text-amber-700 dark:text-amber-400"
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span className="truncate">Archive '{ws.name}'</span>
          </button>
        )}

        {/* Permanently Delete Trigger Button */}
        {canDelete && (
          <button
            type="button"
            onClick={() => { setError(""); setShowDeleteConfirm(true); }}
            className="btn btn-danger w-full"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Delete workspace</span>
          </button>
        )}

        {/* Leave workspace — non-Owners only, with inline confirm */}
        {!isOwner && (
          <div className={hasDangerActions ? "pt-2 border-t border-rose-200/60 dark:border-rose-900/40 space-y-2" : "space-y-2"} id="ws-leave-section">
            {!showLeaveConfirm ? (
              <button
                type="button"
                onClick={() => { setError(""); setShowLeaveConfirm(true); }}
                className="btn btn-danger-soft w-full"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="truncate">Leave workspace</span>
              </button>
            ) : (
              <div className="space-y-2" id="ws-leave-confirm">
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
                  Leave '{ws.name}'? You'll lose access to its projects and tasks.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveConfirm(false)}
                    className="btn btn-sm btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowLeaveConfirm(false); handleLeaveWorkspace(); }}
                    className="btn btn-sm btn-danger flex-1"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Owners can't leave until ownership is handed over */}
        {isOwner && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pt-1">
            To leave, first transfer ownership.
          </p>
        )}
      </div>
    </div>
  );
}
