/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";

// Modular Imports
import { useSearchQuery } from "../hooks/useSearchQuery";
import { SearchInput } from "../components/SearchInput";
import { SearchFilters } from "../components/SearchFilters";
import { SearchList } from "../components/SearchList";

import "../style/search.css";

export function SearchPage() {
  const { activeWorkspaceTasks, activeWorkspaceProjects, users, setActiveTaskId } = useAppState();

  // Custom search query hook
  const {
    searchTerm,
    setSearchTerm,
    sortParam,
    setSortParam,
    handleSearchSubmit,
    sortedTasks
  } = useSearchQuery(activeWorkspaceTasks);

  return (
    <div className="space-y-2.5 sm:space-y-5 text-left" id="search-page-portfolio-root">
      {/* 1. Page Header */}
      <PageHeader 
        title="Deep Filter Search" 
        description="Filter specific deliverables, priorities, or commentaries across the active workspace."
      />

      {/* 2. Search Input */}
      <SearchInput
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearchSubmit={handleSearchSubmit}
      />

      {/* 3. Search Filters & Match summaries */}
      <SearchFilters
        sortParam={sortParam}
        setSortParam={setSortParam}
        matchCount={sortedTasks.length}
      />

      {/* 4. Display list catalog */}
      <SearchList
        sortedTasks={sortedTasks}
        activeWorkspaceProjects={activeWorkspaceProjects}
        users={users}
        setActiveTaskId={setActiveTaskId}
      />

    </div>
  );
}

