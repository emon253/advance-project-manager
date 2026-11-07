/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { useAppState } from "../../../app/providers";

/**
 * Compact checklist block: header with "n / total" and a progress bar, 30px
 * item rows (strikethrough when done, delete on hover), and an "Add item"
 * link that swaps in an input (stays open for rapid adds). Key it by task.id.
 */
export function TaskChecklist({ task }) {
  const { addChecklistItem, toggleChecklistItem, deleteChecklistItem, can } = useAppState();
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const editable = can("editTasks");
  const items = task.checklist || [];
  const done = items.filter((i) => i.completed).length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addChecklistItem(task.id, draft.trim());
    setDraft("");
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">
          Checklist{items.length > 0 && <span className="ml-1.5 font-semibold text-zinc-400 font-tnum">{done} / {items.length}</span>}
        </h3>
        {items.length > 0 && (
          <span className="flex-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <span className={`block h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${progress}%` }} />
          </span>
        )}
      </div>

      {items.map((item) => (
        <label key={item.id} className="group/ck flex items-center gap-2.5 h-[30px] px-1 -mx-1 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
          <input
            type="checkbox"
            checked={item.completed}
            disabled={!editable}
            onChange={() => toggleChecklistItem(task.id, item.id)}
            className="cb"
          />
          <span className={`flex-1 min-w-0 text-[13px] font-medium truncate ${item.completed ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-100"}`}>
            {item.title}
          </span>
          {editable && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); deleteChecklistItem(task.id, item.id); }}
              className="btn-icon h-6 w-6 opacity-0 group-hover/ck:opacity-100 focus-visible:opacity-100 text-zinc-400 hover:text-rose-600"
              aria-label={`Delete ${item.title}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </label>
      ))}

      {editable && (adding ? (
        <form onSubmit={submit} className="flex items-center gap-1.5 mt-1">
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setAdding(false); setDraft(""); } }}
            onBlur={() => { if (!draft.trim()) setAdding(false); }}
            placeholder="Add an item… Enter to add, Esc to close"
            aria-label="New checklist item"
            className="field h-[30px]"
          />
          <button type="submit" className="btn btn-sm btn-primary">Add</button>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 h-7 text-xs font-semibold text-primary hover:underline cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      ))}
    </div>
  );
}
