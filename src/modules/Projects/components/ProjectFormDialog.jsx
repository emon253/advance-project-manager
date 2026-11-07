/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { ICON_OPTIONS } from "../../../components/common/IconHelper";
import { RichTextEditor } from "../../../components/common/RichText/RichTextEditor";
import { richTextToPlain, plainToRichText } from "../../../components/common/RichText/sanitizeHtml";

const COLORS = ["#533afd", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];
const STATUSES = ["Planning", "Active", "On Hold", "Completed"];

/**
 * Create / edit project dialog. Owns its own form state; `project` switches it
 * to edit mode. Escape and the backdrop close it.
 */
export function ProjectFormDialog({ isOpen, onClose, onCreate, onUpdate, project }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏎️");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("Planning");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(project?.name || "");
    setIcon(project?.icon || "🏎️");
    setDescription(project?.description || "");
    setColor(project?.color || COLORS[0]);
    setDeadline(project?.deadline ? String(project.deadline).slice(0, 10) : "");
    setStatus(project?.status || "Planning");
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const fields = { name: name.trim(), description, icon, color, deadline: deadline ? new Date(deadline).toISOString() : null };
    if (project) await onUpdate(project.id, { ...fields, status });
    else await onCreate(fields);
    setBusy(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="modal-panel sm:max-w-lg" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
        <div className="sheet-grabber" />
        <div className="flex items-center justify-between px-4 h-11 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h3 id="project-form-title" className="text-[13px] font-bold text-zinc-900 dark:text-white">{project ? "Edit project" : "New project"}</h3>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-left">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="pf-name" className="label mb-0">Name</label>
              <AIEnhanceButton value={name} onEnhance={setName} type="title" />
            </div>
            <input id="pf-name" type="text" required autoFocus placeholder="e.g. Sales invoice syncing" value={name} onChange={(e) => setName(e.target.value)} className="field mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label" id="pf-icon-label">Icon</span>
              <div role="radiogroup" aria-labelledby="pf-icon-label" className="flex flex-wrap gap-1">
                {ICON_OPTIONS.map(({ key, Icon, label }) => (
                  <button key={key} type="button" role="radio" aria-checked={icon === key} title={label} aria-label={label} onClick={() => setIcon(key)}
                    className={`h-7 w-7 flex items-center justify-center rounded-md border cursor-pointer ${icon === key ? "bg-primary/8 border-primary/40 text-primary" : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Colour</span>
              <div className="flex items-center gap-1.5 h-7" role="radiogroup" aria-label="Accent colour">
                {COLORS.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} onClick={() => setColor(c)} style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-full cursor-pointer ${color === c ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900" : ""}`} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="pf-brief" className="label mb-0">Description</label>
              <AIEnhanceButton value={richTextToPlain(description)} onEnhance={(t) => setDescription(plainToRichText(t))} type="description" />
            </div>
            <div className="mt-1"><RichTextEditor id="pf-brief" value={description} onChange={setDescription} placeholder="What is this project for?" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pf-deadline" className="label">Due date</label>
              <input id="pf-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="field" />
            </div>
            {project && (
              <div>
                <label htmlFor="pf-status" className="label">Status</label>
                <select id="pf-status" value={status} onChange={(e) => setStatus(e.target.value)} className="field">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  {project.status === "Archived" && <option value="Archived">Archived</option>}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1 sm:flex-none">Cancel</button>
          <button type="submit" disabled={busy || !name.trim()} className="btn btn-primary flex-1 sm:flex-none">{project ? "Save changes" : "Create project"}</button>
        </div>
      </form>
    </div>
  );
}
