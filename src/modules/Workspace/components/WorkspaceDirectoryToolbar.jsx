/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search } from "lucide-react";

export function WorkspaceDirectoryToolbar({
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  totalCount,
  activeCount,
  archivedCount
}) {
  const tabs = [
    { id: "all", label: `All (${totalCount})` },
    { id: "active", label: `Active (${activeCount})` },
    { id: "archived", label: `Archived (${archivedCount})` }
  ];

  return (
    <div className="card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" id="workspaces-directory-toolbar">
      {/* Search Input */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search workspaces..."
          aria-label="Search workspaces"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field pl-9"
        />
      </div>

      {/* Tab filters: horizontal scroll on mobile, never wraps */}
      <div className="overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 shrink-0">
        <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 h-8 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white dark:bg-zinc-900 text-primary shadow-soft"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
