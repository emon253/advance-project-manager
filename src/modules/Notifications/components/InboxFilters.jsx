/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, X } from "lucide-react";

export function InboxFilters({ searchQuery, setSearchQuery, selectedType, setSelectedType }) {
  return (
    <div className="flex items-center gap-2 w-full" id="inbox-search-filtering">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search inbox..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search notifications"
          className="field pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        aria-label="Filter notifications by type"
        className="field w-auto shrink-0 max-w-[46%] sm:max-w-[220px]"
      >
        <option value="all">All Alerts</option>
        <option value="assigned">Assignee triggers</option>
        <option value="due_soon">Due soon warning</option>
        <option value="overdue">Overdue task alert</option>
        <option value="mention">Mention discussions</option>
        <option value="project_update">Project updates</option>
        <option value="reminder">Reminder alerts</option>
        <option value="file_attached">Deliverable attachment</option>
        <option value="status_changed">Status changed</option>
        <option value="milestone_rescheduled">Milestones reschedules</option>
      </select>
    </div>
  );
}
