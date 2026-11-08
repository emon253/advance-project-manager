/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";
import { useAppState } from "../../app/providers";
import { getIconComponent } from "./IconHelper";
import { UserAvatar } from "./UserAvatar";
import { statusDot, formatDue, isOpenTask } from "../../modules/Tasks/util/tasksUtils";

const LIMITS = { project: 4, task: 6, person: 3 };
const GROUP_LABELS = { project: "Projects", task: "Tasks", person: "People" };

/** Items whose `text` contains `q`, earliest match first (so prefixes rank on top), capped at `limit`. */
function rank(items, text, q, limit) {
  const hits = [];
  for (const item of items) {
    const at = (text(item) || "").toLowerCase().indexOf(q);
    if (at >= 0) hits.push([at, item]);
  }
  return hits.sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, item]) => item);
}

function Match({ text, q }) {
  const at = text.toLowerCase().indexOf(q);
  if (!q || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-primary dark:text-sky-300 font-bold">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/**
 * Top-bar search with suggestions as you type. Matches the projects, tasks
 * and people already loaded for the workspace, so typing costs no requests;
 * the deferred query keeps the input responsive while the list re-ranks.
 * ↑/↓ move, Enter opens, Esc closes, "/" focuses from anywhere. The last row
 * always opens the full search page.
 */
export function GlobalSearch() {
  const { activeWorkspaceProjects, activeWorkspaceTasks, users, taskStatuses, setActiveTaskId } = useAppState();
  const navigate = useNavigate();
  const listId = useId();
  const inputRef = useRef(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const q = useDeferredValue(value.trim().toLowerCase());

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Open tasks first, so the stable sort in rank() breaks ties in their favour.
  const tasksOpenFirst = useMemo(() => {
    const open = [];
    const closed = [];
    for (const t of activeWorkspaceTasks) (isOpenTask(t, taskStatuses) ? open : closed).push(t);
    return open.concat(closed);
  }, [activeWorkspaceTasks, taskStatuses]);

  const results = useMemo(() => {
    if (!q) return [];
    return [
      ...rank(activeWorkspaceProjects, (p) => p.name, q, LIMITS.project).map((p) => ({ kind: "project", key: `p${p.id}`, item: p })),
      ...rank(tasksOpenFirst, (t) => t.title, q, LIMITS.task).map((t) => ({ kind: "task", key: `t${t.id}`, item: t })),
      ...rank(users, (u) => u.name, q, LIMITS.person).map((u) => ({ kind: "person", key: `u${u.id}`, item: u })),
    ];
  }, [q, activeWorkspaceProjects, tasksOpenFirst, users]);

  useEffect(() => setActive(0), [q]);

  const rows = q ? [...results, { kind: "all", key: "all" }] : [];
  const showPanel = open && rows.length > 0;

  const close = () => { setOpen(false); inputRef.current?.blur(); };
  const choose = (row) => {
    if (!row) return;
    if (row.kind === "project") navigate(`/projects/${row.item.id}`);
    else if (row.kind === "task") setActiveTaskId(row.item.id);
    else if (row.kind === "person") navigate(`/my-tasks?scope=all&assignee=${row.item.id}`);
    else navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    setValue("");
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { if (value) setValue(""); else close(); return; }
    if (!showPanel) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % rows.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + rows.length) % rows.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(rows[active]); }
  };

  const projectName = (id) => activeWorkspaceProjects.find((p) => p.id === id)?.name;

  return (
    <div className="hidden md:block flex-1 max-w-[480px] relative" role="search">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel ? `${listId}-${active}` : undefined}
        aria-label="Search tasks, projects, people"
        placeholder="Search tasks, projects, people"
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full h-8 text-[13px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-primary text-zinc-800 dark:text-zinc-100 rounded-md pl-8 pr-14 outline-none transition-colors placeholder:text-zinc-400 font-medium"
      />
      {value && (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setValue("")} className="absolute right-8 top-1/2 -translate-y-1/2 btn-icon h-5 w-5" aria-label="Clear search">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center h-[18px] px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 pointer-events-none">/</kbd>

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          onMouseDown={(e) => e.preventDefault()}
          className="menu-panel absolute left-0 right-0 top-[calc(100%+6px)] z-50 min-w-[420px] max-h-[min(440px,70vh)] overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {results.length === 0 && (
            <li className="px-2.5 py-3 text-[13px] text-zinc-500 dark:text-zinc-400">No quick matches for “{value.trim()}”.</li>
          )}
          {rows.map((row, i) => {
            const groupStart = row.kind !== "all" && rows[i - 1]?.kind !== row.kind;
            const selected = i === active;
            const base = `w-full flex items-center gap-2.5 px-2.5 rounded-md text-left cursor-pointer ${selected ? "bg-primary/8 dark:bg-primary/15" : ""}`;
            return (
              <React.Fragment key={row.key}>
                {groupStart && (
                  <li role="presentation" className={`px-2.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 ${i > 0 ? "pt-2.5" : "pt-1"}`}>{GROUP_LABELS[row.kind]}</li>
                )}
                {row.kind === "all" && results.length > 0 && <li role="presentation" className="h-px bg-zinc-100 dark:bg-zinc-800 my-1.5" />}
                <li id={`${listId}-${i}`} role="option" aria-selected={selected} onMouseEnter={() => setActive(i)} onClick={() => choose(row)} className={`${base} ${row.kind === "task" ? "py-1.5" : "h-10"}`}>
                  {row.kind === "project" && (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${row.item.color}1f`, color: row.item.color }}>{getIconComponent(row.item.icon, "w-3.5 h-3.5")}</span>
                      <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-zinc-900 dark:text-white"><Match text={row.item.name} q={q} /></span>
                      <span className="text-[11px] font-medium text-zinc-400">{row.item.status === "Completed" ? "Closed" : row.item.status}</span>
                    </>
                  )}
                  {row.kind === "task" && (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusDot(row.item.status, taskStatuses) }} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-[13px] font-medium text-zinc-900 dark:text-white"><Match text={row.item.title} q={q} /></span>
                        <span className="block truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                          {[row.item.status, projectName(row.item.projectId), row.item.dueDate && `Due ${formatDue(row.item.dueDate)}`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </>
                  )}
                  {row.kind === "person" && (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center"><UserAvatar user={row.item} size="xs" /></span>
                      <span className="flex-1 min-w-0 truncate text-[13px] font-semibold text-zinc-900 dark:text-white"><Match text={row.item.name} q={q} /></span>
                      <span className="text-[11px] font-medium text-zinc-400">Their tasks</span>
                    </>
                  )}
                  {row.kind === "all" && (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-zinc-400"><Search className="w-4 h-4" /></span>
                      <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-zinc-700 dark:text-zinc-200">Search all tasks for “{value.trim()}”</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </>
                  )}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </div>
  );
}
