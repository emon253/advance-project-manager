/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { Plus, Check } from "lucide-react";

// Modular Imports
import { useTeamInvite } from "../hooks/useTeamInvite";
import { InviteUserDialog } from "../components/InviteUserDialog";
import { TeamList } from "../components/TeamList";
import { UpgradeModal } from "../../../components/common/UpgradeModal";
import { getPlanLimits } from "../../Billing/util/billingUtils";

export function TeamPage() {
  const { users, activeWorkspaceTasks, canAddMember, activePlanId, can } = useAppState();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  // Custom Invitation State Hook — creates pending invites via provider
  const {
    showInviteForm,
    setShowInviteForm,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviteRole,
    setInviteRole,
    successBanner,
    inviteError,
    handleInviteUser
  } = useTeamInvite();

  return (
    <div className="space-y-3 sm:space-y-5 text-left" id="team-page-root">
      {/* 1. Page Header */}
      <PageHeader
        title="Team"
        description="Review team workloads and invite new members to this workspace."
      >
        {can("manageMembers") && (
          <button
            onClick={() => {
              if (!showInviteForm && !canAddMember()) {
                setShowUpgrade(true);
                return;
              }
              setShowInviteForm(!showInviteForm);
            }}
            type="button"
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Associate</span>
          </button>
        )}
      </PageHeader>

      {/* 2. Success feedback banners */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-sm font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* 3. Invite member modal forms */}
      {showInviteForm && (
        <InviteUserDialog
          handleInviteUser={handleInviteUser}
          inviteName={inviteName}
          setInviteName={setInviteName}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          inviteError={inviteError}
          setShowInviteForm={setShowInviteForm}
        />
      )}

      {/* 4. Grid team member profiles lists */}
      <TeamList
        users={users}
        activeWorkspaceTasks={activeWorkspaceTasks}
      />

      {/* Plan limit paywall */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Member limit reached"
        limitText={`The current plan includes up to ${getPlanLimits(activePlanId).members} members per workspace.`}
      />
    </div>
  );
}
