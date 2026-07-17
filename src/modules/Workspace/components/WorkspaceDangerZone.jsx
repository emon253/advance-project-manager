/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert, Archive, Trash2 } from "lucide-react";

export function WorkspaceDangerZone({
  ws,
  setError,
  setShowArchiveConfirm,
  setShowDeleteConfirm
}) {
  return (
    <div className="card border-rose-200/70 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/10 p-3 sm:p-4 text-left space-y-2.5 sm:space-y-3" id="ws-safety-hazard-zone">
      <h3 className="font-display font-semibold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
        <ShieldAlert className="w-4 h-4" />
        Danger zone
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
        Archiving hides this workspace from active selectors and can be undone. Deleting is permanent.
      </p>

      <div className="space-y-2 pt-1">

        {/* Archive Trigger Button */}
        <button
          type="button"
          onClick={() => { setError(""); setShowArchiveConfirm(true); }}
          className="btn btn-secondary w-full text-amber-700 dark:text-amber-400"
        >
          <Archive className="w-4 h-4 shrink-0" />
          <span className="truncate">Archive '{ws.name}'</span>
        </button>

        {/* Permanently Delete Trigger Button */}
        <button
          type="button"
          onClick={() => { setError(""); setShowDeleteConfirm(true); }}
          className="btn btn-danger w-full"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>Delete workspace</span>
        </button>
      </div>
    </div>
  );
}
