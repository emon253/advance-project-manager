/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Plus, Archive, Trash2, AlertTriangle } from "lucide-react";

export function ProjectAdminControls({
  project,
  updateProject,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDeleteProject
}) {
  return (
    <div className="card p-3 sm:p-4 text-left space-y-4 sm:space-y-6">
      <div>
        <h3 className="font-display font-semibold text-zinc-900 dark:text-white text-sm sm:text-base">Project Visibility</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Archive the project to hide it from your primary portfolio displays. You can undo this any time.</p>
      </div>

      {project.status === "Archived" ? (
        <button
          onClick={() => updateProject(project.id, { status: "Active" })}
          className="btn btn-secondary"
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>Restore Project to Active</span>
        </button>
      ) : (
        <button
          onClick={() => updateProject(project.id, { status: "Archived" })}
          className="btn btn-secondary"
          type="button"
        >
          <Archive className="w-4 h-4" />
          <span>Archive Project</span>
        </button>
      )}

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 sm:pt-6">
        <h3 className="font-display font-semibold text-rose-600 dark:text-rose-400 text-sm sm:text-base">Danger Zone</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Removing this project will permanently delete all associated tasks, commentaries, logs and metadata.</p>
      </div>

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          type="button"
          className="btn btn-danger-soft"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete project</span>
        </button>
      ) : (
        <div className="p-3 sm:p-4 border border-rose-300 dark:border-rose-500/30 rounded-xl bg-rose-50/50 dark:bg-rose-500/10 space-y-2.5 sm:space-y-3">
          <p className="text-sm text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Are you absolutely certain? This operation cannot be undone.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              type="button"
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProject}
              type="button"
              className="btn btn-danger"
            >
              Delete project permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
