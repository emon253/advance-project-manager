/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { Plus } from "lucide-react";

// Modular Imports
import { useWorkspaceFilter } from "../hooks/useWorkspaceFilter";
import { useWorkspaceActions } from "../hooks/useWorkspaceActions";
import { WorkspaceDirectoryToolbar } from "../components/WorkspaceDirectoryToolbar";
import { WorkspaceCardGrid } from "../components/WorkspaceCardGrid";
import { CreateWorkspaceDialog } from "../components/CreateWorkspaceDialog";

import "../style/workspace.css";

export function WorkspacesPage() {
  const {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    projects,
    tasks,
    addWorkspace
  } = useAppState();

  // Custom filters hook
  const {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    filteredWorkspaces
  } = useWorkspaceFilter(workspaces);

  // Custom actions hook
  const {
    showCreateModal,
    setShowCreateModal,
    newWsName,
    setNewWsName,
    newWsLogo,
    setNewWsLogo,
    newWsDesc,
    setNewWsDesc,
    handleSwitchWorkspace,
    handleCreateWorkspace,
    handleRestoreWorkspace
  } = useWorkspaceActions({
    setActiveWorkspaceId,
    addWorkspace,
    setWorkspaces
  });

  const totalCount = workspaces.length;
  const activeCount = workspaces.filter(w => !w.isArchived).length;
  const archivedCount = workspaces.filter(w => w.isArchived).length;

  return (
    <div className="text-left" id="workspaces-directory-root">

      {/* Page Header */}
      <PageHeader
        title="Workspaces"
        description="Browse workspaces, switch the active one, and manage team scopes."
      >
        <button
          onClick={() => setShowCreateModal(true)}
          type="button"
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Create workspace</span>
        </button>
      </PageHeader>

      <div className="space-y-2.5 sm:space-y-4">
        {/* Directory Filter Panel */}
        <WorkspaceDirectoryToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalCount={totalCount}
          activeCount={activeCount}
          archivedCount={archivedCount}
        />

        {/* Grid of Workspace Cards */}
        <WorkspaceCardGrid
          filteredWorkspaces={filteredWorkspaces}
          activeWorkspaceId={activeWorkspaceId}
          setActiveWorkspaceId={setActiveWorkspaceId}
          projects={projects}
          tasks={tasks}
          handleSwitchWorkspace={handleSwitchWorkspace}
          handleRestoreWorkspace={handleRestoreWorkspace}
          setSearchTerm={setSearchTerm}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* CREATE WORKSPACE POPUP DIALOG */}
      {showCreateModal && (
        <CreateWorkspaceDialog
          handleCreateWorkspace={handleCreateWorkspace}
          newWsName={newWsName}
          setNewWsName={setNewWsName}
          newWsLogo={newWsLogo}
          setNewWsLogo={setNewWsLogo}
          newWsDesc={newWsDesc}
          setNewWsDesc={setNewWsDesc}
          setShowCreateModal={setShowCreateModal}
        />
      )}

    </div>
  );
}
