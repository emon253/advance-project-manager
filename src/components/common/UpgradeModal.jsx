/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Zap } from "lucide-react";

/**
 * Paywall sheet shown when a Free-plan limit is hit.
 * `limitText` describes what was blocked, e.g. "Free workspaces include up to 3 projects."
 */
export function UpgradeModal({ isOpen, onClose, title = "Upgrade to keep going", limitText }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="modal-panel sm:max-w-sm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grabber" />

        <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 dark:bg-primary/15 text-primary shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <button type="button" onClick={onClose} className="btn-icon -mr-1.5" aria-label="Close">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
            {limitText || "You've reached a limit of the Free plan."} Upgrade to Pro for unlimited projects, more members, and AI features.
          </p>
        </div>

        <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Not now
          </button>
          <button
            type="button"
            onClick={() => { onClose(); navigate("/billing"); }}
            className="btn btn-primary flex-1"
          >
            See plans
          </button>
        </div>
      </div>
    </div>
  );
}
