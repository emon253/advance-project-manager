/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { useAppState } from "../../../app/providers";
import { UserAvatar } from "../../../components/common/UserAvatar";

/** Name, phone, picture. */
export function ProfileSection() {
  const { currentUser, updateProfile, uploadAvatar, removeAvatar, pushNotification, currentRole } = useAppState();
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  const save = async (e) => {
    e.preventDefault();
    const res = await updateProfile({ name: name.trim(), phone: phone.trim() || null });
    setMsg(res.success ? { ok: true, text: "Profile saved" } : { ok: false, text: res.error || "Could not save." });
    setTimeout(() => setMsg(null), 3000);
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { pushNotification("Pictures can be at most 5MB.", "update", null, null, "Image too large"); return; }
    setBusy(true); await uploadAvatar(file); setBusy(false);
  };

  return (
    <form onSubmit={save} className="card p-3">
      <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-3">Profile</h2>
      <div className="flex items-center gap-3 mb-3">
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={pick} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="relative group rounded-full cursor-pointer" aria-label="Change picture">
          <UserAvatar user={currentUser} size="lg" />
          <span className="absolute inset-0 rounded-full bg-zinc-950/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {busy ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
          </span>
        </button>
        <div>
          <p className="text-[13px] font-bold text-zinc-900 dark:text-white">{currentUser?.name}</p>
          <p className="text-[11px] text-zinc-500">{currentUser?.email} · {currentRole || "Member"}</p>
          <div className="flex gap-2.5 mt-1 text-[11px] font-semibold">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-primary hover:underline cursor-pointer">{currentUser?.avatarUrl ? "Change picture" : "Add picture"}</button>
            {currentUser?.avatarUrl && <button type="button" onClick={removeAvatar} className="text-zinc-400 hover:text-rose-600 cursor-pointer">Remove</button>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label htmlFor="pr-name" className="label">Full name</label><input id="pr-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="field" /></div>
        <div><label htmlFor="pr-email" className="label">Email</label><input id="pr-email" type="email" disabled value={currentUser?.email || ""} className="field opacity-60" /></div>
        <div><label htmlFor="pr-phone" className="label">Phone</label><input id="pr-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="field" /></div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        {msg && <span className={`text-xs font-semibold inline-flex items-center gap-1 ${msg.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{msg.ok && <Check className="w-3.5 h-3.5" />}{msg.text}</span>}
        <button type="submit" className="btn btn-primary">Save changes</button>
      </div>
    </form>
  );
}

/** Password change and account deletion. */
export function SecuritySection() {
  const { changePassword, deleteAccount } = useAppState();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!current || !next) { setMsg({ ok: false, text: "Fill in both fields." }); return; }
    if (next.length < 8) { setMsg({ ok: false, text: "New password must be at least 8 characters." }); return; }
    const res = await changePassword(current, next);
    setMsg(res.success ? { ok: true, text: "Password updated" } : { ok: false, text: res.error || "Could not change the password." });
    if (res.success) { setCurrent(""); setNext(""); }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <>
      <form onSubmit={submit} className="card p-3">
        <h2 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-3">Password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label htmlFor="pw-current" className="label">Current password</label><input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className="field" /></div>
          <div><label htmlFor="pw-new" className="label">New password</label><input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="field" /></div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {msg && <span className={`text-xs font-semibold ${msg.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{msg.text}</span>}
          <button type="submit" className="btn btn-secondary">Update password</button>
        </div>
      </form>

      <div className="card p-3 border-rose-200/70 dark:border-rose-900/50">
        <h2 className="text-[15px] font-bold text-rose-700 dark:text-rose-400 mb-1">Delete account</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">Permanently deletes your account and removes you from every workspace. This cannot be undone.</p>
        {showDelete ? (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md bg-rose-50 dark:bg-rose-500/10">
            <label htmlFor="del-confirm" className="text-xs font-semibold text-rose-800 dark:text-rose-300">Type DELETE to confirm</label>
            <input id="del-confirm" type="text" autoComplete="off" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="field w-32 h-7" />
            <button type="button" onClick={() => { setShowDelete(false); setConfirmText(""); }} className="btn btn-sm btn-secondary">Cancel</button>
            <button type="button" disabled={confirmText !== "DELETE"} onClick={deleteAccount} className="btn btn-sm btn-danger"><Trash2 className="w-3.5 h-3.5" /> Delete account</button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowDelete(true)} className="btn btn-danger-soft"><Trash2 className="w-4 h-4" /> Delete my account…</button>
        )}
      </div>
    </>
  );
}
