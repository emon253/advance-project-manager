/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

function TabButton({ isActive, onClick, children }) {
  return (
    <button
      onClick={onClick}
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-10 text-[13px] sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0 ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

export function ProjectPortfolioTabs({ filterTab, setFilterTab, activeCount, archivedCount }) {
  return (
    <div
      className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0"
      role="tablist"
      aria-label="Project portfolio filter"
    >
      <TabButton isActive={filterTab === "active"} onClick={() => setFilterTab("active")}>
        Active Projects ({activeCount})
      </TabButton>
      <TabButton isActive={filterTab === "archived"} onClick={() => setFilterTab("archived")}>
        Archived / Closed Portfolio ({archivedCount})
      </TabButton>
    </div>
  );
}

export function ProjectDetailsTabs({ activeTab, setActiveTab, pendingTasksCount, showAdminTab = true }) {
  const tabs = [
    { id: "overview", label: "Executive Summary" },
    { id: "tasks", label: `Tasks Lineup (${pendingTasksCount})` },
    { id: "files", label: `File Cabinet` },
    ...(showAdminTab ? [{ id: "settings", label: "Administrative Controls" }] : [])
  ];

  return (
    <div
      className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0"
      role="tablist"
      aria-label="Project sections"
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          isActive={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </TabButton>
      ))}
    </div>
  );
}
