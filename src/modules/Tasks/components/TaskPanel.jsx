/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X, Check, Link2, MoreHorizontal, Copy, Trash2, ChevronLeft, ChevronDown, Plus, Eye, Download,
  FileText, Image as ImageIcon, Loader2, Pencil, CornerUpLeft, History, Sparkles,
} from "lucide-react";
import { useAppState } from "../../../app/providers";
import { useAssistant } from "../../Assistant/AssistantContext";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { AIEnhancerModal } from "../../../components/common/AIEnhancerModal";
import { RichTextEditor } from "../../../components/common/RichText/RichTextEditor";
import { RichTextView } from "../../../components/common/RichText/RichTextView";
import { isRichTextEmpty, plainToRichText, richTextToPlain, toRichText } from "../../../components/common/RichText/sanitizeHtml";
import { AttachmentPreviewModal } from "../../Projects/components/AttachmentPreviewModal";
import { TaskChecklist } from "./TaskChecklist";
import { TaskEvidence } from "./TaskEvidence";
import { CommentComposer } from "./CommentComposer";
import { DoneConfirm } from "./TaskRow";
import { AssigneeField, DatesField, PriorityField, StatusField } from "./TaskFields";
import { evidenceLines, formatRelative, isDoneTask, completedStatusName, defaultStatusName } from "../util/tasksUtils";

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
    <p className="text-[14.5px] md:text-[13.5px] leading-normal text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
      {parts.map((p, i) => {
        if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline underline-offset-2 break-all">{p}</a>;
        if (p.startsWith("@") && mentionNames.includes(p.slice(1))) return <span key={i} className="font-bold text-primary">{p}</span>;
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </p>
  );
}

const H2 = "text-[13.5px] md:text-[13px] font-bold tracking-normal text-zinc-900 dark:text-white";
const ADD_CHIP = "inline-flex items-center gap-1.5 h-10 md:h-[30px] px-3.5 md:px-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[13.5px] md:text-[12.5px] font-semibold text-zinc-800 md:text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer transition-colors";
const MENU_ITEM = "w-full flex items-center gap-2 h-10 md:h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer";
const DIVIDER = <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-1 md:mx-0 shrink-0" />;

/**
 * The description. Stored as rich-text HTML (imported tasks arrive as
 * `<p>…</p>`; older ones are plain text, which toRichText wraps), so it is
 * always read through RichTextView and edited in the RichTextEditor — never
 * shown or edited as raw text. Click to edit; leaving the editor saves.
 */
function TaskDescription({ task, canEdit, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const box = useRef(null);
  const html = useMemo(() => toRichText(task.description), [task.description]);

  // Start typing at the end of what is there.
  useEffect(() => {
    const el = editing && box.current?.querySelector("[contenteditable]");
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    selection?.selectAllChildren(el);
    selection?.collapseToEnd();
  }, [editing]);

  const start = () => { setDraft(html); setEditing(true); };
  const finish = () => {
    setEditing(false);
    const next = isRichTextEmpty(draft) ? "" : draft;
    if (next !== html) onSave(next);
  };

  return (
    <div className="px-1 md:px-0 flex flex-col gap-1.5">
      <div className="flex items-center min-h-[26px]">
        <h2 className={H2}>Description</h2>
        {canEdit && <AIEnhanceButton className="ml-auto" label="Improve" value={richTextToPlain(html)} onEnhance={(v) => { setEditing(false); onSave(plainToRichText(v)); }} type="description" />}
      </div>
      {editing ? (
        <div
          ref={box}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) finish(); }}
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditing(false); } }}
        >
          <RichTextEditor value={draft} onChange={setDraft} placeholder="Add a description, requirements, or context…" minHeight={96} />
        </div>
      ) : isRichTextEmpty(html) ? (
        canEdit
          ? <button type="button" onClick={start} className="self-start -mx-1 px-1 rounded text-[15px] md:text-sm leading-[1.6] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-text">Add a description…</button>
          : <p className="text-[15px] md:text-sm leading-[1.6] text-zinc-500 dark:text-zinc-400">No description.</p>
      ) : (
        <div
          {...(canEdit ? {
            role: "button", tabIndex: 0, title: "Click to edit", "aria-label": "Description. Press Enter to edit",
            onClick: (e) => { if (!e.target.closest("a")) start(); },
            onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) { e.preventDefault(); start(); } },
          } : {})}
          className={canEdit ? "-mx-1 px-1 rounded cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors" : ""}
        >
          <RichTextView html={html} className="text-[15px]! md:text-sm! leading-[1.6]! text-zinc-800! dark:text-zinc-200! break-words [&_p+p]:mt-2" />
        </div>
      )}
    </div>
  );
}

/**
 * The one task surface, opened at /t/:id from every list. Desktop: 600px
 * full-height drawer on the right, list stays visible behind. Phone:
 * full-screen sheet with a back arrow. Title · a 2x2 grid of fields (Status,
 * Assignee, Dates, Priority) · description · "+ Checklist / + File /
 * Evidence" chips (each section appears once it has content or its chip is
 * pressed) · comments, with the composer pinned at the bottom.
 */
export function TaskPanel() {
  const {
    activeTaskId, setActiveTaskId, tasks, taskDetailError, users, currentUser, currentRole,
    activeWorkspaceProjects, taskStatuses, can,
    updateTask, deleteTask, duplicateTask,
    addComment, updateComment, deleteComment,
    attachFile, removeAttachment, downloadAttachment, getAttachmentBlobUrl, pushNotification,
  } = useAppState();

  const assistant = useAssistant();
  // The assistant keeps the far right on desktop; this drawer sits beside it.
  const besideAssistant = assistant.available && assistant.open;
  const task = tasks.find((t) => t.id === activeTaskId);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const [titleAi, setTitleAi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [confirmCommentId, setConfirmCommentId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  // Sections the user opened with a chip; ones that already have content show regardless.
  const [shown, setShown] = useState({});
  // System events (status/date/assignee changes) are hidden behind a toggle
  // so the stream reads as a conversation; the choice sticks per browser.
  const [showHistory, setShowHistory] = useState(() => localStorage.getItem("apm_task_history") === "1");
  const [flashCommentId, setFlashCommentId] = useState(null);
  const location = useLocation();
  const titleRef = useRef(null);
  const doneRef = useRef(null);
  const composerRef = useRef(null);
  const fileRef = useRef(null);
  const streamEndRef = useRef(null);

  useEffect(() => {
    setEditingTitle(false);
    setMenuOpen(false);
    setConfirmDelete(false);
    setConfirmDone(false);
    setEditingCommentId(null);
    setConfirmCommentId(null);
    setShown({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId]);
  useEffect(() => { if (task && !editingTitle) setTitleDraft(task.title || ""); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [task?.id, task?.title]);
  useEffect(() => {
    const el = titleRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  }, [titleDraft, editingTitle]);

  // Escape closes the panel when focus is not in a field
  useEffect(() => {
    if (!activeTaskId) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      const el = document.activeElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName) || el?.isContentEditable) return;
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

  const commitTitle = () => {
    setEditingTitle(false);
    const value = titleDraft.trim();
    if (!value || value === task.title) { setTitleDraft(task.title || ""); return; }
    updateTask(task.id, { title: value });
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
    <div className="flex items-center gap-2 h-[52px] md:h-12 px-1 md:pl-5 md:pr-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <button type="button" onClick={() => setActiveTaskId(null)} className="btn-icon h-11 w-11 rounded-lg text-zinc-800 dark:text-zinc-200 md:hidden" aria-label="Back">
        <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
      </button>
      {task && (
        <nav className="flex items-center gap-2 min-w-0" aria-label="Breadcrumb">
          {project ? (
            <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 min-w-0 text-[13px] md:text-[12.5px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
              <span className="truncate">{project.name}</span>
            </Link>
          ) : <span className="text-[13px] md:text-[12.5px] font-medium text-zinc-600 dark:text-zinc-400">No project</span>}
          <span className="text-[12.5px] md:text-xs text-zinc-500 font-tnum shrink-0">#{task.id}</span>
        </nav>
      )}
      <div className="ml-auto flex items-center md:gap-0.5 shrink-0 relative">
        {task && canEdit && (
          <>
            <button
              ref={doneRef}
              type="button"
              onClick={() => (done ? updateTask(task.id, { status: defaultStatusName(taskStatuses) }) : setConfirmDone(true))}
              className={`inline-flex items-center gap-1.5 h-9 md:h-[30px] px-3 md:mr-1 rounded-lg md:rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[13px] md:text-[12.5px] font-bold cursor-pointer transition-colors ${done ? "text-zinc-700 dark:text-zinc-200" : "text-green-700 dark:text-emerald-400"}`}
            >
              <Check className="w-[15px] h-[15px] md:w-3.5 md:h-3.5" strokeWidth={2.4} />
              {done ? "Reopen" : <><span className="md:hidden">Done</span><span className="hidden md:inline">Mark done</span></>}
            </button>
            {confirmDone && doneRef.current && (
              <DoneConfirm
                anchor={doneRef.current}
                title={task.title}
                onConfirm={() => { setConfirmDone(false); updateTask(task.id, { status: completedStatusName(taskStatuses) }); }}
                onCancel={() => setConfirmDone(false)}
              />
            )}
          </>
        )}
        {/* On phones the link lives in the ••• menu; people who can't edit have no menu, so they keep the button. */}
        <button type="button" onClick={copyLink} className={`btn-icon h-11 w-11 md:h-8 md:w-8 ${task && canEdit ? "hidden md:inline-flex" : ""}`} aria-label="Copy link to this task" title={copied ? "Copied" : "Copy link"}>
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
        </button>
        {task && canEdit && (
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="btn-icon h-11 w-11 rounded-lg md:h-8 md:w-8 md:rounded-md" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More actions">
            <MoreHorizontal className="w-[18px] h-[18px] md:w-4 md:h-4" />
          </button>
        )}
        <button type="button" onClick={() => setActiveTaskId(null)} className="btn-icon hidden md:inline-flex" aria-label="Close">
          <X className="w-4 h-4" strokeWidth={2.2} />
        </button>

        {menuOpen && task && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} aria-hidden="true" />
            <div role="menu" className="menu-panel absolute right-0 top-full mt-1 z-50 w-56 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); copyLink(); }} className={`${MENU_ITEM} md:hidden`}>
                <Link2 className="w-4 h-4" /> Copy link
              </button>
              <button type="button" role="menuitem" onClick={async () => { setMenuOpen(false); const copy = await duplicateTask(task.id); if (copy) setActiveTaskId(copy.id); }} className={MENU_ITEM}>
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setTitleAi(true); }} className={MENU_ITEM}>
                <Sparkles className="w-4 h-4" /> Improve title with AI
              </button>
              <button type="button" role="menuitemcheckbox" aria-checked={showHistory} onClick={() => { setMenuOpen(false); toggleHistory(); }} className={MENU_ITEM}>
                <History className="w-4 h-4" /> {showHistory ? "Hide activity log" : "Show activity log"}
                {historyCount > 0 && <span className="ml-auto text-[11px] text-zinc-400 font-tnum">{historyCount}</span>}
              </button>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
              {!confirmDelete ? (
                <button type="button" role="menuitem" onClick={() => setConfirmDelete(true)} className={`${MENU_ITEM} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10`}>
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

  let body = (
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
  );

  if (task) {
    const files = task.attachments || [];
    const evidenceCount = evidenceLines(task.evidence).length;
    const showChecklist = shown.checklist || (task.checklist?.length || task.checklistTotal) > 0;
    const showFiles = shown.files || files.length > 0 || task.attachmentCount > 0;
    const showEvidence = !!shown.evidence;
    const evidenceChip = !showEvidence && (canEdit || evidenceCount > 0);
    const reveal = (key) => setShown((s) => ({ ...s, [key]: true }));
    const created = task.createdAt ? new Date(task.createdAt) : null;

    body = (
      <div
        className="flex-1 overflow-y-auto [scrollbar-gutter:stable] px-2 md:px-5 pt-4 md:pt-5 flex flex-col gap-4 md:gap-[18px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); Array.from(e.dataTransfer.files || []).forEach(uploadToTask); }}
      >
        {/* Title */}
        <div className="px-1 md:px-0">
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
              className="block w-full text-xl font-bold tracking-[-0.01em] leading-[1.3] text-zinc-900 dark:text-white bg-transparent outline-none resize-none overflow-hidden border-b border-primary -mb-px"
              aria-label="Task title"
            />
          ) : (
            <h1
              {...(canEdit ? {
                role: "button", tabIndex: 0, title: "Click to edit",
                onClick: () => setEditingTitle(true),
                onKeyDown: (e) => { if (e.key === "Enter") { e.preventDefault(); setEditingTitle(true); } },
              } : {})}
              className={`text-xl font-bold tracking-[-0.01em] leading-[1.3] break-words ${canEdit ? "cursor-text hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded -mx-1 px-1" : ""} ${done ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white"}`}
            >
              {task.title}
            </h1>
          )}
        </div>

        {/* Fields */}
        <div className="px-1 md:px-0 grid grid-cols-2 gap-3 md:gap-4">
          <StatusField task={task} taskStatuses={taskStatuses} disabled={!canEdit} onChange={(status) => updateTask(task.id, { status })} />
          <AssigneeField task={task} members={members} users={users} disabled={!canEdit} onChange={(patch) => updateTask(task.id, patch)} />
          <DatesField task={task} taskStatuses={taskStatuses} disabled={!canEdit} onChange={(patch) => updateTask(task.id, patch)} />
          <PriorityField task={task} disabled={!canEdit} onChange={(priority) => updateTask(task.id, { priority })} />
        </div>

        <div className="hidden md:block">{DIVIDER}</div>

        <TaskDescription key={task.id} task={task} canEdit={canEdit} onSave={(description) => updateTask(task.id, { description })} />

        {canEdit && <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileInput} />}
        {((canEdit && (!showChecklist || !showFiles)) || evidenceChip) && (
          <div className="px-1 md:px-0 flex flex-wrap gap-2">
            {canEdit && !showChecklist && (
              <button type="button" onClick={() => reveal("checklist")} className={ADD_CHIP}><Plus className="w-3.5 h-3.5 md:w-[13px] md:h-[13px]" strokeWidth={2.2} />Checklist</button>
            )}
            {canEdit && !showFiles && (
              <button type="button" onClick={() => { reveal("files"); fileRef.current?.click(); }} className={ADD_CHIP}><Plus className="w-3.5 h-3.5 md:w-[13px] md:h-[13px]" strokeWidth={2.2} />File</button>
            )}
            {evidenceChip && (
              <button type="button" onClick={() => reveal("evidence")} aria-expanded={false} className={ADD_CHIP}>
                <Link2 className="hidden md:block w-[13px] h-[13px]" />
                Evidence
                {evidenceCount > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] md:min-w-4 md:h-4 px-[5px] md:px-1 rounded-full bg-primary/10 dark:bg-primary/20 text-[#0467d1] dark:text-sky-300 text-[11px] md:text-[10.5px] font-bold font-tnum">{evidenceCount}</span>}
                <ChevronDown className="md:hidden w-3.5 h-3.5 text-zinc-500" strokeWidth={2.2} />
              </button>
            )}
          </div>
        )}

        {showChecklist && <div className="px-1 md:px-0"><TaskChecklist key={task.id} task={task} startAdding={!!shown.checklist} /></div>}

        {showEvidence && (
          <div className="px-1 md:px-0">
            <TaskEvidence task={task} canEdit={canEdit} onChange={(evidence) => updateTask(task.id, { evidence })} onHide={() => setShown((s) => ({ ...s, evidence: false }))} />
          </div>
        )}

        {showFiles && (
          <div className="px-1 md:px-0 flex flex-col gap-2">
            <div className="flex items-center min-h-[26px]">
              <h2 className={H2}>Files</h2>
              {canEdit && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingFile} className="ml-auto inline-flex items-center gap-[5px] h-[26px] px-2 rounded-md text-xs font-semibold text-primary dark:text-sky-300 hover:bg-primary/8 dark:hover:bg-primary/15 cursor-pointer disabled:opacity-50">
                  {uploadingFile ? <Loader2 className="w-[13px] h-[13px] animate-spin" /> : <Plus className="w-[13px] h-[13px]" strokeWidth={2.2} />}
                  Add
                </button>
              )}
            </div>
            {files.length === 0 && <p className="text-[13px] text-zinc-500 dark:text-zinc-400">No files yet. Drop a file anywhere on this panel.</p>}
            {files.map((file) => {
              const image = isImageType(file.type);
              const previewable = image || isPdfType(file.type);
              return (
                <div key={file.id} className="group/file flex items-center gap-2.5 min-h-11 pl-3 pr-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[13px]" title={[file.author, file.createdAt ? formatRelative(file.createdAt) : "", file.commentId ? "from a comment" : ""].filter(Boolean).join(" · ")}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md shrink-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {image ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  </span>
                  <span className="flex-1 min-w-0 font-semibold text-zinc-900 dark:text-zinc-100 truncate">{file.name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-tnum">{file.size}</span>
                  <span className="flex items-center md:opacity-0 md:group-hover/file:opacity-100 focus-within:opacity-100 transition-opacity">
                    {previewable && <button type="button" onClick={() => openPreview(file)} className="btn-icon h-7 w-7" aria-label={`Preview ${file.name}`}><Eye className="w-3.5 h-3.5" /></button>}
                    <button type="button" onClick={() => downloadAttachment(file)} className="btn-icon h-7 w-7" aria-label={`Download ${file.name}`}><Download className="w-3.5 h-3.5" /></button>
                    {canEdit && <button type="button" onClick={() => removeAttachment(task.id, file.id)} className="btn-icon h-7 w-7 hover:text-rose-600" aria-label={`Delete ${file.name}`}><Trash2 className="w-3.5 h-3.5" /></button>}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {DIVIDER}

        {/* Comments (+ the system log when history is on) */}
        <div className="px-1 md:px-0 flex flex-col gap-3 md:gap-2.5">
          <div className="flex items-center min-h-[26px]">
            <h2 className={H2}>
              Comments{task.comments?.length > 0 && <span className="ml-1.5 font-semibold text-zinc-500 font-tnum">{task.comments.length}</span>}
            </h2>
            {historyCount > 0 && (
              <button type="button" onClick={toggleHistory} aria-pressed={showHistory} className={`ml-auto inline-flex items-center gap-[5px] h-[26px] px-2 rounded-md text-xs font-semibold cursor-pointer transition-colors ${showHistory ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                <History className="w-[13px] h-[13px]" /> {showHistory ? "Hide history" : "History"}
              </button>
            )}
          </div>
          {stream.length === 0 ? (
            <p className="text-[13px] leading-normal text-zinc-600 dark:text-zinc-400">No comments yet.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
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
                const author = c.author || (c.guestName ? { name: c.guestName } : users.find((u) => u.id === c.userId));
                const editing = editingCommentId === c.id;
                return (
                  <div key={entry.id} id={`comment-${c.id}`} className={`flex items-start gap-2.5 group/cm rounded-md transition-shadow ${flashCommentId === c.id ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : ""}`}>
                    <UserAvatar user={author} size="xs" />
                    <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                      <div className="flex items-baseline gap-1.5 text-[13px] md:text-[12.5px]">
                        <span className="font-bold text-zinc-900 dark:text-white truncate">{author?.name || "Deleted user"}</span>
                        {c.guestName && <span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">guest</span>}
                        <span className="text-zinc-500 font-tnum shrink-0">{formatRelative(c.timestamp)}{c.editedAt ? " · edited" : ""}</span>
                      </div>
                      {editing ? (
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
                      ) : (
                        <>
                          <CommentBody text={c.text} mentionNames={mentionNames} />
                          {c.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
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
                          <div className="flex items-center gap-2.5 min-h-5 text-[11px] font-semibold text-zinc-500 md:opacity-0 md:group-hover/cm:opacity-100 focus-within:opacity-100 transition-opacity">
                            {canEdit && <button type="button" onClick={() => replyTo(c)} className="inline-flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"><CornerUpLeft className="w-3 h-3" />Reply</button>}
                            {own && <button type="button" onClick={() => setEditingCommentId(c.id)} className="inline-flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"><Pencil className="w-3 h-3" />Edit</button>}
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={streamEndRef} />
        </div>

        {created && (
          <p className="mt-auto px-1 md:px-0 pb-3 text-[12.5px] md:text-xs text-zinc-500" title={created.toLocaleString()}>
            Created {created.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at {created.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>
    );
  }

  const footer = task && canEdit ? (
    <div className="shrink-0 px-2 pt-2 md:px-4 md:pt-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4">
      <CommentComposer ref={composerRef} members={users} onSubmit={submitComment} onUpload={uploadToTask} />
    </div>
  ) : null;

  return (
    <>
      <aside
        role="dialog"
        aria-label="Task details"
        className={`fixed z-40 inset-0 md:inset-auto md:top-[calc(3rem+env(safe-area-inset-top))] md:right-0 md:bottom-0 md:w-[600px] md:max-w-[90vw] ${besideAssistant ? "lg:right-[420px] lg:max-w-[calc(100vw-420px)]" : ""} bg-white dark:bg-zinc-950 md:border-l border-zinc-200 dark:border-zinc-800 md:shadow-elevated flex flex-col pt-safe md:pt-0 text-[13px] animate-in slide-in-from-right duration-200`}
      >
        {header}
        {body}
        {footer}
      </aside>
      {task && (
        <AIEnhancerModal isOpen={titleAi} onClose={() => setTitleAi(false)} initialValue={task.title} onApply={(v) => { setTitleDraft(v); updateTask(task.id, { title: v }); }} type="title" />
      )}
      <AttachmentPreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} handleDownloadFile={(f) => downloadAttachment(f)} />
    </>
  );
}
