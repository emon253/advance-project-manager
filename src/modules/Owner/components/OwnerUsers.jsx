/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { ownerApi } from "../../../api/endpoints";
import { useAppState } from "../../../app/providers";
import { ErrorState } from "../../../components/common/ErrorState";
import { ListSkeleton } from "../../../components/common/Skeleton";
import { getIconComponent } from "../../../components/common/IconHelper";
import { Pager, ConfirmDialog, AccountStatusBadge, SubStatusBadge, fmtDate, timeAgo, fmtDateTime } from "./ownerUi";
import { Search, ArrowUpDown, X, MailCheck, MailWarning, ShieldCheck } from "lucide-react";

const SORTS = [
  { id: "-createdAt", label: "Newest first" },
  { id: "createdAt", label: "Oldest first" },
  { id: "name", label: "Name A→Z" },
  { id: "-lastLoginAt", label: "Recently active" },
];

/** Registered Users: search, filter, sort, paginate; drill-down + suspension. */
export function OwnerUsers() {
  const { plans, currentUser } = useAppState();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState(null);      // AdminUserDetail
  const [confirm, setConfirm] = useState(null);    // {user, enable}
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const debounce = useRef(null);

  const load = useCallback(() => {
    setError(false);
    ownerApi.users.list({ query, status, plan, sort, page, size: 12 })
      .then(setData)
      .catch(() => setError(true));
  }, [query, status, plan, sort, page]);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(debounce.current);
  }, [load, query]);

  const openDetail = async (id) => {
    try { setDetail(await ownerApi.users.get(id)); } catch { /* row remains */ }
  };

  const applyStatus = async () => {
    setBusy(true);
    try {
      const updated = await ownerApi.users.setStatus(confirm.user.id, confirm.enable, reason);
      setData((d) => ({ ...d, content: d.content.map((u) => (u.id === updated.id ? updated : u)) }));
      if (detail?.user?.id === updated.id) openDetail(updated.id);
      setConfirm(null);
      setReason("");
    } catch (err) {
      setActionError(err.message || "Could not update the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-4">
      {/* filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            className="field pl-8"
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            aria-label="Search users"
          />
        </div>
        <div className="grid grid-cols-3 sm:flex gap-2">
          <select className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select className="field" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(0); }} aria-label="Filter by owned plan">
            <option value="">All plans</option>
            {plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <select className="field" value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }} aria-label="Sort users">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorState onRetry={load} />}
      {!error && !data && <ListSkeleton rows={8} />}

      {!error && data && data.content.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No users match</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Try a different search or clear the filters.</p>
        </div>
      )}

      {!error && data && data.content.length > 0 && (
        <div className="card overflow-hidden">
          {/* desktop header */}
          <div className="hidden lg:grid grid-cols-[minmax(220px,2fr)_120px_140px_110px_120px_120px] gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <span>User</span><span>Status</span><span>Owned plans</span><span>Workspaces</span><span>Joined</span><span>Last active</span>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.content.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => openDetail(u.id)}
                  className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors lg:grid lg:grid-cols-[minmax(220px,2fr)_120px_140px_110px_120px_120px] lg:gap-3 lg:items-center cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${u.color || "bg-primary text-white"}`}>
                        {u.initials}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white truncate">
                        {u.name}
                        {u.systemRole === "SYSTEM_OWNER" && <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" title="System Owner" />}
                        {u.emailVerified
                          ? <MailCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Email verified" />
                          : <MailWarning className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Email not verified" />}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">{u.email}</span>
                    </span>
                  </span>
                  <span className="hidden lg:block"><AccountStatusBadge enabled={u.enabled} /></span>
                  <span className="hidden lg:flex flex-wrap gap-1">
                    {u.ownedPlans.length === 0
                      ? <span className="text-xs text-zinc-400">—</span>
                      : u.ownedPlans.map((p) => <span key={p} className="badge capitalize">{p}</span>)}
                  </span>
                  <span className="hidden lg:block text-xs font-medium text-zinc-600 dark:text-zinc-300 font-tnum">
                    {u.ownedWorkspaces} owned · {u.memberWorkspaces} total
                  </span>
                  <span className="hidden lg:block text-xs font-medium text-zinc-500 dark:text-zinc-400">{fmtDate(u.createdAt)}</span>
                  <span className="hidden lg:block text-xs font-medium text-zinc-500 dark:text-zinc-400">{timeAgo(u.lastLoginAt)}</span>
                  {/* mobile status line */}
                  <span className="flex lg:hidden items-center gap-2 mt-1.5">
                    <AccountStatusBadge enabled={u.enabled} />
                    <span className="text-[11px] text-zinc-400 font-medium">joined {fmtDate(u.createdAt)} · active {timeAgo(u.lastLoginAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 sm:px-4 pb-3 border-t border-zinc-100 dark:border-zinc-800">
            <Pager page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPage={setPage} noun="users" />
          </div>
        </div>
      )}

      {/* -------- user detail sheet -------- */}
      {detail && (
        <div className="modal-overlay">
          <div className="absolute inset-0" onClick={() => setDetail(null)} aria-hidden="true" />
          <div className="modal-panel sm:max-w-xl" role="dialog" aria-modal="true" aria-label={`User ${detail.user.name}`}>
            <div className="sheet-grabber" />
            <div className="flex items-start justify-between gap-3 px-5 pt-4">
              <div className="flex items-center gap-3 min-w-0">
                {detail.user.avatarUrl ? (
                  <img src={detail.user.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${detail.user.color || "bg-primary text-white"}`}>
                    {detail.user.initials}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white truncate">{detail.user.name}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">{detail.user.email}</p>
                </div>
              </div>
              <button type="button" className="btn-icon -mr-1.5" onClick={() => setDetail(null)} aria-label="Close">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <AccountStatusBadge enabled={detail.user.enabled} />
                {detail.user.systemRole === "SYSTEM_OWNER" && <span className="badge bg-primary/8 text-primary border-primary/20 dark:bg-primary/15">System Owner</span>}
                <span className="badge">{detail.user.emailVerified ? "Email verified" : "Email unverified"}</span>
                <span className="text-[11px] text-zinc-400 font-medium">joined {fmtDate(detail.user.createdAt)} · last active {timeAgo(detail.user.lastLoginAt)}</span>
              </div>

              <div>
                <h3 className="label mb-1.5">Workspaces & subscriptions</h3>
                <ul className="space-y-2">
                  {detail.workspaces.map((w) => (
                    <li key={w.workspaceId} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary">
                            {getIconComponent(w.logoKey, "w-3.5 h-3.5")}
                          </span>
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{w.name}</span>
                          <span className="badge">{w.role}</span>
                        </span>
                        <SubStatusBadge status={w.subscription.status} />
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1.5">
                        <span className="capitalize">{w.subscription.planName}</span> · {w.members} members · {w.projects} projects
                        {w.subscription.renewsAt && <> · renews {fmtDate(w.subscription.renewsAt)}</>}
                        {w.subscription.trialEndsAt && <> · trial ends {fmtDate(w.subscription.trialEndsAt)}</>}
                      </p>
                    </li>
                  ))}
                  {detail.workspaces.length === 0 && <p className="text-xs text-zinc-400 font-medium">No workspaces.</p>}
                </ul>
              </div>

              {detail.recentAudit.length > 0 && (
                <div>
                  <h3 className="label mb-1.5">Recent owner actions on this account</h3>
                  <ul className="space-y-1.5">
                    {detail.recentAudit.map((e) => (
                      <li key={e.id} className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        <span className="badge mr-1.5">{e.action.replaceAll("_", " ").toLowerCase()}</span>
                        {e.detail} · <span className="text-zinc-400">{fmtDateTime(e.createdAt)} by {e.actorName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setDetail(null)}>Close</button>
              {detail.user.id !== currentUser?.id && detail.user.systemRole !== "SYSTEM_OWNER" && (
                detail.user.enabled ? (
                  <button type="button" className="btn btn-danger-soft flex-1" onClick={() => setConfirm({ user: detail.user, enable: false })}>
                    Suspend account
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary flex-1" onClick={() => setConfirm({ user: detail.user, enable: true })}>
                    Reactivate account
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------- suspend / activate confirm -------- */}
      <ConfirmDialog
        open={!!confirm}
        danger={confirm && !confirm.enable}
        title={confirm?.enable ? "Reactivate this account?" : "Suspend this account?"}
        body={confirm?.enable
          ? `${confirm?.user.name} will be able to sign in again immediately.`
          : `${confirm?.user.name} will be signed out everywhere and blocked from signing in. Their data stays intact.`}
        confirmLabel={confirm?.enable ? "Reactivate" : "Suspend"}
        busy={busy}
        onCancel={() => { setConfirm(null); setReason(""); setActionError(""); }}
        onConfirm={applyStatus}
      >
        {actionError && (
          <p className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-semibold" role="alert">
            {actionError}
          </p>
        )}
        {confirm && !confirm.enable && (
          <div className="mt-3">
            <label className="label" htmlFor="suspend-reason">Reason (kept in the audit log)</label>
            <input id="suspend-reason" className="field" placeholder="e.g. Terms of service violation" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
