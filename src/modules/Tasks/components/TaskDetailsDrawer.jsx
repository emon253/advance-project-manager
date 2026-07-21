/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "../../../app/providers";
import { PriorityBadge } from "../../../components/common/PriorityBadge";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { UserAvatar } from "../../../components/common/UserAvatar";
import {
  X,
  Calendar,
  Users,
  Trash2,
  Paperclip,
  Plus,
  Send,
  AlertTriangle,
  PlaySquare,
  Eye,
  Download,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { formatDateTime } from "../util/tasksUtils";

const isImageType = (t) => {
  const type = (t || "").toLowerCase();
  return type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(type);
};
const isPdfType = (t) => (t || "").toLowerCase().includes("pdf");
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { TaskChecklist } from "./TaskChecklist";

export function TaskDetailsDrawer() {
  const {
    activeTaskId,
    setActiveTaskId,
    tasks,
    updateTask,
    deleteTask,
    users,
    activeWorkspaceProjects,
    theme,
    taskStatuses,
    // Timer controls
    activeTimerTaskId,
    timerSeconds,
    toggleTaskTimer,
    addManualTime,
    addComment,
    attachFile,
    removeAttachment,
    downloadAttachment,
    getAttachmentBlobUrl,
    duplicateTask,
    can
  } = useAppState();

  const [commentInput, setCommentInput] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // Trello-style editing (findings #11/#13): title & description are LOCAL
  // drafts committed on blur/Enter — never an API write per keystroke.
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const titleInputRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  const task = tasks.find((t) => t.id === activeTaskId);

  useEffect(() => {
    if (task && !editingTitle) setTitleDraft(task.title || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.title]);
  useEffect(() => {
    if (task) setDescDraft(task.description || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);
  // Auto-grow the title textarea to its content (2–3 line wrap, finding #13).
  useEffect(() => {
    const el = titleInputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [titleDraft, editingTitle]);

  // Auto-scroll logic or state reset on transition
  useEffect(() => {
    setCommentInput("");
    setManualHours("");
    setEditingTitle(false);
  }, [activeTaskId]);

  if (!task) return null;

  const canEdit = can("editTasks");
  const project = activeWorkspaceProjects.find((p) => p.id === task.projectId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const projectMembers = project && project.members
    ? users.filter((u) => project.members.includes(u.id) || u.id === task.assigneeId)
    : users;

  // Live timer calculations
  const isTimerActive = activeTimerTaskId === task.id;
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTextChange = (field, val) => {
    updateTask(task.id, { [field]: val });
  };

  const commitTitle = () => {
    setEditingTitle(false);
    const value = titleDraft.trim();
    if (!value || value === task.title) {
      setTitleDraft(task.title || "");
      return;
    }
    updateTask(task.id, { title: value });
  };

  const commitDescription = () => {
    if ((descDraft || "") !== (task.description || "")) {
      updateTask(task.id, { description: descDraft });
    }
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(task.id, commentInput.trim());
    setCommentInput("");
  };

  const handleRealFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Server caps uploads at 10MB (400 VALIDATION beyond it).
    const limit = 10 * 1024 * 1024;
    if (file.size > limit) {
      setErrorMsg("File is larger than the 10MB upload limit. Please choose a smaller file.");
      setTimeout(() => setErrorMsg(""), 6000);
      return;
    }

    attachFile(task.id, file);
    e.target.value = ""; // reset
  };

  /** Compact label for the meta line: extension, else MIME subtype ("JPEG", "PDF"). */
  const shortFileType = (file) => {
    const ext = file.name?.includes(".") ? file.name.split(".").pop() : null;
    if (ext && ext.length <= 5) return ext.toUpperCase();
    const sub = (file.type || "").split("/").pop();
    return sub ? sub.toUpperCase().slice(0, 6) : "FILE";
  };

  const handleDownloadFile = (file) => {
    if (!file.base64) {
      downloadAttachment(file);
      return;
    }
    const a = document.createElement("a");
    a.href = file.base64;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteSelf = () => {
    deleteTask(task.id);
    setActiveTaskId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/40 dark:bg-zinc-950/70 backdrop-blur-[2px] animate-in fade-in duration-150">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={() => setActiveTaskId(null)} />

      {/* Drawer shell — full-screen bottom sheet on mobile, right-side panel on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className="absolute inset-0 lg:inset-y-0 lg:right-0 lg:left-auto w-full lg:max-w-xl bg-white dark:bg-zinc-950 lg:border-l lg:border-zinc-200 lg:dark:border-zinc-800 shadow-elevated flex flex-col pt-safe lg:pt-0 animate-in slide-in-from-bottom lg:slide-in-from-bottom-0 lg:slide-in-from-right duration-250"
      >

        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 px-4 lg:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: project?.color || "#cbd5e1" }}
              title={project?.name}
            />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 truncate">
              {project?.name || "Unassigned Project"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTaskId(null)}
            className="btn-icon"
            aria-label="Close task details"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-3 sm:py-4 space-y-3 sm:space-y-5 text-left">

          {/* Read-only notice for Viewers */}
          {!canEdit && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
              <Eye className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                You have view-only access in this workspace
              </p>
            </div>
          )}

          {/* Editable Title — click to edit, wraps over multiple lines (findings #11/#13) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="task-title-input" className="label mb-0">Task Title</label>
              <AIEnhanceButton
                value={task.title}
                onEnhance={(val) => { setTitleDraft(val); handleTextChange("title", val); }}
                type="title"
              />
            </div>
            {editingTitle && canEdit ? (
              <textarea
                id="task-title-input"
                ref={titleInputRef}
                value={titleDraft}
                maxLength={500}
                rows={1}
                autoFocus
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
                  if (e.key === "Escape") { setTitleDraft(task.title || ""); setEditingTitle(false); }
                }}
                className="field text-base font-semibold font-display leading-snug resize-none overflow-hidden py-2"
                placeholder="Give task a brief clear title..."
              />
            ) : (
              <button
                type="button"
                onClick={() => canEdit && setEditingTitle(true)}
                className={`w-full text-left text-base font-semibold font-display leading-snug text-zinc-900 dark:text-white whitespace-pre-wrap break-words rounded-lg px-3 py-2 -mx-0.5 border border-transparent ${
                  canEdit ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700 cursor-text" : "cursor-default"
                }`}
                title={canEdit ? "Click to edit the title" : undefined}
              >
                {task.title}
              </button>
            )}
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              Created: {task.createdAt ? formatDateTime(task.createdAt) : formatDateTime(task.startDate)}
            </p>
          </div>

          {/* Status / Priority / Assignee / Due Date grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
            <div>
              <label htmlFor="task-status-select" className="label flex items-center gap-1">
                <PlaySquare className="w-3 h-3 text-primary" />
                Status
              </label>
              <select
                id="task-status-select"
                value={task.status}
                onChange={(e) => handleTextChange("status", e.target.value)}
                className="field text-xs font-semibold"
              >
                {taskStatuses?.map((s) => (
                  <option key={s.id} value={s.name} className="dark:bg-zinc-950">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-priority-select" className="label flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-primary" />
                Priority
              </label>
              <select
                id="task-priority-select"
                value={task.priority}
                onChange={(e) => handleTextChange("priority", e.target.value)}
                className="field text-xs font-semibold"
              >
                <option value="Low" className="dark:bg-zinc-950">Low</option>
                <option value="Medium" className="dark:bg-zinc-950">Medium</option>
                <option value="High" className="dark:bg-zinc-950">High</option>
                <option value="Urgent" className="dark:bg-zinc-950">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-assignee-select" className="label flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                Assignee
              </label>
              <select
                id="task-assignee-select"
                value={task.assigneeId || ""}
                onChange={(e) => handleTextChange("assigneeId", e.target.value || null)}
                className="field text-xs font-semibold"
              >
                <option value="" className="dark:bg-zinc-950">Unassigned</option>
                {projectMembers.map((u) => (
                  <option key={u.id} value={u.id} className="dark:bg-zinc-950">{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="label flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => handleTextChange("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="field text-xs font-semibold"
              />
            </div>
          </div>

          {/* Single-scroll sections (Trello card layout) — description,
              checklist, attachments, comments in one flow, no tabs. */}
          <div className="space-y-4 sm:space-y-5">

            {/* Description */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label htmlFor="task-description" className="label mb-0">Description</label>
                <AIEnhanceButton value={descDraft} onEnhance={(val) => { setDescDraft(val); handleTextChange("description", val); }} type="description" />
              </div>
              <textarea
                id="task-description"
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={commitDescription}
                placeholder="Add a description, requirements, or context for this task…"
                rows={4}
                className="field"
              />
            </div>

            {/* Checklist */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <TaskChecklist key={task.id} task={task} />
            </div>

            {/* Attachments */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <input type="file" ref={fileInputRef} onChange={handleRealFileUpload} className="hidden" />
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  Attachments
                </span>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm h-7 px-2.5 text-[11px]">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 mb-2 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg">
                  {errorMsg}
                </div>
              )}

              {(!task.attachments || task.attachments.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                  <Paperclip className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mb-1.5" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">No documents uploaded yet</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Any file type up to 10MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map((file) => {
                    const isImage = isImageType(file.type);
                    const isPDF = isPdfType(file.type);
                    return (
                      <div key={file.id} className="flex items-center p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs gap-2.5">
                        {isImage && file.base64 ? (
                          <img
                            src={file.base64}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover cursor-pointer hover:opacity-85 shrink-0 border border-zinc-200 dark:border-zinc-800"
                            onClick={() => setPreviewFile(file)}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            className="w-9 h-9 rounded-lg bg-primary/8 dark:bg-primary/15 text-primary flex items-center justify-center shrink-0"
                            aria-hidden="true"
                          >
                            {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                            {file.name}
                          </p>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                            {file.size} • {shortFileType(file)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(isImage || isPDF) && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (file.base64) {
                                  setPreviewFile(file);
                                  return;
                                }
                                const url = await getAttachmentBlobUrl(file);
                                if (url) setPreviewFile({ ...file, base64: url });
                              }}
                              className="btn-icon"
                              title="Preview"
                              aria-label={`Preview ${file.name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="btn-icon"
                            title="Download"
                            aria-label={`Download ${file.name}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttachment(task.id, file.id)}
                            className="btn-icon text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            title="Delete"
                            aria-label={`Delete ${file.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 block mb-2.5">Comments</span>
              <form onSubmit={handlePostComment} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Write a comment or tag @name…"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  aria-label="New comment"
                  className="field flex-1"
                />
                <AIEnhanceButton value={commentInput} onEnhance={setCommentInput} type="comment" />
                <button type="submit" className="btn btn-primary btn-sm shrink-0" aria-label="Post comment">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="space-y-2.5">
                {(!task.comments || task.comments.length === 0) ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">No comments on this task yet.</p>
                ) : (
                  task.comments.map((comm) => {
                    const commUser = users.find((u) => u.id === comm.userId);
                    return (
                      <div key={comm.id} className="flex gap-2.5 text-xs">
                        <UserAvatar user={commUser} size="xs" />
                        <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{commUser?.name || "Deleted user"}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">{formatDateTime(comm.timestamp)}</span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap">
                            {comm.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Sticky action bar */}
        <div className="flex items-center gap-2 px-4 lg:px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => {
                  const dup = duplicateTask(task.id);
                  if (dup) {
                    setActiveTaskId(dup.id);
                  }
                }}
                className="btn btn-secondary btn-sm"
                title="Duplicate task record"
              >
                <Plus className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={handleDeleteSelf}
                className="btn btn-danger-soft btn-sm"
                title="Delete this task record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setActiveTaskId(null)}
            className="btn btn-secondary btn-sm ml-auto"
          >
            Close
          </button>
        </div>

      </div>

      {/* Attachment Preview Modal */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          className="modal-overlay animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Attachment preview"
            className="modal-panel sm:max-w-2xl text-left"
          >
            <div className="sheet-grabber" />
            <div className="flex justify-between items-center gap-3 px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{previewFile.name}</h4>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="btn-icon"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-xl p-2 min-h-[300px]">
                {isImageType(previewFile.type) ? (
                  <img
                    src={previewFile.base64}
                    alt=""
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-soft"
                    referrerPolicy="no-referrer"
                  />
                ) : isPdfType(previewFile.type) ? (
                  <iframe
                    src={previewFile.base64}
                    className="w-full h-[60vh] rounded-lg border-0 bg-white"
                    title={previewFile.name}
                  />
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Preview not supported for this file type ({previewFile.type}). Please download to view.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(previewFile)}
                className="btn btn-primary btn-sm"
              >
                Download Original File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
