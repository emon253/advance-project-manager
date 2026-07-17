/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function filterWorkspacesList(workspaces, searchTerm, activeTab) {
  return workspaces.filter((w) => {
    const matchesSearch = 
      (w.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (w.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "active") return matchesSearch && !w.isArchived;
    if (activeTab === "archived") return matchesSearch && w.isArchived;
    return matchesSearch; // 'all'
  });
}
