/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function calculateCompletionPercentage(projectTasks) {
  const completedTasks = projectTasks.filter((t) => t.status === "Completed");
  return projectTasks.length > 0 
    ? Math.round((completedTasks.length / projectTasks.length) * 100) 
    : 0;
}

export function formatProjectDeadline(deadline) {
  if (!deadline) return "None";
  const deadlineObj = new Date(deadline);
  return deadlineObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

export function formatDetailedProjectDeadline(deadline) {
  if (!deadline) return "None";
  const deadlineObj = new Date(deadline);
  return deadlineObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
