/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";
import { ArrowRight, Calendar, Check, ChevronDown, Flag, Plus, Search, X } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { statusTint } from "../../../components/common/StatusBadge";
import { PRIORITY_TONE } from "../../../components/common/PriorityBadge";
import { Assignees, personAvatar } from "./Assignees";
import { OWNER_NOTE_MAX, daysLate, dueState, shortDate, taskAssignees, typedNames } from "../util/tasksUtils";

/* The drawer's 2x2 field grid: label above, one 40px button (44px on phones)
   showing the value, a small popover to change it. */

const BOX = "w-full h-11 md:h-10 flex items-center gap-2 px-2.5 border rounded-lg text-[13px] text-left whitespace-nowrap overflow-hidden transition-[border-color,box-shadow] enabled:cursor-pointer";
const PLAIN = "bg-white dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-zinc-100";
const edge = (open) => (open ? "border-primary ring-[3px] ring-primary/15" : "border-zinc-200 dark:border-zinc-700 enabled:hover:border-zinc-300 dark:enabled:hover:border-zinc-600");
const OPTION = "w-full flex items-center gap-2.5 min-h-11 md:min-h-9 px-2 rounded-md text-left text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer";

/** Label + trigger + popover. Escape closes the popover (and not the drawer). */
function Field({ label, open, setOpen, align = "left", width = "w-56", trigger, children }) {
  const id = useId();
  return (
    <div
      className="relative min-w-0 flex flex-col gap-1.5"
      onKeyDown={(e) => { if (open && e.key === "Escape") { e.stopPropagation(); setOpen(false); } }}
    >
      <span id={id} className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{label}</span>
      {trigger(id)}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={`menu-panel rounded-[10px] absolute z-50 top-full mt-2 ${align === "right" ? "right-0" : "left-0"} ${width} max-w-[calc(100vw-16px)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export function StatusField({ task, taskStatuses, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label="Status" open={open} setOpen={setOpen} trigger={(id) => (
      <button type="button" aria-labelledby={id} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}
        className={`${BOX} font-bold ${statusTint(task.status, taskStatuses)} ${open ? "border-primary ring-[3px] ring-primary/15" : "border-transparent"}`}>
        <span className="w-2 h-2 rounded-full bg-current shrink-0" />
        <span className="truncate">{task.status}</span>
        {!disabled && <ChevronDown className="ml-auto w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />}
      </button>
    )}>
      <ul role="listbox" aria-label="Status" className="p-1.5 max-h-72 overflow-y-auto">
        {taskStatuses.map((s) => (
          <li key={s.id}>
            <button type="button" role="option" aria-selected={s.name === task.status} onClick={() => { setOpen(false); if (s.name !== task.status) onChange(s.name); }} className={OPTION}>
              <span className={`inline-flex items-center gap-1.5 h-6 px-[9px] rounded-full text-xs font-bold min-w-0 ${statusTint(s.name, taskStatuses)}`}>
                <span className="w-2 h-2 rounded-full bg-current shrink-0" /><span className="truncate">{s.name}</span>
              </span>
              {s.name === task.status && <Check className="ml-auto w-4 h-4 text-primary shrink-0" strokeWidth={2.4} />}
            </button>
          </li>
        ))}
      </ul>
    </Field>
  );
}

export function PriorityField({ task, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const current = task.priority || "Medium";
  const item = (p) => <span className={`inline-flex items-center gap-[7px] ${(PRIORITY_TONE[p] || PRIORITY_TONE.Medium).text}`}><Flag className="w-3.5 h-3.5" />{p}</span>;
  return (
    <Field label="Priority" open={open} setOpen={setOpen} align="right" width="w-44" trigger={(id) => (
      <button type="button" aria-labelledby={id} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)} className={`${BOX} ${PLAIN} ${edge(open)}`}>
        {item(current)}
      </button>
    )}>
      <ul role="listbox" aria-label="Priority" className="p-1.5">
        {["Urgent", "High", "Medium", "Low"].map((p) => (
          <li key={p}>
            <button type="button" role="option" aria-selected={p === current} onClick={() => { setOpen(false); if (p !== current) onChange(p); }} className={OPTION}>
              {item(p)}
              {p === current && <Check className="ml-auto w-4 h-4 text-primary shrink-0" strokeWidth={2.4} />}
            </button>
          </li>
        ))}
      </ul>
    </Field>
  );
}

const day = (v) => (v ? String(v).slice(0, 10) : "");

/** One field for both dates: "start → due", with a tinted chip when due today or overdue. */
export function DatesField({ task, taskStatuses, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const due = dueState(task, taskStatuses);
  const muted = "font-medium text-zinc-500 dark:text-zinc-400";
  const dateInput = "field h-10 text-base md:text-[13px] font-semibold";
  return (
    <Field label="Dates" open={open} setOpen={setOpen} width="w-64" trigger={(id) => (
      <button type="button" aria-labelledby={id} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)} className={`${BOX} ${PLAIN} ${edge(open)}`}>
        <Calendar className="hidden md:block w-3.5 h-3.5 text-zinc-500 shrink-0" />
        {task.startDate && <>{shortDate(task.startDate)}<ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" /></>}
        {task.dueDate
          ? <span className="truncate">{!task.startDate && <span className={muted}>Due </span>}{shortDate(task.dueDate)}</span>
          : <span className={`truncate ${muted}`}>Add due<span className="hidden md:inline"> date</span></span>}
        {due === "today" && <span className="inline-flex items-center h-5 px-[7px] rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 text-[11px] font-bold shrink-0">Due today</span>}
        {due === "late" && <span className="inline-flex items-center h-5 px-[7px] rounded-full bg-[#fde8e8] text-red-700 dark:bg-red-500/10 dark:text-red-400 text-[11px] font-bold shrink-0">{daysLate(task.dueDate)}</span>}
      </button>
    )}>
      <div className="p-3 flex flex-col gap-3" role="dialog" aria-label="Dates">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Start
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input type="date" autoFocus value={day(task.startDate)} max={day(task.dueDate) || undefined}
            onChange={(e) => onChange({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null })} className={dateInput} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Due
          <input type="date" value={day(task.dueDate)} min={day(task.startDate) || undefined}
            onChange={(e) => onChange({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })} className={dateInput} />
        </label>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary self-end">Done</button>
      </div>
    </Field>
  );
}

/**
 * The one Assignee field. The picker assigns a workspace member (the API
 * holds one member per task, so picking another replaces them) and any
 * number of typed names for people without a Hub account; names are stored
 * in `ownerNote` as "Jim, Ollie". `onChange` gets a task patch.
 */
export function AssigneeField({ task, members, users, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const people = taskAssignees(task, users);
  const names = typedNames(task.ownerNote);

  const text = query.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const q = text.toLowerCase();
  const matches = members.filter((u) => (u.name || "").toLowerCase().includes(q));
  const exactMember = members.find((u) => (u.name || "").toLowerCase() === q);
  const isNew = !!text && !exactMember && !names.some((n) => n.toLowerCase() === q);
  const fits = [...names, text].join(", ").length <= OWNER_NOTE_MAX;

  const toggleMember = (u) => { onChange({ assigneeId: task.assigneeId === u.id ? null : u.id }); setQuery(""); };
  const setNames = (next) => onChange({ ownerNote: next.join(", ") });
  const addName = () => { if (isNew && fits) { setNames([...names, text]); setQuery(""); } };
  const remove = (p) => (p.user ? onChange({ assigneeId: null }) : setNames(names.filter((n) => n !== p.name)));
  const close = (v) => { setOpen(v); setQuery(""); };

  return (
    <Field label="Assignee" open={open} setOpen={close} align="right" width="w-[340px]" trigger={(id) => (
      <button type="button" aria-labelledby={id} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} onClick={() => close(!open)} className={`${BOX} ${PLAIN} pl-[7px] ${edge(open)}`}>
        <Assignees people={people} empty={<span className="pl-[3px] font-medium text-zinc-500 dark:text-zinc-400">{disabled ? "Unassigned" : "Assign"}</span>} />
      </button>
    )}>
      <div role="dialog" aria-label="Assign people">
        <div className="flex items-center gap-2 h-10 px-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-[15px] h-[15px] text-zinc-500 shrink-0" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input type="text" autoFocus value={query} maxLength={60} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (exactMember) toggleMember(exactMember); else addName(); } }}
            aria-label="Search people or type a name" placeholder="Search people or type a name"
            className="flex-1 min-w-0 h-9 bg-transparent outline-none text-base md:text-sm font-semibold text-zinc-900 dark:text-white placeholder:font-medium placeholder:text-zinc-400" />
        </div>
        <div className="p-1.5 flex flex-col gap-px max-h-[320px] overflow-y-auto">
          <span className="px-2 pt-1.5 pb-1 text-[11px] font-bold tracking-[0.06em] uppercase text-zinc-500 dark:text-zinc-400">People in this workspace</span>
          {matches.map((u) => (
            <button key={u.id} type="button" aria-pressed={task.assigneeId === u.id} onClick={() => toggleMember(u)} className={`${OPTION} min-h-11 md:min-h-11`}>
              <UserAvatar user={u} size="xs" />
              <span className="flex-1 truncate">{u.name}</span>
              {task.assigneeId === u.id && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.4} aria-label="Selected" />}
            </button>
          ))}
          {matches.length === 0 && <span className="px-2 py-2 text-[13px] text-zinc-500 dark:text-zinc-400">Nobody here matches “{text}”.</span>}
          {isNew && (
            <>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-0.5 my-[5px]" />
              <button type="button" onClick={addName} disabled={!fits} className="flex items-center gap-2.5 min-h-12 px-2 rounded-md bg-primary/[0.07] dark:bg-primary/15 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="w-[26px] h-[26px] rounded-full border-[1.5px] border-dashed border-primary text-primary flex items-center justify-center shrink-0"><Plus className="w-[13px] h-[13px]" strokeWidth={2.4} /></span>
                <span className="flex-1 min-w-0 flex flex-col gap-px">
                  <span className="text-[13.5px] font-bold text-[#0058b3] dark:text-sky-300 truncate">Add “{text}” as a name</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{fits ? "For someone without a Hub account" : "No room for another name on this task"}</span>
                </span>
                <span className="inline-flex items-center h-5 px-1.5 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">Enter</span>
              </button>
            </>
          )}
        </div>
        {people.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 mr-0.5">Assigned</span>
            {people.map((p) => (
              <span key={p.key} className="inline-flex items-center gap-1.5 h-6 pl-[3px] pr-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-full">
                <UserAvatar user={personAvatar(p)} size="2xs" />
                <span className="truncate">{p.name.split(" ")[0]}</span>
                <button type="button" onClick={() => remove(p)} aria-label={`Remove ${p.name}`} className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"><X className="w-[11px] h-[11px]" strokeWidth={2.6} /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}
