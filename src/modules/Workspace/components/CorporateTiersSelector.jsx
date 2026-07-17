/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Briefcase, RefreshCw } from "lucide-react";
import { getIconComponent } from "../../../components/common/IconHelper";

export function CorporateTiersSelector({
  ws,
  activeWorkspaces,
  archivedWorkspaces,
  handleQuickSwitch,
  handleRestoreWorkspace
}) {
  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-3" id="ws-switcher-settings-box">
      <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-primary" />
        Switch workspace
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Switch the active workspace or restore an archived one.</p>

      <div className="space-y-2" id="ws-quick-switcher-list">
        <span className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Active</span>
        {activeWorkspaces.map((w) => (
          <button
            key={w.id}
            onClick={() => handleQuickSwitch(w.id)}
            type="button"
            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors text-left cursor-pointer ${
              w.id === ws.id
                ? "bg-primary/8 dark:bg-primary/15 border-primary/25 ring-1 ring-primary/15"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-primary/8 dark:bg-primary/15 text-primary flex items-center justify-center shrink-0 select-none">
                {getIconComponent(w.logo, "w-4 h-4")}
              </span>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 block truncate">{w.name}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">
                  {(w.members || []).length} members
                </span>
              </div>
            </div>
            {w.id === ws.id && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </button>
        ))}

        {archivedWorkspaces.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wide mt-1">Archived</span>
            {archivedWorkspaces.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg dark:bg-zinc-800/40 dark:border-zinc-800 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-400 dark:text-zinc-500 shrink-0 select-none">
                    {getIconComponent(w.logo, "w-4 h-4")}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block truncate line-through">{w.name}</span>
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500 block uppercase tracking-wide">Archived</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreWorkspace(w.id)}
                  className="btn btn-sm text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
