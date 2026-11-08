/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronDown, Check, List, LayoutGrid, X, Layers, CircleDot, Folder } from "lucide-react";

/** Chip that opens a small single-select menu. `options`: [{ value, label }]. */
/**
 * Filter chip with a dropdown. `clearable` (filters) shows "Label: value ×"
 * in the brand tint once set. Settings that always have a value (group by,
 * sort) pass `clearable={false}` and an `icon`: they render as a plain
 * dropdown "icon Label value ˅" with no clear button and no "any" row.
 */
export function ChipSelect({ label, value, options, onChange, allLabel = "Any", clearable = true, icon: Icon, align = "left" }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => String(o.value) === String(value));
  const active = clearable && value !== "" && value != null;
  const items = clearable ? [{ value: "", label: allLabel }, ...options] : options;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`chip ${active ? "chip-on" : ""} ${open ? "border-primary/50" : ""}`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
        {clearable ? (active ? `${label}: ${current?.label ?? value}` : label) : (
          <>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">{label}</span>
            <span className="text-primary dark:text-sky-300">{current?.label ?? allLabel}</span>
          </>
        )}
        {active ? (
          <X className="w-3.5 h-3.5" onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }} />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul role="listbox" className={`menu-panel absolute ${align === "right" ? "right-0" : "left-0"} top-8 z-40 min-w-[180px] max-h-64 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-150`}>
            {items.map((o) => {
              const sel = String(o.value) === String(value ?? "");
              return (
                <li key={String(o.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={sel}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`w-full flex items-center gap-2 h-8 px-2 rounded-md text-left text-[13px] font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${sel ? "text-primary font-bold" : "text-zinc-700 dark:text-zinc-200"}`}
                  >
                    {o.icon && <o.icon className="w-4 h-4 shrink-0 text-zinc-400" />}
                    {o.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.color }} />}
                    <span className="truncate flex-1">{o.label}</span>
                    {sel && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export const DUE_OPTIONS = [
  { value: "late", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "none", label: "No date" },
];

export const PRIORITY_OPTIONS = ["Urgent", "High", "Medium", "Low"].map((p) => ({ value: p, label: p }));

/**
 * One-line toolbar: optional scope segment · filter chips · (right) group-by
 * and list/board toggle. Wraps at phone width.
 */
export function TaskToolbar({
  scope, scopeOptions, onScope,
  filters, onFilter, projects = [], users = [], showProjectFilter = true, showAssigneeFilter = true,
  groupBy, onGroupBy, view, onView,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scopeOptions && (
        <>
          <div className="seg w-full sm:w-auto h-8 sm:h-7 [&>button]:flex-1 [&>button]:justify-center sm:[&>button]:flex-none" role="group" aria-label="Scope">
            {scopeOptions.map((o) => (
              <button key={o.value} type="button" aria-pressed={scope === o.value} onClick={() => onScope(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
          <span className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 hidden sm:block" />
        </>
      )}

      {showProjectFilter && (
        <ChipSelect
          label="Project"
          value={filters.projectId}
          onChange={(v) => onFilter({ projectId: v })}
          options={projects.map((p) => ({ value: p.id, label: p.name, color: p.color }))}
          allLabel="All projects"
        />
      )}
      {showAssigneeFilter && (
        <ChipSelect
          label="Assignee"
          value={filters.assigneeId}
          onChange={(v) => onFilter({ assigneeId: v })}
          options={users.map((u) => ({ value: u.id, label: u.name }))}
          allLabel="Anyone"
        />
      )}
      <ChipSelect label="Priority" value={filters.priority} onChange={(v) => onFilter({ priority: v })} options={PRIORITY_OPTIONS} allLabel="Any" />
      <ChipSelect label="Due" value={filters.due} onChange={(v) => onFilter({ due: v })} options={DUE_OPTIONS} allLabel="Any time" />

      <div className="ml-auto flex items-center gap-2">
        {onGroupBy && (
          <ChipSelect
            label="Group by"
            icon={Layers}
            clearable={false}
            align="right"
            value={groupBy}
            onChange={(v) => onGroupBy(v || "status")}
            options={[{ value: "status", label: "Status", icon: CircleDot }, { value: "project", label: "Project", icon: Folder }]}
            allLabel="Status"
          />
        )}
        {onView && (
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "list"} onClick={() => onView("list")} aria-label="List view" title="List">
              <List className="w-4 h-4" />
            </button>
            <button type="button" aria-pressed={view === "board"} onClick={() => onView("board")} aria-label="Board view" title="Board">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Apply the shared chip filters to a task array. */
export function applyTaskFilters(tasks, filters, taskStatuses) {
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const today = startOfDay(new Date());
  const DAY = 86400000;
  const doneNames = new Set(taskStatuses.filter((s) => s.isCompleted || s.isCancelled).map((s) => s.name));
  return tasks.filter((t) => {
    if (filters.projectId && String(t.projectId) !== String(filters.projectId)) return false;
    if (filters.assigneeId && String(t.assigneeId) !== String(filters.assigneeId)) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.due) {
      const due = t.dueDate ? startOfDay(t.dueDate) : null;
      const open = !doneNames.has(t.status);
      if (filters.due === "none" && due) return false;
      if (filters.due === "late" && !(due != null && due < today && open)) return false;
      if (filters.due === "today" && due !== today) return false;
      if (filters.due === "week" && !(due != null && due >= today && due < today + 7 * DAY)) return false;
    }
    return true;
  });
}
