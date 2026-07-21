/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { AppCard } from "../../../components/common/AppCard";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { useAppState } from "../../../app/providers";
import { Calendar } from "lucide-react";
import { getIconComponent } from "../../../components/common/IconHelper";
import { formatProjectDeadline } from "../util/projectUtils";
import { richTextToPlain } from "../../../components/common/RichText/sanitizeHtml";

export function ProjectCard({ project, projectTasks }) {
  const { users } = useAppState();
  const projectCompleted = projectTasks.filter((t) => t.status === "Completed").length;
  const pct = projectTasks.length > 0 ? Math.round((projectCompleted / projectTasks.length) * 100) : 0;
  const deadlineStr = formatProjectDeadline(project.deadline);

  const memberIds = project.members || [];
  const memberUsers = memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);
  const visibleMembers = memberUsers.slice(0, 3);
  const extraMembers = memberUsers.length - visibleMembers.length;

  return (
    <Link to={`/projects/${project.id}`} className="block h-full">
      <AppCard hover className="p-3 sm:p-4 flex flex-col justify-between h-full min-h-[170px] sm:min-h-[190px] project-card-transition">
        {/* Upper info */}
        <div className="min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary shrink-0">
              {getIconComponent(project.icon, "w-4 h-4 sm:w-4.5 sm:h-4.5")}
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                {project.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                Created {new Date(project.createdAt || project.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 sm:mt-2 line-clamp-2 leading-relaxed">
            {richTextToPlain(project.description)}
          </p>
        </div>

        {/* Lower indicators */}
        <div className="pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="font-tnum">{projectCompleted}/{projectTasks.length} tasks</span>
              <span className="font-tnum">{pct}%</span>
            </div>

            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Compact meta row: tasks, due date, member avatars */}
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 truncate">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Due {deadlineStr}</span>
            </span>

            {memberUsers.length > 0 ? (
              <span className="flex items-center -space-x-1.5 shrink-0">
                {visibleMembers.map((member) => (
                  <span key={member.id} className="ring-2 ring-white dark:ring-zinc-900 rounded-full">
                    <UserAvatar user={member} size="xs" />
                  </span>
                ))}
                {extraMembers > 0 && (
                  <span className="ring-2 ring-white dark:ring-zinc-900 rounded-full h-6 w-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 font-tnum">
                    +{extraMembers}
                  </span>
                )}
              </span>
            ) : (
              <span className="shrink-0 font-tnum">1 assignee</span>
            )}
          </div>
        </div>
      </AppCard>
    </Link>
  );
}
