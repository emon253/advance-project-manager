/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../../app/providers";
import { Wordmark } from "./Logo";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { AccountMenu } from "./AccountMenu";

/**
 * 48px top bar: brand · global search · New task · inbox · account menu.
 * Workspace switching, settings, profile, theme and sign-out all live in the
 * account menu so the sidebar starts at Today.
 */
export function TopBar({ onOpenQuickAdd }) {
  const { currentUser, notifications, can } = useAppState();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // "/" focuses the global search from anywhere
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pt-[env(safe-area-inset-top)] border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="h-12 flex items-center gap-3 px-4">
        {/* Brand — matches the 220px sidebar column on desktop */}
        <Link to="/today" className="flex items-center min-w-0 rounded-md lg:w-[204px] shrink-0">
          <Wordmark className="text-base" />
        </Link>

        {/* Global search (desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-[480px] relative" role="search">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search tasks, projects, people"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full h-8 text-[13px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:bg-white dark:focus:bg-zinc-950 focus:border-primary text-zinc-800 dark:text-zinc-100 rounded-md pl-8 pr-8 outline-none transition-colors placeholder:text-zinc-400 font-medium"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center h-[18px] px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] font-bold text-zinc-400 pointer-events-none">
            /
          </kbd>
        </form>

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

          <Link
            to="/inbox"
            className="btn-icon relative ml-1"
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
