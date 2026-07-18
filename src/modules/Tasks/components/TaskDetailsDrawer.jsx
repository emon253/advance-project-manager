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
  Eye
} from "lucide-react";
import { formatDateTime } from "../util/tasksUtils";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";

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
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    duplicateTask,
    can
  } = useAppState();

  const [activeTab, setActiveTab] = useState("general"); // general, checklist, comments, advanced
  const [commentInput, setCommentInput] = useState("");
  const [inlineCLTitle, setInlineCLTitle] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  const task = tasks.find((t) => t.id === activeTaskId);

  // Auto-scroll logic or state reset on transition
  useEffect(() => {
    setCommentInput("");
    setInlineCLTitle("");
    setManualHours("");
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

  // Checklist computation
  const checklistItems = task.checklist || [];
  const completedCLCount = checklistItems.filter((i) => i.completed).length;
  const checklistProgress = checklistItems.length > 0
    ? Math.round((completedCLCount / checklistItems.length) * 100)
    : 0;

  const handleTextChange = (field, val) => {
    updateTask(task.id, { [field]: val });
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(task.id, commentInput.trim());
    setCommentInput("");
  };

  const handleAddCL = (e) => {
    e.preventDefault();
    if (!inlineCLTitle.trim()) return;
    addChecklistItem(task.id, inlineCLTitle.trim());
    setInlineCLTitle("");
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

          {/* Editable Title */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor="task-title-input" className="label mb-0">Task Title</label>
              <AIEnhanceButton value={task.title} onEnhance={(val) => handleTextChange("title", val)} type="title" />
            </div>
            <input
              id="task-title-input"
              type="text"
              value={task.title}
              onChange={(e) => handleTextChange("title", e.target.value)}
              className="field h-10 text-base font-semibold font-display"
              placeholder="Give task a brief clear title..."
            />
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

          {/* Tab selection */}
          <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar shrink-0" role="tablist">
            {[
              { id: "general", label: "Deliverables Brief" },
              { id: "checklist", label: `Checklists (${checklistItems.length})` },
              { id: "comments", label: `Reviews & Threads` }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                role="tab"
                aria-selected={activeTab === st.id}
                onClick={() => setActiveTab(st.id)}
                className={`px-3 py-2.5 text-sm font-semibold border-b-2 bg-transparent whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === st.id
                    ? "text-primary border-primary"
                    : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">

            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-3 sm:space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="task-description" className="label mb-0">Context parameters & briefing</label>
                    <AIEnhanceButton value={task.description} onEnhance={(val) => handleTextChange("description", val)} type="description" />
                  </div>
                  <textarea
                    id="task-description"
                    value={task.description}
                    onChange={(e) => handleTextChange("description", e.target.value)}
                    placeholder="Provide granular constraints, requirements specifications, or stakeholder definitions for this deliverable..."
                    rows={4}
                    className="field"
                  />
                </div>

                {/* Attachments / document uploads */}
                <div className="card p-3 sm:p-4 space-y-3 text-left">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleRealFileUpload}
                    className="hidden"
                  />
                  <div className="flex justify-between items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="min-w-0">
                      <span className="label mb-0 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-primary" />
                        Asset Repository & Documents
                      </span>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Upload and manage project deliverables and resources
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-primary btn-sm shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg">
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
                        const isImage = /(^image\/)|(^(png|jpg|jpeg|webp|gif)$)/.test(file.type?.toLowerCase() || "");
                        const isPDF = file.type?.toLowerCase().includes("pdf");
                        return (
                          <div key={file.id} className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {isImage && file.base64 ? (
                                <img
                                  src={file.base64}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-85 shrink-0 border border-zinc-200 dark:border-zinc-800"
                                  onClick={() => setPreviewFile(file)}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0 border border-zinc-200 dark:border-zinc-800">
                                  {file.type?.toUpperCase() || "FILE"}
                                </div>
                              )}
                              <div className="truncate flex-1 min-w-0">
                                <p className="truncate font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                                  {file.name}
                                </p>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                  {file.size} • {file.type?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
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
                                  className="btn btn-sm btn-secondary"
                                >
                                  Preview
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(file)}
                                className="btn btn-sm btn-secondary"
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAttachment(task.id, file.id)}
                                className="btn btn-sm btn-danger-soft"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CHECKLISTS TAB */}
            {activeTab === "checklist" && (
              <div className="space-y-3 sm:space-y-4">
                {/* Progress bar above checklist */}
                {checklistItems.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300">Checklist progress</span>
                      <span className={`font-mono font-tnum font-semibold ${checklistProgress === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
                        {checklistProgress}% Complete
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          checklistProgress === 100 ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${checklistProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Add inline Checklist */}
                <form onSubmit={handleAddCL} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a checklist milestone..."
                    value={inlineCLTitle}
                    onChange={(e) => setInlineCLTitle(e.target.value)}
                    aria-label="New checklist item"
                    className="field flex-1"
                  />
                  <AIEnhanceButton value={inlineCLTitle} onEnhance={setInlineCLTitle} type="checklist" />
                  <button type="submit" className="btn btn-primary btn-sm shrink-0">
                    Add
                  </button>
                </form>

                {checklistItems.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-8">No checklist trackers exist. Add items to track task completion status.</p>
                ) : (
                  <div className="space-y-2">
                    {checklistItems.map((cli) => (
                      <div
                        key={cli.id}
                        className="flex items-center justify-between gap-2 p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={cli.completed}
                            onChange={() => toggleChecklistItem(task.id, cli.id)}
                            aria-label={`Mark "${cli.title}" ${cli.completed ? "incomplete" : "complete"}`}
                            className="w-5 h-5 text-primary border-zinc-300 dark:border-zinc-600 rounded-md cursor-pointer shrink-0 bg-transparent focus:ring-primary/30"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className={`text-sm font-medium truncate ${cli.completed ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}>
                              {cli.title}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none">
                              Created: {formatDateTime(cli.createdAt || task.createdAt || task.startDate)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteChecklistItem(task.id, cli.id)}
                          className="flex items-center justify-center h-9 w-9 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                          aria-label="Delete checklist item"
                          title="Delete checklist item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS & THREADS TAB */}
            {activeTab === "comments" && (
              <div className="space-y-3 sm:space-y-4">

                {/* Submit commentary */}
                <form onSubmit={handlePostComment} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Write a review or tag @name..."
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

                <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                  {(!task.comments || task.comments.length === 0) ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 py-8 text-center">No stakeholders have left comments on this item yet.</p>
                  ) : (
                    task.comments.map((comm) => {
                      const commUser = users.find((u) => u.id === comm.userId);
                      return (
                        <div key={comm.id} className="flex gap-3 text-xs border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl">
                          <UserAvatar user={commUser} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{commUser?.name}</span>
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
            )}

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
                {["png", "jpg", "jpeg", "webp"].includes(previewFile.type?.toLowerCase()) ? (
                  <img
                    src={previewFile.base64}
                    alt=""
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-soft"
                    referrerPolicy="no-referrer"
                  />
                ) : previewFile.type?.toLowerCase() === "pdf" ? (
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
