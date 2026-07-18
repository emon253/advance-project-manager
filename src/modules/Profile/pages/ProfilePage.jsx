/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { Key, UserCheck, Check, AlertTriangle, Trash2, X } from "lucide-react";

export function ProfilePage() {
  const { currentUser, updateProfile, changePassword, deleteAccount } = useAppState();

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [role] = useState(currentUser?.role || "Member");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState(null);

  // Status banner
  const [msg, setMsg] = useState("");

  // Account deletion confirm sheet
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const deleteConfirmed = deleteConfirmText === "DELETE";

  const openDeleteSheet = () => {
    setDeleteConfirmText("");
    setShowDeleteSheet(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const res = await updateProfile({ name: name.trim(), phone: phone.trim() || null });
    setMsg(res.success ? "Profile updated successfully." : (res.error || "Could not update the profile."));
    setTimeout(() => setMsg(""), 3500);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setPwMsg({ ok: false, text: "Fill in both password fields." });
      return;
    }
    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      setOldPassword("");
      setNewPassword("");
      setPwMsg({ ok: true, text: "Password updated." });
    } else {
      setPwMsg({ ok: false, text: res.error || "Could not change the password." });
    }
    setTimeout(() => setPwMsg(null), 4000);
  };

  return (
    <div className="space-y-3 sm:space-y-5 text-left max-w-2xl">
      <PageHeader
        title="Profile Settings"
        description="Manage your name, contact details, and password."
      />

      {msg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium rounded-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="card p-3 sm:p-5 text-left space-y-3 sm:space-y-5">

        {/* Upper visual avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="sm:hidden"><UserAvatar user={currentUser} size="md" /></span>
          <span className="hidden sm:block"><UserAvatar user={currentUser} size="lg" /></span>
          <div>
            <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white leading-none">
              {currentUser.name}
            </h3>
            <span className="badge mt-1.5 text-primary bg-primary/8 dark:bg-primary/15 border-primary/20">
              {role}
            </span>
          </div>
        </div>

        {/* Change form */}
        <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            <div>
              <label htmlFor="profile-name" className="label">Full Name</label>
              <input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="label">Email Address</label>
              <input
                id="profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            <div>
              <label htmlFor="profile-role" className="label">Role</label>
              <input
                id="profile-role"
                type="text"
                disabled
                value={role}
                className="field bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none"
              />
            </div>

            <div>
              <label htmlFor="profile-phone" className="label">Phone Number</label>
              <input
                id="profile-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button type="submit" className="btn btn-primary">
              <UserCheck className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>

      </div>

      {/* Mock Security parameters block */}
      <div className="card p-3 sm:p-5 text-left space-y-3 sm:space-y-4">
        <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-rose-500" /> Change Password
        </h3>

        <div className="space-y-2.5 sm:space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label htmlFor="profile-old-password" className="label">Current Password</label>
              <input
                id="profile-old-password"
                type="password"
                placeholder="Current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="profile-new-password" className="label">New Password</label>
              <input
                id="profile-new-password"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="field"
              />
            </div>
          </div>
          {pwMsg && (
            <p className={`text-xs font-medium ${pwMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {pwMsg.text}
            </p>
          )}
          <button type="button" onClick={handleChangePassword} className="btn btn-secondary">
            Update Password
          </button>
        </div>
      </div>

      {/* Danger zone: account deletion (mock — backend contract) */}
      <div className="card border-rose-200 dark:border-rose-500/30 p-3 sm:p-5 text-left space-y-2.5 sm:space-y-3">
        <h3 className="font-display font-semibold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger zone
        </h3>

        <div>
          <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Delete account</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 leading-relaxed">
            Permanently deletes your account and removes you from all workspaces. This cannot be undone.
          </p>
        </div>

        <button type="button" onClick={openDeleteSheet} className="btn btn-danger-soft">
          <Trash2 className="w-4 h-4" />
          <span>Delete my account…</span>
        </button>
      </div>

      {/* Confirm sheet: type DELETE to enable the destructive action */}
      {showDeleteSheet && (
        <div className="modal-overlay">
          <div className="absolute inset-0" onClick={() => setShowDeleteSheet(false)} aria-hidden="true" />

          <div className="modal-panel sm:max-w-sm" role="dialog" aria-modal="true" aria-label="Delete account">
            <div className="sheet-grabber" />

            <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button type="button" onClick={() => setShowDeleteSheet(false)} className="btn-icon -mr-1.5" aria-label="Close">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="px-5 pb-4 space-y-3">
              <div>
                <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white">Delete account</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
                  Permanently deletes your account and removes you from all workspaces. This cannot be undone.
                </p>
              </div>

              <div>
                <label htmlFor="delete-account-confirm" className="label">
                  Type DELETE to confirm
                </label>
                <input
                  id="delete-account-confirm"
                  type="text"
                  autoComplete="off"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="field"
                />
              </div>
            </div>

            <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setShowDeleteSheet(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteConfirmed}
                onClick={deleteAccount}
                className="btn btn-danger flex-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete account</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
