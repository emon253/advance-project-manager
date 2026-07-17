/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Inbox, SearchX, CheckCheck } from "lucide-react";
import { EmptyState } from "../../../components/common/EmptyState";

export function NotificationEmptyState({ searchQuery, setSearchQuery, setSelectedType, activeTab }) {
  if (searchQuery !== "") {
    return (
      <div id="notification-empty-state">
        <EmptyState
          title="No matching notifications"
          description="Try a different keyword or reset the selected alert filter."
          icon={<SearchX className="w-7 h-7" />}
          buttonText="Reset filters"
          onButtonClick={() => {
            setSearchQuery("");
            setSelectedType("all");
          }}
        />
      </div>
    );
  }

  if (activeTab === "unread") {
    return (
      <div id="notification-empty-state">
        <EmptyState
          title="You are all caught up"
          description="There are no unread notifications right now."
          icon={<CheckCheck className="w-7 h-7" />}
        />
      </div>
    );
  }

  return (
    <div id="notification-empty-state">
      <EmptyState
        title="Inbox is empty"
        description="Task assignments, project updates, file drops, and reminders will appear here."
        icon={<Inbox className="w-7 h-7" />}
      />
    </div>
  );
}
