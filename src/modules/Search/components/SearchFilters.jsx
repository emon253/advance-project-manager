/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowDownUp } from "lucide-react";

export function SearchFilters({ sortParam, setSortParam, matchCount }) {
  return (
    <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 shrink-0">
        <label
          htmlFor="search-sort-select"
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 shrink-0"
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          Sort by
        </label>
        <select
          id="search-sort-select"
          value={sortParam}
          onChange={(e) => setSortParam(e.target.value)}
          className="field h-8 w-auto text-xs"
        >
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority Level</option>
          <option value="title">Alphabetical Title</option>
        </select>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-tnum">{matchCount}</span>{" "}
        {matchCount === 1 ? "match" : "matches"}
      </div>
    </div>
  );
}
