/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAppState } from "../../../app/providers";

export function useTasksState({ activeWorkspaceTasks, currentUser }) {
  const location = useLocation();
  const { taskStatuses } = useAppState();

  // Pick default segment based on URL routing
  const [activeSegment, setActiveSegment] = useState(() => {
    if (location.pathname === "/today") return "today";
    if (location.pathname === "/upcoming") return "upcoming";
    if (location.pathname === "/completed") return "completed";
    return "mine"; // Default "My Tasks"
  });

  // Pick initial quick filter from URL search parameters if any
  const queryParams = new URLSearchParams(location.search);
  const [quickFilter, setQuickFilter] = useState(queryParams.get("filter") || "");

  // Keep quickFilter in sync with URL search changes
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setQuickFilter(q.get("filter") || "");
  }, [location.search]);

  // Filters State
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");

  // Sync segment if route path changes
  useEffect(() => {
    if (location.pathname === "/today") setActiveSegment("today");
    else if (location.pathname === "/upcoming") setActiveSegment("upcoming");
    else if (location.pathname === "/completed") setActiveSegment("completed");
    else if (location.pathname === "/my-tasks") setActiveSegment("mine");
  }, [location.pathname]);

  const filteredTasks = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const completedStatusNames = taskStatuses?.filter((s) => s.isCompleted).map((s) => s.name) || ["Completed"];
    const cancelledStatusNames = taskStatuses?.filter((s) => s.isCancelled).map((s) => s.name) || ["Cancelled"];
    const inProgressStatusNames = taskStatuses?.filter((s) => s.isStarted || s.name === "In Progress").map((s) => s.name) || ["In Progress"];

    return activeWorkspaceTasks.filter((t) => {
      // 1. Quick Action Filters from Dashboard
      if (quickFilter === "overdue") {
        const due = new Date(t.dueDate);
        const isOverdue = due < todayStart && !completedStatusNames.includes(t.status) && !cancelledStatusNames.includes(t.status);
        if (!isOverdue) return false;
      } else if (quickFilter === "in-progress") {
        if (!inProgressStatusNames.includes(t.status)) return false;
      } else if (quickFilter === "completed-this-week") {
        if (!completedStatusNames.includes(t.status)) return false;
        const due = new Date(t.dueDate);
        const withinSevenDays = (Date.now() - due.getTime()) < (7 * 86400 * 1000);
        if (!withinSevenDays) return false;
      } else {
        // 2. Fallback to standard Segment check if no quickFilter is active
        if (activeSegment === "mine" && t.assigneeId !== currentUser.id) return false;
        
        if (activeSegment === "today") {
          const due = new Date(t.dueDate);
          const isDueToday = due >= todayStart && due <= todayEnd;
          const isOverdue = due < todayStart && !completedStatusNames.includes(t.status) && !cancelledStatusNames.includes(t.status);
          if (!(isDueToday || isOverdue)) return false;
        }

        if (activeSegment === "upcoming") {
          const due = new Date(t.dueDate);
          if (!(due > todayEnd)) return false;
        }

        if (activeSegment === "completed" && !completedStatusNames.includes(t.status)) return false;
      }

      // 3. Filter by dropdown elements
      if (projectFilter && t.projectId !== projectFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter && t.assigneeId !== assigneeFilter) return false;

      return true;
    });
  }, [activeWorkspaceTasks, currentUser.id, activeSegment, quickFilter, projectFilter, priorityFilter, assigneeFilter, taskStatuses]);

  return {
    activeSegment,
    setActiveSegment,
    quickFilter,
    setQuickFilter,
    projectFilter,
    setProjectFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    filteredTasks
  };
}
