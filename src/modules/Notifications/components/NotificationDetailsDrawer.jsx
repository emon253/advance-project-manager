/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Info, X, CheckSquare, ArrowRight } from "lucide-react";
import { renderNotificationIcon } from "./NotificationItem";

export function NotificationDetailsDrawer({
  selectedNotif,
  setSelectedNotif,
  getTaskInfo,
  getProjectInfo,
  setActiveTaskId,
  navigate,
  handleToggleRead,
  handleDeleteNotification
}) {
  if (!selectedNotif) return null;

  const relatedTask = getTaskInfo(selectedNotif.taskId);
  const relatedProject = getProjectInfo(selectedNotif.projectId);

  const detailsBody = (
    <>
      <div className="flex items-start gap-3">
        {renderNotificationIcon(selectedNotif.type)}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-zinc-900 dark:text-white break-words leading-snug">
            {selectedNotif.title}
          </h4>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-tnum mt-0.5 block">
            {selectedNotif.time || "Just now"}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
        {selectedNotif.message}
      </div>

      {/* Context links for tasks/projects */}
      {(selectedNotif.taskId || selectedNotif.projectId) && (
        <div className="p-3 sm:p-3.5 rounded-lg bg-primary/8 dark:bg-primary/15 border border-primary/20 text-xs space-y-2 sm:space-y-2.5">
          <h5 className="font-semibold text-[11px] tracking-wide uppercase text-primary">Related items</h5>

          {selectedNotif.taskId && relatedTask && (
            <div className="flex justify-between items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold truncate text-xs text-zinc-800 dark:text-zinc-200">
                  {relatedTask.title}
                </span>
              </div>
              <button
                onClick={() => setActiveTaskId(selectedNotif.taskId)}
                className="btn btn-primary btn-sm shrink-0"
              >
                <span>Open</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {selectedNotif.projectId && relatedProject && (
            <div className="flex justify-between items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: relatedProject.color }}
                />
                <span className="font-semibold truncate text-xs text-zinc-800 dark:text-zinc-200">
                  {relatedProject.name}
                </span>
              </div>
              <button
                onClick={() => navigate(`/projects/${selectedNotif.projectId}`)}
                className="btn btn-secondary btn-sm shrink-0"
              >
                <span>Visit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  const footerButtons = (
    <>
      <button onClick={() => handleToggleRead(selectedNotif.id)} className="btn btn-secondary btn-sm flex-1">
        {selectedNotif.read ? "Mark Unread" : "Mark Read"}
      </button>
      <button
        onClick={() => handleDeleteNotification(selectedNotif.id)}
        className="btn btn-danger-soft btn-sm flex-1"
      >
        Delete Alert
      </button>
    </>
  );

  return (
    <>
      {/* Mobile / tablet: bottom sheet */}
      <div className="modal-overlay lg:hidden" onClick={() => setSelectedNotif(null)}>
        <div
          className="modal-panel sm:max-w-md"
          role="dialog"
          aria-modal="true"
          aria-label="Alert details"
          onClick={(e) => e.stopPropagation()}
          id="inbox-alert-details-sheet"
        >
          <div className="sheet-grabber" />
          <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Alert Details</span>
            </div>
            <button
              onClick={() => setSelectedNotif(null)}
              className="btn-icon"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 sm:px-5 sm:py-4 sm:space-y-4 text-left">{detailsBody}</div>
          <div className="flex gap-2 px-4 pt-3 sm:px-5 sm:pt-3.5 border-t border-zinc-100 dark:border-zinc-800 pb-[max(0.875rem,env(safe-area-inset-bottom))] shrink-0">
            {footerButtons}
          </div>
        </div>
      </div>

      {/* Desktop: right-side static panel */}
      <div
        className="hidden lg:flex w-96 shrink-0 flex-col card p-5 space-y-4 animate-in fade-in slide-in-from-right duration-200 text-left"
        id="inbox-alert-details-sidebar"
      >
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Alert Details</span>
          </div>
          <button
            onClick={() => setSelectedNotif(null)}
            className="btn-icon"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">{detailsBody}</div>

        <div className="flex gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          {footerButtons}
        </div>
      </div>
    </>
  );
}
