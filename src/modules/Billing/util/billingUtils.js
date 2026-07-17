/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plan catalog. The subscription is attached to a WORKSPACE (like Trello/Slack):
 * every workspace has a plan, billed per seat, monthly or yearly.
 * Personal workspaces are single-seat; company workspaces pay per member.
 */
export const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "For individuals and small teams getting started.",
    monthly: 0,
    yearly: 0,
    highlight: false,
    features: [
      "Up to 3 projects per workspace",
      "Up to 5 members",
      "Tasks, checklists & comments",
      "Basic notifications",
    ],
    limits: {
      projects: 3,
      members: 5,
      ai: false,
      customStatuses: false,
      automation: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing teams that need power and automation.",
    monthly: 8,
    yearly: 80, // per seat per year (2 months free)
    highlight: true,
    features: [
      "Unlimited projects",
      "Up to 25 members",
      "AI task planner & refiner",
      "Custom task statuses",
      "Automation rules",
      "File attachments",
    ],
    limits: {
      projects: Infinity,
      members: 25,
      ai: true,
      customStatuses: true,
      automation: true,
    },
  },
  {
    id: "business",
    name: "Business",
    tagline: "For companies that need control and security.",
    monthly: 16,
    yearly: 160,
    highlight: false,
    features: [
      "Everything in Pro",
      "Unlimited members",
      "SSO & advanced security",
      "Audit log & telemetry",
      "Priority support",
    ],
    limits: {
      projects: Infinity,
      members: Infinity,
      ai: true,
      customStatuses: true,
      automation: true,
    },
  },
];

export const TRIAL_DAYS = 14;

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

export function getPlanLimits(planId) {
  return getPlan(planId).limits;
}

/** Price of a plan for a seat count and interval ("monthly" | "yearly"). */
export function calcPrice(planId, interval, seats = 1) {
  const plan = getPlan(planId);
  const perSeat = interval === "yearly" ? plan.yearly : plan.monthly;
  return perSeat * Math.max(1, seats);
}

export function formatPrice(amount) {
  return amount === 0 ? "$0" : `$${amount.toLocaleString()}`;
}

/** Days left on a trial; 0 if expired or absent. */
export function trialDaysLeft(subscription) {
  if (!subscription?.trialEndsAt) return 0;
  const ms = new Date(subscription.trialEndsAt) - new Date();
  return ms > 0 ? Math.ceil(ms / 86400000) : 0;
}

export function isTrialActive(subscription) {
  return subscription?.status === "trialing" && trialDaysLeft(subscription) > 0;
}

/** Effective plan id, treating an active trial as its trial plan. */
export function effectivePlanId(subscription) {
  if (!subscription) return "free";
  if (subscription.status === "trialing") {
    return trialDaysLeft(subscription) > 0 ? subscription.plan : "free";
  }
  return subscription.status === "active" ? subscription.plan : "free";
}

export function formatRenewalDate(subscription) {
  if (!subscription?.renewsAt) return null;
  return new Date(subscription.renewsAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
