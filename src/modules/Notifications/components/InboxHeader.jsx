/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PageHeader } from "../../../components/common/PageHeader";
import { CheckCheck, Trash2 } from "lucide-react";

export function InboxHeader({ activeTab, notifications, handleMarkAllRead, handleClearRead }) {
  return (
    <PageHeader
      title="Inbox"
      description="Assigned tasks, team comments, file updates, and upcoming alerts."
    >
      {activeTab !== "preferences" && notifications.length > 0 && (
        <div className="flex gap-2 shrink-0" id="inbox-bulk-actions">
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
            title="Mark all notifications as read"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
          <button
            onClick={handleClearRead}
            className="btn btn-secondary btn-sm"
            title="Clear all read alerts"
            aria-label="Clear all read alerts"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Clear read</span>
          </button>
        </div>
      )}
    </PageHeader>
  );
}
