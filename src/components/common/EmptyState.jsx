/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FolderKanban } from "lucide-react";

export function EmptyState({
  title = "No items found",
  description = "Get started by adding your first item.",
  icon,
  buttonText,
  onButtonClick
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 max-w-lg mx-auto my-6">
      <div className="p-3 bg-primary/8 dark:bg-primary/15 text-primary rounded-xl mb-3 shrink-0">
        {icon || <FolderKanban className="w-7 h-7" />}
      </div>
      <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {buttonText && onButtonClick && (
        <button onClick={onButtonClick} className="btn btn-primary mt-4">
          {buttonText}
        </button>
      )}
    </div>
  );
}
