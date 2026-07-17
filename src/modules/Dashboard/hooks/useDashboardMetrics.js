/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import {
  getTodayTasks,
  getOverdueTasks,
  getInProgressTasks,
  getCompletedThisWeekTasks
} from "../util/dashboardUtils";

export function useDashboardMetrics(activeWorkspaceTasks) {
  const metrics = useMemo(() => {
    const todayTasks = getTodayTasks(activeWorkspaceTasks);
    const overdueTasks = getOverdueTasks(activeWorkspaceTasks);
    const inProgressTasks = getInProgressTasks(activeWorkspaceTasks);
    const completedThisWeekTasks = getCompletedThisWeekTasks(activeWorkspaceTasks);

    const totalWSTasks = activeWorkspaceTasks.length;
    const completedCount = activeWorkspaceTasks.filter((t) => t.status === "Completed").length;
    const completionRate = totalWSTasks > 0 ? Math.round((completedCount / totalWSTasks) * 100) : 0;

    return {
      todayTasks,
      overdueTasks,
      inProgressTasks,
      completedThisWeekTasks,
      totalWSTasks,
      completedCount,
      completionRate
    };
  }, [activeWorkspaceTasks]);

  return metrics;
}
