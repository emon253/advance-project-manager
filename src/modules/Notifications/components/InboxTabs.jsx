/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Settings } from "lucide-react";

const tabClass = (isActive) =>
  `px-3 sm:px-3.5 py-2.5 text-sm font-medium border-b-2 bg-transparent transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
    isActive
      ? "text-primary border-primary font-semibold"
      : "text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-800 dark:hover:text-zinc-200"
  }`;

export function InboxTabs({ activeTab, setActiveTab, totalCount, unreadCount }) {
  return (
    <div
      className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto no-scrollbar scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0"
      id="inbox-tab-headers"
    >
      <button onClick={() => setActiveTab("all")} className={tabClass(activeTab === "all")}>
        <span className="hidden sm:inline">All Inbox</span>
        <span className="sm:hidden">All</span>{" "}
        <span className="font-tnum">({totalCount})</span>
      </button>
      <button onClick={() => setActiveTab("unread")} className={tabClass(activeTab === "unread")}>
        <span className="hidden sm:inline">Unread Alerts</span>
        <span className="sm:hidden">Unread</span>{" "}
        <span className="font-tnum">({unreadCount})</span>
      </button>
      <button
        onClick={() => setActiveTab("preferences")}
        className={`${tabClass(activeTab === "preferences")} flex items-center gap-1.5`}
      >
        <Settings className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Notification Settings</span>
        <span className="sm:hidden">Settings</span>
      </button>
    </div>
  );
}
