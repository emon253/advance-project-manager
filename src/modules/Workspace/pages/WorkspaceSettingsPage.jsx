/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import {
  Check,
  AlertTriangle,
  X,
  Folder,
  CheckSquare
} from "lucide-react";

// Modular Imports
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { WorkspaceDetailsForm } from "../components/WorkspaceDetailsForm";
import { Link } from "react-router-dom";
import { CreditCard, ChevronRight } from "lucide-react";
import { getPlan, isTrialActive, trialDaysLeft } from "../../Billing/util/billingUtils";
import { WorkspaceOccupantsMatrix } from "../components/WorkspaceOccupantsMatrix";
import { WorkspacePendingInvites } from "../components/WorkspacePendingInvites";
import { CorporateTiersSelector } from "../components/CorporateTiersSelector";
import { WorkspaceDangerZone } from "../components/WorkspaceDangerZone";
import { WorkspaceSettingsModals } from "../components/WorkspaceSettingsModals";

import "../style/workspace.css";

export function WorkspaceSettingsPage() {
  const {
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    projects,
    tasks,
    currentUser,
    logActivity,
    pushNotification,
    deleteWorkspace,
    can,
    currentRole,
    invites,
    createInvite,
    revokeInvite,
    resendInvite,
    transferOwnership,
    leaveWorkspace
  } = useAppState();

  const {
    ws,
    wsName,
    setWsName,
    wsLogo,
    setWsLogo,
    wsDescription,
    setWsDescription,
    success,
    setSuccess,
    error,
    setError,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showArchiveConfirm,
    setShowArchiveConfirm,
    showInviteModal,
    setShowInviteModal,
    inviteName,
    setInviteName,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteError,
    inviteBusy,
    handleUpdateDetails,
    handleInviteMember,
    handleChangeMemberRole,
    handleRemoveMember,
    handleArchiveWorkspace,
    handleRestoreWorkspace,
    handleDeleteWorkspace,
    handleQuickSwitch,
    handleTransferOwnership,
    handleLeaveWorkspace
  } = useWorkspaceSettings({
    workspaces,
    setWorkspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeWorkspace,
    currentUser,
    logActivity,
    pushNotification,
    deleteWorkspace,
    createInvite,
    transferOwnership,
    leaveWorkspace
  });

  // Calculate summaries specific to this workspace
  const wsProjects = projects.filter((p) => p.workspaceId === ws.id);
  const wsProjectIds = wsProjects.map((p) => p.id);
  const wsTasks = tasks.filter((t) => wsProjectIds.includes(t.projectId));
  const pendingTasksCount = wsTasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length;

  const activeWorkspaces = workspaces.filter(w => !w.isArchived);
  const archivedWorkspaces = workspaces.filter(w => w.isArchived);
  const currentMembers = ws.members || [];
  const pendingInvites = invites.filter((i) => i.workspaceId === ws.id && i.status === "pending");

  return (
    <div className="text-left max-w-5xl" id="workspace-settings-root">

      {/* 1. Header Area with dynamic Stats Summary badges */}
      <PageHeader
        title="Workspace"
        description="Manage workspace details, members, roles, and archival."
      >
        {/* Dynamic workspace stats summary widget */}
        <div className="card flex items-center gap-1 p-2.5 select-none" id="ws-stats-summary">
          <div className="text-center px-3 border-r border-zinc-200/70 dark:border-zinc-700/70">
            <span className="block font-mono font-tnum font-semibold text-sm text-primary">{wsProjects.length}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1"><Folder className="w-3 h-3" /> Projects</span>
          </div>
          <div className="text-center px-3">
            <span className="block font-mono font-tnum font-semibold text-sm text-amber-600 dark:text-amber-500">{pendingTasksCount}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Remaining</span>
          </div>
        </div>
      </PageHeader>

      <div className="space-y-2.5 sm:space-y-5">
        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-in fade-in" id="ws-settings-success">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 animate-in fade-in" id="ws-settings-error">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} type="button" aria-label="Dismiss error" className="ml-auto p-1 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main split dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-5 items-start" id="ws-management-split-grid">

          {/* Left Column (2-Span): Details + Members */}
          <div className="lg:col-span-2 space-y-2.5 sm:space-y-5">

            {/* Card 1: Edit Workspace Specifications Form */}
            <WorkspaceDetailsForm
              ws={ws}
              wsLogo={wsLogo}
              setWsLogo={setWsLogo}
              wsName={wsName}
              setWsName={setWsName}
              wsDescription={wsDescription}
              setWsDescription={setWsDescription}
              handleUpdateDetails={handleUpdateDetails}
              canEdit={can("manageWorkspace")}
            />

            {/* Card 2: Workspace Occupants & Delegation Matrix */}
            <WorkspaceOccupantsMatrix
              currentMembers={currentMembers}
              currentUser={currentUser}
              setError={setError}
              setShowInviteModal={setShowInviteModal}
              handleChangeMemberRole={handleChangeMemberRole}
              handleRemoveMember={handleRemoveMember}
              canManageMembers={can("manageMembers")}
              canTransferOwnership={can("transferOwnership")}
              handleTransferOwnership={handleTransferOwnership}
            />

            {/* Card 3: Pending invitations awaiting acceptance */}
            {can("manageMembers") && (
              <WorkspacePendingInvites
                pendingInvites={pendingInvites}
                revokeInvite={revokeInvite}
                resendInvite={resendInvite}
              />
            )}

          </div>

          {/* Right Column (1-Span): Switching, Archive, Delete safe actions */}
          <div className="space-y-2.5 sm:space-y-5">

            {/* Plan & Billing pointer */}
            <PlanBillingCard />

            {/* Box 3: Workspace switcher list inside settings */}
            <CorporateTiersSelector
              ws={ws}
              activeWorkspaces={activeWorkspaces}
              archivedWorkspaces={archivedWorkspaces}
              handleQuickSwitch={handleQuickSwitch}
              handleRestoreWorkspace={handleRestoreWorkspace}
            />

            {/* Box 4: Danger zone with Archive, Delete & Leave commands */}
            <WorkspaceDangerZone
              ws={ws}
              setError={setError}
              setShowArchiveConfirm={setShowArchiveConfirm}
              setShowDeleteConfirm={setShowDeleteConfirm}
              canArchive={can("archiveWorkspace")}
              canDelete={can("deleteWorkspace")}
              currentRole={currentRole}
              handleLeaveWorkspace={handleLeaveWorkspace}
            />

          </div>

        </div>
      </div>

      {/* POPUP OVERLAYS MODALS */}
      <WorkspaceSettingsModals
        ws={ws}
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        inviteBusy={inviteBusy}
        inviteName={inviteName}
        setInviteName={setInviteName}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        inviteError={inviteError}
        handleInviteMember={handleInviteMember}
        showArchiveConfirm={showArchiveConfirm}
        setShowArchiveConfirm={setShowArchiveConfirm}
        handleArchiveWorkspace={handleArchiveWorkspace}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleDeleteWorkspace={handleDeleteWorkspace}
      />

    </div>
  );
}

function PlanBillingCard() {
  const { activeSubscription, activePlanId } = useAppState();
  const trialing = isTrialActive(activeSubscription);
  const planName = getPlan(trialing ? activeSubscription.plan : activePlanId).name;

  return (
    <Link to="/billing" className="card p-3 sm:p-4 flex items-center gap-3 hover:border-primary/40 transition-colors group">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary shrink-0">
        <CreditCard className="w-4.5 h-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-900 dark:text-white">Plan &amp; Billing</span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
          {trialing ? `${planName} trial — ${trialDaysLeft(activeSubscription)} days left` : `${planName} plan`}
        </span>
      </span>
      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-primary shrink-0 transition-colors" />
    </Link>
  );
}
