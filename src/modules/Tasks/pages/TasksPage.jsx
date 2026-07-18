/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";

// Modular Imports
import { useTasksState } from "../hooks/useTasksState";
import { QuickFilterAlert } from "../components/QuickFilterAlert";
import { SegmentSelectorTabs } from "../components/SegmentSelectorTabs";
import { TaskFiltersToolbar } from "../components/TaskFiltersToolbar";
import { TasksQueueList } from "../components/TasksQueueList";

import "../style/tasks.css";

const PAGE_SIZE = 8;

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

  // Simulated fetch lifecycle for the tasks list (loading / error / retry)
  const { isLoading, isError, retry } = useMockQuery();

  // Pagination over the FILTERED list
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset pagination whenever the segment or any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeSegment, quickFilter, projectFilter, priorityFilter, assigneeFilter]);

  const visibleTasks = filteredTasks.slice(0, visibleCount);
  const remainingCount = filteredTasks.length - visibleTasks.length;

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((count) => count + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 400);
  };

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

      {/* Task Rows List layout (loading / error / paginated list) */}
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState onRetry={retry} title="Couldn't load tasks" />
      ) : (
        <>
          <TasksQueueList
            filteredTasks={visibleTasks}
            activeWorkspaceProjects={activeWorkspaceProjects}
            users={users}
            setActiveTaskId={setActiveTaskId}
            updateTask={updateTask}
          />

          {remainingCount > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="btn btn-secondary btn-sm"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading…</span>
                  </>
                ) : (
                  <span>Load more ({remainingCount} remaining)</span>
                )}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
