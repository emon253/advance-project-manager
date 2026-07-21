/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { AIEnhanceButton } from "../../../components/common/AIEnhanceButton";

/**
 * Trello-inspired checklist block for a single task: a header with Hide
 * checked items / Delete (clear-all, inline-confirmed), a progress bar, flat
 * item rows (strikethrough on completion), and an on-demand "Add an item"
 * row. Reads its data from the passed `task.checklist` and drives every
 * mutation through the provider, so it renders identically in the task drawer
 * and inline in the Tasks Lineup.
 *
 * Key it by task.id at the call site so the local add/confirm state resets
 * when the task changes (or the row collapses).
 */
export function TaskChecklist({ task, showTitle = true }) {
  const { addChecklistItem, toggleChecklistItem, deleteChecklistItem, can } = useAppState();
  const [inlineTitle, setInlineTitle] = useState("");
  const [hideChecked, setHideChecked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const editable = can("editTasks");
  const items = task.checklist || [];
  const done = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    addChecklistItem(task.id, inlineTitle.trim());
    setInlineTitle("");
    // Stays open (Trello's pattern) for rapid successive adds.
  };

  const handleClear = async () => {
    setClearing(true);
    await Promise.all(items.map((cli) => deleteChecklistItem(task.id, cli.id)));
    setClearing(false);
    setConfirmClear(false);
  };

  return (
    <div>
      {/* Header: optional title + Hide checked items / Delete (Trello's per-checklist bar) */}
      {(showTitle || (editable && items.length > 0)) && (
        <div className="flex items-center justify-between gap-2 mb-2">
          {showTitle
            ? <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Checklist</span>
            : <span />}
          {editable && items.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {done > 0 && (
                <button
                  type="button"
                  onClick={() => setHideChecked((v) => !v)}
                  className="btn btn-secondary btn-sm h-7 px-2.5 text-[11px]"
                >
                  {hideChecked ? "Show checked items" : "Hide checked items"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="btn btn-secondary btn-sm h-7 px-2.5 text-[11px]"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className={`font-mono font-tnum font-semibold ${progress === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Inline "delete whole checklist" confirmation */}
      {confirmClear && (
        <div className="flex items-center justify-between gap-2 p-2.5 mb-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
          <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
            Delete all {items.length} checklist items? This can't be undone.
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => setConfirmClear(false)} className="btn btn-secondary btn-sm h-7 px-2.5 text-[11px]">
              Cancel
            </button>
            <button type="button" onClick={handleClear} disabled={clearing} className="btn btn-danger-soft btn-sm h-7 px-2.5 text-[11px]">
              {clearing ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">No checklist items yet.</p>
      ) : (
        <div className="space-y-0.5">
          {items
            .filter((cli) => !hideChecked || !cli.completed)
            .map((cli) => (
              <div
                key={cli.id}
                className="group/cl flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={cli.completed}
                  disabled={!editable}
                  onChange={() => toggleChecklistItem(task.id, cli.id)}
                  aria-label={`Mark "${cli.title}" ${cli.completed ? "incomplete" : "complete"}`}
                  className="w-4.5 h-4.5 text-primary border-zinc-300 dark:border-zinc-600 rounded cursor-pointer shrink-0 bg-transparent focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`flex-1 min-w-0 text-sm font-medium truncate ${cli.completed ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}>
                  {cli.title}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => deleteChecklistItem(task.id, cli.id)}
                    className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 opacity-0 group-hover/cl:opacity-100 focus-visible:opacity-100"
                    aria-label="Delete checklist item"
                    title="Delete checklist item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* On-demand "Add an item" row (Trello's pattern: a button until clicked) */}
      {editable && (
        adding ? (
          <form onSubmit={handleAdd} className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Add an item…"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setAdding(false); }}
                aria-label="New checklist item"
                className="field flex-1"
              />
              <AIEnhanceButton value={inlineTitle} onEnhance={setInlineTitle} type="checklist" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="btn btn-primary btn-sm">Add</button>
              <button
                type="button"
                onClick={() => { setAdding(false); setInlineTitle(""); }}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn btn-secondary btn-sm mt-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            Add an item
          </button>
        )
      )}
    </div>
  );
}
