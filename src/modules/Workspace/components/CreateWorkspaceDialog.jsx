/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X } from "lucide-react";
import { ICON_OPTIONS } from "../../../components/common/IconHelper";

export function CreateWorkspaceDialog({
  handleCreateWorkspace,
  newWsName,
  setNewWsName,
  newWsLogo,
  setNewWsLogo,
  newWsDesc,
  setNewWsDesc,
  setShowCreateModal
}) {
  return (
    <div className="modal-overlay animate-in fade-in duration-150" id="ws-provision-dialog">
      <div
        className="modal-panel sm:max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ws-provision-dialog-title"
      >
        <div className="sheet-grabber" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 id="ws-provision-dialog-title" className="text-sm font-semibold text-zinc-900 dark:text-white">
            Create workspace
          </h3>
          <button
            onClick={() => setShowCreateModal(false)}
            type="button"
            className="btn-icon"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateWorkspace} className="flex flex-col flex-1 min-h-0 text-left">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-4">
            <div>
              <span className="label">Logo</span>
              <div
                role="radiogroup"
                aria-label="Workspace logo"
                className="flex flex-wrap gap-1 bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                {ICON_OPTIONS.map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewWsLogo(key)}
                    role="radio"
                    aria-checked={newWsLogo === key}
                    title={label}
                    aria-label={`Use ${label} as logo`}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border shrink-0 cursor-pointer transition-colors ${
                      newWsLogo === key
                        ? "bg-primary/8 border-primary/40 text-primary"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="new-ws-name">Workspace name</label>
              <input
                id="new-ws-name"
                type="text"
                required
                placeholder="e.g. Innovate Corp"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="label" htmlFor="new-ws-desc">Description</label>
              <textarea
                id="new-ws-desc"
                rows={2}
                placeholder="Summarize the core focus of this workspace..."
                value={newWsDesc}
                onChange={(e) => setNewWsDesc(e.target.value)}
                className="field"
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="flex gap-2 px-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Create workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
