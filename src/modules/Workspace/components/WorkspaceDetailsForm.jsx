/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sliders, Save } from "lucide-react";
import { ICON_OPTIONS, getIconComponent } from "../../../components/common/IconHelper";

export function WorkspaceDetailsForm({
  ws,
  wsLogo,
  setWsLogo,
  wsName,
  setWsName,
  wsDescription,
  setWsDescription,
  handleUpdateDetails
}) {
  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4" id="ws-details-form-card">
      <div className="flex justify-between items-center pb-2.5 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          Workspace details
        </h3>
        <span className="text-[10px] font-mono font-tnum bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md select-none">{ws.id}</span>
      </div>

      <form onSubmit={handleUpdateDetails} className="space-y-2.5 sm:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">

          {/* Visual Emblem Picker */}
          <div>
            <span className="label">Logo</span>
            <div className="flex flex-col gap-2">
              <div className="h-12 w-12 rounded-lg bg-primary/8 dark:bg-primary/15 text-primary flex items-center justify-center shrink-0 select-none">
                {getIconComponent(wsLogo, "w-5 h-5")}
              </div>
              <div
                role="radiogroup"
                aria-label="Workspace logo"
                className="flex flex-wrap gap-1 bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 select-none"
              >
                {ICON_OPTIONS.map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setWsLogo(key)}
                    role="radio"
                    aria-checked={wsLogo === key}
                    title={label}
                    aria-label={`Use ${label} as logo`}
                    className={`w-8 h-8 flex items-center justify-center rounded-md border shrink-0 cursor-pointer transition-colors ${
                      wsLogo === key
                        ? "bg-primary/8 border-primary/40 text-primary"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name and description Inputs */}
          <div className="md:col-span-2 space-y-2.5 sm:space-y-4">
            <div>
              <label className="label" htmlFor="ws-details-name">Workspace name</label>
              <input
                id="ws-details-name"
                type="text"
                required
                placeholder="e.g. Carbarn Sales Team"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label className="label" htmlFor="ws-details-desc">Description</label>
              <textarea
                id="ws-details-desc"
                rows={2}
                placeholder="Describe the workspace activities, objectives, or scope..."
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                className="field"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button type="submit" className="btn btn-primary">
            <Save className="w-4 h-4 shrink-0" />
            <span>Save changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
