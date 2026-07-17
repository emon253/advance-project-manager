/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function isTaskOverdue(task, todayStart) {
  if (task.status === "Completed" || task.status === "Cancelled") return false;
  const due = new Date(task.dueDate);
  return due < todayStart;
}

export function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return "N/A";
  return dateObj.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export function isTaskDueToday(task, todayStart, todayEnd) {
  const due = new Date(task.dueDate);
  return due >= todayStart && due <= todayEnd;
}
