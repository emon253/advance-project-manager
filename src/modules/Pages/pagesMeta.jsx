/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles } from "lucide-react";

/** The built-in page designs, in the order they are offered. `thumb` is the small drawn preview. */
export const TEMPLATES = [
  { key: "ACTIVE_TASKS", name: "Active tasks table", blurb: "Status counts, tabs per person, evidence links", short: "Like your Active Tasks sheet", defaultTitle: "Active Tasks" },
  { key: "WEEKLY_STATUS", name: "Weekly status", blurb: "Done this week, up next, blockers", short: "Done, next, blockers", defaultTitle: "Weekly status" },
  { key: "TEAM_WORKLOAD", name: "Team workload", blurb: "Open and overdue work per person", short: "Work per person", defaultTitle: "Team workload" },
  { key: "PROJECT_ONE_PAGER", name: "Project one-pager", blurb: "Progress, milestones and risks for one project", short: "One project at a glance", defaultTitle: "Project status" },
  { key: "BLANK", name: "Start blank", blurb: "Tell Cortex what you want to show", short: "Describe it to Cortex", defaultTitle: "New page" },
];

export const templateOf = (key) => TEMPLATES.find((t) => t.key === key) || TEMPLATES[0];

export const COLUMNS = [
  ["task", "Task", "Title and description"],
  ["area", "Area", "From the task's project"],
  ["owner", "Owner", "Assignee, or the task's owner label"],
  ["status", "Status", "Coloured pill per status"],
  ["finish", "Expected finish", "Due date, or the finish in words"],
  ["evidence", "Evidence", "The task's evidence notes and links, or “Pending”"],
];

const bar = (w, color, h = 5) => <span style={{ width: w, height: h, borderRadius: 3, background: color }} />;

/** Drawn preview for the template cards (104px tall, exact shapes from the design). */
export function TemplateThumb({ template }) {
  if (template === "ACTIVE_TASKS") {
    const row = (w, c) => (
      <span className="flex items-center gap-1.5">{bar(w, "#cbd5e1")}{bar("18%", "#475569")}{bar("14%", c, 6)}</span>
    );
    return (
      <span className="h-[104px] rounded-md bg-[#0f141c] p-2.5 flex flex-col gap-1.5">
        <span className="flex gap-1">{["#2563eb", "#14b8a6", "#a855f7", "#22c55e"].map((c) => <span key={c} style={{ width: 18, height: 8, borderRadius: 3, background: c }} />)}</span>
        <span className="h-px bg-[#263041]" />
        {row("52%", "#22c55e")}{row("46%", "#14b8a6")}{row("56%", "#a855f7")}{row("40%", "#2563eb")}
      </span>
    );
  }
  if (template === "WEEKLY_STATUS") {
    return (
      <span className="h-[104px] rounded-md bg-zinc-100 dark:bg-zinc-800 p-2.5 flex flex-col gap-[7px]">
        {bar("46%", "#18181b", 7)}
        <span className="grid grid-cols-3 gap-[5px]">{[0, 1, 2].map((i) => <span key={i} className="h-[22px] rounded bg-white border border-zinc-200" />)}</span>
        {bar("90%", "#a1a1aa")}{bar("76%", "#a1a1aa")}{bar("82%", "#a1a1aa")}
      </span>
    );
  }
  if (template === "TEAM_WORKLOAD") {
    const person = (dot, w, c) => (
      <span className="flex items-center gap-1.5">
        <span style={{ width: 14, height: 14, borderRadius: 999, background: dot }} />
        <span className="flex-1 h-1.5 rounded-[3px] bg-zinc-200 flex"><span style={{ width: w, borderRadius: 3, background: c }} /></span>
      </span>
    );
    return (
      <span className="h-[104px] rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-3 flex flex-col justify-center gap-[9px]">
        {person("#0073ea", "78%", "#e11d48")}{person("#d97706", "22%", "#0073ea")}{person("#e11d48", "92%", "#0073ea")}{person("#0d9488", "48%", "#0073ea")}
      </span>
    );
  }
  if (template === "PROJECT_ONE_PAGER") {
    return (
      <span className="h-[104px] rounded-md bg-zinc-100 dark:bg-zinc-800 p-2.5 flex gap-2.5 items-center">
        <span className="w-11 h-11 shrink-0 rounded-full border-[6px] border-primary border-r-zinc-200" />
        <span className="flex-1 flex flex-col gap-1.5">
          {bar("80%", "#18181b", 7)}{bar("100%", "#a1a1aa")}{bar("70%", "#a1a1aa")}
          <span className="flex gap-1">{bar("30%", "#22c55e", 8)}{bar("24%", "#e11d48", 8)}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="h-[104px] rounded-md bg-primary/[0.06] flex flex-col items-center justify-center gap-2 text-primary">
      <Sparkles className="w-[26px] h-[26px]" strokeWidth={1.8} />
      <span className="text-xs font-semibold">Describe it to Cortex</span>
    </span>
  );
}

/** 40x30 list thumbnail per template. */
export function PageThumb({ template }) {
  if (template === "ACTIVE_TASKS") {
    return (
      <span className="w-10 h-[30px] shrink-0 rounded-[5px] bg-[#0f141c] flex flex-col justify-center gap-[3px] px-1.5">
        {bar("70%", "#2563eb", 3)}{bar("100%", "#475569", 3)}{bar("80%", "#475569", 3)}
      </span>
    );
  }
  if (template === "PROJECT_ONE_PAGER") {
    return (
      <span className="w-10 h-[30px] shrink-0 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 px-[5px]">
        <span className="w-3.5 h-3.5 rounded-full border-[3px] border-primary border-r-zinc-200" />
        <span className="flex-1 h-[3px] rounded-sm bg-zinc-400" />
      </span>
    );
  }
  const lines = template === "TEAM_WORKLOAD"
    ? [["80%", "#e11d48"], ["30%", "#0073ea"], ["60%", "#0073ea"]]
    : [["60%", "#18181b"], ["100%", "#a1a1aa"], ["75%", "#a1a1aa"]];
  return (
    <span className="w-10 h-[30px] shrink-0 rounded-[5px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-center gap-[3px] px-1.5">
      {lines.map(([w, c], i) => <React.Fragment key={i}>{bar(w, c, 3)}</React.Fragment>)}
    </span>
  );
}

/** The link people share. */
export const shareUrl = (token) => `${window.location.origin}/p/${token}`;
