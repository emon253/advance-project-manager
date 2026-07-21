/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { motion, AnimatePresence } from "motion/react";

// Icons
import { Archive, FileLock, Settings, Plus, X } from "lucide-react";
import { getIconComponent } from "../../../components/common/IconHelper";

// Modular Imports
import { ProjectDetailsTabs } from "../components/ProjectTabs";
import { ProjectPerformanceCard } from "../components/ProjectPerformanceCard";
import { ProjectMembersList } from "../components/ProjectMembersList";
import { ProjectTaskLineup } from "../components/ProjectTaskLineup";
import { ProjectFileCabinet } from "../components/ProjectFileCabinet";
import { ProjectAdminControls } from "../components/ProjectAdminControls";
import { AttachmentPreviewModal } from "../components/AttachmentPreviewModal";
import { RichTextEditor } from "../../../components/common/RichText/RichTextEditor";
import { RichTextView } from "../../../components/common/RichText/RichTextView";

import {
  calculateCompletionPercentage,
  formatDetailedProjectDeadline
} from "../util/projectUtils";

import "../style/projects.css";

const PROJECT_STATUS_STYLES = {
  Planning: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  "On Hold": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  Completed: "bg-primary/8 text-primary border-primary/20 dark:bg-primary/15",
  Archived: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    tasks,
    users,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    setActiveTaskId,
    attachFileToProject,
    removeAttachmentFromProject,
    loadProjectFiles,
    downloadAttachment,
    getAttachmentBlobUrl,
    projectFiles: useAppState_projectFiles,
    can,
      addProjectMember,
    removeProjectMember,
  } = useAppState();

  const [activeTab, setActiveTab] = useState("overview"); // overview, tasks, files, settings

  React.useEffect(() => {
    if (projectId) loadProjectFiles(projectId);
  }, [projectId, loadProjectFiles]);

  const fileInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Quick project edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStage, setEditStage] = useState("");
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");

  const project = projects.find((p) => String(p.id) === String(projectId));
  if (!project) {
    return (
      <div className="py-12 text-center max-w-md mx-auto space-y-4" id="project-not-found-state">
        <FileLock className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700" />
        <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Project not found</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">This project is not available in the active workspace.</p>
        <Link to="/projects" className="btn btn-primary inline-flex">
          Return to portfolio
        </Link>
      </div>
    );
  }

  // Tasks in this project
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const completedTasks = projectTasks.filter((t) => t.status === "Completed");
  const inProgressCount = projectTasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = projectTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled");

  const completionPercentage = calculateCompletionPercentage(projectTasks);

  // Project files come from the attachments API (S3/local behind the backend).
  const projectFiles = useAppState_projectFiles[project.id] || [];

  const handleRealFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Server caps uploads at 10MB.
    const limit = 10 * 1024 * 1024;
    if (file.size > limit) {
      setErrorMsg("File is larger than the 10MB upload limit. Please choose a smaller file.");
      setTimeout(() => setErrorMsg(""), 6000);
      return;
    }
    attachFileToProject(project.id, file);
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

  const handleUpdateDetails = (e) => {
    e.preventDefault();
    updateProject(project.id, {
      name: editName || project.name,
      description: editDesc || project.description,
      status: editStage || project.status,
    });
    setIsEditing(false);
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate("/projects");
  };


  const deadlineStr = formatDetailedProjectDeadline(project.deadline);

  // Quick Inline Add Task to this project
  const handleInlineAddTask = (e) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;
    addTask({
      title: inlineTaskTitle.trim(),
      projectId: project.id,
      status: "To Do",
      priority: "Medium",
    });
    setInlineTaskTitle("");
  };

  return (
    <div className="space-y-3 sm:space-y-5 text-left" id="project-details-page-root">

      {/* 1. Archive Warning Banner */}
      {project.status === "Archived" && (
        <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-400">
            <Archive className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold">This project is archived</span>
              <p className="text-xs opacity-90 mt-0.5">Archived projects are hidden from your active portfolio. You can restore it here or under Administrative Controls.</p>
            </div>
          </div>
          <button
            onClick={() => updateProject(project.id, { status: "Active" })}
            type="button"
            className="btn btn-sm btn-secondary self-start sm:self-auto shrink-0"
          >
            Restore Project
          </button>
        </div>
      )}

      {/* 2. Page Header with Settings quick buttons */}
      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 relative">
        <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
          <span className="bg-primary/8 dark:bg-primary/15 border border-primary/20 text-primary rounded-xl flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 shrink-0">
            {getIconComponent(project.icon, "w-4 h-4 sm:w-6 sm:h-6")}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-bold text-base sm:text-lg md:text-xl text-zinc-900 dark:text-white leading-tight truncate">
                {project.name}
              </h1>
              <span className={`badge ${PROJECT_STATUS_STYLES[project.status] || PROJECT_STATUS_STYLES.Planning}`}>
                {project.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 sm:mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
              <span>Created {new Date(project.createdAt || project.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              <span aria-hidden="true">•</span>
              <span>Deadline {deadlineStr}</span>
            </p>
          </div>
        </div>

        {/* Templates quick deployment dropdown — managers only */}
        {can("manageProjects") && (
        /* Finding #4: on mobile the gear pins to the header's top-right corner. */
        <div className="absolute top-3 right-3 sm:static shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditName(project.name);
              setEditDesc(project.description);
              setEditStage(project.status);
              setIsEditing(!isEditing);
            }}
            className="btn-icon border border-zinc-200 dark:border-zinc-700"
            title="Edit project"
            aria-label="Edit project"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        )}
      </div>

      {/* Inline editing charter form */}
      {isEditing && (
        <div className="modal-overlay" id="project-edit-modal-container" onClick={() => setIsEditing(false)}>
          <div
            className="modal-panel max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-edit-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-grabber" />
            <form onSubmit={handleUpdateDetails} className="flex flex-col min-h-0 flex-1">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <h3 id="project-edit-dialog-title" className="font-display font-semibold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  Edit Project
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-icon"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-project-name" className="label">Project Name</label>
                    <input
                      id="edit-project-name"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-project-stage" className="label">Project Stage</label>
                    <select
                      id="edit-project-stage"
                      value={editStage}
                      onChange={(e) => setEditStage(e.target.value)}
                      className="field"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-project-desc" className="label">Description</label>
                  <RichTextEditor
                    id="edit-project-desc"
                    value={editDesc}
                    onChange={setEditDesc}
                    placeholder="Outline the charter, goals, or scope… use the toolbar to format."
                  />
                </div>
              </div>

              {/* Sticky footer */}
              <div className="flex items-center justify-end gap-2 px-5 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 sm:flex-none">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Tabs navigation panel */}
      <ProjectDetailsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingTasksCount={pendingTasks.length}
        showAdminTab={can("manageProjects")}
      />

      {/* 4. Tab Content panes with motion transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          className="space-y-2.5 sm:space-y-4"
          id="project-details-tab-content"
        >

          {/* EXECUTIVE SUMMARY */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">

              <div className="md:col-span-2 space-y-2.5 sm:space-y-4">
                <div className="card p-3 sm:p-4">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5 sm:mb-2">Charter Statement</p>
                  <RichTextView html={project.description} emptyText="No charter statement yet — edit the project to add one." />
                </div>

                {/* Progress and velocity metrics state cards */}
                <ProjectPerformanceCard
                  completionPercentage={completionPercentage}
                  inProgressCount={inProgressCount}
                />
              </div>

              {/* Sidebar list of resources */}
              <div className="space-y-2.5 sm:space-y-4">
                <ProjectMembersList project={project} users={users} addProjectMember={addProjectMember} removeProjectMember={removeProjectMember} />
              </div>

            </div>
          )}

          {/* TASKS LINEUP */}
          {activeTab === "tasks" && (
            <ProjectTaskLineup
              projectTasks={projectTasks}
              users={users}
              inlineTaskTitle={inlineTaskTitle}
              setInlineTaskTitle={setInlineTaskTitle}
              handleInlineAddTask={handleInlineAddTask}
              updateTask={updateTask}
              setActiveTaskId={setActiveTaskId}
            />
          )}

          {/* FILE CABINET */}
          {activeTab === "files" && (
            <ProjectFileCabinet
              project={project}
              projectFiles={projectFiles}
              fileInputRef={fileInputRef}
              handleRealFileUpload={handleRealFileUpload}
              errorMsg={errorMsg}
              setPreviewFile={async (file) => {
                if (file.base64) { setPreviewFile(file); return; }
                const url = await getAttachmentBlobUrl(file);
                if (url) setPreviewFile({ ...file, base64: url });
              }}
              handleDownloadFile={handleDownloadFile}
              removeAttachmentFromProject={removeAttachmentFromProject}
            />
          )}

          {/* ADMINISTRATIVE CONTROLS */}
          {activeTab === "settings" && (
            <ProjectAdminControls
              project={project}
              updateProject={updateProject}
              showDeleteConfirm={showDeleteConfirm}
              setShowDeleteConfirm={setShowDeleteConfirm}
              handleDeleteProject={handleDeleteProject}
            />
          )}

        </motion.div>
      </AnimatePresence>

      {/* 5. Attachment Preview Modal */}
      <AttachmentPreviewModal
        previewFile={previewFile}
        setPreviewFile={setPreviewFile}
        handleDownloadFile={handleDownloadFile}
      />

    </div>
  );
}
