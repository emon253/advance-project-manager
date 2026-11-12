/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronUp, Link2, MessageSquare, Plus, X } from "lucide-react";
import { EVIDENCE_MAX, evidenceLines, parseEvidence } from "../util/tasksUtils";

/**
 * Evidence, expanded: each line of the task's `evidence` text is one item (a
 * link or a note) with a remove button, plus an input that appends a line on
 * Enter. Shown on status pages, so the wording here is what visitors read.
 */
export function TaskEvidence({ task, canEdit, onChange, onHide }) {
  const [draft, setDraft] = useState("");
  const lines = evidenceLines(task.evidence);
  const save = (next) => onChange(next.join("\n"));

  const add = (e) => {
    e.preventDefault();
    const value = draft.replace(/\s+/g, " ").trim();
    if (!value || [...lines, value].join("\n").length > EVIDENCE_MAX) return;
    save([...lines, value]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="text-[13.5px] md:text-[13px] font-bold tracking-normal text-zinc-900 dark:text-white">Evidence</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Shown on status pages</span>
        <button type="button" onClick={onHide} aria-label="Hide evidence" className="btn-icon h-7 w-7 ml-auto"><ChevronUp className="w-3.5 h-3.5" strokeWidth={2.2} /></button>
      </div>
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-[13px]">
        {lines.map((line, i) => {
          const item = parseEvidence(line);
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${i}-${line}`} className="group/ev flex items-center gap-2.5 min-h-10 pl-3 pr-1.5 py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
              {item.url ? (
                <>
                  <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-primary hover:text-primary-hover dark:text-sky-300 truncate">{item.label}</a>
                  <span className="flex-1 min-w-0 text-xs text-zinc-500 dark:text-zinc-400 truncate">{item.host}</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="flex-1 min-w-0 break-words text-zinc-800 dark:text-zinc-200">{item.note}</span>
                </>
              )}
              {canEdit && (
                <button type="button" onClick={() => save(lines.filter((_, n) => n !== i))} aria-label={`Remove evidence: ${item.label || item.note}`} className="btn-icon h-7 w-7 md:opacity-0 md:group-hover/ev:opacity-100 focus-visible:opacity-100 hover:text-rose-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
        {canEdit ? (
          <form onSubmit={add} className="flex items-center gap-2.5 min-h-10 px-3">
            <Plus className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={2.2} />
            <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Add evidence" placeholder="Paste a link or write a note, then Enter"
              className="flex-1 min-w-0 h-9 bg-transparent outline-none text-base md:text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400" />
          </form>
        ) : lines.length === 0 && <p className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400">No evidence yet.</p>}
      </div>
    </div>
  );
}
