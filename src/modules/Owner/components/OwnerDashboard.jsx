/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ownerApi } from "../../../api/endpoints";
import { ErrorState } from "../../../components/common/ErrorState";
import { Skeleton } from "../../../components/common/Skeleton";
import { fmtDate } from "./ownerUi";
import { Users, UserX, UserPlus, Building2, BadgeCheck, Hourglass, Banknote, AlertTriangle } from "lucide-react";

function Stat({ icon: Icon, label, value, tone = "text-primary bg-primary/8 dark:bg-primary/15" }) {
  return (
    <div className="card p-3 sm:p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${tone}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        {label}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-1.5 font-tnum">{value}</p>
    </div>
  );
}

/** Platform metrics + subscription alerts. */
export function OwnerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    ownerApi.metrics().then(setMetrics).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState onRetry={load} />;
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const distributionMax = Math.max(1, ...metrics.planDistribution.map((p) => p.active + p.trialing));

  return (
    <div className="space-y-2.5 sm:space-y-5">
      {/* headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        <Stat icon={Users} label="Users" value={metrics.totalUsers.toLocaleString()} />
        <Stat icon={UserPlus} label="New · 30d" value={metrics.newUsers30d.toLocaleString()} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
        <Stat icon={UserX} label="Suspended" value={metrics.suspendedUsers.toLocaleString()} tone="text-rose-500 bg-rose-50 dark:bg-rose-500/10" />
        <Stat icon={Building2} label="Workspaces" value={metrics.totalWorkspaces.toLocaleString()} />
        <Stat icon={BadgeCheck} label="Active subs" value={metrics.activeSubscriptions.toLocaleString()} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
        <Stat icon={Hourglass} label="Trialing" value={metrics.trialingSubscriptions.toLocaleString()} tone="text-sky-600 bg-sky-50 dark:bg-sky-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
        {/* plan distribution */}
        <div className="card p-3 sm:p-5">
          <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white">Plan distribution</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 mb-4">Stored subscriptions per plan (active + trialing).</p>
          <div className="space-y-3">
            {metrics.planDistribution.map((p) => (
              <div key={p.plan}>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>{p.planName}</span>
                  <span className="font-tnum text-zinc-500 dark:text-zinc-400">
                    {p.active} active{p.trialing > 0 ? ` · ${p.trialing} trialing` : ""}{p.canceled > 0 ? ` · ${p.canceled} canceled` : ""}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
                  <div className="bg-primary h-full" style={{ width: `${((p.active) / distributionMax) * 100}%` }} />
                  <div className="bg-sky-400 h-full" style={{ width: `${((p.trialing) / distributionMax) * 100}%` }} />
                </div>
              </div>
            ))}
            {metrics.planDistribution.length === 0 && (
              <p className="text-xs text-zinc-400 font-medium">No subscriptions yet.</p>
            )}
          </div>
        </div>

        {/* revenue */}
        <div className="card p-3 sm:p-5">
          <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-primary" />
            Estimated MRR
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 mb-4">
            Active subscriptions normalized to monthly, per billing currency.
          </p>
          {metrics.estimatedMrr.length === 0 ? (
            <p className="text-xs text-zinc-400 font-medium">No paying subscriptions yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {metrics.estimatedMrr.map((r) => (
                <div key={r.currency} className="flex-1 min-w-36 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{r.currency} / month</span>
                  <p className="text-xl font-bold text-zinc-900 dark:text-white font-tnum mt-1">
                    {r.symbol}{r.monthly.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
        <AlertList
          title="Trials ending within 7 days"
          empty="No trials are ending soon."
          items={metrics.trialsEndingSoon}
          whenLabel="ends"
        />
        <AlertList
          title="Lapsed subscriptions"
          empty="No active subscriptions past their renewal date."
          items={metrics.lapsedSubscriptions}
          whenLabel="renewal was"
          danger
        />
      </div>
    </div>
  );
}

function AlertList({ title, empty, items, whenLabel, danger }) {
  return (
    <div className="card p-3 sm:p-5">
      <h3 className="font-display font-semibold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
        <AlertTriangle className={`w-4 h-4 ${danger ? "text-rose-500" : "text-amber-500"}`} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-400 font-medium mt-3">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((a) => (
            <li key={a.workspaceId} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{a.workspaceName}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium capitalize">
                  {a.plan} · {whenLabel} {fmtDate(a.when)}
                </span>
              </div>
              <Link to="/owner/subscriptions" className="btn btn-secondary btn-sm shrink-0">Manage</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
