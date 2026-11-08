/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X, Check, Link2, MoreHorizontal, Copy, Trash2, ArrowLeft, Paperclip, Eye, Download,
  FileText, Image as ImageIcon, Loader2, Pencil, CornerUpLeft, History,
} from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { AttachmentPreviewModal } from "../../Projects/components/AttachmentPreviewModal";
import { TaskChecklist } from "./TaskChecklist";
import { CommentComposer } from "./CommentComposer";
import { daysLate, dueState, formatDue, formatRelative, isDoneTask, completedStatusName, defaultStatusName, statusDot } from "../util/tasksUtils";

const isImageType = (t) => (t || "").toLowerCase().startsWith("image/");
const isPdfType = (t) => (t || "").toLowerCase().includes("pdf");
const MAX_UPLOAD = 10 * 1024 * 1024;

/** Highlights @mentions and links inside a comment body. */
function CommentBody({ text, mentionNames }) {
  const parts = useMemo(() => {
    const names = [...mentionNames].sort((a, b) => b.length - a.length);
    const pattern = names.length
      ? new RegExp(`(https?://\\S+|${names.map((n) => `@${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).join("|")})`, "g")
      : /(https?:\/\/\S+)/g;
    return text.split(pattern).filter((p) => p !== undefined && p !== "");
  }, [text, mentionNames]);
  return (
    <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap break-words">
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline underline-offset-2 break-all">{p}</a>;
        if (p.startsWith("@") && mentionNames.includes(p.slice(1))) return <span key={i} className="font-bold text-primary">{p}</span>;
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </p>
  );
}

/**
 * The one task surface, opened at /t/:id from every list. Desktop: 520px
 * full-height panel on the right, list stays visible behind. Phone:
 * full-screen page with a back arrow. Sections: title · properties ·
 * description · checklist · files · activity + comments (one stream) with the
 * composer pinned at the bottom.
 */
export function TaskPanel() {
  const {
    activeTaskId, setActiveTaskId, tasks, taskDetailError, users, currentUser, currentRole,
    activeWorkspaceProjects, taskStatuses, can,
    updateTask, deleteTask, duplicateTask,
    addComment, updateComment, deleteComment,
    attachFile, removeAttachment, downloadAttachment, getAttachmentBlobUrl, pushNotification,
  } = useAppState();

  const task = tasks.find((t) => t.id === activeTaskId);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [confirmCommentId, setConfirmCommentId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  // System events (status/date/assignee changes) are hidden behind a toggle
  // so the stream reads as a conversation; the choice sticks per browser.
  const [showHistory, setShowHistory] = useState(() => localStorage.getItem("apm_task_history") === "1");
  const [flashCommentId, setFlashCommentId] = useState(null);
  const location = useLocation();
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const composerRef = useRef(null);
  const fileRef = useRef(null);
  const streamEndRef = useRef(null);

  useEffect(() => {
    setEditingTitle(false);
    setMenuOpen(false);
    setConfirmDelete(false);
    setEditingCommentId(null);
    setConfirmCommentId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId]);
  useEffect(() => { if (task && !editingTitle) setTitleDraft(task.title || ""); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [task?.id, task?.title]);
  useEffect(() => { if (task) setDescDraft(task.description || ""); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [task?.id]);
  useEffect(() => {
    for (const el of [titleRef.current, descRef.current]) {
      if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
    }
  }, [titleDraft, descDraft, editingTitle]);

  // Escape closes the panel when focus is not in a field
  useEffect(() => {
    if (!activeTaskId) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (previewFile) return;
      setActiveTaskId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTaskId, previewFile, setActiveTaskId]);

  // Comments, oldest first; the system log is merged in only when history is on.
  const stream = useMemo(() => {
    if (!task) return [];
    const comments = (task.comments || []).map((c) => ({ kind: "comment", id: `c${c.id}`, at: c.timestamp, comment: c }));
    const activity = showHistory
      ? (task.activities || [])
        .filter((a) => !/added a comment$/i.test(a.text || ""))
        .map((a) => ({ kind: "activity", id: `a${a.id}`, at: a.timestamp, activity: a }))
      : [];
    return [...comments, ...activity].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [task, showHistory]);
  const historyCount = (task?.activities || []).filter((a) => !/added a comment$/i.test(a.text || "")).length;
  const mentionNames = useMemo(() => users.map((u) => u.name).filter(Boolean), [users]);

  // Opened from a notification (/t/:id#c123): scroll to that comment and flash it.
  const targetCommentId = location.hash.startsWith("#c") ? Number(location.hash.slice(2)) : null;
  const hasTargetComment = !!targetCommentId && (task?.comments || []).some((c) => c.id === targetCommentId);
  useEffect(() => {
    if (!hasTargetComment) return undefined;
    const el = document.getElementById(`comment-${targetCommentId}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlashCommentId(targetCommentId);
    const t = setTimeout(() => setFlashCommentId(null), 2500);
    return () => clearTimeout(t);
  }, [hasTargetComment, targetCommentId]);
  const toggleHistory = () => {
    setShowHistory((v) => { localStorage.setItem("apm_task_history", v ? "0" : "1"); return !v; });
  };

  if (!activeTaskId) return null;

  const canEdit = can("editTasks");
  const isAdmin = currentRole === "Owner" || currentRole === "Admin";
  const project = task ? activeWorkspaceProjects.find((p) => p.id === task.projectId) : null;
  const members = project?.members?.length ? users.filter((u) => project.members.includes(u.id) || u.id === task?.assigneeId) : users;
  const done = task ? isDoneTask(task, taskStatuses) : false;
  const due = task ? dueState(task, taskStatuses) : null;

  const commitTitle = () => {
    setEditingTitle(false);
    const value = titleDraft.trim();
    if (!value || value === task.title) { setTitleDraft(task.title || ""); return; }
    updateTask(task.id, { title: value });
  };
  const commitDescription = () => {
    if ((descDraft || "") !== (task.description || "")) updateTask(task.id, { description: descDraft });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${task.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const uploadToTask = async (file) => {
    if (!file) return null;
    if (file.size > MAX_UPLOAD) {
      pushNotification("Files can be at most 10MB.", "update", null, null, "File too large");
      return null;
    }
    return attachFile(task.id, file);
  };

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setUploadingFile(true);
    for (const f of files) {
      // eslint-disable-next-line no-await-in-loop
      await uploadToTask(f);
    }
    setUploadingFile(false);
  };

  const openPreview = async (file) => {
    const url = await getAttachmentBlobUrl(file);
    if (url) setPreviewFile({ ...file, base64: url });
  };

  const submitComment = async (fields) => {
    const created = await addComment(task.id, fields);
    if (created) requestAnimationFrame(() => streamEndRef.current?.scrollIntoView({ block: "end" }));
    return !!created;
  };

  const replyTo = (comment) => {
    const firstLine = (comment.text || "").split("\n")[0].slice(0, 120);
    const author = comment.author?.name;
    composerRef.current?.prefill(`> ${firstLine}\n${author ? `@${author} ` : ""}`);
  };

  const header = (
    <div className="flex items-center gap-1.5 h-11 px-2 md:px-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <button type="button" onClick={() => setActiveTaskId(null)} className="btn-icon md:hidden" aria-label="Back">
        <ArrowLeft className="w-5 h-5" />
      </button>
      {task && (
        <nav className="flex items-center gap-1.5 min-w-0 text-xs text-zinc-500 dark:text-zinc-400 font-medium" aria-label="Breadcrumb">
          {project ? (
            <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white truncate max-w-[180px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
              <span className="truncate">{project.name}</span>
            </Link>
          ) : <span>No project</span>}
          <span aria-hidden="true">›</span>
          <span className="truncate hidden sm:inline">{task.status}</span>
          <span aria-hidden="true" className="hidden sm:inline">›</span>
          <span className="font-mono text-[11px] text-zinc-400">#{task.id}</span>
        </nav>
      )}
      <div className="ml-auto flex items-center gap-0.5 relative">
        {task && canEdit && (
          <button
            type="button"
            onClick={() => updateTask(task.id, { status: done ? defaultStatusName(taskStatuses) : completedStatusName(taskStatuses) })}
            className={`btn btn-sm hidden sm:inline-flex ${done ? "btn-secondary" : "btn-secondary text-emerald-700 dark:text-emerald-400"}`}
          >
            <Check className="w-3.5 h-3.5" />
            {done ? "Reopen" : "Mark done"}
          </button>
        )}
        <button type="button" onClick={copyLink} className="btn-icon" aria-label="Copy link to this task" title={copied ? "Copied" : "Copy link"}>
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
        </button>
        {task && canEdit && (
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="btn-icon" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More actions">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={() => setActiveTaskId(null)} className="btn-icon hidden md:inline-flex" aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        {menuOpen && task && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} aria-hidden="true" />
            <div role="menu" className="menu-panel absolute right-0 top-9 z-50 w-52 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); updateTask(task.id, { status: done ? defaultStatusName(taskStatuses) : completedStatusName(taskStatuses) }); }} className="sm:hidden w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <Check className="w-4 h-4" /> {done ? "Reopen" : "Mark done"}
              </button>
              <button type="button" role="menuitem" onClick={async () => { setMenuOpen(false); const copy = await duplicateTask(task.id); if (copy) setActiveTaskId(copy.id); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button type="button" role="menuitemcheckbox" aria-checked={showHistory} onClick={() => { setMenuOpen(false); toggleHistory(); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                <History className="w-4 h-4" /> {showHistory ? "Hide activity log" : "Show activity log"}
                {historyCount > 0 && <span className="ml-auto text-[11px] text-zinc-400 font-tnum">{historyCount}</span>}
              </button>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
              {!confirmDelete ? (
                <button type="button" role="menuitem" onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer">
                  <Trash2 className="w-4 h-4" /> Delete task…
                </button>
              ) : (
                <div className="p-2 mt-1 rounded-md bg-rose-50 dark:bg-rose-500/10">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5">Delete this task for everyone?</p>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} className="btn btn-sm btn-secondary flex-1">Cancel</button>
                    <button type="button" onClick={() => { setMenuOpen(false); deleteTask(task.id); }} className="btn btn-sm btn-danger flex-1">Delete</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const body = !task ? (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm text-zinc-500 p-6 text-center">
      {taskDetailError ? (
        <>
          <p className="font-semibold text-zinc-700 dark:text-zinc-200">{taskDetailError}</p>
          <button type="button" onClick={() => setActiveTaskId(null)} className="btn btn-secondary btn-sm mt-1">Back to tasks</button>
        </>
      ) : (
        <><Loader2 className="w-5 h-5 animate-spin" /> Loading task…</>
      )}
    </div>
  ) : (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-5 py-4 flex flex-col gap-[18px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); Array.from(e.dataTransfer.files || []).forEach(uploadToTask); }}
    >
      {/* Title */}
      <div className="flex items-start gap-2">
        {editingTitle && canEdit ? (
          <textarea
            ref={titleRef}
            value={titleDraft}
            rows={1}
            maxLength={500}
            autoFocus
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
              if (e.key === "Escape") { setTitleDraft(task.title || ""); setEditingTitle(false); }
            }}
            className="flex-1 text-[17px] font-bold leading-snug text-zinc-900 dark:text-white bg-transparent outline-none resize-none overflow-hidden border-b border-primary -mb-px"
            aria-label="Task title"
          />
        ) : (
          <h2
            onClick={() => canEdit && setEditingTitle(true)}
            className={`flex-1 text-[17px] font-bold leading-snug text-zinc-900 dark:text-white break-words ${canEdit ? "cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded -mx-1 px-1" : ""} ${done ? "line-through text-zinc-400 dark:text-zinc-500" : ""}`}
            title={canEdit ? "Click to edit" : undefined}
          >
            {task.title}
          </h2>
        )}
        {canEdit && <AIEnhanceButton value={task.title} onEnhance={(v) => { setTitleDraft(v); updateTask(task.id, { title: v }); }} type="title" />}
      </div>

      {/* Properties */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="tp-status" className="label">Status</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none" style={{ backgroundColor: statusDot(task.status, taskStatuses) }} />
            <select id="tp-status" value={task.status} disabled={!canEdit} onChange={(e) => updateTask(task.id, { status: e.target.value })} className="field h-[30px] pl-6 text-xs font-semibold">
              {taskStatuses.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="tp-assignee" className="label">Assignee</label>
          <select id="tp-assignee" value={task.assigneeId || ""} disabled={!canEdit} onChange={(e) => updateTask(task.id, { assigneeId: e.target.value ? Number(e.target.value) : null })} className="field h-[30px] text-xs font-semibold">
            <option value="">Unassigned</option>
            {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="tp-start" className="label">Start date</label>
          <input
            id="tp-start"
            type="date"
            value={task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : ""}
            max={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : undefined}
            disabled={!canEdit}
            onChange={(e) => updateTask(task.id, { startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="field h-[30px] text-xs font-semibold"
          />
        </div>
        <div>
          <label htmlFor="tp-due" className="label">Due date</label>
          <input
            id="tp-due"
            type="date"
            value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
            min={task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : undefined}
            disabled={!canEdit}
            onChange={(e) => updateTask(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className={`field h-[30px] text-xs font-semibold ${due === "late" ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300" : ""}`}
            title={due === "late" ? daysLate(task.dueDate) : formatDue(task.dueDate)}
          />
        </div>
        <div>
          <label htmlFor="tp-priority" className="label">Priority</label>
          <select id="tp-priority" value={task.priority || "Medium"} disabled={!canEdit} onChange={(e) => updateTask(task.id, { priority: e.target.value })} className={`field h-[30px] text-xs font-semibold ${task.priority === "Urgent" ? "text-rose-700 dark:text-rose-300" : task.priority === "High" ? "text-amber-700 dark:text-amber-300" : ""}`}>
            {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Created</span>
          <p className="h-[30px] flex items-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 font-tnum" title={task.createdAt ? new Date(task.createdAt).toLocaleString() : undefined}>
            {task.createdAt ? new Date(task.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">Description</h3>
          {canEdit && <AIEnhanceButton value={descDraft} onEnhance={(v) => { setDescDraft(v); updateTask(task.id, { description: v }); }} type="description" />}
        </div>
        <textarea
          ref={descRef}
          value={descDraft}
          rows={2}
          disabled={!canEdit}
          onChange={(e) => setDescDraft(e.target.value)}
          onBlur={commitDescription}
          placeholder="Add a description, requirements, or context…"
          className="w-full min-h-[56px] text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200 bg-transparent outline-none resize-none rounded-md border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-primary focus:bg-white dark:focus:bg-zinc-900 -mx-2 px-2 py-1.5 placeholder:text-zinc-400 transition-colors"
        />
      </div>

      <TaskChecklist key={task.id} task={task} />

      {/* Files */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">
            Files{task.attachments?.length > 0 && <span className="ml-1.5 font-semibold text-zinc-400 font-tnum">{task.attachments.length}</span>}
          </h3>
          {canEdit && (
            <>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileInput} />
              <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-sm btn-secondary h-[26px] px-2" disabled={uploadingFile}>
                {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                Add file
              </button>
            </>
          )}
        </div>
        {(task.attachments || []).length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No files yet. Drop a file anywhere on this panel.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {task.attachments.map((file) => {
              const image = isImageType(file.type);
              const previewable = image || isPdfType(file.type);
              return (
                <div key={file.id} className="group/file flex items-center gap-2.5 h-10 px-2 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-md shrink-0 ${isPdfType(file.type) ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-primary/8 text-primary dark:bg-primary/15"}`}>
                    {image ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 truncate">{file.name}</span>
                    <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                      {file.size}{file.author ? ` · ${file.author}` : ""}{file.createdAt ? ` · ${formatRelative(file.createdAt)}` : ""}{file.commentId ? " · from a comment" : ""}
                    </span>
                  </span>
                  <span className="flex items-center opacity-0 group-hover/file:opacity-100 focus-within:opacity-100 transition-opacity">
                    {previewable && <button type="button" onClick={() => openPreview(file)} className="btn-icon h-7 w-7" aria-label={`Preview ${file.name}`}><Eye className="w-3.5 h-3.5" /></button>}
                    <button type="button" onClick={() => downloadAttachment(file)} className="btn-icon h-7 w-7" aria-label={`Download ${file.name}`}><Download className="w-3.5 h-3.5" /></button>
                    {canEdit && <button type="button" onClick={() => removeAttachment(task.id, file.id)} className="btn-icon h-7 w-7 hover:text-rose-600" aria-label={`Delete ${file.name}`}><Trash2 className="w-3.5 h-3.5" /></button>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments (+ the system log when history is on) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">
            Comments{task.comments?.length > 0 && <span className="ml-1.5 font-semibold text-zinc-400 font-tnum">{task.comments.length}</span>}
          </h3>
          {historyCount > 0 && (
            <button type="button" onClick={toggleHistory} aria-pressed={showHistory} className={`ml-auto inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${showHistory ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}>
              <History className="w-3 h-3" /> {showHistory ? "Hide" : "History"}{!showHistory && <span className="font-tnum">· {historyCount}</span>}
            </button>
          )}
        </div>
        {stream.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No comments yet. Say something, @mention a teammate, or paste a screenshot.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {stream.map((entry) => {
              if (entry.kind === "activity") {
                return (
                  <div key={entry.id} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 pl-1">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                    <span className="flex-1 leading-relaxed">{entry.activity.text}</span>
                    <span className="shrink-0 font-tnum text-zinc-400">{formatRelative(entry.at)}</span>
                  </div>
                );
              }
              const c = entry.comment;
              const own = c.userId === currentUser?.id;
              const author = c.author || users.find((u) => u.id === c.userId);
              const editing = editingCommentId === c.id;
              return (
                <div key={entry.id} id={`comment-${c.id}`} className={`flex items-start gap-2 group/cm rounded-md transition-shadow ${flashCommentId === c.id ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : ""}`}>
                  <UserAvatar user={author} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 text-xs">
                      <span className="font-bold text-zinc-900 dark:text-white truncate">{author?.name || "Deleted user"}</span>
                      <span className="text-zinc-400 font-tnum shrink-0">· {formatRelative(c.timestamp)}{c.editedAt ? " · edited" : ""}</span>
                    </div>
                    {editing ? (
                      <div className="mt-1">
                        <CommentComposer
                          compact
                          members={users}
                          initial={{ text: c.text, mentions: c.mentions || [], attachments: c.attachments || [] }}
                          onUpload={uploadToTask}
                          onCancel={() => setEditingCommentId(null)}
                          onSubmit={async (fields) => {
                            const saved = await updateComment(task.id, c.id, fields);
                            if (saved) setEditingCommentId(null);
                            return !!saved;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-0.5 px-2.5 py-1.5 rounded-md rounded-tl-none bg-zinc-100/80 dark:bg-zinc-800/70">
                        <CommentBody text={c.text} mentionNames={mentionNames} />
                        {c.attachments?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {c.attachments.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => (isImageType(a.type) || isPdfType(a.type) ? openPreview(a) : downloadAttachment(a))}
                                className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 max-w-[220px] cursor-pointer hover:border-zinc-300"
                              >
                                {isImageType(a.type) ? <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
                                <span className="truncate">{a.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!editing && (
                      <div className="flex items-center gap-2.5 mt-1 text-[11px] font-semibold text-zinc-400 md:opacity-0 md:group-hover/cm:opacity-100 focus-within:opacity-100 transition-opacity">
                        {canEdit && <button type="button" onClick={() => replyTo(c)} className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"><CornerUpLeft className="w-3 h-3" />Reply</button>}
                        {own && <button type="button" onClick={() => setEditingCommentId(c.id)} className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"><Pencil className="w-3 h-3" />Edit</button>}
                        {(own || isAdmin) && (confirmCommentId === c.id ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-600">
                            Delete?
                            <button type="button" onClick={async () => { await deleteComment(task.id, c.id); setConfirmCommentId(null); }} className="underline cursor-pointer">Yes</button>
                            <button type="button" onClick={() => setConfirmCommentId(null)} className="text-zinc-500 cursor-pointer">No</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setConfirmCommentId(c.id)} className="inline-flex items-center gap-1 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3 h-3" />Delete</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={streamEndRef} />
      </div>
    </div>
  );

  const footer = task && canEdit ? (
    <div className="shrink-0 px-2 md:px-4 py-2 md:py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <CommentComposer ref={composerRef} members={users} currentUser={currentUser} onSubmit={submitComment} onUpload={uploadToTask} />
    </div>
  ) : null;

  return (
    <>
      <aside
        role="dialog"
        aria-label="Task details"
        className="fixed z-40 inset-0 md:inset-auto md:top-[calc(3rem+env(safe-area-inset-top))] md:right-0 md:bottom-0 md:w-[520px] md:max-w-[90vw] bg-white dark:bg-zinc-950 md:border-l border-zinc-200 dark:border-zinc-800 md:shadow-elevated flex flex-col pt-safe md:pt-0 animate-in slide-in-from-right duration-200"
      >
        {header}
        {body}
        {footer}
      </aside>
      <AttachmentPreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} handleDownloadFile={(f) => downloadAttachment(f)} />
    </>
  );
}
