/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ownerApi } from "../../../api/endpoints";
import { X } from "lucide-react";

const toDateInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const toInstant = (dateStr, endOfDay) =>
  dateStr ? new Date(`${dateStr}T${endOfDay ? "23:59:59" : "00:00:00"}Z`).toISOString() : null;

/**
 * The owner's manual subscription control for a single workspace — plan,
 * status, billing interval, seats, renewal/trial dates, limit overrides, notes.
 * Shared by the Subscriptions tab and the Users-detail sheet so the same
 * "assign a plan" flow is reachable from both. On success it calls
 * onUpdated(updatedRow) with the fresh workspace-subscription row.
 */
export function ManageSubscriptionModal({ workspaceId, subscription, title, meta, catalog = [], onClose, onUpdated }) {
  const [form, setForm] = useState({
    plan: subscription.planCode,
    interval: subscription.interval,
    seats: String(subscription.seats),
    status: subscription.status,
    renewsAt: toDateInput(subscription.renewsAt),
    trialEndsAt: toDateInput(subscription.trialEndsAt),
    overrideProjectLimit: subscription.overrideProjectLimit ?? "",
    overrideMemberLimit: subscription.overrideMemberLimit ?? "",
    adminNotes: subscription.adminNotes || "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const field = (key) => ({
    value: form[key] ?? "",
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async () => {
    const seats = parseInt(form.seats, 10);
    if (Number.isNaN(seats) || seats < 1) { setFormError("Seats must be at least 1."); return; }
    if (form.status === "trialing" && !form.trialEndsAt) { setFormError("A trial needs a trial end date."); return; }
    setBusy(true);
    setFormError("");
    try {
      const updated = await ownerApi.subscriptions.update(workspaceId, {
        plan: form.plan,
        interval: form.interval.toUpperCase(),
        seats,
        status: form.status.toUpperCase(),
        renewsAt: toInstant(form.renewsAt, true),
        trialEndsAt: toInstant(form.trialEndsAt, true),
        overrideProjectLimit: form.overrideProjectLimit === "" ? 0 : parseInt(form.overrideProjectLimit, 10),
        overrideMemberLimit: form.overrideMemberLimit === "" ? 0 : parseInt(form.overrideMemberLimit, 10),
        adminNotes: form.adminNotes,
        note: form.note || null,
      });
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      setFormError(err.message || "Could not update the subscription.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="modal-panel sm:max-w-lg" role="dialog" aria-modal="true" aria-label={`Manage ${title}`}>
        <div className="sheet-grabber" />
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white truncate">Manage subscription</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {title}{meta ? ` · ${meta}` : ""}
            </p>
          </div>
          <button type="button" className="btn-icon -mr-1.5" onClick={onClose} aria-label="Close">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-5 pb-4 space-y-3 max-h-[62vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 text-xs font-medium border border-rose-100 dark:border-rose-900/30" role="alert">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sub-plan">Plan</label>
              <select id="sub-plan" className="field" {...field("plan")}>
                {catalog.filter((p) => p.status !== "ARCHIVED" || p.code === form.plan).map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}{p.status === "INACTIVE" ? " (inactive)" : p.status === "ARCHIVED" ? " (archived)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sub-status">Status</label>
              <select id="sub-status" className="field" {...field("status")}>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sub-interval">Billing interval</label>
              <select id="sub-interval" className="field" {...field("interval")}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sub-seats">Seats</label>
              <input id="sub-seats" className="field" type="number" min="1" {...field("seats")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sub-renews">Renews / expires on</label>
              <input id="sub-renews" className="field" type="date" {...field("renewsAt")} />
            </div>
            <div>
              <label className="label" htmlFor="sub-trial">Trial ends on</label>
              <input id="sub-trial" className="field" type="date" {...field("trialEndsAt")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sub-op">Project limit override</label>
              <input id="sub-op" className="field" type="number" min="1" placeholder="Use plan limit" {...field("overrideProjectLimit")} />
            </div>
            <div>
              <label className="label" htmlFor="sub-om">Member limit override</label>
              <input id="sub-om" className="field" type="number" min="1" placeholder="Use plan limit" {...field("overrideMemberLimit")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sub-notes">Internal notes (never shown to the customer)</label>
            <textarea id="sub-notes" rows={2} className="field" placeholder="e.g. Founding-customer deal — renegotiate 2027" {...field("adminNotes")} />
          </div>
          <div>
            <label className="label" htmlFor="sub-note">Audit note for this change</label>
            <input id="sub-note" className="field" placeholder="e.g. Extended per support ticket #142" {...field("note")} />
          </div>
        </div>

        <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={submit}>
            {busy ? "Applying…" : "Apply changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
