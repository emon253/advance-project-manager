/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from "react";
import { ownerApi } from "../../../api/endpoints";
import { ErrorState } from "../../../components/common/ErrorState";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { Pager, fmtDateTime } from "./ownerUi";

const ACTION_TONES = {
  USER_SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  USER_ACTIVATED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  PLAN_DELETED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  SUBSCRIPTION_UPDATED: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
};

/** Platform-wide audit trail of System Owner actions. */
export function OwnerAudit() {
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    ownerApi.audit.list({ targetType, page, size: 20 })
      .then(setData)
      .catch(() => setError(true));
  }, [targetType, page]);
  useEffect(load, [load]);

  return (
    <div className="space-y-2.5 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Every owner action is recorded — who, what, and when.
        </p>
        <select
          className="field w-40"
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(0); }}
          aria-label="Filter by target type"
        >
          <option value="">All targets</option>
          <option value="USER">Users</option>
          <option value="PLAN">Plans</option>
          <option value="SUBSCRIPTION">Subscriptions</option>
        </select>
      </div>

      {error && <ErrorState onRetry={load} />}
      {!error && !data && <ListSkeleton rows={8} />}

      {!error && data && data.content.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No audit entries yet</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Owner actions will appear here as they happen.</p>
        </div>
      )}

      {!error && data && data.content.length > 0 && (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.content.map((e) => (
              <li key={e.id} className="px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${ACTION_TONES[e.action] || ""}`}>{e.action.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="badge">{e.targetType.toLowerCase()} #{e.targetId}</span>
                  <span className="text-[11px] text-zinc-400 font-medium ml-auto whitespace-nowrap">{fmtDateTime(e.createdAt)}</span>
                </div>
                {e.detail && (
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">{e.detail}</p>
                )}
                <p className="text-[11px] text-zinc-400 font-medium mt-1">by {e.actorName} ({e.actorEmail})</p>
              </li>
            ))}
          </ul>
          <div className="px-3 sm:px-4 pb-3 border-t border-zinc-100 dark:border-zinc-800">
            <Pager page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPage={setPage} noun="entries" />
          </div>
        </div>
      )}
    </div>
  );
}
