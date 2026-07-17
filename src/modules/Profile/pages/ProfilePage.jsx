/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { Key, UserCheck, Check } from "lucide-react";

export function ProfilePage() {
  const { currentUser, setCurrentUser } = useAppState();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [role, setRole] = useState(currentUser.role || "Lead Architect");
  const [phone, setPhone] = useState("+880 1712-345678");

  // Status banner
  const [msg, setMsg] = useState("");

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setCurrentUser((prev) => ({
      ...prev,
      name: name.trim(),
      email: email.trim(),
    }));
    setMsg("Profile updated successfully.");
    setTimeout(() => setMsg(""), 3500);
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
                className="field"
              />
            </div>
            <div>
              <label htmlFor="profile-new-password" className="label">New Password</label>
              <input
                id="profile-new-password"
                type="password"
                placeholder="New password"
                className="field"
              />
            </div>
          </div>
          <button type="button" className="btn btn-secondary">
            Update Password
          </button>
        </div>
      </div>

    </div>
  );
}
