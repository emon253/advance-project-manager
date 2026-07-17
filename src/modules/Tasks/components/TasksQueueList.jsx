/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ClipboardList } from "lucide-react";
import { TaskRow } from "./TaskRow";
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

  return (
    <div className="overflow-hidden border-y border-zinc-100 dark:border-zinc-800 -mx-3 sm:mx-0 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800 sm:bg-white sm:dark:bg-zinc-900 sm:rounded-xl sm:shadow-soft">
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, idx) => {
            const proj = activeWorkspaceProjects.find((p) => p.id === task.projectId);
            const assign = users.find((u) => u.id === task.assigneeId);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -15, height: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.03, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <TaskRow
                  task={task}
                  proj={proj}
                  assign={assign}
                  setActiveTaskId={setActiveTaskId}
                  updateTask={updateTask}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
