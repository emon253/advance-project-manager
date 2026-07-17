/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { getIconComponent } from "../../../components/common/IconHelper";
import { CheckoutSheet } from "../components/CheckoutSheet";
import {
  PLANS,
  getPlan,
  formatPrice,
  effectivePlanId,
  isTrialActive,
  trialDaysLeft,
  formatRenewalDate,
} from "../util/billingUtils";
import { Check, CreditCard, Receipt, Sparkle, Clock, ShieldCheck } from "lucide-react";

const PLAN_RANK = { free: 0, pro: 1, business: 2 };

export function BillingPage() {
  const {
    activeWorkspace,
    activeWorkspaceProjects,
    activeSubscription,
    changePlan,
    cancelSubscription,
    startTrial,
  } = useAppState();

  const [interval, setInterval] = useState(activeSubscription?.interval === "yearly" ? "yearly" : "monthly");
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const wsId = activeWorkspace?.id;
  const sub = activeSubscription;
  const currentPlanId = effectivePlanId(sub);
  const currentPlan = getPlan(currentPlanId);
  const trialing = isTrialActive(sub);
  const memberCount = activeWorkspace?.members?.length || 1;
  const isPersonal = activeWorkspace?.type === "personal";
  const renewalDate = formatRenewalDate(sub);

  const handleSelectPlan = (planId) => {
    if (planId === currentPlanId && !trialing) return;
    if (planId === "free") {
      setConfirmCancel(true);
      return;
    }
    setCheckoutPlan(planId);
  };

  const usage = [
    { label: "Projects", used: activeWorkspaceProjects.length, limit: currentPlan.limits.projects },
    { label: "Members", used: memberCount, limit: currentPlan.limits.members },
  ];

  return (
    <div className="space-y-3 sm:space-y-5 text-left" id="billing-page-root">
      <PageHeader
        title="Plans & Billing"
        description="Manage the subscription, seats, and invoices for this workspace."
      />

      {/* Workspace context + current plan */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary shrink-0">
            {getIconComponent(activeWorkspace?.logo, "w-4.5 h-4.5")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                {activeWorkspace?.name}
              </h2>
              <span className="badge bg-primary/8 text-primary border-primary/20 dark:bg-primary/15 shrink-0">
                {currentPlan.name}{trialing ? " trial" : ""}
              </span>
              {sub?.status === "canceled" && (
                <span className="badge bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 shrink-0">
                  Canceled
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {isPersonal ? "Personal workspace" : "Company workspace"}
              {currentPlanId !== "free" && !trialing && renewalDate && ` · Renews ${renewalDate}`}
              {currentPlanId !== "free" && !trialing && ` · ${sub.seats} seat${sub.seats > 1 ? "s" : ""}`}
            </p>
          </div>

          {currentPlanId !== "free" && !trialing && sub?.status === "active" && (
            <button onClick={() => setConfirmCancel(true)} className="btn btn-sm btn-danger-soft shrink-0 hidden sm:inline-flex">
              Cancel subscription
            </button>
          )}
        </div>

        {/* Mobile cancel action */}
        {currentPlanId !== "free" && !trialing && sub?.status === "active" && (
          <button onClick={() => setConfirmCancel(true)} className="sm:hidden mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer">
            Cancel subscription
          </button>
        )}

        {/* Trial banner */}
        {trialing && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/15 flex flex-wrap items-center gap-2.5">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex-1 min-w-0">
              <span className="font-semibold text-primary">{trialDaysLeft(sub)} days left</span> in your {getPlan(sub.plan).name} trial.
              Add a payment method to keep these features.
            </p>
            <button onClick={() => setCheckoutPlan(sub.plan)} className="btn btn-sm btn-primary shrink-0">
              Subscribe now
            </button>
          </div>
        )}

        {/* Usage against limits */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 sm:max-w-sm">
          {usage.map(({ label, used, limit }) => (
            <div key={label} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white font-tnum mt-0.5">
                {used}<span className="text-zinc-400 font-medium"> / {limit === Infinity ? "Unlimited" : limit}</span>
              </p>
              {limit !== Infinity && (
                <div className="mt-1.5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${used >= limit ? "bg-rose-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="card p-3 sm:p-4 border-rose-200/70 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            Move {activeWorkspace?.name} to the Free plan?
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            You'll keep all your data. Projects and members beyond Free limits become read-only until you upgrade again.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setConfirmCancel(false)} className="btn btn-sm btn-secondary">
              Keep current plan
            </button>
            <button
              onClick={() => { cancelSubscription(wsId); setConfirmCancel(false); }}
              className="btn btn-sm btn-danger"
            >
              Confirm downgrade
            </button>
          </div>
        </div>
      )}

      {/* Interval toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Plans</h2>
        <div className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5" role="radiogroup" aria-label="Billing interval">
          {["monthly", "yearly"].map((iv) => (
            <button
              key={iv}
              role="radio"
              aria-checked={interval === iv}
              onClick={() => setInterval(iv)}
              className={`h-8 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                interval === iv
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-soft"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {iv === "monthly" ? "Monthly" : "Yearly"}
              {iv === "yearly" && <span className="ml-1 text-emerald-600 dark:text-emerald-400">−17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId && !trialing;
          const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentPlanId];
          const price = interval === "yearly" ? plan.yearly : plan.monthly;

          return (
            <div
              key={plan.id}
              className={`card p-4 flex flex-col ${plan.highlight ? "border-primary/40 dark:border-primary/40 relative" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-4 badge bg-primary text-white border-primary">
                  <Sparkle className="w-3 h-3" /> Popular
                </span>
              )}

              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white">{plan.name}</h3>
                {isCurrent && (
                  <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    Current
                  </span>
                )}
              </div>

              <p className="mt-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white font-tnum">{formatPrice(price)}</span>
                {price > 0 && (
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400"> /seat/{interval === "yearly" ? "yr" : "mo"}</span>
                )}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">{plan.tagline}</p>

              <ul className="mt-3 space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-px" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1.5">
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent}
                  className={`btn w-full ${isCurrent ? "btn-secondary" : plan.highlight ? "btn-primary" : "btn-secondary"}`}
                >
                  {isCurrent ? "Current plan" : isDowngrade ? `Downgrade to ${plan.name}` : trialing && plan.id === sub.plan ? "Subscribe now" : `Upgrade to ${plan.name}`}
                </button>
                {plan.id === "pro" && currentPlanId === "free" && !trialing && sub?.status !== "canceled" && (
                  <button onClick={() => startTrial(wsId, "pro")} className="btn btn-ghost w-full text-primary hover:bg-primary/8">
                    Start 14-day free trial
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment method + invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            Payment method
          </h3>
          {sub?.paymentMethod ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-9 w-12 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                {sub.paymentMethod.brand}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 font-tnum">•••• {sub.paymentMethod.last4}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Default for this workspace</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              No payment method on file. You'll add one when upgrading.
            </p>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Payments are handled securely. This demo never charges a card.
          </p>
        </div>

        <div className="card p-3 sm:p-4 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
            <Receipt className="w-4 h-4 text-zinc-400" />
            Invoices
          </h3>
          {(sub?.invoices?.length || 0) === 0 ? (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              No invoices yet — they'll appear here after your first payment.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
              {sub.invoices.map((inv) => (
                <li key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{inv.description}</p>
                    <p className="text-[11px] text-zinc-400 font-medium font-tnum">
                      {new Date(inv.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white font-tnum">{formatPrice(inv.amount)}</span>
                    <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                      {inv.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Checkout */}
      <CheckoutSheet
        isOpen={!!checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        planId={checkoutPlan || "pro"}
        interval={interval}
        workspace={activeWorkspace}
        initialSeats={Math.max(memberCount, sub?.seats || 1)}
        maxSeats={checkoutPlan ? (getPlan(checkoutPlan).limits.members === Infinity ? 99 : getPlan(checkoutPlan).limits.members) : 99}
        onConfirm={(planId, iv, seats) => changePlan(wsId, planId, iv, seats)}
      />
    </div>
  );
}
