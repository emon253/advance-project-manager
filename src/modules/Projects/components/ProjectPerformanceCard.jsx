/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AppCard } from "../../../components/common/AppCard";
import { Activity } from "lucide-react";

export function ProjectPerformanceCard({ completionPercentage, inProgressCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
      <AppCard className="flex flex-col justify-between text-left">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Completion</p>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-primary mt-1 font-tnum">{completionPercentage}%</h3>
        </div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-3.5">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">Tasks completed in this project</p>
      </AppCard>

      <AppCard className="text-left">
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Velocity</p>
        <div className="flex items-center gap-2 mt-1">
          <Activity className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white">
            <span className="font-tnum">{inProgressCount}</span> in-flight items
          </h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-2.5 sm:mt-4">Resources operating actively in sprint.</p>
      </AppCard>
    </div>
  );
}
