/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

/** Base shimmer block. Compose with width/height utility classes. */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-md ${className}`} aria-hidden="true" />;
}

/** Skeleton for list rows (tasks, notifications). */
export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3.5">
          <Skeleton className="h-5 w-5 rounded-md shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for card grids (projects, workspaces). */
export function CardGridSkeleton({ cards = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4" role="status" aria-label="Loading">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="card p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
