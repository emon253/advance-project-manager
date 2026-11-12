/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, LogOut } from "lucide-react";
import { useAppState } from "../../app/providers";
import { hasFeature } from "../../app/permissions";
import { UserAvatar } from "./UserAvatar";
import { getIconComponent, ICON_OPTIONS } from "./IconHelper";

const itemClass =
  "w-full flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 cursor-pointer text-left";

/**
 * Account + workspace dropdown under the top-bar avatar. Owns workspace
 * switching and inline creation (moved out of the sidebar), plus Settings,
 * Team and sign-out. Theme lives in the top bar.
 */
export function AccountMenu({ onClose }) {
  const {
    currentUser, workspaces, activeWorkspaceId, setActiveWorkspaceId, addWorkspace,
    logout, isSystemOwner,
  } = useAppState();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("💼");

  const activeWorkspaces = workspaces.filter((w) => !w.isArchived);

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await addWorkspace(name.trim(), logo);
    if (created) onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        role="menu"
        aria-label="Account and workspace"
        className="menu-panel absolute right-0 top-10 z-50 w-64 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150 text-left"
      >
        <Link to="/settings/profile" role="menuitem" onClick={onClose} className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/60 group/me">
          <UserAvatar user={currentUser} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-zinc-900 dark:text-white truncate leading-tight">{currentUser?.name}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{currentUser?.email}</p>
          </div>
          <span className="text-[11px] font-semibold text-primary opacity-0 group-hover/me:opacity-100 shrink-0">Edit profile</span>
        </Link>

        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
        <p className="px-2 pt-1 pb-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workspace</p>
        <div className="max-h-48 overflow-y-auto no-scrollbar space-y-px">
          {activeWorkspaces.map((ws) => {
            const current = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                onClick={() => { setActiveWorkspaceId(ws.id); onClose(); }}
                className={`${itemClass} ${current ? "bg-primary/8 dark:bg-primary/15 text-zinc-900 dark:text-white font-bold" : ""}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${current ? "bg-primary/10 text-primary" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                  {getIconComponent(ws.logo, "w-3.5 h-3.5")}
                </span>
                <span className="truncate flex-1">{ws.name}</span>
                {current && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        {creating ? (
          <form onSubmit={submitCreate} className="mt-1 p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
            <input
              type="text"
              autoFocus
              required
              placeholder="Workspace name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
            />
            <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Workspace icon">
              {ICON_OPTIONS.slice(0, 8).map(({ key, Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={logo === key}
                  aria-label={label}
                  onClick={() => setLogo(key)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border cursor-pointer ${
                    logo === key
                      ? "bg-primary/8 border-primary/40 text-primary"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setCreating(false)} className="btn btn-sm btn-ghost flex-1">Cancel</button>
              <button type="submit" className="btn btn-sm btn-primary flex-1">Create</button>
            </div>
          </form>
        ) : (
          <button type="button" role="menuitem" onClick={() => setCreating(true)} className={`${itemClass} text-primary dark:text-primary`}>
            <Plus className="w-4 h-4" />
            New workspace
          </button>
        )}

        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
        {hasFeature(currentUser, "PAGES") && <Link to="/pages" role="menuitem" onClick={onClose} className={`${itemClass} lg:hidden`}>Pages</Link>}
        <Link to="/team" role="menuitem" onClick={onClose} className={itemClass}>Team</Link>
        <Link to="/settings" role="menuitem" onClick={onClose} className={itemClass}>Settings</Link>
        <Link to="/settings/profile" role="menuitem" onClick={onClose} className={itemClass}>Profile</Link>
        {isSystemOwner && (
          <Link to="/owner" role="menuitem" onClick={onClose} className={itemClass}>Owner console</Link>
        )}
        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
        <button type="button" role="menuitem" onClick={() => { onClose(); logout(); }} className={`${itemClass} text-rose-600 dark:text-rose-400`}>
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );
}
