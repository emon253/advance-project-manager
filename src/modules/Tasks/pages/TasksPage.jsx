/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";

// Modular Imports
import { useTasksState } from "../hooks/useTasksState";
import { QuickFilterAlert } from "../components/QuickFilterAlert";
import { SegmentSelectorTabs } from "../components/SegmentSelectorTabs";
import { TaskFiltersToolbar } from "../components/TaskFiltersToolbar";
import { TasksQueueList } from "../components/TasksQueueList";

import "../style/tasks.css";

export function TasksPage() {
  const { 
    activeWorkspaceTasks, 
    activeWorkspaceProjects, 
    users, 
    updateTask, 
    setActiveTaskId,
    currentUser
  } = useAppState();

  const {
    activeSegment,
    setActiveSegment,
    quickFilter,
    projectFilter,
    setProjectFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    filteredTasks
  } = useTasksState({ activeWorkspaceTasks, currentUser });

  return (
    <div className="space-y-2.5 sm:space-y-5 text-left" id="tasks-page-root">
      
      {/* Page Header */}
      <PageHeader 
        title={
          quickFilter === "overdue" ? "Overdue Deliverables" :
          quickFilter === "in-progress" ? "Tasks In Progress" :
          quickFilter === "completed-this-week" ? "Completed This Week" :
          activeSegment === "mine" ? "My Workspace Assignments" :
          activeSegment === "today" ? "Schedules for Today" :
          activeSegment === "upcoming" ? "Upcoming Milestones" :
          "Archive Ledger: Completed"
        } 
        description="Review details, track progress, and update task status directly from the list."
      />

      {/* Active Quick Filter Alert / Badge */}
      <QuickFilterAlert quickFilter={quickFilter} />

      {/* Segment Selector tabs */}
      <SegmentSelectorTabs
        activeSegment={activeSegment}
        setActiveSegment={setActiveSegment}
        quickFilter={quickFilter}
      />

      {/* Filter Toolbar */}
      <TaskFiltersToolbar
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        activeWorkspaceProjects={activeWorkspaceProjects}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        users={users}
      />

      {/* Task Rows List layout */}
      <TasksQueueList
        filteredTasks={filteredTasks}
        activeWorkspaceProjects={activeWorkspaceProjects}
        users={users}
        setActiveTaskId={setActiveTaskId}
        updateTask={updateTask}
      />

    </div>
  );
}
