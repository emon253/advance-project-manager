/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

/** Console-wide date formats. */
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

export const timeAgo = (iso) => {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
};

const SUB_STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  trialing: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  canceled: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

export function SubStatusBadge({ status }) {
  return (
    <span className={`badge capitalize ${SUB_STATUS_STYLES[status] || SUB_STATUS_STYLES.canceled}`}>{status}</span>
  );
}

const PLAN_STATUS_STYLES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  INACTIVE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  ARCHIVED: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

export function PlanStatusBadge({ status }) {
  return <span className={`badge ${PLAN_STATUS_STYLES[status] || ""}`}>{status.toLowerCase()}</span>;
}

export function AccountStatusBadge({ enabled }) {
  return enabled ? (
    <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Active</span>
  ) : (
    <span className="badge bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Suspended</span>
  );
}

/** Numeric pager for PageResponse-backed tables. */
export function Pager({ page, totalPages, totalElements, onPage, noun = "rows" }) {
  if (totalElements === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        {totalElements.toLocaleString()} {noun} · page {page + 1} of {Math.max(1, totalPages)}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className="btn-icon" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button type="button" className="btn-icon" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Confirmation dialog for sensitive owner actions. `danger` renders the CTA
 * red; `confirmWord` (e.g. a plan code) requires typing it before confirming.
 */
export function ConfirmDialog({ open, title, body, confirmLabel, danger, confirmWord, busy, onCancel, onConfirm, children }) {
  const [typed, setTyped] = React.useState("");
  React.useEffect(() => { if (open) setTyped(""); }, [open]);
  if (!open) return null;
  const blocked = confirmWord ? typed.trim() !== confirmWord : false;
  return (
    <div className="modal-overlay">
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />
      <div className="modal-panel sm:max-w-sm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grabber" />
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-start gap-3">
            {danger && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-4.5 h-4.5" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white">{title}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">{body}</p>
            </div>
          </div>
          {children}
          {confirmWord && (
            <div className="mt-3">
              <label className="label" htmlFor="owner-confirm-word">Type <span className="font-bold">{confirmWord}</span> to confirm</label>
              <input id="owner-confirm-word" className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            </div>
          )}
        </div>
        <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={blocked || busy}
            className={`btn flex-1 ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
