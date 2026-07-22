/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { ownerApi } from "../../../api/endpoints";
import { ErrorState } from "../../../components/common/ErrorState";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { getIconComponent } from "../../../components/common/IconHelper";
import { Pager, SubStatusBadge, PlanStatusBadge, fmtDate } from "./ownerUi";
import { ManageSubscriptionModal } from "./ManageSubscriptionModal";
import { Search, SlidersHorizontal } from "lucide-react";

/**
 * Workspace subscriptions: usage vs limits at a glance, plus the owner's
 * manual control — plan, status, dates, seats, override limits, notes.
 */
export function OwnerSubscriptions() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [manage, setManage] = useState(null);   // the workspace row being managed
  const debounce = useRef(null);

  const load = useCallback(() => {
    setError(false);
    ownerApi.subscriptions.list({ query, plan, status, page, size: 12 })
      .then(setData)
      .catch(() => setError(true));
  }, [query, plan, status, page]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(debounce.current);
  }, [load, query]);

  useEffect(() => {
    ownerApi.plans.list().then(setCatalog).catch(() => {});
  }, []);

  const openManage = (row) => setManage(row);

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            className="field pl-8"
            placeholder="Search workspace or owner…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            aria-label="Search workspaces"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <select className="field" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(0); }} aria-label="Filter by plan">
            <option value="">All plans</option>
            {catalog.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <select className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {error && <ErrorState onRetry={load} />}
      {!error && !data && <ListSkeleton rows={8} />}

      {!error && data && data.content.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No workspaces match</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Try a different search or clear the filters.</p>
        </div>
      )}

      {!error && data && data.content.length > 0 && (
        <div className="card overflow-hidden">
          <div className="hidden lg:grid grid-cols-[minmax(200px,2fr)_minmax(160px,1.4fr)_110px_100px_130px_120px_90px] gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <span>Workspace</span><span>Owner</span><span>Plan</span><span>Status</span><span>Usage</span><span>Renews / trial</span><span></span>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.content.map((row) => (
              <li key={row.workspaceId} className="px-3 sm:px-4 py-2.5 sm:py-3 lg:grid lg:grid-cols-[minmax(200px,2fr)_minmax(160px,1.4fr)_110px_100px_130px_120px_90px] lg:gap-3 lg:items-center">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary">
                    {getIconComponent(row.logoKey, "w-4 h-4")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-white truncate">{row.name}</span>
                    <span className="block text-[11px] text-zinc-400 font-medium capitalize">{row.type}</span>
                  </span>
                </span>
                <span className="hidden lg:block min-w-0">
                  <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{row.ownerName}</span>
                  <span className="block text-[11px] text-zinc-400 font-medium truncate">{row.ownerEmail}</span>
                </span>
                <span className="hidden lg:flex items-center gap-1.5">
                  <span className="badge capitalize">{row.subscription.planName}</span>
                </span>
                <span className="hidden lg:block"><SubStatusBadge status={row.subscription.status} /></span>
                <span className="hidden lg:block text-xs font-medium text-zinc-600 dark:text-zinc-300 font-tnum">
                  {row.projects} proj · {row.members}/{row.subscription.overrideMemberLimit ?? "plan"} seats{row.subscription.overrideMemberLimit != null && "*"}
                </span>
                <span className="hidden lg:block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {row.subscription.status === "trialing"
                    ? `trial → ${fmtDate(row.subscription.trialEndsAt)}`
                    : row.subscription.renewsAt ? fmtDate(row.subscription.renewsAt) : "—"}
                </span>
                <span className="flex lg:justify-end items-center gap-2 mt-2 lg:mt-0">
                  {/* mobile summary */}
                  <span className="lg:hidden flex items-center gap-1.5 mr-auto">
                    <span className="badge capitalize">{row.subscription.planName}</span>
                    <SubStatusBadge status={row.subscription.status} />
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openManage(row)}>
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Manage
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="px-3 sm:px-4 pb-3 border-t border-zinc-100 dark:border-zinc-800">
            <Pager page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPage={setPage} noun="workspaces" />
          </div>
        </div>
      )}

      {/* -------- manage sheet (shared with the Users tab) -------- */}
      {manage && (
        <ManageSubscriptionModal
          workspaceId={manage.workspaceId}
          subscription={manage.subscription}
          title={manage.name}
          meta={`${manage.ownerEmail} · ${manage.members} members, ${manage.projects} projects`}
          catalog={catalog}
          onClose={() => setManage(null)}
          onUpdated={(updated) => setData((d) => ({ ...d, content: d.content.map((r) => (r.workspaceId === updated.workspaceId ? updated : r)) }))}
        />
      )}
    </div>
  );
}
