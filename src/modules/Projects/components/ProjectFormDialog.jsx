/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X } from "lucide-react";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { ICON_OPTIONS } from "../../../components/common/IconHelper";

export function ProjectFormDialog({
  handleCreateProject,
  newProjName,
  setNewProjName,
  newProjIcon,
  setNewProjIcon,
  newProjDesc,
  setNewProjDesc,
  newProjColor,
  setNewProjColor,
  newProjDeadline,
  setNewProjDeadline,
  setShowAddForm
}) {
  return (
    <div className="modal-overlay" id="project-form-modal-container" onClick={() => setShowAddForm(false)}>
      <div
        className="modal-panel max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" />
        <form onSubmit={handleCreateProject} className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <h3 id="project-form-dialog-title" className="font-display font-semibold text-base text-zinc-900 dark:text-white">
              New Project
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-icon"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="new-project-name" className="label mb-0">Project Name *</label>
                <AIEnhanceButton value={newProjName} onEnhance={setNewProjName} type="title" />
              </div>
              <input
                id="new-project-name"
                type="text"
                required
                placeholder="e.g. Sales Invoice Syncing API"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                className="field mt-1.5"
              />
            </div>

            <div>
              <span className="label" id="new-project-icon-label">Icon</span>
              <div
                role="radiogroup"
                aria-labelledby="new-project-icon-label"
                className="flex flex-wrap gap-1.5"
              >
                {ICON_OPTIONS.map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={newProjIcon === key}
                    title={label}
                    aria-label={label}
                    onClick={() => setNewProjIcon(key)}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                      newProjIcon === key
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
              <div className="flex items-center justify-between">
                <label htmlFor="new-project-brief" className="label mb-0">Project Brief</label>
                <AIEnhanceButton value={newProjDesc} onEnhance={setNewProjDesc} type="description" />
              </div>
              <textarea
                id="new-project-brief"
                placeholder="Outline high-level parameters or criteria..."
                rows={3}
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="field mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="label">Accent Color</span>
                <div className="flex items-center gap-1.5 h-9" role="radiogroup" aria-label="Accent color">
                  {["#533afd", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={newProjColor === c}
                      aria-label={`Color ${c}`}
                      onClick={() => setNewProjColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-6 w-6 rounded-full cursor-pointer transition-all ${
                        newProjColor === c
                          ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-500 dark:ring-offset-zinc-900"
                          : "hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="new-project-deadline" className="label">Deadline</label>
                <input
                  id="new-project-deadline"
                  type="date"
                  value={newProjDeadline}
                  onChange={(e) => setNewProjDeadline(e.target.value)}
                  className="field"
                />
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="flex items-center justify-end gap-2 px-5 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1 sm:flex-none">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
