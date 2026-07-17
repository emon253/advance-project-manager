/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useWorkspaceActions({
  setActiveWorkspaceId,
  addWorkspace,
  setWorkspaces
}) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsLogo, setNewWsLogo] = useState("🚀");
  const [newWsDesc, setNewWsDesc] = useState("");

  const handleSwitchWorkspace = (id) => {
    setActiveWorkspaceId(id);
    navigate("/dashboard");
  };

  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    addWorkspace(newWsName.trim(), newWsLogo, newWsDesc.trim());
    setNewWsName("");
    setNewWsDesc("");
    setNewWsLogo("🚀");
    setShowCreateModal(false);
    navigate("/workspace-settings");
  };

  const handleRestoreWorkspace = (id) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isArchived: false } : w))
    );
  };

  return {
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
  };
}
