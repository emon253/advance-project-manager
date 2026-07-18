/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { inviteApi } from "../../../api/endpoints";
import { tokenStore } from "../../../api/client";
import { getIconComponent } from "../../../components/common/IconHelper";
import { Wordmark } from "../../../components/common/Logo";
import { MailX, CheckCircle2, Users, Loader2 } from "lucide-react";

/**
 * Invitation landing page (/invite/:token) — public token lookup, then:
 * signed-in invitees accept one-click; anonymous visitors provide a password
 * (existing account) or name + password (new account), per plan §6.
 */
export function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { acceptInvite, isAuthenticated } = useAppState();

  const [lookup, setLookup] = useState(null);      // PublicInviteResponse
  const [lookupError, setLookupError] = useState(null); // invalid | accepted | revoked | expired
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [needsCredentials, setNeedsCredentials] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    inviteApi.lookup(token)
      .then((data) => { if (!cancelled) { setLookup(data); setName(data.email?.split("@")[0] || ""); } })
      .catch((err) => {
        if (cancelled) return;
        const code = err?.code;
        setLookupError(code === "INVITE_ACCEPTED" ? "accepted"
          : code === "INVITE_REVOKED" ? "revoked"
          : code === "INVITE_EXPIRED" ? "expired"
          : "invalid");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = async (credentials) => {
    setAccepting(true);
    setFormError("");
    const res = await acceptInvite(token, credentials);
    setAccepting(false);
    if (res.success) {
      navigate("/dashboard");
      return;
    }
    if (res.error === "credentials") {
      setNeedsCredentials(true);
      setFormError(res.message || "Enter your account password to join.");
    } else {
      setLookupError(res.error);
    }
  };

  const handleAcceptClick = () => {
    // Signed-in invitees join one-click; anonymous visitors need credentials.
    if (isAuthenticated && tokenStore.hasSession) {
      handleAccept(undefined);
    } else if (needsCredentials || !isAuthenticated) {
      if (!needsCredentials) {
        setNeedsCredentials(true);
        return;
      }
      if (!password) {
        setFormError("A password is required to join.");
        return;
      }
      handleAccept({ name: name.trim() || undefined, password });
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (lookupError || !lookup) {
    const reason = lookupError === "accepted"
      ? { title: "This invitation was already used", body: "You've already joined this workspace. Just sign in to continue." }
      : lookupError === "revoked"
      ? { title: "This invitation was revoked", body: "The workspace admin withdrew this invitation. Ask them to send a new one." }
      : lookupError === "expired"
      ? { title: "This invitation expired", body: "Invitations are valid for 14 days. Ask the workspace admin for a fresh link." }
      : { title: "This invite link isn't valid", body: "The link may be mistyped or was already replaced." };

    return (
      <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5 py-8 pt-safe pb-safe">
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-xl mb-4">
            <MailX className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white">{reason.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">{reason.body}</p>
          <Link to="/login" className="btn btn-primary mt-6 w-full">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5 py-8 pt-safe pb-safe">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="mb-4"><Wordmark className="text-2xl" /></div>
        </div>

        <div className="w-full sm:bg-white sm:dark:bg-zinc-900 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800 sm:rounded-xl sm:shadow-soft sm:p-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 dark:bg-primary/15 text-primary mb-3">
            {getIconComponent(lookup.logoKey, "w-5 h-5")}
          </span>

          <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white leading-snug">
            {lookup.inviterName} invited you to join
            <span className="block text-primary">{lookup.workspaceName}</span>
          </h1>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="badge bg-primary/8 text-primary border-primary/20 dark:bg-primary/15">
              {lookup.role ? lookup.role.charAt(0) + lookup.role.slice(1).toLowerCase() : "Member"}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {lookup.memberCount} members
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-3">
            Joining as <span className="font-semibold text-zinc-700 dark:text-zinc-200">{lookup.email}</span>
          </p>

          {needsCredentials && (
            <div className="mt-4 space-y-3 text-left">
              <div>
                <label htmlFor="invite-name" className="label">Your name</label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="invite-password" className="label">Password</label>
                <input
                  id="invite-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  placeholder="Existing password, or choose one"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-400 font-medium mt-1.5">
                  Already have an account with this email? Use its password. New here? This becomes your password.
                </p>
              </div>
              {formError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formError}</p>}
            </div>
          )}

          <button
            onClick={handleAcceptClick}
            disabled={accepting}
            className="btn btn-primary w-full mt-5"
          >
            {accepting ? "Joining workspace…" : "Accept invitation"}
          </button>
          <Link to="/login" className="block mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            Decline
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400 font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Accepting creates your account with this email if you don't have one.
        </p>
      </div>
    </div>
  );
}
