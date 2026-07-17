/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useWorkspaceSettings({
  workspaces,
  setWorkspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  activeWorkspace,
  currentUser,
  logActivity,
  pushNotification,
  deleteWorkspace
}) {
  const navigate = useNavigate();

  // If activeWorkspace doesn't exist, fall back to avoid crashing
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

  // Sync state with active workspace change
  useEffect(() => {
    if (ws.id) {
      setWsName(ws.name || "");
      setWsLogo(ws.logo || "💼");
      setWsDescription(ws.description || "");
    }
  }, [ws.id]);

  const triggerSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // 1. Action: Edit workspace details
  const handleUpdateDetails = (e) => {
    e.preventDefault();
    if (!wsName.trim()) {
      setError("Workspace name cannot be left empty.");
      return;
    }

    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === ws.id
          ? {
              ...w,
              name: wsName.trim(),
              logo: wsLogo,
              description: wsDescription.trim()
            }
          : w
      )
    );

    logActivity(`updated details for workspace '${wsName.trim()}'`);
    pushNotification(`Workspace '${wsName.trim()}' specifications were updated.`, "update");
    triggerSuccess("Workspace specifications updated successfully!");
  };

  // 2. Action: Invite Member
  const handleInviteMember = (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setError("Please fill out all member invitation fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(inviteEmail)) {
      setError("Please provide a valid email structure.");
      return;
    }

    const initials = inviteName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const colors = [
      "bg-emerald-600 text-white",
      "bg-[#533afd] text-white",
      "bg-rose-600 text-white",
      "bg-amber-600 text-white",
      "bg-sky-600 text-white",
      "bg-purple-600 text-white",
      "bg-fuchsia-600 text-white"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember = {
      id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      avatar: initials || "U",
      color: randomColor,
      role: inviteRole
    };

    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === ws.id) {
          const membersList = w.members || [];
          return { ...w, members: [...membersList, newMember] };
        }
        return w;
      })
    );

    logActivity(`invited member ${inviteName} to workspace`);
    pushNotification(`Member '${inviteName}' invited with role ${inviteRole}.`, "update");
    
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Member");
    setShowInviteModal(false);
    triggerSuccess(`Successfully invited ${newMember.name} to the workspace!`);
  };

  // 3. Action: Change Member Role
  const handleChangeMemberRole = (memberId, newRole) => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === ws.id) {
          const updatedMembers = (w.members || []).map((m) =>
            m.id === memberId ? { ...m, role: newRole } : m
          );
          return { ...w, members: updatedMembers };
        }
        return w;
      })
    );
    logActivity(`updated member role in workspace`);
    triggerSuccess("Occupant permission metrics updated.");
  };

  // 4. Action: Remove Member
  const handleRemoveMember = (memberId) => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === ws.id) {
          const filteredMembers = (w.members || []).filter((m) => m.id !== memberId);
          return { ...w, members: filteredMembers };
        }
        return w;
      })
    );
    logActivity(`removed member from workspace workspace`);
    triggerSuccess("Occupant removed from corporate scope.");
  };

  // 5. Action: Archive workspace tier
  const handleArchiveWorkspace = () => {
    const activeWorkspaces = workspaces.filter(w => !w.isArchived);
    if (activeWorkspaces.length <= 1) {
      setError("Cannot archive the only active corporate workspace. Initialize another workspace first.");
      setShowArchiveConfirm(false);
      return;
    }

    setWorkspaces((prev) =>
      prev.map((w) => (w.id === ws.id ? { ...w, isArchived: true } : w))
    );

    const nextWorkspace = activeWorkspaces.find((w) => w.id !== ws.id);
    if (nextWorkspace) {
      setActiveWorkspaceId(nextWorkspace.id);
    }

    logActivity(`archived workspace '${ws.name}'`);
    pushNotification(`Workspace '${ws.name}' archived successfully.`, "update");
    
    setShowArchiveConfirm(false);
    navigate("/workspace-settings");
    triggerSuccess(`Workspace '${ws.name}' moved to archive tiers.`);
  };

  // 6. Action: Restore archived workspace
  const handleRestoreWorkspace = (restoreId) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === restoreId ? { ...w, isArchived: false } : w))
    );

    setActiveWorkspaceId(restoreId);
    logActivity(`restored archived workspace`);
    pushNotification(`Workspace retrieved from archive safely.`, "update");
    triggerSuccess("Workspace restored successfully!");
  };

  // 7. Action: Delete workspace permanently
  const handleDeleteWorkspace = () => {
    if (workspaces.length <= 1) {
      setError("At least one workspace must remain registered.");
      setShowDeleteConfirm(false);
      return;
    }

    const nextWorkspace = workspaces.find((w) => w.id !== ws.id);
    deleteWorkspace(ws.id);
    
    if (nextWorkspace) {
      setActiveWorkspaceId(nextWorkspace.id);
    }

    logActivity(`permanently deleted workspace ${ws.name}`);
    pushNotification(`Workspace ${ws.name} and associated node structures were deleted.`, "update");

    setShowDeleteConfirm(false);
    navigate("/workspace-settings");
    triggerSuccess("Workspace deleted successfully.");
  };

  const handleQuickSwitch = (id) => {
    setActiveWorkspaceId(id);
    triggerSuccess(`Workspace switched inside current dashboard frame.`);
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
    handleUpdateDetails,
    handleInviteMember,
    handleChangeMemberRole,
    handleRemoveMember,
    handleArchiveWorkspace,
    handleRestoreWorkspace,
    handleDeleteWorkspace,
    handleQuickSwitch
  };
}
