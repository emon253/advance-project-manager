/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ClipboardList } from "lucide-react";
import { TaskListItem } from "./TaskListItem";
import { EmptyState } from "../../../components/common/EmptyState";
import { motion, AnimatePresence } from "motion/react";

export function TasksQueueList({
  filteredTasks,
  activeWorkspaceProjects,
  users,
  setActiveTaskId,
  updateTask
}) {
  if (filteredTasks.length === 0) {
    return (
      <EmptyState
        title="No tasks here"
        description="No tasks match the current view or filters. Adjust the filters or add a new task to get started."
        icon={<ClipboardList className="w-7 h-7" />}
      />
    );
  }

  // Same Trello-style stacked cards with inline checklists as the project
  // Tasks Lineup (shared TaskListItem).
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {filteredTasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -15, height: 0 }}
            transition={{ duration: 0.22, delay: idx * 0.03, ease: "easeInOut" }}
          >
            <TaskListItem
              task={task}
              proj={activeWorkspaceProjects.find((p) => p.id === task.projectId)}
              assign={users.find((u) => u.id === task.assigneeId)}
              setActiveTaskId={setActiveTaskId}
              updateTask={updateTask}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
