/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, MoreHorizontal, Pencil, Users, Archive, RotateCcw, Trash2, FileLock, Paperclip, FileText, Image as ImageIcon, Eye, Download, Loader2, CheckCircle2, Pause, Play } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { RichTextView } from "../../../components/common/RichText/RichTextView";
import { richTextToPlain } from "../../../components/common/RichText/sanitizeHtml";
import { getIconComponent } from "../../../components/common/IconHelper";
import { AttachmentPreviewModal } from "../components/AttachmentPreviewModal";
import { ProjectFormDialog } from "../components/ProjectFormDialog";
import { ProjectMembersList } from "../components/ProjectMembersList";
import { ProjectDiscussionPanel } from "../components/ProjectDiscussionPanel";
import { TaskToolbar, applyTaskFilters } from "../../Tasks/components/TaskToolbar";
import { TaskList } from "../../Tasks/components/TaskList";
import { TaskBoard } from "../../Tasks/components/TaskBoard";
import { defaultStatusName, formatDue, formatRelative, groupByStatus, isOpenTask } from "../../Tasks/util/tasksUtils";

const STATUS_STYLES = {
  Planning: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "On Hold": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  Completed: "bg-primary/8 text-primary dark:bg-primary/15",
  Archived: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};
const TABS = [["tasks", "Tasks"], ["files", "Files"], ["activity", "Activity"]];
const isImageType = (t) => (t || "").toLowerCase().startsWith("image/");
const isPdfType = (t) => (t || "").toLowerCase().includes("pdf");

/**
 * Project page opens on Tasks. Header: icon · name · status · description ·
 * Invite / Add task / ••• ; stat strip (progress, open, overdue, due, team).
 * Tabs: Tasks · Files · Activity. Settings live under the ••• menu.
 */
export function ProjectDetailsPage() {
  const { projectId, tab = "tasks" } = useParams();
  const navigate = useNavigate();
  const {
    projects, tasks, users, taskStatuses, can, addTask, updateProject, deleteProject,
    addProjectMember, removeProjectMember, projectFiles, loadProjectFiles, attachFileToProject, removeAttachmentFromProject,
    downloadAttachment, getAttachmentBlobUrl, pushNotification, activities, ensureActivities,
  } = useAppState();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filters, setFilters] = useState({ projectId: "", assigneeId: "", priority: "", due: "" });
  const [view, setView] = useState(() => localStorage.getItem("apm_tasks_view") || "list");
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  React.useEffect(() => { if (projectId) loadProjectFiles(projectId); }, [projectId, loadProjectFiles]);
  React.useEffect(() => { if (tab === "activity") ensureActivities(); }, [tab, ensureActivities]);

  const project = projects.find((p) => String(p.id) === String(projectId));
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === project?.id), [tasks, project]);
  const groups = useMemo(() => groupByStatus(applyTaskFilters(projectTasks, filters, taskStatuses), taskStatuses), [projectTasks, filters, taskStatuses]);

  if (!project) {
    return (
      <div className="py-12 text-center max-w-md mx-auto space-y-3">
        <FileLock className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
        <h2 className="text-base font-bold text-zinc-900 dark:text-white">Project not found</h2>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">This project is not in the active workspace.</p>
        <Link to="/projects" className="btn btn-primary inline-flex">Back to projects</Link>
      </div>
    );
  }

  const open = projectTasks.filter((t) => isOpenTask(t, taskStatuses));
  const isOpenProject = project.status !== "Completed" && project.status !== "Archived";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const late = open.filter((t) => t.dueDate && new Date(t.dueDate) < today).length;
  const done = projectTasks.length - open.length;
  const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
  const members = (project.members || []).map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const files = projectFiles[project.id] || [];
  const projectActivity = activities.filter((a) => (a.text || "").includes(`'${project.name}'`));
  const manage = can("manageProjects");

  const addTaskHere = (title) => addTask({ title, projectId: project.id, status: defaultStatusName(taskStatuses), priority: "Medium" });
  const changeView = (v) => { setView(v); localStorage.setItem("apm_tasks_view", v); };

  const handleUpload = async (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = "";
    setUploading(true);
    for (const f of list) {
      if (f.size > 10 * 1024 * 1024) { pushNotification("Files can be at most 10MB.", "update", null, null, "File too large"); continue; }
      // eslint-disable-next-line no-await-in-loop
      await attachFileToProject(project.id, f);
    }
    setUploading(false);
  };
  const openPreview = async (file) => {
    const url = await getAttachmentBlobUrl(file);
    if (url) setPreviewFile({ ...file, base64: url });
  };

  return (
    <div className="text-left" id="project-details-root">

      {project.status === "Archived" && (
        <div className="mb-3 px-3 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2">
          <Archive className="w-3.5 h-3.5" /> This project is archived. It's hidden from lists and read-only.
          {manage && <button type="button" onClick={() => updateProject(project.id, { status: open.length ? "Active" : "Completed" })} className="btn btn-sm btn-secondary ml-auto"><RotateCcw className="w-3.5 h-3.5" /> Restore</button>}
        </div>
      )}
      {project.status === "Completed" && (
        <div className="mb-3 px-3 h-10 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> This project is closed{open.length > 0 ? ` with ${open.length} open task${open.length > 1 ? "s" : ""}` : ""}.
          {manage && (
            <span className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={() => updateProject(project.id, { status: "Active" })} className="btn btn-sm btn-secondary"><RotateCcw className="w-3.5 h-3.5" /> Reopen</button>
              <button type="button" onClick={() => updateProject(project.id, { status: "Archived" })} className="btn btn-sm btn-secondary"><Archive className="w-3.5 h-3.5" /> Archive</button>
            </span>
          )}
        </div>
      )}
      {isOpenProject && manage && projectTasks.length > 0 && open.length === 0 && (
        <div className="mb-3 px-3 h-10 rounded-md bg-primary/[0.06] dark:bg-primary/10 text-zinc-800 dark:text-zinc-100 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> All {projectTasks.length} tasks are done. Close this project?
          <button type="button" onClick={() => updateProject(project.id, { status: "Completed" })} className="btn btn-sm btn-primary ml-auto">Close project</button>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${project.color}1f`, color: project.color }}>{getIconComponent(project.icon, "w-5 h-5")}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h1 className="text-[19px] md:text-[22px] font-bold tracking-tight leading-tight text-zinc-900 dark:text-white line-clamp-2 md:line-clamp-1 break-words min-w-0">{project.name}</h1>
            <span className={`inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-bold ${STATUS_STYLES[project.status] || STATUS_STYLES.Planning}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{project.status === "Completed" ? "Closed" : project.status}
            </span>
          </div>
          {richTextToPlain(project.description) && (
            <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400 mt-1 max-w-[720px] line-clamp-2">{richTextToPlain(project.description)}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {manage && isOpenProject && <button type="button" onClick={() => setMembersOpen(true)} className="btn btn-secondary hidden lg:inline-flex"><Users className="w-4 h-4" /> Members</button>}
          {can("editTasks") && isOpenProject && <button type="button" onClick={() => { const el = document.getElementById("add-task-" + (groups.find((g) => g.kind === "open")?.key || "")); if (el) el.focus(); else navigate(`/projects/${project.id}`); }} className="btn btn-primary hidden lg:inline-flex"><Plus className="w-4 h-4" /> Add task</button>}
          {manage && (
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="btn-icon" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Project menu: edit, members, archive, delete">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} aria-hidden="true" />
              <div role="menu" className="menu-panel absolute right-0 top-9 z-40 w-52 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {[
                  ["edit", <Pencil className="w-4 h-4" />, "Edit project", () => setEditOpen(true)],
                  ["members", <Users className="w-4 h-4" />, "Members", () => setMembersOpen(true)],
                  ...(isOpenProject ? [
                    project.status === "On Hold"
                      ? ["resume", <Play className="w-4 h-4" />, "Resume", () => updateProject(project.id, { status: "Active" })]
                      : ["hold", <Pause className="w-4 h-4" />, "Put on hold", () => updateProject(project.id, { status: "On Hold" })],
                    ["close", <CheckCircle2 className="w-4 h-4" />, "Close project", () => updateProject(project.id, { status: "Completed" })],
                  ] : [
                    ["reopen", <RotateCcw className="w-4 h-4" />, "Reopen", () => updateProject(project.id, { status: "Active" })],
                  ]),
                  project.status === "Archived"
                    ? ["restore", <RotateCcw className="w-4 h-4" />, "Restore", () => updateProject(project.id, { status: open.length ? "Active" : "Completed" })]
                    : ["archive", <Archive className="w-4 h-4" />, "Archive", () => updateProject(project.id, { status: "Archived" })],
                ].map(([key, icon, label, fn]) => (
                  <button key={key} type="button" role="menuitem" onClick={() => { setMenuOpen(false); fn(); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                    {icon} {label}
                  </button>
                ))}
                {!confirmDelete ? (
                  <button type="button" role="menuitem" onClick={() => setConfirmDelete(true)} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer">
                    <Trash2 className="w-4 h-4" /> Delete project…
                  </button>
                ) : (
                  <div className="p-2 mt-1 rounded-md bg-rose-50 dark:bg-rose-500/10">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5">Delete the project and all {projectTasks.length} tasks?</p>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} className="btn btn-sm btn-secondary flex-1">Cancel</button>
                      <button type="button" onClick={async () => { setMenuOpen(false); await deleteProject(project.id); navigate("/projects"); }} className="btn btn-sm btn-danger flex-1">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card flex flex-col md:flex-row mb-4 overflow-hidden">
        {/* Progress: ring + status breakdown */}
        <div className="md:flex-1 flex items-center gap-4 px-4 py-3.5 md:py-3 min-w-0">
          <svg className="w-12 h-12 shrink-0 -rotate-90" viewBox="0 0 48 48" role="img" aria-label={`${pct}% complete`}>
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="5" strokeLinecap="round" className={pct === 100 && projectTasks.length ? "stroke-emerald-500" : "stroke-primary"} strokeDasharray={`${(pct / 100) * 125.66} 125.66`} style={{ transition: "stroke-dasharray .4s ease" }} />
            <text x="24" y="24" transform="rotate(90 24 24)" textAnchor="middle" dominantBaseline="central" className="fill-zinc-900 dark:fill-white font-bold" fontSize="11">{pct}%</text>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-zinc-900 dark:text-white font-tnum">
              {projectTasks.length === 0 ? "No tasks yet" : `${done} of ${projectTasks.length} done`}
              {projectTasks.length > 0 && open.length === 0 && <span className="ml-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">All done</span>}
            </p>
            {projectTasks.length > 0 && (() => {
              const started = open.filter((t) => taskStatuses.find((s) => s.name === t.status)?.isStarted).length;
              const todo = open.length - started;
              const seg = (n) => `${(n / projectTasks.length) * 100}%`;
              return (
                <>
                  <div className="mt-1.5 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                    <span className="h-full bg-emerald-500 transition-[width] duration-300" style={{ width: seg(done) }} />
                    <span className="h-full bg-primary transition-[width] duration-300" style={{ width: seg(started) }} />
                    <span className="h-full bg-rose-400 transition-[width] duration-300" style={{ width: seg(late) }} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 font-tnum">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{done} done</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />{started} in progress</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />{todo} to do</span>
                    {late > 0 && <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" />{late} overdue</span>}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-4 md:flex border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 divide-x divide-zinc-100 dark:divide-zinc-800">
        <button type="button" onClick={() => setFilters((f) => ({ ...f, due: "" }))} className="flex flex-col items-center md:items-start justify-center text-center md:text-left px-1 md:px-4 py-2.5 md:py-3 md:min-w-[96px] hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
          <span className="label mb-0.5">Open</span>
          <span className="text-lg font-bold leading-none font-tnum text-zinc-900 dark:text-white">{open.length}</span>
        </button>
        <button type="button" onClick={() => setFilters((f) => ({ ...f, due: f.due === "late" ? "" : "late" }))} aria-pressed={filters.due === "late"} className={`flex flex-col items-center md:items-start justify-center text-center md:text-left px-1 md:px-4 py-2.5 md:py-3 md:min-w-[96px] cursor-pointer transition-colors ${filters.due === "late" ? "bg-rose-50 dark:bg-rose-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}>
          <span className="label mb-0.5">Overdue</span>
          <span className={`text-lg font-bold leading-none font-tnum ${late ? "text-rose-700 dark:text-rose-400" : "text-zinc-400"}`}>{late}</span>
        </button>
        <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left px-1 md:px-4 py-2.5 md:py-3 md:min-w-[110px]">
          <span className="label mb-0.5">Due</span>
          {project.deadline ? (
            <span className={`text-[13px] font-bold leading-tight font-tnum ${new Date(project.deadline) < today && open.length ? "text-rose-700 dark:text-rose-400" : "text-zinc-900 dark:text-white"}`}>
              {new Date(project.deadline).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              <span className="block text-[11px] font-semibold text-zinc-400">{new Date(project.deadline) < today ? (open.length ? "past due" : "met") : formatDue(project.deadline)}</span>
            </span>
          ) : <span className="text-[13px] font-semibold text-zinc-400">Not set</span>}
        </div>
        <button type="button" onClick={() => manage && setMembersOpen(true)} className={`flex flex-col items-center md:items-start justify-center text-center md:text-left px-1 md:px-4 py-2.5 md:py-3 md:min-w-[120px] ${manage ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer" : "cursor-default"}`}>
          <span className="label mb-1">Team <span className="normal-case tracking-normal text-zinc-400 font-tnum">{members.length}</span></span>
          <span className="inline-flex -space-x-1.5">
            {members.slice(0, 3).map((m) => <span key={m.id} className="ring-2 ring-white dark:ring-zinc-900 rounded-full"><UserAvatar user={m} size="xs" /></span>)}
            {members.length > 3 && <span className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-900 text-[10px] font-bold flex items-center justify-center font-tnum">+{members.length - 3}</span>}
            {members.length === 0 && <span className="text-xs text-zinc-400">{manage ? "Add people" : "None"}</span>}
          </span>
        </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-3" role="tablist">
        {TABS.map(([id, label]) => (
          <Link key={id} to={`/projects/${project.id}${id === "tasks" ? "" : `/${id}`}`} role="tab" aria-selected={tab === id}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 text-[13px] font-semibold border-b-2 -mb-px ${tab === id ? "border-primary text-zinc-900 dark:text-white" : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
            {label}
            <span className="text-xs text-zinc-400 font-tnum">{id === "tasks" ? open.length : id === "files" ? files.length : ""}</span>
          </Link>
        ))}
      </div>

      {tab === "tasks" && (
        <>
          <TaskToolbar filters={filters} onFilter={(p) => setFilters((f) => ({ ...f, ...p }))} users={members.length ? members : users} showProjectFilter={false} view={view} onView={changeView} />
          <div className="mt-1">
            {view === "board" ? (
              <div className="mt-3"><TaskBoard groups={groups} showProject={false} onAddTask={can("editTasks") && isOpenProject ? (title, status) => addTask({ title, projectId: project.id, status, priority: "Medium" }) : undefined} /></div>
            ) : (
              <TaskList groups={groups} showProject={false} onAddTask={can("editTasks") && isOpenProject ? addTaskHere : undefined} addPlaceholder={`Add a task to ${project.name}… press Enter`} />
            )}
          </div>
        </>
      )}

      {tab === "files" && (
        <div className="card">
          <div className="flex items-center gap-2 px-3 h-11 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-[13px] font-bold">Files <span className="text-zinc-400 font-semibold font-tnum">{files.length}</span></h2>
            {can("editTasks") && (
              <>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-sm btn-secondary ml-auto">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} Upload
                </button>
              </>
            )}
          </div>
          {files.length === 0 ? <p className="px-3 py-6 text-xs text-zinc-400 text-center">No files yet. Up to 10MB each.</p> : files.map((file) => (
            <div key={file.id} className="group/file flex items-center gap-2.5 h-11 px-3 border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0">
              <span className={`flex h-[30px] w-[30px] items-center justify-center rounded-md shrink-0 ${isPdfType(file.type) ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "bg-primary/8 text-primary dark:bg-primary/15"}`}>
                {isImageType(file.type) ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold truncate">{file.name}</span>
                <span className="block text-[11px] text-zinc-400 truncate">{file.size}{file.author ? ` · ${file.author}` : ""}{file.createdAt ? ` · ${formatRelative(file.createdAt)}` : ""}</span>
              </span>
              <span className="flex items-center md:opacity-0 md:group-hover/file:opacity-100 focus-within:opacity-100 transition-opacity">
                {(isImageType(file.type) || isPdfType(file.type)) && <button type="button" onClick={() => openPreview(file)} className="btn-icon h-7 w-7" aria-label={`Preview ${file.name}`}><Eye className="w-3.5 h-3.5" /></button>}
                <button type="button" onClick={() => downloadAttachment(file)} className="btn-icon h-7 w-7" aria-label={`Download ${file.name}`}><Download className="w-3.5 h-3.5" /></button>
                {can("editTasks") && <button type="button" onClick={() => removeAttachmentFromProject(project.id, file.id)} className="btn-icon h-7 w-7 hover:text-rose-600" aria-label={`Delete ${file.name}`}><Trash2 className="w-3.5 h-3.5" /></button>}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          <div className="lg:col-span-2 flex flex-col gap-3">
            <ProjectDiscussionPanel projectId={project.id} />
            <div className="card p-3">
              <h2 className="text-[13px] font-bold mb-2">Recent activity</h2>
              {projectActivity.length === 0 ? <p className="text-xs text-zinc-400">No activity recorded for this project yet.</p> : (
                <div className="flex flex-col gap-2">
                  {projectActivity.slice(0, 20).map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                      <UserAvatar user={users.find((u) => u.id === a.userId)} size="xs" />
                      <span className="flex-1 leading-relaxed">{a.text}</span>
                      <span className="text-zinc-400 font-tnum shrink-0">{formatRelative(a.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="card p-3">
            <div className="flex items-center mb-2"><h2 className="text-[13px] font-bold">Overview</h2>{manage && <button type="button" onClick={() => setEditOpen(true)} className="ml-auto text-xs font-semibold text-primary hover:underline cursor-pointer">Edit</button>}</div>
            <RichTextView html={project.description} emptyText="No description yet." />
            <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
              <dt className="text-zinc-400">Created</dt><dd className="font-semibold">{project.createdAt ? new Date(project.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}</dd>
              <dt className="text-zinc-400">Due</dt><dd className="font-semibold">{project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}</dd>
              <dt className="text-zinc-400">Status</dt><dd className="font-semibold">{project.status}</dd>
            </dl>
          </div>
        </div>
      )}

      <ProjectFormDialog isOpen={editOpen} onClose={() => setEditOpen(false)} project={project} onUpdate={updateProject} />
      {membersOpen && (
        <div className="modal-overlay" onClick={() => setMembersOpen(false)}>
          <div className="modal-panel sm:max-w-md" role="dialog" aria-modal="true" aria-label="Project members" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grabber" />
            <div className="flex-1 overflow-y-auto p-1">
              <ProjectMembersList project={project} users={users} addProjectMember={addProjectMember} removeProjectMember={removeProjectMember} />
            </div>
            <div className="flex justify-end px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setMembersOpen(false)} className="btn btn-secondary">Done</button>
            </div>
          </div>
        </div>
      )}
      <AttachmentPreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} handleDownloadFile={(f) => downloadAttachment(f)} />
    </div>
  );
}
