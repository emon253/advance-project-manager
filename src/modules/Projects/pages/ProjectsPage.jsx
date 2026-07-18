/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../../app/providers";
import { useMockQuery } from "../../../hooks/useMockQuery";
import { CardGridSkeleton } from "../../../components/common/Skeleton";
import { ErrorState } from "../../../components/common/ErrorState";

// Modular Imports
import { ProjectHeader } from "../components/ProjectHeader";
import { ProjectFormDialog } from "../components/ProjectFormDialog";
import { ProjectPortfolioTabs } from "../components/ProjectTabs";
import { ProjectList } from "../components/ProjectList";
import { UpgradeModal } from "../../../components/common/UpgradeModal";
import { getPlanLimits } from "../../Billing/util/billingUtils";

import "../style/projects.css";

export function ProjectsPage() {
  const { activeWorkspaceProjects, activeWorkspaceTasks, addProject, canAddProject, activePlanId } = useAppState();

  // Simulated fetch lifecycle for the portfolio grid (loading / error / retry)
  const { isLoading, isError, retry } = useMockQuery();

  const [filterTab, setFilterTab] = useState("active"); // active, archived
  const [showAddForm, setShowAddFormRaw] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Plan gate: opening the create form checks the workspace's project limit first
  const setShowAddForm = (open) => {
    if (open && !canAddProject()) {
      setShowUpgrade(true);
      return;
    }
    setShowAddFormRaw(open);
  };
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjIcon, setNewProjIcon] = useState("🏎️");
  const [newProjColor, setNewProjColor] = useState("#4f46e5");
  const [newProjDeadline, setNewProjDeadline] = useState("");

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    addProject({
      name: newProjName.trim(),
      description: newProjDesc,
      icon: newProjIcon,
      color: newProjColor,
      deadline: newProjDeadline ? new Date(newProjDeadline).toISOString() : null,
    });

    // Reset fields
    setNewProjName("");
    setNewProjDesc("");
    setNewProjIcon("🏎️");
    setNewProjColor("#4f46e5");
    setNewProjDeadline("");
    setShowAddForm(false);
  };

  const displayedProjects = activeWorkspaceProjects.filter((p) => {
    if (filterTab === "active") return p.status !== "Archived";
    return p.status === "Archived";
  });

  const activeCount = activeWorkspaceProjects.filter((p) => p.status !== "Archived").length;
  const archivedCount = activeWorkspaceProjects.filter((p) => p.status === "Archived").length;

  return (
    <div className="space-y-3 sm:space-y-5 text-left" id="projects-page-portfolio-root">
      {/* 1. Module Header */}
      <ProjectHeader
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
      />

      {/* 2. New Project inline dynamic charter form */}
      {showAddForm && (
        <ProjectFormDialog
          handleCreateProject={handleCreateProject}
          newProjName={newProjName}
          setNewProjName={setNewProjName}
          newProjIcon={newProjIcon}
          setNewProjIcon={setNewProjIcon}
          newProjDesc={newProjDesc}
          setNewProjDesc={setNewProjDesc}
          newProjColor={newProjColor}
          setNewProjColor={setNewProjColor}
          newProjDeadline={newProjDeadline}
          setNewProjDeadline={setNewProjDeadline}
          setShowAddForm={setShowAddForm}
        />
      )}

      {/* 3. Portfolio filter tabs */}
      <ProjectPortfolioTabs
        filterTab={filterTab}
        setFilterTab={setFilterTab}
        activeCount={activeCount}
        archivedCount={archivedCount}
      />

      {/* 4. Project listings grid component (loading / error / grid) */}
      {isLoading ? (
        <CardGridSkeleton cards={3} />
      ) : isError ? (
        <ErrorState onRetry={retry} title="Couldn't load projects" />
      ) : (
        <ProjectList
          displayedProjects={displayedProjects}
          tasks={activeWorkspaceTasks}
        />
      )}

      {/* Plan limit paywall */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Project limit reached"
        limitText={`The ${activePlanId === "free" ? "Free" : "current"} plan includes up to ${getPlanLimits(activePlanId).projects} projects per workspace.`}
      />
    </div>
  );
}

