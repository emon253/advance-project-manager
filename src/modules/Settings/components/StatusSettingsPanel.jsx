/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sliders, Plus, Edit2, Trash2, CheckCircle2, Clock, Play, AlertOctagon, XCircle, FileEdit, Check } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { StatusBadge } from "../../../components/common/StatusBadge";

const COLOR_PRESETS = [
  { name: "Gray", bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200", darkBg: "dark:bg-zinc-800", darkText: "dark:text-zinc-300", darkBorder: "dark:border-zinc-700", colorClass: "bg-zinc-500" },
  { name: "Brand", bg: "bg-[#533afd]/5", text: "text-[#533afd]", border: "border-[#533afd]/20", darkBg: "dark:bg-[#533afd]/10", darkText: "dark:text-[#533afd]", darkBorder: "dark:border-[#533afd]/20", colorClass: "bg-[#533afd]" },
  { name: "Green", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400", darkBorder: "dark:border-emerald-500/20", colorClass: "bg-emerald-500" },
  { name: "Yellow", bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400", darkBorder: "dark:border-amber-500/20", colorClass: "bg-amber-500" },
  { name: "Red", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400", darkBorder: "dark:border-rose-500/20", colorClass: "bg-rose-500" },
  { name: "Cyan", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", darkBg: "dark:bg-cyan-500/10", darkText: "dark:text-cyan-400", darkBorder: "dark:border-cyan-500/20", colorClass: "bg-cyan-500" },
  { name: "Purple", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", darkBg: "dark:bg-purple-500/10", darkText: "dark:text-purple-400", darkBorder: "dark:border-purple-500/20", colorClass: "bg-purple-500" },
  { name: "Orange", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", darkBg: "dark:bg-orange-500/10", darkText: "dark:text-orange-400", darkBorder: "dark:border-orange-500/20", colorClass: "bg-orange-500" },
  { name: "Teal", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", darkBg: "dark:bg-teal-500/10", darkText: "dark:text-teal-400", darkBorder: "dark:border-teal-500/20", colorClass: "bg-teal-500" },
  { name: "Fuchsia", bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200", darkBg: "dark:bg-fuchsia-500/10", darkText: "dark:text-fuchsia-400", darkBorder: "dark:border-fuchsia-500/20", colorClass: "bg-fuchsia-500" },
];

const ICON_PRESETS = [
  { name: "FileEdit", label: "Draft / Plan" },
  { name: "Play", label: "Active / Progress" },
  { name: "Clock", label: "Review / Queue" },
  { name: "AlertOctagon", label: "Blocked / Hold" },
  { name: "CheckCircle2", label: "Completed" },
  { name: "XCircle", label: "Cancelled" },
];

export function StatusSettingsPanel() {
  const {
    taskStatuses,
    addTaskStatus,
    updateTaskStatus,
    deleteTaskStatus,
    logActivity,
  } = useAppState();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedIcon, setSelectedIcon] = useState("FileEdit");
  const [isDefault, setIsDefault] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenNewForm = () => {
    setName("");
    setSelectedColorIndex(1); // default to brand
    setSelectedIcon("FileEdit");
    setIsDefault(false);
    setIsCompleted(false);
    setIsCancelled(false);
    setIsStarted(false);
    setEditingId(null);
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (status) => {
    setName(status.name);
    // Find color matching preset
    const colorIdx = COLOR_PRESETS.findIndex(
      (p) => p.bg === status.bg && p.text === status.text
    );
    setSelectedColorIndex(colorIdx !== -1 ? colorIdx : 0);
    setSelectedIcon(status.icon || "FileEdit");
    setIsDefault(!!status.isDefault);
    setIsCompleted(!!status.isCompleted);
    setIsCancelled(!!status.isCancelled);
    setIsStarted(!!status.isStarted);
    setEditingId(status.id);
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Status name is required.");
      return;
    }

    // Check if duplicate status name exists
    const duplicate = taskStatuses.find(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase() && s.id !== editingId
    );
    if (duplicate) {
      setErrorMessage("A task status with this name already exists.");
      return;
    }

    const color = COLOR_PRESETS[selectedColorIndex];
    const statusData = {
      name: name.trim(),
      bg: color.bg,
      text: color.text,
      border: color.border,
      darkBg: color.darkBg,
      darkText: color.darkText,
      darkBorder: color.darkBorder,
      icon: selectedIcon,
      isDefault,
      isCompleted,
      isCancelled,
      isStarted,
    };

    if (editingId) {
      updateTaskStatus(editingId, statusData);
    } else {
      addTaskStatus(statusData);
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id, statusName) => {
    if (confirm(`Are you sure you want to delete status '${statusName}'? All tasks under this status will be automatically reassigned to the default workspace status.`)) {
      deleteTaskStatus(id);
    }
  };

  const getIconElement = (iconName) => {
    switch (iconName) {
      case "FileEdit": return <FileEdit className="w-4 h-4" />;
      case "Play": return <Play className="w-4 h-4" />;
      case "Clock": return <Clock className="w-4 h-4" />;
      case "AlertOctagon": return <AlertOctagon className="w-4 h-4" />;
      case "CheckCircle2": return <CheckCircle2 className="w-4 h-4" />;
      case "XCircle": return <XCircle className="w-4 h-4" />;
      default: return <FileEdit className="w-4 h-4" />;
    }
  };

  const behaviorFlags = [
    {
      key: "default",
      checked: isDefault,
      onChange: (checked) => {
        setIsDefault(checked);
        if (checked) {
          setIsCompleted(false);
          setIsCancelled(false);
        }
      },
      title: "Set as workspace default",
      description: "Assigned immediately to new tasks on creation"
    },
    {
      key: "completed",
      checked: isCompleted,
      onChange: (checked) => {
        setIsCompleted(checked);
        if (checked) {
          setIsDefault(false);
          setIsCancelled(false);
          setIsStarted(false);
        }
      },
      title: "Treat as completed",
      description: "Classifies the task as done and resolves metric reports"
    },
    {
      key: "cancelled",
      checked: isCancelled,
      onChange: (checked) => {
        setIsCancelled(checked);
        if (checked) {
          setIsDefault(false);
          setIsCompleted(false);
          setIsStarted(false);
        }
      },
      title: "Treat as cancelled",
      description: "Excludes overdue flags and active notifications"
    },
    {
      key: "started",
      checked: isStarted,
      onChange: (checked) => {
        setIsStarted(checked);
        if (checked) {
          setIsCompleted(false);
          setIsCancelled(false);
        }
      },
      title: "Treat as active / started",
      description: "Classifies the task as currently in progress"
    }
  ];

  return (
    <div className="card p-3 sm:p-4 text-left space-y-2.5 sm:space-y-4" id="status-settings-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" /> Task Status Configurations
        </h3>
        {!isFormOpen && (
          <button
            type="button"
            onClick={handleOpenNewForm}
            className="btn btn-sm btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add status</span>
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
        Customize task workflows by editing states, colors, and behavior flags. Renaming an active status propagates immediately across all project tasks.
      </p>

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Form Section */}
      {isFormOpen && (
        <form onSubmit={handleFormSubmit} className="bg-zinc-50 dark:bg-zinc-800/40 p-3 sm:p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2.5 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
            {editingId ? "Edit status" : "Create custom status"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
            {/* Status Name */}
            <div>
              <label className="label" htmlFor="status-name-input">Status name *</label>
              <input
                id="status-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Backlog, Quality Check"
                className="field"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <span className="label">Icon</span>
              <div className="flex flex-wrap gap-1.5">
                {ICON_PRESETS.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => setSelectedIcon(icon.name)}
                    title={icon.label}
                    aria-label={icon.label}
                    aria-pressed={selectedIcon === icon.name}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      selectedIcon === icon.name
                        ? "bg-primary text-white border-primary"
                        : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {getIconElement(icon.name)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <span className="label">Color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color, index) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColorIndex(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors cursor-pointer relative ${
                    selectedColorIndex === index
                      ? "border-primary"
                      : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                  title={color.name}
                  aria-label={`${color.name} color`}
                  aria-pressed={selectedColorIndex === index}
                >
                  <span className={`w-5 h-5 rounded-full ${color.colorClass}`} />
                  {selectedColorIndex === index && (
                    <Check className="w-3 h-3 text-white absolute" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Behavioral Switches */}
          <div className="space-y-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <span className="label">Behavior flags</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {behaviorFlags.map((flag) => (
                <label key={flag.key} className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-2.5 py-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flag.checked}
                    onChange={(e) => flag.onChange(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">{flag.title}</span>
                    <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{flag.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn btn-sm btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-primary">
              {editingId ? "Update status" : "Save status"}
            </button>
          </div>
        </form>
      )}

      {/* Statuses List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 sm:divide-y-0 sm:space-y-2 pt-1">
        {taskStatuses?.map((status) => {
          const isSystem = !!status.system;
          return (
            <div
              key={status.id}
              className="flex justify-between items-center gap-3 px-0 py-2.5 border-0 bg-transparent rounded-none sm:p-3 sm:rounded-lg sm:bg-zinc-50 sm:dark:bg-zinc-800/40 sm:border sm:border-zinc-100 sm:dark:border-zinc-800 sm:hover:border-zinc-200 sm:dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-wrap">
                {/* Dynamic Preview */}
                <StatusBadge status={status.name} />

                {/* Properties badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {status.isDefault && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200/50 dark:border-blue-500/20">
                      Default
                    </span>
                  )}
                  {status.isCompleted && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200/50 dark:border-emerald-500/20">
                      Completed
                    </span>
                  )}
                  {status.isCancelled && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-300/50 dark:border-zinc-700">
                      Cancelled
                    </span>
                  )}
                  {status.isStarted && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-semibold bg-primary/8 dark:bg-primary/15 text-primary rounded border border-primary/20">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Action operations */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditForm(status)}
                  className="btn-icon h-8 w-8"
                  title="Edit status"
                  aria-label={`Edit ${status.name}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={status.isDefault || taskStatuses.length <= 1}
                  onClick={() => handleDelete(status.id, status.name)}
                  className="btn-icon h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 disabled:opacity-40 disabled:pointer-events-none"
                  title={
                    status.isDefault
                      ? "Cannot delete the workspace default status. Set another status as default first."
                      : "Delete status"
                  }
                  aria-label={`Delete ${status.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
