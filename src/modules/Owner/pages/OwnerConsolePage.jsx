/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../../app/providers";
import { PageHeader } from "../../../components/common/PageHeader";
import { ShieldCheck, ShieldAlert, LayoutDashboard, Users, Layers, Building2, ScrollText } from "lucide-react";
import { OwnerDashboard } from "../components/OwnerDashboard";
import { OwnerUsers } from "../components/OwnerUsers";
import { OwnerPlans } from "../components/OwnerPlans";
import { OwnerSubscriptions } from "../components/OwnerSubscriptions";
import { OwnerAudit } from "../components/OwnerAudit";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/owner" },
  { id: "users", label: "Users", icon: Users, path: "/owner/users" },
  { id: "plans", label: "Plans", icon: Layers, path: "/owner/plans" },
  { id: "subscriptions", label: "Subscriptions", icon: Building2, path: "/owner/subscriptions" },
  { id: "audit", label: "Audit log", icon: ScrollText, path: "/owner/audit" },
];

/**
 * System Owner console (/owner/*): platform metrics, registered users, the
 * plan catalog, manual subscription control, and the audit trail. The server
 * enforces the SYSTEM_OWNER role on every call; this shell mirrors that with
 * a friendly access-denied state for everyone else.
 */
export function OwnerConsolePage({ tab = "dashboard" }) {
  const { isSystemOwner, bootLoading } = useAppState();
  const location = useLocation();

  if (!bootLoading && !isSystemOwner) {
    return (
      <div className="max-w-md mx-auto text-center py-16 sm:py-24" id="owner-access-denied">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
          <ShieldAlert className="w-6 h-6" />
        </span>
        <h1 className="font-display font-bold text-lg text-zinc-900 dark:text-white">This area is for the platform owner</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-2 leading-relaxed">
          The Owner Console manages plans, users, and subscriptions across the whole platform.
          Your account doesn't have System Owner access.
        </p>
        <Link to="/dashboard" className="btn btn-primary mt-6">Back to your workspace</Link>
      </div>
    );
  }

  return (
    <div className="text-left" id="owner-console-root">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary">
              <ShieldCheck className="w-4.5 h-4.5" />
            </span>
            Owner Console
          </span>
        }
        description="Platform-wide administration: plans, registered users, subscriptions, and the audit trail."
      />

      {/* Tab navigation — scrollable on mobile */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 -mx-3 px-3 sm:mx-0 sm:px-0 mb-3 sm:mb-5 overflow-x-auto">
        <nav className="flex gap-1 min-w-max" aria-label="Owner console sections">
          {TABS.map(({ id, label, icon: Icon, path }) => {
            const active = tab === id || location.pathname === path;
            return (
              <Link
                key={id}
                to={path}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {tab === "dashboard" && <OwnerDashboard />}
      {tab === "users" && <OwnerUsers />}
      {tab === "plans" && <OwnerPlans />}
      {tab === "subscriptions" && <OwnerSubscriptions />}
      {tab === "audit" && <OwnerAudit />}
    </div>
  );
}
