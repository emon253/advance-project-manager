/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { WifiOff, RotateCw } from "lucide-react";

/**
 * Standard failed-fetch state with retry. Use wherever a list/section
 * would load from the backend.
 */
export function ErrorState({
  title = "Couldn't load this",
  description = "Something went wrong while fetching data. Check your connection and try again.",
  onRetry,
  retrying = false,
}) {
  return (
    <div className="card px-6 py-8 flex flex-col items-center text-center" role="alert">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 mb-3">
        <WifiOff className="w-5 h-5" />
      </div>
      <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1 max-w-sm leading-relaxed">{description}</p>
      {onRetry && (
        <button onClick={onRetry} disabled={retrying} className="btn btn-secondary mt-4">
          <RotateCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
