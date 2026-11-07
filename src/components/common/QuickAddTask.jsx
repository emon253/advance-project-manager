/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useAppState } from "../../app/providers";
import { X, ChevronDown } from "lucide-react";
import { defaultStatusName } from "../../modules/Tasks/util/tasksUtils";

/**
 * One way to add a task from anywhere: a title, Enter, done. Project defaults
 * to the one you're looking at (or the first). Everything else is set in the
 * task panel afterwards, which opens on the new task.
 */
export function QuickAddTask({ isOpen, onClose, defaultProjectId }) {
  const { activeWorkspaceProjects, addTask, can, taskStatuses, setActiveTaskId } = useAppState();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);

  const activeProjects = activeWorkspaceProjects.filter((p) => p.status !== "Archived");
  useEffect(() => {
    if (isOpen) setProjectId(String(defaultProjectId || activeProjects[0]?.id || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultProjectId]);

  if (!isOpen || !can("editTasks")) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !projectId || busy) return;
    setBusy(true);
    const created = await addTask({ title: title.trim(), projectId: Number(projectId), status: defaultStatusName(taskStatuses), priority: "Medium" });
    setBusy(false);
    if (created) {
      setTitle("");
      onClose();
      setActiveTaskId(created.id);
    }
  };

  return (
    <div className="modal-overlay" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <form onSubmit={submit} className="modal-panel sm:max-w-md" role="dialog" aria-modal="true" aria-label="New task">
        <div className="sheet-grabber" />
        <div className="flex items-center justify-between px-4 h-11 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-[13px] font-bold text-zinc-900 dark:text-white">New task</h2>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          <input
            type="text"
            autoFocus
            required
            maxLength={500}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Task title"
            className="field h-9 text-sm"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="qa-project" className="text-xs font-semibold text-zinc-500">Project</label>
            <div className="relative flex-1">
              <select id="qa-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="field h-[30px] text-xs font-semibold">
                {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">Press Enter to add. Assignee, due date and details come next in the task panel.</p>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 sm:flex-none">Cancel</button>
          <button type="submit" disabled={!title.trim() || !projectId || busy} className="btn btn-primary flex-1 sm:flex-none sm:ml-auto">Add task</button>
        </div>
      </form>
    </div>
  );
}
