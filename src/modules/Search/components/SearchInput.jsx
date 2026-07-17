/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search } from "lucide-react";

export function SearchInput({ searchTerm, setSearchTerm, handleSearchSubmit }) {
  return (
    <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          id="workspace-search-input"
          placeholder="Search tasks, priorities or descriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search workspace"
          className="field h-10 pl-9 text-sm"
        />
      </div>
      <button type="submit" className="btn btn-primary h-10 shrink-0">
        Search
      </button>
    </form>
  );
}
