/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { X, UserPlus, FolderPlus } from "lucide-react";

/**
 * First-run onboarding for new company workspaces (/welcome):
 * invite teammates + create the first project, or skip.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, activeWorkspace, createInvite, addProject } = useAppState();

  const [emailInput, setEmailInput] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [inviteError, setInviteError] = useState("");
  const [projectName, setProjectName] = useState("");

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("That doesn't look like a valid email.");
      return;
    }
    if (invitedEmails.includes(email)) {
      setInviteError("Already added.");
      return;
    }
    setInvitedEmails((prev) => [...prev, email]);
    setEmailInput("");
    setInviteError("");
  };

  const handleFinish = () => {
    invitedEmails.forEach((email) => createInvite(activeWorkspace.id, { email, role: "Member" }));
    if (projectName.trim()) {
      addProject({ name: projectName.trim(), description: "First project — created during onboarding." });
    }
    navigate("/dashboard");
  };

  const hasAnything = invitedEmails.length > 0 || projectName.trim();

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5 py-8 pt-safe pb-safe">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-primary text-white rounded-xl mb-3 shadow-soft font-display font-bold text-2xl leading-none select-none">
            C
          </div>
          <h1 className="font-display font-bold text-xl text-zinc-900 dark:text-white">
            Welcome to {activeWorkspace?.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Two quick steps to get your team productive.
          </p>
        </div>

        <div className="space-y-3">
          {/* Step 1: invite teammates */}
          <div className="card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <UserPlus className="w-4 h-4 text-primary" />
              Invite your team
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              They'll get an email link to join this workspace.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="teammate@company.com"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setInviteError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
                className="field flex-1"
                aria-label="Teammate email"
              />
              <button type="button" onClick={addEmail} className="btn btn-secondary shrink-0">
                Add
              </button>
            </div>
            {inviteError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1.5">{inviteError}</p>}

            {invitedEmails.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {invitedEmails.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/8 dark:bg-primary/15 text-primary text-xs font-semibold">
                    {email}
                    <button
                      type="button"
                      onClick={() => setInvitedEmails((prev) => prev.filter((e) => e !== email))}
                      className="p-0.5 rounded-full hover:bg-primary/15 cursor-pointer"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: first project */}
          <div className="card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <FolderPlus className="w-4 h-4 text-primary" />
              Create your first project
            </h2>
            <input
              type="text"
              placeholder="e.g. Website Redesign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="field mt-3"
              aria-label="First project name"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <button onClick={handleFinish} disabled={!hasAnything} className="btn btn-primary w-full">
            {invitedEmails.length > 0
              ? `Send ${invitedEmails.length} invite${invitedEmails.length > 1 ? "s" : ""} & continue`
              : "Continue"}
          </button>
          <button onClick={() => navigate("/dashboard")} className="btn btn-ghost w-full">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
