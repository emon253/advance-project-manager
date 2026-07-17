/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { filterWorkspacesList } from "../util/workspaceUtils";

export function useWorkspaceFilter(workspaces) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'active', 'archived'

  const filteredWorkspaces = useMemo(() => {
    return filterWorkspacesList(workspaces, searchTerm, activeTab);
  }, [workspaces, searchTerm, activeTab]);

  return {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    filteredWorkspaces
  };
}
