/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useAppState } from "../../../app/providers";

export function useTeamInvite() {
  const { activeWorkspace, createInvite } = useAppState();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [successBanner, setSuccessBanner] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);

  // Clear any stale inline error each time the invite dialog opens
  useEffect(() => {
    if (showInviteForm) setInviteError("");
  }, [showInviteForm]);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteEmail.trim() || inviteBusy) return;

    // Create a pending invitation — the invitee joins once they accept their
    // link (and provides their own name at signup, finding #18).
    setInviteBusy(true);
    const result = await createInvite(activeWorkspace.id, {
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole
    });
    setInviteBusy(false);

    if (!result?.success) {
      setInviteError(result?.error || "Could not send the invitation.");
      return;
    }

    setSuccessBanner(`Invitation sent to ${result.invite.email} — they'll appear here once they accept (pending until then).`);
    setTimeout(() => setSuccessBanner(""), 5000);

    setInviteEmail("");
    setInviteRole("Member");
    setShowInviteForm(false);
  };

  return {
    showInviteForm,
    setShowInviteForm,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    successBanner,
    inviteError,
    inviteBusy,
    handleInviteUser
  };
}
