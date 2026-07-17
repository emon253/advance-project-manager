/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getTodayTasks(tasks) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return tasks.filter((t) => {
    const due = new Date(t.dueDate);
    return due >= start && due <= end && t.status !== "Completed";
  });
}

export function getOverdueTasks(tasks) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return tasks.filter((t) => {
    const due = new Date(t.dueDate);
    return due < start && t.status !== "Completed" && t.status !== "Cancelled";
  });
}

export function getInProgressTasks(tasks) {
  return tasks.filter((t) => t.status === "In Progress");
}

export function getCompletedThisWeekTasks(tasks) {
  return tasks.filter((t) => {
    if (t.status !== "Completed") return false;
    const due = new Date(t.dueDate);
    return (Date.now() - due.getTime()) < (7 * 86400 * 1000);
  });
}
