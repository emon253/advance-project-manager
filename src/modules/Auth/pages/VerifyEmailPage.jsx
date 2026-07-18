/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { MailCheck, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

/**
 * Email verification (/verify-email).
 * - Arriving from the emailed link (?token=…): verifies against the backend
 *   immediately and shows the outcome.
 * - Arriving right after signup (?email=…, no token): "check your inbox"
 *   holding screen with resend.
 */
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { verifyEmail, resendVerification, isAuthenticated, refreshCurrentUser } = useAppState();

  const email = params.get("email") || "your email";
  const next = params.get("next") || "/dashboard";
  const token = params.get("token");

  const [state, setState] = useState(token ? "verifying" : "waiting"); // verifying | verified | failed | waiting
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setState("verified");
        // A signed-in user just verified in this tab: sync /me so the
        // in-app "verify your email" banner disappears immediately.
        if (isAuthenticated) refreshCurrentUser();
      })
      .catch(() => !cancelled && setState("failed"));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    try {
      await resendVerification(params.get("email"));
    } finally {
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5 py-8 pt-safe pb-safe">
      <div className="w-full max-w-sm mx-auto text-center">
        <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-4 ${
          state === "verified" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : state === "failed" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400"
          : "bg-primary/8 dark:bg-primary/15 text-primary"}`}>
          {state === "verified" ? <CheckCircle2 className="w-6 h-6" />
            : state === "failed" ? <ShieldAlert className="w-6 h-6" />
            : state === "verifying" ? <Loader2 className="w-6 h-6 animate-spin" />
            : <MailCheck className="w-6 h-6" />}
        </div>

        {state === "verifying" && (
          <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Verifying your email…</h1>
        )}

        {state === "verified" && (
          <>
            <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Email verified</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
              Your account is confirmed. Let's get you set up.
            </p>
            <button onClick={() => navigate(isAuthenticated ? next : "/login")} className="btn btn-primary w-full mt-6">
              {isAuthenticated ? "Continue" : "Continue to sign in"}
            </button>
          </>
        )}

        {state === "failed" && (
          <>
            <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white">This link didn't work</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
              The verification link is invalid or has expired. Request a fresh one below.
            </p>
            <button onClick={handleResend} className="btn btn-primary w-full mt-6">
              {resent ? "Sent — check your inbox" : "Send a new link"}
            </button>
          </>
        )}

        {state === "waiting" && (
          <>
            <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white">Check your inbox</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
              We sent a verification link to
              <span className="block font-semibold text-zinc-800 dark:text-zinc-100 mt-0.5">{email}</span>
            </p>

            <button onClick={() => navigate(next)} className="btn btn-primary w-full mt-6">
              Continue for now
            </button>

            <div className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Didn't get it?{" "}
              {resent ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Sent again — check spam too.</span>
              ) : (
                <button onClick={handleResend} className="font-semibold text-primary hover:underline cursor-pointer">
                  Resend email
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
