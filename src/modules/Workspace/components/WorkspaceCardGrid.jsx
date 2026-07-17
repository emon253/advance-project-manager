/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Archive, Settings, ArrowRight, RefreshCw } from "lucide-react";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { EmptyState } from "../../../components/common/EmptyState";
import { getIconComponent } from "../../../components/common/IconHelper";

export function WorkspaceCardGrid({
  filteredWorkspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  projects,
  tasks,
  handleSwitchWorkspace,
  handleRestoreWorkspace,
  setSearchTerm,
  setActiveTab
}) {
  if (filteredWorkspaces.length === 0) {
    return (
      <div id="workspaces-empty-state">
        <EmptyState
          icon={<Briefcase className="w-7 h-7" />}
          title="No workspaces found"
          description="No workspaces match your current search or filter. Adjust your query or create a new workspace."
          buttonText="Clear filters"
          onButtonClick={() => { setSearchTerm(""); setActiveTab("all"); }}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4" id="workspaces-card-grid">
      {filteredWorkspaces.map((w) => {
        // Stats calculations specific to this workspace
        const wProjects = projects.filter((p) => p.workspaceId === w.id);
        const wProjectIds = wProjects.map((p) => p.id);
        const wTasks = tasks.filter((t) => wProjectIds.includes(t.projectId));
        const completedCount = wTasks.filter((t) => t.status === "Completed").length;
        const openCount = wTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length;
        const membersList = w.members || [];

        const isActive = w.id === activeWorkspaceId;

        return (
          <div
            key={w.id}
            className={`card relative flex flex-col justify-between p-3 sm:p-4 transition-colors ${
              isActive
                ? "border-primary/40 ring-2 ring-primary/15"
                : "hover:border-zinc-300 dark:hover:border-zinc-700"
            } ${w.isArchived ? "opacity-75" : ""}`}
            id={`workspace-card-${w.id}`}
          >
            {/* Active Indicator Pin */}
            {isActive && (
              <span className="badge absolute top-3.5 right-3.5 bg-primary/8 dark:bg-primary/15 text-primary border-primary/20">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Active</span>
              </span>
            )}

            {w.isArchived && (
              <span className="badge absolute top-3.5 right-3.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-500/20">
                <Archive className="w-3 h-3" />
                <span>Archived</span>
              </span>
            )}

            {/* Top Info */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary shrink-0 select-none">
                  {getIconComponent(w.logo, "w-4 h-4 sm:w-4.5 sm:h-4.5")}
                </span>
                <div className="min-w-0 text-left">
                  <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white truncate pr-16">
                    {w.name}
                  </h3>
                  <span className="text-[10px] font-mono font-tnum text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded select-none">
                    ID: {w.id}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium h-8 text-left line-clamp-2">
                {w.description || "No description added yet."}
              </p>

              {/* Summary metrics counts */}
              <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 sm:p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 select-none">
                <div className="text-center">
                  <span className="block font-mono font-tnum text-xs font-semibold text-zinc-800 dark:text-zinc-200">{wProjects.length}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Projects</span>
                </div>
                <div className="text-center border-x border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block font-mono font-tnum text-xs font-semibold text-zinc-800 dark:text-zinc-200">{openCount}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Pending</span>
                </div>
                <div className="text-center">
                  <span className="block font-mono font-tnum text-xs font-semibold text-zinc-800 dark:text-zinc-200">{completedCount}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Done</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
              {/* Avatar pile members */}
              <div className="flex -space-x-1.5 overflow-hidden">
                {membersList.slice(0, 4).map((member) => (
                  <div key={member.id} title={`${member.name} (${member.role})`}>
                    <UserAvatar user={member} size="xs" />
                  </div>
                ))}
                {membersList.length > 4 && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-semibold border border-white dark:border-zinc-900 text-[10px] select-none">
                    +{membersList.length - 4}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {w.isArchived ? (
                  <button
                    onClick={() => handleRestoreWorkspace(w.id)}
                    type="button"
                    className="btn btn-sm text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                ) : (
                  <>
                    <Link
                      to="/workspace-settings"
                      onClick={() => setActiveWorkspaceId(w.id)}
                      className="btn-icon"
                      title="Manage details and members"
                      aria-label={`Settings for ${w.name}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Link>

                    {isActive ? (
                      <button
                        disabled
                        type="button"
                        className="btn btn-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                      >
                        Active
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSwitchWorkspace(w.id)}
                        type="button"
                        className="btn btn-sm btn-primary"
                      >
                        <span>Switch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
