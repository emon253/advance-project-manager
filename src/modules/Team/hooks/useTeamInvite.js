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
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [successBanner, setSuccessBanner] = useState("");
  const [inviteError, setInviteError] = useState("");

  // Clear any stale inline error each time the invite dialog opens
  useEffect(() => {
    if (showInviteForm) setInviteError("");
  }, [showInviteForm]);

  const handleInviteUser = (e) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    // Create a pending invitation — the invitee joins once they accept their link
    const result = createInvite(activeWorkspace.id, {
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole
    });

    if (result?.error) {
      setInviteError(result.error);
      return;
    }

    setSuccessBanner(`Invitation sent to ${result.invite.email} — they'll appear here once they accept (pending until then).`);
    setTimeout(() => setSuccessBanner(""), 5000);

    // Clear
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Member");
    setShowInviteForm(false);
  };

  return {
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
  };
}
