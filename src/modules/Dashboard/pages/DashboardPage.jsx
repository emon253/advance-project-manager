/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { Folder, CheckCircle, Clock, AlertTriangle, Play } from "lucide-react";
import { motion } from "motion/react";

// Modular Imports
import { PerformanceTracker } from "../components/PerformanceTracker";
import { WorkloadSpeedDials } from "../components/WorkloadSpeedDials";
import { ActivityAuditLog } from "../components/ActivityAuditLog";

export function DashboardPage() {
  const {
    activeWorkspaceTasks,
    activeWorkspaceProjects,
    users,
    activities,
    ensureActivities
  } = useAppState();

  // The activity feed is dashboard-screen data — fetched on first visit, not at boot.
  React.useEffect(() => { ensureActivities(); }, [ensureActivities]);

  const now = new Date();

  // 1. Total Projects
  const totalProjects = activeWorkspaceProjects.length;

  // 2. Completed Projects (Status is Completed or Archived, or progress is 100)
  const completedProjects = activeWorkspaceProjects.filter(
    (p) => p.status === "Completed" || p.status === "Archived" || p.progress === 100
  ).length;

  // 3. In Progress Projects (Status is Active or progress > 0 and < 100)
  const inProgressProjects = activeWorkspaceProjects.filter(
    (p) => p.status === "Active" || (p.progress > 0 && p.progress < 100 && p.status !== "Completed" && p.status !== "Archived")
  ).length;

  // 4. Overdue Projects (Not completed, and deadline is in the past)
  const overdueProjects = activeWorkspaceProjects.filter((p) => {
    const isCompleted = p.status === "Completed" || p.status === "Archived" || p.progress === 100;
    if (isCompleted) return false;
    if (!p.deadline) return false;
    return new Date(p.deadline) < now;
  }).length;

  const cards = [
    {
      label: "Total Projects",
      count: totalProjects,
      route: "/projects",
      icon: Folder,
      sub: "Active in this workspace",
      accentBg: "bg-primary/8 dark:bg-primary/15 text-primary",
      countColor: "text-zinc-900 dark:text-white"
    },
    {
      label: "In Progress",
      count: inProgressProjects,
      route: "/projects",
      icon: Play,
      sub: "Active project workflows",
      accentBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
      countColor: "text-zinc-900 dark:text-white"
    },
    {
      label: "Completed",
      count: completedProjects,
      route: "/projects",
      icon: CheckCircle,
      sub: "Fully finalized deliverables",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
      countColor: "text-zinc-900 dark:text-white"
    },
    {
      label: "Overdue",
      count: overdueProjects,
      route: "/projects",
      icon: Clock,
      sub: "Past expected deadline",
      accentBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
      countColor: "text-rose-600 dark:text-rose-400"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-3 sm:space-y-5 text-left"
      id="dashboard-composition-layer"
    >
      <div>
        <h1 className="font-display font-bold text-xl md:text-2xl text-zinc-900 dark:text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
          Progress summaries across the active workspace.
        </p>
      </div>

      {/* Grid of compact statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3" id="project-dashboard-metrics">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <Link
              key={idx}
              to={card.route}
              className="card block p-3 sm:p-3.5 transition-colors hover:border-primary/40 dark:hover:border-primary/40"
              id={`project-stat-card-${idx}`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center sm:h-auto sm:w-auto sm:p-1.5 rounded-lg shrink-0 ${card.accentBg}`}>
                  <IconComponent className="w-4 h-4" />
                </span>
                <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide truncate">
                  {card.label}
                </p>
              </div>
              <p className={`mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold font-tnum tracking-tight ${card.countColor}`}>
                {card.count}
              </p>
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1 truncate">
                {card.label === "Overdue" && card.count > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                )}
                <span className="truncate">{card.sub}</span>
              </p>
            </Link>
          );
        })}
      </div>

      {/* Grid: Split Layout with restored sub-sections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4"
      >
        {/* Left column: Projects progress tracks */}
        <div className="lg:col-span-2">
          <PerformanceTracker
            activeWorkspaceProjects={activeWorkspaceProjects}
            activeWorkspaceTasks={activeWorkspaceTasks}
          />
        </div>

        {/* Right column: Recent activities & workload summaries */}
        <div className="space-y-2.5 sm:space-y-4">
          <WorkloadSpeedDials
            users={users}
            activeWorkspaceTasks={activeWorkspaceTasks}
          />

          <ActivityAuditLog
            activities={activities}
            users={users}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
