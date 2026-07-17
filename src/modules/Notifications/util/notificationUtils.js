/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes all notifications so they have consistent titles and message fields
 */
export function parseNotifications(notifications) {
  return notifications.map((item) => {
    let title = item.title;
    let message = item.message || item.text || "";

    if (!title) {
      if (item.type === "assigned") title = "Task Assigned";
      else if (item.type === "due_soon") title = "Due Soon Warning";
      else if (item.type === "overdue") title = "Overdue Task Alert";
      else if (item.type === "mention") title = "New Mention";
      else if (item.type === "update" || item.type === "project_update") title = "Project Update";
      else if (item.type === "reminder") title = "Workspace Reminder";
      else if (item.type === "file_attached" || item.type === "file") title = "File Attached";
      else if (item.type === "status_changed" || item.type === "status_change") title = "Status Changed";
      else if (item.type === "milestone_rescheduled" || item.type === "rescheduled") title = "Milestone Rescheduled";
      else title = "Workspace Notification";
    }

    return {
      ...item,
      title,
      message,
    };
  });
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

