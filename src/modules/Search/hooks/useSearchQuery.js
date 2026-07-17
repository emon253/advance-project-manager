/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { filterTasksBySearch, sortSearchedTasks } from "../util/searchUtils";

export function useSearchQuery(activeWorkspaceTasks) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Query state
  const rawQ = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(rawQ);
  
  // Sort state
  const [sortParam, setSortParam] = useState("dueDate"); // title, priority, dueDate

  useEffect(() => {
    setSearchTerm(rawQ);
  }, [rawQ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm.trim() });
  };

  const sortedTasks = useMemo(() => {
    const matched = filterTasksBySearch(activeWorkspaceTasks, rawQ);
    return sortSearchedTasks(matched, sortParam);
  }, [activeWorkspaceTasks, rawQ, sortParam]);

  return {
    searchTerm,
    setSearchTerm,
    sortParam,
    setSortParam,
    handleSearchSubmit,
    sortedTasks
  };
}
