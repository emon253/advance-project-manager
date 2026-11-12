/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, MessageSquare } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";
import { TaskRow } from "../components/TaskRow";
import { defaultStatusName, isDoneTask, isOpenTask, sortTasks } from "../util/tasksUtils";

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
const DAY = 86400000;

function Group({ title, tone, count, action, children }) {
  return (
    <section>
      <h2 className="section-label">
        <span className={tone === "late" ? "text-rose-700 dark:text-rose-400" : ""}>{title}</span>
        <span className="count">{count}</span>
        {action}
      </h2>
      <div className="card overflow-hidden">{children}</div>
    </section>
  );
}

/**
 * Today — the home screen. Your overdue, due-today and in-progress tasks in
 * one list, a quick-add bar on top, and a right rail with projects at risk,
 * the week ahead and comments waiting on you.
 */
export function TodayPage() {
  const {
    activeWorkspaceTasks, activeWorkspaceProjects, currentUser, taskStatuses, addTask, updateTask, can, notifications, setActiveTaskId,
  } = useAppState();
  const { isLoading, isError, retry } = useMockQuery();
  const [draft, setDraft] = useState("");
  const [showDone, setShowDone] = useState(false);

  const today = startOfDay();
  const mine = useMemo(() => activeWorkspaceTasks.filter((t) => t.assigneeId === currentUser?.id), [activeWorkspaceTasks, currentUser]);

  const buckets = useMemo(() => {
    const open = mine.filter((t) => isOpenTask(t, taskStatuses));
    const dueOf = (t) => (t.dueDate ? startOfDay(t.dueDate) : null);
    const late = open.filter((t) => dueOf(t) != null && dueOf(t) < today);
    const dueToday = open.filter((t) => dueOf(t) === today);
    const startedNames = new Set(taskStatuses.filter((s) => s.isStarted).map((s) => s.name));
    const inProgress = open.filter((t) => (startedNames.size ? startedNames.has(t.status) : t.status === "In Progress") && !late.includes(t) && !dueToday.includes(t));
    const doneToday = mine.filter((t) => isDoneTask(t, taskStatuses) && t.dueDate && startOfDay(t.dueDate) >= today - DAY);
    return {
      late: sortTasks(late, taskStatuses), dueToday: sortTasks(dueToday, taskStatuses),
      inProgress: sortTasks(inProgress, taskStatuses), doneToday: sortTasks(doneToday, taskStatuses),
    };
  }, [mine, taskStatuses, today]);

  const upcoming = useMemo(() => {
    const days = new Map();
    for (const t of mine) {
      if (!isOpenTask(t, taskStatuses) || !t.dueDate) continue;
      const d = startOfDay(t.dueDate);
      if (d <= today || d >= today + 8 * DAY) continue;
      days.set(d, (days.get(d) || 0) + 1);
    }
    return [...days.entries()].sort((a, b) => a[0] - b[0]);
  }, [mine, taskStatuses, today]);

  const projectsAtRisk = useMemo(() => activeWorkspaceProjects
    .filter((p) => p.status !== "Archived" && p.status !== "Completed")
    .map((p) => {
      const tasks = activeWorkspaceTasks.filter((t) => t.projectId === p.id);
      const open = tasks.filter((t) => isOpenTask(t, taskStatuses));
      const late = open.filter((t) => t.dueDate && startOfDay(t.dueDate) < today).length;
      const done = tasks.length - open.length;
      return { ...p, openCount: open.length, lateCount: late, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, total: tasks.length };
    })
    .sort((a, b) => b.lateCount - a.lateCount || b.openCount - a.openCount)
    .slice(0, 5), [activeWorkspaceProjects, activeWorkspaceTasks, taskStatuses, today]);

  const needsReply = useMemo(() => notifications
    .filter((n) => !n.read && (n.type === "mention" || n.type === "comment") && n.taskId)
    .slice(0, 3), [notifications]);

  const submitQuickAdd = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const projectId = activeWorkspaceProjects.find((p) => p.status !== "Archived" && p.status !== "Completed")?.id;
    if (!projectId) return;
    const created = await addTask({
      title: draft.trim(), projectId, status: defaultStatusName(taskStatuses), priority: "Medium",
      assigneeId: currentUser?.id, dueDate: new Date().toISOString(),
    });
    if (created) setDraft("");
  };

  const rescheduleAll = () => buckets.late.forEach((t) => updateTask(t.id, { dueDate: new Date().toISOString() }));

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const row = (t) => (
    <TaskRow key={t.id} task={t} project={activeWorkspaceProjects.find((p) => p.id === t.projectId)} />
  );

  return (
    <div className="flex flex-wrap gap-6 2xl:gap-8 items-start text-left" id="today-root">
      <section className="flex-[999_1_520px] min-w-0">
        <div className="mb-3">
          <h1 className="page-title">Today</h1>
          <p className="page-sub font-tnum">
            {dateLabel}
            {buckets.late.length > 0 && <> · <span className="text-rose-700 dark:text-rose-400 font-bold">{buckets.late.length} overdue</span></>}
            {buckets.dueToday.length > 0 && <> · {buckets.dueToday.length} due today</>}
            {buckets.inProgress.length > 0 && <> · {buckets.inProgress.length} in progress</>}
          </p>
        </div>

        {can("editTasks") && (
          <form onSubmit={submitQuickAdd} className="flex items-center gap-2.5 h-[38px] px-3 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg focus-within:border-primary focus-within:border-solid transition-colors">
            <Plus className="w-4 h-4 text-primary shrink-0" />
            <label htmlFor="today-quick-add" className="sr-only">Add a task for today</label>
            <input
              id="today-quick-add"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder="Add a task for today… press Enter"
              className="flex-1 min-w-0 h-full bg-transparent text-[13px] font-medium outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />
          </form>
        )}

        {isLoading ? <div className="mt-4"><ListSkeleton rows={6} /></div> : isError ? <div className="mt-4"><ErrorState onRetry={retry} title="Couldn't load your tasks" /></div> : (
          <>
            {buckets.late.length > 0 && (
              <Group
                title="Overdue" tone="late" count={buckets.late.length}
                action={can("editTasks") && <button type="button" onClick={rescheduleAll} className="ml-auto text-xs font-semibold text-primary normal-case tracking-normal hover:underline cursor-pointer">Reschedule all to today</button>}
              >
                {buckets.late.map(row)}
              </Group>
            )}
            {buckets.dueToday.length > 0 && <Group title="Due today" count={buckets.dueToday.length}>{buckets.dueToday.map(row)}</Group>}
            {buckets.inProgress.length > 0 && <Group title="In progress" count={buckets.inProgress.length}>{buckets.inProgress.map(row)}</Group>}
            {buckets.late.length + buckets.dueToday.length + buckets.inProgress.length === 0 && (
              <div className="card mt-4 px-5 py-8 text-center">
                <p className="text-[13px] font-bold text-zinc-900 dark:text-white">You're clear for today</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Nothing overdue, due today or in progress. <Link to="/my-tasks" className="text-primary font-semibold">See all your tasks</Link>.</p>
              </div>
            )}
            {buckets.doneToday.length > 0 && (
              <section>
                <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="section-label cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200">
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDone ? "rotate-90" : ""}`} />
                  Done today <span className="count">{buckets.doneToday.length}</span>
                </button>
                {showDone && <div className="card overflow-hidden">{buckets.doneToday.map(row)}</div>}
              </section>
            )}
          </>
        )}
      </section>

      <aside className="flex-[1_1_280px] w-full lg:w-auto lg:max-w-[340px] 2xl:max-w-[380px] flex flex-col gap-3 lg:pt-[52px]">
        <div className="card p-3">
          <div className="flex items-center mb-2.5">
            <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">Projects</h3>
            <Link to="/projects" className="ml-auto text-xs font-semibold text-primary hover:underline">All {activeWorkspaceProjects.filter((p) => p.status !== "Archived" && p.status !== "Completed").length}</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {projectsAtRisk.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="block group">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate group-hover:text-primary">{p.name}</span>
                  <span className={`ml-auto text-xs font-tnum shrink-0 ${p.lateCount ? "text-rose-700 dark:text-rose-400 font-bold" : p.total && p.openCount === 0 ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-zinc-500 font-semibold"}`}>
                    {p.lateCount ? `${p.lateCount} overdue` : p.total === 0 ? "No tasks" : p.openCount === 0 ? "Done" : `${p.openCount} open`}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <span className={`block h-full rounded-full ${p.pct === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${p.pct}%` }} />
                </div>
              </Link>
            ))}
            {projectsAtRisk.length === 0 && <p className="text-xs text-zinc-400">No projects yet.</p>}
          </div>
        </div>

        <div className="card p-3">
          <div className="flex items-center mb-2">
            <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">Coming up</h3>
            <Link to="/my-tasks?due=week" className="ml-auto text-xs font-semibold text-primary hover:underline">This week</Link>
          </div>
          {upcoming.length === 0 ? <p className="text-xs text-zinc-400">Nothing due in the next 7 days.</p> : (
            <div className="flex flex-col gap-1.5 text-[13px]">
              {upcoming.map(([day, n]) => (
                <div key={day} className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">{new Date(day).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>
                  <span className="font-semibold font-tnum">{n} task{n > 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-3">
          <div className="flex items-center mb-2">
            <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white">Needs your reply</h3>
            <Link to="/inbox" className="ml-auto text-xs font-semibold text-primary hover:underline">Notifications</Link>
          </div>
          {needsReply.length === 0 ? <p className="text-xs text-zinc-400">No unread mentions.</p> : (
            <div className="flex flex-col gap-2">
              {needsReply.map((n) => (
                <button key={n.id} type="button" onClick={() => setActiveTaskId(n.taskId, { commentId: n.commentId })} className="flex items-start gap-2 text-left text-xs leading-snug cursor-pointer hover:text-primary">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-300 line-clamp-2">{n.message}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
