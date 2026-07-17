/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function filterTasksBySearch(tasks, searchTerm) {
  if (!searchTerm.trim()) return tasks;
  const q = searchTerm.toLowerCase();
  return tasks.filter((t) => {
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.priority && t.priority.toLowerCase().includes(q)) ||
      (t.status && t.status.toLowerCase().includes(q))
    );
  });
}

export function sortSearchedTasks(tasks, sortParam) {
  return [...tasks].sort((a, b) => {
    if (sortParam === "title") {
      return (a.title || "").localeCompare(b.title || "");
    }
    if (sortParam === "dueDate") {
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
    }
    if (sortParam === "priority") {
      const priorityWeights = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      return weightB - weightA;
    }
    return 0;
  });
}
