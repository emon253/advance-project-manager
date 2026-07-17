/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-3 mb-4 sm:pb-4 sm:mb-5 border-b border-zinc-200/70 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <h1 className="font-display font-bold text-lg md:text-2xl text-zinc-900 dark:text-white tracking-tight leading-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="hidden sm:block text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 md:mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
