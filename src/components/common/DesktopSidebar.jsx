/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../../app/providers";
import {
  Layers,
  CheckSquare,
  Inbox,
  Users,
  Settings,
  User,
  Plus,
  ChevronsUpDown,
  X,
  Folder,
  LogOut,
  Check,
  CreditCard
} from "lucide-react";
import { getPlan, isTrialActive, trialDaysLeft } from "../../modules/Billing/util/billingUtils";
import { UserAvatar } from "./UserAvatar";
import { getIconComponent, ICON_OPTIONS } from "./IconHelper";

export function DesktopSidebar({ onOpenQuickAdd, onOpenAISuggest, onClose = () => {}, isMobileDrawer = false }) {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    currentUser,
    notifications,
    logout,
    addWorkspace,
    activeSubscription,
    activePlanId,
    can,
    currentRole
  } = useAppState();

  const location = useLocation();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [createNewOpen, setCreateNewOpen] = useState(false);
  const [newWSName, setNewWSName] = useState("");
  const [newWSLogo, setNewWSLogo] = useState("💼");
  const [inlineError, setInlineError] = useState("");

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const mainNavItems = [
    { label: "Dashboard", icon: Layers, path: "/dashboard" },
    { label: "Projects", icon: Folder, path: "/projects" },
    { label: "My Tasks", icon: CheckSquare, path: "/my-tasks" },
    { label: "Inbox", icon: Inbox, path: "/inbox", badge: unreadNotifications > 0 ? unreadNotifications : null },
    { label: "Team Workloads", icon: Users, path: "/team" },
  ];

  const secondaryNavItems = [
    ...(can("manageBilling") ? [{ label: "Plans & Billing", icon: CreditCard, path: "/billing" }] : []),
    { label: "Settings", icon: Settings, path: "/settings" },
    { label: "My Profile", icon: User, path: "/profile" },
  ];

  const trialing = isTrialActive(activeSubscription);
  const planLabel = trialing
    ? `${getPlan(activeSubscription.plan).name} trial · ${trialDaysLeft(activeSubscription)}d left`
    : `${getPlan(activePlanId).name} plan`;

  const isItemActive = (item) =>
    location.pathname === item.path ||
    (item.path === "/my-tasks" && ["/tasks", "/today", "/upcoming", "/completed"].some(p => location.pathname.startsWith(p))) ||
    (item.path === "/projects" && location.pathname.startsWith("/projects/"));

  const renderNavItem = (item) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center justify-between px-3 h-10 rounded-lg text-sm transition-colors group ${
          isActive
            ? "bg-primary/8 text-primary font-semibold dark:bg-primary/15"
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white font-medium"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"} transition-colors`} />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge && (
          <span className="shrink-0 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white font-tnum">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={`${isMobileDrawer ? "w-full h-full flex flex-col" : "w-64 h-[calc(100vh-3.5rem-env(safe-area-inset-top))] sticky top-[calc(3.5rem+env(safe-area-inset-top))]"} border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0`}>
      {/* Workspace switcher */}
      <div className="relative p-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
        <button
          onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
          aria-expanded={showWorkspaceDropdown}
          aria-haspopup="listbox"
          className="flex-1 flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left min-w-0 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 dark:bg-primary/15 text-primary">
              {getIconComponent(activeWorkspace?.logo, "w-4 h-4")}
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm text-zinc-900 dark:text-white truncate leading-tight">{activeWorkspace?.name}</h2>
              <p className={`text-[11px] truncate ${trialing ? "text-primary font-semibold" : "text-zinc-500"}`}>{planLabel}</p>
            </div>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-zinc-400 shrink-0" />
        </button>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close menu"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}

        {showWorkspaceDropdown && (
          <>
            {/* Click-away layer */}
            <div className="fixed inset-0 z-40" onClick={() => { setShowWorkspaceDropdown(false); setCreateNewOpen(false); }} />

            <div className="menu-panel absolute top-full left-3 right-3 z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1.5 max-h-[75vh] overflow-y-auto no-scrollbar" id="sidebar-ws-dropdown" role="listbox">
              <p className="px-2 pt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Workspaces</p>

              <div className="space-y-0.5 max-h-52 overflow-y-auto no-scrollbar">
                {workspaces.filter(ws => !ws.isArchived).map((ws) => {
                  const isCurrent = ws.id === activeWorkspaceId;
                  return (
                    <button
                      key={ws.id}
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setShowWorkspaceDropdown(false);
                        setCreateNewOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2 h-9 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-primary/8 text-primary dark:bg-primary/15 font-semibold"
                          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`flex h-5 w-5 items-center justify-center shrink-0 ${isCurrent ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`}>
                          {getIconComponent(ws.logo, "w-4 h-4")}
                        </span>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>

              {/* Inline create */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                {!createNewOpen ? (
                  <button
                    onClick={() => { setCreateNewOpen(true); setInlineError(""); }}
                    className="w-full flex items-center gap-2 px-2 h-9 text-sm font-semibold text-primary hover:bg-primary/8 dark:hover:bg-primary/15 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create workspace</span>
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newWSName.trim()) {
                        setInlineError("Workspace name is required.");
                        return;
                      }
                      addWorkspace(newWSName.trim(), newWSLogo);
                      setNewWSName("");
                      setNewWSLogo("💼");
                      setCreateNewOpen(false);
                      setShowWorkspaceDropdown(false);
                    }}
                    className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-2 animate-in fade-in duration-150"
                  >
                    <input
                      type="text"
                      placeholder="Workspace name…"
                      required
                      autoFocus
                      value={newWSName}
                      onChange={(ev) => setNewWSName(ev.target.value)}
                      className="field text-sm"
                    />
                    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Workspace icon">
                      {ICON_OPTIONS.slice(0, 8).map(({ key, Icon, label }) => (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={newWSLogo === key}
                          aria-label={label}
                          title={label}
                          onClick={() => setNewWSLogo(key)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                            newWSLogo === key
                              ? "bg-primary/8 dark:bg-primary/15 border-primary/40 text-primary"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    {inlineError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{inlineError}</p>}
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setCreateNewOpen(false)} className="btn btn-sm btn-ghost flex-1">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-sm btn-primary flex-1">
                        Create
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Shortcuts */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1.5 grid grid-cols-2 gap-1.5">
                <Link
                  to="/workspaces"
                  onClick={() => { setShowWorkspaceDropdown(false); onClose(); }}
                  className="btn btn-sm btn-secondary"
                >
                  Manage
                </Link>
                <Link
                  to="/workspace-settings"
                  onClick={() => { setShowWorkspaceDropdown(false); onClose(); }}
                  className="btn btn-sm btn-secondary text-primary dark:text-primary"
                >
                  Settings
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 no-scrollbar" aria-label="Primary">
        {mainNavItems.map(renderNavItem)}

        <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-zinc-900">
          <p className="px-3 pb-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Preferences
          </p>
          <div className="space-y-0.5">
            {secondaryNavItems.map(renderNavItem)}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className={`p-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2 shrink-0 ${isMobileDrawer ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]" : ""}`}>
        <Link to="/profile" onClick={onClose} className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 -m-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors">
          <UserAvatar user={currentUser} size="sm" />
          <div className="min-w-0 text-left">
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate leading-tight">{currentUser.name}</h4>
            <p className="text-[11px] text-zinc-500 truncate">{currentRole || "Member"}</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="btn-icon hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
