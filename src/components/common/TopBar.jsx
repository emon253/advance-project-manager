/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { Wordmark } from "./Logo";
import { Search, Bell, Plus, ChevronDown, Sun, Moon } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { AccountMenu } from "./AccountMenu";
import { GlobalSearch } from "./GlobalSearch";

/**
 * 48px top bar: brand · global search (with suggestions) · New task · theme · inbox · account menu.
 * Workspace switching, settings, profile, theme and sign-out all live in the
 * account menu so the sidebar starts at Today.
 */
export function TopBar({ onOpenQuickAdd }) {
  const { currentUser, notifications, can, theme, setTheme } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-[env(safe-area-inset-top)] border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="h-12 flex items-center gap-3 px-3 lg:px-4">
        {/* Brand — matches the 220px sidebar column on desktop */}
        <Link to="/today" className="flex items-center min-w-0 rounded-md lg:w-[204px] shrink-0">
          <Wordmark className="text-base" />
        </Link>

        <GlobalSearch />

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1 relative">
          <Link to="/search" className="btn-icon md:hidden" aria-label="Search">
            <Search className="w-[18px] h-[18px]" />
          </Link>

          {can("editTasks") && (
            <button type="button" onClick={onOpenQuickAdd} className="btn btn-primary h-[30px] hidden md:inline-flex">
              <Plus className="w-4 h-4" />
              New task
            </button>
          )}

          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="btn-icon ml-1"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <Link
            to="/inbox"
            className="btn-icon relative hidden lg:inline-flex"
            aria-label={unreadCount > 0 ? `Inbox, ${unreadCount} unread` : "Inbox"}
            title="Inbox"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account and workspace menu"
            className="ml-1 inline-flex items-center gap-1 h-8 pl-0.5 pr-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <UserAvatar user={currentUser} size="xs" />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
