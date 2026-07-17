/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RefreshCw } from "lucide-react";

export function DatabaseRestorePanel({ resetToDefaultData, setSystemAlertMessage }) {
  const handleReset = () => {
    resetToDefaultData();
    setSystemAlertMessage("Demo workspaces, projects, and tasks were restored successfully.");
    setTimeout(() => setSystemAlertMessage(""), 4500);
  };

  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-3">
      <h3 className="font-display font-semibold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Restore demo database
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
        If your browser's local state contains cached tasks from a previous session, some newer mock data might not show up. Reset here to wipe the outdated cache and re-populate the demo database with its original contents.
      </p>
      <button
        onClick={handleReset}
        type="button"
        className="btn btn-danger"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Reset and restore mock data</span>
      </button>
    </div>
  );
}
