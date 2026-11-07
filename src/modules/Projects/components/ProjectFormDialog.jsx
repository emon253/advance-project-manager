/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { X, Sparkles, Calendar } from "lucide-react";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";
import { RichTextEditor } from "../../../components/common/RichText/RichTextEditor";
import { richTextToPlain, plainToRichText } from "../../../components/common/RichText/sanitizeHtml";

const STATUSES = ["Planning", "Active", "On Hold", "Completed"];

/**
 * Create / edit project. Two fields that matter (name, what it's for), a due
 * date, and on edit the status. Icon and colour are not asked for: the model
 * picks them from the name and description right after creation.
 */
export function ProjectFormDialog({ isOpen, onClose, onCreate, onUpdate, project }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("Planning");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(project?.name || "");
    setDescription(project?.description || "");
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
    const fields = { name: name.trim(), description, deadline: deadline ? new Date(deadline).toISOString() : null };
    if (project) await onUpdate(project.id, { ...fields, status });
    else await onCreate(fields);
    setBusy(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="modal-panel sm:max-w-[520px]" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
        <div className="sheet-grabber" />
        <div className="flex items-center justify-between px-5 h-12 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h3 id="project-form-title" className="text-sm font-bold text-zinc-900 dark:text-white">{project ? "Edit project" : "New project"}</h3>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 text-left">
          <div>
            <label htmlFor="pf-name" className="label">Project name</label>
            <div className="flex items-center gap-2">
              <input id="pf-name" type="text" required autoFocus maxLength={120} placeholder="e.g. Auction bidding go-live" value={name} onChange={(e) => setName(e.target.value)} className="field h-9 text-sm font-semibold" />
              <AIEnhanceButton value={name} onEnhance={setName} type="title" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="pf-brief" className="label mb-0">What is it for?</label>
              <AIEnhanceButton value={richTextToPlain(description)} onEnhance={(t) => setDescription(plainToRichText(t))} type="description" />
            </div>
            <RichTextEditor id="pf-brief" value={description} onChange={setDescription} placeholder="One or two lines on the goal, so the team (and the AI) know what this is." />
          </div>

          <div className={`grid gap-3 ${project ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
            <div>
              <label htmlFor="pf-deadline" className="label">Due date <span className="normal-case tracking-normal font-medium text-zinc-400">optional</span></label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input id="pf-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="field pl-8" />
              </div>
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

          {!project && (
            <p className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed rounded-md bg-primary/[0.04] dark:bg-primary/10 px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>The icon and colour are picked for you from the name and description, so each project looks distinct. You can change them later.</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={busy || !name.trim()} className="btn btn-primary min-w-[120px]">{busy ? "Saving…" : project ? "Save changes" : "Create project"}</button>
        </div>
      </form>
    </div>
  );
}
