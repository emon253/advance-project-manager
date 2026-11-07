/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/* ---------- status classification (workspace statuses carry the flags) ---------- */

export function statusKind(statusName, taskStatuses = []) {
  const s = taskStatuses.find((x) => x.name === statusName);
  if (s) {
    if (s.isCompleted) return "done";
    if (s.isCancelled) return "cancelled";
    return "open";
  }
  if (statusName === "Completed") return "done";
  if (statusName === "Cancelled") return "cancelled";
  return "open";
}

export const isOpenTask = (task, taskStatuses) => statusKind(task.status, taskStatuses) === "open";
export const isDoneTask = (task, taskStatuses) => statusKind(task.status, taskStatuses) === "done";

/** Name of the workspace's "completed" status (falls back to "Completed"). */
export function completedStatusName(taskStatuses = []) {
  return taskStatuses.find((s) => s.isCompleted)?.name || "Completed";
}
export function defaultStatusName(taskStatuses = []) {
  return taskStatuses.find((s) => s.isDefault)?.name || taskStatuses[0]?.name || "To Do";
}

/* ---------- dates ---------- */

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const DAY = 86400000;

/** 'late' | 'past' | 'today' | 'tomorrow' | 'week' | 'later' | null (no date). Done tasks are never late. */
export function dueState(task, taskStatuses) {
  if (!task.dueDate) return null;
  const due = startOfDay(task.dueDate).getTime();
  const today = startOfDay(new Date()).getTime();
  if (due < today) return isOpenTask(task, taskStatuses) ? "late" : "past";
  if (due === today) return "today";
  if (due === today + DAY) return "tomorrow";
  if (due < today + 7 * DAY) return "week";
  return "later";
}

/** Compact due label: Today · Tomorrow · Mon 10 (this week) · Nov 3 · Nov 3, 2027. */
export function formatDue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const today = startOfDay(new Date()).getTime();
  const day = startOfDay(d).getTime();
  if (day === today) return "Today";
  if (day === today + DAY) return "Tomorrow";
  if (day > today && day < today + 7 * DAY) return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  const opts = { month: "short", day: "numeric" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
}

/** "4d late" for overdue tasks. */
export function daysLate(dateStr) {
  const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(dateStr).getTime()) / DAY);
  return diff > 0 ? `${diff}d late` : "";
}

/** Relative time for activity/comments: now · 5m · 3h · Yesterday · Nov 3. */
export function formatRelative(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date)) return "";
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && date.getDate() === now.getDate()) return `${diffHr}h`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const opts = { month: "short", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return date.toLocaleDateString(undefined, opts);
}

export function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return "N/A";
  return dateObj.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/* ---------- grouping / sorting ---------- */

/** Open first, then by due date (undated last), then newest id. */
export function sortTasks(tasks, taskStatuses) {
  return [...tasks].sort((a, b) => {
    const ao = isOpenTask(a, taskStatuses) ? 0 : 1;
    const bo = isOpenTask(b, taskStatuses) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (b.id || 0) - (a.id || 0);
  });
}

/**
 * Group tasks by workspace status, in status order. Returns
 * [{ key, label, kind, tasks }] — done/cancelled groups are marked so the
 * list can collapse them by default.
 */
export function groupByStatus(tasks, taskStatuses) {
  const order = taskStatuses.length
    ? [...taskStatuses].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [{ name: "To Do" }, { name: "In Progress" }, { name: "In Review" }, { name: "Blocked" }, { name: "Completed" }, { name: "Cancelled" }];
  const byName = new Map(order.map((s) => [s.name, []]));
  for (const t of tasks) {
    if (!byName.has(t.status)) byName.set(t.status, []);
    byName.get(t.status).push(t);
  }
  return [...byName.entries()].map(([name, list]) => ({
    key: name,
    label: name,
    kind: statusKind(name, taskStatuses),
    tasks: sortTasks(list, taskStatuses),
  }));
}

export function groupByProject(tasks, projects, taskStatuses) {
  const map = new Map();
  for (const t of tasks) {
    const key = t.projectId ?? "none";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return [...map.entries()].map(([key, list]) => {
    const p = projects.find((x) => x.id === key);
    return { key: String(key), label: p?.name || "No project", color: p?.color, kind: "open", tasks: sortTasks(list, taskStatuses) };
  });
}

/* ---------- status dot colours ---------- */

const DOT_BY_KIND = { done: "#15803d", cancelled: "#a1a1aa", open: "#a1a1aa" };
const DOT_BY_NAME = { "In Progress": "#533afd", "In Review": "#b45309", Blocked: "#be123c" };
export function statusDot(statusName, taskStatuses) {
  if (DOT_BY_NAME[statusName]) return DOT_BY_NAME[statusName];
  const s = taskStatuses?.find((x) => x.name === statusName);
  if (s?.isStarted) return "#533afd";
  return DOT_BY_KIND[statusKind(statusName, taskStatuses)];
}

/* ---------- legacy helpers still imported elsewhere ---------- */

export function isTaskOverdue(task, todayStart) {
  if (task.status === "Completed" || task.status === "Cancelled") return false;
  return new Date(task.dueDate) < todayStart;
}

export function isTaskDueToday(task, todayStart, todayEnd) {
  const due = new Date(task.dueDate);
  return due >= todayStart && due <= todayEnd;
}
