/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Crown, Link2, Check, Send, Trash2, MoreHorizontal } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";
import { UpgradeModal } from "../../../components/common/UpgradeModal";
import { getPlanLimits } from "../../Billing/util/billingUtils";

const ROLES = ["Admin", "Manager", "Member", "Viewer"];

/** Members & invites — the only place anyone gets invited to the workspace. */
export function MembersSection() {
  const {
    activeWorkspace, currentUser, can, invites, ensureInvites, createInvite, revokeInvite, resendInvite,
    changeMemberRole, removeMember, transferOwnership, canAddMember, activePlanId,
  } = useAppState();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [menuFor, setMenuFor] = useState(null);
  const [transferFor, setTransferFor] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  React.useEffect(() => { ensureInvites(); }, [ensureInvites]);

  const ws = activeWorkspace || {};
  const members = ws.members || [];
  const pending = invites.filter((i) => i.workspaceId === ws.id && i.status === "pending");
  const manage = can("manageMembers");

  const invite = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || busy) return;
    if (!canAddMember()) { setShowUpgrade(true); return; }
    setBusy(true);
    const res = await createInvite(ws.id, { email: email.trim().toLowerCase(), role });
    setBusy(false);
    if (!res?.success) { setError(res?.error || "Could not send the invitation."); return; }
    setSent(res.invite.email); setTimeout(() => setSent(""), 3000);
    setEmail(""); setRole("Member");
  };

  const copyLink = async (inv) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`); setCopied(inv.id); setTimeout(() => setCopied(null), 1500); } catch { /* no clipboard */ }
  };

  return (
    <>
      <div className="card">
        <div className="flex items-start gap-3 px-3 pt-3 pb-2">
          <div>
            <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white">Members <span className="text-zinc-400 font-semibold font-tnum">{members.length}</span></h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Everyone with access to this workspace.</p>
          </div>
        </div>
        {manage && (
          <form onSubmit={invite} className="flex flex-wrap items-center gap-1.5 px-3 pb-3">
            <label className="sr-only" htmlFor="invite-email">Email to invite</label>
            <input id="invite-email" type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="field flex-1 min-w-[200px]" />
            <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} className="field w-auto">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit" disabled={busy} className="btn btn-primary"><Send className="w-3.5 h-3.5" /> {busy ? "Sending…" : "Send invite"}</button>
            {error && <p className="w-full text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>}
            {sent && <p className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Invitation sent to {sent}</p>}
          </form>
        )}
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          {members.map((m) => {
            const me = m.id === currentUser?.id;
            const isOwnerRow = m.role === "Owner";
            return (
              <div key={m.id} className="relative flex items-center gap-2.5 h-11 px-3 border-t border-zinc-100 dark:border-zinc-800/80 first:border-t-0">
                <UserAvatar user={m} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold truncate">{m.name}{me && <span className="ml-1.5 text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">You</span>}</span>
                  <span className="block text-[11px] text-zinc-400 truncate">{m.email}</span>
                </span>
                {manage && !isOwnerRow ? (
                  <select aria-label={`Role for ${m.name}`} value={m.role || "Member"} onChange={(e) => changeMemberRole(ws.id, m.id, e.target.value)} className="field w-auto h-7 text-xs">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-zinc-500 px-2">{m.role || "Member"}</span>
                )}
                {manage && !isOwnerRow && (
                  <>
                    <button type="button" onClick={() => setMenuFor(menuFor === m.id ? null : m.id)} className="btn-icon h-7 w-7" aria-label={`Actions for ${m.name}`} aria-haspopup="menu"><MoreHorizontal className="w-4 h-4" /></button>
                    {menuFor === m.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} aria-hidden="true" />
                        <div role="menu" className="menu-panel absolute right-3 top-10 z-40 w-48 p-1">
                          {can("transferOwnership") && m.role !== "Viewer" && (
                            <button type="button" role="menuitem" onClick={() => { setMenuFor(null); setTransferFor(m.id); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><Crown className="w-4 h-4" /> Make owner</button>
                          )}
                          <button type="button" role="menuitem" onClick={() => { setMenuFor(null); removeMember(ws.id, m.id); }} className="w-full flex items-center gap-2 h-8 px-2 rounded-md text-[13px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"><Trash2 className="w-4 h-4" /> Remove</button>
                        </div>
                      </>
                    )}
                  </>
                )}
                {transferFor === m.id && (
                  <div className="absolute inset-x-3 top-full z-20 mt-0.5 flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-500/10 text-xs">
                    <span className="flex-1 font-semibold text-amber-800 dark:text-amber-300">Transfer ownership to {m.name}? You'll become an Admin.</span>
                    <button type="button" onClick={() => setTransferFor(null)} className="btn btn-sm btn-secondary">Cancel</button>
                    <button type="button" onClick={() => { transferOwnership(ws.id, m.id); setTransferFor(null); }} className="btn btn-sm btn-primary">Transfer</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {manage && (
        <div className="card p-3">
          <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white">Pending invites <span className="text-zinc-400 font-semibold font-tnum">{pending.length}</span></h2>
          {pending.length === 0 ? <p className="text-xs text-zinc-400 mt-1">No pending invitations.</p> : pending.map((inv) => (
            <div key={inv.id} className="flex items-center gap-2.5 h-10 mt-1 border-t border-zinc-100 dark:border-zinc-800 first:border-t-0">
              <span className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-bold shrink-0">?</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold truncate">{inv.email}</span>
                <span className="block text-[11px] text-zinc-400 truncate">{inv.role} · sent {new Date(inv.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}{inv.expiresAt ? ` · expires ${new Date(inv.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}</span>
              </span>
              <button type="button" onClick={() => copyLink(inv)} className="btn btn-sm btn-secondary" title="Copy invite link">{copied === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}</button>
              <button type="button" onClick={() => resendInvite(inv.id)} className="btn btn-sm btn-secondary">Resend</button>
              <button type="button" onClick={() => revokeInvite(inv.id)} className="btn btn-sm btn-secondary text-rose-600">Revoke</button>
            </div>
          ))}
        </div>
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} title="Member limit reached" limitText={`The current plan includes up to ${getPlanLimits(activePlanId).members} members per workspace.`} />
    </>
  );
}
