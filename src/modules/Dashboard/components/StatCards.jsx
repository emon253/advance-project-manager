/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link } from "react-router-dom";
import { CheckSquare, AlertCircle, Play, CheckCircle, AlertTriangle } from "lucide-react";

export function StatCards({ todayCount, overdueCount, inProgressCount, completedCount }) {
  const cards = [
    {
      label: "Due Today",
      count: todayCount,
      route: "/today",
      icon: CheckSquare,
      color: "brand",
      sub: "Tasks due before midnight",
      accentBg: "bg-primary/8 dark:bg-primary/15 text-primary",
      countColor: "text-zinc-900 dark:text-white"
    },
    {
      label: "Overdue",
      count: overdueCount,
      route: "/my-tasks?filter=overdue",
      icon: AlertCircle,
      color: "rose",
      sub: "Needs immediate action",
      accentBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
      countColor: "text-rose-600 dark:text-rose-400"
    },
    {
      label: "In Progress",
      count: inProgressCount,
      route: "/my-tasks?filter=in-progress",
      icon: Play,
      color: "amber",
      sub: "Currently being worked on",
      accentBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
      countColor: "text-zinc-900 dark:text-white"
    },
    {
      label: "Completed",
      count: completedCount,
      route: "/my-tasks?filter=completed-this-week",
      icon: CheckCircle,
      color: "emerald",
      sub: "In the last 7 days",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
      countColor: "text-zinc-900 dark:text-white"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3" id="dashboard-metric-aggregations">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <Link
            key={idx}
            to={card.route}
            className="card block p-3 sm:p-3.5 transition-colors hover:border-primary/40 dark:hover:border-primary/40"
            id={`stat-card-${idx}`}
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
              {card.color === "rose" && (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span className="truncate">{card.sub}</span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
