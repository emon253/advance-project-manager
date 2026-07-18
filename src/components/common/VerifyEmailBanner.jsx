/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { useAppState } from "../../app/providers";

/**
 * Slim reminder for signed-in users who haven't confirmed their email yet.
 * Verification is soft (the app stays usable, plan §4) — this keeps the
 * account recoverable without blocking anything. Dismissal lasts for the
 * session only.
 */
export function VerifyEmailBanner() {
  const { currentUser, resendVerification } = useAppState();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (!currentUser || currentUser.emailVerified !== false || dismissed) return null;

  const handleResend = async () => {
    try {
      await resendVerification(currentUser.email);
    } finally {
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    }
  };

  return (
    <div
      className="flex items-center gap-2.5 px-[max(0.75rem,env(safe-area-inset-left))] sm:px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200/70 dark:border-amber-500/20 text-xs font-medium text-amber-900 dark:text-amber-200"
      role="status"
    >
      <MailWarning className="w-4 h-4 text-amber-500 shrink-0" />
      <p className="min-w-0 truncate">
        Please verify your email — we sent a link to{" "}
        <span className="font-semibold">{currentUser.email}</span>.
      </p>
      <div className="ml-auto flex items-center gap-1 shrink-0">
        {sent ? (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 px-2">Sent — check your inbox</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-amber-900 dark:text-amber-100 hover:underline px-2 py-1 cursor-pointer"
          >
            Resend
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss verification reminder"
          className="p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-500/15 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
