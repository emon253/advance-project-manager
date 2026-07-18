/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../../../app/providers";

/**
 * Workspace settings state + handlers, backed by the API-era provider actions.
 * The injected props object is accepted for call-site compatibility but state
 * now flows exclusively through useAppState().
 */
export function useWorkspaceSettings() {
  const navigate = useNavigate();
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    updateWorkspace,
    deleteWorkspace,
    createInvite,
    transferOwnership,
    leaveWorkspace,
    changeMemberRole,
    removeMember,
  } = useAppState();

  const ws = activeWorkspace || workspaces[0] || {};

  // Form states
  const [wsName, setWsName] = useState("");
  const [wsLogo, setWsLogo] = useState("💼");
  const [wsDescription, setWsDescription] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Modals state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite member states
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviteError, setInviteError] = useState("");

  // Sync form with the active workspace
  useEffect(() => {
    if (ws.id) {
      setWsName(ws.name || "");
      setWsLogo(ws.logo || "💼");
      setWsDescription(ws.description || "");
    }
  }, [ws.id, ws.name, ws.logo, ws.description]);

  useEffect(() => {
    if (showInviteModal) setInviteError("");
  }, [showInviteModal]);

  const triggerSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // 1. Edit workspace details
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) {
      setError("Workspace name cannot be left empty.");
      return;
    }
    await updateWorkspace(ws.id, {
      name: wsName.trim(),
      logo: wsLogo,
      description: wsDescription.trim(),
    });
    triggerSuccess("Workspace details updated successfully!");
  };

  // 2. Invite member — pending invitation via the API
  const handleInviteMember = async (e) => {
    e.preventDefault();
    setInviteError("");

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Please fill out all member invitation fields.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(inviteEmail)) {
      setInviteError("Please provide a valid email structure.");
      return;
    }

    const result = await createInvite(ws.id, {
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    });

    if (result?.error) {
      setInviteError(result.error);
      return;
    }

    setInviteName("");
    setInviteEmail("");
    setInviteRole("Member");
    setShowInviteModal(false);
    triggerSuccess(`Invitation sent to ${result.invite.email}`);
  };

  // 3. Change member role
  const handleChangeMemberRole = async (memberId, newRole) => {
    await changeMemberRole(ws.id, memberId, newRole);
    triggerSuccess("Member role updated.");
  };

  // 4. Remove member
  const handleRemoveMember = async (memberId) => {
    await removeMember(ws.id, memberId);
    triggerSuccess("Member removed from the workspace.");
  };

  // 5. Archive workspace
  const handleArchiveWorkspace = async () => {
    const activeWorkspaces = workspaces.filter((w) => !w.isArchived);
    if (activeWorkspaces.length <= 1) {
      setError("Cannot archive your only active workspace. Create another workspace first.");
      setShowArchiveConfirm(false);
      return;
    }
    await updateWorkspace(ws.id, { isArchived: true });
    const nextWorkspace = activeWorkspaces.find((w) => w.id !== ws.id);
    if (nextWorkspace) setActiveWorkspaceId(nextWorkspace.id);
    setShowArchiveConfirm(false);
    navigate("/workspace-settings");
    triggerSuccess(`Workspace '${ws.name}' archived.`);
  };

  // 6. Restore archived workspace
  const handleRestoreWorkspace = async (restoreId) => {
    await updateWorkspace(restoreId, { isArchived: false });
    setActiveWorkspaceId(restoreId);
    triggerSuccess("Workspace restored successfully!");
  };

  // 7. Delete workspace permanently
  const handleDeleteWorkspace = async () => {
    const result = await deleteWorkspace(ws.id);
    if (result?.error) {
      setError(result.error);
      setShowDeleteConfirm(false);
      return;
    }
    setShowDeleteConfirm(false);
    navigate("/workspace-settings");
    triggerSuccess("Workspace deleted successfully.");
  };

  const handleQuickSwitch = (id) => {
    setActiveWorkspaceId(id);
    triggerSuccess("Workspace switched.");
  };

  // 8. Transfer ownership
  const handleTransferOwnership = async (memberId) => {
    const member = (ws.members || []).find((m) => m.id === memberId);
    await transferOwnership(ws.id, memberId);
    triggerSuccess(`Ownership transferred to ${member?.name || "the selected member"}. You are now an Admin.`);
  };

  // 9. Leave workspace (non-Owners only)
  const handleLeaveWorkspace = async () => {
    const result = await leaveWorkspace(ws.id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    navigate("/workspace-settings");
    triggerSuccess(`You left '${ws.name}'.`);
  };

  return {
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
    setInviteError,
    handleUpdateDetails,
    handleInviteMember,
    handleChangeMemberRole,
    handleRemoveMember,
    handleArchiveWorkspace,
    handleRestoreWorkspace,
    handleDeleteWorkspace,
    handleQuickSwitch,
    handleTransferOwnership,
    handleLeaveWorkspace,
  };
}
