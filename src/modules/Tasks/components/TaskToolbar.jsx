/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * Filter dropdown. `options`: [{ value, label }]. `clearable` (filters) shows
 * "Label: value ×" in the brand tint once set; with `showAll` an unset filter
 * reads "Label All" so the default is said out loud. Settings that always
 * have a value (sort) pass `clearable={false}` and an `icon`: they render as
 * "icon Label value ˅" with no clear button and no "any" row.
 */
export function ChipSelect({ label, value, options, onChange, allLabel = "Any", clearable = true, showAll = false, icon: Icon, align = "left" }) {
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
        {clearable ? (active ? `${label}: ${current?.label ?? value}` : showAll ? <>{label} <span className="text-primary dark:text-sky-300">All</span></> : label) : (
          <>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">{label}</span>
            <span className="text-primary dark:text-sky-300">{current?.label ?? allLabel}</span>
          </>
        )}
        {active ? (
          <X className="w-3.5 h-3.5" onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }} />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul role="listbox" className={`menu-panel absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1 z-40 min-w-[180px] max-h-64 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-150`}>
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
 * One-line toolbar: `lead` (a scope segment or the page tabs) · Status (All by
 * default) · Project · Assignee · Priority · Due.
 * Wraps at phone width. `filtersHidden` leaves only the lead.
 */
export function TaskToolbar({
  lead, filters, onFilter, statuses = [], projects = [], users = [], showProjectFilter = true, showAssigneeFilter = true, filtersHidden = false,
}) {
  if (filtersHidden) return <div className="flex flex-wrap items-center gap-2">{lead}</div>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {lead}
      {lead && <span className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1 hidden sm:block" />}

      <ChipSelect label="Status" showAll value={filters.status} onChange={(v) => onFilter({ status: v })} options={statuses.map((s) => ({ value: s.name, label: s.name }))} allLabel="All" />
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
    if (filters.status && t.status !== filters.status) return false;
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
