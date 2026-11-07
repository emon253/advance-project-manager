/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Archive, Trash2, LogOut, RotateCcw } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { ICON_OPTIONS, getIconComponent } from "../../../components/common/IconHelper";

/** Workspace name/icon/description, other workspaces, and the danger zone. */
export function WorkspaceGeneralSection() {
  const { activeWorkspace, workspaces, updateWorkspace, deleteWorkspace, leaveWorkspace, setActiveWorkspaceId, can, currentRole, projects, tasks } = useAppState();
  const navigate = useNavigate();
  const ws = activeWorkspace || {};
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("💼");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'archive' | 'delete' | 'leave'
  const [error, setError] = useState("");

  useEffect(() => {
    setName(ws.name || ""); setLogo(ws.logo || "💼"); setDescription(ws.description || "");
  }, [ws.id, ws.name, ws.logo, ws.description]);

  const canEdit = can("manageWorkspace");
  const isOwner = currentRole === "Owner";
  const others = workspaces.filter((w) => w.id !== ws.id);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await updateWorkspace(ws.id, { name: name.trim(), logo, description: description.trim() });
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const archive = async () => {
    const active = workspaces.filter((w) => !w.isArchived);
    if (active.length <= 1) { setError("You can't archive your only active workspace."); setConfirm(null); return; }
    const ok = await updateWorkspace(ws.id, { isArchived: true });
    setConfirm(null);
    if (ok) { const next = active.find((w) => w.id !== ws.id); if (next) setActiveWorkspaceId(next.id); }
  };
  const remove = async () => {
    const res = await deleteWorkspace(ws.id);
    setConfirm(null);
    if (res?.error) setError(res.error); else navigate("/today");
  };
  const leave = async () => {
    const res = await leaveWorkspace(ws.id);
    setConfirm(null);
    if (res?.error) setError(res.error); else navigate("/today");
  };

  return (
    <>
      <form onSubmit={save} className="card p-3">
        <div className="flex items-center mb-3">
          <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white">Workspace</h2>
          <span className="ml-auto text-[10px] font-mono text-zinc-400">#{ws.id}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3">
          <div>
            <span className="label">Icon</span>
            <div className="flex items-start gap-2">
              <span className="h-8 w-8 rounded-md bg-primary/8 dark:bg-primary/15 text-primary flex items-center justify-center shrink-0">{getIconComponent(logo, "w-4 h-4")}</span>
              <div role="radiogroup" aria-label="Workspace icon" className="grid grid-cols-8 sm:grid-cols-5 gap-1">
                {ICON_OPTIONS.map(({ key, Icon, label }) => (
                  <button key={key} type="button" role="radio" aria-checked={logo === key} disabled={!canEdit} title={label} aria-label={label} onClick={() => setLogo(key)}
                    className={`h-7 w-7 flex items-center justify-center rounded-md border cursor-pointer disabled:opacity-50 ${logo === key ? "bg-primary/8 border-primary/40 text-primary" : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div>
              <label htmlFor="ws-name" className="label">Name</label>
              <input id="ws-name" type="text" required disabled={!canEdit} value={name} onChange={(e) => setName(e.target.value)} className="field disabled:opacity-60" />
            </div>
            <div>
              <label htmlFor="ws-desc" className="label">Description</label>
              <textarea id="ws-desc" rows={2} disabled={!canEdit} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this workspace is for" className="field disabled:opacity-60" />
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {saved && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Saved</span>}
            <button type="submit" className="btn btn-primary">Save changes</button>
          </div>
        )}
      </form>

      <div className="card p-3">
        <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-2">Other workspaces</h2>
        {others.length === 0 ? <p className="text-xs text-zinc-400">You're only in this workspace. Create another from the account menu.</p> : (
          <div className="flex flex-col">
            {others.map((w) => {
              const wsProjects = projects.filter((p) => p.workspaceId === w.id).length;
              return (
                <div key={w.id} className="flex items-center gap-2.5 h-10 border-t border-zinc-100 dark:border-zinc-800 first:border-t-0">
                  <span className="h-7 w-7 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0">{getIconComponent(w.logo, "w-3.5 h-3.5")}</span>
                  <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">{w.name}<span className="ml-2 text-xs font-medium text-zinc-400">{w.memberCount || 0} members{wsProjects ? ` · ${wsProjects} projects` : ""}{w.isArchived ? " · archived" : ""}</span></span>
                  {w.isArchived ? (
                    <button type="button" onClick={() => updateWorkspace(w.id, { isArchived: false })} className="btn btn-sm btn-secondary"><RotateCcw className="w-3.5 h-3.5" /> Restore</button>
                  ) : (
                    <button type="button" onClick={() => setActiveWorkspaceId(w.id)} className="btn btn-sm btn-secondary">Switch</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(can("archiveWorkspace") || can("deleteWorkspace") || !isOwner) && (
        <div className="card p-3 border-rose-200/70 dark:border-rose-900/50">
          <h2 className="text-[15px] font-bold text-rose-700 dark:text-rose-400 mb-1">Danger zone</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">Archiving hides the workspace and can be undone. Deleting removes its {projects.filter((p) => p.workspaceId === ws.id).length} projects and {tasks.length} tasks for good.</p>
          {error && <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-2">{error}</p>}
          {confirm ? (
            <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-md bg-rose-50 dark:bg-rose-500/10">
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex-1">
                {confirm === "archive" ? `Archive '${ws.name}'?` : confirm === "delete" ? `Delete '${ws.name}' permanently? This cannot be undone.` : `Leave '${ws.name}'? You'll lose access to its projects.`}
              </p>
              <button type="button" onClick={() => setConfirm(null)} className="btn btn-sm btn-secondary">Cancel</button>
              <button type="button" onClick={confirm === "archive" ? archive : confirm === "delete" ? remove : leave} className="btn btn-sm btn-danger">{confirm === "archive" ? "Archive" : confirm === "delete" ? "Delete" : "Leave"}</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {can("archiveWorkspace") && <button type="button" onClick={() => { setError(""); setConfirm("archive"); }} className="btn btn-secondary text-amber-700 dark:text-amber-400"><Archive className="w-4 h-4" /> Archive workspace</button>}
              {can("deleteWorkspace") && <button type="button" onClick={() => { setError(""); setConfirm("delete"); }} className="btn btn-danger-soft"><Trash2 className="w-4 h-4" /> Delete workspace</button>}
              {!isOwner && <button type="button" onClick={() => { setError(""); setConfirm("leave"); }} className="btn btn-danger-soft"><LogOut className="w-4 h-4" /> Leave workspace</button>}
            </div>
          )}
          {isOwner && <p className="text-[11px] text-zinc-400 mt-2">To leave, transfer ownership from Members first.</p>}
        </div>
      )}
    </>
  );
}
