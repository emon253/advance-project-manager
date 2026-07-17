/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";

export function useTeamInvite(users, setUsers) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [successBanner, setSuccessBanner] = useState("");

  const handleInviteUser = (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    // Add mock user
    const newUser = {
      id: "u" + (users.length + 1),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      avatar: null, // fallback
    };

    setUsers((prev) => [...prev, newUser]);
    setSuccessBanner(`Successfully sent workspace authorization code to ${inviteEmail}!`);
    setTimeout(() => setSuccessBanner(""), 5000);
    
    // Clear
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Developer");
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
    handleInviteUser
  };
}
