/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MoreHorizontal, Archive, RotateCcw, CheckCircle2 } from "lucide-react";
import { getIconComponent } from "../../../components/common/IconHelper";
import { useAppState } from "../../../app/providers";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";
import { EmptyState } from "../../../components/common/EmptyState";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { UpgradeModal } from "../../../components/common/UpgradeModal";
import { getPlanLimits } from "../../Billing/util/billingUtils";
import { ProjectFormDialog } from "../components/ProjectFormDialog";
import { ChipSelect } from "../../Tasks/components/TaskToolbar";
import { formatDue, isOpenTask, formatRelative } from "../../Tasks/util/tasksUtils";
import { richTextToPlain } from "../../../components/common/RichText/sanitizeHtml";

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const DAY = 86400000;

/**
 * Projects as a scannable table: progress, open, overdue, due, team, last
 * activity. Overdue is the signal. KPI tiles above, Active/Archived segment,
 * sort by what matters.
 */
export function ProjectsPage() {
  const {
    activeWorkspaceProjects, activeWorkspaceTasks, users, taskStatuses, addProject, updateProject, canAddProject, activePlanId, can, activities, ensureActivities,
  } = useAppState();
  const { isLoading, isError, retry } = useMockQuery();
  const [tab, setTab] = useState("active");
  const [sort, setSort] = useState("overdue");
  const [owner, setOwner] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [menuFor, setMenuFor] = useState(null);

  React.useEffect(() => { ensureActivities(); }, [ensureActivities]);

  const today = startOfDay();
  const rows = useMemo(() => activeWorkspaceProjects.map((p) => {
    const tasks = activeWorkspaceTasks.filter((t) => t.projectId === p.id);
    const open = tasks.filter((t) => isOpenTask(t, taskStatuses));
    const late = open.filter((t) => t.dueDate && startOfDay(t.dueDate) < today).length;
    const done = tasks.length - open.length;
    const members = (p.members || []).map((id) => users.find((u) => u.id === id)).filter(Boolean);
    const lastActivity = activities.find((a) => (a.text || "").includes(`'${p.name}'`))?.timestamp || null;
    const deadlineLate = p.deadline && startOfDay(p.deadline) < today && open.length > 0;
    return { ...p, total: tasks.length, open: open.length, late, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, members, lastActivity, deadlineLate, stale: tasks.length === 0 && p.deadline && startOfDay(p.deadline) < today };
  }), [activeWorkspaceProjects, activeWorkspaceTasks, taskStatuses, users, activities, today]);

  const bucket = (p) => (p.status === "Archived" ? "archived" : p.status === "Completed" ? "closed" : "active");
  const counts = { active: rows.filter((p) => bucket(p) === "active").length, closed: rows.filter((p) => bucket(p) === "closed").length, archived: rows.filter((p) => bucket(p) === "archived").length };
  const shown = rows
    .filter((p) => bucket(p) === tab)
    .filter((p) => !owner || p.members.some((m) => String(m.id) === String(owner)))
    .sort((a, b) => {
      if (sort === "overdue") return b.late - a.late || b.open - a.open || a.name.localeCompare(b.name);
      if (sort === "due") return (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity);
      if (sort === "progress") return a.pct - b.pct;
      return a.name.localeCompare(b.name);
    });

  const activeRows = rows.filter((p) => bucket(p) === "active");
  const kpis = [
    { label: "Active", value: activeRows.length },
    { label: "Open tasks", value: activeRows.reduce((n, p) => n + p.open, 0) },
    { label: "Overdue", value: activeRows.reduce((n, p) => n + p.late, 0), tone: "late" },
    { label: "Due this week", value: activeRows.filter((p) => p.deadline && startOfDay(p.deadline) >= today && startOfDay(p.deadline) < today + 7 * DAY).length },
  ];

  const openForm = () => {
    if (!canAddProject()) { setShowUpgrade(true); return; }
    setShowForm(true);
  };

  const th = "text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-2.5 py-[7px] bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 whitespace-nowrap";
  const td = "px-2.5 h-10 border-t border-zinc-100 dark:border-zinc-800/80 align-middle whitespace-nowrap text-[13px]";
  const wide = "hidden md:table-cell";

  return (
    <div className="text-left" id="projects-page-root">
      <div className="flex items-center gap-3 mb-3">
        <h1 className="page-title">Projects</h1>
        {can("manageProjects") && (
          <button type="button" onClick={openForm} className="btn btn-primary ml-auto">
            <Plus className="w-4 h-4" /> New project
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {kpis.map((k) => (
          <div key={k.label} className="card px-3.5 py-2.5 min-w-[128px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{k.label}</p>
            <p className={`text-xl font-bold tracking-tight font-tnum ${k.tone === "late" && k.value > 0 ? "text-rose-700 dark:text-rose-400" : "text-zinc-900 dark:text-white"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <div className="seg" role="group" aria-label="Status">
          <button type="button" aria-pressed={tab === "active"} onClick={() => setTab("active")}>Active <span className="text-zinc-400 font-tnum">{counts.active}</span></button>
          <button type="button" aria-pressed={tab === "closed"} onClick={() => setTab("closed")}>Closed <span className="text-zinc-400 font-tnum">{counts.closed}</span></button>
          <button type="button" aria-pressed={tab === "archived"} onClick={() => setTab("archived")}>Archived <span className="text-zinc-400 font-tnum">{counts.archived}</span></button>
        </div>
        <ChipSelect label="Member" value={owner} onChange={setOwner} options={users.map((u) => ({ value: u.id, label: u.name }))} allLabel="Anyone" />
        <div className="ml-auto">
          <ChipSelect
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v || "overdue")}
            options={[{ value: "overdue", label: "Overdue first" }, { value: "due", label: "Due date" }, { value: "progress", label: "Least progress" }, { value: "name", label: "Name" }]}
            allLabel="Overdue first"
          />
        </div>
      </div>

      {isLoading ? <ListSkeleton rows={5} /> : isError ? <ErrorState onRetry={retry} title="Couldn't load projects" /> : shown.length === 0 ? (
        <EmptyState icon={<Archive className="w-6 h-6" />} title={tab === "active" ? "No active projects" : tab === "closed" ? "No closed projects" : "No archived projects"} description={tab === "active" ? "Create a project to start tracking tasks." : tab === "closed" ? "Close a project from its page once the work is done." : "Archived projects will show up here."} buttonText={tab === "active" && can("manageProjects") ? "New project" : undefined} onButtonClick={openForm} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse md:min-w-[760px]">
            <thead>
              <tr>
                <th className={th}>Project</th><th className={`${th} ${wide}`}>Progress</th><th className={`${th} ${wide}`}>Open</th><th className={th}>Overdue</th><th className={th}>Due</th><th className={`${th} ${wide}`}>Team</th><th className={`${th} ${wide}`}>Last activity</th><th className={th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className={`${td} !whitespace-normal md:min-w-[240px]`}>
                    <Link to={`/projects/${p.id}`} className="flex items-center gap-2.5 text-zinc-900 dark:text-white font-bold hover:text-primary">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${p.color}1f`, color: p.color }}>
                        {getIconComponent(p.icon, "w-3.5 h-3.5")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate max-w-[calc(100vw-13.5rem)] md:max-w-[320px]">{p.name}</span>
                        {richTextToPlain(p.description) && <span className="block text-[11.5px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[calc(100vw-13.5rem)] md:max-w-[320px] leading-tight">{richTextToPlain(p.description)}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className={`${td} ${wide}`}>
                    {p.total === 0 ? <span className="text-xs text-zinc-400">No tasks yet</span> : (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-[100px] h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"><span className={`block h-full rounded-full ${p.pct === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${p.pct}%` }} /></span>
                        <span className="text-xs font-semibold text-zinc-500 font-tnum">{p.total - p.open}/{p.total}</span>
                      </span>
                    )}
                  </td>
                  <td className={`${td} ${wide} font-tnum`}>{p.total > 0 && p.open === 0 ? <span className="text-emerald-700 dark:text-emerald-400 font-bold">Done</span> : <span className={p.open ? "" : "text-zinc-400"}>{p.open}</span>}</td>
                  <td className={`${td} font-tnum`}>{p.late ? <span className="text-rose-700 dark:text-rose-400 font-bold">{p.late}</span> : <span className="text-zinc-400">—</span>}</td>
                  <td className={`${td} font-tnum ${p.deadlineLate || p.stale ? "text-rose-700 dark:text-rose-400 font-bold" : p.deadline ? "" : "text-zinc-400"}`}>{p.deadline ? formatDue(p.deadline) : "—"}</td>
                  <td className={`${td} ${wide}`}>
                    <span className="inline-flex -space-x-1.5">
                      {p.members.slice(0, 4).map((m) => <span key={m.id} className="ring-2 ring-white dark:ring-zinc-900 rounded-full"><UserAvatar user={m} size="xs" /></span>)}
                      {p.members.length > 4 && <span className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-900 text-[10px] font-bold flex items-center justify-center font-tnum">+{p.members.length - 4}</span>}
                    </span>
                  </td>
                  <td className={`${td} ${wide} text-zinc-500 dark:text-zinc-400`}>{p.lastActivity ? formatRelative(p.lastActivity) : "—"}</td>
                  <td className={`${td} relative`}>
                    {can("manageProjects") && (
                      <>
                        <button type="button" onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="btn-icon h-7 w-7" aria-label={`Actions for ${p.name}`} aria-haspopup="menu">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuFor === p.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} aria-hidden="true" />
                            <div role="menu" className="menu-panel absolute right-2 top-9 z-40 w-44 p-1">
                              {bucket(p) === "active" && (
                                <button type="button" role="menuitem" onClick={() => { setMenuFor(null); updateProject(p.id, { status: "Completed" }); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                                  <CheckCircle2 className="w-4 h-4" /> Close project
                                </button>
                              )}
                              {bucket(p) !== "active" && (
                                <button type="button" role="menuitem" onClick={() => { setMenuFor(null); updateProject(p.id, { status: "Active" }); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                                  <RotateCcw className="w-4 h-4" /> Reopen
                                </button>
                              )}
                              {bucket(p) !== "archived" && (
                                <button type="button" role="menuitem" onClick={() => { setMenuFor(null); updateProject(p.id, { status: "Archived" }); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                                  <Archive className="w-4 h-4" /> Archive
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {shown.some((p) => p.stale) && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Projects with no tasks and a past due date are flagged so they get planned or archived.</p>}

      <ProjectFormDialog isOpen={showForm} onClose={() => setShowForm(false)} onCreate={addProject} />
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Project limit reached"
        limitText={`The ${activePlanId === "free" ? "Free" : "current"} plan includes up to ${getPlanLimits(activePlanId).projects} projects per workspace.`}
      />
    </div>
  );
}
