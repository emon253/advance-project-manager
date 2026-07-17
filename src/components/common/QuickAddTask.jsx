/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../app/providers";
import { X } from "lucide-react";
import { AIEnhanceButton } from "./AIEnhanceButton";

export function QuickAddTask({ isOpen, onClose }) {
  const {
    activeWorkspaceProjects,
    users,
    addTask,
    tags
  } = useAppState();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(activeWorkspaceProjects[0]?.id || "");
  const [priority, setPriority] = useState("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [selectedTags, setSelectedTags] = useState([]);

  React.useEffect(() => {
    if (projectId) {
      const proj = activeWorkspaceProjects.find((p) => p.id === projectId);
      if (proj && proj.members && assigneeId && !proj.members.includes(assigneeId)) {
        setAssigneeId("");
      }
    }
  }, [projectId, activeWorkspaceProjects, assigneeId]);

  if (!isOpen) return null;

  const selectedProject = activeWorkspaceProjects.find((p) => p.id === projectId);
  const projectMembers = selectedProject && selectedProject.members
    ? users.filter((u) => selectedProject.members.includes(u.id))
    : users;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      description,
      projectId,
      priority,
      assigneeId: assigneeId || null,
      dueDate: new Date(dueDate).toISOString(),
      tags: selectedTags,
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setProjectId(activeWorkspaceProjects[0]?.id || "");
    setPriority("Medium");
    setAssigneeId("");
    setSelectedTags([]);
    onClose();
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="modal-panel sm:max-w-lg" role="dialog" aria-modal="true" aria-label="Quick add task">
        <div className="sheet-grabber" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h2 className="font-display font-semibold text-zinc-900 dark:text-white text-base">New Task</h2>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="qat-title" className="label mb-0">Task title *</label>
                <AIEnhanceButton value={title} onEnhance={setTitle} type="title" />
              </div>
              <input
                id="qat-title"
                type="text"
                required
                autoFocus
                placeholder="e.g. Design mobile task card layout"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field mt-1.5"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="qat-desc" className="label mb-0">Description</label>
                <AIEnhanceButton value={description} onEnhance={setDescription} type="description" />
              </div>
              <textarea
                id="qat-desc"
                placeholder="What needs to be delivered?"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <div>
                <label htmlFor="qat-project" className="label">Project</label>
                <select id="qat-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="field">
                  {activeWorkspaceProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="qat-priority" className="label">Priority</label>
                <select id="qat-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="field">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="qat-assignee" className="label">Assign to</label>
                <select id="qat-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="field">
                  <option value="">Unassigned</option>
                  {projectMembers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="qat-due" className="label">Due date</label>
                <input id="qat-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" />
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <label className="label">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                          isSelected
                            ? `${tag.color} ring-2 ring-primary/40`
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()} className="btn btn-primary flex-1">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
