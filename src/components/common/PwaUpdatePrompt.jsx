/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X, WifiOff } from "lucide-react";

/**
 * Two states the service worker can surface, both rendered as a small
 * dismissible banner matching the app's toast styling (routes.jsx):
 *  - needRefresh: a new build was precached — offer a one-tap reload so the
 *    update lands cleanly instead of the SW silently swapping the app under
 *    a user who might be mid-edit.
 *  - offlineReady: first install finished precaching the shell (shown once).
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => console.error("Service worker registration failed", error),
  });

  const dismiss = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-50 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-elevated flex gap-3 text-left left-4 right-4 sm:left-auto sm:right-6 sm:w-[340px] bottom-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4 fade-in duration-250"
    >
      <div className="p-2 bg-primary/8 dark:bg-primary/15 text-primary h-fit rounded-lg shrink-0 mt-0.5">
        {needRefresh ? <RefreshCw className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight">
          {needRefresh ? "Update available" : "Ready to work offline"}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-normal mt-0.5">
          {needRefresh
            ? "A newer version of Junction has been downloaded."
            : "The app shell is cached for faster loads."}
        </p>
        {needRefresh && (
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="btn btn-primary btn-sm mt-2.5"
          >
            Reload now
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        className="p-1.5 -m-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 self-start cursor-pointer transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
