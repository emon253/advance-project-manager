/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Minus, Plus, Lock, CheckCircle2 } from "lucide-react";
import { getPlan, calcPrice, formatPrice } from "../util/billingUtils";

/**
 * Mock checkout: plan summary, seat stepper (company workspaces), fake card
 * form, confirmation. Calls onConfirm(planId, interval, seats) on success.
 */
export function CheckoutSheet({ isOpen, onClose, planId, interval, workspace, initialSeats, maxSeats, onConfirm }) {
  const [seats, setSeats] = useState(initialSeats || 1);
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const plan = getPlan(planId);
  const isPersonal = workspace?.type === "personal";
  const effectiveSeats = isPersonal ? 1 : seats;
  const total = calcPrice(planId, interval, effectiveSeats);
  const perSeat = interval === "yearly" ? plan.yearly : plan.monthly;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(planId, interval, effectiveSeats);
    setDone(true);
  };

  const handleClose = () => {
    setDone(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />

      <div className="modal-panel sm:max-w-md" role="dialog" aria-modal="true" aria-label="Checkout">
        <div className="sheet-grabber" />

        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h2 className="font-display font-semibold text-zinc-900 dark:text-white text-base">
            {done ? "You're all set" : `Upgrade to ${plan.name}`}
          </h2>
          <button type="button" onClick={handleClose} className="btn-icon -mr-1.5" aria-label="Close">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {workspace?.name} is now on {plan.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                {formatPrice(total, plan.currency)} billed {interval}. A receipt was added to your invoices.
              </p>
            </div>
            <button onClick={handleClose} className="btn btn-primary mt-2 w-full sm:w-auto sm:px-8">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
              {/* Order summary */}
              <div className="card p-3 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-900 dark:text-white">{plan.name} plan</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    {formatPrice(perSeat, plan.currency)}/seat/{interval === "yearly" ? "yr" : "mo"}
                  </span>
                </div>

                {!isPersonal && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Seats</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSeats(Math.max(1, seats - 1))}
                        className="btn-icon h-8 w-8"
                        aria-label="Remove a seat"
                        disabled={seats <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold font-tnum text-zinc-900 dark:text-white">{seats}</span>
                      <button
                        type="button"
                        onClick={() => setSeats(Math.min(maxSeats || 99, seats + 1))}
                        className="btn-icon h-8 w-8"
                        aria-label="Add a seat"
                        disabled={seats >= (maxSeats || 99)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">Total</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white font-tnum">
                    {formatPrice(total, plan.currency)}<span className="text-xs font-medium text-zinc-500">/{interval === "yearly" ? "year" : "month"}</span>
                  </span>
                </div>
              </div>

              {/* Mock payment form */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="co-card" className="label">Card number</label>
                  <input id="co-card" type="text" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="field font-tnum" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="co-exp" className="label">Expiry</label>
                    <input id="co-exp" type="text" autoComplete="cc-exp" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="field font-tnum" required />
                  </div>
                  <div>
                    <label htmlFor="co-cvc" className="label">CVC</label>
                    <input id="co-cvc" type="text" inputMode="numeric" autoComplete="cc-csc" value={cvc} onChange={(e) => setCvc(e.target.value)} className="field font-tnum" required />
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  <Lock className="w-3 h-3 shrink-0" />
                  Demo checkout — no real payment is processed.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 px-4 sm:px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={handleClose} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Pay {formatPrice(total, plan.currency)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
